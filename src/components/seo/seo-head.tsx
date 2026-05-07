import { Metadata } from 'next';

export interface SEOHeadProps {
  title: string;
  description: string;
  keywords: string[];
  author?: string;
  publishDate?: string;
  modifiedDate?: string;
  image?: string;
  url?: string;
  type?: 'article' | 'website';
  category?: string;
  tags?: string[];
}

export function generateSEOMetadata(props: SEOHeadProps): Metadata {
  const {
    title,
    description,
    keywords,
    author = "XeroxQ Team",
    publishDate,
    modifiedDate,
    image = "/og-image.jpg",
    url,
    type = 'article',
    category,
    tags
  } = props;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://xeroxq.com';
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;

  return {
    title,
    description,
    keywords: keywords.join(', '),
    authors: [{ name: author }],
    openGraph: {
      type,
      title,
      description,
      url: fullUrl,
      siteName: 'XeroxQ',
      images: [
        {
          url: image.startsWith('http') ? image : `${siteUrl}${image}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      publishedTime: publishDate,
      modifiedTime: modifiedDate,
      section: category,
      tags: tags || keywords,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image.startsWith('http') ? image : `${siteUrl}${image}`],
      creator: '@xeroxq',
      site: '@xeroxq',
    },
    alternates: {
      canonical: fullUrl,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export function generateJsonLd(props: SEOHeadProps) {
  const {
    title,
    description,
    author,
    publishDate,
    modifiedDate,
    image,
    url,
    category,
    tags
  } = props;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://xeroxq.com';
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    image: image.startsWith('http') ? image : `${siteUrl}${image}`,
    url: fullUrl,
    datePublished: publishDate,
    dateModified: modifiedDate || publishDate,
    author: {
      '@type': 'Organization',
      name: author,
      url: siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'XeroxQ',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': fullUrl,
    },
    keywords: tags?.join(', ') || '',
    articleSection: category,
    inLanguage: 'en-US',
  };
}
