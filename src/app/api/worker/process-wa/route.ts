import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { getClientIp } from "@/lib/rate-limit";
import { timingSafeSecretMatch } from "@/lib/server-supabase";
import { processWhatsAppMediaJob } from "@/lib/whatsapp-worker";

export async function POST(req: NextRequest) {
  const incomingSecret = req.headers.get("x-worker-secret");
  const workerSecret = process.env.WORKER_SECRET;

  if (!timingSafeSecretMatch(incomingSecret, workerSecret)) {
    logger.security(`Rejected unauthorized worker request from ${getClientIp(req)}`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const result = await processWhatsAppMediaJob(rawBody);
  return NextResponse.json(result.body, { status: result.status });
}
