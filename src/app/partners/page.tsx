"use client";

import { motion } from "framer-motion";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { 
  Handshake, 
  ArrowRight, 
  Globe, 
  ShieldCheck, 
  Zap, 
  Cpu, 
  Printer, 
  Network,
  CheckCircle2,
  Building2
} from "lucide-react";

export default function Partners() {
  const tiers = [
    { 
      title: "Hardware OEM Partners", 
      desc: "Integrate the XeroxQ protocol directly into your print hardware. Deliver zero-knowledge physicalization as a native feature.", 
      icon: Printer, 
      color: "text-blue-500"
    },
    { 
      title: "Software Integrators", 
      desc: "Build secure bridges between your document workflow apps and our global decentralized mesh.", 
      icon: Cpu, 
      color: "text-[#FB432C]"
    },
    { 
      title: "Network Affiliates", 
      desc: "Scale the XeroxQ protocol in your region. Manage verified shop clusters and earn rewards for uptime.", 
      icon: Network, 
      color: "text-emerald-500"
    }
  ];

  return (
    <div className="min-h-screen bg-white selection:bg-black selection:text-white overflow-hidden">
      <SiteHeader />
      
      <main className="pt-32 pb-16">
        {/* Partners Hero */}
        <section className="relative pb-24 text-center">
          <div className="max-w-[1280px] mx-auto px-6 space-y-12 relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="inline-flex items-center gap-2 px-3 py-1 bg-black rounded-md shadow-xl shadow-black/10 mb-6"
            >
              <Handshake className="w-3.5 h-3.5 text-white" />
              <span className="text-[10px] font-black tracking-[0.2em] text-white uppercase">The XeroxQ Ecosystem</span>
            </motion.div>
            
            <div className="space-y-6 max-w-4xl mx-auto">
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-[64px] lg:text-[100px] font-bold text-black tracking-tighter leading-[0.85] uppercase"
              >
                Engineer A More <br /> Secure World.
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-2xl text-[#64748B] font-medium max-w-2xl mx-auto leading-relaxed"
              >
                Join our global network of hardware manufacturers, software developers, and regional affiliates to scale the decentralized print mesh.
              </motion.p>
            </div>
          </div>
        </section>

        {/* Partnership Tiers */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="py-16 border-y border-[#E2E8F0] bg-[#F8FAFC]"
        >
           <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              {tiers.map((tier, i) => (
                <motion.div 
                  key={tier.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="p-8 bg-white rounded-xl border border-[#E2E8F0] group space-y-6 hover:shadow-xl transition-all"
                >
                   <div className="w-12 h-12 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <tier.icon className={`w-6 h-6 ${tier.color}`} />
                   </div>
                   <div className="space-y-3">
                      <h3 className="text-xl font-bold text-black tracking-tight uppercase leading-none">{tier.title}</h3>
                      <p className="text-sm text-[#64748B] font-medium leading-relaxed italic">"{tier.desc}"</p>
                   </div>
                   <button className="h-10 px-6 bg-black text-white rounded-md font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-black/10">
                      CATEGORY APPLICATION
                   </button>
                </motion.div>
              ))}
           </div>
        </motion.section>

        {/* Verification Architecture */}
        <section className="py-24 text-left">
           <div className="max-w-[1280px] mx-auto px-6 flex flex-col lg:flex-row items-center gap-16">
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="flex-1 space-y-10"
              >
                 <div className="space-y-4">
                    <span className="text-[10px] font-black text-black uppercase tracking-[0.3em]">Network Integrity</span>
                    <h2 className="text-4xl lg:text-6xl font-bold text-black tracking-tight leading-[0.95] uppercase">Root-Level Auditing.</h2>
                    <p className="text-sm text-[#64748B] font-medium leading-relaxed max-w-xl italic opacity-80">
                       "Strategic partners undergo multi-stage signal and hardware verification to ensure absolute protocol compliance across the mesh."
                    </p>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12">
                    {[
                      "Hardware Root-of-Trust",
                      "E2E Signal Verification",
                      "Compliance Auditing",
                      "7-Pass Data Purging"
                    ].map((step, i) => (
                       <motion.div 
                        key={step} 
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 + i * 0.1 }}
                        className="flex items-center gap-2.5"
                       >
                          <CheckCircle2 className="w-4 h-4 text-black" />
                          <span className="font-black text-black tracking-tight text-[10px] uppercase">{step}</span>
                       </motion.div>
                    ))}
                 </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="flex-1 w-full"
              >
                 <div className="aspect-[4/3] bg-black rounded-xl p-12 relative overflow-hidden group shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-[0.03] blur-[100px] rounded-full" />
                    <div className="relative z-10 space-y-10">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/20 flex items-center justify-center">
                             <ShieldCheck className="w-5 h-5 text-white" />
                          </div>
                          <h4 className="text-xl font-bold text-white tracking-tight leading-none uppercase">Trust Cert</h4>
                       </div>
                       <p className="text-[#94A3B8] font-medium text-sm leading-relaxed max-w-xs italic opacity-80">
                          "Partners receive a digital 'Trust Beacon' signaling verified E2E protocol compliance to the global network."
                       </p>
                       <div className="py-12 border border-white/5 rounded-xl flex items-center justify-center relative overflow-hidden group-hover:border-white/10 transition-all">
                          <Globe className="w-16 h-16 text-white opacity-10 group-hover:scale-110 transition-transform duration-[2s]" />
                       </div>
                    </div>
                 </div>
              </motion.div>
           </div>
        </section>

        {/* Global Partnership CTA */}
        <motion.section 
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="py-20 px-6"
        >
           <div className="max-w-[1280px] mx-auto p-12 bg-[#F8FAFC] rounded-xl relative overflow-hidden text-center group border border-[#E2E8F0] shadow-xl">
              <div className="relative z-10 space-y-8">
                 <h2 className="text-4xl lg:text-6xl font-bold text-black tracking-tighter leading-none uppercase">Join the Mesh.</h2>
                 <p className="text-sm text-[#64748B] font-medium max-w-lg mx-auto leading-relaxed italic opacity-80">"Scale the secure physicalization protocol globally as a verified partner."</p>
                 <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button className="h-11 px-8 bg-black text-white hover:bg-black/90 font-black text-[10px] uppercase tracking-widest rounded-lg transition-all shadow-xl active:scale-95">
                       PARTNER ONBOARDING
                    </button>
                    <button className="h-11 px-8 border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-black font-black text-[10px] uppercase tracking-widest rounded-lg transition-all">
                       PARTNER GUIDE
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
