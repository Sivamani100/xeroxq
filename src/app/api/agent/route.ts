import { NextRequest, NextResponse } from "next/server";
import puppeteerCore, { type Browser } from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { writeFile, readFile, mkdir, rm, readdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const maxDuration = 60;

const ALLOWED_EXTENSIONS = new Set(["docx", "doc", "xlsx", "xls", "pptx", "ppt", "csv"]);
const ALLOWED_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
  "text/csv",
  "text/plain",
  "application/octet-stream",
]);

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const limiter = rateLimit({ windowMs: 60_000, max: 10 });

function validateFileSignature(ext: string, buf: Buffer): boolean {
  if (buf.length === 0) return false;
  if (ext === "docx" || ext === "xlsx" || ext === "pptx") {
    // OOXML files are ZIP containers (`PK`)
    return buf.length >= 2 && buf[0] === 0x50 && buf[1] === 0x4b;
  }
  if (ext === "doc" || ext === "xls" || ext === "ppt") {
    // Legacy Office OLE2 binary container (`D0 CF 11 E0`)
    return (
      buf.length >= 4 &&
      buf[0] === 0xd0 &&
      buf[1] === 0xcf &&
      buf[2] === 0x11 &&
      buf[3] === 0xe0
    );
  }
  if (ext === "csv") {
    return !buf.subarray(0, Math.min(buf.length, 512)).includes(0);
  }
  return false;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { success } = limiter.check(`agent:${ip}`);
  if (!success) {
    return NextResponse.json(
      { error: "Too many conversion requests. Please wait a minute and try again." },
      { status: 429 }
    );
  }

  let browser: Browser | null = null;
  let tempDir = "";

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum allowed size is 25MB.` },
        { status: 413 }
      );
    }

    const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXTENSIONS.has(fileExt)) {
      return NextResponse.json(
        { error: `Unsupported file type ".${fileExt}".` },
        { status: 400 }
      );
    }

    if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file MIME type." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!validateFileSignature(fileExt, buffer)) {
      return NextResponse.json(
        { error: "File contents do not match the declared Office document format." },
        { status: 400 }
      );
    }

    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
    tempDir = join(tmpdir(), `xeroxq-conv-${randomUUID()}`);
    await mkdir(tempDir, { recursive: true });

    const inputPath = join(tempDir, safeFileName);
    await writeFile(inputPath, buffer);

    let executablePath: string;
    if (process.env.VERCEL || process.env.NODE_ENV === "production") {
      try {
        executablePath = await chromium.executablePath();
      } catch {
        const chromiumModule = chromium as { executablePath: (url?: string) => Promise<string> };
        executablePath = await chromiumModule.executablePath(
          "https://github.com/Sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar"
        );
      }
    } else if (process.platform === "win32") {
      executablePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
    } else if (process.platform === "darwin") {
      executablePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    } else {
      executablePath = "/usr/bin/google-chrome";
    }

    if (!executablePath) {
      throw new Error("Chromium path not found.");
    }

    browser = await puppeteerCore.launch({
      executablePath,
      headless: true,
      args: [
        ...chromium.args,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-extensions",
        "--hide-scrollbars",
        "--disable-notifications",
      ],
      defaultViewport: { width: 1280, height: 720, deviceScaleFactor: 1 },
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    );
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      const resourceType = request.resourceType();
      if (["image", "font", "media"].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });

    let toolUrl = "https://www.ilovepdf.com/word_to_pdf";
    if (fileExt === "xlsx" || fileExt === "xls" || fileExt === "csv") {
      toolUrl = "https://www.ilovepdf.com/excel_to_pdf";
    } else if (fileExt === "pptx" || fileExt === "ppt") {
      toolUrl = "https://www.ilovepdf.com/powerpoint_to_pdf";
    }

    await page.goto(toolUrl, { waitUntil: "domcontentloaded", timeout: 45000 });

    try {
      await page.waitForSelector("input[type='file']", { timeout: 20000 });
      const input = await page.$("input[type='file']");
      if (!input) throw new Error("Upload input not found");
      await input.uploadFile(inputPath);
    } catch {
      const [fileChooser] = await Promise.all([
        page.waitForFileChooser({ timeout: 15000 }),
        page.click("a#pickfiles"),
      ]);
      await fileChooser.accept([inputPath]);
    }

    await page.waitForSelector("#processTask", { visible: true, timeout: 30000 });
    await new Promise((r) => setTimeout(r, 1200));

    const client = await page.target().createCDPSession();
    await client.send("Browser.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: tempDir,
    });

    await page.click("#processTask");
    await page.waitForSelector("a#pickfiles", { visible: true, timeout: 120000 });
    await page.click("a#pickfiles");

    let pdfPath = "";
    const startTime = Date.now();
    const pollingTimeout = 45000;

    while (Date.now() - startTime < pollingTimeout) {
      const dirFiles = await readdir(tempDir);
      const pdfFile = dirFiles.find((f) => f.endsWith(".pdf") && !f.endsWith(".crdownload"));
      if (pdfFile) {
        pdfPath = join(tempDir, pdfFile);
        break;
      }
      await new Promise((r) => setTimeout(r, 1000));
    }

    if (!pdfPath) {
      throw new Error("Conversion timed out. Please try again or upload a PDF directly.");
    }

    const pdfBuffer = await readFile(pdfPath);
    const safeOutputName = safeFileName.replace(/\.[^/.]+$/, "") + ".pdf";

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeOutputName}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    });
  } catch (error) {
    const e = error as Error;
    console.error("[Agent Error]", e?.message || error);
    return NextResponse.json(
      { error: e.message || "Document conversion failed. Please try again." },
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
