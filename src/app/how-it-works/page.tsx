"use client";

import { motion } from "framer-motion";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { 
  ShieldCheck, 
  Zap, 
  Network, 
  Printer, 
  ArrowRight, 
  Lock,
  Search,
  Globe,
  Cpu,
  RefreshCw
} from "lucide-react";

export default function HowItWorks() {
  const steps = [
    { 
      title: "Local Signal Generation", 
      desc: "Your document is encrypted using high-grade AES-256 directly on your device. The 'Signal' is born private.", 
      icon: Zap,
      color: "text-amber-500"
    },
    { 
      title: "Decentralized Routing", 
      desc: "The XeroxQ mesh routes your signal to the most optimal verified shop node based on proximity and load.", 
      icon: Network,
      color: "text-blue-500"
    },
    { 
      title: "Encrypted Handshake", 
      desc: "The Shop Node receives the signal but cannot decrypt it without the one-time ephemeral key shared during arrival.", 
      icon: Lock,
      color: "text-purple-500"
    },
    { 
      title: "Autonomous Physicalization", 
      desc: "The hardware processes your document. Once printed, the transient fragment is purged with a 7-pass military-grade erasure.", 
      icon: Printer,
      color: "text-[#FB432C]"
    }
  ];

  return (
    <div className="min-h-screen bg-white selection:bg-brand-primary selection:text-white overflow-hidden">
      <SiteHeader />
      
      <main className="pt-32 pb-16">
        {/* How It Works Hero */}
        <section className="relative pb-24 text-center">
          <div className="max-w-[1280px] mx-auto px-6 space-y-12 relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="inline-flex items-center gap-2 px-3 py-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded-md shadow-sm mb-6"
            >
              <Cpu className="w-3.5 h-3.5 text-black" />
              <span className="text-[10px] font-black tracking-[0.2em] text-black uppercase">The XeroxQ Architecture</span>
            </motion.div>
            
            <div className="space-y-6 max-w-4xl mx-auto">
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-[64px] lg:text-[100px] font-bold text-black tracking-tighter leading-[0.85] uppercase"
              >
                The Science Of <br /> Secure Output.
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-2xl text-[#64748B] font-medium max-w-3xl mx-auto leading-relaxed"
              >
                A decentralized document physicalization protocol designed for the post-privacy era. Engineering the bridge between the digital and physical.
              </motion.p>
            </div>
          </div>
        </section>

        {/* The 4-Step Process Flow */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="py-16 border-y border-[#E2E8F0] bg-[#F8FAFC]"
        >
           <div className="max-w-[1280px] mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-left relative">
                 {/* Decorative connecting line */}
                 <div className="hidden lg:block absolute top-[80px] left-[100px] right-[100px] h-[1px] bg-black/5 z-0" />
                 
                 {steps.map((step, i) => (
                    <motion.div 
                      key={step.title}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.15 }}
                      className="group relative z-10"
                    >
                       <div className="w-12 h-12 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm group-hover:border-black">
                          <step.icon className={`w-6 h-6 ${step.color}`} />
                       </div>
                       <div className="space-y-3">
                          <div className="text-[9px] font-black text-black uppercase tracking-[0.3em]">Module 0{i+1}</div>
                          <h3 className="text-lg font-bold text-black tracking-tight leading-none group-hover:text-black transition-colors uppercase">{step.title}</h3>
                          <p className="text-[13px] text-[#64748B] font-medium leading-relaxed">{step.desc}</p>
                       </div>
                    </motion.div>
                 ))}
              </div>
           </div>
        </motion.section>

        {/* Technical Deep Dive */}
        <section className="py-20 bg-white overflow-hidden">
           <div className="max-w-[1280px] mx-auto px-6 flex flex-col lg:flex-row items-center gap-16">
              <motion.div 
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="flex-1 space-y-10 text-left"
              >
                 <div className="space-y-4">
                    <span className="text-[10px] font-black text-black uppercase tracking-[0.3em]">Technical Authority</span>
                    <h2 className="text-4xl lg:text-5xl font-bold text-black tracking-tight leading-[0.95] uppercase">Root Volatility.</h2>
                    <p className="text-sm text-[#64748B] font-medium leading-relaxed max-w-lg italic">
                       "Infrastructure designed for zero persistence. Transient data physicalization across the mesh."
                    </p>
                 </div>
                 
                 <div className="space-y-0 border border-[#E2E8F0] rounded-lg overflow-hidden bg-[#F8FAFC]">
                    {[
                      { l: "End-to-End Handshake", r: "Verified" },
                      { l: "Payload Volatility", r: "100%" },
                      { l: "Network Latency", r: "< 400ms" },
                      { l: "Encryption Standard", r: "AES-256" }
                    ].map((row, i) => (
                       <motion.div 
                         key={row.l} 
                         initial={{ opacity: 0 }}
                         whileInView={{ opacity: 1 }}
                         viewport={{ once: true }}
                         transition={{ delay: i * 0.1 }}
                         className="flex items-center justify-between px-5 py-3 border-b border-[#E2E8F0] last:border-0 hover:bg-white transition-colors"
                       >
                          <span className="text-[10px] font-bold text-black uppercase tracking-[0.2em] leading-none">{row.l}</span>
                          <span className="text-[10px] font-black text-black tracking-widest uppercase leading-none">{row.r}</span>
                       </motion.div>
                    ))}
                 </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="flex-1 w-full relative"
              >
                 <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl relative group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/90 to-transparent z-10" />
                    <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
                         style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                       <div className="w-[85%] h-[85%] border border-white/10 rounded-lg flex flex-col items-center justify-center p-6 text-center group-hover:scale-105 transition-transform duration-700">
                          <RefreshCw className="w-12 h-12 text-white opacity-20 mb-6 animate-spin-slow" />
                          <h4 className="text-lg font-bold text-white tracking-tight leading-none mb-3 uppercase">Sync Logic</h4>
                          <p className="text-[#94A3B8] font-medium text-[11px] leading-relaxed italic max-w-[240px]">Real-time node health monitoring across the global mesh infrastructure.</p>
                       </div>
                    </div>
                 </div>
              </motion.div>
           </div>
        </section>

        {/* Try the protocol CTA */}
        <motion.section 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="py-20 px-6"
        >
           <div className="max-w-[1280px] mx-auto p-12 bg-[#F8FAFC] rounded-xl relative overflow-hidden text-center group border border-[#E2E8F0]">
              <div className="absolute top-0 right-0 w-96 h-96 bg-black opacity-[0.02] blur-[120px] rounded-full" />
              <div className="relative z-10 space-y-8">
                 <h2 className="text-4xl lg:text-6xl font-bold text-black tracking-tighter leading-none uppercase">Initiate Physicalization.</h2>
                 <p className="text-sm text-[#64748B] font-medium max-w-lg mx-auto leading-relaxed">Ready to send your first transient signal through the global physicalization mesh?</p>
                 <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button className="h-11 px-8 bg-black text-white hover:bg-black/90 font-black text-[10px] uppercase tracking-widest rounded-lg transition-all shadow-xl shadow-black/10">
                       LAUNCH PROTOCOL
                    </button>
                    <button className="h-11 px-8 border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-black font-black text-[10px] uppercase tracking-widest rounded-lg transition-all">
                       CORE ARCHITECTURE
                    </button>
                 </div>
              </div>
           </div>
        </motion.section>
      </main>

      <SiteFooter />
    </div>
  );
}
