import { MetadataRoute } from "next";

const BASE_URL = "https://xeroxq.arkio.in";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Allow all major search engine crawlers
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",         // Shop admin panel — not for indexing
          "/api/",           // Internal API routes
          "/auth/",          // Auth callback routes
          "/login",          // Login page
          "/register",       // Registration (not search-relevant)
          "/_next/",         // Next.js internals (already blocked by default)
          "/private/",       // Any future private routes
        ],
      },
      {
        // Explicitly allow Googlebot's full crawl budget on public pages
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/auth/",
          "/login",
          "/register",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
