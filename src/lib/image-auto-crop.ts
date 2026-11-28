"use client";

import { jsPDF } from "jspdf";

export interface NormalizedCropRect {
  /** Left edge in [0, 1] */
  x: number;
  /** Top edge in [0, 1] */
  y: number;
  /** Width fraction in (0, 1] */
  width: number;
  /** Height fraction in (0, 1] */
  height: number;
}

export type ImageFilterMode = "original" | "clear_doc" | "id_boost" | "vivid";

export interface ImageTransformOptions {
  /** Crop region in normalized [0..1] coordinates of the rotated canvas */
  crop: NormalizedCropRect;
  /** Total rotation in degrees */
  rotationDeg?: number;
  flipH?: boolean;
  flipV?: boolean;
  filter?: ImageFilterMode;
  /** 100 = default */
  brightness?: number;
  /** 100 = default */
  contrast?: number;
}

export interface AutoCropAnalysis {
  rect: NormalizedCropRect;
  wasAutoCropped: boolean;
  confidence: number;
  suggestedPreset: "id_card" | "a4" | "free";
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(",");
  const header = parts[0] || "";
  const base64 = parts[1] || "";
  const mimeMatch = header.match(/data:([^;]+)/i);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const binStr = atob(base64);
  const len = binStr.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binStr.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

/**
 * Analyzes an image on a lightweight canvas to detect outer background margins
 * around a card (Aadhaar / PAN / ID), printed sheet, or document photo.
 *
 * Works by estimating background color + luminance from the image border ring,
 * scoring foreground pixels by color distance + local edge gradient energy, and
 * finding a tightly padded bounding box without clipping border text.
 */
export function detectDocumentBoundsFromImage(img: HTMLImageElement): AutoCropAnalysis {
  const natW = img.naturalWidth || img.width;
  const natH = img.naturalHeight || img.height;
  const fullRect: NormalizedCropRect = { x: 0, y: 0, width: 1, height: 1 };

  if (natW < 80 || natH < 80) {
    return { rect: fullRect, wasAutoCropped: false, confidence: 0, suggestedPreset: "free" };
  }

  const MAX_DIM = 200;
  const scale = Math.min(1, MAX_DIM / Math.max(natW, natH));
  const w = Math.max(24, Math.round(natW * scale));
  const h = Math.max(24, Math.round(natH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return { rect: fullRect, wasAutoCropped: false, confidence: 0, suggestedPreset: "free" };
  }

  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

  // Sample border strip (outer 4% ring) to estimate background color
  const borderPadX = Math.max(2, Math.floor(w * 0.04));
  const borderPadY = Math.max(2, Math.floor(h * 0.04));
  let bgR = 0;
  let bgG = 0;
  let bgB = 0;
  let bgCount = 0;

  const luma = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      luma[y * w + x] = 0.299 * r + 0.587 * g + 0.114 * b;

      if (x < borderPadX || x >= w - borderPadX || y < borderPadY || y >= h - borderPadY) {
        bgR += r;
        bgG += g;
        bgB += b;
        bgCount++;
      }
    }
  }

  if (bgCount === 0) {
    return { rect: fullRect, wasAutoCropped: false, confidence: 0, suggestedPreset: "free" };
  }
  bgR /= bgCount;
  bgG /= bgCount;
  bgB /= bgCount;

