import type { Metadata } from "next";

const BASE_URL = "https://xeroxq.arkio.in";

export const metadata: Metadata = {
  title: "Community — Xerox Shop Owners & Print Professionals | XeroxQ",
  description:
    "Join thousands of xerox shop owners and print professionals using XeroxQ across India. Share insights, get support, and grow your print business for free.",
  keywords: [
    "xerox shop community India",
    "print shop owners network",
    "xerox business tips",
    "print shop forum India",
    "XeroxQ community",
  ],
  alternates: { canonical: `${BASE_URL}/community` },
  openGraph: {
    title: "XeroxQ Community — Xerox Shop Owners & Print Professionals",
    description: "Join thousands of xerox and print shop owners across India on the XeroxQ network.",
    url: `${BASE_URL}/community`,
    images: [{ url: `${BASE_URL}/og-image.svg`, width: 1200, height: 630 }],
  },
};

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
