"use client";

import { motion } from "framer-motion";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ShieldCheck, Lock, FileText, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TermsOfUse() {
  const sections = [
    { title: "Acceptance of Terms", content: "By accessing or using the XeroxQ platform, you agree to be bound by these Terms of Use and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site's routing endpoints." },
    { title: "Use License", content: "Permission is granted to temporarily interface with the XeroxQ public API for personal or commercial physicalization. This is the grant of a software routing license, not a transfer of title. You may not reverse engineer the zero-knowledge proprietary algorithms without explicit authorization." },
    { title: "Network Disclaimer", content: "The routing endpoints on XeroxQ are provided dynamically stringing together independent commercial shop owners. XeroxQ handles the encryption, but the final physical print quality relies on the end shop's hardware context." },
    { title: "Liability Constraints", content: "Because files are held in ephemeral RAM and instantly deleted via military-grade overwrite, XeroxQ cannot be liable for lost, unrecoverable, or unprinted documents if the target shop loses power or disconnects before completion." },
    { title: "Acceptable Use Policy", content: "You may not utilize the XeroxQ infrastructure to print illegal, harassing, or unauthorized copyrighted materials. While our routing is zero-knowledge and we cannot scan your file, shop nodes retain the right to cancel any received physical stream on-sight." },
    { title: "Governing Law", content: "These terms and network conditions are governed by and construed in accordance with the laws of the Republic of India (AP Jurisdiction). You irrevocably submit to the exclusive jurisdiction of the courts located in Andhra Pradesh for resolving protocol disputes." }
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-sans selection:bg-[#FB432C] selection:text-white overflow-x-hidden">
      <SiteHeader />
      
      <main className="flex-1 pt-32 pb-0">
        
        {/* Terms Hero */}
        <section className="relative pt-12 pb-16 text-center border-b border-gray-100">
          <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 0)', backgroundSize: '40px 40px' }} />
               
          <div className="max-w-[1280px] mx-auto px-6 relative z-10 flex flex-col items-center">
             <motion.div 
               variants={{
                 hidden: { opacity: 0, y: 20 },
                 visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
               }}
               initial="hidden"
               animate="visible"
               className="max-w-3xl"
             >
               <div className="inline-flex items-center gap-2.5 px-4 h-8 rounded-full bg-black/5 border border-black/5 mb-8">
                 <FileText className="w-3.5 h-3.5 text-black" />
                 <span className="text-[10px] font-bold text-black uppercase tracking-[0.2em] leading-none">Standard Protocols</span>
               </div>
               
               <h1 className="text-[40px] md:text-[64px] font-extrabold tracking-tighter text-black leading-[0.95] mb-8 uppercase">
                 Terms of Use
               </h1>
               
               <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 pt-4">
                  <div className="flex flex-col items-center text-center">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">LAST REVISION</span>
                     <span className="text-[12px] font-black text-black uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-md">APR 04, 2026</span>
                  </div>
                  <div className="w-[1px] h-8 bg-gray-200 hidden md:block" />
                  <div className="flex flex-col items-center text-center">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">REVISION ID</span>
                     <span className="text-[12px] font-black text-black uppercase tracking-widest bg-emerald-50 text-emerald-700 px-3 py-1 rounded-md">v4.2.0-LEGAL</span>
                  </div>
               </div>
             </motion.div>
          </div>
        </section>

        {/* Policy Content */}
        <section className="py-24 bg-white relative z-20">
           <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
             
             {/* Left Sidebar Navigation */}
             <aside className="hidden lg:block lg:col-span-4 sticky top-40">
               <div className="space-y-12 pr-8">
                  <div className="flex flex-col gap-4 border-l-2 border-gray-100 pl-6 relative">
                     <div className="absolute top-0 -left-[1px] w-0.5 h-16 bg-black" />
                     <span className="text-[10px] font-black text-black uppercase tracking-[0.2em] mb-2">Legal Navigation</span>
                     {sections.map((section, i) => (
                       <a 
                         key={section.title} 
                         href={`#section-${i}`}
                         className="text-[12px] font-bold text-gray-400 hover:text-black transition-colors flex items-center justify-between group uppercase tracking-widest py-1"
                       >
                          {section.title}
                          <CheckCircle2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#FB432C]" />
                       </a>
                     ))}
                  </div>
                  
                  {/* Trust Badge */}
                  <div className="p-8 bg-[#F8FAFC] rounded-[32px] border border-gray-200">
                     <div className="w-12 h-12 rounded-[16px] bg-white border border-gray-100 flex items-center justify-center shadow-sm mb-6">
                        <ShieldCheck className="w-5 h-5 text-black" />
                     </div>
                     <h4 className="text-sm font-black text-black tracking-tight uppercase mb-3">Zero Ambiguity</h4>
                     <p className="text-[13px] text-gray-500 font-medium leading-relaxed italic">
                        "Protocol terms are optimized for zero ambiguity. Clarity exceeds complexity in the secure routing space."
                     </p>
                  </div>
               </div>
             </aside>

             {/* Main Policy Body */}
             <div className="lg:col-span-8">
               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 className="space-y-16"
               >
                  <p className="text-xl md:text-2xl text-gray-500 font-medium leading-relaxed mb-16 italic border-l-4 border-black pl-6">
                    "Effective communication and transparency are the foundations of the XeroxQ Community. These terms govern your interaction with our zero-knowledge routing protocol and print network."
                  </p>
                  
                  <div className="space-y-16">
                    {sections.map((section, i) => (
                      <motion.section 
                        key={section.title} 
                        id={`section-${i}`} 
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05 }}
                        className="scroll-mt-32"
                      >
                        <h3 className="text-xl md:text-3xl font-black text-black tracking-tighter mb-6 uppercase">{section.title}</h3>
                        <p className="text-gray-600 font-medium text-base md:text-lg leading-relaxed">{section.content}</p>
                      </motion.section>
                    ))}
                  </div>

                  {/* Accept / Contact Block */}
                  <div className="mt-24 p-10 md:p-14 bg-black rounded-[40px] relative overflow-hidden group shadow-2xl flex flex-col md:flex-row items-center gap-10 justify-between text-center md:text-left text-white">
                     <div className="absolute top-0 right-0 w-80 h-80 bg-[#FB432C] opacity-[0.03] blur-[100px] rounded-full pointer-events-none" />
                     
                     <div className="relative z-10 space-y-4 flex-1">
                        <div className="w-16 h-16 rounded-[20px] bg-white/5 border border-white/10 flex items-center justify-center mb-6 mx-auto md:mx-0 shadow-sm">
                           <Lock className="w-8 h-8 text-white" />
                        </div>
                        <h4 className="text-2xl md:text-3xl font-extrabold tracking-tighter uppercase">Initiate Session</h4>
                        <p className="text-base text-gray-400 font-medium italic leading-relaxed max-w-sm">"Acknowledgment of protocol constraints is mandatory before signal physicalization."</p>
                     </div>
                     
                     <div className="relative z-10 shrink-0">
                        <button 
                          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                          className="h-16 px-8 bg-white hover:bg-[#FB432C] text-black hover:text-white font-black text-[12px] uppercase tracking-widest rounded-xl transition-all shadow-xl group-hover:shadow-[0_0_40px_-10px_rgba(251,67,44,0.3)] flex items-center gap-3"
                        >
                           ACCEPT PROTOCOL <ArrowRight className="w-4 h-4" />
                        </button>
                     </div>
                  </div>
               </motion.div>
             </div>

           </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
