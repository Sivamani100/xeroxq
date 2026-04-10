import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const BASE_URL = "https://xeroxq.arkio.in";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  // ── Core Identity ─────────────────────────────────────────────────────────
  title: {
    default: "XeroxQ | Xerox Shop Near Me — Print Documents Online, Securely",
    template: "%s | XeroxQ",
  },
  description:
    "XeroxQ is India's privacy-first print service. Find a xerox shop near you, upload documents online and print securely. Supports A4, PDF, DOCX — no WhatsApp, no data stored. 100% free.",
  keywords: [
    "xerox shop near me",
    "xerox near me",
    "print shop online",
    "xerox pages online",
    "A4 print online",
    "photocopy shop",
    "document printing service India",
    "send document to print shop",
    "online printing service",
    "xerox document online",
    "privacy print",
    "secure printing",
    "cloud printing India",
    "print without WhatsApp",
    "XeroxQ",
    "xerox shop India",
    "print A4 pages",
    "print shop finder",
  ],

  // ── Canonical ─────────────────────────────────────────────────────────────
  alternates: {
    canonical: BASE_URL,
  },

  // ── Google Site Verification ───────────────────────────────────────────────
  verification: {
    google: "zAZIwBcueJ0zXcjzyVS-DexvshYM0ImpIiSwVEodrsY",
  },

  // ── PWA / Icons ───────────────────────────────────────────────────────────
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "XeroxQ",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/ion_print.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [
      { url: "/ion_print.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/ion_print.png",
  },

  // ── Open Graph ────────────────────────────────────────────────────────────
  openGraph: {
    title: "XeroxQ | Xerox Shop Near Me — Print Documents Online, Securely",
    description:
      "Find a xerox shop, upload your document online, and print it securely in minutes. Privacy-first. No WhatsApp. 100% free.",
    url: BASE_URL,
    siteName: "XeroxQ",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: `${BASE_URL}/og-image.svg`,
        width: 1200,
        height: 630,
        alt: "XeroxQ — Find Xerox Shops Online, Print Securely",
      },
    ],
  },

  // ── Twitter / X Card ─────────────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: "XeroxQ | Xerox Shop Near Me — Print Documents Online",
    description:
      "Find a xerox shop, upload documents online, print securely. No WhatsApp, no data stored. 100% free.",
    images: [`${BASE_URL}/og-image.svg`],
  },

  // ── Robots ────────────────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ── Category ─────────────────────────────────────────────────────────────
  category: "technology",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import { CookieConsent } from "@/components/layout/cookie-consent";
import Script from "next/script";
import {
  OrganizationJsonLd,
  WebSiteJsonLd,
  LocalBusinessJsonLd,
  FAQPageJsonLd,
} from "@/components/seo/json-ld";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN" className="dark" suppressHydrationWarning>
      <head>
        {/* ── Structured Data (JSON-LD) ── */}
        <OrganizationJsonLd />
        <WebSiteJsonLd />
        <LocalBusinessJsonLd />
        <FAQPageJsonLd />
      </head>
      <body className={`${inter.className} min-h-screen antialiased selection:bg-brand-primary/30`}>

        {/* ── Google Analytics 4 (GA4) ──────────────────────────────────────────
            Measurement ID: G-9HSQS64CK5
            strategy="afterInteractive" fires after page hydration — zero
            impact on LCP / CLS / FID Core Web Vitals scores.
            Placed in root layout = automatically fires on EVERY page. ────── */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-9HSQS64CK5"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-9HSQS64CK5', {
              page_path: window.location.pathname,
              send_page_view: true
            });
          `}
        </Script>

        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
