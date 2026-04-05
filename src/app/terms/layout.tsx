import type { Metadata } from "next";

const BASE_URL = "https://xeroxq.arkio.in";

export const metadata: Metadata = {
  title: "Terms of Service — XeroxQ Print Platform | XeroxQ",
  description:
    "XeroxQ's terms of service for using our free online xerox and document printing platform. Understand your rights, our responsibilities, and usage guidelines.",
  alternates: { canonical: `${BASE_URL}/terms` },
  robots: { index: true, follow: false },
  openGraph: {
    title: "XeroxQ Terms of Service",
    description: "Terms for using XeroxQ's free online xerox and print platform.",
    url: `${BASE_URL}/terms`,
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
