import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { timingSafeEqual } from "crypto";

let cachedAdminClient: SupabaseClient | null = null;

/**
 * Returns a lazy-initialized Supabase service-role client.
 * Never throws at module load if env vars are absent during build steps.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (cachedAdminClient) return cachedAdminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  cachedAdminClient = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cachedAdminClient;
}

/**
 * Constant-time string comparison for shared secrets (CRON_SECRET, WORKER_SECRET, etc.).
 */
export function timingSafeSecretMatch(provided: string | null | undefined, expected: string | null | undefined): boolean {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Fail-closed Platform Admin / CEO authorization check.
 */
export function isAuthorizedCeo(user: User | null | undefined): boolean {
  if (!user) return false;

  if (user.app_metadata?.role === "platform_admin") {
    return true;
  }

  const ceoEmail = (process.env.CEO_EMAIL || process.env.NEXT_PUBLIC_CEO_EMAIL)?.trim().toLowerCase();
  if (!ceoEmail) return false;

  const userEmail = user.email?.trim().toLowerCase();
  return Boolean(userEmail && userEmail === ceoEmail);
}
