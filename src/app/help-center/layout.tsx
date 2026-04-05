import type { Metadata } from "next";

const BASE_URL = "https://xeroxq.arkio.in";

export const metadata: Metadata = {
  title: "Help Center — How to Print Documents & Find Xerox Shops | XeroxQ",
  description:
    "Get help using XeroxQ. Learn how to find a xerox shop near you, upload documents for printing, register your shop, and troubleshoot common printing issues.",
  keywords: [
    "how to use XeroxQ",
    "xerox printing help India",
    "print document help",
    "find xerox shop help",
    "XeroxQ support",
    "online printing troubleshoot",
  ],
  alternates: { canonical: `${BASE_URL}/help-center` },
  openGraph: {
    title: "XeroxQ Help Center — Printing & Xerox Shop Support",
    description: "Find answers on how to print documents, locate xerox shops, and use XeroxQ for free.",
    url: `${BASE_URL}/help-center`,
    images: [{ url: `${BASE_URL}/og-image.svg`, width: 1200, height: 630 }],
  },
};

export default function HelpCenterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
