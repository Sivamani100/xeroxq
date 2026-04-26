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
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-sans selection:bg-[#FB432C] selection:text-white overflow-x-hidden">
      <SiteHeader />
      
      <main className="flex-1 pt-32 pb-0">
        
        {/* Newsroom Hero */}
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
               className="mx-auto max-w-2xl text-center"
             >
               <div className="inline-flex items-center gap-2.5 px-4 h-8 rounded-full bg-black/5 border border-black/5 mb-8 mx-auto">
                 <div className="w-2 h-2 rounded-full bg-[#FB432C] animate-pulse" />
                 <span className="text-[10px] font-bold text-black uppercase tracking-[0.2em] leading-none">The Newsroom</span>
               </div>
               
               <h1 className="text-[50px] md:text-[70px] font-extrabold tracking-tighter text-black leading-none mb-6 uppercase">
                 Latest Updates
               </h1>
               <p className="text-lg font-medium text-gray-500 leading-relaxed italic max-w-2xl mx-auto">
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
                 className="group bg-black rounded-[40px] p-8 md:p-16 border border-black/20 shadow-2xl overflow-hidden relative cursor-pointer"
              >
                 {/* Background decoration */}
                 <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500 opacity-10 blur-[120px] rounded-full group-hover:scale-110 transition-transform duration-1000 pointer-events-none" />
                 
                 <div className="relative z-10 flex flex-col md:flex-row gap-12 md:gap-20 items-start justify-between">
                    <div className="flex-1 space-y-6">
                       <div className="flex items-center gap-4 mb-8">
                          <span className="px-4 py-1.5 bg-white/10 text-white rounded-full text-[11px] font-black uppercase tracking-widest backdrop-blur-sm">
                             {featuredArticle.tag}
                          </span>
                          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{featuredArticle.date}</span>
                       </div>
                       
                       <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase leading-[0.95] group-hover:text-emerald-400 transition-colors">
                          {featuredArticle.title}
                       </h2>
                       <p className="text-lg text-gray-400 font-medium leading-relaxed max-w-2xl">
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
        <section className="py-24 bg-[#F8FAFC] border-y border-gray-100">
           <div className="max-w-[1280px] mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {newsItems.map((item, i) => (
                    <motion.div
                       key={i}
                       initial={{ opacity: 0, y: 30 }}
                       whileInView={{ opacity: 1, y: 0 }}
                       viewport={{ once: true }}
                       transition={{ delay: i * 0.15, duration: 0.6 }}
                       className="group bg-white p-10 rounded-[32px] border border-gray-200 hover:border-black/10 hover:shadow-2xl hover:shadow-black/5 hover:-translate-y-2 transition-all duration-500 cursor-pointer flex flex-col justify-between h-full"
                    >
                       <div>
                          <div className="flex items-center justify-between mb-8">
                             <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-black group-hover:bg-black group-hover:text-white group-hover:scale-110 transition-all duration-500 shadow-sm">
                                <item.icon className="w-6 h-6" />
                             </div>
                             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.date}</span>
                          </div>

                          <div className="mb-4">
                             <span className="text-[10px] font-black text-[#FB432C] uppercase tracking-widest block mb-3">
                                {item.tag}
                             </span>
                             <h3 className="text-2xl lg:text-3xl font-black text-black tracking-tighter uppercase leading-none group-hover:text-[#FB432C] transition-colors">
                                {item.title}
                             </h3>
                          </div>
                       </div>

                       <div className="mt-6 border-t border-gray-100 pt-6 flex items-end justify-between">
                          <p className="text-sm md:text-[15px] font-medium text-gray-500 leading-relaxed max-w-sm">
                             {item.desc}
                          </p>
                          <div className="w-10 h-10 rounded-full bg-[#F8FAFC] group-hover:bg-[#FB432C] border border-gray-100 group-hover:border-transparent flex items-center justify-center text-black group-hover:text-white transition-all duration-500 shrink-0 shadow-sm">
                             <ArrowRight className="w-4 h-4" />
                          </div>
                       </div>
                    </motion.div>
                 ))}
              </div>
           </div>
        </section>

        {/* Newsletter CTA */}
        <section className="py-32 bg-white text-center">
           <div className="max-w-2xl mx-auto px-6">
              <Newspaper className="w-12 h-12 text-black mx-auto mb-6 opacity-20" />
              <h2 className="text-3xl md:text-5xl font-extrabold text-black tracking-tighter uppercase mb-6">Stay Updated</h2>
              <p className="text-lg text-gray-500 font-medium mb-10 italic">
                 Subscribe to our developer and partner network dispatch. No spam, only crucial node updates.
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
