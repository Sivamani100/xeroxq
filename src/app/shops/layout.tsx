import type { Metadata } from "next";

const BASE_URL = "https://xeroxq.arkio.in";

/**
 * Per-route metadata for /shops
 * HIGHEST PRIORITY page — targets "xerox shop near me" intent directly.
 */
export const metadata: Metadata = {
  title: "Find Xerox Shops Near Me — Print Document Online | XeroxQ",
  description:
    "Locate verified xerox shops near you across India. Upload your document and print it at the nearest XeroxQ shop — instantly, securely, for free. Supports PDF, DOCX, A4.",
  keywords: [
    "xerox shop near me",
    "print shop near me",
    "xerox near me India",
    "find xerox shop",
    "nearest xerox shop",
    "photocopy shop near me",
    "A4 print shop",
    "document printing near me",
    "online print shop India",
    "send file to printer near me",
  ],
  alternates: {
    canonical: `${BASE_URL}/shops`,
  },
  openGraph: {
    title: "Find a Xerox Shop Near You — XeroxQ",
    description:
      "Locate verified xerox and print shops near you across India. Upload your document and print in seconds.",
    url: `${BASE_URL}/shops`,
    images: [{ url: `${BASE_URL}/og-image.svg`, width: 1200, height: 630 }],
  },
};

export default function ShopsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
