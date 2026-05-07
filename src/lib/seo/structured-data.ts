export interface OrganizationSchema {
  '@context': string;
  '@type': 'Organization';
  name: string;
  description: string;
  url: string;
  logo: string;
  contactPoint: {
    '@type': 'ContactPoint';
    telephone: string;
    contactType: string;
    availableLanguage: string[];
  };
  sameAs: string[];
  address: {
    '@type': 'PostalAddress';
    addressCountry: string;
    addressLocality: string;
  };
  foundingDate: string;
  numberOfEmployees: string;
}

export interface WebSiteSchema {
  '@context': string;
  '@type': 'WebSite';
  name: string;
  url: string;
  description: string;
  potentialAction: {
    '@type': 'SearchAction';
    target: string;
    'query-input': string;
  };
  publisher: {
    '@type': 'Organization';
    name: string;
    url: string;
  };
}

export interface LocalBusinessSchema {
  '@context': string;
  '@type': 'LocalBusiness';
  name: string;
  description: string;
  url: string;
  telephone: string;
  address: {
    '@type': 'PostalAddress';
    addressCountry: string;
    addressLocality: string;
    addressRegion?: string;
    postalCode?: string;
    streetAddress?: string;
  };
  geo: {
    '@type': 'GeoCircle';
    geoMidpoint: {
      '@type': 'GeoCoordinates';
      addressCountry: string;
      addressLocality: string;
    };
    geoRadius: string;
  };
  areaServed: {
    '@type': 'City';
    name: string;
  };
  openingHours: string[];
  priceRange: string;
  paymentAccepted: string[];
}

export interface FAQPageSchema {
  '@context': string;
  '@type': 'FAQPage';
  mainEntity: Array<{
    '@type': 'Question';
    name: string;
    acceptedAnswer: {
      '@type': 'Answer';
      text: string;
    };
  }>;
}

export interface ArticleSchema {
  '@context': string;
  '@type': 'Article' | 'BlogPosting';
  headline: string;
  description: string;
  image: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  author: {
    '@type': 'Organization' | 'Person';
    name: string;
    url?: string;
  };
  publisher: {
    '@type': 'Organization';
    name: string;
    logo: {
      '@type': 'ImageObject';
      url: string;
    };
  };
  mainEntityOfPage: {
    '@type': 'WebPage';
    '@id': string;
  };
  keywords?: string;
  articleSection?: string;
  inLanguage: string;
}

export interface BreadcrumbListSchema {
  '@context': string;
  '@type': 'BreadcrumbList';
  itemListElement: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }>;
}

export interface ProductSchema {
  '@context': string;
  '@type': 'Product';
  name: string;
  description: string;
  brand: {
    '@type': 'Brand';
    name: string;
  };
  offers: {
    '@type': 'Offer';
    price: string;
    priceCurrency: string;
    availability: string;
    seller: {
      '@type': 'Organization';
      name: string;
    };
  };
  aggregateRating?: {
    '@type': 'AggregateRating';
    ratingValue: string;
    reviewCount: string;
  };
  review?: Array<{
    '@type': 'Review';
    author: {
      '@type': 'Person';
      name: string;
    };
    reviewRating: {
      '@type': 'Rating';
      ratingValue: string;
    };
    reviewBody: string;
  }>;
}

export interface WebApplicationSchema {
  '@context': string;
  '@type': 'WebApplication';
  name: string;
  description: string;
  url: string;
  applicationCategory: string;
  operatingSystem: string;
  offers: {
    '@type': 'Offer';
    price: string;
    priceCurrency: string;
  };
  featureList: string[];
  screenshot: string;
  softwareVersion: string;
  author: {
    '@type': 'Organization';
    name: string;
  };
  publisher: {
    '@type': 'Organization';
    name: string;
  };
}

export interface SearchActionSchema {
  '@context': string;
  '@type': 'WebSite';
  url: string;
  potentialAction: {
    '@type': 'SearchAction';
    target: string;
    'query-input': string;
  };
}

