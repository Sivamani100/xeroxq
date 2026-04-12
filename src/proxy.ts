import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * XeroxQ — Edge Middleware
 * 
 * Protects the /admin route server-side BEFORE React renders.
 * This prevents any client-side bypass via direct URL navigation.
 * Also protects against open redirects from the auth callback.
 */

const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

function applyRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 60; // 60 requests per minute limit across proxy nodes

  const record = rateLimitMap.get(ip) || { count: 0, lastReset: now };

  if (now - record.lastReset > windowMs) {
    record.count = 1;
    record.lastReset = now;
  } else {
    record.count++;
  }

  rateLimitMap.set(ip, record);

  // prevent memory leak
  if (rateLimitMap.size > 2000) {
    rateLimitMap.clear();
  }

  return record.count > maxRequests;
}

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  
  // ── 0. API Rate Limiting protection ───────────────────────────────────────
  if (pathname.startsWith("/api/")) {
    const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown-ip";
    if (applyRateLimit(ip)) {
      return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
    }
  }

  // ── 1. Protect /admin Route ───────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    // Build a Supabase server client to read the session from cookies
    const response = NextResponse.next({
      request: { headers: request.headers },
    });

    const supabase = createServerClient(
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

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Not authenticated — redirect to login with return URL
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  // ── 2. Protect /platform-admin — CEO-only gate ─────────────────────────
  if (pathname.startsWith("/platform-admin")) {
    const response = NextResponse.next({
      request: { headers: request.headers },
    });

    const supabase = createServerClient(
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

    const { data: { user } } = await supabase.auth.getUser();

    // 1. Not logged in -> Login
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 2. Logged in but NOT the CEO -> Redirect to their own shop admin
    const ceoEmail = process.env.NEXT_PUBLIC_CEO_EMAIL;
    if (ceoEmail && user.email !== ceoEmail) {
      console.warn(`[Security] Unauthorized access attempt to /platform-admin by ${user.email}`);
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    return response;
  }

  // ── 2. Prevent Open Redirect in Auth Callback ────────────────────────────
  if (pathname === "/auth/callback") {
    const next = searchParams.get("next");
    if (next) {
      // Only allow redirects to relative paths (no external URLs)
      const isRelative = next.startsWith("/") && !next.startsWith("//") && !next.includes(":");
      if (!isRelative) {
        // Strip the dangerous `next` param and default to /admin
        const safeUrl = new URL("/auth/callback", request.url);
        const code = searchParams.get("code");
        if (code) safeUrl.searchParams.set("code", code);
        return NextResponse.redirect(safeUrl);
      }
    }
  }

  const response = NextResponse.next();

  // Add a unique request ID for tracing/logging (DevOps standard)
  const requestId = crypto.randomUUID();
  response.headers.set('x-request-id', requestId);

  return response;
}

export const config = {
  matcher: [
    // Rate limit all backend infrastructure endpoints
    "/api/:path*",
    // Match /admin and all sub-routes
    "/admin/:path*",
    // CEO-only command center
    "/platform-admin/:path*",
    // Match the auth callback for open redirect protection
    "/auth/callback",
  ],
};
