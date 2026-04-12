import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

// Standard health check probe for load balancers and monitoring tools.
export async function GET() {
  const startTime = Date.now();
  
  try {
    // 1. Check Supabase Connectivity
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service key for deep health audit
    );

    const dbStart = Date.now();
    const { error: dbErr } = await supabase.from("shops").select("id").limit(1);
    const dbLatency = Date.now() - dbStart;

    if (dbErr) throw new Error(`Database unreachable: ${dbErr.message}`);

    // 2. Check Storage Connectivity
    const storageStart = Date.now();
    const { data: buckets, error: storageErr } = await supabase.storage.listBuckets();
    const storageLatency = Date.now() - storageStart;

    if (storageErr) throw new Error(`Storage Audit Failed: ${storageErr.message}`);
    
    const docBucket = buckets.find(b => b.name === 'documents');
    if (!docBucket) throw new Error("Storage Audit Failed: 'documents' bucket is missing.");

    // 3. Environment Integrity Audit (MNC Standard)
    const requiredKeys = ['TWILIO_AUTH_TOKEN', 'CRON_SECRET', 'WORKER_SECRET', 'NEXT_PUBLIC_SUPABASE_URL'];
    const missingKeys = requiredKeys.filter(key => !process.env[key]);

    const duration = Date.now() - startTime;
    logger.info(`Deep Health check passed in ${duration}ms (DB: ${dbLatency}ms, Storage: ${storageLatency}ms)`);

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      latency: {
        total: `${duration}ms`,
        database: `${dbLatency}ms`,
        storage: `${storageLatency}ms`
      },
      integrity: {
        database: "synchronized",
        storage: docBucket.public ? "public-access" : "private-protected",
        environment: missingKeys.length === 0 ? "verified" : `missing_keys: ${missingKeys.join(', ')}`
      }
    });
  } catch (err: any) {
    logger.error("Health check failed", err);
    
    return NextResponse.json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: err.message
    }, { status: 503 });
  }
}