// Schema generators
export function generateOrganizationSchema(): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'XeroxQ',
    description: 'India\'s privacy-first document printing platform. Find xerox shops near you, upload documents online, and print securely without WhatsApp.',
    url: 'https://xeroxq.arkio.in',
    logo: 'https://xeroxq.arkio.in/ion_print.png',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91 9849497911',
      contactType: 'customer service',
      availableLanguage: ['English', 'Hindi', 'Telugu', 'Tamil', 'Bengali', 'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi'],
    },
    sameAs: [
      'https://twitter.com/xeroxq',
      'https://facebook.com/xeroxq',
      'https://linkedin.com/company/xeroxq',
      'https://instagram.com/xeroxq',
    ],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IN',
      addressLocality: 'Hyderabad',
    },
    foundingDate: '2024',
    numberOfEmployees: '11-50',
  };
}

export function generateWebSiteSchema(): WebSiteSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'XeroxQ',
    url: 'https://xeroxq.arkio.in',
    description: 'India\'s most secure document printing platform. Find xerox shops, upload documents online, and print securely.',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://xeroxq.arkio.in/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: 'XeroxQ',
      url: 'https://xeroxq.arkio.in',
    },
  };
}

export function generateLocalBusinessSchema(city?: string): LocalBusinessSchema {
  const baseUrl = 'https://xeroxq.arkio.in';
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: city ? `XeroxQ ${city}` : 'XeroxQ',
    description: `Secure document printing service${city ? ` in ${city}` : ' across India'}. Upload documents online and print at local shops with privacy protection.`,
    url: city ? `${baseUrl}/${city.toLowerCase().replace(/\s+/g, '-')}` : baseUrl,
    telephone: '+91 9849497911',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IN',
      addressLocality: city || 'Multiple Cities',
      addressRegion: city ? undefined : 'Multiple States',
    },
    geo: {
      '@type': 'GeoCircle',
      geoMidpoint: {
        '@type': 'GeoCoordinates',
        addressCountry: 'IN',
        addressLocality: city || 'Multiple Cities',
      },
      geoRadius: '50000',
    },
    areaServed: {
      '@type': 'City',
      name: city || 'All India',
    },
    openingHours: [
      'Mo-Su 00:00-23:59',
    ],
    priceRange: '$',
    paymentAccepted: ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking'],
  };
}

export function generateFAQPageSchema(faqs: Array<{ question: string; answer: string }>): FAQPageSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function generateArticleSchema(article: {
  headline: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
  category?: string;
  keywords?: string;
  image?: string;
}): ArticleSchema {
  const baseUrl = 'https://xeroxq.arkio.in';
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.headline,
    description: article.description,
    image: article.image || `${baseUrl}/og-image.svg`,
    url: article.url,
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    author: {
      '@type': 'Organization',
      name: article.author || 'XeroxQ Team',
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'XeroxQ',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/ion_print.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url,
    },
    keywords: article.keywords,
    articleSection: article.category,
    inLanguage: 'en-IN',
  };
}

export function generateBreadcrumbSchema(breadcrumbs: Array<{ name: string; url: string }>): BreadcrumbListSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((breadcrumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: breadcrumb.name,
      item: breadcrumb.url,
    })),
  };
}

export function generateWebApplicationSchema(): WebApplicationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'XeroxQ',
    description: 'India\'s privacy-first document printing platform. Find xerox shops, upload documents online, and print securely.',
    url: 'https://xeroxq.arkio.in',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
    },
    featureList: [
      'Secure document printing',
      'Privacy-first technology',
      'Zero-knowledge encryption',
      'Local shop discovery',
      'Online document upload',
      'WhatsApp alternative',
      'Real-time job tracking',
      'Mobile app support',
    ],
    screenshot: 'https://xeroxq.arkio.in/og-image.svg',
    softwareVersion: '1.0.0',
    author: {
      '@type': 'Organization',
      name: 'XeroxQ',
    },
    publisher: {
      '@type': 'Organization',
      name: 'XeroxQ',
    },
  };
}

export function generateSearchActionSchema(): SearchActionSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: 'https://xeroxq.arkio.in',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://xeroxq.arkio.in/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };
}
