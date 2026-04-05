"use client";

import { motion } from "framer-motion";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { 
  Newspaper, 
  Search, 
  ArrowRight, 
  Clock, 
  TrendingUp,
  ShieldCheck,
  Zap,
  Cpu,
  Globe,
  Lock
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const posts = [
  {
    title: "The Zero-Knowledge Print Protocol: A Deep Dive",
    excerpt: "Exploring how XeroxQ encrypts and purges documents locally using AES-256-GCM to ensure 100% data autonomy across the decentralized mesh.",
    author: "Sivamanikanta M.",
    date: "April 02, 2026",
    readTime: "8 min",
    tag: "Engineering",
    icon: Cpu,
    slug: "zero-knowledge-print"
  },
  {
    title: "Why WhatsApp Printing is a National Privacy Hazard",
    excerpt: "Every time you send a document via WhatsApp to a shop, it lives on their phone forever. Here's the architectural failure we're solving.",
    author: "XeroxQ Labs",
    date: "March 28, 2026",
    readTime: "6 min",
    tag: "Vision",
    icon: ShieldCheck,
    slug: "whatsapp-privacy-hazard"
  },
  {
    title: "Scaling to 500+ Verified Print Nodes in AP",
    excerpt: "How we onboarded and verified over 500 commercial xerox shops in a single Indian state, building trust through hardware audits.",
    author: "Network Operations",
    date: "March 20, 2026",
    readTime: "12 min",
    tag: "Network",
    icon: Globe,
    slug: "scaling-ap-nodes"
  },
  {
    title: "Ephemeral RAM: Why We Don't Use Databases for Files",
    excerpt: "Traditional cloud platforms store your files on SSDs. XeroxQ holds them exclusively in volatile RAM that self-destructs after printing.",
    author: "Saini Koyya",
    date: "March 12, 2026",
    readTime: "10 min",
    tag: "Engineering",
    icon: Zap,
    slug: "ephemeral-ram-architecture"
  },
  {
    title: "The Physical QR Handshake Explained",
    excerpt: "How a simple QR code on a shop desk acts as a one-time cryptographic key, bridging the gap between digital encryption and physical hardware.",
    author: "Sivamanikanta M.",
    date: "March 05, 2026",
    readTime: "7 min",
    tag: "Engineering",
    icon: Lock,
    slug: "qr-handshake-explained"
  },
  {
    title: "Building a Privacy-First Brand in India",
    excerpt: "Most Indian consumers don't think about data privacy when printing. Here's how we're changing the conversation from the ground up.",
    author: "XeroxQ Labs",
    date: "February 22, 2026",
    readTime: "5 min",
    tag: "Vision",
    icon: ShieldCheck,
    slug: "privacy-first-brand-india"
  }
];

export default function Blog() {
  const [activeTag, setActiveTag] = useState("All");

  const filteredPosts = activeTag === "All" ? posts : posts.filter(p => p.tag === activeTag);
  const featuredPost = posts[0];
  const gridPosts = filteredPosts.filter(p => p.slug !== featuredPost.slug);

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-sans selection:bg-[#FB432C] selection:text-white overflow-x-hidden">
      <SiteHeader />
      
      <main className="flex-1 pt-32 pb-0">
        
        {/* Blog Hero */}
        <section className="relative pt-12 pb-16 text-center">
          <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 0)', backgroundSize: '40px 40px' }} />
               
          <div className="max-w-[1280px] mx-auto px-6 relative z-10">
             <motion.div 
               variants={{
                 hidden: { opacity: 0, y: 20 },
                 visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
               }}
               initial="hidden"
               animate="visible"
               className="max-w-4xl mx-auto"
             >
               <div className="inline-flex items-center gap-2.5 px-4 h-8 rounded-full bg-black/5 border border-black/5 mb-8">
                 <Newspaper className="w-3.5 h-3.5 text-black" />
                 <span className="text-[10px] font-bold text-black uppercase tracking-[0.2em] leading-none">Editorial Hub</span>
               </div>
               
               <h1 className="text-[50px] md:text-[80px] font-extrabold tracking-tighter text-black leading-[0.95] mb-6 uppercase">
                 The Future Of <br /> Physicalization.
               </h1>
               <p className="text-lg md:text-xl font-medium text-gray-500 leading-relaxed italic max-w-2xl mx-auto">
                 Deep dives into decentralized networks, zero-knowledge encryption, and building the secure print mesh across Andhra Pradesh.
               </p>
             </motion.div>
          </div>
        </section>

        {/* Sticky Category Filter */}
        <section className="sticky top-0 z-[500] py-4 bg-white/80 backdrop-blur-xl border-y border-gray-100">
           <div className="max-w-[1280px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                 {["All", "Engineering", "Network", "Vision"].map(tag => (
                    <button 
                      key={tag}
                      onClick={() => setActiveTag(tag)}
                      className={cn(
                        "h-10 px-6 rounded-full font-bold text-[11px] uppercase tracking-widest transition-all whitespace-nowrap border",
                        activeTag === tag 
                          ? "bg-black text-white border-black shadow-lg shadow-black/10" 
                          : "bg-gray-50 text-gray-500 border-gray-200 hover:border-black/20 hover:bg-white"
                      )}
                    >
                       {tag}
                    </button>
                 ))}
              </div>
              <div className="relative w-full md:w-[280px]">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                 <input type="text" placeholder="Search articles..." className="w-full h-10 bg-gray-50 border border-gray-200 rounded-full pl-11 pr-4 text-[13px] font-medium placeholder:text-gray-400 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all" />
              </div>
           </div>
        </section>

        {/* Featured Post */}
        <section className="py-16 relative z-20">
           <div className="max-w-[1280px] mx-auto px-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="group relative bg-black rounded-[40px] overflow-hidden shadow-2xl shadow-black/20 p-10 md:p-16 flex flex-col justify-end min-h-[420px] cursor-pointer border border-black/20"
                onClick={() => window.location.href = `/blog/${featuredPost.slug}`}
              >
                 {/* Background decoration */}
                 <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500 opacity-10 blur-[120px] rounded-full group-hover:scale-110 transition-transform duration-1000 pointer-events-none" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent z-10" />
                 
                 <div className="relative z-20 space-y-6 max-w-3xl text-left">
                    <div className="flex items-center gap-4">
                       <span className="px-4 py-1.5 bg-white/10 text-white rounded-full text-[11px] font-black uppercase tracking-widest backdrop-blur-sm">
                          Featured
                       </span>
                       <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-widest">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Top Read
                       </div>
                    </div>
                    
                    <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tighter leading-[0.95] uppercase group-hover:text-blue-300 transition-colors">
                       {featuredPost.title}
                    </h2>
                    <p className="text-lg text-gray-400 font-medium leading-relaxed max-w-2xl">
                       {featuredPost.excerpt}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-6 pt-2">
                       <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[10px] font-black text-white">
                             SM
                          </div>
                          <span className="text-white font-bold text-xs">{featuredPost.author}</span>
                       </div>
                       <div className="flex items-center gap-2 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                          <Clock className="w-3.5 h-3.5" /> {featuredPost.readTime} read
                       </div>
                       <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{featuredPost.date}</span>
                    </div>
                 </div>
              </motion.div>
           </div>
        </section>

        {/* Post Grid */}
        <section className="py-24 bg-[#F8FAFC] border-y border-gray-100">
           <div className="max-w-[1280px] mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {gridPosts.map((post, i) => (
                    <motion.div
                       key={post.slug}
                       initial={{ opacity: 0, y: 30 }}
                       whileInView={{ opacity: 1, y: 0 }}
                       viewport={{ once: true }}
                       transition={{ delay: i * 0.1, duration: 0.6 }}
                       className="group bg-white p-8 rounded-[32px] border border-gray-200 hover:border-black/10 hover:shadow-2xl hover:shadow-black/5 hover:-translate-y-2 transition-all duration-500 cursor-pointer flex flex-col justify-between h-full"
                       onClick={() => window.location.href = `/blog/${post.slug}`}
                    >
                       <div>
                          <div className="flex items-center justify-between mb-8">
                             <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-black group-hover:bg-black group-hover:text-white transition-all duration-500 shadow-sm">
                                <post.icon className="w-6 h-6" />
                             </div>
                             <span className="px-3 py-1.5 bg-gray-50 border border-gray-100 text-[10px] font-black text-gray-500 uppercase tracking-widest rounded-full">
                                {post.tag}
                             </span>
                          </div>
                          
                          <h3 className="text-xl lg:text-2xl font-black text-black tracking-tighter uppercase leading-tight mb-4 group-hover:text-[#FB432C] transition-colors">
                             {post.title}
                          </h3>
                          <p className="text-[14px] font-medium text-gray-500 leading-relaxed line-clamp-3">
                             {post.excerpt}
                          </p>
                       </div>

                       <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                          <div className="space-y-1">
                             <span className="text-[11px] font-bold text-gray-800 block">{post.author}</span>
                             <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                <span>{post.date}</span>
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.readTime}</span>
                             </div>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-gray-50 group-hover:bg-[#FB432C] border border-gray-100 group-hover:border-transparent flex items-center justify-center text-black group-hover:text-white transition-all duration-500 shrink-0 shadow-sm">
                             <ArrowRight className="w-4 h-4" />
                          </div>
                       </div>
                    </motion.div>
                 ))}
              </div>
           </div>
        </section>

        {/* Subscribe CTA */}
        <section className="py-32 bg-white text-center">
           <div className="max-w-2xl mx-auto px-6">
              <Newspaper className="w-12 h-12 text-black mx-auto mb-6 opacity-20" />
              <h2 className="text-3xl md:text-5xl font-extrabold text-black tracking-tighter uppercase mb-6">Stay Physical. <br /> Stay Secure.</h2>
              <p className="text-lg text-gray-500 font-medium mb-10 italic">
                 Join developers and shopkeepers receiving weekly protocol insights and network updates directly.
              </p>
              
              <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                 <input 
                    type="email" 
                    placeholder="Enter your email address" 
                    className="flex-1 h-14 bg-gray-50 border border-gray-200 rounded-full px-6 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all" 
                    required 
                 />
                 <button 
                    type="submit"
                    className="h-14 px-8 bg-black hover:bg-[#FB432C] text-white font-bold text-[12px] uppercase tracking-widest rounded-full transition-all duration-300 shadow-xl shadow-black/10"
                 >
                    Subscribe
                 </button>
              </form>
           </div>
        </section>

      </main>

      <SiteFooter />
    </div>
  );
}
