import Script from 'next/script';
import { 
  generateOrganizationSchema, 
  generateWebSiteSchema, 
  generateLocalBusinessSchema, 
  generateFAQPageSchema, 
  generateArticleSchema, 
  generateBreadcrumbSchema, 
  generateWebApplicationSchema,
  generateSearchActionSchema 
} from '@/lib/seo/structured-data';

interface StructuredDataProps {
  type: 'organization' | 'website' | 'localBusiness' | 'faq' | 'article' | 'breadcrumb' | 'webApplication' | 'searchAction';
  data?: any;
  children?: never;
}

export function StructuredData({ type, data }: StructuredDataProps) {
  let schema: any = {};

  switch (type) {
    case 'organization':
      schema = generateOrganizationSchema();
      break;
    case 'website':
      schema = generateWebSiteSchema();
      break;
    case 'localBusiness':
      schema = generateLocalBusinessSchema(data?.city);
      break;
    case 'faq':
      schema = generateFAQPageSchema(data?.faqs || []);
      break;
    case 'article':
      schema = generateArticleSchema(data);
      break;
    case 'breadcrumb':
      schema = generateBreadcrumbSchema(data?.breadcrumbs || []);
      break;
    case 'webApplication':
      schema = generateWebApplicationSchema();
      break;
    case 'searchAction':
      schema = generateSearchActionSchema();
      break;
  }

  return (
    <Script
      id={`structured-data-${type}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      strategy="beforeInteractive"
    />
  );
}

// Combined structured data component for multiple schemas
export function CombinedStructuredData({ schemas }: { schemas: Array<{ type: StructuredDataProps['type']; data?: any }> }) {
  const combinedSchemas = schemas.map(({ type, data }) => {
    switch (type) {
      case 'organization':
        return generateOrganizationSchema();
      case 'website':
        return generateWebSiteSchema();
      case 'localBusiness':
        return generateLocalBusinessSchema(data?.city);
      case 'faq':
        return generateFAQPageSchema(data?.faqs || []);
      case 'article':
        return generateArticleSchema(data);
      case 'breadcrumb':
        return generateBreadcrumbSchema(data?.breadcrumbs || []);
      case 'webApplication':
        return generateWebApplicationSchema();
      case 'searchAction':
        return generateSearchActionSchema();
      default:
        return {};
    }
  });

  return (
    <Script
      id="combined-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(combinedSchemas) }}
      strategy="beforeInteractive"
    />
  );
}

// Specific components for common use cases
export function OrganizationStructuredData() {
  return <StructuredData type="organization" />;
}

export function WebSiteStructuredData() {
  return <StructuredData type="website" />;
}

export function LocalBusinessStructuredData({ city }: { city?: string }) {
  return <StructuredData type="localBusiness" data={{ city }} />;
}

export function FAQStructuredData({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
  return <StructuredData type="faq" data={{ faqs }} />;
}

export function ArticleStructuredData({ article }: { article: any }) {
  return <StructuredData type="article" data={article} />;
}

export function BreadcrumbStructuredData({ breadcrumbs }: { breadcrumbs: Array<{ name: string; url: string }> }) {
  return <StructuredData type="breadcrumb" data={{ breadcrumbs }} />;
}

export function WebApplicationStructuredData() {
  return <StructuredData type="webApplication" />;
}

export function SearchActionStructuredData() {
  return <StructuredData type="searchAction" />;
}
