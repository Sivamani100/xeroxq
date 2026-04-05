"use client";

import { motion } from "framer-motion";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { 
  Building2, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Cpu, 
  Lock,
  Network,
  Server,
  Fingerprint,
  CheckCircle2,
  Printer,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function EnterprisePage() {
  const features = [
    { title: "Mesh Protocol", desc: "Distributed document physicalization via sub-second cluster latency across all 26 AP districts.", icon: Network, tag: "CORE" },
    { title: "Zero-Knowledge", desc: "Hardware-level root of trust with 7-pass military-grade erasure. No file ever touches persistent storage.", icon: ShieldCheck, tag: "SECURITY" },
    { title: "Fleet Management", desc: "Manage 500+ independent shop nodes with unified administrative authority from a single dashboard.", icon: Cpu, tag: "OPS" },
    { title: "Bulk Routing", desc: "Push thousands of print jobs simultaneously across your approved shop fleet with guaranteed delivery.", icon: Zap, tag: "SCALE" }
  ];

  const useCases = [
    {
      title: "Hospital & Clinic Networks",
      desc: "Route sensitive patient reports, prescriptions, and discharge summaries to verified print nodes near patients. Zero-retention ensures HIPAA-grade compliance.",
      icon: FileText,
      stat: "100% file volatility"
    },
    {
      title: "Government Document Offices",
      desc: "Enable citizens to print Aadhaar, PAN, and land records at verified XeroxQ shops without exposing their identity documents digitally.",
      icon: Building2,
      stat: "26 districts covered"
    },
    {
      title: "Educational Institutions",
      desc: "Allow students and faculty to securely print examination papers, assignments, and research to campus-adjacent shops on the mesh.",
      icon: Printer,
      stat: "Sub-second routing"
    }
  ];

  const compliance = [
    { label: "ENCRYPTION", value: "AES-256-GCM / TLS 1.3", status: "VERIFIED" },
    { label: "DATA PERSISTENCE", value: "VOLATILE / 30s PURGE", status: "ENFORCED" },
    { label: "SENDER IDENTITY", value: "FULLY ANONYMIZED", status: "ACTIVE" },
    { label: "AUDIT LOGS", value: "IMMUTABLE LEDGER", status: "LIVE" }
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-sans selection:bg-[#FB432C] selection:text-white overflow-x-hidden">
      <SiteHeader />
      
      <main className="flex-1 pt-32 pb-0">
        
        {/* Enterprise Hero */}
        <section className="relative pt-12 pb-16 overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
               
          <div className="max-w-[1280px] mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
             <motion.div 
               variants={{
                 hidden: { opacity: 0, x: -20 },
                 visible: { opacity: 1, x: 0, transition: { duration: 0.6 } }
               }}
               initial="hidden"
               animate="visible"
               className="space-y-8"
             >
               <div className="inline-flex items-center gap-2.5 px-4 h-8 rounded-full bg-black/5 border border-black/5">
                 <Fingerprint className="w-3.5 h-3.5 text-black" />
                 <span className="text-[10px] font-bold text-black uppercase tracking-[0.2em] leading-none">Enterprise Protocol v4.2</span>
               </div>
               
               <h1 className="text-[40px] md:text-[64px] font-extrabold tracking-tighter text-black leading-[0.95] uppercase">
                 Institutional <br /> Grade Printing.
               </h1>
               <p className="text-lg font-medium text-gray-500 leading-relaxed italic max-w-lg">
                 "Integrate XeroxQ's zero-knowledge routing directly into your hospital EHR, government portal, or campus intranet. Deploy secure physicalization at scale."
               </p>
               
               <div className="flex flex-wrap items-center gap-4 pt-4">
                  <button className="h-14 px-8 bg-black text-white hover:bg-[#FB432C] font-bold text-[12px] uppercase tracking-widest rounded-xl transition-all duration-300 shadow-xl shadow-black/10">
                     Request Demo
                  </button>
                  <button className="h-14 px-8 border border-gray-200 hover:border-black text-black font-bold text-[12px] uppercase tracking-widest rounded-xl transition-all">
                     View API Docs
                  </button>
               </div>
             </motion.div>

             {/* Live Telemetry Card */}
             <motion.div 
               variants={{
                 hidden: { opacity: 0, x: 20 },
                 visible: { opacity: 1, x: 0, transition: { duration: 0.6, delay: 0.2 } }
               }}
               initial="hidden"
               animate="visible"
             >
                <div className="p-8 md:p-10 bg-black rounded-[32px] border border-black/20 shadow-2xl space-y-8 text-white">
                   <div className="flex items-center justify-between border-b border-white/10 pb-6">
                      <span className="text-[10px] font-black tracking-widest text-white/60 uppercase">Internal Telemetry</span>
                      <div className="flex items-center gap-2">
                         <div className="relative flex h-6 w-6 items-center justify-center">
                           <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                           <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                         </div>
                         <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Live</span>
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                      {[
                        { l: "Routing Latency", v: "42ms" },
                        { l: "Active Nodes", v: "542" },
                        { l: "Purge Rate", v: "100%" },
                        { l: "Protocol", v: "v4.2" }
                      ].map((item, i) => (
                        <div key={i} className="space-y-1">
                           <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{item.l}</div>
                           <div className="text-3xl font-black text-white tracking-tighter">{item.v}</div>
                        </div>
                      ))}
                   </div>
                   <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">90-Day Uptime: 99.99%</span>
                      <span className="text-[10px] font-bold text-[#FB432C] uppercase tracking-widest cursor-pointer hover:underline">Health Registry →</span>
                   </div>
                </div>
             </motion.div>
          </div>
        </section>

        {/* 4 Feature Cards */}
        <section className="py-24 bg-white border-y border-gray-100 relative z-20">
           <div className="max-w-[1280px] mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {features.map((feature, i) => (
                    <motion.div 
                       key={feature.title}
                       initial={{ opacity: 0, y: 30 }}
                       whileInView={{ opacity: 1, y: 0 }}
                       viewport={{ once: true }}
                       transition={{ delay: i * 0.1, duration: 0.6 }}
                       className="group p-8 bg-[#F8FAFC] rounded-[28px] border border-gray-200 hover:bg-black hover:border-black hover:shadow-2xl hover:shadow-black/20 hover:-translate-y-2 transition-all duration-500"
                    >
                       <div className="flex items-center justify-between mb-6">
                          <div className="w-12 h-12 rounded-[14px] bg-white group-hover:bg-white/10 border border-gray-100 group-hover:border-white/10 flex items-center justify-center shadow-sm transition-all duration-500">
                             <feature.icon className="w-5 h-5 text-black group-hover:text-white transition-colors duration-500" />
                          </div>
                          <span className="px-2.5 py-1 bg-white group-hover:bg-white/10 border border-gray-100 group-hover:border-white/10 rounded-full text-[9px] font-black text-gray-400 group-hover:text-white/50 uppercase tracking-widest transition-all duration-500">
                             {feature.tag}
                          </span>
                       </div>
                       <h3 className="text-xl font-black text-black group-hover:text-white tracking-tighter uppercase leading-none mb-3 transition-colors duration-500">{feature.title}</h3>
                       <p className="text-[13px] font-medium text-gray-500 group-hover:text-gray-400 leading-relaxed transition-colors duration-500">
                          {feature.desc}
                       </p>
                    </motion.div>
                 ))}
              </div>
           </div>
        </section>

        {/* Use Cases */}
        <section className="py-32 bg-[#F8FAFC]">
           <div className="max-w-[1280px] mx-auto px-6">
              <div className="text-center mb-20">
                 <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-black mb-4">Built For Institutions</h2>
                 <p className="text-gray-500 font-medium max-w-lg mx-auto">From hospitals to government offices, XeroxQ's enterprise API enables secure document physicalization at any scale.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {useCases.map((uc, i) => (
                    <motion.div
                       key={uc.title}
                       initial={{ opacity: 0, y: 30 }}
                       whileInView={{ opacity: 1, y: 0 }}
                       viewport={{ once: true }}
                       transition={{ delay: i * 0.15, duration: 0.6 }}
                       className="group bg-white p-10 rounded-[32px] border border-gray-200 hover:border-black/10 hover:shadow-2xl hover:shadow-black/5 hover:-translate-y-2 transition-all duration-500"
                    >
                       <div className="w-16 h-16 rounded-[20px] bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:bg-black group-hover:text-white group-hover:scale-110 transition-all duration-500 shadow-sm text-black mb-8">
                          <uc.icon className="w-7 h-7" />
                       </div>
                       <h3 className="text-2xl font-black text-black tracking-tighter uppercase leading-none mb-4 group-hover:text-[#FB432C] transition-colors">{uc.title}</h3>
                       <p className="text-[14px] font-medium text-gray-500 leading-relaxed mb-6">
                          {uc.desc}
                       </p>
                       <div className="pt-6 border-t border-gray-100">
                          <span className="text-[10px] font-black text-[#FB432C] uppercase tracking-widest">{uc.stat}</span>
                       </div>
                    </motion.div>
                 ))}
              </div>
           </div>
        </section>

        {/* Compliance Audit Section */}
        <section className="py-32 bg-white border-y border-gray-100">
           <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
              <div className="lg:col-span-4 space-y-8">
                 <div>
                    <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-black mb-4">Audit Ledger</h2>
                    <p className="text-gray-500 font-medium leading-relaxed">
                       Institutional-grade transparency with immutable protocol logs and hardware-level isolation verified continuously.
                    </p>
                 </div>
                 <div className="p-8 bg-[#F8FAFC] rounded-[32px] border border-gray-200">
                    <div className="w-12 h-12 rounded-[16px] bg-white border border-gray-100 flex items-center justify-center shadow-sm mb-6">
                       <ShieldCheck className="w-5 h-5 text-black" />
                    </div>
                    <h4 className="text-sm font-black text-black tracking-tight uppercase mb-2">ISO-27001 Aligned</h4>
                    <p className="text-[13px] text-gray-500 font-medium leading-relaxed italic">
                       "Protocol compliance audited quarterly by independent third-party penetration testing firms."
                    </p>
                 </div>
              </div>

              <div className="lg:col-span-8 space-y-4">
                 {compliance.map((c, i) => (
                    <motion.div 
                       key={i}
                       initial={{ opacity: 0, x: 20 }}
                       whileInView={{ opacity: 1, x: 0 }}
                       viewport={{ once: true }}
                       transition={{ delay: i * 0.1 }}
                       className="p-6 bg-white border border-gray-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:shadow-md transition-shadow"
                    >
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest w-40">{c.label}</span>
                       <span className="text-sm font-bold text-black tracking-tight flex-1">{c.value}</span>
                       <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">{c.status}</span>
                       </div>
                    </motion.div>
                 ))}
              </div>
           </div>
        </section>

        {/* CTA Banner */}
        <section className="py-24 px-6 bg-[#F8FAFC] border-t border-gray-100">
           <div className="max-w-[1280px] mx-auto p-12 md:p-20 bg-black rounded-[40px] relative overflow-hidden group shadow-2xl text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white opacity-[0.03] blur-[100px] rounded-full mix-blend-overlay pointer-events-none" />
              
              <div className="relative z-10 max-w-2xl">
                 <div className="flex items-center gap-3 mb-6 justify-center md:justify-start">
                    <Lock className="w-6 h-6 text-white/50" />
                    <span className="text-[12px] font-black uppercase tracking-widest text-[#FB432C]">Enterprise Inquiry</span>
                 </div>
                 <h2 className="text-4xl lg:text-6xl font-extrabold text-white tracking-tighter leading-none uppercase mb-6">
                    Scale Your Fleet.
                 </h2>
                 <p className="text-lg text-gray-400 font-medium leading-relaxed italic opacity-80">
                    Whether you're a hospital network, a university, or a government body—XeroxQ's enterprise API is designed for your compliance requirements.
                 </p>
              </div>

              <div className="relative z-10 shrink-0 flex flex-col gap-4">
                 <button className="h-16 px-10 bg-white text-black hover:bg-[#FB432C] hover:text-white font-black text-[14px] uppercase tracking-widest rounded-[16px] transition-all duration-300 shadow-xl hover:-translate-y-1">
                    Request Integration
                 </button>
                 <button className="h-14 px-10 bg-white/10 border border-white/20 text-white hover:bg-white/20 font-bold text-[12px] uppercase tracking-widest rounded-[16px] transition-all backdrop-blur-sm">
                    Download SLA
                 </button>
              </div>
           </div>
        </section>

      </main>

      <SiteFooter />
    </div>
  );
}
