import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { WorkerProcessSchema } from "@/lib/schemas";

/**
 * XeroxQ — Background Media Processing Worker — HARDENED
 * 
 * Security layers:
 * 1. WORKER_SECRET shared-key authentication (rejects unauthorized callers)
 * 2. SSRF protection (mediaUrl must be a Twilio CDN URL)
 * 3. File size limit enforced at download stage (25MB)
 * 4. Sanitized error responses
 */

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// 25MB limit for WhatsApp media
const MAX_MEDIA_SIZE_BYTES = 25 * 1024 * 1024;

const ALLOWED_CONTENT_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-excel": "xls",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// Allowed Twilio media CDN hostnames (SSRF protection)
const ALLOWED_MEDIA_HOSTS = [
  "api.twilio.com",
  "media.twiliocdn.com",
  "mcs.us1.twilio.com",
  "mcs.us2.twilio.com",
];

export async function POST(req: NextRequest) {
  // ── 1. Authenticate — Shared Secret ───────────────────────────────────────
  const workerSecret = process.env.WORKER_SECRET;
  const incomingSecret = req.headers.get("x-worker-secret");

  if (!workerSecret || incomingSecret !== workerSecret) {
    logger.security(`Rejected unauthorized worker request from ${req.headers.get("x-forwarded-for") || "unknown IP"}`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rawBody = await req.json();
    const result = WorkerProcessSchema.safeParse(rawBody);

    if (!result.success) {
      logger.warn("Worker: Invalid payload rejected", result.error.errors);
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { jobId, mediaUrl, contentType, senderPhone } = result.data;

    // ── 3. SSRF Protection — Validate Media URL ────────────────────────────
    let parsedMediaUrl: URL;
    try {
      parsedMediaUrl = new URL(mediaUrl);
    } catch {
      return NextResponse.json({ error: "Invalid media URL" }, { status: 400 });
    }

    const isAllowedHost = ALLOWED_MEDIA_HOSTS.some(
      (host) => parsedMediaUrl.hostname === host || parsedMediaUrl.hostname.endsWith(`.${host}`)
    );

    // In development, also allow localhost for testing
    const isLocalDev = process.env.NODE_ENV === "development" && 
      (parsedMediaUrl.hostname === "localhost" || parsedMediaUrl.hostname === "127.0.0.1");

    if (!isAllowedHost && !isLocalDev) {
      logger.security(`Worker: SSRF attempt blocked — disallowed host: ${parsedMediaUrl.hostname}`, { jobId, mediaUrl });
      
      // Mark job as failed
      await supabaseAdmin.from("jobs").update({ status: "failed" }).eq("id", jobId);
      return NextResponse.json({ error: "Disallowed media host" }, { status: 400 });
    }

    // ── 4. Validate Content Type ───────────────────────────────────────────
    const fileExt = ALLOWED_CONTENT_TYPES[contentType];
    if (!fileExt) {
      await supabaseAdmin.from("jobs").update({ status: "failed" }).eq("id", jobId);
      return NextResponse.json({ error: "Unsupported content type" }, { status: 400 });
    }

    // ── 5. Download Media from Twilio ──────────────────────────────────────
    const response = await fetch(mediaUrl, {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
        ).toString("base64")}`,
      },
      // Redirect is allowed (Twilio CDN may redirect), but limit to 5 hops
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`Media download failed: HTTP ${response.status}`);
    }

    // ── 6. File Size Check ─────────────────────────────────────────────────
    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_MEDIA_SIZE_BYTES) {
      await supabaseAdmin.from("jobs").update({ 
        status: "failed", 
        file_name: "File too large (max 25MB)" 
      }).eq("id", jobId);
      return NextResponse.json({ error: "File exceeds 25MB limit" }, { status: 413 });
    }

    const fileBlob = await response.blob();

    // Double-check actual size after download
    if (fileBlob.size > MAX_MEDIA_SIZE_BYTES) {
      await supabaseAdmin.from("jobs").update({ 
        status: "failed", 
        file_name: "File too large (max 25MB)" 
      }).eq("id", jobId);
      return NextResponse.json({ error: "File exceeds 25MB limit" }, { status: 413 });
    }

    // ── 7. Upload to Supabase Storage ──────────────────────────────────────
    const cleanPhone = (senderPhone || "unknown").replace(/[^0-9+]/g, "");
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const storagePath = `whatsapp/${cleanPhone}/${timestamp}_${randomSuffix}.${fileExt}`;
    const fileName = `whatsapp_${timestamp}.${fileExt}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("documents")
      .upload(storagePath, fileBlob, {
        contentType,
        upsert: false, // Never overwrite — use unique paths
      });

    if (uploadError) throw uploadError;

    // ── 8. Update Job Record ───────────────────────────────────────────────
    const { error: updateError } = await supabaseAdmin
      .from("jobs")
      .update({
        file_path: storagePath,
        file_name: fileName,
        status: "pending",
        // Clean up temp fields from preferences
        preferences: { color: false, copies: 1, doubleSided: false },
      })
      .eq("id", jobId);

    if (updateError) throw updateError;

    console.log(`[Worker] Job ${jobId} processed successfully — ${fileName}`);
    return NextResponse.json({ success: true, jobId });

  } catch (error) {
    const e = error as Error;
    console.error("[Worker] Processing error:", e?.message || error);

    // Mark job as failed so shopkeeper sees it, not "Processing..." forever
    try {
      const { jobId } = await req.json().catch(() => ({ jobId: null }));
      if (jobId) {
        await supabaseAdmin
          .from("jobs")
          .update({ status: "failed", file_name: "Processing failed — please retry" })
          .eq("id", jobId);
      }
    } catch (_) {}

    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
