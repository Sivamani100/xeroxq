import { MetadataRoute } from "next";

const BASE_URL = "https://xeroxq.arkio.in";
const NOW = new Date();
const CONTENT_DATE = new Date("2026-05-08");

export default function sitemap(): MetadataRoute.Sitemap {
  // Static pages with SEO optimization
  const staticPages = [
    // ── Tier 1: Highest Priority — Primary Landing Pages ──────────────────────
    {
      url: BASE_URL,
      lastModified: NOW,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: CONTENT_DATE,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: CONTENT_DATE,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/help-center`,
      lastModified: NOW,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/admin`,
      lastModified: NOW,
      changeFrequency: "daily",
      priority: 0.7,
    },

    // ── Tier 2: High Priority — Service Pages ───────────────────────────────────
    {
      url: `${BASE_URL}/document-printing-near-me`,
      lastModified: CONTENT_DATE,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/online-printing-services-india`,
      lastModified: CONTENT_DATE,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/whatsapp-printing-service`,
      lastModified: CONTENT_DATE,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/secure-document-printing-india`,
      lastModified: CONTENT_DATE,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/best-printing-services-india`,
      lastModified: CONTENT_DATE,
      changeFrequency: "weekly",
      priority: 0.8,
    },

    // ── Tier 3: Medium Priority — Content & Features ───────────────────────────
    {
      url: `${BASE_URL}/blog`,
      lastModified: NOW,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: CONTENT_DATE,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: CONTENT_DATE,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/security`,
      lastModified: CONTENT_DATE,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/pricing`,
      lastModified: CONTENT_DATE,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/mobile-app`,
      lastModified: CONTENT_DATE,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/api`,
      lastModified: CONTENT_DATE,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // Blog posts with SEO optimization
  const blogPosts = [
    {
      url: `${BASE_URL}/blog/whatsapp-virtual-number-system`,
      lastModified: CONTENT_DATE,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/blog/secure-document-printing-india`,
      lastModified: CONTENT_DATE,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/blog/online-printing-services-india`,
      lastModified: CONTENT_DATE,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/blog/document-printing-near-me`,
      lastModified: CONTENT_DATE,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/blog/best-printing-services-india`,
      lastModified: CONTENT_DATE,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/blog/whatsapp-printing-service`,
      lastModified: CONTENT_DATE,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/blog/printing-services-delhi`,
      lastModified: CONTENT_DATE,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/blog/printing-services-mumbai`,
      lastModified: CONTENT_DATE,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  // Location pages for major Indian cities
  const cities = [
    'delhi', 'mumbai', 'bangalore', 'chennai', 'kolkata', 'hyderabad',
    'pune', 'ahmedabad', 'jaipur', 'lucknow', 'kanpur', 'nagpur',
    'indore', 'thane', 'bhopal', 'visakhapatnam', 'pimpri-chinchwad',
    'patna', 'vadodara', 'ghaziabad', 'ludhiana', 'agra', 'nashik',
    'faridabad', 'meerut', 'rajkot', 'kalyan', 'vasai-virar', 'surat'
  ];

  const locationPages = cities.map(city => ({
    url: `${BASE_URL}/${city}`,
    lastModified: NOW,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  // Blog category pages
  const blogCategories = [
    'security', 'printing', 'technology', 'business', 'tutorials'
  ];

  const blogCategoryPages = blogCategories.map(category => ({
    url: `${BASE_URL}/blog/category/${category}`,
    lastModified: NOW,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticPages, ...blogPosts, ...locationPages, ...blogCategoryPages] as MetadataRoute.Sitemap;
}
