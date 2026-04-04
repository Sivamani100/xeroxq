"use client";

import { motion } from "framer-motion";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { 
  Building2, 
  ArrowRight, 
  TrendingUp, 
  Globe, 
  ShieldCheck, 
  Zap,
  CheckCircle2,
  Users
} from "lucide-react";

export default function CaseStudies() {
  const studies = [
    { 
      title: "Campus Hub Expansion", 
      client: "University of Tech", 
      metric: "80% reduction in wait times",
      desc: "How a major metropolitan campus decentralized their printing infrastructure to support 40,000 students across 12 independent shop nodes.", 
      tag: "Education",
      color: "text-blue-500"
    },
    { 
      title: "Zero-Knowledge Legal Archiving", 
      client: "Global Law Partners", 
      metric: "100% data autonomy",
      desc: "Bridging digital signatures to physical archives. Ensuring sensitive legal documents are physicalized without ever touching a centralized server.", 
      tag: "Legal",
      color: "text-emerald-500"
    },
    { 
      title: "Nomadic Workspace Network", 
      client: "WorkLive Global", 
      metric: "Global sub-second routing",
      desc: "Connecting 500+ co-working spaces into a single, unified print mesh for digital nomads and traveling executives.", 
      tag: "Enterprise",
      color: "text-amber-500"
    }
  ];

  return (
    <div className="min-h-screen bg-white selection:bg-brand-primary selection:text-white">
      <SiteHeader />
      
      <main className="pt-32 pb-16">
        {/* Case Studies Hero */}
        <section className="relative pb-24 text-center">
          <div className="max-w-[1280px] mx-auto px-6 space-y-12 relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="inline-flex items-center gap-2 px-3 py-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded-md shadow-sm mb-6"
            >
              <TrendingUp className="w-3.5 h-3.5 text-black" />
              <span className="text-[10px] font-black tracking-[0.2em] text-black uppercase">Customer Success Stories</span>
            </motion.div>
            
            <div className="space-y-6 max-w-4xl mx-auto">
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-[64px] lg:text-[100px] font-bold text-black tracking-tighter leading-[0.85] uppercase"
              >
                Physical Results. <br /> Global Scale.
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-2xl text-[#64748B] font-medium max-w-3xl mx-auto leading-relaxed"
              >
                Discover how organizations worldwide are leveraging the XeroxQ protocol to secure their document infrastructure.
              </motion.p>
            </div>
          </div>
        </section>

        {/* Case Studies Grid */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="py-16 border-y border-[#E2E8F0] bg-[#F8FAFC]"
        >
           <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
              {studies.map((study, i) => (
                <motion.div 
                  key={study.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="group bg-white p-8 rounded-xl border border-[#E2E8F0] hover:shadow-xl transition-all relative overflow-hidden"
                >
                  <div className="space-y-6 relative z-10">
                     <div className="flex items-center justify-between">
                        <span className="px-3 py-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded-md text-[9px] font-black text-black uppercase tracking-[0.2em]">
                           {study.tag}
                        </span>
                        <div className="flex items-center gap-2 text-black font-black text-[9px] tracking-widest uppercase">
                           <CheckCircle2 className="w-3 h-3" /> VERIFIED CASE
                        </div>
                     </div>
                     
                     <div className="space-y-3">
                        <h3 className="text-2xl font-bold text-black tracking-tight leading-none uppercase">{study.title}</h3>
                        <p className="text-sm text-[#64748B] font-medium leading-relaxed italic opacity-80">"{study.desc}"</p>
                     </div>

                     <div className="p-6 bg-black rounded-lg text-white flex flex-col md:flex-row items-center justify-between gap-6 group-hover:scale-[1.01] transition-transform shadow-xl">
                        <div className="text-left">
                           <div className="text-xl font-black tracking-tighter uppercase">{study.metric}</div>
                           <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">{study.client}</div>
                        </div>
                        <button className="h-9 px-4 bg-white text-black font-black text-[9px] uppercase tracking-widest rounded-md transition-all flex items-center gap-2 hover:bg-white/90 active:scale-95">
                           FULL REPORT <ArrowRight className="w-3 h-3" />
                        </button>
                     </div>
                  </div>
                </motion.div>
              ))}
           </div>
        </motion.section>

        {/* Global Impact CTA */}
        <motion.section 
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="py-24"
        >
           <div className="max-w-[700px] mx-auto text-center space-y-8 px-6">
              <h2 className="text-4xl lg:text-5xl font-bold text-black tracking-tight leading-loose uppercase">Protocol Success.</h2>
              <p className="text-sm text-[#64748B] font-medium leading-relaxed max-w-lg mx-auto italic opacity-70">
                 "Our decentralized infrastructure scales from local campus hubs to global enterprise networks without compromise."
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                 <button className="h-11 px-8 bg-black text-white font-black text-[10px] uppercase tracking-widest rounded-lg shadow-xl transition-all active:scale-95">
                    INITIATE INTEGRATION
                 </button>
                 <button className="h-11 px-8 border border-[#E2E8F0] hover:bg-[#F8FAFC] text-black font-black text-[10px] uppercase tracking-widest rounded-lg transition-all">
                    TALK TO SOLUTIONS
                 </button>
              </div>
           </div>
        </motion.section>
      </main>

      <SiteFooter />
    </div>
  );
}
