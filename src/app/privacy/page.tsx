"use client";

import { motion } from "framer-motion";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ShieldCheck, Lock, Eye, Database, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PrivacyPolicy() {
  const sections = [
    { title: "Transparency First", content: "At XeroxQ, privacy is not a feature—it's the foundation. We operate a zero-knowledge protocol where your documents are encrypted locally on your device before reaching any print node. The shop owner can only decrypt it exactly when they click print." },
    { title: "Data Autonomy", content: "You own your data. We do not store, scan, or monetize any document content. Once a document is printed or the session expires, it is permanently erased from the network's transient memory via a military-grade 7-pass overwrite." },
    { title: "Information We Collect", content: "We collect minimal metadata: strictly what is necessary for shop routing and payment verification. This includes IP-based geolocation (for shop discovery), device type for responsive UI formatting, and basic temporal transaction logs." },
    { title: "Network Nodes", content: "XeroxQ shops are independent operators. While they process your documents under our security protocol, they never have access to your raw files on their persistent disk drives. The protocol handles the spooling natively in RAM." },
    { title: "Security Protocols", content: "We use high-grade AES-256 encryption over TLS 1.3. Every 'Signal' sent through the XeroxQ Mesh is authenticated and verified for integrity, ensuring no packet interception or man-in-the-middle attack is possible." },
    { title: "Children's Privacy", content: "XeroxQ does not knowingly collect any personally identifiable information from children under the age of 13. If you believe your child provided this information, please contact our data officers immediately." }
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-sans selection:bg-[#FB432C] selection:text-white overflow-x-hidden">
      <SiteHeader />
      
      <main className="flex-1 pt-32 pb-0">
        
        {/* Privacy Hero */}
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
                 <ShieldCheck className="w-3.5 h-3.5 text-black" />
                 <span className="text-[10px] font-bold text-black uppercase tracking-[0.2em] leading-none">Security Protocol</span>
               </div>
               
               <h1 className="text-[40px] md:text-[64px] font-extrabold tracking-tighter text-black leading-[0.95] mb-8 uppercase">
                 Privacy Policy
               </h1>
               
               <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 pt-4">
                  <div className="flex flex-col items-center text-center">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">LAST REVISION</span>
                     <span className="text-[12px] font-black text-black uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-md">APR 04, 2026</span>
                  </div>
                  <div className="w-[1px] h-8 bg-gray-200 hidden md:block" />
                  <div className="flex flex-col items-center text-center">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">NETWORK STATE</span>
                     <span className="text-[12px] font-black text-black uppercase tracking-widest bg-emerald-50 text-emerald-700 px-3 py-1 rounded-md">v4.2.0-STABLE</span>
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
                     <span className="text-[10px] font-black text-black uppercase tracking-[0.2em] mb-2">Policy Navigation</span>
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
                        <Database className="w-5 h-5 text-black" />
                     </div>
                     <h4 className="text-sm font-black text-black tracking-tight uppercase mb-3">Zero Persistence</h4>
                     <p className="text-[13px] text-gray-500 font-medium leading-relaxed italic">
                        "Transient physicalization logic ensuring absolute E2E document volatility. We literally cannot see your files."
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
                    "At XeroxQ Labs, we believe that decentralized document delivery is the only way to ensure true privacy in a digital world. You shouldn't have to surrender your personal data just to print a piece of paper."
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

                  {/* Open Source / Audit Footer Block */}
                  <div className="mt-24 p-10 md:p-14 bg-black rounded-[40px] relative overflow-hidden group shadow-2xl">
                     <div className="absolute top-0 right-0 w-80 h-80 bg-white opacity-[0.03] blur-[100px] rounded-full pointer-events-none" />
                     <div className="relative z-10 flex flex-col md:flex-row items-center gap-10 md:gap-14">
                        <div className="w-20 h-20 shrink-0 rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#FB432C] transition-all duration-500 shadow-xl">
                           <Eye className="w-8 h-8 text-white" />
                        </div>
                        <div className="space-y-4 text-center md:text-left">
                           <h4 className="text-2xl md:text-3xl font-extrabold text-white tracking-tighter uppercase">Technical Accountability</h4>
                           <p className="text-base text-gray-400 font-medium max-w-md italic leading-relaxed">"Code is absolute. Our routing and shredding logic is subject to continuous third-party penetration testing."</p>
                           <div className="pt-2">
                              <button className="h-12 px-8 bg-white text-black hover:bg-gray-200 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-xl">
                                 Read Audit Report
                              </button>
                           </div>
                        </div>
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
