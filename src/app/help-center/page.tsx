"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { 
  Search, 
  Book, 
  MessageSquare, 
  LifeBuoy, 
  ArrowRight,
  Printer,
  ShieldCheck,
  Zap,
  Globe,
  X
} from "lucide-react";

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    { title: "Getting Started", icon: Zap, color: "text-amber-500 dark:text-amber-400", count: 12 },
    { title: "Network Status", icon: Globe, color: "text-blue-500 dark:text-blue-400", count: 8 },
    { title: "Security Protocols", icon: ShieldCheck, color: "text-emerald-500 dark:text-emerald-400", count: 15 },
    { title: "Hardware Integration", icon: Printer, color: "text-[#FB432C]", count: 24 }
  ];

  const popularArticles = [
    "How to connect my printer to the XeroxQ Mesh?",
    "Managing enterprise document encryption.",
    "Understanding the decentralized routing protocol.",
    "Troubleshooting local document physicalization errors.",
    "Setting up zero-knowledge payment channels."
  ];

  const filteredArticles = popularArticles.filter((article) =>
    article.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#111113] text-[#171717] dark:text-[#EDEDED] selection:bg-[#FB432C] selection:text-white">
      <SiteHeader />
      
      <main className="pt-32 pb-16">
        {/* Search Hero */}
        <section className="relative pb-24 text-center">
          <div className="max-w-[1280px] mx-auto px-6 space-y-12 relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="inline-flex items-center gap-2 px-3 py-1 bg-[#F4F4F5] dark:bg-[#232325] border border-[#171717]/[0.10] dark:border-white/[0.10] rounded-md shadow-sm mb-6"
            >
              <LifeBuoy className="w-3.5 h-3.5 text-[#171717] dark:text-[#EDEDED]" />
              <span className="text-[10px] font-black tracking-[0.2em] text-[#171717] dark:text-[#EDEDED] uppercase">XeroxQ Support System</span>
            </motion.div>
            
            <div className="space-y-6 max-w-4xl mx-auto">
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-[64px] lg:text-[84px] font-bold text-[#171717] dark:text-[#EDEDED] tracking-tighter leading-[0.9] uppercase"
              >
                How can we <br className="hidden lg:block" /> help you today?
              </motion.h1>
            </div>

            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, delay: 0.2 }}
               className="max-w-xl mx-auto relative group"
            >
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#737373] dark:text-[#85858B] transition-colors group-hover:text-[#171717] dark:group-hover:text-[#EDEDED]" />
               <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="SEARCH ARCHITECTURE GUIDES / TROUBLESHOOTING..." 
                  className="w-full h-12 pl-11 pr-10 bg-[#F4F4F5] dark:bg-[#232325] text-[#171717] dark:text-[#EDEDED] placeholder:text-[#737373] dark:placeholder:text-[#85858B] border border-[#171717]/[0.12] dark:border-white/[0.12] rounded-lg text-[10px] font-black tracking-widest uppercase focus:border-[#171717]/30 dark:focus:border-white/30 focus:bg-white dark:focus:bg-[#19191B] focus:shadow-xl transition-all shadow-sm outline-none" 
               />
               {searchQuery && (
                 <button
                   type="button"
                   onClick={() => setSearchQuery("")}
                   aria-label="Clear search"
                   className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] dark:text-[#85858B] hover:text-[#171717] dark:hover:text-[#EDEDED] transition-colors"
                 >
                   <X className="w-4 h-4" />
                 </button>
               )}
            </motion.div>
          </div>
        </section>

        {/* Categories Grid */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="py-16 border-y border-[#171717]/[0.08] dark:border-white/[0.08] bg-[#F4F4F5]/70 dark:bg-[#151518]"
        >
           <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
              {categories.map((cat, i) => (
                <motion.div 
                  key={cat.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 bg-white dark:bg-[#19191B] rounded-xl border border-[#171717]/[0.08] dark:border-white/[0.08] hover:shadow-xl transition-all group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#F4F4F5] dark:bg-[#232325] border border-[#171717]/[0.10] dark:border-white/[0.10] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                     <cat.icon className={`w-5 h-5 ${cat.color}`} />
                  </div>
                  <h3 className="text-lg font-bold text-[#171717] dark:text-[#EDEDED] tracking-tight mb-2 uppercase leading-none">{cat.title}</h3>
                  <div className="flex items-center justify-between">
                     <span className="text-[9px] font-black text-[#737373] dark:text-[#85858B] uppercase tracking-widest leading-none">{cat.count} PROTOCOLS</span>
                     <ArrowRight className="w-3 h-3 text-[#737373]/50 dark:text-[#85858B]/50 group-hover:text-[#171717] dark:group-hover:text-[#EDEDED] group-hover:translate-x-1 transition-all" />
                  </div>
                </motion.div>
              ))}
           </div>
        </motion.section>

        {/* FAQ & Quick Links */}
        <section className="py-20 text-left bg-white dark:bg-[#111113]">
           <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16">
              <div className="lg:col-span-7 space-y-10">
                 <motion.h2 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="text-3xl font-bold text-[#171717] dark:text-[#EDEDED] tracking-tight uppercase"
                 >
                  Popular Support Topics
                 </motion.h2>
                 <div className="space-y-3">
                    {filteredArticles.length === 0 ? (
                      <div className="p-8 text-center bg-[#F4F4F5] dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-xl space-y-3">
                        <p className="text-sm font-bold text-[#171717] dark:text-[#EDEDED]">No matching support topics found</p>
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="px-4 py-2 bg-[#171717] dark:bg-[#EDEDED] text-white dark:text-[#111113] text-[10px] font-black uppercase tracking-widest rounded-lg"
                        >
                          Clear Search
                        </button>
                      </div>
                    ) : (
                      filteredArticles.map((article, i) => (
                         <motion.button 
                           key={article} 
                           initial={{ opacity: 0, y: 10 }}
                           whileInView={{ opacity: 1, y: 0 }}
                           viewport={{ once: true }}
                           transition={{ delay: i * 0.05 }}
                           className="w-full p-5 text-left bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-xl hover:bg-[#F4F4F5] dark:hover:bg-[#232325] transition-all flex items-center justify-between group"
                         >
                            <div className="flex items-center gap-4">
                               <Book className="w-4 h-4 text-[#737373] dark:text-[#85858B] group-hover:text-[#171717] dark:group-hover:text-[#EDEDED] transition-colors" />
                               <span className="font-bold text-[#171717] dark:text-[#EDEDED] tracking-tight text-sm uppercase">{article}</span>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-[#737373]/50 dark:text-[#85858B]/50 group-hover:text-[#171717] dark:group-hover:text-[#EDEDED] transition-all" />
                         </motion.button>
                      ))
                    )}
                 </div>
              </div>

              <div className="lg:col-span-5 space-y-6">
                 <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="p-8 bg-[#171717] dark:bg-[#19191B] rounded-xl border border-white/[0.08] text-white relative overflow-hidden group shadow-xl"
                 >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[60px] rounded-full" />
                    <div className="relative z-10 space-y-6">
                       <div className="w-12 h-12 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
                          <MessageSquare className="w-6 h-6 text-white" />
                       </div>
                       <h3 className="text-xl font-bold tracking-tight uppercase">Critical Assistance</h3>
                       <p className="text-[#A1A1A6] font-medium text-sm leading-relaxed italic">"Our protocol engineers are available for direct network support."</p>
                       <button className="h-11 px-8 bg-white hover:bg-[#F4F4F5] text-[#171717] font-black text-[10px] uppercase tracking-widest rounded-lg transition-all shadow-xl shadow-black/20 active:scale-95">
                          Contact Lead
                       </button>
                    </div>
                 </motion.div>

                 <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="p-8 bg-[#F4F4F5] dark:bg-[#19191B] rounded-xl border border-[#171717]/[0.08] dark:border-white/[0.08] space-y-4"
                 >
                    <h4 className="text-sm font-bold text-[#171717] dark:text-[#EDEDED] tracking-tight uppercase">Network Status</h4>
                    <p className="text-[12px] text-[#525252] dark:text-[#A1A1A6] font-medium leading-relaxed italic">
                       "A community-driven registry of decentralized hardware protocols."
                    </p>
                    <button className="text-[10px] font-black text-[#171717] dark:text-[#EDEDED] uppercase tracking-[0.2em] border-b border-[#171717]/15 dark:border-white/15 pb-1 hover:border-[#171717] dark:hover:border-white transition-all">
                       View Registry Status
                    </button>
                 </motion.div>
              </div>
           </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
