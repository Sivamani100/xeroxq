import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/admin";

  // ── Open Redirect Prevention ──────────────────────────────────────────────
  // Only allow redirects to relative paths within our own domain.
  // Reject anything with a protocol (http://, https://) or protocol-relative (//)
  const isSafeNext =
    rawNext.startsWith("/") &&
    !rawNext.startsWith("//") &&
    !rawNext.includes(":");
  const next = isSafeNext ? rawNext : "/admin";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      }
    );
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to the login page with an error indicator
  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
}
