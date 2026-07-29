import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Helper: returns an HTML page that redirects the browser tab
// to a custom protocol URL (xeroxq://) for Electron desktop app.
function deepLinkRedirect(url: string, errorMode = false) {
  const html = errorMode
    ? `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Sign-in failed</title>
        <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#fff}</style>
      </head><body>
        <div style="text-align:center">
          <p style="font-size:18px;color:#ef4444;font-weight:600">Authentication failed.</p>
          <p style="color:#6b7280;font-size:14px">You can close this tab and try again.</p>
        </div>
        <script>window.location.href="${url}";</script>
      </body></html>`
    : `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Authenticating…</title>
        <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#fff}
        .spin{width:36px;height:36px;border:3px solid #e5e7eb;border-top-color:#2563eb;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 16px}
        @keyframes spin{to{transform:rotate(360deg)}}</style>
      </head><body>
        <div style="text-align:center">
          <div class="spin"></div>
          <p style="font-size:16px;font-weight:600;color:#111827">Authenticating…</p>
          <p style="color:#6b7280;font-size:13px font-weight:500">Returning to XeroxQ. You can close this tab.</p>
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
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const rawNext = searchParams.get("next") ?? "/auth/update-password";
  const isElectron = searchParams.get("electron") === "1";

  // Prevent open redirect vulnerabilities
  const isSafeNext =
    rawNext.startsWith("/") &&
    !rawNext.startsWith("//") &&
    !rawNext.includes(":");
  const next = isSafeNext ? rawNext : "/auth/update-password";

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server component / route handler mitigation
          }
        },
      },
    }
  );

  // 1. Handle PKCE Code Exchange (?code=...)
  if (code) {
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
    console.warn("[AuthCallback] PKCE exchange error on server:", error?.message);

    // If server-side PKCE code exchange failed (e.g., PKCE code_verifier was stored in desktop app's storage),
    // forward the code via deep link to Electron so the desktop client can exchange it!
    if (isElectron) {
      console.log("[AuthCallback] Forwarding code to Electron for client-side PKCE exchange");
      const deepLink = `xeroxq://auth/callback?code=${encodeURIComponent(code)}`;
      return deepLinkRedirect(deepLink);
    }
  }

  // 2. Handle OTP Token Hash Verification (?token_hash=...&type=recovery)
  if (tokenHash && type === "recovery") {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "recovery",
    });
    if (!error && data.session) {
      if (isElectron) {
        const deepLink = `xeroxq://auth/callback?access_token=${encodeURIComponent(
          data.session.access_token
        )}&refresh_token=${encodeURIComponent(data.session.refresh_token)}`;
        return deepLinkRedirect(deepLink);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.warn("[AuthCallback] OTP verify error:", error?.message);
  }

  // Fallback to error page if exchange fails
  if (isElectron) {
    return deepLinkRedirect(`xeroxq://auth/callback?error=auth-callback-failed`, true);
  }
  return NextResponse.redirect(`${origin}/auth/auth-error`);
}
