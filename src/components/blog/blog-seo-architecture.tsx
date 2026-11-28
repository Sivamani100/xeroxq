'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, Clock, User, Tag, ChevronRight, Search, Filter, TrendingUp, Eye, Share2, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BreadcrumbNavigation } from '@/components/seo/internal-linking';

// Blog SEO architecture components

export function BlogHeader() {
  return (
    <header className="bg-white dark:bg-[#19191B] border-b border-[#171717]/[0.08] dark:border-white/[0.08] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/blog" className="text-2xl font-bold text-[#171717] dark:text-[#EDEDED]">
              XeroxQ Blog
            </Link>
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/blog/category/security" className="text-[#525252] dark:text-[#A1A1A6] hover:text-[#171717] dark:hover:text-[#EDEDED] transition-colors">
                Security
              </Link>
              <Link href="/blog/category/printing" className="text-[#525252] dark:text-[#A1A1A6] hover:text-[#171717] dark:hover:text-[#EDEDED] transition-colors">
                Printing
              </Link>
              <Link href="/blog/category/technology" className="text-[#525252] dark:text-[#A1A1A6] hover:text-[#171717] dark:hover:text-[#EDEDED] transition-colors">
                Technology
              </Link>
              <Link href="/blog/category/business" className="text-[#525252] dark:text-[#A1A1A6] hover:text-[#171717] dark:hover:text-[#EDEDED] transition-colors">
                Business
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#737373] dark:text-[#85858B] w-4 h-4" />
              <Input
                placeholder="Search articles..."
                className="pl-10 w-64 bg-[#F4F4F5] dark:bg-[#232325] border-[#171717]/[0.12] dark:border-white/[0.12]"
              />
            </div>
            <Button variant="outline" size="sm" className="dark:border-white/[0.12] dark:text-[#EDEDED] dark:hover:bg-[#232325]">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

export function BlogHero() {
  return (
    <section className="bg-[#171717] dark:bg-[#19191B] border-b border-white/[0.08] text-white py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FB432C]/20 border border-[#FB432C]/30 rounded-full mb-6">
            <TrendingUp className="w-4 h-4 text-[#FB432C]" />
            <span className="text-sm font-medium text-[#FB432C]">India's #1 Printing Blog</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
            Expert Insights on
            <span className="block text-[#FB432C]">Secure Document Printing</span>
          </h1>
          <p className="text-xl text-white/75 mb-8 leading-relaxed">
            Discover the latest trends, security best practices, and industry insights 
            for document printing in India. Learn from experts and stay ahead with XeroxQ.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button size="lg" className="bg-[#FB432C] hover:bg-[#E03923] text-white">
              <Bookmark className="w-5 h-5 mr-2" />
              Subscribe to Newsletter
            </Button>
            <Button size="lg" variant="outline" className="border-white/25 text-white hover:bg-white hover:text-[#171717]">
              <Share2 className="w-5 h-5 mr-2" />
              Share Blog
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function BlogCategoryFilter() {
  const categories = [
    { id: 'all', name: 'All Articles', count: 156, color: 'bg-[#F4F4F5] text-[#525252] dark:bg-[#232325] dark:text-[#A1A1A6]' },
    { id: 'security', name: 'Security', count: 42, color: 'bg-[#FEF2F2] text-[#DC2626] dark:bg-[#2A1517] dark:text-[#E5484D]' },
    { id: 'printing', name: 'Printing', count: 38, color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' },
    { id: 'technology', name: 'Technology', count: 31, color: 'bg-[#ECFDF5] text-[#16A34A] dark:bg-[#102A1E] dark:text-[#4CC38A]' },
    { id: 'business', name: 'Business', count: 28, color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' },
    { id: 'tutorials', name: 'Tutorials', count: 17, color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' },
  ];

  const [activeCategory, setActiveCategory] = useState('all');

  return (
    <div className="bg-white dark:bg-[#19191B] border-b border-[#171717]/[0.08] dark:border-white/[0.08] sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-4 py-2 rounded-full font-medium transition-all whitespace-nowrap ${
                  activeCategory === category.id
                    ? 'bg-[#171717] dark:bg-[#EDEDED] text-white dark:text-[#111113]'
                    : category.color
                }`}
              >
                {category.name}
                <span className="ml-2 text-sm opacity-75">({category.count})</span>
              </button>
            ))}
          </div>
          <div className="hidden md:flex items-center space-x-4 text-sm text-[#525252] dark:text-[#A1A1A6]">
            <div className="flex items-center">
              <Eye className="w-4 h-4 mr-1" />
              <span>15.2K views today</span>
            </div>
            <div className="flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>23 trending</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BlogPostCard({ post, index }: { post: any; index: number }) {
  return (
    <article className="bg-white dark:bg-[#19191B] rounded-xl shadow-sm border border-[#171717]/[0.08] dark:border-white/[0.08] overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <div className="relative">
        <div className="aspect-video bg-[#F4F4F5] dark:bg-[#232325]"></div>
        <div className="absolute top-4 left-4">
          <span className="inline-flex items-center px-3 py-1 bg-[#FB432C] text-white text-xs font-medium rounded-full">
            {post.category}
          </span>
        </div>
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center px-3 py-1 bg-[#171717]/80 text-white text-xs font-medium rounded-full">
            <TrendingUp className="w-3 h-3 mr-1" />
            Trending
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-center space-x-4 text-sm text-[#737373] dark:text-[#85858B] mb-3">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            {post.date}
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            {post.readTime}
          </div>
          <div className="flex items-center">
            <User className="w-4 h-4 mr-1" />
            {post.author}
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-[#171717] dark:text-[#EDEDED] mb-3 group-hover:text-[#FB432C] transition-colors">
          <Link href={`/blog/${post.slug}`}>
            {post.title}
          </Link>
        </h3>
        
        <p className="text-[#525252] dark:text-[#A1A1A6] mb-4 line-clamp-3">
          {post.excerpt}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {post.tags?.slice(0, 3).map((tag: string, tagIndex: number) => (
              <span key={tagIndex} className="text-xs text-[#525252] dark:text-[#A1A1A6] bg-[#F4F4F5] dark:bg-[#232325] px-2 py-1 rounded">
                #{tag}
              </span>
            ))}
          </div>
          <Link
            href={`/blog/${post.slug}`}
            className="flex items-center text-[#FB432C] hover:text-[#171717] dark:hover:text-[#EDEDED] transition-colors"
          >
            <span className="text-sm font-medium">Read more</span>
            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function BlogSidebar() {
  const popularPosts = [
    {
      title: "WhatsApp Printing Security Risks",
      slug: "whatsapp-privacy-hazard",
      views: "15.2K",
      category: "Security"
    },
    {
      title: "Best Document Printing Services 2026",
      slug: "best-printing-services-india",
      views: "12.8K",
      category: "Printing"
    },
    {
      title: "Zero-Knowledge Printing Protocol",
      slug: "zero-knowledge-print",
      views: "9.4K",
      category: "Technology"
    },
    {
      title: "Delhi Printing Services Guide",
      slug: "printing-services-delhi",
      views: "8.7K",
      category: "Local"
    },
  ];

  const tags = [
    { name: "document printing", count: 42 },
    { name: "security", count: 38 },
    { name: "whatsapp printing", count: 31 },
    { name: "online printing", count: 28 },
    { name: "xerox shop", count: 25 },
    { name: "privacy", count: 22 },
    { name: "encryption", count: 19 },
    { name: "mobile printing", count: 17 },
  ];

  return (
    <aside className="space-y-8">
      {/* Newsletter Signup */}
      <div className="bg-gradient-to-br from-[#FB432C] to-black text-white p-6 rounded-xl">
        <h3 className="text-xl font-bold mb-4">Stay Updated</h3>
        <p className="text-sm mb-4 opacity-90">
          Get the latest printing security tips and industry insights delivered to your inbox.
        </p>
        <Input
          placeholder="Your email address"
          className="bg-white/10 border-white/20 text-white placeholder-white/70 mb-3"
        />
        <Button className="w-full bg-white text-[#171717] hover:bg-[#F4F4F5]">
          Subscribe Now
        </Button>
      </div>

      {/* Popular Posts */}
      <div className="bg-white dark:bg-[#19191B] p-6 rounded-xl border border-[#171717]/[0.08] dark:border-white/[0.08]">
        <h3 className="text-lg font-bold text-[#171717] dark:text-[#EDEDED] mb-4">Popular Posts</h3>
        <div className="space-y-4">
          {popularPosts.map((post, index) => (
            <Link
              key={index}
              href={`/blog/${post.slug}`}
              className="block group"
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-[#F4F4F5] dark:bg-[#232325] rounded flex items-center justify-center text-sm font-bold text-[#525252] dark:text-[#A1A1A6]">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-[#171717] dark:text-[#EDEDED] group-hover:text-[#FB432C] transition-colors text-sm">
                    {post.title}
                  </h4>
                  <div className="flex items-center space-x-2 text-xs text-[#737373] dark:text-[#85858B] mt-1">
                    <span>{post.views} views</span>
                    <span>•</span>
                    <span>{post.category}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Popular Tags */}
      <div className="bg-white dark:bg-[#19191B] p-6 rounded-xl border border-[#171717]/[0.08] dark:border-white/[0.08]">
        <h3 className="text-lg font-bold text-[#171717] dark:text-[#EDEDED] mb-4">Popular Tags</h3>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <Link
              key={index}
              href={`/blog/tag/${tag.name.replace(/\s+/g, '-')}`}
              className="inline-flex items-center px-3 py-1 bg-[#F4F4F5] dark:bg-[#232325] text-[#525252] dark:text-[#A1A1A6] text-sm rounded-full hover:bg-[#FB432C] dark:hover:bg-[#FB432C] hover:text-white dark:hover:text-white transition-colors"
            >
              <Tag className="w-3 h-3 mr-1" />
              {tag.name}
              <span className="ml-1 text-xs opacity-75">({tag.count})</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white dark:bg-[#19191B] p-6 rounded-xl border border-[#171717]/[0.08] dark:border-white/[0.08]">
        <h3 className="text-lg font-bold text-[#171717] dark:text-[#EDEDED] mb-4">Categories</h3>
        <div className="space-y-2">
          {[
            { name: 'Security', count: 42, color: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' },
            { name: 'Printing', count: 38, color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' },
            { name: 'Technology', count: 31, color: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' },
            { name: 'Business', count: 28, color: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400' },
            { name: 'Tutorials', count: 17, color: 'bg-yellow-100 text-yellow-700 dark:bg-amber-500/20 dark:text-amber-400' },
          ].map((category, index) => (
            <Link
              key={index}
              href={`/blog/category/${category.name.toLowerCase()}`}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F4F4F5] dark:hover:bg-[#232325] transition-colors"
            >
              <div className="flex items-center">
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${category.color}`}></span>
                <span className="text-sm font-medium text-[#525252] dark:text-[#A1A1A6]">{category.name}</span>
              </div>
              <span className="text-sm text-[#737373] dark:text-[#85858B]">{category.count}</span>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}

export function BlogPagination() {
  return (
    <div className="flex items-center justify-between py-8">
      <div className="text-sm text-[#525252] dark:text-[#A1A1A6]">
        Showing <span className="font-medium text-[#171717] dark:text-[#EDEDED]">1</span> to <span className="font-medium text-[#171717] dark:text-[#EDEDED]">12</span> of{' '}
        <span className="font-medium text-[#171717] dark:text-[#EDEDED]">156</span> results
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" disabled className="dark:border-white/[0.12] dark:text-[#A1A1A6]">
          Previous
        </Button>
        <Button variant="outline" size="sm" className="bg-[#171717] dark:bg-[#EDEDED] text-white dark:text-[#111113] border-[#171717] dark:border-[#EDEDED]">
          1
        </Button>
        <Button variant="outline" size="sm" className="dark:border-white/[0.12] dark:text-[#A1A1A6] dark:hover:bg-[#232325]">
          2
        </Button>
        <Button variant="outline" size="sm" className="dark:border-white/[0.12] dark:text-[#A1A1A6] dark:hover:bg-[#232325]">
          3
        </Button>
        <span className="px-2 text-[#737373] dark:text-[#85858B]">...</span>
        <Button variant="outline" size="sm" className="dark:border-white/[0.12] dark:text-[#A1A1A6] dark:hover:bg-[#232325]">
          13
        </Button>
        <Button variant="outline" size="sm" className="dark:border-white/[0.12] dark:text-[#A1A1A6] dark:hover:bg-[#232325]">
          Next
        </Button>
      </div>
    </div>
  );
}

export function BlogSEOFooter() {
  return (
    <footer className="bg-[#F4F4F5] dark:bg-[#19191B] border-t border-[#171717]/[0.08] dark:border-white/[0.08] py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h4 className="font-semibold text-[#171717] dark:text-[#EDEDED] mb-4">About XeroxQ Blog</h4>
            <p className="text-sm text-[#525252] dark:text-[#A1A1A6]">
              Expert insights on secure document printing, privacy protection, and the future of printing technology in India.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-[#171717] dark:text-[#EDEDED] mb-4">Popular Topics</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/blog/tag/security" className="text-[#525252] dark:text-[#A1A1A6] hover:text-[#171717] dark:hover:text-[#EDEDED]">Security</Link></li>
              <li><Link href="/blog/tag/whatsapp-printing" className="text-[#525252] dark:text-[#A1A1A6] hover:text-[#171717] dark:hover:text-[#EDEDED]">WhatsApp Printing</Link></li>
              <li><Link href="/blog/tag/online-printing" className="text-[#525252] dark:text-[#A1A1A6] hover:text-[#171717] dark:hover:text-[#EDEDED]">Online Printing</Link></li>
              <li><Link href="/blog/tag/privacy" className="text-[#525252] dark:text-[#A1A1A6] hover:text-[#171717] dark:hover:text-[#EDEDED]">Privacy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-[#171717] dark:text-[#EDEDED] mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/help-center" className="text-[#525252] dark:text-[#A1A1A6] hover:text-[#171717] dark:hover:text-[#EDEDED]">Help Center</Link></li>
              <li><Link href="/about" className="text-[#525252] dark:text-[#A1A1A6] hover:text-[#171717] dark:hover:text-[#EDEDED]">About Us</Link></li>
              <li><Link href="/contact" className="text-[#525252] dark:text-[#A1A1A6] hover:text-[#171717] dark:hover:text-[#EDEDED]">Contact</Link></li>
              <li><Link href="/admin" className="text-[#525252] dark:text-[#A1A1A6] hover:text-[#171717] dark:hover:text-[#EDEDED]">Shop Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-[#171717] dark:text-[#EDEDED] mb-4">Connect</h4>
            <div className="flex space-x-4">
              <Link href="#" className="text-[#525252] dark:text-[#A1A1A6] hover:text-[#171717] dark:hover:text-[#EDEDED]">Twitter</Link>
              <Link href="#" className="text-[#525252] dark:text-[#A1A1A6] hover:text-[#171717] dark:hover:text-[#EDEDED]">LinkedIn</Link>
              <Link href="#" className="text-[#525252] dark:text-[#A1A1A6] hover:text-[#171717] dark:hover:text-[#EDEDED]">Facebook</Link>
              <Link href="#" className="text-[#525252] dark:text-[#A1A1A6] hover:text-[#171717] dark:hover:text-[#EDEDED]">Instagram</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
