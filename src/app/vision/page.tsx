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
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-sans selection:bg-[#FB432C] selection:text-white overflow-x-hidden">
      <SiteHeader />
      
      <main className="flex-1 pt-32 pb-0">
        
        {/* Cinematic Hero */}
        <section className="relative pt-24 pb-32 text-center overflow-hidden">
          {/* Subtle grid background */}
          <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
               style={{ backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
               
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
               <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-black/10 bg-white/50 backdrop-blur-md shadow-xl shadow-black/5 mb-8">
                 <Eye className="w-4 h-4 text-black" />
                 <span className="text-[10px] font-black text-black uppercase tracking-[0.2em]">The Manifesto</span>
               </div>
               
               <h1 className="text-[50px] md:text-[80px] font-extrabold tracking-tighter text-black leading-[0.95] mb-8 uppercase">
                 Physicalize The <br />
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-black to-gray-500">Digital World.</span>
               </h1>
               
               <p className="text-xl md:text-2xl font-medium text-gray-500 leading-relaxed italic max-w-3xl mx-auto border-l-4 border-[#FB432C] pl-6 text-left">
                 "Printing is not dying; it is evolving. Our vision is to eliminate the severe friction and privacy risks associated with commercial printing, transforming local retail shops into secure, zero-trace hardware primitives for the everyday consumer."
               </p>
             </motion.div>
          </div>
        </section>

        {/* The Problem & Solution (Before/After) */}
        <section className="py-24 bg-white relative z-20 border-y border-gray-100">
           <div className="max-w-[1280px] mx-auto px-6">
              <div className="text-center mb-16">
                 <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-black mb-4">The Paradigm Shift</h2>
                 <p className="text-gray-500 font-medium">Moving from persistent storage to ephemeral delivery.</p>
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
                          side.state === 'failure' ? "bg-gray-50 border-gray-200" : "bg-black border-black shadow-2xl shadow-black/10 text-white"
                       )}
                    >
                       {/* Background decoration */}
                       {side.state === 'failure' && <Unplug className="absolute -bottom-10 -right-10 w-64 h-64 text-gray-200 opacity-50 group-hover:scale-110 transition-transform duration-700" />}
                       {side.state === 'success' && <ShieldCheck className="absolute -bottom-10 -right-10 w-64 h-64 text-emerald-900 opacity-20 group-hover:scale-110 transition-transform duration-700" />}

                       <div className="relative z-10">
                          <side.icon className={cn("w-12 h-12 mb-6", side.state === 'failure' ? "text-gray-400" : "text-emerald-400")} />
                          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-70">{side.subtitle}</h3>
                          <h4 className={cn("text-4xl font-extrabold uppercase tracking-tight mb-8", side.state === 'failure' ? "text-black" : "text-emerald-500")}>{side.title}</h4>
                          
                          <ul className="space-y-4">
                             {side.points.map((pt, index) => (
                                <li key={index} className="flex items-start gap-3">
                                   <div className={cn("mt-1 shrink-0", side.state === 'failure' ? "text-gray-400" : "text-[#FB432C]")}>
                                      <ChevronRight className="w-4 h-4" />
                                   </div>
                                   <span className={cn("font-medium leading-relaxed", side.state === 'failure' ? "text-gray-600" : "text-gray-300")}>{pt}</span>
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
        <section className="py-32 bg-[#F8FAFC]">
           <div className="max-w-[1000px] mx-auto px-6 text-center">
              <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 viewport={{ once: true }}
                 transition={{ duration: 0.6 }}
              >
                 <div className="w-20 h-20 bg-white border border-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm">
                    <Map className="w-10 h-10 text-black" />
                 </div>
                 <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-black mb-6">Phase 1: Andhra Pradesh</h2>
                 <p className="text-xl text-gray-600 font-medium leading-relaxed mb-10 max-w-2xl mx-auto italic">
                    Before we scale natively across India, our immediate roadmap targets establishing a verified Print Node in all 26 districts of Andhra Pradesh, yielding a decentralized mesh of 1,000+ commercial shops.
                 </p>
                 
                 <div className="inline-flex flex-col sm:flex-row items-center gap-4">
                    <div className="px-6 py-3 bg-black text-white rounded-xl font-bold text-[12px] uppercase tracking-widest shadow-xl shadow-black/10 flex items-center gap-2">
                       <Database className="w-4 h-4" /> 26 Districts
                    </div>
                    <div className="px-6 py-3 bg-white border border-gray-200 text-black rounded-xl font-bold text-[12px] uppercase tracking-widest shadow-sm flex items-center gap-2">
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
