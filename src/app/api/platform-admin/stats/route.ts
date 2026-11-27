import { NextRequest, NextResponse } from "next/server";
import { CONFIG } from "@/lib/config";
import { isMaintenanceEnabled } from "@/lib/maintenance";
import { getSupabaseAdmin, isAuthorizedCeo } from "@/lib/server-supabase";

const ALLOWED_DELETE_TABLES = new Set([
  "shops",
  "contact_submissions",
  "newsletter_subs",
  "partners",
  "job_applications",
  "blogs",
  "platform_news",
  "security_reports",
]);

const ALLOWED_APPROVE_TABLES = new Set(["partners", "shops", "job_applications"]);

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const token = authHeader.slice(7);
  const {
    data: { user },
  } = await supabaseAdmin.auth.getUser(token);

  if (!isAuthorizedCeo(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
    storageLogsResult,
  ] = await Promise.all([
    supabaseAdmin.from("jobs").select("id, shop_id, status"),
    supabaseAdmin
      .from("shops")
      .select(
        "id, name, slug, upi_id, is_open, is_active, price_mono, price_color, created_at, total_files_processed, approval_status"
      )
      .order("created_at", { ascending: false }),
    supabaseAdmin.from("contact_submissions").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("newsletter_subs").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("blogs").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("partners").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("job_applications").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("platform_news").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("security_reports").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("platform_settings").select("*"),
    supabaseAdmin.rpc("get_storage_analytics"),
    supabaseAdmin
      .from("jobs")
      .select(
        "id, token, customer_name, file_name, file_path, is_deleted_by_user, is_auto_deleted, created_at, deleted_at, status, shop_id"
      )
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const jobs = jobsResult.data ?? [];
  const hasPersistentCounter = !shopsResult.error;

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

  const shopsData = shopsResult.data || [];
  const shopStats = shopsData.map((shop) => {
    const metrics = jobMetricsMap[shop.id] || { total: 0, pending: 0 };
    const persistentCount = (shop.total_files_processed as number) ?? 0;
    const liveJobCount = metrics.total;
    const billableFiles = hasPersistentCounter
      ? Math.max(persistentCount, liveJobCount)
      : liveJobCount;

    return {
      id: shop.id,
      name: shop.name,
      slug: shop.slug,
      upi_id: shop.upi_id,
      is_open: shop.is_open,
      is_active: shop.is_active,
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
      platformFee: CONFIG.BILLING.PLATFORM_FEE_PER_FILE,
    },
  });
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const token = authHeader.slice(7);
  const {
    data: { user },
  } = await supabaseAdmin.auth.getUser(token);

  if (!isAuthorizedCeo(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { action, table, id } = await req.json();

    if (action === "purge_storage_now") {
      const purgeRes = await supabaseAdmin.rpc("purge_storage_files");
      return NextResponse.json({ success: true, purged: purgeRes.data });
    }

    if (!action || !table || !id) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    let result;

    if (action === "delete") {
      if (!ALLOWED_DELETE_TABLES.has(table)) {
        return NextResponse.json({ error: "Disallowed table for deletion" }, { status: 400 });
      }
      result = await supabaseAdmin.from(table).delete().eq("id", id);
    } else if (action === "approve_shop" || (action === "approve" && table === "shops")) {
      result = await supabaseAdmin
        .from("shops")
        .update({ approval_status: "approved" })
        .eq("id", id)
        .select();
    } else if (action === "reject_shop") {
      result = await supabaseAdmin
        .from("shops")
        .update({ approval_status: "rejected" })
        .eq("id", id)
        .select();
    } else if (action === "approve") {
      if (!ALLOWED_APPROVE_TABLES.has(table)) {
        return NextResponse.json({ error: "Disallowed table for approval" }, { status: 400 });
      }
      result = await supabaseAdmin.from(table).update({ status: "approved" }).eq("id", id);
    } else if (action === "review_poc") {
      const { data: report } = await supabaseAdmin
        .from("security_reports")
        .select("status")
        .eq("id", id)
        .single();
      const nextStatus = report?.status === "reviewed" ? "resolved" : "reviewed";
      result = await supabaseAdmin
        .from("security_reports")
        .update({ status: nextStatus })
        .eq("id", id);
    } else if (action === "toggle_maintenance") {
      const { data: current } = await supabaseAdmin
        .from("platform_settings")
        .select("value")
        .eq("key", "maintenance_mode")
        .single();

      const newVal = !isMaintenanceEnabled(current?.value);
      result = await supabaseAdmin
        .from("platform_settings")
        .upsert({ key: "maintenance_mode", value: newVal }, { onConflict: "key" });
    } else if (action === "toggle_shop") {
      const { data: shop } = await supabaseAdmin
        .from("shops")
        .select("is_open")
        .eq("id", id)
        .single();
      result = await supabaseAdmin
        .from("shops")
        .update({ is_open: !shop?.is_open })
        .eq("id", id);
    } else {
      return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
    }

    if (result?.error) {
      console.error("[Stats API POST error]", result.error);
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const e = err as Error;
    console.error("[Stats API POST exception]", e);
    return NextResponse.json({ error: e?.message || "Internal server error" }, { status: 500 });
  }
}
