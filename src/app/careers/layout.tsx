import type { Metadata } from "next";

const BASE_URL = "https://xeroxq.arkio.in";

export const metadata: Metadata = {
  title: "Careers — Work at XeroxQ | India's Print-Tech Startup",
  description:
    "Join the XeroxQ team and help build India's most trusted xerox shop and document printing platform. We're hiring engineers, designers, and business development professionals.",
  keywords: [
    "XeroxQ careers",
    "print tech startup India jobs",
    "startup jobs India",
    "tech jobs India 2026",
    "XeroxQ hiring",
  ],
  alternates: { canonical: `${BASE_URL}/careers` },
  openGraph: {
    title: "XeroxQ Careers — Join India's Print-Tech Revolution",
    description: "Help build India's most trusted xerox shop and document printing platform. We're hiring.",
    url: `${BASE_URL}/careers`,
    images: [{ url: `${BASE_URL}/og-image.svg`, width: 1200, height: 630 }],
  },
};

export default function CareersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
