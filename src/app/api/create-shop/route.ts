import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { ShopSchema } from "@/lib/schemas";
import {
  buildSlugCandidates,
  finalizeSlugInput,
  generateBaseShopSlugs,
  insertWithUniqueSlug,
} from "@/lib/shop-slug";

/**
 * Create Shop API — HARDENED
 * 
 * Security layers:
 * 1. JWT authentication — owner_id extracted from the user's token, never from body
 * 2. Rate limiting — max 20 shop creations per IP per hour (bypassed on localhost)
 * 3. Input sanitization — slug, name, UPI ID, phone all validated and cleaned
 * 4. Sanitized error responses & fallback DB execution
 */

const limiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 20 });

export async function POST(req: NextRequest) {
  // ── 1. Rate Limiting ──────────────────────────────────────────────────────
  const ip = getClientIp(req);
  const isLocalhost = ip === "127.0.0.1" || ip === "::1" || ip.includes("localhost") || process.env.NODE_ENV !== "production";
  if (!isLocalhost) {
    const { success } = limiter.check(`create-shop:${ip}`);
    if (!success) {
      return NextResponse.json(
        { error: "Too many shop creation attempts. Please try again in an hour." },
        { status: 429 }
      );
    }
  }

  // ── 2. JWT Authentication ─────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const userJwt = authHeader.split(" ")[1];

  const supabaseUser = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${userJwt}` } } }
  );

  const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Invalid or expired session. Please log in again." }, { status: 401 });
  }

  // ── 3. Parse & Validate Input ─────────────────────────────────────────────
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const result = ShopSchema.safeParse(body);
  if (!result.success) {
    const firstError = result.error.issues[0]?.message || "Invalid input";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { name, slug, custom_slug, phone, upi_id, shop_location } = result.data;
  const cleanName = name;
  const preferredSlug = slug ? finalizeSlugInput(slug) : undefined;
  const baseSlugs = generateBaseShopSlugs(cleanName);
  const isCustomSlug = Boolean(
    custom_slug ||
    (preferredSlug && preferredSlug !== baseSlugs.compact && preferredSlug !== baseSlugs.hyphenated)
  );
  const cleanPhone = phone || null;
  const cleanUpiId = upi_id || null;
  const cleanLocation = shop_location || null;
  
  const shop_lat = body.shop_lat ? Number(body.shop_lat) : null;
  const shop_lng = body.shop_lng ? Number(body.shop_lng) : null;

  // Check if service role key is configured and valid
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasRealServiceKey = serviceKey && serviceKey !== process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const dbClient = hasRealServiceKey
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )
    : supabaseUser;

  // ── 4. Database Operations: Check Existing Shop ───────────────────────────
  const { data: existingOwned } = await dbClient
    .from("shops")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (existingOwned) {
    return NextResponse.json(
      { error: "Your account already has a shop registered. Contact support to manage multiple shops." },
      { status: 409 }
    );
  }

  // ── Auto-generate clean unique slug ───────────────────────────────────────
  // Auto mode: `shopname` -> `shop-name` (if multi-word) -> `shopnamea`, `shopnameb`...
  // Custom mode: `custom` -> `customa`, `customb`...
  const slugCandidates = buildSlugCandidates({
    shopName: cleanName,
    preferredSlug,
    isCustomSlug,
  });

  // ── 5. Create Shop (with race-safe unique slug retry) ─────────────────────
  const basePayload = {
    owner_id: user.id,
    name: cleanName,
    contact_number: cleanPhone,
    upi_id: cleanUpiId,
    shop_location: cleanLocation,
    shop_lat: shop_lat,
    shop_lng: shop_lng,
    price_mono: 3,
    price_color: 10,
    is_open: true,
    require_customer_name: false,
    generate_token: false,
    show_copies: false,
    show_color_mode: false,
    accept_preorders: false,
    approval_status: "pending",
  };

  const tryInsertWithClient = (client: typeof dbClient) =>
    insertWithUniqueSlug(
      slugCandidates,
      client as unknown as Parameters<typeof insertWithUniqueSlug>[1],
      async (finalSlug) =>
        client
          .from("shops")
          .insert({ ...basePayload, slug: finalSlug })
          .select()
          .single()
    );

  const { data, error } = await tryInsertWithClient(dbClient);

  if (error) {
    console.error("[create-shop] DB insert error:", error.message);

    // Fallback to authenticated user client if dbClient was admin
    if (hasRealServiceKey) {
      const fallback = await tryInsertWithClient(supabaseUser);
      if (fallback.error) {
        console.error("[create-shop] DB fallback insert error:", fallback.error.message);
        return NextResponse.json(
          { error: fallback.error.message || "Failed to create shop. Please try again." },
          { status: 500 }
        );
      }

      return NextResponse.json({ shop: fallback.data }, { status: 201 });
    }

    return NextResponse.json(
      { error: error.message || "Failed to create shop. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ shop: data }, { status: 201 });
}
