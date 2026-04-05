import type { Metadata } from "next";

const BASE_URL = "https://xeroxq.arkio.in";

/**
 * Per-route metadata for /blog
 * Targets: "xerox printing blog", "print shop tips India", "secure printing articles"
 */
export const metadata: Metadata = {
  title: "Blog — Xerox, Printing & Privacy Insights | XeroxQ",
  description:
    "Read the latest articles on secure printing, finding xerox shops near you, A4 document printing tips, and how XeroxQ is transforming print shops across India.",
  keywords: [
    "xerox printing blog",
    "print shop tips India",
    "secure printing guide",
    "document printing online India",
    "xerox shop news",
    "A4 printing tips",
  ],
  alternates: {
    canonical: `${BASE_URL}/blog`,
  },
  openGraph: {
    title: "XeroxQ Blog — Printing, Privacy & Xerox Shop Insights",
    description:
      "Articles on secure printing, finding xerox shops, and the future of document physicalization in India.",
    url: `${BASE_URL}/blog`,
    images: [{ url: `${BASE_URL}/og-image.svg`, width: 1200, height: 630 }],
    type: "website",
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
