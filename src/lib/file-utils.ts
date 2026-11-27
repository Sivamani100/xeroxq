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
  };
}

export function revokeStagedFileUrl(sf: StagedFile): void {
  if (sf.previewUrl) {
    URL.revokeObjectURL(sf.previewUrl);
  }
}