  // Measure background spread so noisy full-bleed photos aren't over-cropped
  let bgDevSum = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (x < borderPadX || x >= w - borderPadX || y < borderPadY || y >= h - borderPadY) {
        const idx = (y * w + x) * 4;
        bgDevSum +=
          Math.abs(data[idx] - bgR) +
          Math.abs(data[idx + 1] - bgG) +
          Math.abs(data[idx + 2] - bgB);
      }
    }
  }
  const avgBorderSpread = bgDevSum / (bgCount * 3);
  const colorThreshold = Math.max(22, Math.min(58, 22 + avgBorderSpread * 0.7));

  // Build foreground mask per row & column
  const rowCounts = new Int32Array(h);
  const colCounts = new Int32Array(w);

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      const idx = p * 4;
      const colorDist =
        (Math.abs(data[idx] - bgR) +
          Math.abs(data[idx + 1] - bgG) +
          Math.abs(data[idx + 2] - bgB)) /
        3;

      const gx = Math.abs(luma[p + 1] - luma[p - 1]);
      const gy = Math.abs(luma[p + w] - luma[p - w]);
      const grad = (gx + gy) * 0.5;

      // Foreground if distinct from perimeter color or part of crisp edge/text inside paper
      if (colorDist > colorThreshold || grad > 24) {
        rowCounts[y]++;
        colCounts[x]++;
      }
    }
  }

  // Smooth 1D projection counts slightly to ignore single-pixel specks
  const minColActive = Math.max(2, Math.floor(h * 0.04));
  const minRowActive = Math.max(2, Math.floor(w * 0.04));

  let minX = 0;
  let maxX = w - 1;
  let minY = 0;
  let maxY = h - 1;

  while (minX < w - 1 && colCounts[minX] < minColActive) minX++;
  while (maxX > minX + 10 && colCounts[maxX] < minColActive) maxX--;
  while (minY < h - 1 && rowCounts[minY] < minRowActive) minY++;
  while (maxY > minY + 10 && rowCounts[maxY] < minRowActive) maxY--;

  // Add subtle safety margin (~2.5%) so rounded card corners & borders stay intact
  const padX = Math.max(2, Math.round((maxX - minX) * 0.025));
  const padY = Math.max(2, Math.round((maxY - minY) * 0.025));
  minX = Math.max(0, minX - padX);
  maxX = Math.min(w - 1, maxX + padX);
  minY = Math.max(0, minY - padY);
  maxY = Math.min(h - 1, maxY + padY);

  const normX = minX / w;
  const normY = minY / h;
  const normW = Math.max(0.15, (maxX - minX + 1) / w);
  const normH = Math.max(0.15, (maxY - minY + 1) / h);
  const areaFraction = normW * normH;

  // Determine aspect hint
  const pixelW = normW * natW;
  const pixelH = normH * natH;
  const ratio = pixelW / Math.max(1, pixelH);
  let suggestedPreset: "id_card" | "a4" | "free" = "free";
  if ((ratio >= 1.38 && ratio <= 1.82) || (ratio >= 0.55 && ratio <= 0.72 && pixelW < pixelH)) {
    suggestedPreset = ratio > 1.35 ? "id_card" : "a4";
  }

  // Only treat as auto-cropped if meaningful background border (> 6% area trimmed) was removed
  // and the remaining box isn't suspiciously tiny (< 16% of image).
  const trimmedEnough = areaFraction <= 0.94 && areaFraction >= 0.16;
  const confidence = trimmedEnough ? Math.min(0.95, 0.55 + (1 - areaFraction) * 0.5) : 0.2;

  return {
    rect: trimmedEnough
      ? {
          x: Number(normX.toFixed(4)),
          y: Number(normY.toFixed(4)),
          width: Number(Math.min(1 - normX, normW).toFixed(4)),
          height: Number(Math.min(1 - normY, normH).toFixed(4)),
        }
      : fullRect,
    wasAutoCropped: trimmedEnough,
    confidence,
    suggestedPreset,
  };
}

/**
 * Renders the rotated, flipped, enhanced, and cropped image to a high-quality JPEG data URL.
 */
export async function renderTransformedImageDataUrl(
  imageSrc: string,
  options: ImageTransformOptions
): Promise<string> {
  const img = await loadImageElement(imageSrc);
  const natW = img.naturalWidth || img.width;
  const natH = img.naturalHeight || img.height;
  const rotDeg = options.rotationDeg ?? 0;
  const rad = (rotDeg * Math.PI) / 180;

  // Compute bounding box size after rotation
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const rotW = Math.max(1, Math.round(natW * cos + natH * sin));
  const rotH = Math.max(1, Math.round(natW * sin + natH * cos));

  // Cap intermediate canvas size for mobile browser stability while preserving print sharpness
  const MAX_STAGE_DIM = 2800;
  const scale = Math.min(1, MAX_STAGE_DIM / Math.max(rotW, rotH));
  const stageW = Math.max(1, Math.round(rotW * scale));
  const stageH = Math.max(1, Math.round(rotH * scale));

  const stage = document.createElement("canvas");
  stage.width = stageW;
  stage.height = stageH;
  const sCtx = stage.getContext("2d");
  if (!sCtx) throw new Error("Canvas context unavailable");

  sCtx.fillStyle = "#ffffff";
  sCtx.fillRect(0, 0, stageW, stageH);

  sCtx.save();
  sCtx.translate(stageW / 2, stageH / 2);
  sCtx.rotate(rad);
  sCtx.scale(options.flipH ? -1 : 1, options.flipV ? -1 : 1);

  const b = options.brightness ?? 100;
  const c = options.contrast ?? 100;
  const filterMode = options.filter ?? "original";

  let cssFilter = `brightness(${b}%) contrast(${c}%)`;
  if (filterMode === "clear_doc") {
    cssFilter = `grayscale(100%) brightness(${Math.round(b * 1.12)}%) contrast(${Math.round(
      c * 1.45
    )}%)`;
  } else if (filterMode === "id_boost") {
    cssFilter = `brightness(${Math.round(b * 1.06)}%) contrast(${Math.round(
      c * 1.18
    )}%) saturate(118%)`;
  } else if (filterMode === "vivid") {
    cssFilter = `brightness(${Math.round(b * 1.04)}%) contrast(${Math.round(
      c * 1.12
    )}%) saturate(130%)`;
  }

  if ("filter" in sCtx) {
    sCtx.filter = cssFilter;
  }

  sCtx.drawImage(img, (-natW * scale) / 2, (-natH * scale) / 2, natW * scale, natH * scale);
  sCtx.restore();

  // Extract normalized crop box
  const cx = Math.max(0, Math.min(1, options.crop.x));
  const cy = Math.max(0, Math.min(1, options.crop.y));
  const cw = Math.max(0.05, Math.min(1 - cx, options.crop.width));
  const ch = Math.max(0.05, Math.min(1 - cy, options.crop.height));

  const outX = Math.round(cx * stageW);
  const outY = Math.round(cy * stageH);
  const outW = Math.max(20, Math.round(cw * stageW));
  const outH = Math.max(20, Math.round(ch * stageH));

  const outCanvas = document.createElement("canvas");
  outCanvas.width = outW;
  outCanvas.height = outH;
  const oCtx = outCanvas.getContext("2d");
  if (!oCtx) throw new Error("Output canvas context unavailable");

  oCtx.fillStyle = "#ffffff";
  oCtx.fillRect(0, 0, outW, outH);
  oCtx.drawImage(stage, outX, outY, outW, outH, 0, 0, outW, outH);

  return outCanvas.toDataURL("image/jpeg", 0.93);
}

