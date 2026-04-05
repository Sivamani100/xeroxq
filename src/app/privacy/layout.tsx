import type { Metadata } from "next";

const BASE_URL = "https://xeroxq.arkio.in";

export const metadata: Metadata = {
  title: "Privacy Policy — How XeroxQ Protects Your Data | XeroxQ",
  description:
    "Read XeroxQ's privacy policy. We never store your printed documents, never share your data, and use AES-256 encryption throughout. Your privacy is our protocol.",
  alternates: { canonical: `${BASE_URL}/privacy` },
  robots: { index: true, follow: false },
  openGraph: {
    title: "XeroxQ Privacy Policy — Zero Data Retention",
    description: "We never store your documents. Read our full privacy protocol.",
    url: `${BASE_URL}/privacy`,
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
