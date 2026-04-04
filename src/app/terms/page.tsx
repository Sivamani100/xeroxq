"use client";

import { motion } from "framer-motion";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ShieldCheck, Lock, FileText, ArrowRight } from "lucide-react";

export default function TermsOfUse() {
  const sections = [
    { title: "Acceptance of Terms", content: "By accessing or using the XeroxQ platform, you agree to be bound by these Terms of Use and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site." },
    { title: "Use License", content: "Permission is granted to temporarily download one copy of the materials on XeroxQ's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not modify or copy the materials." },
    { title: "Disclaimer", content: "The materials on XeroxQ's website are provided on an 'as is' basis. XeroxQ makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability or fitness for a particular purpose." },
    { title: "Limitations", content: "In no event shall XeroxQ or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on XeroxQ's website." },
    { title: "Accuracy of Materials", content: "The materials appearing on XeroxQ's website could include technical, typographical, or photographic errors. XeroxQ does not warrant that any of the materials on its website are accurate, complete or current." },
    { title: "Governing Law", content: "These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction in which XeroxQ operates, and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location." }
  ];

  return (
    <div className="min-h-screen bg-white selection:bg-black selection:text-white">
      <SiteHeader />
      
      <main className="pt-32 pb-16">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 items-start">
            
            {/* Left Sidebar - TOC */}
            <aside className="hidden lg:block lg:col-span-3 sticky top-32">
              <div className="space-y-10">
                 <div className="flex flex-col gap-3">
                    <span className="text-[10px] font-black text-black uppercase tracking-[0.2em] mb-3">Legal Navigation</span>
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
                       <ShieldCheck className="w-5 h-5 text-black" />
                    </div>
                    <div className="space-y-2">
                       <h4 className="text-xs font-black text-black tracking-tight uppercase leading-none">Need a Summary?</h4>
                       <p className="text-[11px] text-[#64748B] font-medium leading-relaxed italic">
                          "Protocol terms are optimized for zero ambiguity. Clarity exceeds complexity."
                       </p>
                    </div>
                    <button className="text-[9px] font-black text-black border-b border-black/10 hover:border-black transition-all flex items-center gap-2 uppercase tracking-widest">
                       SECURE INQUIRY <ArrowRight className="w-3 h-3" />
                    </button>
                 </div>
              </div>
            </aside>

            {/* Right Side - Content */}
            <div className="lg:col-span-9 max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-12"
              >
                 <div className="space-y-6">
                   <div className="inline-flex items-center gap-2 px-3 py-1 bg-black/5 rounded-md border border-black/5">
                      <FileText className="w-3.5 h-3.5 text-black" />
                      <span className="text-[10px] font-black tracking-[0.1em] text-black uppercase">Standard Protocol Terms</span>
                   </div>
                   <h1 className="text-5xl lg:text-7xl font-bold text-black tracking-tighter leading-[0.95] uppercase">Terms Of Use</h1>
                   <div className="flex items-center gap-8 pt-4">
                      <div className="flex flex-col">
                         <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest leading-none mb-2">LAST REVISION</span>
                         <span className="text-[11px] font-black text-black uppercase tracking-widest">APR 04, 2026</span>
                      </div>
                      <div className="w-[1px] h-10 bg-[#E2E8F0]" />
                      <div className="flex flex-col">
                         <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest leading-none mb-2">REVISION ID</span>
                         <span className="text-[11px] font-black text-black uppercase tracking-widest">v4.2.0-LEGAL</span>
                      </div>
                   </div>
                </div>

                <div className="prose prose-slate max-w-none">
                  <p className="text-xl text-[#475569] font-medium leading-relaxed mb-16">
                    Effective communication and transparency are the foundations of the XeroxQ Community. These terms govern your interaction with our protocol and print network.
                  </p>
                  
                  <div className="space-y-16">
                    {sections.map((section, i) => (
                      <section key={section.title} id={`section-${i}`} className="scroll-mt-32">
                        <h3 className="text-xl font-bold text-black tracking-tight mb-4 uppercase">{section.title}</h3>
                        <p className="text-[#64748B] font-medium text-sm leading-relaxed">{section.content}</p>
                      </section>
                    ))}
                  </div>
                </div>

                {/* Final Acceptance */}
                <div className="mt-24 p-12 bg-black rounded-xl border border-white/10 relative overflow-hidden text-center group">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-[0.03] blur-[100px] rounded-full" />
                   <div className="relative z-10 space-y-8">
                      <div className="w-14 h-14 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                         <Lock className="w-7 h-7 text-white" />
                      </div>
                      <h4 className="text-2xl font-bold text-white tracking-tight leading-none uppercase">Initiate Session.</h4>
                      <p className="text-sm text-slate-400 font-medium max-w-sm mx-auto italic">"Acknowledgment of protocol constraints is mandatory before signal physicalization."</p>
                      <button 
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="h-11 px-8 bg-white text-black hover:bg-[#F8FAFC] font-black text-[10px] uppercase tracking-widest rounded-lg shadow-2xl transition-all"
                      >
                         ACCEPT AND CONTINUE
                      </button>
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
