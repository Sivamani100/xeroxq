import { createBrowserClient } from "@supabase/ssr";

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

export const supabase = createBrowserClient(
  supabaseUrl ?? "https://placeholder.supabase.co",
  supabaseAnonKey ?? "placeholder-anon-key"
);
