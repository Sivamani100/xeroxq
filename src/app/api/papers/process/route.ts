import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import {
  applyDocumentEditPlan,
  prepareBaseContainerAndBlocks,
  type AppendSectionDef,
  type BlockUpdateOp,
  type DocumentEditPlan,
  type ExtractedBlock,
} from "@/lib/papers/ooxml";
import {
  callOpenRouterFree,
  extractJsonFromResponse,
  getOpenRouterApiKey,
  OpenRouterConfigError,
} from "@/lib/papers/openrouter";

export const maxDuration = 120;

const limiter = rateLimit({ windowMs: 60_000, max: 6 });

const CHUNK_BLOCK_SIZE = 35;
const MAX_CHUNKS_SAFETY = 8; // Process up to ~280 blocks smoothly without serverless timeouts

interface AiChunkJson {
  summary?: string;
  updates?: { id: number; text?: string; paragraphs?: string[] }[];
  removeIds?: number[];
  appendSections?: AppendSectionDef[];
}

function formatBlocksForPrompt(blocks: ExtractedBlock[]): string {
  return blocks
    .map((b) => {
      const tags: string[] = [b.kind];
      if (b.headingLevel) tags.push(`H${b.headingLevel}`);
      if (b.inFrontMatter) tags.push("front-matter");
      if (b.hasPlaceholder) tags.push("HAS-BLANK");
      if (b.partName !== "word/document.xml") tags.push(b.partName);
      return `[${b.id}] (${tags.join(", ")}) ${b.text}`;
    })
    .join("\n");
}

function sanitizeAiUpdates(
  rawUpdates: AiChunkJson["updates"],
  allowedIds: Set<number>
): BlockUpdateOp[] {
  if (!Array.isArray(rawUpdates)) return [];
  const cleaned: BlockUpdateOp[] = [];
  for (const item of rawUpdates) {
    if (!item || typeof item.id !== "number" || !allowedIds.has(item.id)) continue;
    if (Array.isArray(item.paragraphs) && item.paragraphs.length > 0) {
      const paras = item.paragraphs
        .filter((p): p is string => typeof p === "string" && p.trim().length > 0)
        .map((p) => p.trim());
      if (paras.length > 0) cleaned.push({ id: item.id, paragraphs: paras });
    } else if (typeof item.text === "string" && item.text.trim()) {
      cleaned.push({ id: item.id, text: item.text.trim() });
    }
  }
  return cleaned;
}

