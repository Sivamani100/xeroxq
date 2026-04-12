import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

// ── Data Science: Platform Insights API ───────────────────────────────────
// This professional analytical endpoint calculates business health metrics
// including Growth Velocity, Churn Risk, and Peak Hour Distribution.

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Fetch historical snapshots (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: snapshots, error: snapErr } = await supabase
      .from("shop_daily_metrics")
      .select("*")
      .gte("date", thirtyDaysAgo.toISOString().split('T')[0])
      .order("date", { ascending: true });

    if (snapErr) throw snapErr;

    // 2. Data Processing: Calculate Growth Velocity
    // Compare this week (last 7 days) vs last week (7-14 days ago)
    const now = new Date();
    const last7DaysCount = snapshots
      ?.filter(s => new Date(s.date) > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000))
      .reduce((sum, s) => sum + (s.total_jobs || 0), 0) || 0;

    const previous7DaysCount = snapshots
      ?.filter(s => {
        const d = new Date(s.date);
        return d <= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) && 
               d > new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      })
      .reduce((sum, s) => sum + (s.total_jobs || 0), 0) || 0;

    const growthVelocity = previous7DaysCount === 0 
      ? 100 
      : (((last7DaysCount - previous7DaysCount) / previous7DaysCount) * 100).toFixed(1);

    // 3. Churn Analysis: Identify "At Risk" Shops
    // Shops that haven't processed a file in the last 48 hours but have history
    const { data: activeShops } = await supabase.from("shops").select("id, name");
    const shopsWithRecentActivity = new Set(
      snapshots
        ?.filter(s => new Date(s.date) > new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000))
        .map(s => s.shop_id)
    );

    const churnRiskShops = activeShops
      ?.filter(shop => !shopsWithRecentActivity.has(shop.id))
      .map(shop => ({ id: shop.id, name: shop.name, risk: "High (No Activity 48h)" }));

    // 4. Network Load: Peak Hour Distribution
    // Aggregate peak hours to find platform-wide congestion patterns
    const hourFrequency: Record<number, number> = {};
    snapshots?.forEach(s => {
      if (s.peak_hour !== null) {
        hourFrequency[s.peak_hour] = (hourFrequency[s.peak_hour] || 0) + 1;
      }
    });

    const peakHour = Object.entries(hourFrequency)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    return NextResponse.json({
      summary: {
        total_jobs_30d: snapshots?.reduce((sum, s) => sum + (s.total_jobs || 0), 0),
        avg_daily_jobs: (snapshots?.reduce((sum, s) => sum + (s.total_jobs || 0), 0) || 0) / 30,
        platform_growth_wow: `${growthVelocity}%`,
        estimated_peak_hour: `${peakHour}:00`,
        platform_revenue_30d: snapshots?.reduce((sum, s) => sum + Number(s.platform_fees_est || 0), 0).toFixed(2)
      },
      at_risk: churnRiskShops?.slice(0, 5), // Top 5 risks
      daily_trend: snapshots?.reduce((acc, s) => {
        const date = s.date;
        if (!acc[date]) acc[date] = 0;
        acc[date] += s.total_jobs;
        return acc;
      }, {} as Record<string, number>)
    });

  } catch (err: any) {
    logger.error("Insights API Failure", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
