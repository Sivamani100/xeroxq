"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, 
  ArrowRight, 
  Check, 
  ShieldCheck, 
  Globe, 
  Users, 
  Layers, 
  Repeat, 
  Lock, 
  Mail, 
  Send,
  PlusCircle, 
  Monitor,
  Printer,
  X,
  Map,
  ShieldAlert,
  Wrench,
  CheckCircle,
  TrendingUp,
  Cpu,
  Network
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

// Custom Premium Accordion for "Super Duper" feel (Light Mode)
const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-[#E2E8F0] py-6 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left group"
      >
        <span className={cn(
          "text-lg font-bold transition-colors duration-300",
          isOpen ? "text-brand-primary" : "text-black group-hover:text-brand-primary"
        )}>
          {question}
        </span>
        <div className={cn(
          "w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center transition-all duration-300 shadow-sm",
          isOpen ? "bg-black border-black rotate-45" : "bg-white group-hover:bg-[#F8FAFC]"
        )}>
          <X className={cn("w-4 h-4", isOpen ? "text-white" : "text-[#94A3B8] rotate-45")} />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pt-4 text-[#64748B] leading-relaxed max-w-2xl font-medium">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function LandingPage() {
  const router = useRouter();
  const [contactStatus, setContactStatus] = useState<"idle" | "sending" | "sent">("idle");

  return (
    <div className="min-h-screen bg-white selection:bg-brand-primary selection:text-white overflow-hidden">
      <SiteHeader />
      <main className="space-y-16 lg:space-y-24">
      {/* Hero Section */}
      <section className="relative pt-40 pb-20 lg:pt-56 lg:pb-32 bg-white overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 0)', backgroundSize: '40px 40px' }} />
        
        <div className="max-w-[1280px] mx-auto px-6 relative z-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-black/5 rounded-md border border-black/5 mb-8"
          >
            <Zap className="w-3.5 h-3.5 text-black" />
            <span className="text-black text-[10px] font-black tracking-[0.2em] uppercase leading-none">v4.2.0 Mainnet is Live</span>
            <div className="w-1 h-1 bg-black/20 rounded-full" />
            <span className="text-[#64748B] text-[10px] font-black tracking-[0.1em] uppercase">12ms Global Latency</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-[64px] lg:text-[110px] font-black text-black tracking-tighter leading-[0.8] mb-10"
          >
            Autonomous <br className="hidden lg:block" /> Document <span className="text-transparent bg-clip-text bg-gradient-to-r from-black to-black/60">Physicalization.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-xl lg:text-3xl text-[#64748B] font-medium max-w-4xl mb-20 leading-tight"
          >
            The world's first decentralized print protocol. High-fidelity output delivered through an encrypted global mesh of autonomous shop nodes.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center gap-6"
          >
            <Button 
                onClick={() => router.push('/register')}
                className="h-16 px-10 bg-black hover:bg-black/80 text-white font-black text-[13px] uppercase tracking-widest rounded-full shadow-2xl shadow-black/20 transition-all active:scale-95 group border border-black"
            >
              Start Your Shop <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </Button>
            <Button 
                onClick={() => router.push('/how-it-works')}
                className="h-16 px-10 bg-white border-2 border-[#E2E8F0] hover:border-black hover:bg-[#F8FAFC] text-black font-black text-[13px] uppercase tracking-widest rounded-full transition-all"
            >
              How it Works
            </Button>
          </motion.div>


        </div>
      </section>

      {/* Live Network Telemetry - High Density */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        id="telemetry" 
        className="py-32 bg-black border-y border-white/10 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-[0.03] blur-[120px] rounded-full" />
        <div className="max-w-[1280px] mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 text-left">
            <div className="space-y-4 max-w-lg">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-md">
                 <Network className="w-3.5 h-3.5 text-white" />
                 <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Global Telemetry</span>
              </div>
              <h2 className="text-3xl font-bold text-white tracking-tight uppercase leading-none">Real-Time Mesh <br /> Resilience.</h2>
              <p className="text-sm text-slate-400 font-medium leading-relaxed italic opacity-80 overflow-hidden text-ellipsis line-clamp-2">Dynamic node distribution ensuring sub-second signal physicalization across the encrypted global protocol mesh architecture.</p>
            </div>

            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
               {[
                 { label: "Active Nodes", value: "14,892", status: "STABLE", color: "text-emerald-500" },
                 { label: "Mesh Latency", value: "8.4ms", status: "OPTIMIZED", color: "text-blue-400" },
                 { label: "Data Purged", value: "100.0%", status: "VERIFIED", color: "text-white" },
                 { label: "Uptime SLA", value: "99.99%", status: "ACTIVE", color: "text-amber-500" }
               ].map((metric, i) => (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }}
                   whileInView={{ opacity: 1, scale: 1 }}
                   viewport={{ once: true }}
                   transition={{ delay: i * 0.1 }}
                   key={metric.label} 
                   className="p-4 bg-white/5 border border-white/10 rounded-lg space-y-3"
                 >
                    <div className="flex items-center justify-between">
                       <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">{metric.label}</span>
                       <div className={`w-1 h-1 rounded-full ${metric.color.replace('text-', 'bg-')} animate-pulse`} />
                    </div>
                    <div className="text-xl font-black text-white tracking-tighter uppercase leading-none">{metric.value}</div>
                    <div className={cn("text-[8px] font-black uppercase tracking-widest leading-none", metric.color)}>{metric.status}</div>
                 </motion.div>
               ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* The Problem (Legacy Analytics) - High Density */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        id="problem" 
        className="py-32 bg-white"
      >
        <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
           <div className="space-y-12 text-left order-2 lg:order-1">
              <div className="space-y-4">
                 <span className="text-[10px] font-black text-black uppercase tracking-[0.3em]">Institutional Audit</span>
                 <h2 className="text-4xl lg:text-5xl font-bold text-black tracking-tight leading-none uppercase">The Legacy <br /> Failure.</h2>
                 <p className="text-sm text-[#64748B] font-medium leading-relaxed max-w-sm italic opacity-80">
                   Traditional cloud printing relies on vulnerable central servers, persistent data logs, and high-latency routing benchmarks.
                 </p>
              </div>
              
              <div className="space-y-6">
                 {[
                   { icon: ShieldAlert, title: "Persistent Logs", desc: "Centralized servers store document artifacts long after physicalization, creating massive security leaks." },
                   { icon: Lock, title: "High-Latency Routing", desc: "Global document delivery is throttled by legacy ISP bottlenecks and centralized data center dependencies." }
                 ].map((p, i) => (
                   <motion.div 
                     initial={{ opacity: 0, x: -20 }}
                     whileInView={{ opacity: 1, x: 0 }}
                     viewport={{ once: true }}
                     transition={{ delay: i * 0.1 }}
                     key={p.title} 
                     className="flex gap-4 p-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg group"
                   >
                      <div className="w-10 h-10 rounded bg-black/5 border border-black/5 flex items-center justify-center flex-shrink-0 group-hover:bg-black group-hover:text-white transition-all">
                         <p.icon className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                         <h4 className="text-xs font-black text-black uppercase tracking-tight">{p.title}</h4>
                         <p className="text-[11px] text-[#64748B] font-medium leading-relaxed italic">"{p.desc}"</p>
                      </div>
                   </motion.div>
                 ))}
              </div>
           </div>

           <div className="relative order-1 lg:order-2">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="aspect-[4/3] bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl relative overflow-hidden flex items-center justify-center group pointer-events-none"
              >
                 <div className="absolute inset-0 bg-black/5 opacity-50" />
                 <div className="flex flex-col items-center gap-4 animate-pulse">
                    <Monitor className="w-16 h-16 text-black/10" />
                    <span className="text-[10px] font-black tracking-widest text-black/20 uppercase">Centralized Vector Detected</span>
                 </div>
              </motion.div>
           </div>
        </div>
      </motion.section>

      {/* Mechanism Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        id="mechanism" 
        className="py-32 bg-[#F8FAFC] relative overflow-hidden border-y border-[#E2E8F0]"
      >
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-black/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 opacity-50" />
         <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 text-left">
               <div className="space-y-4">
                  <span className="text-[10px] font-black text-black uppercase tracking-[0.3em]">Protocol Layer</span>
                  <h2 className="text-5xl lg:text-6xl font-bold text-black tracking-tight leading-[0.95]">Encrypted Signal <br /> End-to-End.</h2>
                  <p className="text-base text-[#64748B] font-medium leading-relaxed max-w-lg">
                     Every print job is a 'Signal'. Our protocol encrypts your document locally on your device using AES-256 before routing it through the global mesh.
                  </p>
               </div>
               
               <div className="space-y-4">
                  {[
                    { icon: Lock, title: "Zero-Knowledge Transmission", desc: "Files only exist on your device and the target printer. Zero persistence elsewhere." },
                    { icon: ShieldCheck, title: "Identity Masking", desc: "Transactional privacy ensured through anonymous routing protocols." },
                    { icon: Globe, title: "Universal Mesh Access", desc: "No central point of failure. Access any node in the global network instantly." }
                  ].map((feat, i) => (
                    <motion.div 
                      key={feat.title}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-4 group"
                    >
                       <div className="w-10 h-10 rounded-lg bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                          <feat.icon className="w-5 h-5 text-black" />
                       </div>
                       <div className="space-y-0.5">
                          <h4 className="font-bold text-sm text-black tracking-tight">{feat.title}</h4>
                          <p className="text-[13px] text-[#64748B] font-medium leading-snug">{feat.desc}</p>
                       </div>
                    </motion.div>
                  ))}
               </div>
            </div>

            <div className="relative">
               <motion.div 
                 initial={{ opacity: 0, rotate: -5 }}
                 whileInView={{ opacity: 1, rotate: 0 }}
                 viewport={{ once: true }}
                 transition={{ duration: 0.8 }}
                 className="aspect-square bg-black rounded-2xl p-10 overflow-hidden shadow-2xl relative group max-w-md mx-auto lg:ml-auto"
               >
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50" />
                  <div className="relative z-10 flex flex-col items-center justify-center h-full text-white space-y-8 group-hover:scale-105 transition-transform duration-700">
                     <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center shadow-2xl">
                        <Printer className="w-8 h-8 text-black" />
                     </div>
                     <div className="space-y-3 text-center">
                        <div className="text-2xl font-black tracking-tighter">SECURE SIGNAL 01</div>
                        <div className="flex items-center gap-2 justify-center text-[9px] font-black tracking-[0.2em] text-emerald-400 uppercase">
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Protocol Verified
                        </div>
                     </div>
                  </div>
               </motion.div>
               {/* Floating Badges */}
               <motion.div 
                 initial={{ opacity: 0, x: 20 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: 0.5 }}
                 className="absolute -top-6 -right-6 bg-white px-6 py-4 rounded-xl shadow-2xl border border-[#E2E8F0] hidden lg:block"
               >
                  <div className="text-2xl font-black text-black">100%</div>
                  <div className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest mt-0.5">Uptime SLA</div>
               </motion.div>
            </div>
         </div>
      </motion.section>

      {/* Architectural Flow (1-2-3) - High Density */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        id="flow" 
        className="py-32 bg-white border-b border-[#E2E8F0]"
      >
         <div className="max-w-[1280px] mx-auto px-6 text-center space-y-16">
            <div className="space-y-4">
               <span className="text-[10px] font-black text-black uppercase tracking-[0.3em]">Protocol Lifecycle</span>
               <h2 className="text-4xl lg:text-5xl font-bold text-black tracking-tight leading-none uppercase">Document Pulse.</h2>
               <p className="text-[11px] text-[#64748B] font-black uppercase tracking-widest opacity-60">"THREE PHASES. ZERO DATA RESIDUE. ABSOLUTE AUTONOMY."</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
               <div className="absolute top-1/2 left-0 w-full h-px bg-black/5 hidden md:block -translate-y-1/2 z-0" />
               {[
                 { step: "01", title: "Handshake", desc: "Encryption bridge established via mercury protocol nodes." },
                 { step: "02", title: "Physicalized", desc: "High-fidelity document rendering on local mesh hardware." },
                 { step: "03", title: "Purge Phase", desc: "Automatic military-grade erasure of all transient fragments." }
               ].map((step, i) => (
                 <motion.div 
                   key={step.title} 
                   initial={{ opacity: 0, y: 20 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true }}
                   transition={{ delay: i * 0.2 }}
                   className="relative z-10 flex flex-col items-center gap-6 group"
                 >
                    <div className="w-14 h-14 bg-black rounded-lg text-white flex items-center justify-center text-xl font-black shadow-xl shadow-black/20 group-hover:rotate-6 transition-transform">
                       {step.step}
                    </div>
                    <div className="space-y-2 text-center">
                       <h3 className="text-lg font-bold text-black tracking-tight uppercase leading-none">{step.title}</h3>
                       <p className="text-[12px] text-[#64748B] font-medium leading-relaxed max-w-[200px] mx-auto italic opacity-80">"{step.desc}"</p>
                    </div>
                 </motion.div>
               ))}
            </div>
         </div>
      </motion.section>

      {/* Hardware Registry / Compatibility - High Density */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        id="hardware" 
        className="py-32 bg-[#F8FAFC]"
      >
         <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-4 space-y-6 text-left">
               <span className="text-[10px] font-black text-black uppercase tracking-[0.3em]">Hardware Abstraction</span>
               <h2 className="text-3xl font-bold text-black tracking-tight leading-none uppercase">Universal Node <br /> Bridging.</h2>
               <p className="text-[11px] text-[#64748B] font-medium leading-relaxed italic max-w-xs">
                  "Our protocol interfaces directly with standard hardware logic, ensuring physicalization parity across any mesh node."
               </p>
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 viewport={{ once: true }}
                 className="p-5 bg-white border border-[#E2E8F0] rounded-lg space-y-4"
               >
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded bg-black flex items-center justify-center">
                        <Wrench className="w-4 h-4 text-white" />
                     </div>
                     <span className="text-[11px] font-black text-black uppercase tracking-widest leading-none">DRIVER INDEPENDENT</span>
                  </div>
               </motion.div>
            </div>

            <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4">
               {[
                 { name: "PCL6", tag: "STANDARD" },
                 { name: "PostScript 3", tag: "H-FIDELITY" },
                 { name: "AIRPRINT", tag: "MOBILE" },
                 { name: "DOT-M", tag: "LEGACY" },
                 { name: "Z-LOGIC", tag: "NATIVE" },
                 { name: "IPPS", tag: "ENCRYPTED" },
                 { name: "CUPS", tag: "LINUX" },
                 { name: "X-BRIDGE", tag: "PROPRIETARY" }
               ].map((hw, i) => (
                 <motion.div 
                   key={hw.name} 
                   initial={{ opacity: 0, scale: 0.9 }}
                   whileInView={{ opacity: 1, scale: 1 }}
                   viewport={{ once: true }}
                   transition={{ delay: i * 0.05 }}
                   className="p-4 bg-white border border-[#E2E8F0] rounded-lg hover:shadow-xl transition-all group cursor-pointer text-left"
                 >
                    <div className="space-y-2">
                       <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">{hw.tag}</div>
                       <div className="text-[11px] font-black text-black tracking-widest uppercase leading-none">{hw.name}</div>
                       <div className="w-full h-1 bg-[#F8FAFC] group-hover:bg-black transition-colors rounded-full" />
                    </div>
                 </motion.div>
               ))}
            </div>
         </div>
      </motion.section>

      {/* Use Cases Grid */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        id="cases" 
        className="py-20 bg-white"
      >
        <div className="max-w-[1280px] mx-auto px-6 text-center">
          <div className="space-y-4 mb-16">
             <span className="text-[10px] font-black text-black uppercase tracking-[0.3em]">Institutional Use</span>
             <h2 className="text-4xl lg:text-5xl font-bold text-black tracking-tight leading-none uppercase">Built For Efficiency.</h2>
             <p className="text-sm text-[#64748B] font-medium max-w-lg mx-auto italic opacity-80">"One protocol, thousands of practical applications across the decentralized mercury mesh cluster architecture."</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {[
              { icon: Users, title: "Individuals", desc: "Securely print personal documents, visas, and tickets from any public node globally." },
              { icon: Layers, title: "Organizations", desc: "Manage company-wide physical document output with unified billing and encryption." },
              { icon: Repeat, title: "Autonomous Agents", desc: "Integrate document physicalization into automated software workflows via our API." }
            ].map((card, i) => (
              <motion.div 
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="p-8 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] hover:shadow-xl hover:bg-white transition-all group flex flex-col justify-between h-full"
              >
                <div className="space-y-6">
                  <div className="w-12 h-12 bg-white rounded-lg border border-[#E2E8F0] flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                     <card.icon className="w-6 h-6 text-black" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-black tracking-tight">{card.title}</h3>
                    <p className="text-sm text-[#64748B] font-medium leading-relaxed">{card.desc}</p>
                  </div>
                </div>
                <div className="pt-6 mt-6 border-t border-black/5">
                  <button className="flex items-center gap-2 text-[10px] font-black border-b border-black/10 hover:border-black transition-all pb-1 uppercase tracking-widest text-black">
                    Technical Guide <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Trust & Governance - High Density */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        id="security" 
        className="py-32 bg-black border-y border-white/10 relative overflow-hidden"
      >
         <div className="absolute bottom-0 left-0 w-96 h-96 bg-white opacity-[0.03] blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />
         <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-7 space-y-12 text-left">
               <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-white/5 border border-white/10 rounded-md">
                     <ShieldCheck className="w-3.5 h-3.5 text-white" />
                     <span className="text-[10px] font-black text-white uppercase tracking-widest">Protocol Governance</span>
                  </div>
                  <h2 className="text-4xl lg:text-6xl font-bold text-white tracking-tight leading-none uppercase">Encryption of <br /> Physicalization.</h2>
                  <p className="text-sm text-slate-400 font-medium leading-relaxed max-xl italic">
                    "Every node in the Mercury Mesh follows a strict Zero-Knowledge governance model. We physicalize documents, not data."
                  </p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[
                    { l: "AES-256-GCM", v: "Institutional-grade military encryption bridge." },
                    { l: "ED-25519", v: "Protocol-level node physicalization verification." },
                    { l: "TLS 1.3", v: "Handshake security with ephemeral key exchange." },
                    { l: "ROOT-TRUST", v: "Hardware-level physicalization node isolation." }
                  ].map((sec, i) => (
                    <motion.div 
                      key={sec.l} 
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="space-y-2 group"
                    >
                       <div className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                          <span className="text-[10px] font-black text-white tracking-widest uppercase leading-none">{sec.l}</span>
                       </div>
                       <p className="text-[11px] text-slate-500 font-medium leading-relaxed group-hover:text-slate-400 transition-colors uppercase italic opacity-80">"{sec.v}"</p>
                    </motion.div>
                  ))}
               </div>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-px bg-white/5 border border-white/10 rounded-lg overflow-hidden h-fit">
               {[
                 { label: "Compliance Index", value: "ISO-Q Alpha" },
                 { label: "Data Persistence", value: "0.00s" },
                 { label: "Root of Trust", value: "Hardware" },
                 { label: "Encryption", value: "Active" }
               ].map((row, i) => (
                 <motion.div 
                   key={row.label} 
                   initial={{ opacity: 0 }}
                   whileInView={{ opacity: 1 }}
                   viewport={{ once: true }}
                   transition={{ delay: i * 0.1 }}
                   className="flex items-center justify-between p-4 bg-white/[0.02]"
                 >
                    <span className="text-[9px] font-black text-slate-500 tracking-widest uppercase leading-none">{row.label}</span>
                    <span className="text-[10px] font-black text-white tracking-widest uppercase leading-none">{row.value}</span>
                 </motion.div>
               ))}
            </div>
         </div>
      </motion.section>

      {/* Global Mesh Status - High Density Cluster Map */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        id="mesh-status" 
        className="py-24 bg-white border-y border-[#E2E8F0] relative overflow-hidden"
      >
         <div className="max-w-[1280px] mx-auto px-6">
            <div className="flex flex-col lg:flex-row items-start justify-between gap-16">
               <div className="space-y-6 max-w-sm text-left">
                  <span className="text-[10px] font-black text-black uppercase tracking-[0.3em]">Live Node Clusters</span>
                  <h2 className="text-4xl font-bold text-black tracking-tight leading-none uppercase">Global Mesh <br /> Saturation.</h2>
                  <p className="text-[11px] text-[#64748B] font-medium leading-relaxed italic opacity-80">
                     "Autonomous physicalization nodes across all major territorial sectors, ensuring sub-8ms signal processing latency."
                  </p>
                  <div className="pt-4 space-y-3">
                     {[
                       { region: "North America", status: "94% SATURATION", nodes: "4,281" },
                       { region: "European Union", status: "98% SATURATION", nodes: "6,102" },
                       { region: "Asia Pacific", status: "82% SATURATION", nodes: "4,509" }
                     ].map((reg, i) => (
                       <motion.div 
                         key={reg.region}
                         initial={{ opacity: 0, x: -10 }}
                         whileInView={{ opacity: 1, x: 0 }}
                         viewport={{ once: true }}
                         transition={{ delay: i * 0.1 }}
                         className="flex items-center justify-between p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg"
                       >
                          <span className="text-[10px] font-black text-black uppercase">{reg.region}</span>
                          <div className="flex gap-4">
                             <span className="text-[9px] font-black text-emerald-500">{reg.status}</span>
                             <span className="text-[9px] font-black text-[#94A3B8]">{reg.nodes} NODES</span>
                          </div>
                       </motion.div>
                     ))}
                  </div>
               </div>
               
               <div className="flex-1 grid grid-cols-6 gap-2 w-full max-w-2xl opacity-40">
                  {Array.from({ length: 48 }).map((_, i) => (
                     <motion.div 
                        key={i}
                        initial={{ opacity: 0.1 }}
                        whileInView={{ opacity: [0.1, 0.4, 0.1] }}
                        viewport={{ once: true }}
                        transition={{ repeat: Infinity, duration: 2 + Math.random() * 2, delay: Math.random() }}
                        className="aspect-square bg-black rounded-[2px]"
                     />
                  ))}
               </div>
            </div>
         </div>
      </motion.section>

      {/* Developer API - Technical Integration */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        id="developer" 
        className="py-24 bg-black border-b border-white/10"
      >
         <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8 text-left">
               <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-md">
                     <Cpu className="w-3.5 h-3.5 text-white" />
                     <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Developer Logic</span>
                  </div>
                  <h2 className="text-4xl lg:text-5xl font-bold text-white tracking-tight leading-none uppercase">Integrate <br /> Physicalization.</h2>
                  <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-sm italic">
                    "Use our headless API to automate document routing and physicalization within your own software ecosystem."
                  </p>
               </div>
               <div className="space-y-2">
                  <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">PROTOCOL ENDPOINTS</div>
                  {["POST /v1/signal", "GET /v1/node/status", "PURGE /v1/residue"].map((endpoint, i) => (
                    <motion.div 
                      key={endpoint}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="p-3 bg-white/5 border border-white/10 rounded font-mono text-[11px] text-emerald-400 flex justify-between group cursor-pointer hover:bg-white/10 transition-all"
                    >
                       <span>{endpoint}</span>
                       <span className="text-white/20 group-hover:text-white/40 uppercase tracking-widest">v2.1-STABLE</span>
                    </motion.div>
                  ))}
               </div>
            </div>

            <div className="p-8 bg-[#0F172A] border border-white/10 rounded-xl font-mono text-[11px] text-white/80 space-y-4 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-20">
                  <Printer className="w-12 h-12 text-white" />
               </div>
                <div className="space-y-2">
                   <div className="text-emerald-400">// XeroxQ Signal Initializer</div>
                   <div className="text-[#94A3B8] italic">const signal = await xeroxq.physicalize({"&lbrace;"}</div>
                   <div className="pl-4">node_id: <span className="text-amber-400">"NODE_4082"</span>,</div>
                   <div className="pl-4">source: <span className="text-amber-400">"./internal_audit.pdf"</span>,</div>
                   <div className="pl-4 text-slate-500">encryption: "AES-256-GCM"</div>
                   <div className="text-[#94A3B8]">{"&rbrace;"});</div>
                </div>
               <div className="pt-4 border-t border-white/10 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-emerald-500 uppercase">SIGNAL HANDSHAKE ESTABLISHED</span>
               </div>
            </div>
         </div>
      </motion.section>

      {/* Verification Architecture - High Density Grid */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        id="verification" 
        className="py-24 bg-white border-y border-[#E2E8F0]"
      >
         <div className="max-w-[1280px] mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
               <div className="md:col-span-1 space-y-4 text-left">
                  <span className="text-[10px] font-black text-black uppercase tracking-[0.3em]">Institutional Verification</span>
                  <h2 className="text-3xl font-bold text-black tracking-tight leading-none uppercase">Standards of <br /> Physicalization.</h2>
                  <p className="text-[11px] text-[#64748B] font-medium leading-relaxed italic opacity-80">
                     "Every signal processed through the mesh is verified against global security standards."
                  </p>
               </div>
               <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: "SOC2 Compliance", desc: "Encryption standards verified for enterprise-grade document handling." },
                    { label: "GDPR Zero-Data", desc: "Absolute zero-persistence document routing architecture." },
                    { label: "AES-256 Bridge", desc: "Military-grade encryption handshake for every physicalization signal." }
                  ].map((std, i) => (
                    <motion.div 
                      key={std.label}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="p-6 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg group hover:bg-white hover:shadow-xl transition-all"
                    >
                       <div className="space-y-4">
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                          <div className="space-y-1">
                             <h4 className="text-xs font-black text-black uppercase tracking-tight">{std.label}</h4>
                             <p className="text-[11px] text-[#64748B] font-medium leading-relaxed italic">"{std.desc}"</p>
                          </div>
                       </div>
                    </motion.div>
                  ))}
               </div>
            </div>
         </div>
      </motion.section>

      {/* Community & Intelligence - High Density */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        id="community" 
        className="py-24 bg-[#F8FAFC]"
      >
         <div className="max-w-[1280px] mx-auto px-6 space-y-16">
            <div className="flex flex-col md:flex-row items-end justify-between gap-8 text-left">
               <div className="space-y-4">
                  <span className="text-[10px] font-black text-black uppercase tracking-[0.3em]">Protocol Intelligence</span>
                  <h2 className="text-4xl font-bold text-black tracking-tight leading-none uppercase">Community Hub.</h2>
                  <p className="text-sm text-[#64748B] font-medium max-w-sm italic opacity-80">"Latest deployment logs and architectural updates from the decentralized mesh community."</p>
               </div>
               <button onClick={() => router.push('/blog')} className="h-10 px-6 border border-[#E2E8F0] bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-lg hover:shadow-xl transition-all">
                  VIEW ALL LOGS
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
               {[
                 { title: "Mesh Protocol v2.1", date: "APR 02, 2026", cat: "CORE", desc: "Stable release of the decentralized signal handshake architecture." },
                 { title: "Node Optimization", date: "MAR 28, 2026", cat: "HARDWARE", desc: "Performance benchmarks for thermal-regulated physicalization nodes." },
                 { title: "Global Expansion", date: "MAR 15, 2026", cat: "NETWORK", desc: "Successful bridge establishment across 42 new regional mesh clusters." }
               ].map((post, i) => (
                 <motion.div 
                   key={post.title} 
                   initial={{ opacity: 0, y: 20 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true }}
                   transition={{ delay: i * 0.15 }}
                   className="p-6 bg-white border border-[#E2E8F0] rounded-lg hover:border-black transition-all group flex flex-col justify-between h-full shadow-sm"
                 >
                    <div className="space-y-4">
                       <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase">{post.date}</span>
                          <span className="px-2 py-0.5 bg-black/5 text-[8px] font-black text-black tracking-widest uppercase rounded">{post.cat}</span>
                       </div>
                       <h3 className="text-lg font-bold text-black tracking-tight group-hover:text-brand-primary transition-colors uppercase leading-none">{post.title}</h3>
                       <p className="text-[11px] text-[#64748B] font-medium leading-relaxed italic">"{post.desc}"</p>
                    </div>
                    <div className="pt-6 mt-6 border-t border-black/5">
                       <button className="text-[9px] font-black text-black border-b border-black/10 hover:border-black transition-all pb-0.5 uppercase tracking-widest">
                          READ INTEL
                       </button>
                    </div>
                 </motion.div>
               ))}
            </div>
         </div>
      </motion.section>

      {/* FAQ Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        id="faq" 
        className="py-20 bg-white border-t border-[#E2E8F0]"
      >
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-5 space-y-8 text-left">
              <div className="space-y-4">
                <span className="text-[10px] font-black text-black uppercase tracking-[0.3em]">Knowledge Base</span>
                <h2 className="text-4xl lg:text-5xl font-bold text-black tracking-tight leading-none uppercase">Your questions <br /> answered.</h2>
                <p className="text-base text-[#64748B] font-medium leading-relaxed max-w-sm">
                  Everything you need to know about XeroxQ. For deep technical insights, visit our documentation.
                </p>
              </div>
              <Button onClick={() => router.push('/help-center')} className="h-12 px-8 border-2 border-black/10 hover:bg-[#F8FAFC] text-black font-bold text-sm rounded-lg transition-all">
                Full Help Center
              </Button>
            </div>
            <div className="lg:col-span-7">
               <div className="divide-y divide-[#E2E8F0] border-t border-[#E2E8F0] text-left">
                  <FAQItem 
                    question="How is XeroxQ different from standard cloud printing?" 
                    answer="Unlike cloud printing, XeroxQ is decentralized. We never store your documents on a central server. Everything is encrypted locally."
                  />
                  <FAQItem 
                    question="Is it safe for sensitive legal documents?" 
                    answer="Yes. We use AES-256 E2E encryption. Shop nodes only receive the transient document fragment and purge it immediately."
                  />
                  <FAQItem 
                    question="How do I register my shop as a node?" 
                    answer="Simply create an admin account, set up your shop details, and print your unique shop QR poster to start accepting secure signals."
                  />
                  <FAQItem 
                    question="Which document types are supported?" 
                    answer="Our protocol currently supports PDF, DOCX, PNG, and JPG. All files are normalized to high-fidelity print formats autonomously."
                  />
               </div>
            </div>
          </div>
        </div>
      </motion.section>
      </main>

      <SiteFooter />
    </div>
  );
}
