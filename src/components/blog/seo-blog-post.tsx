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
  featuredImage = "/og-image.svg",
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
      
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#111113] text-[#171717] dark:text-[#EDEDED]">
        <SiteHeader />
        
        {/* Hero Section with SEO optimization */}
        <section className="relative overflow-hidden bg-[#F4F4F5] dark:bg-[#161618] border-b border-[#171717]/[0.08] dark:border-white/[0.08]">
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
            {/* Breadcrumb for SEO */}
            <nav className="flex items-center space-x-2 text-sm text-[#737373] dark:text-[#85858B] mb-8">
              <Link href="/" className="hover:text-[#171717] dark:hover:text-[#EDEDED] transition-colors">
                Home
              </Link>
              <span>/</span>
              <Link href="/blog" className="hover:text-[#171717] dark:hover:text-[#EDEDED] transition-colors">
                Blog
              </Link>
              <span>/</span>
              <span className="text-[#171717] dark:text-[#EDEDED] font-medium">{title}</span>
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
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#171717] dark:bg-[#EDEDED] text-white dark:text-[#111113] uppercase tracking-wider">
                    {category}
                  </span>
                  <div className="flex items-center gap-2 text-sm text-[#525252] dark:text-[#A1A1A6]">
                    <Clock className="w-4 h-4" />
                    <span>{readTime} read</span>
                  </div>
                </div>

                {/* Title with H1 for SEO */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#171717] dark:text-[#EDEDED] leading-tight tracking-tight">
                  {title}
                </h1>

                {/* Description for SEO */}
                <p className="text-xl text-[#525252] dark:text-[#A1A1A6] leading-relaxed max-w-3xl">
                  {description}
                </p>

                {/* Author Info */}
                <div className="flex items-center gap-4 pt-4 border-t border-[#171717]/[0.08] dark:border-white/[0.08]">
                  <div className="w-12 h-12 bg-[#171717] dark:bg-[#EDEDED] rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white dark:text-[#111113]" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-[#171717] dark:text-[#EDEDED]">{author}</div>
                    <div className="text-sm text-[#525252] dark:text-[#A1A1A6]">{role}</div>
                  </div>
                  <div className="text-sm text-[#737373] dark:text-[#85858B]">
                    {date}
                  </div>
                </div>

                {/* Social Sharing */}
                <div className="flex items-center gap-4 pt-4">
                  <button className="flex items-center gap-2 px-4 py-2 bg-[#171717] dark:bg-[#EDEDED] text-white dark:text-[#111113] rounded-lg hover:bg-[#FB432C] dark:hover:bg-[#FB432C] dark:hover:text-white transition-colors">
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#19191B] border border-[#171717]/[0.12] dark:border-white/[0.12] text-[#171717] dark:text-[#EDEDED] rounded-lg hover:bg-[#F4F4F5] dark:hover:bg-[#232325] transition-colors">
                    <Bookmark className="w-4 h-4" />
                    Save
                  </button>
                </div>
              </header>

              {/* Featured Image */}
              {featuredImage && (
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#F4F4F5] dark:bg-[#232325] border border-[#171717]/[0.08] dark:border-white/[0.08]">
                  <img
                    src={featuredImage}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Table of Contents */}
              {tableOfContents.length > 0 && (
                <nav className="bg-white dark:bg-[#19191B] rounded-xl p-6 border border-[#171717]/[0.08] dark:border-white/[0.08]">
                  <h2 className="text-lg font-bold text-[#171717] dark:text-[#EDEDED] mb-4">Table of Contents</h2>
                  <ul className="space-y-2">
                    {tableOfContents.map((item, index) => (
                      <li key={index}>
                        <a
                          href={`#${item.id}`}
                          className={`text-[#525252] dark:text-[#A1A1A6] hover:text-[#171717] dark:hover:text-[#EDEDED] transition-colors ${
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
              <div className="prose prose-lg dark:prose-invert max-w-none">
                {content.map((block, index) => (
                  <ContentBlock key={index} block={block} />
                ))}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 pt-8 border-t border-[#171717]/[0.08] dark:border-white/[0.08]">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-[#F4F4F5] dark:bg-[#232325] text-[#525252] dark:text-[#A1A1A6] border border-[#171717]/[0.06] dark:border-white/[0.06] rounded-full text-sm font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Author Bio */}
              <aside className="bg-white dark:bg-[#19191B] rounded-xl p-8 border border-[#171717]/[0.08] dark:border-white/[0.08]">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-[#171717] dark:bg-[#EDEDED] rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-8 h-8 text-white dark:text-[#111113]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-[#171717] dark:text-[#EDEDED] mb-2">About {author}</h3>
                    <p className="text-[#525252] dark:text-[#A1A1A6] mb-4">{role}</p>
                    <p className="text-[#525252] dark:text-[#A1A1A6]">
                      Leading the innovation in secure printing technology at XeroxQ, 
                      transforming how India handles document privacy and security.
                    </p>
                    <div className="flex items-center gap-4 mt-4">
                      <Link
                        href="/blog"
                        className="inline-flex items-center gap-2 text-[#171717] dark:text-[#EDEDED] font-medium hover:underline"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        More articles
                      </Link>
                    </div>
                  </div>
                </div>
              </aside>

              {/* Related Posts */}
              <section className="space-y-6 pt-8 border-t border-[#171717]/[0.08] dark:border-white/[0.08]">
                <h2 className="text-2xl font-bold text-[#171717] dark:text-[#EDEDED]">Related Articles</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Related posts would be dynamically loaded */}
                </div>
              </section>

              {/* CTA Section */}
              <section className="bg-[#171717] dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-2xl p-8 text-white text-center">
                <h2 className="text-3xl font-bold mb-4">
                  Ready to Experience Secure Printing?
                </h2>
                <p className="text-xl mb-6 text-white/80">
                  Join thousands of users who trust XeroxQ for their document privacy.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-8 py-3 bg-[#FB432C] text-white rounded-lg font-bold hover:bg-[#E03923] transition-colors"
                  >
                    <Printer className="w-5 h-5" />
                    Try XeroxQ Now
                  </Link>
                  <Link
                    href="/about"
                    className="inline-flex items-center gap-2 px-8 py-3 border border-white/25 rounded-lg font-bold hover:bg-white hover:text-[#171717] transition-colors"
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
        <h1 id={block.text?.toLowerCase().replace(/\s+/g, '-')} className="text-4xl font-bold text-[#171717] dark:text-[#EDEDED] mt-12 mb-6">
          {block.text}
        </h1>
      );
    
    case 'h2':
      return (
        <h2 id={block.text?.toLowerCase().replace(/\s+/g, '-')} className="text-3xl font-bold text-[#171717] dark:text-[#EDEDED] mt-10 mb-6">
          {block.text}
        </h2>
      );
    
    case 'h3':
      return (
        <h3 id={block.text?.toLowerCase().replace(/\s+/g, '-')} className="text-2xl font-bold text-[#171717] dark:text-[#EDEDED] mt-8 mb-4">
          {block.text}
        </h3>
      );
    
    case 'p':
      return (
        <p className="text-lg text-[#525252] dark:text-[#A1A1A6] leading-relaxed mb-6">
          {block.text}
        </p>
      );
    
    case 'ul':
      return (
        <ul className="space-y-3 mb-6">
          {block.items?.map((item, index) => (
            <li key={index} className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#16A34A] dark:text-[#4CC38A] flex-shrink-0 mt-1" />
              <span className="text-[#525252] dark:text-[#A1A1A6]">{item}</span>
            </li>
          ))}
        </ul>
      );
    
    case 'ol':
      return (
        <ol className="space-y-3 mb-6 list-decimal list-inside">
          {block.items?.map((item, index) => (
            <li key={index} className="text-[#525252] dark:text-[#A1A1A6]">
              {item}
            </li>
          ))}
        </ol>
      );
    
    case 'blockquote':
      return (
        <blockquote className={`border-l-4 border-[#171717] dark:border-[#EDEDED] pl-6 py-4 my-6 ${block.highlight ? 'bg-[#F4F4F5] dark:bg-[#232325] rounded-r-lg' : ''}`}>
          <p className="text-xl italic text-[#525252] dark:text-[#A1A1A6]">{block.text}</p>
        </blockquote>
      );
    
    case 'code':
      return (
        <pre className="bg-[#171717] dark:bg-[#19191B] border border-white/[0.08] text-[#EDEDED] p-6 rounded-lg overflow-x-auto mb-6">
          <code>{block.code}</code>
        </pre>
      );
    
    case 'cta':
      return (
        <div className="bg-[#171717] dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] text-white rounded-xl p-8 text-center my-8">
          <h3 className="text-2xl font-bold mb-4">{block.text}</h3>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#FB432C] text-white rounded-lg font-bold hover:bg-[#E03923] transition-colors"
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
