"use client";

import { motion } from "framer-motion";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { 
  Building2, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Globe, 
  Cpu, 
  Database,
  Lock,
  BarChart3,
  Network,
  Server,
  CloudLightning,
  Workflow,
  Fingerprint,
  FileBadge
} from "lucide-react";

export default function Enterprise() {
  const features = [
    { title: "Mesh Protocol", desc: "Distributed document physicalization via sub-second cluster latency.", icon: Network, tag: "CORE" },
    { title: "Zero-Knowledge", desc: "Hardware-level root of trust with 7-pass military-grade erasure.", icon: ShieldCheck, tag: "SECURITY" },
    { title: "Autonomous Logic", desc: "Manage independent shop nodes with unified administrative authority.", icon: Cpu, tag: "OPS" },
    { title: "Hyper-Scale", desc: "Horizontal node expansion supporting 1M+ physicalizations/month.", icon: CloudLightning, tag: "SCALE" }
  ];

  const compliance = [
    { label: "ENCRYPTION", value: "AES-256-GCM / TLS 1.3", status: "VERIFIED" },
    { label: "DATA PERSISTENCE", value: "VOLATILE / 60s PURGE", status: "ENFORCED" },
    { label: "IP ADDRESSING", value: "FULLY MASKED / ONION", status: "ACTIVE" },
    { label: "AUDIT LOGS", value: "IMMUTABLE LEDGER", status: "PENDING" }
  ];

  return (
    <div className="min-h-screen bg-white selection:bg-black selection:text-white">
      <SiteHeader />
      
      <main className="pt-32 pb-16">
        {/* Enterprise Hero - ULTRA DENSITY */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative py-20 border-b border-[#E2E8F0]"
        >
          <div className="max-w-[1280px] mx-auto px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="space-y-3">
                 <motion.div 
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: 0.2 }}
                   className="inline-flex items-center gap-2 px-2.5 py-1 bg-black text-white rounded-md border border-black/10"
                 >
                    <Fingerprint className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black tracking-[0.25em] uppercase">Protocol v4.2.0</span>
                 </motion.div>
                 <motion.h1 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.3 }}
                   className="text-5xl lg:text-7xl font-bold text-black tracking-tighter leading-[0.95] uppercase"
                 >
                   Institutional <br /> Protocols.
                 </motion.h1>
                 <motion.p 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.4 }}
                   className="text-[11px] text-[#64748B] font-medium max-w-xs leading-relaxed italic"
                 >
                   "Decentralized hardware bridging with hardware-level data autonomy. Scale institutional nodes via the Mercury Mesh."
                 </motion.p>
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-3"
              >
                 <button className="h-11 px-8 bg-black text-white font-black text-[10px] uppercase tracking-widest rounded-lg transition-all active:scale-95 shadow-xl shadow-black/10">
                    INTEGRATE
                 </button>
                 <button className="h-11 px-6 border border-[#E2E8F0] hover:bg-[#F8FAFC] text-black font-black text-[10px] uppercase tracking-widest rounded-lg transition-all">
                    DOCS
                 </button>
              </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="lg:col-span-5"
            >
               <div className="p-6 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg shadow-2xl space-y-6">
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
                     <span className="text-[9px] font-black tracking-[0.3em] text-black uppercase">Internal Telemetry</span>
                     <div className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">LIVE</span>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     {[
                       { l: "LATENCY", v: "8.4MS" },
                       { l: "MESH NODES", v: "14,892" },
                       { l: "PURGE RATE", v: "100.0%" },
                       { l: "PROTOCOL", v: "ISO-Q" }
                     ].map((item, i) => (
                       <div key={i} className="space-y-0.5">
                          <div className="text-[8px] font-black text-[#94A3B8] uppercase tracking-widest">{item.l}</div>
                          <div className="text-lg font-black text-black tracking-tight uppercase">{item.v}</div>
                       </div>
                     ))}
                  </div>
                  <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
                     <span className="text-[9px] font-black text-[#64748B] uppercase tracking-widest">UPTIME: 99.9%</span>
                     <button className="text-[9px] font-black text-black uppercase tracking-widest border-b border-black/20 pb-0.5">Health Registry</button>
                  </div>
               </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Global Distribution Registry */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="py-16 bg-[#F8FAFC] border-b border-[#E2E8F0] lg:rounded-xl mx-0"
        >
           <div className="max-w-[1280px] mx-auto px-8">
              <div className="flex flex-col md:flex-row items-center justify-between mb-10 text-left gap-6">
                 <div className="space-y-1">
                    <span className="text-[10px] font-black text-black uppercase tracking-[0.3em]">Network Topology</span>
                    <h2 className="text-2xl font-bold text-black tracking-tight uppercase leading-none">Global Node Registry</h2>
                 </div>
                 <div className="hidden md:block h-[1px] flex-1 bg-[#E2E8F0] mx-10" />
                 <button className="flex items-center gap-2 text-[10px] font-black text-black uppercase tracking-widest border-b border-black/20 pb-1 flex-shrink-0">
                    Registry Logs <ArrowRight className="w-3 h-3" />
                 </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                 {[
                   { region: "NORTH AMERICA", nodes: "6,402", status: "OPTIMIZED", color: "bg-black" },
                   { region: "EUROPE / UK", nodes: "4,120", status: "STABLE", color: "bg-black" },
                   { region: "ASIA PACIFIC", nodes: "3,892", status: "EXPANDING", color: "bg-black" },
                   { region: "LATAM / AFRICA", nodes: "478", status: "GROWING", color: "bg-black" }
                 ].map((reg, i) => (
                   <motion.div 
                     key={reg.region} 
                     initial={{ opacity: 0, scale: 0.9 }}
                     whileInView={{ opacity: 1, scale: 1 }}
                     viewport={{ once: true }}
                     transition={{ delay: i * 0.1 }}
                     className="p-4 bg-white border border-[#E2E8F0] rounded-lg hover:shadow-xl transition-all space-y-4 text-left"
                   >
                      <div className="flex items-center gap-2">
                         <div className={`w-1 h-1 rounded-full ${reg.color}`} />
                         <span className="text-[9px] font-black text-black tracking-widest uppercase">{reg.region}</span>
                      </div>
                      <div className="space-y-0.5">
                         <div className="text-[8px] font-black text-[#94A3B8] uppercase tracking-widest px-0.5 opacity-60">ACTIVE NODES</div>
                         <div className="text-2xl font-black text-black tracking-tighter uppercase">{reg.nodes}</div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-[#F8FAFC]">
                         <span className="text-[8px] font-black text-[#94A3B8] tracking-[0.2em] uppercase">{reg.status}</span>
                         <Server className="w-3 h-3 text-[#94A3B8]" />
                      </div>
                   </motion.div>
                 ))}
              </div>
           </div>
        </motion.section>

        {/* Technical Features - High Density 4-col */}
        <section className="py-16">
           <div className="max-w-[1280px] mx-auto px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 {features.map((feature, i) => (
                   <motion.div 
                     key={i} 
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     viewport={{ once: true }}
                     transition={{ delay: i * 0.12 }}
                     className="group p-5 bg-white border border-[#E2E8F0] rounded-lg hover:bg-[#F8FAFC] transition-all text-left shadow-sm hover:shadow-xl"
                   >
                     <div className="space-y-4">
                        <div className="flex items-center justify-between">
                           <div className="w-9 h-9 rounded bg-black text-white flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
                              <feature.icon className="w-4.5 h-4.5" />
                           </div>
                           <span className="text-[8px] font-black tracking-[0.2em] text-[#94A3B8] uppercase">{feature.tag}</span>
                        </div>
                        <div className="space-y-1.5">
                           <h3 className="text-[14px] font-black text-black tracking-tight uppercase leading-none">{feature.title}</h3>
                           <p className="text-[11px] text-[#64748B] font-medium leading-relaxed italic opacity-80">"{feature.desc}"</p>
                        </div>
                     </div>
                   </motion.div>
                 ))}
              </div>
           </div>
        </section>

        {/* Workflow Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="py-20 bg-black border-y border-white/10 lg:rounded-xl mx-0"
        >
           <div className="max-w-[1280px] mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div className="space-y-10 text-left">
                 <div className="space-y-4">
                    <span className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.3em]">Operational Flow</span>
                    <h2 className="text-4xl font-bold text-white tracking-tight leading-[1.1] uppercase">Bridge the Digital <br /> Gap.</h2>
                 </div>
                 
                 <div className="space-y-8">
                    {[
                      { step: "01", title: "Handshake", desc: "Encryption bridge established between terminal and target printer." },
                      { step: "02", title: "Physicalization", desc: "High-fidelity document rendering on local mesh hardware." },
                      { step: "03", title: "Purge Phase", desc: "Automatic military-grade erasure of all transient data fragments." }
                    ].map((step, i) => (
                       <motion.div 
                         key={step.title} 
                         initial={{ opacity: 0, x: -20 }}
                         whileInView={{ opacity: 1, x: 0 }}
                         viewport={{ once: true }}
                         transition={{ delay: i * 0.15 }}
                         className="flex gap-6 items-start group"
                       >
                          <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] pt-1">{step.step}</span>
                          <div className="space-y-1">
                             <h4 className="text-lg font-bold text-white tracking-tight group-hover:text-white transition-colors uppercase leading-none">{step.title}</h4>
                             <p className="text-sm text-slate-400 font-medium leading-relaxed italic opacity-80">"{step.desc}"</p>
                          </div>
                       </motion.div>
                    ))}
                 </div>
              </div>

              <div className="relative group">
                 <div className="absolute inset-0 bg-white/5 blur-[120px] rounded-full" />
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }}
                   whileInView={{ opacity: 1, scale: 1 }}
                   viewport={{ once: true }}
                   className="p-10 bg-[#1A1D23] border border-white/10 rounded-lg relative z-10 space-y-8 text-center shadow-2xl"
                 >
                    <div className="w-14 h-14 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                       <Workflow className="w-7 h-7 text-white" />
                    </div>
                    <div className="space-y-4">
                       <h3 className="text-xl font-bold text-white tracking-tight uppercase">Protocol Bridge</h3>
                       <div className="flex flex-wrap items-center justify-center gap-1.5">
                          {["SSL", "TLS 1.3", "AES-256", "MESH", "P2P"].map(tag => (
                             <span key={tag} className="px-2 py-0.5 bg-white/5 border border-white/10 text-[8px] font-black text-white uppercase tracking-widest rounded">{tag}</span>
                          ))}
                       </div>
                    </div>
                    <button className="w-full h-10 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-white/90 transition-all">
                       DEPLOY API HOOKS
                    </button>
                 </motion.div>
              </div>
           </div>
        </motion.section>

        {/* Compliance Table-Grid */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="py-20 text-left"
        >
           <div className="max-w-[1280px] mx-auto px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
                 <div className="lg:col-span-4 space-y-6">
                    <div className="space-y-4">
                       <span className="text-[10px] font-bold text-black uppercase tracking-[0.3em]">Governance & Trust</span>
                       <h2 className="text-4xl font-bold text-black tracking-tight uppercase leading-none">Audit Ledger.</h2>
                       <p className="text-sm text-[#64748B] font-medium leading-relaxed">
                          Institutional-grade transparency with immutable protocol logs and hardware-level isolation.
                       </p>
                    </div>
                    <div className="p-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex items-center gap-5 group">
                       <div className="w-10 h-10 rounded bg-black text-white flex items-center justify-center flex-shrink-0 group-hover:rotate-12 transition-transform">
                          <FileBadge className="w-5 h-5" />
                       </div>
                       <div>
                          <div className="text-[10px] font-black text-black uppercase tracking-widest">ISO-27001 ALIGNED</div>
                          <div className="text-[9px] font-bold text-[#64748B] uppercase tracking-widest leading-none">PROTOCOL COMPLIANCE</div>
                       </div>
                    </div>
                 </div>

                 <div className="lg:col-span-8 flex flex-col gap-px bg-[#E2E8F0] border border-[#E2E8F0] rounded-lg overflow-hidden shadow-sm">
                    {compliance.map((c, i) => (
                       <motion.div 
                         key={i} 
                         initial={{ opacity: 0 }}
                         whileInView={{ opacity: 1 }}
                         viewport={{ once: true }}
                         transition={{ delay: i * 0.1 }}
                         className="grid grid-cols-3 bg-white p-5 items-center"
                       >
                          <span className="text-[9px] font-black text-[#94A3B8] uppercase tracking-[0.25em]">{c.label}</span>
                          <span className="text-sm font-bold text-black tracking-tight text-center">{c.value}</span>
                          <div className="flex justify-end">
                             <span className="px-2.5 py-0.5 bg-black text-white text-[8px] font-black uppercase tracking-widest rounded-md">{c.status}</span>
                          </div>
                       </motion.div>
                    ))}
                 </div>
              </div>
           </div>
        </motion.section>

        {/* Fast Action Footer Banner */}
        <motion.section 
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="py-12 px-8"
        >
           <div className="max-w-[1280px] mx-auto p-10 bg-black rounded-lg border border-white/10 flex flex-col md:flex-row items-center justify-between gap-8 group">
              <div className="text-left space-y-2">
                 <h2 className="text-xl font-bold text-white tracking-tight uppercase leading-none">Expand Coverage</h2>
                 <p className="text-sm text-slate-400 font-medium leading-relaxed italic opacity-80">"Join 500+ enterprises leveraging the institutional Mercury Protocol."</p>
              </div>
              <div className="flex items-center gap-3">
                 <button className="h-10 px-8 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-lg transition-all active:scale-95 shadow-xl shadow-black/10">
                    Integration Inquiry
                 </button>
                 <button className="h-10 px-6 border border-white/20 hover:bg-white/5 text-white font-black text-[10px] uppercase tracking-widest rounded-lg transition-all">
                    Global SLA
                 </button>
              </div>
           </div>
        </motion.section>
      </main>

      <SiteFooter />
    </div>
  );
}
