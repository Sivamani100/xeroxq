import { NextRequest, NextResponse } from "next/server";
import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { writeFile, readFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const maxDuration = 60; // Vercel Hobby = 60s max.

// Allowed file types for conversion
const ALLOWED_EXTENSIONS = new Set(["docx", "doc", "xlsx", "xls"]);
const ALLOWED_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  // Some browsers may send these for .docx
  "application/octet-stream",
]);

// 25MB limit
const MAX_FILE_SIZE = 25 * 1024 * 1024;

// Rate limiter: 10 conversions per minute per IP (Puppeteer is heavy)
const limiter = rateLimit({ windowMs: 60_000, max: 10 });

export async function POST(req: NextRequest) {
  // ── 1. Rate Limiting ──────────────────────────────────────────────────────
  const ip = getClientIp(req);
  const { success } = limiter.check(`agent:${ip}`);
  if (!success) {
    return NextResponse.json(
      { error: "Too many conversion requests. Please wait a minute and try again." },
      { status: 429 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // ── 2. File Size Validation ────────────────────────────────────────────
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum allowed size is 25MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB.` },
        { status: 413 }
      );
    }

    // ── 3. File Extension & Type Validation ────────────────────────────────
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXTENSIONS.has(fileExt)) {
      return NextResponse.json(
        { error: `Unsupported file type ".${fileExt}". Only Word and Excel files can be converted.` },
        { status: 400 }
      );
    }

    // Sanitize filename to prevent path traversal
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);

    const buffer = Buffer.from(await file.arrayBuffer());

    // Create temp directory for conversion
    const tempDir = join(tmpdir(), `xeroxq-conv-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await mkdir(tempDir, { recursive: true });

    const inputPath = join(tempDir, safeFileName);
    await writeFile(inputPath, buffer);

    // --- Serverless-safe Chromium launch ---
    let executablePath: string;
    
    if (process.env.VERCEL || process.env.NODE_ENV === "production") {
      try {
        executablePath = await chromium.executablePath();
      } catch (e) {
        const chromiumModule = chromium as { executablePath: (url?: string) => Promise<string> };
        executablePath = await chromiumModule.executablePath(
          `https://github.com/Sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar`
        );
      }
    } else {
      const platform = process.platform;
      if (platform === "win32") {
        executablePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
      } else if (platform === "darwin") {
        executablePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
      } else {
        executablePath = "/usr/bin/google-chrome";
      }
    }

    if (!executablePath) {
      throw new Error("Chromium path not found.");
    }

    const browser = await puppeteerCore.launch({
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
    if (fileExt === "xlsx" || fileExt === "xls") {
      toolUrl = "https://www.ilovepdf.com/excel_to_pdf";
    }

    await page.goto(toolUrl, { waitUntil: "domcontentloaded", timeout: 45000 });

    try {
      await page.waitForSelector("input[type='file']", { timeout: 20000 });
      const input = await page.$("input[type='file']");
      if (!input) throw new Error("Upload input not found");
      await input.uploadFile(inputPath);
    } catch (e) {
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
      const files = await require("fs").promises.readdir(tempDir);
      const pdfFile = files.find(
        (f: string) => f.endsWith(".pdf") && !f.endsWith(".crdownload")
      );
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

    await browser.close();
    try {
      await unlink(inputPath);
      await unlink(pdfPath);
      await require("fs").promises.rm(tempDir, { recursive: true, force: true });
    } catch (e) {
      console.warn("[Agent] Cleanup warning:", e);
    }

    // Sanitize output filename
    const safeOutputName = safeFileName.replace(/\.[^/.]+$/, "") + ".pdf";

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeOutputName}"`,
        // Prevent caching of potentially sensitive documents
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
      },
    });
  } catch (error) {
    const e = error as Error;
    console.error("[Agent Error]", e?.message || error);
    return NextResponse.json(
      { error: e.message || "Document conversion failed. Please try again." },
      { status: 500 }
    );
  }
}
