import type { Metadata } from "next";

const BASE_URL = "https://xeroxq.arkio.in";

export const metadata: Metadata = {
  title: "Use Cases — Students, Travelers & Businesses | XeroxQ",
  description:
    "Discover how students, travelers, businesses, and professionals use XeroxQ to print documents at any xerox shop across India — securely, instantly, and for free.",
  keywords: [
    "print documents for students India",
    "office document printing online",
    "print while traveling India",
    "business document printing service",
    "print A4 documents online India",
    "how to use xerox shop online",
  ],
  alternates: { canonical: `${BASE_URL}/use-cases` },
  openGraph: {
    title: "XeroxQ Use Cases — Print for Students, Business & Everyone",
    description: "See how anyone can use XeroxQ to find a xerox shop and print securely across India.",
    url: `${BASE_URL}/use-cases`,
    images: [{ url: `${BASE_URL}/og-image.svg`, width: 1200, height: 630 }],
  },
};

export default function UseCasesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
