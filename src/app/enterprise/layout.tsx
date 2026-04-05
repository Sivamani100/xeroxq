import type { Metadata } from "next";

const BASE_URL = "https://xeroxq.arkio.in";

export const metadata: Metadata = {
  title: "Enterprise Printing Solutions — Bulk & Secure | XeroxQ",
  description:
    "XeroxQ Enterprise offers bulk document printing, secure workflow integration, and a managed xerox shop network for businesses and institutions across India. Talk to us.",
  keywords: [
    "enterprise document printing India",
    "bulk printing service India",
    "business xerox printing solution",
    "secure printing for offices",
    "managed print service India",
    "corporate document printing",
  ],
  alternates: { canonical: `${BASE_URL}/enterprise` },
  openGraph: {
    title: "XeroxQ Enterprise — Bulk & Secure Document Printing for Business",
    description: "Managed xerox and print solutions for businesses, schools, and institutions across India.",
    url: `${BASE_URL}/enterprise`,
    images: [{ url: `${BASE_URL}/og-image.svg`, width: 1200, height: 630 }],
  },
};

export default function EnterpriseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
