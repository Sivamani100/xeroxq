"use client";

import { motion } from "framer-motion";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { 
  Send, 
  CheckCircle2, 
  Building2, 
  Globe, 
  ShieldCheck, 
  Zap,
  ArrowRight
} from "lucide-react";

export default function DemoRequest() {
  const benefits = [
    { title: "Custom Workflow Analysis", icon: Zap, color: "text-amber-500" },
    { title: "Network Capacity Audit", icon: Globe, color: "text-blue-500" },
    { title: "Security Compliance Review", icon: ShieldCheck, color: "text-emerald-500" }
  ];

  return (
    <div className="min-h-screen bg-white selection:bg-black selection:text-white">
      <SiteHeader />
      
      <main className="pt-32 pb-16">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            
            {/* Left Content */}
            <div className="space-y-12 text-left">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="inline-flex items-center gap-2 px-3 py-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded-md shadow-sm mb-6"
              >
                <Building2 className="w-3.5 h-3.5 text-black" />
                <span className="text-[10px] font-black tracking-[0.2em] text-black uppercase">Enterprise Onboarding</span>
              </motion.div>
              
              <div className="space-y-6">
                <motion.h1 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                  className="text-[64px] lg:text-[84px] font-bold text-black tracking-tighter leading-[0.9] uppercase"
                >
                  Request <br /> A Demo.
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-2xl text-[#64748B] font-medium leading-relaxed max-w-xl"
                >
                  Join our technical architects for a deep-dive into the XeroxQ protocol and how it can optimize your physical document infrastructure.
                </motion.p>
              </div>

              <div className="space-y-6">
                 {benefits.map((benefit, i) => (
                   <motion.div 
                     key={benefit.title}
                     initial={{ opacity: 0, x: -20 }}
                     whileInView={{ opacity: 1, x: 0 }}
                     viewport={{ once: true }}
                     transition={{ delay: 0.3 + i * 0.1 }}
                     className="flex items-center gap-4 group"
                   >
                     <div className={`w-10 h-10 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <benefit.icon className={`w-5 h-5 ${benefit.color}`} />
                     </div>
                     <span className="text-sm font-black text-black tracking-tight uppercase leading-none">{benefit.title}</span>
                   </motion.div>
                 ))}
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="pt-12 border-t border-[#E2E8F0] flex items-center gap-8"
              >
                 <div className="flex flex-col">
                    <span className="text-3xl font-bold text-black tracking-tighter">500+</span>
                    <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest leading-none">Enterprise Clients</span>
                 </div>
                 <div className="w-[1px] h-10 bg-[#E2E8F0]" />
                 <p className="text-sm font-medium text-[#64748B] max-w-[180px] italic">Globally distributed print infrastructure for the privacy era.</p>
              </motion.div>
            </div>

            {/* Right Side - Form */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="bg-black p-10 lg:p-12 rounded-xl border border-white/10 relative overflow-hidden group shadow-2xl"
            >
               <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-[0.03] blur-[100px] rounded-full" />
               <div className="relative z-10 space-y-8">
                  <div className="space-y-2">
                     <h3 className="text-2xl font-bold text-white tracking-tight uppercase leading-none">Technical Inquiry</h3>
                     <p className="text-[#94A3B8] font-medium text-[11px] leading-relaxed italic max-w-xs opacity-70">
                        "High-density document physicalization infrastructure at global scale."
                     </p>
                  </div>

                  <form className="space-y-5">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2 text-left">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity</label>
                           <input type="text" placeholder="FULL NAME" className="w-full bg-white/5 border border-white/10 rounded-lg h-11 px-4 text-white font-black text-[10px] uppercase placeholder:text-slate-600 focus:bg-white/10 focus:border-white/20 transition-all outline-none" />
                        </div>
                        <div className="space-y-2 text-left">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Protocol / Email</label>
                           <input type="email" placeholder="OFFICE EMAIL" className="w-full bg-white/5 border border-white/10 rounded-lg h-11 px-4 text-white font-black text-[10px] uppercase placeholder:text-slate-600 focus:bg-white/10 focus:border-white/20 transition-all outline-none" />
                        </div>
                     </div>
                     <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Infrastructure Node / Company</label>
                        <input type="text" placeholder="ORGANIZATION NAME" className="w-full bg-white/5 border border-white/10 rounded-lg h-11 px-4 text-white font-black text-[10px] uppercase placeholder:text-slate-600 focus:bg-white/10 focus:border-white/20 transition-all outline-none" />
                     </div>
                     <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Requirements Payload</label>
                        <textarea rows={3} placeholder="DENSITY AND SECURITY SPECIFICATIONS" className="w-full bg-white/5 border border-white/10 rounded-lg p-4 text-white font-black text-[10px] uppercase placeholder:text-slate-600 focus:bg-white/10 focus:border-white/20 transition-all outline-none resize-none" />
                     </div>

                     <button className="w-full h-12 bg-white hover:bg-white/90 text-black font-black text-[10px] uppercase tracking-widest rounded-lg transition-all shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] group">
                        INITIATE ONBOARDING <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                     </button>
                  </form>

                  <div className="flex items-center gap-2 justify-center text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                     <CheckCircle2 className="w-3 h-3" /> SIGNAL VERIFIED / ENCRYPTED SUBMISSION
                  </div>
               </div>
            </motion.div>

          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
