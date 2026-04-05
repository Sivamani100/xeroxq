"use client";

import { motion } from "framer-motion";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ShieldCheck, Database, Server, Trash2, Cpu, FileDigit, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DataProtectionPage() {
  const dataSpecs = [
    {
      title: "Payload Destruction",
      desc: "Exactly 30 seconds after the print spool receives your document, the RAM holding the file is overwritten 7 times, rendering it completely unrecoverable, even by forensics.",
      icon: Trash2,
      color: "text-[#FB432C]",
      bg: "bg-red-50",
      border: "border-red-100 group-hover:border-red-200"
    },
    {
      title: "No Persistent Backups",
      desc: "We do not run nightly backups on document servers. Your unencrypted files never touch a persistent SSD. If a server crashes mid-print, the file ceases to exist.",
      icon: Server,
      color: "text-blue-500",
      bg: "bg-blue-50",
      border: "border-blue-100 group-hover:border-blue-200"
    },
    {
      title: "AES-256 E2E Encryption",
      desc: "During transit, your file is encrypted with AES-256 over a TLS 1.3 channel. Only the specific physical shop terminal has the session key to decrypt and print.",
      icon: ShieldCheck,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
      border: "border-emerald-100 group-hover:border-emerald-200"
    }
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-sans selection:bg-[#FB432C] selection:text-white overflow-x-hidden">
      <SiteHeader />
      
      <main className="flex-1 pt-32 pb-0">
        
        {/* Data Hero */}
        <section className="relative pt-12 pb-16 text-center border-b border-gray-100">
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
                 <ShieldAlert className="w-3.5 h-3.5 text-black" />
                 <span className="text-[10px] font-bold text-black uppercase tracking-[0.2em] leading-none">Trust Center</span>
               </div>
               
               <h1 className="text-[50px] md:text-[80px] font-extrabold tracking-tighter text-black leading-[0.95] mb-6 uppercase">
                 Data Protection
               </h1>
               <p className="text-lg md:text-2xl font-medium text-gray-500 leading-relaxed italic max-w-2xl mx-auto">
                 "We do not want your data. The core premise of the XeroxQ platform is to move your file from your phone to a physical paper without leaving a digital trace."
               </p>
             </motion.div>
          </div>
        </section>

        {/* The 3 Pillars */}
        <section className="py-24 bg-white relative z-20">
           <div className="max-w-[1280px] mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {dataSpecs.map((spec, i) => (
                    <motion.div 
                       key={spec.title}
                       initial={{ opacity: 0, y: 30 }}
                       whileInView={{ opacity: 1, y: 0 }}
                       viewport={{ once: true }}
                       transition={{ delay: i * 0.15, duration: 0.6 }}
                       className={cn(
                          "group p-10 rounded-[32px] border relative overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/5",
                          spec.bg, spec.border
                       )}
                    >
                       <div className="w-16 h-16 rounded-[20px] bg-white flex items-center justify-center shadow-sm mb-8 group-hover:scale-110 transition-transform duration-500">
                          <spec.icon className={cn("w-7 h-7", spec.color)} />
                       </div>
                       <h3 className="text-2xl font-black text-black tracking-tighter uppercase leading-none mb-4">{spec.title}</h3>
                       <p className="text-[15px] font-medium text-gray-700 leading-relaxed">
                          {spec.desc}
                       </p>
                    </motion.div>
                 ))}
              </div>
           </div>
        </section>

        {/* What We Keep vs What We Shred */}
        <section className="py-32 bg-[#F8FAFC] border-y border-gray-100">
           <div className="max-w-[1000px] mx-auto px-6">
              <div className="text-center mb-16">
                 <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-black mb-4">The Ledger Reality</h2>
                 <p className="text-gray-500 font-medium max-w-lg mx-auto">Absolute transparency on the exact bytes of data our API retains to keep the network functional.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
                 
                 {/* Retained Data */}
                 <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="p-8 md:p-12 bg-white rounded-[32px] border border-gray-200 shadow-xl shadow-black/5"
                 >
                    <div className="flex items-center gap-4 mb-8">
                       <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <Database className="w-5 h-5 text-gray-500" />
                       </div>
                       <div>
                          <h3 className="text-2xl font-black uppercase tracking-tighter text-black">Retained (Metadata)</h3>
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Stored on Secure SSD</span>
                       </div>
                    </div>
                    
                    <ul className="space-y-4">
                       {[
                         "Unique transaction IDs (e.g. xrq_txn_89421)",
                         "Target Shop Identifier (e.g. shp_AP_94)",
                         "Timestamp of routing (not print completion)",
                         "Basic Client User-Agent for rendering UI"
                       ].map((item, i) => (
                          <li key={i} className="flex items-start gap-3 border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                             <div className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full bg-gray-300" />
                             <span className="text-sm font-medium text-gray-600">{item}</span>
                          </li>
                       ))}
                    </ul>
                 </motion.div>

                 {/* Shredded Data */}
                 <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="p-8 md:p-12 bg-black rounded-[32px] border border-black text-white shadow-2xl relative overflow-hidden"
                 >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#FB432C] opacity-10 blur-[100px] rounded-full" />
                    
                    <div className="relative z-10">
                       <div className="flex items-center gap-4 mb-8">
                          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                             <FileDigit className="w-5 h-5 text-[#FB432C]" />
                          </div>
                          <div>
                             <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Shredded/Refused</h3>
                             <span className="text-[10px] font-black uppercase tracking-widest text-[#FB432C]">Never Hits Database</span>
                          </div>
                       </div>
                       
                       <ul className="space-y-4">
                          {[
                            "The actual Document / PDF / Image primitive",
                            "The Document Filename (e.g. 'Aadhar_final.pdf')",
                            "Sender IP Address (Anonymized at Edge)",
                            "Any content-based EXIF data in imagery"
                          ].map((item, i) => (
                             <li key={i} className="flex items-start gap-3 border-b border-white/10 pb-4 last:border-0 last:pb-0">
                                <div className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full bg-[#FB432C]" />
                                <span className="text-sm font-medium text-gray-300">{item}</span>
                             </li>
                          ))}
                       </ul>
                    </div>
                 </motion.div>

              </div>
           </div>
        </section>

        {/* CTO Quote */}
        <section className="py-24 px-6 bg-white border-b border-gray-100">
           <div className="max-w-[1280px] mx-auto text-center">
              <Cpu className="w-12 h-12 text-black mx-auto mb-6 opacity-20" />
              <h2 className="text-3xl md:text-4xl font-extrabold text-black tracking-tighter uppercase mb-6 max-w-4xl mx-auto leading-tight">
                 "If a government agency walked into our office and asked for the file you printed yesterday, we physically couldn't give it to them because it's already gone."
              </h2>
              <span className="text-[12px] font-black uppercase tracking-[0.2em] text-[#FB432C]">— XeroxQ Core Development Team</span>
           </div>
        </section>

      </main>

      <SiteFooter />
    </div>
  );
}
