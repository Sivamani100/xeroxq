import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { writeFile, readFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

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

    // Launch Agent (Optimized performance)
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox", 
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote",
        "--single-process", // Help with memory on some environments
        "--disable-extensions",
      ],
    });

    const page = await browser.newPage();
    
    // LIGHTWEIGHT AGENT (Optimized for reliability)
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36");
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      const resourceType = request.resourceType();
      if (["image", "font", "media"].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // Determine tool URL
    let toolUrl = "https://www.ilovepdf.com/word_to_pdf";
    if (fileExt === "xlsx") {
      toolUrl = "https://www.ilovepdf.com/excel_to_pdf";
    }

    console.log(`[Agent] Speed-Optimized navigation to ${toolUrl}`);
    // Navigation with extended timeout for stability
    await page.goto(toolUrl, { waitUntil: "domcontentloaded", timeout: 45000 });

    // 1. Direct Upload (Most Reliable Method)
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
            page.click('a#pickfiles'),
        ]);
        await fileChooser.accept([inputPath]);
    }

    // 2. Click Convert
    console.log("[Agent] Signal Intercepted. Finalizing Protocol...");
    await page.waitForSelector("#processTask", { visible: true, timeout: 30000 });
    
    // Minor cooling to allow Plupload handlers to bind
    await new Promise(r => setTimeout(r, 1200));

    // Ensure download behavior is set BEFORE clicking convert/download
    const client = await page.target().createCDPSession();
    await client.send('Browser.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: tempDir,
    });

    await page.click("#processTask");

    // 3. Monitor for Completion / Download
    console.log("[Agent] Converting Signal (iLovePDF)...");
    
    // Extended timeout for large/complex document conversions
    await page.waitForSelector("a#pickfiles", { visible: true, timeout: 120000 });
    
    console.log("[Agent] Conversion Ready. Fetching Payload...");
    await page.click("a#pickfiles"); 
    
    // Polling for the PDF file in the temp directory
    let pdfPath = "";
    const startTime = Date.now();
    const pollingTimeout = 45000; // 45 seconds for download
    
    while (Date.now() - startTime < pollingTimeout) {
      const files = await require("fs").promises.readdir(tempDir);
      const pdfFile = files.find((f: string) => f.endsWith(".pdf") && !f.endsWith(".crdownload"));
      if (pdfFile) {
        pdfPath = join(tempDir, pdfFile);
        console.log(`[Agent] Payload Extracted: ${pdfFile}`);
        break;
      }
      await new Promise(r => setTimeout(r, 1000));
    }

    if (!pdfPath) {
       console.error("[Agent] Download Sync Failure. TempDir contents:", await require("fs").promises.readdir(tempDir));
       throw new Error("Conversion timed out in the Agent pipeline (Download failed)");
    }

    const pdfBuffer = await readFile(pdfPath);

    // Prompt Cleanup
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
    return NextResponse.json({ error: error.message || "Agent conversion failed during optimization" }, { status: 500 });
  }
}
