import { z } from "zod";

/**
 * XeroxQ — Professional Security Schemas
 * 
 * Centralized Zod schemas to enforce strict input validation across all API routes.
 * This prevents "Input Poisoning" and ensuring 100% type reliability.
 */

// ── 1. Shop Schema ─────────────────────────────────────────────────────────
export const ShopSchema = z.object({
  name: z.string()
    .trim()
    .min(2, "Shop name must be at least 2 characters")
    .max(80, "Shop name is too long"),
  slug: z.string()
    .trim()
    .min(3, "Shop link must be at least 3 characters")
    .max(50, "Shop link is too long")
    .regex(/^[a-z0-9-]+$/, "Shop link can only contain letters, numbers, and hyphens"),
  phone: z.preprocess(
    (val) => (typeof val === "string" && val.trim() !== "" ? val.trim() : null),
    z.string().max(30, "Phone number is too long").nullable().optional()
  ),
  upi_id: z.preprocess(
    (val) => (typeof val === "string" && val.trim() !== "" ? val.trim() : null),
    z.string()
      .regex(/^[\w.\-+]+@[\w.]+$/, "Invalid UPI ID format (e.g. name@upi)")
      .max(50, "UPI ID is too long")
      .nullable()
      .optional()
  ),
  shop_location: z.preprocess(
    (val) => (typeof val === "string" && val.trim() !== "" ? val.trim() : null),
    z.string().min(2, "Location must be at least 2 characters").max(200, "Location is too long").nullable().optional()
  ),
  price_mono: z.number().min(0).max(100).optional(),
  price_color: z.number().min(0).max(200).optional(),
  is_open: z.boolean().optional(),
});

// ── 2. Job Creation Schema (Client Upload) ───────────────────────────────
export const JobSchema = z.object({
  customer_name: z.string().min(1).max(50),
  shop_id: z.string().uuid(),
  file_name: z.string().min(1).max(255),
  file_path: z.string().min(1),
  preferences: z.object({
    color: z.boolean().default(false),
    copies: z.number().int().min(1).max(100).default(1),
    doubleSided: z.boolean().default(false),
    range: z.string().optional(),
  }),
});

// ── 3. Worker Processing Schema (Internal) ───────────────────────────────
export const WorkerProcessSchema = z.object({
  jobId: z.string().uuid(),
  mediaUrl: z.string().url(),
  contentType: z.string(),
  senderPhone: z.string(),
});

export type ShopInput = z.infer<typeof ShopSchema>;
export type JobInput = z.infer<typeof JobSchema>;
export type WorkerInput = z.infer<typeof WorkerProcessSchema>;
