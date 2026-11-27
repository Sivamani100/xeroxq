import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { getSupabaseAdmin, timingSafeSecretMatch } from "@/lib/server-supabase";

export const maxDuration = 60;

const FIVE_MINUTES_MS = 5 * 60 * 1000;

export async function GET(req: Request) {
  return handleCleanup(req);
}

export async function POST(req: Request) {
  return handleCleanup(req);
}

async function handleCleanup(req: Request) {
  const authHeader = req.headers.get("Authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const cronSecret = process.env.CRON_SECRET;

  if (!timingSafeSecretMatch(bearerToken, cronSecret)) {
    logger.warn("Unauthorized attempt to trigger Storage Cleanup job");
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const thresholdISO = new Date(Date.now() - FIVE_MINUTES_MS).toISOString();

    try {
      await supabase.rpc("purge_storage_files");
    } catch {
      // Optional SQL RPC fallback
    }

    const { data: oldJobs, error: fetchErr } = await supabase
      .from("jobs")
      .select("id, file_path")
      .not("file_path", "is", null)
      .lt("created_at", thresholdISO);

    if (fetchErr) throw fetchErr;

    if (!oldJobs || oldJobs.length === 0) {
      logger.info("Janitor: No stale storage files found (> 5 min).");
      return NextResponse.json({
        success: true,
        purged_files_count: 0,
        message: "Storage bucket is clean.",
      });
    }

    const filePaths = oldJobs.map((j) => j.file_path).filter(Boolean) as string[];
    const jobIds = oldJobs.map((j) => j.id);

    if (filePaths.length > 0) {
      const { error: storageErr } = await supabase.storage.from("documents").remove(filePaths);
      if (storageErr) {
        logger.error("Janitor: Failed to purge physical files from storage bucket", storageErr);
      } else {
        logger.success(`Janitor: Purged ${filePaths.length} expired documents.`);
      }
    }

    // Mark as auto-deleted (never impersonate user manual deletion)
    const { error: dbErr } = await supabase
      .from("jobs")
      .update({
        file_path: null,
        is_auto_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .in("id", jobIds);

    if (dbErr) throw dbErr;

    return NextResponse.json({
      success: true,
      purged_files_count: filePaths.length,
      table_records_retained: jobIds.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const e = err as Error;
    logger.error("Janitor: Storage Purge Exception", e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
