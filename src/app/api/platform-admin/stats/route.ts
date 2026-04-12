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
  const [jobsResult, shopsResult] = await Promise.all([
    supabaseAdmin.from("jobs").select("id, shop_id, status"),
    supabaseAdmin.from("shops").select("id, name, slug, upi_id, is_open, price_mono, price_color, created_at, total_files_processed").order("created_at", { ascending: false })
  ]);

  if (jobsResult.error) {
    console.error("[Stats API] jobs fetch failed:", jobsResult.error.message);
    return NextResponse.json({ error: jobsResult.error.message }, { status: 500 });
  }

  const jobs = jobsResult.data ?? [];
  const hasPersistentCounter = !shopsResult.error;

  // ── 3. Architect Optimization: $O(M)$ Pre-aggregation ────────────────────────
  // Instead of nesting filter() inside map(), we create a lookup map in a single pass.
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
    
    // BILLING RULE: Every file uploaded = 1 billable unit.
    const persistentCount = (shop.total_files_processed as number) ?? 0;
    const liveJobCount    = metrics.total;

    // Use max to ensure reliability during migration transition
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
    config: { 
      platformFee: CONFIG.BILLING.PLATFORM_FEE_PER_FILE 
    } 
  });
}
