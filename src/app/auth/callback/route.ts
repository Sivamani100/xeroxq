import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-static";

// Helper: returns an HTML page that immediately redirects the browser tab
// to a custom protocol URL (xeroxq://). HTTP 302 redirects do NOT work for
// custom schemes — only JavaScript / meta-refresh does.
function deepLinkRedirect(url: string, errorMode = false) {
  const html = errorMode
    ? `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Sign-in failed</title>
        <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#fff}</style>
      </head><body>
        <div style="text-align:center">
          <p style="font-size:18px;color:#ef4444;font-weight:600">Sign-in failed.</p>
          <p style="color:#6b7280;font-size:14px">You can close this tab and try again.</p>
        </div>
        <script>window.location.href="${url}";</script>
      </body></html>`
    : `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Signing you in…</title>
        <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#fff}
        .spin{width:36px;height:36px;border:3px solid #e5e7eb;border-top-color:#2563eb;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 16px}
        @keyframes spin{to{transform:rotate(360deg)}}</style>
      </head><body>
        <div style="text-align:center">
          <div class="spin"></div>
          <p style="font-size:16px;font-weight:600;color:#111827">Signing you in…</p>
          <p style="color:#6b7280;font-size:13px">Returning to XeroxQ. You can close this tab.</p>
        </div>
        <script>window.location.href="${url}";</script>
      </body></html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/admin";
  // Detect if this callback came from the Electron desktop app
  const isElectron = searchParams.get("electron") === "1";

  // ── Open Redirect Prevention ──────────────────────────────────────────────
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

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      if (isElectron) {
        const deepLink = `xeroxq://auth/callback?access_token=${encodeURIComponent(
          data.session.access_token
        )}&refresh_token=${encodeURIComponent(data.session.refresh_token)}`;
        return deepLinkRedirect(deepLink);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }

    // If server cookie exchange failed but this is Electron, forward the code as fallback
    if (isElectron) {
      const deepLink = `xeroxq://auth/callback?code=${encodeURIComponent(code)}`;
      return deepLinkRedirect(deepLink);
    }
  }

  // Error fallback
  if (isElectron) {
    return deepLinkRedirect(`xeroxq://auth/callback?error=auth-callback-failed`, true);
  }
  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
}
