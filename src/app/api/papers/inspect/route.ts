import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { inspectWordDocument } from "@/lib/papers/ooxml";
import { isOpenRouterConfigured } from "@/lib/papers/openrouter";

export const maxDuration = 30;

const limiter = rateLimit({ windowMs: 60_000, max: 30 });

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { success } = limiter.check(`papers-inspect:${ip}`);
  if (!success) {
    return NextResponse.json(
      { error: "Too many uploads in a short time. Please wait a minute and try again." },
      { status: 429 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Could not read your uploaded file." }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const templateFile = formData.get("template") as File | null;

  if (!file && !templateFile) {
    return NextResponse.json({ error: "Please attach a Word document (.docx or .doc)." }, { status: 400 });
  }

  try {
    const document = file
      ? await inspectWordDocument(Buffer.from(await file.arrayBuffer()), file.name)
      : null;

    const template = templateFile
      ? await inspectWordDocument(
          Buffer.from(await templateFile.arrayBuffer()),
          templateFile.name
        )
      : null;

    return NextResponse.json({
      ok: true,
      aiConfigured: isOpenRouterConfigured(),
      document,
      template,
    });
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.message
        : "Could not open this Word file. Please make sure it is a valid .docx or .doc document.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
