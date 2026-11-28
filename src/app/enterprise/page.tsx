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
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#111113] text-[#171717] dark:text-[#EDEDED] flex flex-col font-sans selection:bg-[#FB432C] selection:text-white overflow-x-hidden">
      <SiteHeader />
      
      <main className="flex-1 pt-32 pb-0">
        
        {/* Enterprise Hero */}
        <section className="relative pt-12 pb-16 overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-[0.04] dark:opacity-[0.06] text-[#171717] dark:text-white pointer-events-none" 
               style={{ backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
               
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
               <div className="inline-flex items-center gap-2.5 px-4 h-8 rounded-full bg-[#F4F4F5] dark:bg-[#232325] border border-[#171717]/[0.10] dark:border-white/[0.10]">
                 <Fingerprint className="w-3.5 h-3.5 text-[#171717] dark:text-[#EDEDED]" />
                 <span className="text-[10px] font-bold text-[#171717] dark:text-[#EDEDED] uppercase tracking-[0.2em] leading-none">Enterprise Protocol v4.2</span>
               </div>
               
               <h1 className="text-[40px] md:text-[64px] font-extrabold tracking-tighter text-[#171717] dark:text-[#EDEDED] leading-[0.95] uppercase">
                 Institutional <br /> Grade Printing.
               </h1>
               <p className="text-lg font-medium text-[#525252] dark:text-[#A1A1A6] leading-relaxed italic max-w-lg">
                 "Integrate XeroxQ's zero-knowledge routing directly into your hospital EHR, government portal, or campus intranet. Deploy secure physicalization at scale."
               </p>
               
               <div className="flex flex-wrap items-center gap-4 pt-4">
                  <button className="h-14 px-8 bg-[#171717] dark:bg-[#FB432C] text-white hover:bg-[#FB432C] dark:hover:bg-[#E03923] font-bold text-[12px] uppercase tracking-widest rounded-xl transition-all duration-300 shadow-xl shadow-black/10">
                     Request Demo
                  </button>
                  <button className="h-14 px-8 bg-white dark:bg-[#232325] border border-[#171717]/[0.12] dark:border-white/[0.12] hover:border-[#171717] dark:hover:border-white/30 text-[#171717] dark:text-[#EDEDED] font-bold text-[12px] uppercase tracking-widest rounded-xl transition-all">
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
                <div className="p-8 md:p-10 bg-[#171717] dark:bg-[#19191B] rounded-[32px] border border-white/[0.08] shadow-2xl space-y-8 text-white">
                   <div className="flex items-center justify-between border-b border-white/10 pb-6">
                      <span className="text-[10px] font-black tracking-widest text-white/60 uppercase">Internal Telemetry</span>
                      <div className="flex items-center gap-2">
                         <div className="relative flex h-6 w-6 items-center justify-center">
                           <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20"></span>
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
        <section className="py-24 bg-white dark:bg-[#19191B] border-y border-[#171717]/[0.08] dark:border-white/[0.08] relative z-20">
           <div className="max-w-[1280px] mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {features.map((feature, i) => (
                    <motion.div 
                       key={feature.title}
                       initial={{ opacity: 0, y: 30 }}
                       whileInView={{ opacity: 1, y: 0 }}
                       viewport={{ once: true }}
                       transition={{ delay: i * 0.1, duration: 0.6 }}
                       className="group p-8 bg-[#F4F4F5] dark:bg-[#232325] rounded-[28px] border border-[#171717]/[0.10] dark:border-white/[0.10] hover:bg-[#171717] dark:hover:bg-[#111113] hover:border-[#171717] dark:hover:border-white/20 hover:shadow-2xl hover:shadow-black/20 hover:-translate-y-2 transition-all duration-500"
                    >
                       <div className="flex items-center justify-between mb-6">
                          <div className="w-12 h-12 rounded-[14px] bg-white dark:bg-[#19191B] group-hover:bg-white/10 border border-[#171717]/[0.08] dark:border-white/[0.08] group-hover:border-white/10 flex items-center justify-center shadow-sm transition-all duration-500">
                             <feature.icon className="w-5 h-5 text-[#171717] dark:text-[#EDEDED] group-hover:text-white transition-colors duration-500" />
                          </div>
                          <span className="px-2.5 py-1 bg-white dark:bg-[#19191B] group-hover:bg-white/10 border border-[#171717]/[0.08] dark:border-white/[0.08] group-hover:border-white/10 rounded-full text-[9px] font-black text-[#737373] dark:text-[#85858B] group-hover:text-white/70 uppercase tracking-widest transition-all duration-500">
                             {feature.tag}
                          </span>
                       </div>
                       <h3 className="text-xl font-black text-[#171717] dark:text-[#EDEDED] group-hover:text-white tracking-tighter uppercase leading-none mb-3 transition-colors duration-500">{feature.title}</h3>
                       <p className="text-[13px] font-medium text-[#525252] dark:text-[#A1A1A6] group-hover:text-[#A1A1A6] leading-relaxed transition-colors duration-500">
                          {feature.desc}
                       </p>
                    </motion.div>
                 ))}
              </div>
           </div>
        </section>

        {/* Use Cases */}
        <section className="py-32 bg-[#FAFAFA] dark:bg-[#111113]">
           <div className="max-w-[1280px] mx-auto px-6">
              <div className="text-center mb-20">
                 <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-[#171717] dark:text-[#EDEDED] mb-4">Built For Institutions</h2>
                 <p className="text-[#525252] dark:text-[#A1A1A6] font-medium max-w-lg mx-auto">From hospitals to government offices, XeroxQ's enterprise API enables secure document physicalization at any scale.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {useCases.map((uc, i) => (
                    <motion.div
                       key={uc.title}
                       initial={{ opacity: 0, y: 30 }}
                       whileInView={{ opacity: 1, y: 0 }}
                       viewport={{ once: true }}
                       transition={{ delay: i * 0.15, duration: 0.6 }}
                       className="group bg-white dark:bg-[#19191B] p-10 rounded-[32px] border border-[#171717]/[0.08] dark:border-white/[0.08] hover:border-[#171717]/20 dark:hover:border-white/20 hover:shadow-2xl hover:shadow-black/5 hover:-translate-y-2 transition-all duration-500"
                    >
                       <div className="w-16 h-16 rounded-[20px] bg-[#F4F4F5] dark:bg-[#232325] border border-[#171717]/[0.10] dark:border-white/[0.10] flex items-center justify-center group-hover:bg-[#171717] dark:group-hover:bg-[#FB432C] group-hover:text-white group-hover:border-transparent group-hover:scale-110 transition-all duration-500 shadow-sm text-[#171717] dark:text-[#EDEDED] mb-8">
                          <uc.icon className="w-7 h-7" />
                       </div>
                       <h3 className="text-2xl font-black text-[#171717] dark:text-[#EDEDED] tracking-tighter uppercase leading-none mb-4 group-hover:text-[#FB432C] transition-colors">{uc.title}</h3>
                       <p className="text-[14px] font-medium text-[#525252] dark:text-[#A1A1A6] leading-relaxed mb-6">
                          {uc.desc}
                       </p>
                       <div className="pt-6 border-t border-[#171717]/[0.08] dark:border-white/[0.08]">
                          <span className="text-[10px] font-black text-[#FB432C] uppercase tracking-widest">{uc.stat}</span>
                       </div>
                    </motion.div>
                 ))}
              </div>
           </div>
        </section>

        {/* Compliance Audit Section */}
        <section className="py-32 bg-white dark:bg-[#19191B] border-y border-[#171717]/[0.08] dark:border-white/[0.08]">
           <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
              <div className="lg:col-span-4 space-y-8">
                 <div>
                    <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-[#171717] dark:text-[#EDEDED] mb-4">Audit Ledger</h2>
                    <p className="text-[#525252] dark:text-[#A1A1A6] font-medium leading-relaxed">
                       Institutional-grade transparency with immutable protocol logs and hardware-level isolation verified continuously.
                    </p>
                 </div>
                 <div className="p-8 bg-[#F4F4F5] dark:bg-[#232325] rounded-[32px] border border-[#171717]/[0.10] dark:border-white/[0.10]">
                    <div className="w-12 h-12 rounded-[16px] bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] flex items-center justify-center shadow-sm mb-6">
                       <ShieldCheck className="w-5 h-5 text-[#171717] dark:text-[#EDEDED]" />
                    </div>
                    <h4 className="text-sm font-black text-[#171717] dark:text-[#EDEDED] tracking-tight uppercase mb-2">ISO-27001 Aligned</h4>
                    <p className="text-[13px] text-[#525252] dark:text-[#A1A1A6] font-medium leading-relaxed italic">
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
                       className="p-6 bg-white dark:bg-[#232325] border border-[#171717]/[0.08] dark:border-white/[0.10] rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:shadow-md transition-shadow"
                    >
                       <span className="text-[10px] font-black text-[#737373] dark:text-[#85858B] uppercase tracking-widest w-40">{c.label}</span>
                       <span className="text-sm font-bold text-[#171717] dark:text-[#EDEDED] tracking-tight flex-1">{c.value}</span>
                       <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">{c.status}</span>
                       </div>
                    </motion.div>
                 ))}
              </div>
           </div>
        </section>

        {/* CTA Banner */}
        <section className="py-24 px-6 bg-[#FAFAFA] dark:bg-[#111113]">
           <div className="max-w-[1280px] mx-auto p-12 md:p-20 bg-[#171717] dark:bg-[#19191B] border border-white/[0.08] text-white rounded-[40px] relative overflow-hidden group shadow-2xl text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white opacity-[0.03] blur-[100px] rounded-full mix-blend-overlay pointer-events-none" />
              
              <div className="relative z-10 max-w-2xl">
                 <div className="flex items-center gap-3 mb-6 justify-center md:justify-start">
                    <Lock className="w-6 h-6 text-white/50" />
                    <span className="text-[12px] font-black uppercase tracking-widest text-[#FB432C]">Enterprise Inquiry</span>
                 </div>
                 <h2 className="text-4xl lg:text-6xl font-extrabold text-white tracking-tighter leading-none uppercase mb-6">
                    Scale Your Fleet.
                 </h2>
                 <p className="text-lg text-[#A1A1A6] font-medium leading-relaxed italic opacity-90">
                    Whether you're a hospital network, a university, or a government body—XeroxQ's enterprise API is designed for your compliance requirements.
                 </p>
              </div>

              <div className="relative z-10 shrink-0 flex flex-col gap-4">
                 <button className="h-16 px-10 bg-white text-[#171717] hover:bg-[#FB432C] hover:text-white font-black text-[14px] uppercase tracking-widest rounded-[16px] transition-all duration-300 shadow-xl hover:-translate-y-1">
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
