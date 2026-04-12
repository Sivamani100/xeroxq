import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

// ── Technical Support: L3 Diagnostic Probe ──────────────────────────────
// This professional troubleshooting endpoint allows support teams to
// analyze a shop's health, processing success rates, and financial status.

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get("shopId");
  const authHeader = req.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;

  // 1. Authorization: Only allow authorized L3 support staff
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    logger.security("Rejected unauthorized Support Debug request");
    return new NextResponse('Unauthorized', { status: 401 });
  }

  if (!shopId) {
    return NextResponse.json({ error: "Missing shopId parameter" }, { status: 400 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 2. Aggregate Shop Health Diagnostic
    const [shopRes, jobsRes, metricsRes] = await Promise.all([
      supabase.from("shops").select("*").eq("id", shopId).single(),
      supabase.from("jobs").select("status, created_at").eq("shop_id", shopId).order("created_at", { ascending: false }).limit(50),
      supabase.from("shop_daily_metrics").select("*").eq("shop_id", shopId).order("date", { ascending: false }).limit(7)
    ]);

    if (shopRes.error) throw new Error(`Shop lookup failed: ${shopRes.error.message}`);

    const shop = shopRes.data;
    const jobs = jobsRes.data || [];
    
    // 3. Analytics Calculation
    const successCount = jobs.filter(j => j.status === 'completed' || j.status === 'printed').length;
    const failureCount = jobs.filter(j => j.status === 'failed').length;
    const successRate = jobs.length > 0 ? ((successCount / jobs.length) * 100).toFixed(1) : "100.0";

    return NextResponse.json({
      shop_identity: {
        id: shop.id,
        name: shop.name,
        slug: shop.slug,
        is_active: shop.is_active,
        is_open: shop.is_open
      },
      health_diagnostics: {
        status_indicator: shop.is_active ? "OPERATIONAL" : "SUSPENDED (Action Required)",
        billing_balance: `₹${shop.platform_balance || "0.00"}`,
        total_files_lifetime: shop.total_files_processed,
      },
      processing_telemetry_last_50_jobs: {
        success_rate: `${successRate}%`,
        failed_count: failureCount,
        pending_count: jobs.filter(j => j.status === 'pending' || j.status === 'processing').length,
      },
      recent_history_snapshots: metricsRes.data || []
    });

  } catch (err: any) {
    logger.error(`Support Debug Failure for shop ${shopId}`, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
