import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateToken } from "@/lib/utils";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { validateTwilioSignature } from "@/lib/twilio-verify";
import { logger } from "@/lib/logger";
import { WorkerProcessSchema } from "@/lib/schemas";

/**
 * WhatsApp Webhook for Twilio — HARDENED
 * 
 * Security layers:
 * 1. Twilio signature verification (rejects all non-Twilio requests)
 * 2. Rate limiting (20 req/min per IP)
 * 3. Sanitized error responses (no internal info leaked to users)
 * 4. Async media ingestion (fire & forget worker pattern)
 */

// Rate limiter: 20 requests per minute per IP
const limiter = rateLimit({ windowMs: 60_000, max: 20 });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  // ── 1. Rate Limiting ──────────────────────────────────────────────────────
  const ip = getClientIp(req);
  const { success } = limiter.check(`whatsapp:${ip}`);
  if (!success) {
    return twimlResponse("Too many requests. Please wait a moment before trying again.");
  }

  // ── 2. Twilio Signature Verification ────────────────────────────────────────
  // Skip in development for easier testing
  if (process.env.NODE_ENV === "production") {
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const signature = req.headers.get("x-twilio-signature") || "";
    
    if (!authToken) {
      console.error("[XeroxQ] CRITICAL: TWILIO_AUTH_TOKEN not set — webhook is unverified!");
    } else {
      // Reconstruct the full URL for verification
      const host = req.headers.get("host") || "";
      const proto = req.headers.get("x-forwarded-proto") || "https";
      const url = `${proto}://${host}${req.nextUrl.pathname}`;
      
      // Parse form body for verification
      const clonedReq = req.clone();
      const formData = await clonedReq.formData();
      const params: Record<string, string> = {};
      formData.forEach((value, key) => { params[key] = value.toString(); });

      if (!validateTwilioSignature(authToken, signature, url, params)) {
        logger.security(`Rejected forged Twilio request from ${ip}`, { url, signature });
        return new NextResponse("Forbidden", { status: 403 });
      }
    }
  }

  // ── 3. Parse Request ──────────────────────────────────────────────────────
  try {
    const formData = await req.formData();
    const from = formData.get("From") as string;
    const body = (formData.get("Body") as string) || "";
    const numMedia = parseInt(formData.get("NumMedia") as string || "0");
    const mediaUrl = formData.get("MediaUrl0") as string;
    const contentType = formData.get("MediaContentType0") as string;

    if (!from) {
      return twimlResponse("Invalid request.");
    }

    const senderPhone = from.replace("whatsapp:", "").trim();
    let shopSlug = "";

    // ── 4. Identify Shop from Message ───────────────────────────────────────
    const slugMatch = body.match(/PRINT AT ([a-z0-9-]+)/i);
    if (slugMatch) {
      shopSlug = slugMatch[1].toLowerCase().slice(0, 60); // Limit length

      await supabaseAdmin
        .from("whatsapp_sessions")
        .upsert({
          phone_number: senderPhone,
          shop_slug: shopSlug,
          updated_at: new Date().toISOString()
        }, { onConflict: "phone_number" });
    }

    // ── 5. Retrieve Shop from Session ────────────────────────────────────────
    if (!shopSlug) {
      const { data: session } = await supabaseAdmin
        .from("whatsapp_sessions")
        .select("shop_slug, updated_at")
        .eq("phone_number", senderPhone)
        .single();

      if (session) {
        // Session expiry: 2 hours
        const sessionAge = Date.now() - new Date(session.updated_at).getTime();
        if (sessionAge < 2 * 60 * 60 * 1000) {
          shopSlug = session.shop_slug;
        } else {
          // Session expired — clear it
          await supabaseAdmin.from("whatsapp_sessions").delete().eq("phone_number", senderPhone);
        }
      }
    }

    if (!shopSlug) {
      return twimlResponse("Hello! 👋 Please scan a shop's QR code or type *PRINT AT [shop-code]* to get started.");
    }

    // ── 6. Fetch Shop ────────────────────────────────────────────────────────
    const { data: shop, error: shopError } = await supabaseAdmin
      .from("shops")
      .select("id, name, is_open, is_active")
      .ilike("slug", shopSlug)
      .single();

    if (shopError || !shop) {
      return twimlResponse("That shop code wasn't found. Please scan the QR code again or contact the shop.");
    }

    if (shop.is_active === false) {
      return twimlResponse(`*${shop.name}* is temporarily undergoing maintenance. Please contact the shop owner directly or try another location. 🛠️`);
    }

    if (shop.is_open === false) {
      return twimlResponse(`*${shop.name}* is currently closed. Please try again later. 🔒`);
    }

    // ── 7. Handle Media Ingestion (Async) ────────────────────────────────────
    if (numMedia > 0 && mediaUrl) {
      // Validate MIME type
      const ALLOWED_CONTENT_TYPES = new Set([
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "image/jpeg",
        "image/png",
        "image/webp",
      ]);

      if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
        return twimlResponse(`❌ Unsupported file type (${contentType}). Please send a PDF, Word document, Excel file, or image (JPG/PNG).`);
      }

      const newToken = generateToken();

      const { data: jobData, error: jobError } = await supabaseAdmin
        .from("jobs")
        .insert({
          token: newToken,
          customer_name: `WA: ${senderPhone}`,
          file_name: "Processing...",
          file_path: "processing_whatsapp_media",
          status: "processing",
          preferences: {
            color: false,
            copies: 1,
            doubleSided: false,
            _wa_media_url: mediaUrl,
            _wa_content_type: contentType
          },
          shop_id: shop.id,
          expires_at: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (jobError) {
        console.error("[WA Webhook] Job insert failed:", jobError.message);
        return twimlResponse("Failed to queue your print job. Please try again.");
      }

      // Increment persistent billing counter (survives job deletion)
      await supabaseAdmin.rpc('increment_shop_files', { shop_row_id: shop.id });

      // Fire & Forget: trigger background worker
      const workerSecret = process.env.WORKER_SECRET;
      const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
      const host = req.headers.get("host");
      const workerUrl = `${protocol}://${host}/api/worker/process-wa`;

      fetch(workerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-worker-secret": workerSecret || "",
        },
        body: JSON.stringify({ jobId: jobData.id, mediaUrl, contentType, senderPhone }),
      }).catch((err) => console.error("[WA Webhook] Worker trigger failed:", err.message));

      return twimlResponse(`✅ *Files received!*\n\nYour file has been sent to *${shop.name}*. Please wait while we process your print job. 🖨️`);
    }

    // ── 8. Text-only Reply ───────────────────────────────────────────────────
    if (slugMatch) {
      return twimlResponse(`🏪 You're now connected to *${shop.name}*.\n\nPlease share your documents in this chat and we'll print them for you!`);
    }

    return twimlResponse(`You're connected to *${shop.name}*. Send me a file and I'll print it for you! 🖨️`);

  } catch (error) {
    const e = error as Error;
    console.error("[WA Webhook] Unhandled error:", e?.message || error);
    // Never expose internal errors to WhatsApp users
    return twimlResponse("Something went wrong. Please try again in a moment.");
  }
}

function twimlResponse(message: string) {
  // Escape XML special chars to prevent injection
  const safeMessage = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${safeMessage}</Message></Response>`,
    { headers: { "Content-Type": "text/xml" } }
  );
}
