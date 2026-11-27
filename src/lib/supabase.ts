import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "[XeroxQ] CRITICAL: Supabase env vars are missing.\n" +
    "  → Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

const resolvedUrl = supabaseUrl ?? "https://placeholder.supabase.co";
const resolvedAnon = supabaseAnonKey ?? "placeholder-anon-key";

function initSupabaseClient(): SupabaseClient {
  // Packaged Electron loads static HTML over `app://local` where cookie-based SSR isn't used.
  if (typeof window !== "undefined" && window.location.protocol === "app:") {
    return createClient(resolvedUrl, resolvedAnon, {
      auth: {
        flowType: "pkce",
        storage: window.localStorage,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }

  // Standard web browsers & dev (`http:`/`https:`): sync auth cookies with `src/proxy.ts`
  if (typeof window !== "undefined") {
    return createBrowserClient(resolvedUrl, resolvedAnon, {
      auth: {
        flowType: "pkce",
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }

  // SSR/build fallback
  return createClient(resolvedUrl, resolvedAnon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export const supabase = initSupabaseClient();
