'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronRight, MapPin, Phone, Mail, Clock, Shield, Users, Zap, Globe } from 'lucide-react';

// Internal linking strategy component for SEO sitelinks optimization
export function InternalLinkingHub() {
  const [activeCategory, setActiveCategory] = useState('services');

  const categories = [
    {
      id: 'services',
      title: 'Printing Services',
      icon: Zap,
      links: [
        { href: '/document-printing-near-me', text: 'Document Printing Near Me', description: 'Find local print shops instantly' },
        { href: '/online-printing-services-india', text: 'Online Printing Services', description: 'Upload and print documents online' },
        { href: '/whatsapp-printing-service', text: 'WhatsApp Printing', description: 'Secure alternative to WhatsApp printing' },
        { href: '/secure-document-printing-india', text: 'Secure Document Printing', description: 'Privacy-first document printing' },
        { href: '/best-printing-services-india', text: 'Best Printing Services', description: 'Top-rated printing providers' },
      ]
    },
    {
      id: 'locations',
      title: 'Major Cities',
      icon: MapPin,
      links: [
        { href: '/delhi', text: 'Printing Services Delhi', description: 'Delhi NCR printing solutions' },
        { href: '/mumbai', text: 'Printing Services Mumbai', description: 'Mumbai and Thane printing' },
        { href: '/bangalore', text: 'Printing Services Bangalore', description: 'Bangalore printing shops' },
        { href: '/chennai', text: 'Printing Services Chennai', description: 'Chennai document printing' },
        { href: '/hyderabad', text: 'Printing Services Hyderabad', description: 'Hyderabad secure printing' },
        { href: '/kolkata', text: 'Printing Services Kolkata', description: 'Kolkata printing services' },
      ]
    },
    {
      id: 'resources',
      title: 'Resources',
      icon: Globe,
      links: [
        { href: '/blog', text: 'Printing Blog', description: 'Expert printing insights' },
        { href: '/help-center', text: 'Help Center', description: 'Get support and guidance' },
        { href: '/about', text: 'About XeroxQ', description: 'Learn about our mission' },
        { href: '/contact', text: 'Contact Us', description: 'Get in touch with us' },
        { href: '/admin', text: 'Shop Dashboard', description: 'Manage your print shop' },
      ]
    },
    {
      id: 'features',
      title: 'Features',
      icon: Shield,
      links: [
        { href: '/privacy', text: 'Privacy Protection', description: 'Zero-knowledge encryption' },
        { href: '/security', text: 'Security Features', description: 'Military-grade security' },
        { href: '/mobile-app', text: 'Mobile App', description: 'Print on the go' },
        { href: '/api', text: 'Developer API', description: 'Integrate printing services' },
        { href: '/pricing', text: 'Pricing', description: 'Transparent pricing' },
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-black mb-4">Explore XeroxQ Services</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Discover our comprehensive printing solutions across India. Find the perfect service for your needs.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              activeCategory === category.id
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <category.icon className="w-4 h-4 inline mr-2" />
            {category.title}
          </button>
        ))}
      </div>

      {/* Links Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories
          .find(cat => cat.id === activeCategory)
          ?.links.map((link, index) => (
            <Link
              key={index}
              href={link.href}
              className="group p-6 bg-white border border-gray-200 rounded-lg hover:border-black hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-black mb-2 group-hover:text-[#FB432C] transition-colors">
                    {link.text}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">{link.description}</p>
                  <div className="flex items-center text-black group-hover:text-[#FB432C] transition-colors">
                    <span className="text-sm font-medium">Learn more</span>
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
      </div>
    </div>
  );
}

// Breadcrumb navigation component
export function BreadcrumbNavigation({ items }: { items: Array<{ name: string; href?: string }> }) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 py-4" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && <ChevronRight className="w-4 h-4 mx-2" />}
          {item.href ? (
            <Link href={item.href} className="hover:text-black transition-colors">
              {item.name}
            </Link>
          ) : (
            <span className="text-black font-medium">{item.name}</span>
          )}
        </div>
      ))}
    </nav>
  );
}

// Related posts component for blog posts
export function RelatedPosts({ currentSlug, category }: { currentSlug: string; category?: string }) {
  const relatedPosts = [
    {
      slug: 'secure-document-printing-india',
      title: 'Secure Document Printing in India: Why XeroxQ is #1',
      excerpt: 'Discover military-grade security features for document printing.',
      category: 'Security',
      readTime: '15 min'
    },
    {
      slug: 'whatsapp-printing-service',
      title: 'WhatsApp Printing Service India 2026: Complete Guide',
      excerpt: 'Learn about secure WhatsApp printing alternatives.',
      category: 'Mobile Printing',
      readTime: '14 min'
    },
    {
      slug: 'document-printing-near-me',
      title: 'Document Printing Near Me: Find Best Print Shops',
      excerpt: 'Locate the best printing services in your area instantly.',
      category: 'Local Printing',
      readTime: '12 min'
    },
    {
      slug: 'online-printing-services-india',
      title: 'Online Printing Services India 2026: Complete Guide',
      excerpt: 'Compare top online printing services with detailed analysis.',
      category: 'Digital Printing',
      readTime: '18 min'
    }
  ];

  // Filter out current post and prioritize same category
  const filteredPosts = relatedPosts
    .filter(post => post.slug !== currentSlug)
    .filter(post => !category || post.category === category)
    .slice(0, 3);

  if (filteredPosts.length === 0) return null;

  return (
    <div className="mt-12 pt-8 border-t border-gray-200">
      <h3 className="text-xl font-bold text-black mb-6">Related Articles</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredPosts.map((post, index) => (
          <Link
            key={index}
            href={`/blog/${post.slug}`}
            className="group block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#FB432C] uppercase tracking-wider">
                {post.category}
              </span>
              <span className="text-xs text-gray-500">{post.readTime}</span>
            </div>
            <h4 className="font-semibold text-black mb-2 group-hover:text-[#FB432C] transition-colors">
              {post.title}
            </h4>
            <p className="text-sm text-gray-600 line-clamp-2">{post.excerpt}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Quick links component for footer
export function QuickLinks() {
  const quickLinks = [
    {
      title: 'Services',
      links: [
        { href: '/document-printing-near-me', text: 'Document Printing' },
        { href: '/online-printing-services-india', text: 'Online Printing' },
        { href: '/whatsapp-printing-service', text: 'WhatsApp Printing' },
        { href: '/secure-document-printing-india', text: 'Secure Printing' },
      ]
    },
    {
      title: 'Locations',
      links: [
        { href: '/delhi', text: 'Delhi' },
        { href: '/mumbai', text: 'Mumbai' },
        { href: '/bangalore', text: 'Bangalore' },
        { href: '/chennai', text: 'Chennai' },
      ]
    },
    {
      title: 'Resources',
      links: [
        { href: '/blog', text: 'Blog' },
        { href: '/help-center', text: 'Help Center' },
        { href: '/about', text: 'About Us' },
        { href: '/contact', text: 'Contact' },
      ]
    },
    {
      title: 'Company',
      links: [
        { href: '/privacy', text: 'Privacy Policy' },
        { href: '/terms', text: 'Terms of Service' },
        { href: '/security', text: 'Security' },
        { href: '/careers', text: 'Careers' },
      ]
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
      {quickLinks.map((section, index) => (
        <div key={index}>
          <h3 className="font-semibold text-black mb-4">{section.title}</h3>
          <ul className="space-y-2">
            {section.links.map((link, linkIndex) => (
              <li key={linkIndex}>
                <Link
                  href={link.href}
                  className="text-gray-600 hover:text-black transition-colors"
                >
                  {link.text}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// Contextual internal links component
export function ContextualLinks({ context }: { context: 'printing' | 'security' | 'location' | 'blog' }) {
  const linkSets = {
    printing: [
      { href: '/document-printing-near-me', text: 'Find Print Shops Near You', anchor: 'Find local printing services' },
      { href: '/online-printing-services-india', text: 'Online Document Printing', anchor: 'Upload and print online' },
      { href: '/whatsapp-printing-service', text: 'Secure WhatsApp Alternative', anchor: 'Safe printing without WhatsApp' },
    ],
    security: [
      { href: '/secure-document-printing-india', text: 'Privacy-First Printing', anchor: 'Learn about our security features' },
      { href: '/privacy', text: 'Data Protection', anchor: 'How we protect your documents' },
      { href: '/security', text: 'Security Features', anchor: 'Military-grade encryption' },
    ],
    location: [
      { href: '/delhi', text: 'Printing in Delhi', anchor: 'Delhi printing services' },
      { href: '/mumbai', text: 'Printing in Mumbai', anchor: 'Mumbai printing solutions' },
      { href: '/bangalore', text: 'Printing in Bangalore', anchor: 'Bangalore print shops' },
    ],
    blog: [
      { href: '/blog', text: 'Printing Blog', anchor: 'Read our latest articles' },
      { href: '/blog/whatsapp-virtual-number-system', text: 'Virtual WhatsApp Numbers', anchor: 'Revolutionary printing technology' },
      { href: '/blog/best-printing-services-india', text: 'Best Printing Services', anchor: 'Top-rated printing providers' },
    ]
  };

  const links = linkSets[context] || linkSets.printing;

  return (
    <div className="flex flex-wrap gap-4">
      {links.map((link, index) => (
        <Link
          key={index}
          href={link.href}
          className="inline-flex items-center text-sm text-[#FB432C] hover:text-black transition-colors"
        >
          {link.anchor}
          <ChevronRight className="w-3 h-3 ml-1" />
        </Link>
      ))}
    </div>
  );
}
