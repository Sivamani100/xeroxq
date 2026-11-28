"use client";

import { motion } from "framer-motion";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { 
  Eye, 
  Map, 
  ShieldCheck, 
  Smartphone,
  Printer,
  ChevronRight,
  Database,
  Unplug
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function VisionPage() {
  const comparison = [
    {
      title: "The Old Way",
      subtitle: "Messaging Apps",
      state: "failure",
      points: [
        "Store your files indefinitely on shop owner's laptop.",
        "Requires adding unknown persons to your contacts.",
        "Compression ruins document quality.",
        "Zero transparency on file deletion."
      ],
      icon: Smartphone
    },
    {
      title: "The XeroxQ Way",
      subtitle: "Zero-Trace Protocol",
      state: "success",
      points: [
        "Files held strictly in ephemeral RAM. Never hits disk.",
        "Anonymous QR routing. No contact sharing.",
        "100% Vector Quality Retention.",
        "Auto-shreds payload exactly 30s after printing."
      ],
      icon: ShieldCheck
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#111113] text-[#171717] dark:text-[#EDEDED] flex flex-col font-sans selection:bg-[#FB432C] selection:text-white overflow-x-hidden">
      <SiteHeader />
      
      <main className="flex-1 pt-32 pb-0">
        
        {/* Cinematic Hero */}
        <section className="relative pt-24 pb-32 text-center overflow-hidden">
          {/* Subtle grid background */}
          <div className="absolute inset-0 z-0 opacity-[0.04] dark:opacity-[0.06] text-[#171717] dark:text-white pointer-events-none" 
               style={{ backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
               
          <div className="max-w-[1280px] mx-auto px-6 relative z-10">
             <motion.div 
               variants={{
                 hidden: { opacity: 0, y: 30 },
                 visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
               }}
               initial="hidden"
               animate="visible"
               className="mx-auto max-w-4xl"
             >
               <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-[#171717]/[0.10] dark:border-white/[0.10] bg-white/70 dark:bg-[#232325]/80 backdrop-blur-md shadow-xl shadow-black/5 mb-8">
                 <Eye className="w-4 h-4 text-[#171717] dark:text-[#EDEDED]" />
                 <span className="text-[10px] font-black text-[#171717] dark:text-[#EDEDED] uppercase tracking-[0.2em]">The Manifesto</span>
               </div>
               
               <h1 className="text-[50px] md:text-[80px] font-extrabold tracking-tighter text-[#171717] dark:text-[#EDEDED] leading-[0.95] mb-8 uppercase">
                 Physicalize The <br />
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#171717] to-[#737373] dark:from-[#EDEDED] dark:to-[#85858B]">Digital World.</span>
               </h1>
               
               <p className="text-xl md:text-2xl font-medium text-[#525252] dark:text-[#A1A1A6] leading-relaxed italic max-w-3xl mx-auto border-l-4 border-[#FB432C] pl-6 text-left">
                 "Printing is not dying; it is evolving. Our vision is to eliminate the severe friction and privacy risks associated with commercial printing, transforming local retail shops into secure, zero-trace hardware primitives for the everyday consumer."
               </p>
             </motion.div>
          </div>
        </section>

        {/* The Problem & Solution (Before/After) */}
        <section className="py-24 bg-white dark:bg-[#19191B] relative z-20 border-y border-[#171717]/[0.08] dark:border-white/[0.08]">
           <div className="max-w-[1280px] mx-auto px-6">
              <div className="text-center mb-16">
                 <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-[#171717] dark:text-[#EDEDED] mb-4">The Paradigm Shift</h2>
                 <p className="text-[#525252] dark:text-[#A1A1A6] font-medium">Moving from persistent storage to ephemeral delivery.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
                 {comparison.map((side, i) => (
                    <motion.div 
                       key={side.title}
                       initial={{ opacity: 0, y: 30 }}
                       whileInView={{ opacity: 1, y: 0 }}
                       viewport={{ once: true }}
                       transition={{ delay: i * 0.2 }}
                       className={cn(
                          "p-8 md:p-12 rounded-[32px] border relative overflow-hidden group",
                          side.state === 'failure'
                            ? "bg-[#F4F4F5] dark:bg-[#232325] border-[#171717]/[0.10] dark:border-white/[0.10]"
                            : "bg-[#171717] dark:bg-[#111113] border-white/[0.08] shadow-2xl shadow-black/10 text-white"
                       )}
                    >
                       {/* Background decoration */}
                       {side.state === 'failure' && <Unplug className="absolute -bottom-10 -right-10 w-64 h-64 text-[#171717]/[0.06] dark:text-white/[0.05] group-hover:scale-110 transition-transform duration-700" />}
                       {side.state === 'success' && <ShieldCheck className="absolute -bottom-10 -right-10 w-64 h-64 text-emerald-500/15 group-hover:scale-110 transition-transform duration-700" />}

                       <div className="relative z-10">
                          <side.icon className={cn("w-12 h-12 mb-6", side.state === 'failure' ? "text-[#737373] dark:text-[#85858B]" : "text-emerald-400")} />
                          <h3 className={cn("text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-70", side.state === 'failure' ? "text-[#525252] dark:text-[#A1A1A6]" : "text-white/70")}>{side.subtitle}</h3>
                          <h4 className={cn("text-4xl font-extrabold uppercase tracking-tight mb-8", side.state === 'failure' ? "text-[#171717] dark:text-[#EDEDED]" : "text-emerald-400")}>{side.title}</h4>
                          
                          <ul className="space-y-4">
                             {side.points.map((pt, index) => (
                                <li key={index} className="flex items-start gap-3">
                                   <div className={cn("mt-1 shrink-0", side.state === 'failure' ? "text-[#737373] dark:text-[#85858B]" : "text-[#FB432C]")}>
                                      <ChevronRight className="w-4 h-4" />
                                   </div>
                                   <span className={cn("font-medium leading-relaxed", side.state === 'failure' ? "text-[#525252] dark:text-[#A1A1A6]" : "text-gray-300")}>{pt}</span>
                                </li>
                             ))}
                          </ul>
                       </div>
                    </motion.div>
                 ))}
              </div>
           </div>
        </section>

        {/* Phase 1 Target */}
        <section className="py-32 bg-[#FAFAFA] dark:bg-[#111113]">
           <div className="max-w-[1000px] mx-auto px-6 text-center">
              <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 viewport={{ once: true }}
                 transition={{ duration: 0.6 }}
              >
                 <div className="w-20 h-20 bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm">
                    <Map className="w-10 h-10 text-[#171717] dark:text-[#EDEDED]" />
                 </div>
                 <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-[#171717] dark:text-[#EDEDED] mb-6">Phase 1: Andhra Pradesh</h2>
                 <p className="text-xl text-[#525252] dark:text-[#A1A1A6] font-medium leading-relaxed mb-10 max-w-2xl mx-auto italic">
                    Before we scale natively across India, our immediate roadmap targets establishing a verified Print Node in all 26 districts of Andhra Pradesh, yielding a decentralized mesh of 1,000+ commercial shops.
                 </p>
                 
                 <div className="inline-flex flex-col sm:flex-row items-center gap-4">
                    <div className="px-6 py-3 bg-[#171717] dark:bg-[#FB432C] text-white rounded-xl font-bold text-[12px] uppercase tracking-widest shadow-xl shadow-black/10 flex items-center gap-2">
                       <Database className="w-4 h-4" /> 26 Districts
                    </div>
                    <div className="px-6 py-3 bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] text-[#171717] dark:text-[#EDEDED] rounded-xl font-bold text-[12px] uppercase tracking-widest shadow-sm flex items-center gap-2">
                       <Printer className="w-4 h-4" /> 1000+ Nodes
                    </div>
                 </div>
              </motion.div>
           </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
