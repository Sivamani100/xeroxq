import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { isMaintenanceEnabled } from "@/lib/maintenance";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const MAINTENANCE_ALLOWED_PREFIXES = [
  "/admin",
  "/platform-admin",
  "/login",
  "/register",
  "/maintenance",
  "/api/health",
  "/api/maintenance",
  "/api/auth",
  "/auth",
  "/_next",
  "/favicon",
  "/robots.txt",
  "/sitemap.xml",
];

const apiLimiter = rateLimit({ windowMs: 60_000, max: 60 });

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function createMiddlewareSupabaseClient(request: NextRequest, response: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );
}

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // ── 0. Global Maintenance Protocol Check (Covers ALL non-admin routes, including /{slug}) ──
  const isMaintenanceExempt =
    MAINTENANCE_ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    /\.(?:svg|png|jpg|jpeg|webp|ico|json|xml|txt|css|js|woff2?)$/i.test(pathname);

  if (!isMaintenanceExempt) {
    try {
      const supabaseService = getServiceClient();
      if (supabaseService) {
        const { data, error } = await supabaseService
          .from("platform_settings")
          .select("value")
          .eq("key", "maintenance_mode")
          .single();

        if (!error && isMaintenanceEnabled(data?.value)) {
          const url = request.nextUrl.clone();
          url.pathname = "/maintenance";
          return NextResponse.redirect(url);
        }
      }
    } catch (error) {
      console.error("[Proxy] Maintenance check error:", error);
    }
  }

  // ── 1. API Rate Limiting Protection ────────────────────────────────────────
  if (pathname.startsWith("/api/")) {
    const ip = getClientIp(request);
    const { success } = apiLimiter.check(`api:${ip}`);
    if (!success) {
      return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
    }
  }

  // ── 2. Protect /admin Route (Strictly via SSR cookie auth; no UA/query bypass) ──
  if (pathname.startsWith("/admin")) {
    const response = NextResponse.next({
      request: { headers: request.headers },
    });

    const supabase = createMiddlewareSupabaseClient(request, response);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  // ── 3. Protect /platform-admin (Fail-Closed CEO Gate) ──────────────────────
  if (pathname.startsWith("/platform-admin")) {
    const response = NextResponse.next({
      request: { headers: request.headers },
    });

    const supabase = createMiddlewareSupabaseClient(request, response);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const ceoEmail = (process.env.CEO_EMAIL || process.env.NEXT_PUBLIC_CEO_EMAIL)?.trim().toLowerCase();
    const isAdminClaim = user.app_metadata?.role === "platform_admin";
    const isCeoEmail = Boolean(ceoEmail && user.email?.trim().toLowerCase() === ceoEmail);

    if (!isAdminClaim && !isCeoEmail) {
      console.warn(`[Security] Unauthorized access attempt to /platform-admin by ${user.email}`);
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    return response;
  }

  // ── 4. Prevent Open Redirect in Auth Callback ──────────────────────────────
  if (pathname === "/auth/callback") {
    const next = searchParams.get("next");
    if (next) {
      const isRelative =
        next.startsWith("/") &&
        !next.startsWith("//") &&
        !next.includes("\\") &&
        !next.includes(":");
      if (!isRelative) {
        const safeUrl = new URL("/auth/callback", request.url);
        const code = searchParams.get("code");
        const electron = searchParams.get("electron");
        if (code) safeUrl.searchParams.set("code", code);
        if (electron) safeUrl.searchParams.set("electron", electron);
        return NextResponse.redirect(safeUrl);
      }
    }
  }

  const response = NextResponse.next();
  response.headers.set("x-request-id", crypto.randomUUID());
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
    "/api/:path*",
    "/admin/:path*",
    "/platform-admin/:path*",
    "/auth/callback",
  ],
};
