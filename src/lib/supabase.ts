import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
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
      flowType: "pkce",
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);
