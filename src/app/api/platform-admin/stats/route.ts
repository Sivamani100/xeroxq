import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { CONFIG } from "@/lib/config";

// Service-role client — bypasses ALL RLS policies.
// NEVER expose this to the browser client.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  // ── 1. Auth gate ────────────────────────────────────────────────────────────
  const ceoEmail = process.env.NEXT_PUBLIC_CEO_EMAIL;
  const authHeader = req.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);

  if (!user || (ceoEmail && user.email !== ceoEmail)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── 2. Data Fetching (Parallel) ─────────────────────────────────────────────
  // ── 2. Data Fetching (Parallel) ─────────────────────────────────────────────
  const [
    jobsResult, 
    shopsResult,
    submissionsResult,
    newsletterResult,
    blogsResult,
    partnersResult,
    careersResult,
    newsResult,
    securityResult,
    settingsResult
  ] = await Promise.all([
    supabaseAdmin.from("jobs").select("id, shop_id, status"),
    supabaseAdmin.from("shops").select("id, name, slug, upi_id, is_open, price_mono, price_color, created_at, total_files_processed").order("created_at", { ascending: false }),
    supabaseAdmin.from("contact_submissions").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("newsletter_subs").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("blogs").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("partners").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("job_applications").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("platform_news").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("security_reports").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("platform_settings").select("*")
  ]);

  if (jobsResult.error) console.error("[Stats API] jobs error:", jobsResult.error);
  if (shopsResult.error) console.error("[Stats API] shops error:", shopsResult.error);
  if (submissionsResult.error) console.error("[Stats API] submissions error:", submissionsResult.error);
  if (newsletterResult.error) console.error("[Stats API] newsletter error:", newsletterResult.error);
  if (blogsResult.error) console.error("[Stats API] blogs error:", blogsResult.error);
  if (partnersResult.error) console.error("[Stats API] partners error:", partnersResult.error);
  if (careersResult.error) console.error("[Stats API] careers error:", careersResult.error);
  if (newsResult.error) console.error("[Stats API] news error:", newsResult.error);
  if (securityResult.error) console.error("[Stats API] security error:", securityResult.error);
  if (settingsResult.error) console.error("[Stats API] settings error:", settingsResult.error);

  const jobs = jobsResult.data ?? [];
  console.log("[Stats API] DB Check - Partners Count:", (partnersResult.data || []).length);
  const hasPersistentCounter = !shopsResult.error;

  // ── 3. Architect Optimization: $O(M)$ Pre-aggregation ────────────────────────
  const jobMetricsMap: Record<string, { total: number; pending: number }> = {};
  for (const job of jobs) {
    if (!jobMetricsMap[job.shop_id]) {
      jobMetricsMap[job.shop_id] = { total: 0, pending: 0 };
    }
    jobMetricsMap[job.shop_id].total++;
    if (job.status === "pending") {
      jobMetricsMap[job.shop_id].pending++;
    }
  }

  // ── 4. Enrich per-shop stats ───────────────────────────────────────────────
  const shopsData = shopsResult.data || [];
  const shopStats = shopsData.map((shop) => {
    const metrics = jobMetricsMap[shop.id] || { total: 0, pending: 0 };
    const persistentCount = (shop.total_files_processed as number) ?? 0;
    const liveJobCount    = metrics.total;

    const billableFiles = hasPersistentCounter
      ? Math.max(persistentCount, liveJobCount)
      : liveJobCount;

    return {
      id: shop.id,
      name: shop.name,
      slug: shop.slug,
      upi_id: shop.upi_id,
      is_open: shop.is_open,
      price_mono: shop.price_mono ?? CONFIG.BILLING.DEFAULT_MONO_PRICE,
      price_color: shop.price_color ?? CONFIG.BILLING.DEFAULT_COLOR_PRICE,
      created_at: shop.created_at,
      total_files_processed: billableFiles,
      pending_jobs: metrics.pending,
    };
  });

  return NextResponse.json({ 
    shops: shopStats, 
    hasPersistentCounter,
    submissions: submissionsResult.data || [],
    newsletter: newsletterResult.data || [],
    blogs: blogsResult.data || [],
    partners: partnersResult.data || [],
    careers: careersResult.data || [],
    news: newsResult.data || [],
    security: securityResult.data || [],
    settings: settingsResult.data || [],
    config: { 
      platformFee: CONFIG.BILLING.PLATFORM_FEE_PER_FILE 
    } 
  });
}

export async function POST(req: NextRequest) {
  // ── 1. Auth gate (CEO Only) ──────────────────────────────────────────────────
  const ceoEmail = process.env.NEXT_PUBLIC_CEO_EMAIL;
  const authHeader = req.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);

  if (!user || (ceoEmail && user.email !== ceoEmail)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── 2. Parse Action ──────────────────────────────────────────────────────────
  try {
    const { action, table, id, payload } = await req.json();

    if (!action || !table || !id) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    let result;

    if (action === 'delete') {
      result = await supabaseAdmin.from(table).delete().eq('id', id);
    } 
    else if (action === 'approve') {
      result = await supabaseAdmin.from(table).update({ status: 'approved' }).eq('id', id);
    } 
    else if (action === 'toggle_maintenance') {
      // Specialized handler for maintenance mode
      const { data: current } = await supabaseAdmin
        .from("platform_settings")
        .select("value")
        .eq("key", "maintenance_mode")
        .single();
      
      const newVal = !(current?.value === true);
      result = await supabaseAdmin
        .from("platform_settings")
        .update({ value: newVal })
        .eq("key", "maintenance_mode");
    }
    else if (action === 'toggle_shop') {
        const { data: shop } = await supabaseAdmin.from("shops").select("is_open").eq("id", id).single();
        result = await supabaseAdmin.from("shops").update({ is_open: !shop?.is_open }).eq("id", id);
    }

    if (result?.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
