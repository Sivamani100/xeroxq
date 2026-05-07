import { Metadata } from 'next';

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
  openGraph?: {
    title?: string;
    description?: string;
    url?: string;
    type?: 'website' | 'article' | 'product';
    images?: Array<{
      url: string;
      width?: number;
      height?: number;
      alt?: string;
    }>;
  };
  twitter?: {
    card?: 'summary' | 'summary_large_image';
    title?: string;
    description?: string;
    images?: string[];
  };
  alternate?: {
    canonical?: string;
    languages?: Record<string, string>;
  };
  jsonLd?: Record<string, any>[];
}

const BASE_URL = 'https://xeroxq.arkio.in';

export function generateMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description,
    keywords = [],
    canonical,
    noindex = false,
    nofollow = false,
    openGraph,
    twitter,
    alternate,
    jsonLd
  } = config;

  const canonicalUrl = canonical || BASE_URL;
  
  // Default OpenGraph config
  const defaultOpenGraph = {
    title: title,
    description: description,
    url: canonicalUrl,
    siteName: 'XeroxQ',
    locale: 'en_IN',
    type: 'website' as const,
    images: [
      {
        url: `${BASE_URL}/og-image.svg`,
        width: 1200,
        height: 630,
        alt: title,
      },
    ],
  };

  // Default Twitter config
  const defaultTwitter = {
    card: 'summary_large_image' as const,
    title: title,
    description: description,
    images: [`${BASE_URL}/og-image.svg`],
  };

  return {
    title: {
      default: title,
      template: '%s | XeroxQ',
    },
    description,
    keywords: keywords.join(', '),
    authors: [{ name: 'XeroxQ Team' }],
    creator: 'XeroxQ Team',
    publisher: 'XeroxQ',
    robots: {
      index: !noindex,
      follow: !nofollow,
      googleBot: {
        index: !noindex,
        follow: !nofollow,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: { ...defaultOpenGraph, ...openGraph },
    twitter: { ...defaultTwitter, ...twitter },
    alternates: {
      canonical: canonicalUrl,
      ...alternate,
    },
    metadataBase: new URL(BASE_URL),
    verification: {
      google: 'zAZIwBcueJ0zXcjzyVS-DexvshYM0ImpIiSwVEodrsY',
    },
    other: {
      jsonLd: jsonLd ? JSON.stringify(jsonLd) : undefined,
    } as Record<string, any>,
  };
}

// Predefined SEO configs for different page types
export const SEO_CONFIGS = {
  HOME: {
    title: 'XeroxQ | Xerox Shop Near Me — Print Documents Online, Securely',
    description: 'XeroxQ is India\'s privacy-first print service. Find a xerox shop near you, upload documents online and print securely. Supports A4, PDF, DOCX — no WhatsApp, no data stored. 100% free.',
    keywords: [
      'xerox shop near me',
      'xerox near me',
      'print shop online',
      'xerox pages online',
      'A4 print online',
      'photocopy shop',
      'document printing service India',
      'send document to print shop',
      'online printing service',
      'xerox document online',
      'privacy print',
      'secure printing',
      'cloud printing India',
      'print without WhatsApp',
      'XeroxQ',
      'xerox shop India',
      'print A4 pages',
      'print shop finder',
    ],
    openGraph: {
      type: 'website' as const,
    },
  },
  BLOG: {
    title: 'XeroxQ Blog | Secure Printing Tips & Document Management',
    description: 'Expert insights on secure document printing, WhatsApp printing alternatives, and digital document management. Learn how to protect your privacy while printing.',
    keywords: [
      'secure printing blog',
      'document management tips',
      'privacy printing',
      'digital printing guide',
      'XeroxQ blog',
      'printing security',
      'document privacy',
    ],
    openGraph: {
      type: 'website' as const,
    },
  },
  ABOUT: {
    title: 'About XeroxQ | India\'s Most Secure Document Printing Platform',
    description: 'Learn about XeroxQ\'s mission to revolutionize document printing in India with privacy-first technology, zero-knowledge encryption, and secure local printing.',
    keywords: [
      'about XeroxQ',
      'secure printing platform',
      'document privacy India',
      'XeroxQ mission',
      'printing technology',
      'zero-knowledge encryption',
    ],
    openGraph: {
      type: 'website' as const,
    },
  },
  CONTACT: {
    title: 'Contact XeroxQ | Join India\'s Largest Secure Printing Network',
    description: 'Contact XeroxQ to join India\'s largest secure printing network. Register your xerox shop, get support, or learn more about our privacy-first printing solutions.',
    keywords: [
      'contact XeroxQ',
      'join printing network',
      'xerox shop registration',
      'printing support',
      'XeroxQ contact',
    ],
    openGraph: {
      type: 'website' as const,
    },
  },
};

// Dynamic metadata generation for blog posts
export function generateBlogMetadata(post: {
  title: string;
  description: string;
  keywords?: string[];
  publishDate?: string;
  modifiedDate?: string;
  author?: string;
  category?: string;
  slug: string;
  image?: string;
}): Metadata {
  const canonicalUrl = `${BASE_URL}/blog/${post.slug}`;
  
  return generateMetadata({
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    canonical: canonicalUrl,
    openGraph: {
      title: post.title,
      description: post.description,
      url: canonicalUrl,
      type: 'article',
      images: post.image ? [{
        url: post.image.startsWith('http') ? post.image : `${BASE_URL}${post.image}`,
        width: 1200,
        height: 630,
        alt: post.title,
      }] : undefined,
    },
    twitter: {
      title: post.title,
      description: post.description,
      images: post.image ? [post.image.startsWith('http') ? post.image : `${BASE_URL}${post.image}`] : undefined,
    },
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.description,
        image: post.image ? (post.image.startsWith('http') ? post.image : `${BASE_URL}${post.image}`) : `${BASE_URL}/og-image.svg`,
        url: canonicalUrl,
        datePublished: post.publishDate,
        dateModified: post.modifiedDate || post.publishDate,
        author: {
          '@type': 'Organization',
          name: post.author || 'XeroxQ Team',
          url: BASE_URL,
        },
        publisher: {
          '@type': 'Organization',
          name: 'XeroxQ',
          logo: {
            '@type': 'ImageObject',
            url: `${BASE_URL}/ion_print.png`,
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': canonicalUrl,
        },
        keywords: post.keywords?.join(', ') || '',
        articleSection: post.category,
        inLanguage: 'en-IN',
      },
    ],
  });
}

