import { CONFIG } from "@/lib/config";

export const ALLOWED_EXTENSIONS = new Set([
  "pdf", "docx", "doc", "xlsx", "xls", "pptx", "ppt", "csv",
  "jpg", "jpeg", "png", "webp",
]);

export const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);
export const OFFICE_EXTENSIONS = new Set(["docx", "doc", "xlsx", "xls", "pptx", "ppt", "csv"]);

export const MAX_FILE_SIZE_MB = 25;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export interface StagedFile {
  id: string;
  file: File;
  pageCount: number;
  pageCountStatus: "detecting" | "ready" | "error";
  previewUrl?: string;
  /** Uncropped original File preserved so the user can always re-adjust margins or restore full photo */
  originalFile?: File;
  autoCropped?: boolean;
  presetHint?: "id_card" | "a4" | "free";
  /** True when chromatic pixels are detected in images or rendered PDF pages; false when purely monochrome/text */
  detectedColor?: boolean;
}

// ─── Extension helpers ────────────────────────────────────────────────────────

export function getFileExtension(file: File): string {
  const parts = file.name.split(".");
  if (parts.length < 2) return "";
  return parts[parts.length - 1].toLowerCase();
}

export function isImageFile(file: File): boolean {
  return IMAGE_EXTENSIONS.has(getFileExtension(file));
}

export function isOfficeFile(file: File): boolean {
  return OFFICE_EXTENSIONS.has(getFileExtension(file));
}

export function isPdfFile(file: File): boolean {
  return getFileExtension(file) === "pdf";
}

// ─── Validation ───────────────────────────────────────────────────────────────

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `"${file.name}" is too big (${formatFileSize(file.size)}). Please choose a file smaller than ${MAX_FILE_SIZE_MB} MB.`,
    };
  }
  const ext = getFileExtension(file);
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: `"${file.name}" can't be printed here. Please pick a PDF, Word, PowerPoint, Excel, or photo file.`,
    };
  }
  return { valid: true };
}

// ─── Page count detection ─────────────────────────────────────────────────────

/**
 * Detects the page count for a File or Blob.
 *
 * Strategy:
 *  - Images   → 1
 *  - PDF      → slice head 128 KB + tail 128 KB, search `/Count N`, fallback count `/Type /Page`, fallback 1
 *  - DOCX     → slice 32 KB, count `<w:lastRenderedPageBreak/>` + 1, fallback 1
 *  - Anything else → 1
 */
export async function detectPageCount(file: File | Blob): Promise<number> {
  // Determine extension from File name when available
  const name = file instanceof File ? file.name : "";
  const ext = name.includes(".")
    ? name.split(".").pop()!.toLowerCase()
    : "";

  // ── Images ──────────────────────────────────────────────────────────────────
  if (IMAGE_EXTENSIONS.has(ext)) {
    return 1;
  }

  // ── PDF ─────────────────────────────────────────────────────────────────────
  if (ext === "pdf" || file.type === "application/pdf") {
    try {
      const CHUNK = 128 * 1024; // 128 KB
      let pdfText = "";

      if (file.size <= CHUNK * 2) {
        pdfText = await readBlobAsText(file);
      } else {
        const head = file.slice(0, CHUNK);
        const tail = file.slice(Math.max(0, file.size - CHUNK));
        const [headText, tailText] = await Promise.all([
          readBlobAsText(head),
          readBlobAsText(tail),
        ]);
        pdfText = headText + tailText;
      }

      // Primary: /Count N (highest N wins as it's usually the root page tree)
      const countMatches = [...pdfText.matchAll(/\/Count\s+(\d+)/g)];
      if (countMatches.length > 0) {
        const counts = countMatches.map((m) => parseInt(m[1], 10));
        const max = Math.max(...counts);
        if (max > 0) return max;
      }

      // Secondary: count /Type /Page entries (each is one page)
      const pageMatches = pdfText.match(/\/Type\s*\/Page[^s]/g);
      if (pageMatches && pageMatches.length > 0) return pageMatches.length;

      return 1;
    } catch {
      return 1;
    }
  }

  // ── DOCX ─────────────────────────────────────────────────────────────────────
  if (
    ext === "docx" ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    try {
      const CHUNK = 32 * 1024; // 32 KB
      const slice = file.slice(0, CHUNK);
      const text = await readBlobAsText(slice);
      const breaks = (text.match(/<w:lastRenderedPageBreak\/>/g) ?? []).length;
      return breaks + 1;
    } catch {
      return 1;
    }
  }

  return 1;
}

/** Reads a Blob as a latin-1 string (preserves byte values for binary scanning). */
async function readBlobAsText(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  return new TextDecoder("latin1").decode(buf);
}

// ─── Formatting ───────────────────────────────────────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${bytes} B`;
}

// ─── Cost calculation ─────────────────────────────────────────────────────────

/**
 * Calculates the print cost using shop rates or CONFIG.BILLING defaults.
 */
export function calculateCost(
  pages: number,
  copies: number,
  color: boolean,
  doubleSided: boolean,
  priceMonoPerPage: number = CONFIG.BILLING.DEFAULT_MONO_PRICE,
  priceColorPerPage: number = CONFIG.BILLING.DEFAULT_COLOR_PRICE
): number {
  const effectivePages = doubleSided
    ? Math.ceil(pages / 2) * copies
    : pages * copies;
  return effectivePages * (color ? priceColorPerPage : priceMonoPerPage);
}

