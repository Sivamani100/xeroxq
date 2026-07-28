import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

// ── DevOps: Storage Bucket Janitor ──────────────────────────────────────────
// Deletes old document files from Supabase Storage Bucket ('documents') after 5 minutes.
// Retains database table records in 'jobs' for analytics and queue history while clearing file_path.

export const dynamic = 'force-static';
export const maxDuration = 60; // 60 seconds allowed for this function

const FIVE_MINUTES_MS = 5 * 60 * 1000;

export async function GET(req: Request) {
  return handleCleanup(req);
}

export async function POST(req: Request) {
  return handleCleanup(req);
}

async function handleCleanup(req: Request) {
  if (process.env.BUILD_DESKTOP === "true") {
    return NextResponse.json({ success: true });
  }
  // 1. Authorization: Require CRON_SECRET via Bearer token or secret param
  const authHeader = req.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;

  const url = new URL(req.url);
  const paramSecret = url.searchParams.get("secret");

  const isAuthorized = cronSecret && (
    authHeader === `Bearer ${cronSecret}` || 
    paramSecret === cronSecret
  );

  if (!isAuthorized) {
    logger.warn("Unauthorized attempt to trigger Storage Cleanup job");
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const nowISO = new Date().toISOString();
    const thresholdISO = new Date(Date.now() - FIVE_MINUTES_MS).toISOString();

    // 2. Execute SQL RPC to purge 5-minute-old storage files directly
    try {
      await supabase.rpc("purge_storage_files");
    } catch (e) {
      // Ignore RPC error if function doesn't exist
    }

    // 3. Find jobs older than 5 minutes that still have storage files
    const { data: oldJobs, error: fetchErr } = await supabase
      .from("jobs")
      .select("id, file_path")
      .not("file_path", "is", null)
      .or(`created_at.lt.${thresholdISO}`);

    if (fetchErr) throw fetchErr;

    if (!oldJobs || oldJobs.length === 0) {
      logger.info("Janitor: No stale storage files found (> 5 min). Storage bucket is clean.");
      return NextResponse.json({ success: true, message: "Storage bucket is clean. No document files found for purging." });
    }

    const filePaths = oldJobs.map(j => j.file_path).filter(Boolean) as string[];
    const jobIds = oldJobs.map(j => j.id);

    // 3. Delete physical files from Storage Bucket ONLY
    if (filePaths.length > 0) {
      const { error: storageErr } = await supabase.storage
        .from("documents")
        .remove(filePaths);
      
      if (storageErr) {
        logger.error("Janitor: Failed to purge physical files from storage bucket", storageErr);
      } else {
        logger.success(`Janitor: Successfully purged ${filePaths.length} documents from cloud storage bucket.`);
      }
    }

    // 4. Update Database Table Records (DO NOT DELETE THE ROWS FROM DATABASE)
    const { error: dbErr } = await supabase
      .from("jobs")
      .update({
        file_path: null,
        is_deleted_by_user: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .in("id", jobIds);

    if (dbErr) throw dbErr;

    logger.success(`Janitor Storage Cleanup Complete. Purged ${filePaths.length} bucket files. Retained database table rows.`);

    return NextResponse.json({
      success: true,
      purged_files_count: filePaths.length,
      table_records_retained: jobIds.length,
      timestamp: new Date().toISOString()
    });

  } catch (err: any) {
    logger.error("Janitor: Storage Purge Exception", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