/**
 * Runs automatic document/Aadhaar border cropping on a File if clear outer
 * margins are detected. Always returns an analysis even when kept full-frame.
 */
export async function autoCropImageFile(file: File): Promise<{
  croppedFile: File;
  analysis: AutoCropAnalysis;
}> {
  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImageElement(dataUrl);
  const analysis = detectDocumentBoundsFromImage(img);

  if (!analysis.wasAutoCropped) {
    return { croppedFile: file, analysis };
  }

  const croppedUrl = await renderTransformedImageDataUrl(dataUrl, {
    crop: analysis.rect,
    rotationDeg: 0,
    filter: "original",
  });

  const blob = dataUrlToBlob(croppedUrl);
  const baseName = file.name.replace(/\.[^/.]+$/, "");
  const croppedFile = new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });

  return { croppedFile, analysis };
}

/**
 * Arranges 2 or more staged image files onto clean A4 PDF pages:
 * - `id_two_up`: places 2 ID/Aadhaar cards (front + back) neatly stacked on each A4 page
 * - `one_per_page`: places each photo centered & margin-fitted on its own A4 page
 */
export async function combineImagesToA4Pdf(
  files: File[],
  layout: "id_two_up" | "one_per_page" = "id_two_up"
): Promise<File> {
  if (files.length === 0) {
    throw new Error("No images to combine");
  }

  // A4 portrait in mm (210 x 297)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageW = 210;
  const pageH = 297;
  const margin = 16;

  if (layout === "id_two_up") {
    const slotW = pageW - margin * 2;
    const slotH = (pageH - margin * 3) / 2;

    for (let i = 0; i < files.length; i++) {
      if (i > 0 && i % 2 === 0) doc.addPage();
      const slotIdx = i % 2;
      const slotTop = margin + slotIdx * (slotH + margin);

      const dataUrl = await readFileAsDataUrl(files[i]);
      const img = await loadImageElement(dataUrl);
      const natW = img.naturalWidth || 1;
      const natH = img.naturalHeight || 1;
      const fitScale = Math.min(slotW / natW, slotH / natH);
      const drawW = natW * fitScale;
      const drawH = natH * fitScale;
      const drawX = (pageW - drawW) / 2;
      const drawY = slotTop + (slotH - drawH) / 2;

      doc.addImage(dataUrl, "JPEG", drawX, drawY, drawW, drawH, undefined, "FAST");
      doc.setDrawColor(210, 214, 220);
      doc.setLineWidth(0.3);
      doc.rect(drawX, drawY, drawW, drawH);
    }
  } else {
    const maxW = pageW - margin * 2;
    const maxH = pageH - margin * 2;

    for (let i = 0; i < files.length; i++) {
      if (i > 0) doc.addPage();
      const dataUrl = await readFileAsDataUrl(files[i]);
      const img = await loadImageElement(dataUrl);
      const natW = img.naturalWidth || 1;
      const natH = img.naturalHeight || 1;
      const fitScale = Math.min(maxW / natW, maxH / natH);
      const drawW = natW * fitScale;
      const drawH = natH * fitScale;
      doc.addImage(
        dataUrl,
        "JPEG",
        (pageW - drawW) / 2,
        (pageH - drawH) / 2,
        drawW,
        drawH,
        undefined,
        "FAST"
      );
    }
  }

  const blob = doc.output("blob");
  const stamp = new Date().toISOString().slice(11, 19).replace(/:/g, "");
  return new File(
    [blob],
    layout === "id_two_up" ? `ID_Sheet_A4_${stamp}.pdf` : `Photos_A4_${stamp}.pdf`,
    { type: "application/pdf", lastModified: Date.now() }
  );
}
