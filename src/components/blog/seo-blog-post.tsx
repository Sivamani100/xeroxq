"use client";

import { motion } from "framer-motion";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { 
  ArrowLeft, 
  Share2, 
  Bookmark, 
  User,
  ShieldCheck,
  Zap,
  MessageCircle,
  Smartphone,
  Lock,
  Clock,
  CheckCircle2,
  ArrowRight,
  Globe,
  Users,
  FileText,
  Printer,
  TrendingUp,
  Award,
  Star
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { generateSEOMetadata, generateJsonLd, type SEOHeadProps } from "@/components/seo/seo-head";
import { generateKeywordsForPost } from "@/lib/seo-keywords";

interface BlogPostContent {
  type: 'h1' | 'h2' | 'h3' | 'p' | 'ul' | 'ol' | 'blockquote' | 'code' | 'cta';
  text?: string;
  items?: string[];
  code?: string;
  highlight?: boolean;
  author?: string;
  role?: string;
}

interface SEOBlogPostProps {
  title: string;
  description: string;
  author: string;
  role: string;
  date: string;
  readTime: string;
  category: string;
  tags: string[];
  content: BlogPostContent[];
  slug: string;
  featuredImage?: string;
  tableOfContents?: { title: string; id: string; level: number }[];
}

export function SEOBlogPost({
  title,
  description,
  author,
  role,
  date,
  readTime,
  category,
  tags,
  content,
  slug,
  featuredImage = "/blog-og.jpg",
  tableOfContents = []
}: SEOBlogPostProps) {
  const router = useRouter();

  // Generate SEO keywords
  const keywords = generateKeywordsForPost(title, category);

  // SEO metadata
  const seoProps: SEOHeadProps = {
    title,
    description,
    keywords,
    author,
    publishDate: date,
    modifiedDate: date,
    image: featuredImage,
    url: `/blog/${slug}`,
    type: 'article',
    category,
    tags
  };

  const jsonLd = generateJsonLd(seoProps);

  return (
    <>
      {/* SEO Meta Tags */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="min-h-screen bg-white">
        <SiteHeader />
        
        {/* Hero Section with SEO optimization */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#F8FAFC] via-white to-[#F1F5F9]">
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />
          
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
            {/* Breadcrumb for SEO */}
            <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
              <Link href="/" className="hover:text-black transition-colors">
                Home
              </Link>
              <span>/</span>
              <Link href="/blog" className="hover:text-black transition-colors">
                Blog
              </Link>
              <span>/</span>
              <span className="text-black font-medium">{title}</span>
            </nav>

            {/* Main Content */}
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              {/* Header */}
              <header className="space-y-6">
                {/* Category Badge */}
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-black text-white uppercase tracking-wider">
                    {category}
                  </span>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{readTime} read</span>
                  </div>
                </div>

                {/* Title with H1 for SEO */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-black leading-tight tracking-tight">
                  {title}
                </h1>

                {/* Description for SEO */}
                <p className="text-xl text-gray-600 leading-relaxed max-w-3xl">
                  {description}
                </p>

                {/* Author Info */}
                <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                  <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-black">{author}</div>
                    <div className="text-sm text-gray-600">{role}</div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {date}
                  </div>
                </div>

                {/* Social Sharing */}
                <div className="flex items-center gap-4 pt-4">
                  <button className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Bookmark className="w-4 h-4" />
                    Save
                  </button>
                </div>
              </header>

              {/* Featured Image */}
              {featuredImage && (
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-100">
                  <img
                    src={featuredImage}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Table of Contents */}
              {tableOfContents.length > 0 && (
                <nav className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h2 className="text-lg font-bold text-black mb-4">Table of Contents</h2>
                  <ul className="space-y-2">
                    {tableOfContents.map((item, index) => (
                      <li key={index}>
                        <a
                          href={`#${item.id}`}
                          className={`text-gray-600 hover:text-black transition-colors ${
                            item.level === 3 ? 'ml-4' : ''
                          }`}
                        >
                          {item.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}

              {/* Article Content */}
              <div className="prose prose-lg max-w-none">
                {content.map((block, index) => (
                  <ContentBlock key={index} block={block} />
                ))}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 pt-8 border-t border-gray-200">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Author Bio */}
              <aside className="bg-gray-50 rounded-xl p-8 border border-gray-200">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-black mb-2">About {author}</h3>
                    <p className="text-gray-600 mb-4">{role}</p>
                    <p className="text-gray-600">
                      Leading the innovation in secure printing technology at XeroxQ, 
                      transforming how India handles document privacy and security.
                    </p>
                    <div className="flex items-center gap-4 mt-4">
                      <Link
                        href="/blog"
                        className="inline-flex items-center gap-2 text-black font-medium hover:underline"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        More articles
                      </Link>
                    </div>
                  </div>
                </div>
              </aside>

              {/* Related Posts */}
              <section className="space-y-6 pt-8 border-t border-gray-200">
                <h2 className="text-2xl font-bold text-black">Related Articles</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Related posts would be dynamically loaded */}
                </div>
              </section>

              {/* CTA Section */}
              <section className="bg-gradient-to-r from-black to-gray-800 rounded-2xl p-8 text-white text-center">
                <h2 className="text-3xl font-bold mb-4">
                  Ready to Experience Secure Printing?
                </h2>
                <p className="text-xl mb-6 opacity-90">
                  Join thousands of users who trust XeroxQ for their document privacy.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-8 py-3 bg-white text-black rounded-lg font-bold hover:bg-gray-100 transition-colors"
                  >
                    <Printer className="w-5 h-5" />
                    Try XeroxQ Now
                  </Link>
                  <Link
                    href="/about"
                    className="inline-flex items-center gap-2 px-8 py-3 border border-white rounded-lg font-bold hover:bg-white hover:text-black transition-colors"
                  >
                    Learn More
                  </Link>
                </div>
              </section>
            </motion.article>
          </div>
        </section>

        <SiteFooter />
      </div>
    </>
  );
}

function ContentBlock({ block }: { block: BlogPostContent }) {
  switch (block.type) {
    case 'h1':
      return (
        <h1 id={block.text?.toLowerCase().replace(/\s+/g, '-')} className="text-4xl font-bold text-black mt-12 mb-6">
          {block.text}
        </h1>
      );
    
    case 'h2':
      return (
        <h2 id={block.text?.toLowerCase().replace(/\s+/g, '-')} className="text-3xl font-bold text-black mt-10 mb-6">
          {block.text}
        </h2>
      );
    
    case 'h3':
      return (
        <h3 id={block.text?.toLowerCase().replace(/\s+/g, '-')} className="text-2xl font-bold text-black mt-8 mb-4">
          {block.text}
        </h3>
      );
    
    case 'p':
      return (
        <p className="text-lg text-gray-700 leading-relaxed mb-6">
          {block.text}
        </p>
      );
    
    case 'ul':
      return (
        <ul className="space-y-3 mb-6">
          {block.items?.map((item, index) => (
            <li key={index} className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
              <span className="text-gray-700">{item}</span>
            </li>
          ))}
        </ul>
      );
    
    case 'ol':
      return (
        <ol className="space-y-3 mb-6 list-decimal list-inside">
          {block.items?.map((item, index) => (
            <li key={index} className="text-gray-700">
              {item}
            </li>
          ))}
        </ol>
      );
    
    case 'blockquote':
      return (
        <blockquote className={`border-l-4 border-black pl-6 py-4 my-6 ${block.highlight ? 'bg-gray-50' : ''}`}>
          <p className="text-xl italic text-gray-700">{block.text}</p>
        </blockquote>
      );
    
    case 'code':
      return (
        <pre className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto mb-6">
          <code>{block.code}</code>
        </pre>
      );
    
    case 'cta':
      return (
        <div className="bg-black text-white rounded-xl p-8 text-center my-8">
          <h3 className="text-2xl font-bold mb-4">{block.text}</h3>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-black rounded-lg font-bold hover:bg-gray-100 transition-colors"
          >
            <Printer className="w-5 h-5" />
            Get Started with XeroxQ
          </Link>
        </div>
      );
    
    default:
      return null;
  }
}
