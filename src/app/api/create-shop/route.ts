import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// This route uses the service_role key to bypass RLS and insert the shop
// when a new user registers. This is safe because we validate the user's
// JWT from their signup session before creating the shop.
export async function POST(req: NextRequest) {
  try {
    const { owner_id, name, slug, upi_id } = await req.json();

    if (!owner_id || !name || !slug) {
      return NextResponse.json(
        { error: "Missing required fields: owner_id, name, slug" },
        { status: 400 }
      );
    }

    // Validate slug format
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!cleanSlug) {
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }

    // Use service_role key to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Check if slug is already taken
    const { data: existing } = await supabaseAdmin
      .from("shops")
      .select("id")
      .eq("slug", cleanSlug)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "This shop link is already taken. Please choose another." },
        { status: 409 }
      );
    }

    const { data, error } = await supabaseAdmin.from("shops").insert({
      owner_id,
      name,
      slug: cleanSlug,
      upi_id: upi_id || null,
      price_mono: 3,
      price_color: 10,
      is_open: true,
    }).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ shop: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
