import type { Metadata } from "next";

const BASE_URL = "https://xeroxq.arkio.in";

/**
 * Per-route metadata for /how-it-works
 * Targets: "how does online printing work", "how to print documents online", "xerox print process"
 */
export const metadata: Metadata = {
  title: "How It Works — Secure Xerox & Online Printing | XeroxQ",
  description:
    "See exactly how XeroxQ lets you print documents at any xerox shop near you. Upload your file, scan the QR code, print instantly. AES-256 encrypted. No data stored.",
  keywords: [
    "how to print documents online",
    "how to use xerox shop online",
    "secure document printing India",
    "online xerox printing process",
    "send document to xerox shop",
    "print without WhatsApp India",
  ],
  alternates: {
    canonical: `${BASE_URL}/how-it-works`,
  },
  openGraph: {
    title: "How XeroxQ Works — Find Xerox Shops & Print Securely",
    description:
      "Upload your document, scan a QR at your nearest xerox shop, and print in seconds. Zero data stored. AES-256 encrypted. Free.",
    url: `${BASE_URL}/how-it-works`,
    images: [{ url: `${BASE_URL}/og-image.svg`, width: 1200, height: 630 }],
  },
};

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
