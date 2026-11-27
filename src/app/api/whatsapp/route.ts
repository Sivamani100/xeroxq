import { NextRequest, NextResponse } from "next/server";
import { generateToken } from "@/lib/utils";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { validateTwilioSignature } from "@/lib/twilio-verify";
import { logger } from "@/lib/logger";
import { getSupabaseAdmin } from "@/lib/server-supabase";
import { processWhatsAppMediaJob } from "@/lib/whatsapp-worker";

const limiter = rateLimit({ windowMs: 60_000, max: 20 });

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { success } = limiter.check(`whatsapp:${ip}`);
  if (!success) {
    return twimlResponse("Too many requests. Please wait a moment before trying again.");
  }

  // Fail closed in production when TWILIO_AUTH_TOKEN is missing
  if (process.env.NODE_ENV === "production") {
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const signature = req.headers.get("x-twilio-signature") || "";

    if (!authToken) {
      logger.security("Rejected WhatsApp webhook: TWILIO_AUTH_TOKEN not configured");
      return new NextResponse("Webhook authentication unconfigured", { status: 500 });
    }

    const configuredWebhook = process.env.NEXT_PUBLIC_WHATSAPP_WEBHOOK_URL;
    const url = configuredWebhook || req.nextUrl.toString();

    const clonedReq = req.clone();
    const formData = await clonedReq.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    if (!validateTwilioSignature(authToken, signature, url, params)) {
      logger.security(`Rejected forged Twilio request from ${ip}`, { url });
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const formData = await req.formData();
    const from = formData.get("From") as string;
    const body = (formData.get("Body") as string) || "";
    const numMedia = parseInt((formData.get("NumMedia") as string) || "0", 10);
    const mediaUrl = formData.get("MediaUrl0") as string;
    const contentType = formData.get("MediaContentType0") as string;

    if (!from) {
      return twimlResponse("Invalid request.");
    }

    const senderPhone = from.replace("whatsapp:", "").trim();
    let shopSlug = "";

    const slugMatch = body.match(/PRINT AT ([a-z0-9-]+)/i);
    if (slugMatch) {
      shopSlug = slugMatch[1].toLowerCase().slice(0, 60);

      await supabaseAdmin
        .from("whatsapp_sessions")
        .upsert(
          {
            phone_number: senderPhone,
            shop_slug: shopSlug,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "phone_number" }
        );
    }

    if (!shopSlug) {
      const { data: session } = await supabaseAdmin
        .from("whatsapp_sessions")
        .select("shop_slug, updated_at")
        .eq("phone_number", senderPhone)
        .single();

      if (session) {
        const sessionAge = Date.now() - new Date(session.updated_at).getTime();
        if (sessionAge < 2 * 60 * 60 * 1000) {
          shopSlug = session.shop_slug;
        } else {
          await supabaseAdmin.from("whatsapp_sessions").delete().eq("phone_number", senderPhone);
        }
      }
    }

    if (!shopSlug) {
      return twimlResponse("Hello! Please scan a shop's QR code or type *PRINT AT [shop-code]* to get started.");
    }

    const { data: shop, error: shopError } = await supabaseAdmin
      .from("shops")
      .select("id, name, is_open, is_active, approval_status, total_files_processed")
      .ilike("slug", shopSlug)
      .single();

    if (shopError || !shop) {
      return twimlResponse("That shop code wasn't found. Please scan the QR code again or contact the shop.");
    }

    if (shop.is_active === false) {
      return twimlResponse(`*${shop.name}* is temporarily offline. Please try another location.`);
    }

    if (shop.is_open === false) {
      return twimlResponse(`*${shop.name}* is currently closed. Please try again later.`);
    }

    if (shop.approval_status !== "approved" && (shop.total_files_processed ?? 0) >= 3) {
      return twimlResponse(
        `*${shop.name}* has reached its 3-file free trial limit while awaiting verification.`
      );
    }

    if (numMedia > 0 && mediaUrl) {
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
            _wa_content_type: contentType,
          },
          shop_id: shop.id,
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (jobError || !jobData) {
        console.error("[WA Webhook] Job insert failed:", jobError?.message);
        return twimlResponse("Failed to queue your print job. Please try again.");
      }

      // Note: Once 20261126_security_hardening runs, tr_enforce_job_insert_security increments total_files_processed;
      // keep fallback safe only when running before migration if needed, avoiding double-increment after migration.
      await processWhatsAppMediaJob({
        jobId: jobData.id,
        mediaUrl,
        contentType: contentType || "application/octet-stream",
        senderPhone,
      });

      return twimlResponse(
        `*Files received!*\n\nYour file has been sent to *${shop.name}* (Token: *${newToken}*).`
      );
    }

    return twimlResponse(
      `Connected to *${shop.name}*.\n\nSend any PDF, Word, or Image document right here to add it to the shop queue.`
    );
  } catch (error) {
    const e = error as Error;
    console.error("[WA Webhook] Internal error:", e?.message);
    return twimlResponse("An unexpected error occurred. Please try again shortly.");
  }
}

function twimlResponse(message: string): NextResponse {
  const safeMessage = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${safeMessage}</Message>
</Response>`;

  return new NextResponse(xml, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