// ─── StagedFile factory ───────────────────────────────────────────────────────

function generateId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // fall through
  }
  return (
    Math.random().toString(36).slice(2, 10) +
    "-" +
    Math.random().toString(36).slice(2, 10) +
    "-" +
    Date.now().toString(36)
  );
}

export function createStagedFile(file: File): StagedFile {
  const ext = getFileExtension(file);
  const isImage = IMAGE_EXTENSIONS.has(ext);

  return {
    id: generateId(),
    file,
    pageCount: 1,
    pageCountStatus: "detecting",
    previewUrl: isImage ? URL.createObjectURL(file) : undefined,
    originalFile: isImage ? file : undefined,
  };
}

export function revokeStagedFileUrl(sf: StagedFile): void {
  if (sf.previewUrl) {
    URL.revokeObjectURL(sf.previewUrl);
  }
}

// ─── B&W vs Color Document Detection ──────────────────────────────────────────

const PLAIN_TEXT_EXTENSIONS = new Set(["txt", "csv", "md"]);

function analyzeCanvasColorMode(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): "bw" | "color" {
  const { data } = ctx.getImageData(0, 0, width, height);
  let opaquePixels = 0;
  let coloredPixels = 0;

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 24) continue;
    opaquePixels++;

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = r > g ? (r > b ? r : b) : g > b ? g : b;
    const min = r < g ? (r < b ? r : b) : g < b ? g : b;
    const spread = max - min;

    if (spread < 26) continue;
    const sat = spread / Math.max(1, max);
    if ((spread >= 28 && sat >= 0.22) || spread >= 48) {
      coloredPixels++;
    }
  }

  if (opaquePixels === 0) return "bw";
  const minThreshold = Math.min(24, Math.max(8, Math.floor(opaquePixels * 0.002)));
  return coloredPixels >= minThreshold ? "color" : "bw";
}

function drawOnWhiteCanvas(
  source: CanvasImageSource,
  srcWidth: number,
  srcHeight: number,
  maxDim: number = 220
): "bw" | "color" {
  const scale = Math.min(1, maxDim / Math.max(1, srcWidth, srcHeight));
  const w = Math.max(1, Math.round(srcWidth * scale));
  const h = Math.max(1, Math.round(srcHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return "bw";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(source, 0, 0, w, h);
  return analyzeCanvasColorMode(ctx, w, h);
}

async function detectImageColorMode(blob: Blob): Promise<"bw" | "color"> {
  if (typeof window === "undefined") return "bw";
  try {
    if (typeof createImageBitmap === "function") {
      const bitmap = await createImageBitmap(blob);
      try {
        return drawOnWhiteCanvas(bitmap, bitmap.width, bitmap.height);
      } finally {
        bitmap.close();
      }
    }
  } catch {
    // Fallback to HTMLImageElement
  }

  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      try {
        resolve(drawOnWhiteCanvas(img, img.naturalWidth || 1, img.naturalHeight || 1));
      } catch {
        resolve("bw");
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve("bw");
    };
    img.src = url;
  });
}

async function detectPdfColorMode(blob: Blob): Promise<"bw" | "color" | null> {
  if (typeof window === "undefined") return null;
  let pdfDoc: { numPages: number; getPage: (n: number) => Promise<any>; destroy: () => Promise<void> } | null = null;
  try {
    const pdfjs = await import("pdfjs-dist");
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString();
    }

    const buffer = await blob.arrayBuffer();
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(buffer),
      disableAutoFetch: true,
      disableStream: true,
    });
    pdfDoc = await loadingTask.promise;

    const pagesToCheck = Math.min(pdfDoc.numPages, 5);
    for (let pageNum = 1; pageNum <= pagesToCheck; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const viewport0 = page.getViewport({ scale: 1 });
      const scale = Math.min(1, 200 / Math.max(1, viewport0.width, viewport0.height));
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(viewport.width));
      canvas.height = Math.max(1, Math.round(viewport.height));
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) continue;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({ canvasContext: ctx, viewport, canvas }).promise;
      page.cleanup?.();

      if (analyzeCanvasColorMode(ctx, canvas.width, canvas.height) === "color") {
        return "color";
      }
    }
    return "bw";
  } catch {
    return null;
  } finally {
    if (pdfDoc) {
      await pdfDoc.destroy().catch(() => {});
    }
  }
}

/**
 * Inspects an uploaded image, PDF, or plain-text file and returns `"bw"` when
 * the content is purely black-and-white / grayscale text, or `"color"` when
 * colored text, graphics, or photos are detected.
 */
export async function detectDocumentColorMode(
  file: File | Blob
): Promise<"bw" | "color" | null> {
  const name = file instanceof File ? file.name : "";
  const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";

  if (IMAGE_EXTENSIONS.has(ext) || file.type.startsWith("image/")) {
    return detectImageColorMode(file);
  }
  if (ext === "pdf" || file.type === "application/pdf") {
    return detectPdfColorMode(file);
  }
  if (PLAIN_TEXT_EXTENSIONS.has(ext) || file.type.startsWith("text/")) {
    return "bw";
  }
  return null;
}
