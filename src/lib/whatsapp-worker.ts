import { randomUUID } from "crypto";
import { getSupabaseAdmin } from "@/lib/server-supabase";
import { WorkerProcessSchema } from "@/lib/schemas";

const MAX_MEDIA_SIZE_BYTES = 25 * 1024 * 1024;
const MAX_REDIRECTS = 5;

const ALLOWED_CONTENT_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/vnd.ms-powerpoint": "ppt",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "text/plain": "txt",
  "text/csv": "csv",
  "application/zip": "zip",
};

const TWILIO_AUTH_HOSTS = new Set(["api.twilio.com"]);

const ALLOWED_MEDIA_HOSTS = [
  "api.twilio.com",
  "media.twiliocdn.com",
  "mcs.us1.twilio.com",
  "mcs.us2.twilio.com",
  "s3.amazonaws.com",
  "s3-external-1.amazonaws.com",
];

function isAllowedMediaHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (
    process.env.NODE_ENV === "development" &&
    (lower === "localhost" || lower === "127.0.0.1")
  ) {
    return true;
  }
  return ALLOWED_MEDIA_HOSTS.some(
    (allowed) => lower === allowed || lower.endsWith(`.${allowed}`)
  );
}

/**
 * Fetches Twilio media safely with redirect hop validation (prevents SSRF redirects
 * and avoids leaking Twilio Basic Auth credentials to external CDN hosts).
 */
async function fetchTwilioMediaSafely(initialUrl: string): Promise<Response> {
  let currentUrl = new URL(initialUrl);

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (currentUrl.protocol !== "https:" && process.env.NODE_ENV !== "development") {
      throw new Error("Disallowed media protocol");
    }
    if (!isAllowedMediaHost(currentUrl.hostname)) {
      throw new Error(`Disallowed media host: ${currentUrl.hostname}`);
    }

    const headers: Record<string, string> = {};
    if (
      TWILIO_AUTH_HOSTS.has(currentUrl.hostname.toLowerCase()) &&
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN
    ) {
      headers.Authorization = `Basic ${Buffer.from(
        `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
      ).toString("base64")}`;
    }

    const res = await fetch(currentUrl.toString(), {
      headers,
      redirect: "manual",
    });

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) {
        throw new Error(`Redirect response ${res.status} without location`);
      }
      currentUrl = new URL(location, currentUrl);
      continue;
    }

    return res;
  }

  throw new Error("Too many media redirects");
}

export async function processWhatsAppMediaJob(rawPayload: unknown): Promise<{
  ok: boolean;
  status: number;
  body: Record<string, unknown>;
}> {
  const supabaseAdmin = getSupabaseAdmin();
  const parsed = WorkerProcessSchema.safeParse(rawPayload);

  if (!parsed.success) {
    return { ok: false, status: 400, body: { error: "Invalid payload" } };
  }

  const { jobId, mediaUrl, contentType, senderPhone } = parsed.data;

  try {
    let parsedMediaUrl: URL;
    try {
      parsedMediaUrl = new URL(mediaUrl);
    } catch {
      await supabaseAdmin.from("jobs").update({ status: "failed" }).eq("id", jobId);
      return { ok: false, status: 400, body: { error: "Invalid media URL" } };
    }

    if (!isAllowedMediaHost(parsedMediaUrl.hostname)) {
      await supabaseAdmin.from("jobs").update({ status: "failed" }).eq("id", jobId);
      return { ok: false, status: 400, body: { error: "Disallowed media host" } };
    }

    // Resolve job's shop_id so storage object stays cleanly scoped to `<shop_id>/whatsapp/...`
    const { data: jobRecord } = await supabaseAdmin
      .from("jobs")
      .select("shop_id")
      .eq("id", jobId)
      .maybeSingle();

    const shopFolder = jobRecord?.shop_id || "unassigned";
    const fileExt =
      ALLOWED_CONTENT_TYPES[contentType] ||
      contentType.split("/")[1]?.split("+")[0]?.replace(/[^a-z0-9]/gi, "") ||
      "doc";

    const response = await fetchTwilioMediaSafely(mediaUrl);
    if (!response.ok) {
      throw new Error(`Media download failed: HTTP ${response.status}`);
    }

    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_MEDIA_SIZE_BYTES) {
      await supabaseAdmin
        .from("jobs")
        .update({ status: "failed", file_name: "File too large (max 25MB)" })
        .eq("id", jobId);
      return { ok: false, status: 413, body: { error: "File exceeds 25MB limit" } };
    }

    const fileBlob = await response.blob();
    if (fileBlob.size > MAX_MEDIA_SIZE_BYTES) {
      await supabaseAdmin
        .from("jobs")
        .update({ status: "failed", file_name: "File too large (max 25MB)" })
        .eq("id", jobId);
      return { ok: false, status: 413, body: { error: "File exceeds 25MB limit" } };
    }

    const cleanPhone = (senderPhone || "unknown").replace(/[^0-9+]/g, "");
    const timestamp = Date.now();
    const storagePath = `${shopFolder}/whatsapp/${cleanPhone}_${timestamp}_${randomUUID()}.${fileExt}`;
    const fileName = `whatsapp_${timestamp}.${fileExt}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("documents")
      .upload(storagePath, fileBlob, {
        contentType,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { error: updateError } = await supabaseAdmin
      .from("jobs")
      .update({
        file_path: storagePath,
        file_name: fileName,
        status: "pending",
        preferences: { color: false, copies: 1, doubleSided: false },
      })
      .eq("id", jobId);

    if (updateError) throw updateError;

    return { ok: true, status: 200, body: { success: true, jobId } };
  } catch (error) {
    const e = error as Error;
    console.error("[Worker] Processing error:", e?.message || error);

    await supabaseAdmin
      .from("jobs")
      .update({ status: "failed", file_name: "Processing failed — please retry" })
      .eq("id", jobId);

    return { ok: false, status: 500, body: { error: "Processing failed" } };
  }
}
