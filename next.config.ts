import type { NextConfig } from "next";

const PRODUCTION_URL = "https://xeroxq.arkio.in";

// ─── Security Headers ────────────────────────────────────────────────────────
const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    // Allow Supabase, Google Fonts, and self. Restrict everything else.
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",          // Next.js RSC hydration requires this
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://eisdlhbrigmwsfycvkdy.supabase.co",
      "connect-src 'self' https://eisdlhbrigmwsfycvkdy.supabase.co wss://eisdlhbrigmwsfycvkdy.supabase.co https://www.ilovepdf.com",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // ── Canonical production URL ────────────────────────────────────────────────
  // Used by Next metadata for OG tags, sitemaps, etc.
  // Value: https://xeroxq.arkio.in

  // ── Serverless-safe native binary packages ──────────────────────────────────
  // These use native binaries — never bundle them with webpack.
  // @sparticuz/chromium ships a real Chromium binary; bundling breaks it.
  serverExternalPackages: [
    "@sparticuz/chromium",
    "puppeteer-core",
  ],

  // ── Image optimization ──────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "eisdlhbrigmwsfycvkdy.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    // Serve modern formats for production
    formats: ["image/avif", "image/webp"],
  },

  // ── HTTP Security Headers ───────────────────────────────────────────────────
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  // ── Redirects ────────────────────────────────────────────────────────────────
  async redirects() {
    return [
      // www → apex redirect (handle in your DNS too, but belt-and-suspenders)
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.xeroxq.arkio.in" }],
        destination: `${PRODUCTION_URL}/:path*`,
        permanent: true,
      },
    ];
  },

  // ── Compiler options ─────────────────────────────────────────────────────────
  compiler: {
    // Remove console.log in production builds (keep .error and .warn)
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },

  // ── Power options ────────────────────────────────────────────────────────────
  poweredByHeader: false,        // Remove "X-Powered-By: Next.js" from responses
  reactStrictMode: true,         // Catch React lifecycle bugs in development

  // ── Experimental ─────────────────────────────────────────────────────────────
  experimental: {},
};

export default nextConfig;
