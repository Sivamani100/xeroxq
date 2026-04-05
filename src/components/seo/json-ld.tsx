/**
 * JSON-LD Structured Data Components for XeroxQ
 * 
 * These components inject schema.org JSON-LD scripts into the page <head>.
 * They are Server Components — no "use client" needed.
 * 
 * Schemas implemented:
 *   - Organization (global authority signal)
 *   - WebSite (enables Google Sitelinks Searchbox)
 *   - LocalBusiness (xerox shop / print shop context)
 *   - FAQPage (rich result FAQ accordion in SERPs)
 *   - BreadcrumbList (per-page breadcrumb rich results)
 */

const BASE_URL = "https://xeroxq.arkio.in";

// ── Organization Schema ────────────────────────────────────────────────────────
// Tells Google who XeroxQ is as a company. Appears in Knowledge Panel.
export function OrganizationJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${BASE_URL}/#organization`,
    name: "XeroxQ",
    alternateName: ["XeroxQ Print", "Xerox Q", "XQ Print"],
    url: BASE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${BASE_URL}/xeroxq_logo.png`,
      width: 512,
      height: 512,
    },
    description:
      "XeroxQ is India's privacy-first print service. Find a xerox shop near you and print documents securely online without WhatsApp or data storage.",
    foundingDate: "2026",
    areaServed: {
      "@type": "Country",
      name: "India",
    },
    serviceType: [
      "Online Printing Service",
      "Xerox Shop Finder",
      "Document Printing",
      "Photocopy Service",
      "A4 Print Service",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "support@xeroxq.arkio.in",
      availableLanguage: ["English", "Hindi"],
    },
    sameAs: [
      BASE_URL,
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ── WebSite Schema ─────────────────────────────────────────────────────────────
// Enables Google Sitelinks Search Box in SERPs when users search "XeroxQ".
export function WebSiteJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BASE_URL}/#website`,
    name: "XeroxQ",
    url: BASE_URL,
    description:
      "Find xerox shops near you and print documents online securely. No WhatsApp, no data stored. 100% free.",
    inLanguage: "en-IN",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/shops?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ── LocalBusiness Schema ───────────────────────────────────────────────────────
// Critical for "xerox near me" intent. Classifies XeroxQ as a print service.
export function LocalBusinessJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "CopyingService"],
    "@id": `${BASE_URL}/#localbusiness`,
    name: "XeroxQ — Xerox Shop & Print Service",
    description:
      "India's privacy-first xerox and print service. Find a nearby xerox shop, upload your document online, and print it securely. Supports A4, PDF, DOCX. No WhatsApp. 100% free.",
    url: BASE_URL,
    logo: `${BASE_URL}/xeroxq_logo.png`,
    image: `${BASE_URL}/og-image.svg`,
    priceRange: "Free",
    currenciesAccepted: "INR",
    paymentAccepted: "Free Service",
    areaServed: {
      "@type": "Country",
      name: "India",
    },
    serviceType: "Document Printing and Xerox Service",
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Print Services",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "A4 Document Printing",
            description: "Print A4 documents at any nearby XeroxQ shop",
          },
          price: "0",
          priceCurrency: "INR",
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "PDF Printing",
            description: "Upload and print PDF files securely at a nearby shop",
          },
          price: "0",
          priceCurrency: "INR",
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Document Photocopy",
            description: "Photocopy documents at verified XeroxQ partner shops",
          },
        },
      ],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ── FAQPage Schema ─────────────────────────────────────────────────────────────
// Shows Q&A as rich result directly in Google SERPs — massive CTR boost.
export function FAQPageJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How is XeroxQ different from standard cloud printing?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Unlike standard cloud printing, XeroxQ is decentralized. We never store your documents on a central server. Everything is encrypted locally — your file prints and vanishes. No WhatsApp, no email, no trace.",
        },
      },
      {
        "@type": "Question",
        name: "How do I find a xerox shop near me using XeroxQ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Simply visit xeroxq.arkio.in, click 'Find Shop', and we'll show you the nearest verified XeroxQ print shop. Scan the shop's QR code, upload your document, and it prints immediately.",
        },
      },
      {
        "@type": "Question",
        name: "Is XeroxQ free to use?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, XeroxQ is 100% free for both customers and shop owners. There are no platform fees, subscription charges, or hidden costs.",
        },
      },
      {
        "@type": "Question",
        name: "What document types can I print with XeroxQ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "XeroxQ supports PDF, DOCX, PNG, and JPG files. All documents are automatically normalized to high-quality A4 print format.",
        },
      },
      {
        "@type": "Question",
        name: "Is it safe to print sensitive documents through XeroxQ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Absolutely. XeroxQ uses AES-256 end-to-end encryption. The shop only receives a temporary print signal — your actual document is never stored on any server or device permanently.",
        },
      },
      {
        "@type": "Question",
        name: "How do I register my xerox shop on XeroxQ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Visit xeroxq.arkio.in/register, create a free shop admin account, and generate your unique QR poster. Customers can then scan it to send print jobs directly to your printer.",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ── BreadcrumbList Schema ──────────────────────────────────────────────────────
// For inner pages — shows breadcrumbs in Google search results.
interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
