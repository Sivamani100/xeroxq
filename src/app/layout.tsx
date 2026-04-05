import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://xeroxq.arkio.in"),
  title: "XeroxQ | Privacy-First Print",
  description: "Secure, anonymous cloud printing for your local Xerox shop. No WhatsApp required.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "XeroxQ",
  },
  openGraph: {
    title: "XeroxQ | Privacy-First Print",
    description: "Send documents to your local print shop securely. No WhatsApp, no hassle.",
    url: "https://xeroxq.arkio.in",
    siteName: "XeroxQ",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "XeroxQ | Privacy-First Print",
    description: "Send documents to your local print shop securely. No WhatsApp, no hassle.",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import { CookieConsent } from "@/components/layout/cookie-consent";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen antialiased selection:bg-brand-primary/30`}>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