function sanitizeAppendSections(raw: AiChunkJson["appendSections"]): AppendSectionDef[] {
  if (!Array.isArray(raw)) return [];
  const out: AppendSectionDef[] = [];
  for (const sec of raw) {
    if (!sec || typeof sec.heading !== "string" || !sec.heading.trim()) continue;
    const blocks = Array.isArray(sec.blocks)
      ? sec.blocks.filter(
          (b) =>
            b &&
            ((typeof b.text === "string" && b.text.trim().length > 0) ||
              (b.type === "table" && Array.isArray(b.rows) && b.rows.length > 0))
        )
      : [];
    if (blocks.length > 0 || sec.heading.trim()) {
      out.push({
        heading: sec.heading.trim(),
        level: sec.level === 2 || sec.level === 3 ? sec.level : 1,
        pageBreakBefore: Boolean(sec.pageBreakBefore),
        blocks,
      });
    }
  }
  return out;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { success } = limiter.check(`papers-process:${ip}`);
  if (!success) {
    return NextResponse.json(
      { error: "Too many build requests right now. Please wait a minute and try again." },
      { status: 429 }
    );
  }

  try {
    getOpenRouterApiKey();
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "AI service is not configured yet.",
        code: "AI_NOT_CONFIGURED",
      },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Could not read your uploaded files." }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const templateFile = formData.get("template") as File | null;
  const instructions = (formData.get("instructions") as string | null)?.trim() ?? "";

  if (!file) {
    return NextResponse.json({ error: "Please upload your Word document first." }, { status: 400 });
  }
  if (!instructions) {
    return NextResponse.json(
      { error: "Please tell us what you want improved or created in the chat." },
      { status: 400 }
    );
  }

  try {
    const mainBuffer = Buffer.from(await file.arrayBuffer());
    const templateBuffer = templateFile
      ? Buffer.from(await templateFile.arrayBuffer())
      : null;

    const base = await prepareBaseContainerAndBlocks({
      mainBuffer,
      mainName: file.name,
      templateBuffer,
      templateName: templateFile?.name ?? null,
    });

    const targetBlocks = base.editableBlocks;
    if (targetBlocks.length === 0) {
      return NextResponse.json(
        { error: "We couldn't find any readable text inside this document." },
        { status: 400 }
      );
    }

    const usingTemplateDocx = base.mode === "template-docx";
    const sourceContentText = base.sourceTextBlocks
      .slice(0, 120)
      .map((b) => `- ${b.text}`)
      .join("\n")
      .slice(0, 14000);

    const legacyTemplateGuide =
      !usingTemplateDocx && base.templateInspection
        ? `\nProfessor's official template outline ("${base.templateInspection.fileName}"):\nHeadings: ${base.templateInspection.headings.map((h) => h.text).join(" | ")}\nPreview:\n${base.templateInspection.previewText.slice(0, 2500)}`
        : "";

    // Split target editable blocks into clean chunks so long reports are never truncated
    const chunks: ExtractedBlock[][] = [];
    for (
      let i = 0;
      i < targetBlocks.length && chunks.length < MAX_CHUNKS_SAFETY;
      i += CHUNK_BLOCK_SIZE
    ) {
      chunks.push(targetBlocks.slice(i, i + CHUNK_BLOCK_SIZE));
    }

    const allUpdates: BlockUpdateOp[] = [];
    const allRemoveIds = new Set<number>();
    const allAppendSections: AppendSectionDef[] = [];
    const summaries: string[] = [];
    let lastModelUsed = "openrouter/free";

    const docOutlineSummary =
      targetBlocks
        .filter((b) => b.kind === "heading" || b.hasPlaceholder)
        .slice(0, 30)
        .map((b) => `[${b.id}] ${b.text}`)
        .join("\n") || "(Standard body paragraphs)";

    for (let cIdx = 0; cIdx < chunks.length; cIdx++) {
      const chunk = chunks[cIdx];
      const allowedIds = new Set(chunk.map((b) => b.id));
      const isFirstChunk = cIdx === 0;
      const isLastChunk = cIdx === chunks.length - 1;

      const systemPrompt = `You are XeroxQ Papers AI, an expert academic and professional Word document editor and writer.

Mode: ${
        usingTemplateDocx
          ? `TEMPLATE POPULATION MODE — We are building inside the Professor's Official Word Template. TARGET BLOCKS belong to the template (including cover page boxes, placeholders, chapter slots, headers/footers). Your job is to fill placeholders, replace template instruction hints/dummy text, and populate complete high-quality chapters using the Student's Source Content + Chat Instructions.`
          : `DOCUMENT UPGRADE & CREATION MODE — We are improving and completing the Student's uploaded Word document in-place while preserving their existing styling and structure.`
      }

Rules for JSON output:
1. Return ONLY a valid JSON object matching this schema:
{
  "summary": "Brief plain-English note of what you improved or wrote in this step (no technical jargon)",
  "updates": [
    { "id": 12, "text": "Replacement text for block 12" },
    { "id": 15, "paragraphs": ["Expanded paragraph 1...", "Expanded paragraph 2..."] }
  ],
  "removeIds": [18],
  "appendSections": [
    {
      "heading": "Chapter / Section Title",
      "level": 1,
      "pageBreakBefore": false,
      "blocks": [
        { "type": "paragraph", "text": "Well-written academic prose..." },
        { "type": "subheading", "text": "2.1 Subheading" },
        { "type": "bullet", "text": "**Key point:** Detailed explanation" },
        { "type": "table", "headers": ["Column A", "Column B"], "rows": [["Value 1", "Value 2"]] }
      ]
    }
  ]
}
2. You may use **bold** inside paragraph or bullet text where appropriate (it renders as real bold formatting in Word). NEVER output markdown # symbols inside "heading" or "text".
3. In "updates", ONLY reference numeric IDs listed in THIS batch's TARGET BLOCKS. Use "paragraphs": [...] whenever a short draft note or template slot should expand into multiple crisp paragraphs!
4. NEVER modify or replace meaningful author/institution names or titles unless asked or filling blanks like [Name], <Title>, ____.
5. ${
        isLastChunk
          ? `Because this is the final part of the document, use "appendSections" to write any full missing chapters or sections requested by the user or professor's template (e.g., Abstract, Introduction, Methodology, Implementation, Results, Conclusion, References, or structured tables) that weren't already covered.`
          : `Keep "appendSections": [] empty for this middle batch — focus on improving/populating the listed TARGET BLOCKS cleanly; new trailing chapters will be appended on the final batch.`
      }
6. Do NOT include dummy template hints like "[Write 150 words here]" or "Lorem ipsum" in the final text — either overwrite them with real content or remove them via "removeIds".`;

      const userPromptParts = [
        `User's Chat Requests & Details:\n${instructions}`,
        usingTemplateDocx
          ? `Student's Uploaded Project Material ("${file.name}"):\n${sourceContentText}`
          : "",
        legacyTemplateGuide,
        !isFirstChunk
          ? `Overall Document Structure Reference:\n${docOutlineSummary}`
          : "",
        `TARGET BLOCKS (Batch ${cIdx + 1} of ${chunks.length} — edit using these exact numeric IDs):\n${formatBlocksForPrompt(chunk)}`,
      ].filter(Boolean);

      const result = await callOpenRouterFree({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPromptParts.join("\n\n---\n\n") },
        ],
        temperature: 0.35,
        maxTokens: 6000,
        jsonMode: true,
        timeoutMs: 85_000,
      });

      lastModelUsed = result.modelUsed;
      const parsed = extractJsonFromResponse<AiChunkJson>(result.content);

      allUpdates.push(...sanitizeAiUpdates(parsed.updates, allowedIds));
      if (Array.isArray(parsed.removeIds)) {
        for (const id of parsed.removeIds) {
          if (typeof id === "number" && allowedIds.has(id)) {
            allRemoveIds.add(id);
          }
        }
      }
      if (isLastChunk) {
        allAppendSections.push(...sanitizeAppendSections(parsed.appendSections));
      }
      if (typeof parsed.summary === "string" && parsed.summary.trim()) {
        summaries.push(parsed.summary.trim());
      }
    }

    const editPlan: DocumentEditPlan = {
      summary:
        summaries.slice(-1)[0] ||
        "Improved writing clarity, formatting, and completeness based on your instructions.",
      updates: allUpdates,
      removeIds: Array.from(allRemoveIds),
      appendSections: allAppendSections,
    };

    const safeBaseName =
      file.name
        .replace(/\.(docx|doc)$/i, "")
        .replace(/[^a-zA-Z0-9._\- ]/g, "_")
        .trim()
        .slice(0, 75) || "Document";
    const outputFileName = `${safeBaseName}_Ready.docx`;

    const built = await applyDocumentEditPlan({
      base,
      plan: editPlan,
      fallbackTitle: safeBaseName.replace(/[_-]+/g, " "),
    });

    // Base64-encode UTF-8 metadata header to guarantee ASCII HTTP header safety
    const metaPayload = {
      filename: outputFileName,
      summary: editPlan.summary,
      sections: built.sections,
      originalWordCount: built.originalWordCount,
      newWordCount: built.newWordCount,
      modelUsed: lastModelUsed,
    };
    const encodedMeta = Buffer.from(JSON.stringify(metaPayload), "utf8").toString(
      "base64"
    );

    return new NextResponse(new Uint8Array(built.buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${outputFileName}"`,
        "X-Filename": outputFileName,
        "X-Papers-Meta": encodedMeta,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err) {
    if (err instanceof OpenRouterConfigError) {
      return NextResponse.json(
        { error: err.message, code: "AI_NOT_CONFIGURED" },
        { status: 503 }
      );
    }
    const msg =
      err instanceof Error
        ? err.message
        : "Something went wrong while building your document. Please try again.";
    console.error("[Papers Process Error]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