// Location-based metadata
export function generateLocationMetadata(city: string, state: string = 'India'): Metadata {
  const canonicalUrl = `${BASE_URL}/${city.toLowerCase().replace(/\s+/g, '-')}`;
  
  return generateMetadata({
    title: `Xerox Shop in ${city} | Print Documents Online | XeroxQ`,
    description: `Find the best xerox shops in ${city} with XeroxQ. Upload documents online and print securely at local shops. Privacy-first printing service in ${city}, ${state}.`,
    keywords: [
      `xerox shop ${city}`,
      `xerox near me ${city}`,
      `printing service ${city}`,
      `document printing ${city}`,
      `photocopy shop ${city}`,
      `online printing ${city}`,
      `XeroxQ ${city}`,
    ],
    canonical: canonicalUrl,
    openGraph: {
      title: `Xerox Shop in ${city} | Print Documents Online | XeroxQ`,
      description: `Find the best xerox shops in ${city} with XeroxQ. Upload documents online and print securely at local shops.`,
      url: canonicalUrl,
    },
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: `XeroxQ ${city}`,
        description: `Secure document printing service in ${city}, ${state}`,
        url: canonicalUrl,
        address: {
          '@type': 'PostalAddress',
          addressLocality: city,
          addressCountry: 'IN',
        },
        geo: {
          '@type': 'GeoCircle',
          geoMidpoint: {
            '@type': 'GeoCoordinates',
            addressCountry: 'IN',
            addressLocality: city,
          },
          geoRadius: '50000',
        },
        areaServed: {
          '@type': 'City',
          name: city,
        },
      },
    ],
  });
}
