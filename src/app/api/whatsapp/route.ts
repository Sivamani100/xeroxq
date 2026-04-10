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

    console.log("[WhatsApp] Incoming Request:", { from, body, numMedia, mediaUrl });

    if (numMedia === 0 || !mediaUrl) {
       return new NextResponse("No media detected.", { status: 200 });
    }

    // Initialize Supabase Admin
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Identify Shop
    // Approach 1: Look for Shop Slug in the message (Prefilled via QR link)
    // Format: "PRINT AT [SLUG]"
    let shopSlug = "";
    const slugMatch = body.match(/PRINT AT ([a-z0-9-]+)/i);
    if (slugMatch) {
      shopSlug = slugMatch[1].toLowerCase();
    }

    // If no slug found, we can't route the job (unless we have a fallback or session logic)
    if (!shopSlug) {
      // Logic for "No Message" - we might need to query which shop uses this Twilio number
      // But for trial account, it's shared. 
      // Fallback: Check if the user has a "Selected Shop" session (Requires state management)
      // For now, let's look for the last shop this user interacted with or a default.
      console.warn(`[WhatsApp] Received file from ${from} but no shop context found.`);
      return new NextResponse("Error: No shop context found in message.", { status: 200 });
    }

    console.log("[WhatsApp] Detected Slug:", shopSlug);

    // Get Shop ID (Case-insensitive lookup)
    const { data: shop, error: shopError } = await supabaseAdmin
      .from("shops")
      .select("id, name")
      .ilike("slug", shopSlug)
      .single();

    if (shopError || !shop) {
      return new NextResponse("Error: Shop not found.", { status: 200 });
    }

    // 1. Download file from Twilio
    const fileResponse = await fetch(mediaUrl);
    if (!fileResponse.ok) throw new Error("Failed to download media from Twilio");
    const fileBlob = await fileResponse.blob();

    // 2. Upload to Supabase Storage
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

    // 3. Create Job
    const newToken = generateToken();
    const { error: jobError } = await supabaseAdmin.from("jobs").insert({
      token: newToken,
      customer_name: from.replace("whatsapp:", ""), // Set customer name to phone number
      file_path: storagePath,
      file_name: fileName,
      preferences: { color: false, copies: 1, doubleSided: false },
      shop_id: shop.id,
      expires_at: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    });

    if (jobError) throw jobError;

    return new NextResponse("Job created successfully.", { status: 200 });
  } catch (error: any) {
    console.error("[WhatsApp Webhook Error]", error);
    return new NextResponse(`Error: ${error.message}`, { status: 500 });
  }
}
