import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

// ── DevOps: Automated Storage Janitor ───────────────────────────────────────
// This CRON job runs periodically to delete old document files from 
// Supabase storage, ensuring the CEO's cloud bill remains optimized.
// MNC Policy: 7-day data retention for support and logs.

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds allowed for this function

const RETENTION_DAYS = 7;

export async function GET(req: Request) {
  // 1. Authorization: Only Vercel Crons or manual trigger with secret
  const authHeader = req.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${cronSecret}`) {
    logger.warn("Unauthorized attempt to trigger CRON Cleanup job");
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const threshold = new Date();
    threshold.setDate(threshold.getDate() - RETENTION_DAYS);
    const thresholdISO = threshold.toISOString();

    // 2. ── Automation: Self-Healing Sentinel ────────────────────────────────
    // Scan for jobs that are 'failed' or 'pending' for too long.
    // Reset them for retry if they haven't exceeded the MNC limit (3).
    const stalePendingTime = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1 hour

    const { data: stuckJobs, error: stuckErr } = await supabase
      .from("jobs")
      .select("id, retry_count, status")
      .or(`status.eq.failed,and(status.eq.pending,created_at.lt.${stalePendingTime})`)
      .lt("retry_count", 3);

    if (stuckJobs && stuckJobs.length > 0) {
      logger.info(`Self-Healing: Found ${stuckJobs.length} recoverable jobs. Attempting reset...`);
      
      for (const job of stuckJobs) {
        await supabase
          .from("jobs")
          .update({ 
            status: "pending", 
            retry_count: (job.retry_count || 0) + 1 
          })
          .eq("id", job.id);
        
        await supabase.from("automation_logs").insert({
          event_type: 'AUTO_RETRY',
          job_id: job.id,
          details: { previous_status: job.status, new_retry_count: (job.retry_count || 0) + 1 }
        });
      }
    }

    // 2. Find jobs older than threshold
    const { data: oldJobs, error: fetchErr } = await supabase
      .from("jobs")
      .select("id, file_path")
      .lt("created_at", thresholdISO);

    if (fetchErr) throw fetchErr;

    if (!oldJobs || oldJobs.length === 0) {
      logger.info("Janitor: No stale documents found. Storage is healthy.");
      return NextResponse.json({ success: true, message: "Storage is healthy. No documents found for purging." });
    }

    const filePaths = oldJobs.map(j => j.file_path).filter(Boolean);
    const jobIds = oldJobs.map(j => j.id);

    // 3. Delete from Storage
    if (filePaths.length > 0) {
      const { error: storageErr } = await supabase.storage
        .from("documents")
        .remove(filePaths);
      
      if (storageErr) {
        logger.error("Janitor: Failed to purge physical files from storage", storageErr);
        // Continue even if storage fails to ensure DB records aren't stuck
      } else {
        logger.success(`Janitor: Successfully purged ${filePaths.length} documents from cloud storage.`);
      }
    }

    // 4. Delete Job Records
    const { error: dbErr } = await supabase
      .from("jobs")
      .delete()
      .in("id", jobIds);

    if (dbErr) throw dbErr;

    logger.success(`Janitor Cleanup Complete. Purged ${jobIds.length} job records.`);

    return NextResponse.json({
      success: true,
      purged_count: jobIds.length,
      timestamp: new Date().toISOString()
    });

  } catch (err: any) {
    logger.error("Janitor: Protocol Failure Exception", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
