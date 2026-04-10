import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateToken } from "@/lib/utils";

/**
 * WhatsApp Webhook for Twilio
 * Handles incoming media messages and creates jobs with session-based shop routing.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const from = formData.get("From") as string;
    const body = (formData.get("Body") as string) || "";
    const numMedia = parseInt(formData.get("NumMedia") as string || "0");
    const mediaUrl = formData.get("MediaUrl0") as string;
    const contentType = formData.get("MediaContentType0") as string;

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const senderPhone = from.replace("whatsapp:", "");
    let shopSlug = "";

    // 1. Identify Shop from body (if present)
    const slugMatch = body.match(/PRINT AT ([a-z0-9-]+)/i);
    if (slugMatch) {
      shopSlug = slugMatch[1].toLowerCase();
      // Upsert session memory for this phone number
      await supabaseAdmin
        .from("whatsapp_sessions")
        .upsert({ 
          phone_number: senderPhone, 
          shop_slug: shopSlug,
          updated_at: new Date().toISOString()
        });
    }

    // 2. Retrieve shop context from session if not in message
    if (!shopSlug) {
      const { data: session } = await supabaseAdmin
        .from("whatsapp_sessions")
        .select("shop_slug")
        .eq("phone_number", senderPhone)
        .single();
      
      if (session) {
        shopSlug = session.shop_slug;
      }
    }

    // 3. Early return if we still don't know which shop this is for
    if (!shopSlug) {
      return twimlResponse("Please scan the shop's QR code or type 'PRINT AT [slug]' first so I know where to send your files.");
    }

    // 4. Find Shop UUID
    const { data: shop, error: shopError } = await supabaseAdmin
      .from("shops")
      .select("id, name")
      .ilike("slug", shopSlug)
      .single();

    if (shopError || !shop) {
      return twimlResponse(`Error: Shop '${shopSlug}' not found in our system.`);
    }

    // 5. Handle Media Upload
    if (numMedia > 0 && mediaUrl) {
      // Download from Twilio (Auth may be required if Enforce HTTP Auth is on)
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      
      const fetchOptions: RequestInit = {};
      if (accountSid && authToken) {
        const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
        fetchOptions.headers = {
          Authorization: `Basic ${auth}`,
        };
      }

      const fileResponse = await fetch(mediaUrl, fetchOptions);
      if (!fileResponse.ok) {
        return twimlResponse(`Download Error (${fileResponse.status}): Please add TWILIO_ACCOUNT_SID/AUTH_TOKEN to Vercel or disable Authenticated Media in Twilio.`);
      }
      const fileBlob = await fileResponse.blob();

      // Determine extension and paths with robust MIME mapping
      const MIME_MAP: Record<string, string> = {
        "application/pdf": "pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
        "application/msword": "doc",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
        "application/vnd.ms-excel": "xls",
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
      };

      const fileExt = MIME_MAP[contentType!] || contentType?.split("/")[1]?.split(";")[0] || "file";
      const fileName = `whatsapp_${Date.now()}.${fileExt}`;
      const storagePath = `whatsapp/${senderPhone}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabaseAdmin.storage
        .from("documents")
        .upload(storagePath, fileBlob, {
          contentType: contentType,
          upsert: true
        });

      if (uploadError) {
        return twimlResponse(`Storage Error: ${uploadError.message}`);
      }

      // 6. Create Job Entry
      const newToken = generateToken();
      const { error: jobError } = await supabaseAdmin.from("jobs").insert({
        token: newToken,
        customer_name: `WA: ${senderPhone}`,
        file_path: storagePath,
        file_name: fileName,
        status: "pending",
        preferences: { color: false, copies: 1, doubleSided: false },
        shop_id: shop.id,
        expires_at: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
      });

      if (jobError) {
        // Rollback storage if DB fails
        await supabaseAdmin.storage.from("documents").remove([storagePath]);
        return twimlResponse(`Database Error: ${jobError.message}`);
      }

      return twimlResponse(`✅ *Job Uploaded!* \n\nShop: ${shop.name}\nFile: ${fileName}\n\nYour file is now visible in the printer queue.`);
    }

    // 7. Context-only reply
    if (slugMatch) {
      return twimlResponse(`Ready! I've linked you to *${shop.name}*. \n\nSend me any file (PDF, Doc, Image) now to add it to the print queue.`);
    }

    return twimlResponse("I'm ready! Send me a file to print, or type 'PRINT AT [slug]' to change shops.");

  } catch (error: any) {
    console.error("[WhatsApp Webhook Error]", error);
    return twimlResponse(`System Error: ${error.message || "Unknown error occurred"}`);
  }
}

/**
 * Standard TwiML Response Generator
 */
function twimlResponse(message: string) {
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`,
    { headers: { "Content-Type": "text/xml" } }
  );
}
