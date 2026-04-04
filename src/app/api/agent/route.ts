import { NextRequest, NextResponse } from "next/server";
import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { writeFile, readFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

export const maxDuration = 60; // Vercel Hobby = 60s max. Upgrade to Pro for 300s.

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExt = file.name.split(".").pop()?.toLowerCase();

    // Create temp directory for conversion
    const tempDir = join(tmpdir(), `xeroxq-conv-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });

    const inputPath = join(tempDir, file.name);
    await writeFile(inputPath, buffer);

    // --- Serverless-safe Chromium launch ---
    // On production (Vercel): Uses @sparticuz/chromium dedicated binary
    // On localhost: Detects local Chrome/Edge install or specific bin path
    let executablePath: string;
    
    if (process.env.VERCEL || process.env.NODE_ENV === "production") {
      // In production (Vercel), we MUST use the @sparticuz/chromium binary
      executablePath = await chromium.executablePath();
    } else {
      // Local dev fallback
      // On Windows/Mac/Linux, we try to find a local browser.
      // If chromium.executablePath() fails locally, we provide common local paths.
      try {
        executablePath = await chromium.executablePath();
      } catch (e) {
        // Fallback for Windows local dev (most common for this user)
        executablePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
      }
    }

    if (!executablePath) {
      throw new Error("Critical Protocol Breach: Chromium signal path (executablePath) not found.");
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
      ],
    });

    const page = await browser.newPage();

    // LIGHTWEIGHT AGENT (Optimized for reliability)
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

    // Determine iLovePDF tool URL
    let toolUrl = "https://www.ilovepdf.com/word_to_pdf";
    if (fileExt === "xlsx") {
      toolUrl = "https://www.ilovepdf.com/excel_to_pdf";
    }

    console.log(`[Agent] Navigating to ${toolUrl}`);
    await page.goto(toolUrl, { waitUntil: "domcontentloaded", timeout: 45000 });

    // 1. Upload file
    console.log("[Agent] Syncing Agent with Payload...");
    try {
      await page.waitForSelector("input[type='file']", { timeout: 20000 });
      const input = await page.$("input[type='file']");
      if (!input) throw new Error("Signal Interface (Upload) not found");
      await input.uploadFile(inputPath);
    } catch (e) {
      console.error("[Agent] Upload selector mismatch, trying fallback...");
      const [fileChooser] = await Promise.all([
        page.waitForFileChooser({ timeout: 15000 }),
        page.click("a#pickfiles"),
      ]);
      await fileChooser.accept([inputPath]);
    }

    // 2. Click Convert
    console.log("[Agent] Signal Intercepted. Finalizing Protocol...");
    await page.waitForSelector("#processTask", { visible: true, timeout: 30000 });

    // Allow Plupload handlers to bind
    await new Promise((r) => setTimeout(r, 1200));

    // Set download path before clicking convert
    const client = await page.target().createCDPSession();
    await client.send("Browser.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: tempDir,
    });

    await page.click("#processTask");

    // 3. Wait for completion and download
    console.log("[Agent] Converting via iLovePDF...");
    await page.waitForSelector("a#pickfiles", { visible: true, timeout: 120000 });

    console.log("[Agent] Conversion Ready. Fetching Payload...");
    await page.click("a#pickfiles");

    // Poll for the downloaded PDF file
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
        console.log(`[Agent] Payload Extracted: ${pdfFile}`);
        break;
      }
      await new Promise((r) => setTimeout(r, 1000));
    }

    if (!pdfPath) {
      console.error(
        "[Agent] Download Sync Failure. TempDir contents:",
        await require("fs").promises.readdir(tempDir)
      );
      throw new Error("Conversion timed out in the Agent pipeline (Download failed)");
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

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${file.name.replace(/\.[^/.]+$/, "")}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("[Agent Error]", error);
    return NextResponse.json(
      { error: error.message || "Agent conversion failed" },
      { status: 500 }
    );
  }
}
