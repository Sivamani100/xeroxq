import { MetadataRoute } from "next";

const BASE_URL = "https://xeroxq.arkio.in";
const NOW = new Date();
const CONTENT_DATE = new Date("2026-04-05");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    // ── Tier 1: Highest Priority — Primary Landing Pages ──────────────────────
    {
      url: BASE_URL,
      lastModified: NOW,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/how-it-works`,
      lastModified: CONTENT_DATE,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/shops`,
      lastModified: NOW,
      changeFrequency: "daily",       // Shop directory changes frequently
      priority: 0.9,
    },

    // ── Tier 2: High Priority — Service & Feature Pages ───────────────────────
    {
      url: `${BASE_URL}/use-cases`,
      lastModified: CONTENT_DATE,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/enterprise`,
      lastModified: CONTENT_DATE,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/integrations`,
      lastModified: CONTENT_DATE,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/demo-request`,
      lastModified: CONTENT_DATE,
      changeFrequency: "monthly",
      priority: 0.7,
    },

    // ── Tier 3: Medium Priority — Community & Content Pages ───────────────────
    {
      url: `${BASE_URL}/blog`,
      lastModified: NOW,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/community`,
      lastModified: NOW,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/case-studies`,
      lastModified: CONTENT_DATE,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/partners`,
      lastModified: CONTENT_DATE,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/help-center`,
      lastModified: NOW,
      changeFrequency: "weekly",
      priority: 0.6,
    },

    // ── Tier 4: Lower Priority — Corporate & Legal Pages ──────────────────────
    {
      url: `${BASE_URL}/careers`,
      lastModified: CONTENT_DATE,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date("2026-04-04"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date("2026-04-04"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/cookies`,
      lastModified: new Date("2026-04-04"),
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
