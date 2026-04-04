import { createClient } from "@supabase/supabase-js";

// Fallback to placeholder during build-time static generation.
// At runtime in the browser, these env vars are always injected.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
