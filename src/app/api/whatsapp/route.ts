import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateToken } from "@/lib/utils";

/**
 * WhatsApp Webhook for Twilio
 * Handles incoming media messages and creates jobs.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const from = formData.get("From") as string; // Customer Phone (whatsapp:+91...)
    const body = (formData.get("Body") as string) || ""; // Message text
    const numMedia = parseInt(formData.get("NumMedia") as string || "0");
    const mediaUrl = formData.get("MediaUrl0") as string;
    const contentType = formData.get("MediaContentType0") as string;

    const senderPhone = from.replace("whatsapp:", "");

    // Initialize Supabase Admin
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Check for Shop Slug in the message (e.g. "PRINT AT [SLUG]")
    let shopSlug = "";
    const slugMatch = body.match(/PRINT AT ([a-z0-9-]+)/i);
    
    if (slugMatch) {
      shopSlug = slugMatch[1].toLowerCase();
      
      // SAVE SESSION: Remember this shop for this user
      await supabaseAdmin
        .from("whatsapp_sessions")
        .upsert({ 
          phone_number: senderPhone, 
          shop_slug: shopSlug,
          updated_at: new Date().toISOString()
        });
      
      console.log(`[WhatsApp] Saved session: ${senderPhone} -> ${shopSlug}`);
    }

    // 2. Handle Case: MESSAGE ONLY (No Media)
    // If they just sent the command, acknowledge it.
    if (numMedia === 0 || !mediaUrl) {
      if (slugMatch) {
        return new NextResponse(`Ready to print at ${shopSlug}! Just send your file now.`, { status: 200 });
      }
      return new NextResponse("No media detected.", { status: 200 });
    }

    // 3. Handle Case: MEDIA RECEIVED (With or Without Context)
    // If no slug in current message, look up the session
    if (!shopSlug) {
      const { data: session } = await supabaseAdmin
        .from("whatsapp_sessions")
        .select("shop_slug")
        .eq("phone_number", senderPhone)
        .single();
      
      if (session) {
        shopSlug = session.shop_slug;
        console.log(`[WhatsApp] Retrieved session for ${senderPhone}: ${shopSlug}`);
      }
    }

    if (!shopSlug) {
      console.warn(`[WhatsApp] Received file from ${senderPhone} but no shop context found.`);
      return new NextResponse("Error: Please scan the QR code again or type 'PRINT AT [shop-slug]' before sending files.", { status: 200 });
    }

    // Identify Shop
    const { data: shop, error: shopError } = await supabaseAdmin
      .from("shops")
      .select("id, name")
      .ilike("slug", shopSlug)
      .single();

    if (shopError || !shop) {
      return new NextResponse("Error: Shop not found.", { status: 200 });
    }

    // 4. Processing logic (unchanged)
    const fileResponse = await fetch(mediaUrl);
    if (!fileResponse.ok) throw new Error("Failed to download media from Twilio");
    const fileBlob = await fileResponse.blob();

    const fileExt = contentType.split("/")[1] || "pdf";
    const fileName = `whatsapp_${Date.now()}.${fileExt}`;
    const storagePath = `${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("documents")
      .upload(storagePath, fileBlob, {
        contentType: contentType,
        upsert: true
      });

    if (uploadError) throw uploadError;

    // Create Job
    const newToken = generateToken();
    const { error: jobError } = await supabaseAdmin.from("jobs").insert({
      token: newToken,
      customer_name: senderPhone,
      file_path: storagePath,
      file_name: fileName,
      preferences: { color: false, copies: 1, doubleSided: false },
      shop_id: shop.id,
      expires_at: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    });

    if (jobError) throw jobError;

    return new NextResponse("File received! It's now in the queue.", { status: 200 });
  } catch (error: any) {
    console.error("[WhatsApp Webhook Error]", error);
    return new NextResponse(`Error: ${error.message}`, { status: 500 });
  }
}
