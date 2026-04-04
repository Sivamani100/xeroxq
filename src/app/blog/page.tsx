"use client";

import { motion } from "framer-motion";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { 
  Newspaper, 
  Search, 
  ArrowRight, 
  Calendar, 
  Clock, 
  Tag, 
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  Globe
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

const posts = [
  {
    title: "The Zero-Knowledge Print Protocol: A Deep Dive",
    excerpt: "Exploring how XeroxQ encrypts and purges documents locally to ensure 100% data autonomy for our global mesh.",
    author: "XeroxQ Engineering",
    date: "April 02, 2026",
    readTime: "8 min",
    tag: "Engineering",
    slug: "zero-knowledge-print"
  },
  {
    title: "Decentralizing 10,000 Print Nodes Worldwide",
    excerpt: "How we scaled the XeroxQ network to 150+ countries while maintaining sub-second latency for all print signals.",
    author: "Network Operations",
    date: "March 28, 2026",
    readTime: "12 min",
    tag: "Network",
    slug: "scaling-the-mesh"
  },
  {
    title: "Why Privacy is the Next Frontier of Physical Hardware",
    excerpt: "Physicalization is often the weakest link in digital security. XeroxQ is building the bridge to a secure future.",
    author: "XeroxQ Labs",
    date: "March 20, 2026",
    readTime: "6 min",
    tag: "Vision",
    slug: "privacy-frontier"
  }
];

export default function Blog() {
  const router = useRouter();
  const [activeTag, setActiveTag] = useState("All");

  return (
    <div className="min-h-screen bg-white selection:bg-brand-primary selection:text-white">
      <SiteHeader />
      
      <main className="pt-32 pb-16">
        {/* Blog Hero */}
        <section className="relative pb-24 text-center">
          <div className="max-w-[1280px] mx-auto px-6 space-y-12 relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-3 py-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded-md shadow-sm mb-6"
            >
              <Newspaper className="w-3.5 h-3.5 text-black" />
              <span className="text-[10px] font-black tracking-[0.2em] text-black uppercase">XeroxQ Editorial Hub</span>
            </motion.div>
            
            <div className="space-y-6 max-w-4xl mx-auto">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[64px] lg:text-[100px] font-bold text-black tracking-tighter leading-[0.85]"
              >
                The Future Of <br /> Physicalization.
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-2xl text-[#64748B] font-medium max-w-2xl mx-auto leading-relaxed"
              >
                Deep dives into decentralized networks, zero-knowledge encryption, and the global autonomous print mesh.
              </motion.p>
            </div>
          </div>
        </section>

        {/* Categories & Filter */}
        <section className="sticky top-0 z-[500] py-4 bg-white/80 backdrop-blur-xl border-y border-[#E2E8F0]">
           <div className="max-w-[1280px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2 overflow-x-auto pb-4 md:pb-0 no-scrollbar">
                 {["All", "Engineering", "Network", "Vision", "Community"].map(tag => (
                    <button 
                      key={tag}
                      onClick={() => setActiveTag(tag)}
                      className={`h-9 px-6 rounded-lg font-bold text-[11px] uppercase tracking-wider transition-all whitespace-nowrap border ${activeTag === tag ? "bg-black text-white border-black" : "bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] hover:bg-white hover:border-black/10"}`}
                    >
                       {tag}
                    </button>
                 ))}
              </div>
              <div className="relative w-full md:w-[260px]">
                 <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8]" />
                 <input type="text" placeholder="Search articles..." className="w-full h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg pl-9 pr-4 text-[12px] font-bold placeholder:text-[#94A3B8] focus:border-black/5 outline-none transition-all" />
              </div>
           </div>
        </section>

        {/* Featured Post */}
        <section className="py-16 max-w-[1280px] mx-auto px-6">
           <motion.div 
             initial={{ opacity: 0, y: 10 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="group relative h-[400px] lg:h-[450px] bg-black rounded-2xl overflow-hidden shadow-2xl p-10 lg:p-16 flex flex-col justify-end cursor-pointer border border-white/5"
             onClick={() => router.push(`/blog/${posts[0].slug}`)}
           >
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
              <div className="absolute top-10 right-10 w-64 h-64 bg-white opacity-[0.03] blur-[80px] rounded-full" />
              
              <div className="relative z-20 space-y-6 max-w-3xl text-left">
                 <div className="inline-flex items-center gap-3 text-white/50 text-[9px] font-black uppercase tracking-[0.3em]">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Featured Analysis
                 </div>
                 <h2 className="text-3xl lg:text-5xl font-bold text-white tracking-tighter leading-none group-hover:underline underline-offset-8">
                    {posts[0].title}
                 </h2>
                 <p className="text-lg text-slate-400 font-medium leading-relaxed max-w-2xl line-clamp-2">{posts[0].excerpt}</p>
                 <div className="flex items-center gap-6 pt-2">
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
                          <Zap className="w-4 h-4 text-amber-500" />
                       </div>
                       <span className="text-white font-bold text-xs tracking-tight">{posts[0].author}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                       <Clock className="w-3.5 h-3.5" /> {posts[0].readTime} read
                    </div>
                 </div>
              </div>
           </motion.div>
        </section>

        {/* Post Grid */}
        <section className="py-16 bg-[#F8FAFC] border-y border-[#E2E8F0] overflow-hidden">
           <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {posts.slice(1).map((post, i) => (
                <div 
                  key={post.slug}
                  className="group bg-white p-6 rounded-xl border border-[#E2E8F0] hover:shadow-xl transition-all cursor-pointer text-left space-y-6 flex flex-col justify-between"
                  onClick={() => router.push(`/blog/${post.slug}`)}
                >
                  <div className="space-y-4">
                     <span className="inline-block px-3 py-1 bg-black/5 border border-black/5 rounded-md text-[9px] font-black text-black uppercase tracking-[0.2em]">
                        {post.tag}
                     </span>
                     <h3 className="text-lg font-bold text-black tracking-tight leading-snug group-hover:text-black transition-colors">
                        {post.title}
                     </h3>
                     <p className="text-[#64748B] font-medium leading-relaxed text-[13px] line-clamp-3">
                        {post.excerpt}
                     </p>
                  </div>
                  <div className="pt-6 border-t border-[#F1F5F9] flex items-center justify-between">
                     <span className="text-[9px] font-black text-[#94A3B8] uppercase tracking-[0.2em]">{post.date}</span>
                     <ArrowRight className="w-4 h-4 text-[#E2E8F0] group-hover:text-black group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
              
              {/* Coming Soon Placeholder */}
              <div className="group bg-white/50 p-6 rounded-xl border border-dashed border-[#E2E8F0] flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
                 <div className="w-12 h-12 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center shadow-lg">
                    <Newspaper className="w-6 h-6 text-[#94A3B8]" />
                 </div>
                 <div className="space-y-1">
                    <h4 className="text-sm font-bold text-black tracking-tight uppercase">Registry Growth</h4>
                    <p className="text-[11px] text-[#64748B] font-medium uppercase tracking-tight">Weekly protocol insights.</p>
                 </div>
                 <button className="h-9 px-6 bg-black text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-black/90 transition-all shadow-sm">
                    Subscribe
                 </button>
              </div>
           </div>
        </section>

        {/* Global Reach Footer */}
        <section className="py-20 text-center space-y-10 px-6">
           <div className="space-y-4">
              <span className="text-[10px] font-black text-black uppercase tracking-[0.3em]">Digest Subscription</span>
              <h2 className="text-4xl lg:text-6xl font-bold text-black tracking-tighter leading-none">Stay Physical. <br /> Stay Secure.</h2>
              <p className="text-base text-[#64748B] font-medium max-w-lg mx-auto leading-relaxed">
                 Join 50k+ developers and shopkeepers receiving protocol updates directly.
              </p>
           </div>
           <form className="max-w-md mx-auto relative group">
              <input type="email" placeholder="ledger@xeroxq.lab" className="w-full h-14 pl-6 pr-32 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold placeholder:text-[#94A3B8] focus:border-black/5 focus:shadow-xl transition-all shadow-sm outline-none" />
              <button className="absolute right-2 top-2 bottom-2 px-6 bg-black text-white font-bold text-[10px] uppercase tracking-widest rounded-lg transition-all active:scale-95">
                 Join Registry
              </button>
           </form>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
