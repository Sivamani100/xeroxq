export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { CONFIG } from "@/lib/config";

// Service-role client — bypasses ALL RLS policies.
// NEVER expose this to the browser client.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ALLOWED_DELETE_TABLES = new Set([
  "shops",
  "contact_submissions",
  "newsletter_subs",
  "partners",
  "job_applications",
  "blogs",
  "platform_news",
  "security_reports"
]);

export async function GET(req: NextRequest) {
  // ── 1. Auth gate ────────────────────────────────────────────────────────────
  const ceoEmail = (process.env.CEO_EMAIL || process.env.NEXT_PUBLIC_CEO_EMAIL)?.trim().toLowerCase();
  const authHeader = req.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);

  if (!user || !ceoEmail || user.email?.trim().toLowerCase() !== ceoEmail) {
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
    settingsResult,
    storageAnalyticsResult,
    storageLogsResult
  ] = await Promise.all([
    supabaseAdmin.from("jobs").select("id, shop_id, status"),
    supabaseAdmin.from("shops").select("id, name, slug, upi_id, is_open, price_mono, price_color, created_at, total_files_processed, approval_status").order("created_at", { ascending: false }),
    supabaseAdmin.from("contact_submissions").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("newsletter_subs").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("blogs").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("partners").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("job_applications").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("platform_news").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("security_reports").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("platform_settings").select("*"),
    supabaseAdmin.rpc("get_storage_analytics"),
    supabaseAdmin.from("jobs").select("id, token, customer_name, file_name, file_path, is_deleted_by_user, is_auto_deleted, created_at, deleted_at, status, shop_id").order("created_at", { ascending: false }).limit(100)
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
  if (storageAnalyticsResult.error) console.error("[Stats API] storageAnalytics error:", storageAnalyticsResult.error);
  if (storageLogsResult.error) console.error("[Stats API] storageLogs error:", storageLogsResult.error);

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
      approval_status: shop.approval_status || "pending",
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
    storageAnalytics: (storageAnalyticsResult.data as any)?.[0] ?? null,
    storageLogs: storageLogsResult.data || [],
    config: { 
      platformFee: CONFIG.BILLING.PLATFORM_FEE_PER_FILE 
    } 
  });
}

export async function POST(req: NextRequest) {
  // ── 1. Auth gate (CEO Only) ──────────────────────────────────────────────────
  const ceoEmail = (process.env.CEO_EMAIL || process.env.NEXT_PUBLIC_CEO_EMAIL)?.trim().toLowerCase();
  const authHeader = req.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);

  if (!user || !ceoEmail || user.email?.trim().toLowerCase() !== ceoEmail) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── 2. Parse Action ──────────────────────────────────────────────────────────
  try {
    const { action, table, id, payload } = await req.json();

    if (action === 'purge_storage_now') {
      const purgeRes = await supabaseAdmin.rpc("purge_storage_files");
      return NextResponse.json({ success: true, purged: purgeRes.data });
    }

    if (!action || (!table && action !== 'purge_storage_now') || (!id && action !== 'purge_storage_now')) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    let result;

    if (action === 'delete') {
      if (!ALLOWED_DELETE_TABLES.has(table)) {
        return NextResponse.json({ error: "Disallowed table for deletion" }, { status: 400 });
      }
      result = await supabaseAdmin.from(table).delete().eq('id', id);
    } 
    else if (action === 'approve_shop' || (action === 'approve' && table === 'shops')) {
        const updateRes = await supabaseAdmin.from("shops").update({ approval_status: 'approved' }).eq('id', id).select();
        if (updateRes.error || !updateRes.data || updateRes.data.length === 0) {
          const rpcRes = await supabaseAdmin.rpc("update_shop_approval_status", { target_shop_id: id, new_status: 'approved' });
          if (rpcRes.error) {
            const userSupabase = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              { global: { headers: { Authorization: `Bearer ${token}` } } }
            );
            result = await userSupabase.from("shops").update({ approval_status: 'approved' }).eq('id', id).select();
          } else {
            result = rpcRes;
          }
        } else {
          result = updateRes;
        }
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
    else if (action === 'reject_shop') {
        const updateRes = await supabaseAdmin.from("shops").update({ approval_status: 'rejected' }).eq('id', id).select();
        if (updateRes.error || !updateRes.data || updateRes.data.length === 0) {
          const rpcRes = await supabaseAdmin.rpc("update_shop_approval_status", { target_shop_id: id, new_status: 'rejected' });
          result = rpcRes.error ? updateRes : rpcRes;
        } else {
          result = updateRes;
        }
    }

    if (result?.error) {
      console.error("[Stats API POST error]", result.error);
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Stats API POST exception]", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
