"use client";

import { motion } from "framer-motion";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ShieldCheck, Lock, Eye, ArrowRight, Database } from "lucide-react";

export default function PrivacyPolicy() {
  const sections = [
    { title: "Transparency First", content: "At XeroxQ, privacy is not a feature—it's the foundation. We operate a zero-knowledge protocol where your documents are encrypted locally on your device before reaching any print node." },
    { title: "Data Autonomy", content: "You own your data. We do not store, scan, or monetize any document content. Once a document is printed or the session expires, it is permanently erased from the network's transient memory." },
    { title: "Information We Collect", content: "We collect minimal metadata: strictly what is necessary for shop routing and payment verification. This includes IP-based geolocation (for shop discovery) and basic transaction logs." },
    { title: "Network Nodes", content: "XeroxQ shops are independent operators. While they process your documents under our security protocol, they never have access to your raw, unencrypted files." },
    { title: "Security Protocols", content: "We use high-grade AES-256 encryption. Every 'Signal' sent through the XeroxQ Mesh is authenticated and verified for integrity, ensuring no interception is possible." },
    { title: "Children's Privacy", content: "XeroxQ does not knowingly collect any personally identifiable information from children under the age of 13. If you believe your child provided this information, please contact us immediately." }
  ];

  return (
    <div className="min-h-screen bg-white selection:bg-[#FB432C] selection:text-white">
      <SiteHeader />
      
      <main className="pt-32 pb-16">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 items-start">
            
            {/* Left Sidebar */}
            <aside className="hidden lg:block lg:col-span-3 sticky top-32">
              <div className="space-y-10">
                 <div className="flex flex-col gap-3">
                    <span className="text-[10px] font-black text-black uppercase tracking-[0.2em] mb-3">Privacy Navigation</span>
                    {sections.map((section, i) => (
                      <a 
                        key={section.title} 
                        href={`#section-${i}`}
                        className="text-[11px] font-black text-[#64748B] hover:text-black transition-colors flex items-center gap-2 group uppercase tracking-widest"
                      >
                         <div className="w-1.5 h-1.5 rounded-full bg-[#E2E8F0] group-hover:bg-black transition-colors" />
                         {section.title}
                      </a>
                    ))}
                 </div>
                 
                 <div className="p-6 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-4">
                    <div className="w-10 h-10 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center shadow-sm">
                       <Database className="w-5 h-5 text-black" />
                    </div>
                    <div className="space-y-2">
                       <h4 className="text-xs font-black text-black tracking-tight uppercase leading-none">Zero Persistence</h4>
                       <p className="text-[11px] text-[#64748B] font-medium leading-relaxed italic">
                          "Transient physicalization logic ensuring absolute E2E document volatility."
                       </p>
                    </div>
                 </div>
              </div>
            </aside>

            {/* Right Content */}
            <div className="lg:col-span-9 max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-12"
              >
                 <div className="space-y-6">
                   <div className="inline-flex items-center gap-2 px-3 py-1 bg-black/5 rounded-md border border-black/5">
                      <Lock className="w-3.5 h-3.5 text-black" />
                      <span className="text-[10px] font-black tracking-[0.1em] text-black uppercase">Privacy-By-Design</span>
                   </div>
                   <h1 className="text-5xl lg:text-7xl font-bold text-black tracking-tighter leading-[0.95] uppercase">Security Protocol</h1>
                   <div className="flex items-center gap-8 pt-4">
                      <div className="flex flex-col">
                         <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest leading-none mb-2">LAST REVISION</span>
                         <span className="text-[11px] font-black text-black uppercase tracking-widest">APR 04, 2026</span>
                      </div>
                      <div className="w-[1px] h-10 bg-[#E2E8F0]" />
                      <div className="flex flex-col">
                         <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest leading-none mb-2">NETWORK STATE</span>
                         <span className="text-[11px] font-black text-black uppercase tracking-widest">v4.2.0-STABLE</span>
                      </div>
                   </div>
                </div>

                <div className="prose prose-slate max-w-none">
                  <p className="text-xl text-[#475569] font-medium leading-relaxed mb-16 italic">
                    "At XeroxQ Labs, we believe that decentralized document delivery is the only way to ensure true privacy in a digital world."
                  </p>
                  
                  <div className="space-y-16">
                    {sections.map((section, i) => (
                      <motion.section 
                        key={section.title} 
                        id={`section-${i}`} 
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.08 }}
                        className="scroll-mt-32"
                      >
                        <h3 className="text-xl font-bold text-black tracking-tight mb-4 uppercase">{section.title}</h3>
                        <p className="text-[#64748B] font-medium text-sm leading-relaxed italic opacity-80">"{section.content}"</p>
                      </motion.section>
                    ))}
                  </div>
                </div>

                <div className="mt-24 p-10 bg-black rounded-xl border border-white/5 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-[0.03] blur-[100px] rounded-full" />
                   <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                      <div className="w-14 h-14 shrink-0 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                         <Eye className="w-7 h-7 text-white" />
                      </div>
                      <div className="space-y-3 text-left">
                         <h4 className="text-xl font-bold text-white tracking-tight leading-none uppercase">Technical Accountability</h4>
                         <p className="text-sm text-slate-400 font-medium max-w-md italic">"Code is absolute. Open-source physicalization logic for the global trust era."</p>
                         <button className="text-[10px] font-black text-white border-b border-white/20 hover:border-white transition-all pb-1 uppercase tracking-widest">
                            SECURITY AUDIT / GITHUB
                         </button>
                      </div>
                   </div>
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
