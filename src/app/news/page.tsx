"use client";

import { motion } from "framer-motion";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { 
  ArrowRight,
  TrendingUp,
  Cpu,
  ShieldCheck,
  Megaphone,
  Newspaper
} from "lucide-react";
import { cn } from "@/lib/utils";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export default function NewsPage() {
  const [newsItems, setNewsItems] = useState<any[]>([]);
  const [featuredArticle, setFeaturedArticle] = useState<any>({
    tag: "Platform Launch",
    title: "The Zero-Trace Printing Protocol Goes Live in Andhra Pradesh.",
    desc: "After months of rigorous security testing, XeroxQ has officially deployed its decentralized routing mesh across all 26 districts of AP. Customers can now physicalize documents without exposing their digital footprint to shop owners.",
    date: "April 5, 2026",
    icon: ShieldCheck,
    color: "text-emerald-500",
    bg: "bg-emerald-50"
  });

  useEffect(() => {
    async function fetchNews() {
      const { data, error } = await supabase
        .from("platform_news")
        .select("*")
        .order("published_at", { ascending: false });

      if (!error && data && data.length > 0) {
        const formatted = data.map(item => ({
          ...item,
          tag: item.category || "Update",
          desc: item.content,
          date: new Date(item.published_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
          icon: item.category === 'Funding' ? TrendingUp : item.category === 'Milestone' ? Megaphone : Cpu
        }));
        setNewsItems(formatted);
        // If there's a highly relevant one, we could set it as featured
        // setFeaturedArticle(formatted[0]);
      } else {
        // Fallback to defaults
        setNewsItems([
          {
            tag: "Funding",
            title: "Securing $1.2M Pre-Seed to scale Decentralized Physicalization",
            desc: "XeroxQ has successfully closed a pre-seed round led by prominent privacy-centric tech investors to expand our shop verification network pan-India.",
            date: "March 28, 2026",
            icon: TrendingUp
          },
          {
            tag: "Product Update",
            title: "Introducing Contrast AI Edge-Rendering",
            desc: "Our latest network update automatically detects poor-quality mobile photographs of ID cards and drops the white-balance for crisp Grayscale laser printing.",
            date: "March 15, 2026",
            icon: Cpu
          },
          {
            tag: "Milestone",
            title: "500+ Verified Shop Nodes now in the Mesh",
            desc: "We celebrate a massive milestone as over 500 commercial retail xerox shops have successfully passed our hardware and signal verification audits.",
            date: "March 2, 2026",
            icon: Megaphone
          }
        ]);
      }
    }
    fetchNews();
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#111113] text-[#171717] dark:text-[#EDEDED] flex flex-col font-sans selection:bg-[#FB432C] selection:text-white overflow-x-hidden">
      <SiteHeader />
      
      <main className="flex-1 pt-32 pb-0">
        
        {/* Newsroom Hero */}
        <section className="relative pt-12 pb-16 text-center">
          <div className="absolute inset-0 z-0 opacity-[0.04] dark:opacity-[0.06] text-[#171717] dark:text-white pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(currentColor 1.5px, transparent 0)', backgroundSize: '40px 40px' }} />
               
          <div className="max-w-[1280px] mx-auto px-6 relative z-10">
             <motion.div 
               variants={{
                 hidden: { opacity: 0, y: 20 },
                 visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
               }}
               initial="hidden"
               animate="visible"
               className="mx-auto max-w-2xl text-center"
             >
               <div className="inline-flex items-center gap-2.5 px-4 h-8 rounded-full bg-[#F4F4F5] dark:bg-[#232325] border border-[#171717]/[0.10] dark:border-white/[0.10] mb-8 mx-auto">
                 <div className="w-2 h-2 rounded-full bg-[#FB432C] animate-pulse" />
                 <span className="text-[10px] font-bold text-[#171717] dark:text-[#EDEDED] uppercase tracking-[0.2em] leading-none">The Newsroom</span>
               </div>
               
               <h1 className="text-[50px] md:text-[70px] font-extrabold tracking-tighter text-[#171717] dark:text-[#EDEDED] leading-none mb-6 uppercase">
                 Latest Updates
               </h1>
               <p className="text-lg font-medium text-[#525252] dark:text-[#A1A1A6] leading-relaxed italic max-w-2xl mx-auto">
                 Press releases, product deployments, and milestones regarding the expansion of the XeroxQ decentralized print mesh.
               </p>
             </motion.div>
          </div>
        </section>

        {/* Featured Article */}
        <section className="pb-16 relative z-20">
           <div className="max-w-[1280px] mx-auto px-6">
              <motion.div
                 initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ duration: 0.8 }}
                 className="group bg-[#171717] dark:bg-[#19191B] rounded-[40px] p-8 md:p-16 border border-white/[0.08] text-white shadow-2xl overflow-hidden relative cursor-pointer"
              >
                 {/* Background decoration */}
                 <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500 opacity-10 blur-[120px] rounded-full group-hover:scale-110 transition-transform duration-1000 pointer-events-none" />
                 
                 <div className="relative z-10 flex flex-col md:flex-row gap-12 md:gap-20 items-start justify-between">
                    <div className="flex-1 space-y-6">
                       <div className="flex items-center gap-4 mb-8">
                          <span className="px-4 py-1.5 bg-white/10 text-white rounded-full text-[11px] font-black uppercase tracking-widest backdrop-blur-sm">
                             {featuredArticle.tag}
                          </span>
                          <span className="text-[11px] font-bold text-[#A1A1A6] uppercase tracking-widest">{featuredArticle.date}</span>
                       </div>
                       
                       <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase leading-[0.95] group-hover:text-emerald-400 transition-colors">
                          {featuredArticle.title}
                       </h2>
                       <p className="text-lg text-[#A1A1A6] font-medium leading-relaxed max-w-2xl">
                          {featuredArticle.desc}
                       </p>
                    </div>

                    <div className="shrink-0 w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white backdrop-blur-md group-hover:bg-emerald-500 group-hover:border-transparent group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-xl">
                       <featuredArticle.icon className="w-10 h-10" />
                    </div>
                 </div>
              </motion.div>
           </div>
        </section>

        {/* News Grid */}
        <section className="py-24 bg-[#F4F4F5]/60 dark:bg-[#111113] border-y border-[#171717]/[0.08] dark:border-white/[0.08]">
           <div className="max-w-[1280px] mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {newsItems.map((item, i) => (
                    <motion.div
                       key={i}
                       initial={{ opacity: 0, y: 30 }}
                       whileInView={{ opacity: 1, y: 0 }}
                       viewport={{ once: true }}
                       transition={{ delay: i * 0.15, duration: 0.6 }}
                       className="group bg-white dark:bg-[#19191B] p-10 rounded-[32px] border border-[#171717]/[0.08] dark:border-white/[0.08] hover:border-[#171717]/20 dark:hover:border-white/20 hover:shadow-2xl hover:shadow-black/5 hover:-translate-y-2 transition-all duration-500 cursor-pointer flex flex-col justify-between h-full"
                    >
                       <div>
                          <div className="flex items-center justify-between mb-8">
                             <div className="w-14 h-14 rounded-2xl bg-[#F4F4F5] dark:bg-[#232325] border border-[#171717]/[0.10] dark:border-white/[0.10] flex items-center justify-center text-[#171717] dark:text-[#EDEDED] group-hover:bg-[#171717] dark:group-hover:bg-[#FB432C] group-hover:text-white group-hover:border-transparent group-hover:scale-110 transition-all duration-500 shadow-sm">
                                <item.icon className="w-6 h-6" />
                             </div>
                             <span className="text-[10px] font-bold text-[#737373] dark:text-[#85858B] uppercase tracking-widest">{item.date}</span>
                          </div>

                          <div className="mb-4">
                             <span className="text-[10px] font-black text-[#FB432C] uppercase tracking-widest block mb-3">
                                {item.tag}
                             </span>
                             <h3 className="text-2xl lg:text-3xl font-black text-[#171717] dark:text-[#EDEDED] tracking-tighter uppercase leading-none group-hover:text-[#FB432C] transition-colors">
                                {item.title}
                             </h3>
                          </div>
                       </div>

                       <div className="mt-6 border-t border-[#171717]/[0.08] dark:border-white/[0.08] pt-6 flex items-end justify-between gap-4">
                          <p className="text-sm md:text-[15px] font-medium text-[#525252] dark:text-[#A1A1A6] leading-relaxed max-w-sm">
                             {item.desc}
                          </p>
                          <div className="w-10 h-10 rounded-full bg-[#F4F4F5] dark:bg-[#232325] group-hover:bg-[#FB432C] border border-[#171717]/[0.10] dark:border-white/[0.10] group-hover:border-transparent flex items-center justify-center text-[#171717] dark:text-[#EDEDED] group-hover:text-white transition-all duration-500 shrink-0 shadow-sm">
                             <ArrowRight className="w-4 h-4" />
                          </div>
                       </div>
                    </motion.div>
                 ))}
              </div>
           </div>
        </section>

        {/* Newsletter CTA */}
        <section className="py-32 bg-white dark:bg-[#19191B] text-center">
           <div className="max-w-2xl mx-auto px-6">
              <Newspaper className="w-12 h-12 text-[#171717] dark:text-[#EDEDED] mx-auto mb-6 opacity-20" />
              <h2 className="text-3xl md:text-5xl font-extrabold text-[#171717] dark:text-[#EDEDED] tracking-tighter uppercase mb-6">Stay Updated</h2>
              <p className="text-lg text-[#525252] dark:text-[#A1A1A6] font-medium mb-10 italic">
                 Subscribe to our developer and partner network dispatch. No spam, only crucial node updates.
              </p>
              
              <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                 <input 
                    type="email" 
                    placeholder="Enter your email address" 
                    className="flex-1 h-14 bg-[#F4F4F5] dark:bg-[#232325] text-[#171717] dark:text-[#EDEDED] placeholder:text-[#737373] dark:placeholder:text-[#85858B] border border-[#171717]/[0.12] dark:border-white/[0.12] rounded-full px-6 focus:outline-none focus:border-[#171717] dark:focus:border-white/30 transition-all"
                    required
                 />
                 <button 
                    type="submit" 
                    className="h-14 px-8 bg-[#171717] dark:bg-[#FB432C] hover:bg-[#FB432C] dark:hover:bg-[#E03923] text-white font-bold text-[12px] uppercase tracking-widest rounded-full transition-all duration-300 shadow-xl shadow-black/10"
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
