import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // In production this should never fire — if it does, Vercel env vars are misconfigured.
  // In local dev, it surfaces early rather than causing cryptic auth failures.
  console.error(
    "[XeroxQ] CRITICAL: Supabase env vars are missing.\n" +
    "  → Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY\n" +
    "  → On Vercel: Dashboard → Project → Settings → Environment Variables\n" +
    "  → Locally: copy .env.example → .env.local and fill in the values"
  );
}

export const supabase = createClient(
  supabaseUrl ?? "https://placeholder.supabase.co",
  supabaseAnonKey ?? "placeholder-anon-key",
  {
    auth: {
      // Persist Supabase session in localStorage so shop owners stay logged in.
      persistSession: true,
      autoRefreshToken: true,
      // Detect auth state changes (e.g. magic links, OAuth callbacks).
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        // Helps Supabase identify the origin of requests in logs.
        "x-app-name": "xeroxq-production",
      },
    },
  }
);
