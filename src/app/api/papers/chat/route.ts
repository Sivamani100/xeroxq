import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import {
  callOpenRouterFree,
  extractJsonFromResponse,
  OpenRouterConfigError,
  type OpenRouterMessage,
} from "@/lib/papers/openrouter";
import type { DocumentInspection } from "@/lib/papers/ooxml";

export const maxDuration = 60;

const limiter = rateLimit({ windowMs: 60_000, max: 25 });

interface ChatRequestMessage {
  role: "ai" | "user";
  text: string;
}

interface ChatRequestBody {
  document: DocumentInspection;
  template?: DocumentInspection | null;
  messages: ChatRequestMessage[];
  hasBuiltBefore?: boolean;
}

interface AiChatJsonResponse {
  reply: string;
  readyToBuild?: boolean;
  suggestedTitle?: string;
  planBullets?: string[];
}

/**
 * Extracts readable `"reply"` text even if a model's JSON response was cut off mid-stream,
 * preventing raw JSON syntax (`{ "reply": "...`) from ever appearing in the chat UI.
 */
function salvagePartialReply(raw: string): string {
  const cleaned = raw.replace(/^```(?:json)?\s*|\s*```$/gi, "").trim();
  const match = cleaned.match(/"reply"\s*:\s*"([\s\S]*)/);
  if (match?.[1]) {
    let extracted = match[1];
    // Cut at the next unescaped closing quote if present
    let out = "";
    for (let i = 0; i < extracted.length; i++) {
      const ch = extracted[i];
      if (ch === "\\" && i + 1 < extracted.length) {
        const next = extracted[i + 1];
        if (next === "n") out += "\n";
        else if (next === "t") out += "  ";
        else out += next;
        i++;
      } else if (ch === '"') {
        break;
      } else {
        out += ch;
      }
    }
    if (out.trim().length > 0) return out.trim();
  }
  return cleaned;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { success } = limiter.check(`papers-chat:${ip}`);
  if (!success) {
    return NextResponse.json(
      { error: "You're sending messages very quickly. Please wait a moment." },
      { status: 429 }
    );
  }

  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid chat message format." }, { status: 400 });
  }

  if (!body?.document || !Array.isArray(body?.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: "Document details and a message are required." }, { status: 400 });
  }

  const doc = body.document;
  const tpl = body.template ?? null;

  const docContext = [
    `Uploaded document: "${doc.fileName}" (${doc.wordCount} words, ~${doc.estimatedPages} pages, ${doc.tableCount} tables, ${doc.imageCount} images).`,
    doc.headings.length > 0
      ? `Sections found: ${doc.headings.map((h) => h.text).join(" | ")}`
      : "No formal section headings found yet.",
    doc.placeholders.length > 0
      ? `Fillable placeholders found: ${doc.placeholders.join(", ")}`
      : "",
    `Opening excerpt:\n${doc.previewText.slice(0, 3200)}`,
  ]
    .filter(Boolean)
    .join("\n");

  const tplContext = tpl
    ? [
        `Professor's official template attached: "${tpl.fileName}" (${tpl.wordCount} words, ${tpl.tableCount} tables).`,
        tpl.headings.length > 0
          ? `Template sections: ${tpl.headings.map((h) => h.text).join(" | ")}`
          : "",
        tpl.placeholders.length > 0
          ? `Template blanks to fill: ${tpl.placeholders.join(", ")}`
          : "",
        `Template preview:\n${tpl.previewText.slice(0, 1800)}`,
      ]
        .filter(Boolean)
        .join("\n")
    : "No professor template has been attached yet.";

  const systemPrompt = `You are Papers AI inside XeroxQ Papers, a friendly human-sounding writing & project report assistant for students and professionals.

Context about the files:
---
${docContext}
---
${tplContext}
---
${body.hasBuiltBefore ? "Note: A version of the document was already created earlier in this chat. The user is now requesting refinements or follow-up changes." : ""}

Your job in this conversation:
1. Understand clearly what the user wants to write, fix, expand, or reorganize.
2. Speak ONLY in warm, simple, everyday English. NEVER use technical words like XML, OOXML, parsing, schema, DOM, regex, ZIP, tokens, or prompts.
3. Keep "reply" concise and conversational (around 2-5 sentences or quick summary — never dump a multi-page full report inside the chat bubble, because the user downloads the full formatted Word file when they click Create Document).
4. If the user has not attached a professor's official template yet and they appear to be working on a college project/thesis/assignment, mention casually ONCE that they can click "Add Professor's Template" above if their teacher gave them an official format file (don't nag repeatedly if they already know or declined).
5. If important cover details are missing (for instance, template blanks like Name, Roll Number, Project Title, Guide Name) or their goal is vague, ask 1-2 short, clear questions.
6. Whenever you have enough direction to build or update their full Word document, give a concise summary of what you'll write/change and set "readyToBuild": true.

Respond with VALID JSON ONLY matching this exact structure:
{
  "reply": "Your friendly response to the user (short, easy to scan)",
  "readyToBuild": true or false,
  "suggestedTitle": "Optional clean title for their document",
  "planBullets": ["Short action 1", "Short action 2", "Short action 3"]
}`;

  const historyMessages: OpenRouterMessage[] = [
    { role: "system", content: systemPrompt },
    ...body.messages.slice(-14).map((m) => ({
      role: (m.role === "ai" ? "assistant" : "user") as "assistant" | "user",
      content: m.text.slice(0, 3000),
    })),
  ];

  try {
    const result = await callOpenRouterFree({
      messages: historyMessages,
      temperature: 0.45,
      maxTokens: 2000,
      jsonMode: true,
    });

    try {
      const parsed = extractJsonFromResponse<AiChatJsonResponse>(result.content);
      return NextResponse.json({
        reply:
          typeof parsed.reply === "string" && parsed.reply.trim()
            ? parsed.reply.trim()
            : result.content,
        readyToBuild: Boolean(parsed.readyToBuild ?? true),
        suggestedTitle: parsed.suggestedTitle || undefined,
        planBullets: Array.isArray(parsed.planBullets)
          ? parsed.planBullets.filter((b): b is string => typeof b === "string").slice(0, 6)
          : undefined,
        modelUsed: result.modelUsed,
      });
    } catch {
      // Salvage `"reply": "..."` cleanly if output truncated mid-JSON, else show plain text
      const salvaged = salvagePartialReply(result.content);
      return NextResponse.json({
        reply: salvaged,
        readyToBuild: true,
        modelUsed: result.modelUsed,
      });
    }
  } catch (err) {
    if (err instanceof OpenRouterConfigError) {
      return NextResponse.json({ error: err.message, code: "AI_NOT_CONFIGURED" }, { status: 503 });
    }
    const msg =
      err instanceof Error
        ? err.message
        : "I couldn't reach the AI right now. Please try sending your message again.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
