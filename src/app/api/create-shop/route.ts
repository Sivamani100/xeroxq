import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { ShopSchema } from "@/lib/schemas";

/**
 * Create Shop API — HARDENED
 * 
 * Security layers:
 * 1. JWT authentication — owner_id extracted from the user's token, never from body
 * 2. Rate limiting — max 5 shop creations per IP per hour
 * 3. Input sanitization — slug, name, UPI ID all validated and cleaned
 * 4. Sanitized error responses
 */

// Max 5 shop creation attempts per IP per hour
const limiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5 });

export async function POST(req: NextRequest) {
  // ── 1. Rate Limiting ──────────────────────────────────────────────────────
  const ip = getClientIp(req);
  const { success } = limiter.check(`create-shop:${ip}`);
  if (!success) {
    return NextResponse.json(
      { error: "Too many shop creation attempts. Please try again in an hour." },
      { status: 429 }
    );
  }

  // ── 2. JWT Authentication ─────────────────────────────────────────────────
  // We use the anon key + the user's JWT to verify their identity server-side.
  // The owner_id is NEVER accepted from the request body — always from JWT.
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const userJwt = authHeader.split(" ")[1];

  // Verify JWT using the anon key client (this validates the token signature)
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

  const { name, slug, upi_id } = result.data;
  const cleanName = name;
  const cleanSlug = slug;
  const cleanUpiId = upi_id;

  // ── 4. Database Operations ────────────────────────────────────────────────
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Check if this user already has a shop (one shop per account)
  const { data: existingOwned } = await supabaseAdmin
    .from("shops")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (existingOwned) {
    return NextResponse.json(
      { error: "Your account already has a shop registered. Contact support to manage multiple shops." },
      { status: 409 }
    );
  }

  // Check if slug is already taken
  const { data: existingSlug } = await supabaseAdmin
    .from("shops")
    .select("id")
    .eq("slug", cleanSlug)
    .single();

  if (existingSlug) {
    return NextResponse.json(
      { error: "This shop link is already taken. Please choose another." },
      { status: 409 }
    );
  }

  // ── 5. Create Shop ────────────────────────────────────────────────────────
  const { data, error } = await supabaseAdmin
    .from("shops")
    .insert({
      owner_id: user.id, // Always from JWT — never from request body
      name: cleanName,
      slug: cleanSlug,
      upi_id: cleanUpiId,
      price_mono: 3,
      price_color: 10,
      is_open: true,
    })
    .select()
    .single();

  if (error) {
    // Only log full error server-side
    console.error("[create-shop] DB insert error:", error.message);
    return NextResponse.json({ error: "Failed to create shop. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ shop: data }, { status: 201 });
}
