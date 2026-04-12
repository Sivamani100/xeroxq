import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateToken(): string {
  // Cryptographically secure 8-char alphanumeric token (36^8 = 2.8 trillion combinations).
  // Uses crypto.getRandomValues for true randomness — not Math.random() which is predictable.
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const array = new Uint8Array(8);
  
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Server-side Node.js fallback
    const { randomFillSync } = require("crypto");
    randomFillSync(array);
  }
  
  return Array.from(array).map((b) => chars[b % chars.length]).join("");
}

/**
 * Image Processing Utility: getCroppedImg
 * extracts a high-resolution blob from a canvas crop.
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<Blob | null> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (error) => reject(error));
    img.setAttribute("crossOrigin", "anonymous");
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) return null;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.95);
  });
}
