import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { getSupabaseAdmin, timingSafeSecretMatch } from "@/lib/server-supabase";

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const authHeader = req.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const isDetailedAuthorized = timingSafeSecretMatch(bearerToken, cronSecret);

  try {
    const supabase = getSupabaseAdmin();

    const dbStart = Date.now();
    const { error: dbErr } = await supabase.from("shops").select("id").limit(1);
    const dbLatency = Date.now() - dbStart;
    if (dbErr) throw new Error(`Database unreachable: ${dbErr.message}`);

    const storageStart = Date.now();
    const { data: buckets, error: storageErr } = await supabase.storage.listBuckets();
    const storageLatency = Date.now() - storageStart;
    if (storageErr) throw new Error(`Storage Audit Failed: ${storageErr.message}`);

    const docBucket = buckets.find((b) => b.name === "documents");
    if (!docBucket) throw new Error("Storage Audit Failed: 'documents' bucket is missing.");

    const duration = Date.now() - startTime;
    logger.info(`Health check passed in ${duration}ms`);

    if (!isDetailedAuthorized) {
      return NextResponse.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
      });
    }

    const requiredKeys = [
      "TWILIO_AUTH_TOKEN",
      "CRON_SECRET",
      "WORKER_SECRET",
      "NEXT_PUBLIC_SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
    ];
    const missingKeys = requiredKeys.filter((key) => !process.env[key]);

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      latency: {
        total: `${duration}ms`,
        database: `${dbLatency}ms`,
        storage: `${storageLatency}ms`,
      },
      integrity: {
        database: "synchronized",
        storage: docBucket.public ? "public-access" : "private-protected",
        environment: missingKeys.length === 0 ? "verified" : `missing_keys_count: ${missingKeys.length}`,
      },
    });
  } catch (err) {
    const e = err as Error;
    logger.error("Health check failed", e);

    return NextResponse.json(
      isDetailedAuthorized
        ? {
            status: "unhealthy",
            timestamp: new Date().toISOString(),
            error: e.message,
          }
        : {
            status: "unhealthy",
            timestamp: new Date().toISOString(),
          },
      { status: 503 }
    );
  }
}
