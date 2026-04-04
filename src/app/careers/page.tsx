"use client";

import { motion } from "framer-motion";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { 
  Briefcase, 
  ArrowRight, 
  Cpu, 
  ShieldCheck, 
  Users, 
  Zap, 
  Globe,
  MapPin,
  Clock
} from "lucide-react";

export default function Careers() {
  const jobs = [
    { title: "Lead Protocol Engineer", location: "Remote / Global", type: "Full-Time", dept: "Engineering" },
    { title: "Security Auditor (Hardware-to-Signal)", location: "Lisbon, PT", type: "Full-Time", dept: "Security" },
    { title: "Global Mesh Growth Lead", location: "Remote / US", type: "Full-Time", dept: "Growth" },
    { title: "Full-Stack UI Architect (Mercury System)", location: "Remote / Global", type: "Full-Time", dept: "Design" }
  ];

  return (
    <div className="min-h-screen bg-white selection:bg-black selection:text-white overflow-hidden">
      <SiteHeader />
      
      <main className="pt-32 pb-16">
        {/* Careers Hero */}
        <section className="relative pb-24 text-center">
          <div className="max-w-[1280px] mx-auto px-6 space-y-12 relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="inline-flex items-center gap-2 px-3 py-1 bg-black rounded-md shadow-xl shadow-black/10 mb-6"
            >
              <Zap className="w-3.5 h-3.5 text-white" />
              <span className="text-[10px] font-black tracking-[0.2em] text-white uppercase">Join the Mesh</span>
            </motion.div>
            
            <div className="space-y-6 max-w-4xl mx-auto">
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-[64px] lg:text-[100px] font-bold text-black tracking-tighter leading-[0.85] uppercase"
              >
                Physicalize The <br /> Future With Us.
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-2xl text-[#64748B] font-medium max-w-2xl mx-auto leading-relaxed"
              >
                XeroxQ is looking for visionary decentralized hardware engineers and privacy advocates world-wide.
              </motion.p>
            </div>
          </div>
        </section>

        {/* Perk Grid */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="py-16 border-y border-[#E2E8F0] bg-[#F8FAFC]"
        >
           <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              {[
                { title: "Remote Protocol", desc: "Work from anywhere in the global mesh. Distributed teams for a distributed autonomous protocol.", icon: Globe },
                { title: "Hardware DNA", desc: "Help build the world's most secure document physicalization standards alongside industry leaders.", icon: ShieldCheck },
                { title: "Founder Model", desc: "Extreme ownership, high-fidelity output, and sub-second decision making are our core principles.", icon: Cpu }
              ].map((perk, i) => (
                <motion.div 
                  key={perk.title} 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="p-8 bg-white rounded-xl border border-[#E2E8F0] space-y-6 hover:shadow-xl transition-all group"
                >
                   <div className="w-12 h-12 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <perk.icon className="w-6 h-6 text-black" />
                   </div>
                   <h3 className="text-xl font-bold text-black tracking-tight uppercase leading-none">{perk.title}</h3>
                   <p className="text-sm text-[#64748B] font-medium leading-relaxed italic">"{perk.desc}"</p>
                </motion.div>
              ))}
           </div>
        </motion.section>

        {/* Current Roles */}
        <section className="py-20 max-w-[1280px] mx-auto px-6 text-left">
           <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex items-center justify-between mb-12 px-4"
           >
              <h2 className="text-3xl font-bold text-black tracking-tight uppercase">Node Lead Vacancies</h2>
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-black/5 rounded-md border border-black/5">
                 <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" />
                 <span className="text-[10px] font-black text-black uppercase tracking-widest">Actively Hiring</span>
              </div>
           </motion.div>

           <div className="space-y-3">
              {jobs.map((job, i) => (
                <motion.div 
                  key={job.title}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group bg-white p-8 rounded-xl border border-[#E2E8F0] hover:bg-black hover:shadow-xl transition-all cursor-pointer flex flex-col md:flex-row items-center justify-between gap-8"
                >
                  <div className="space-y-3 text-center md:text-left">
                     <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                        <span className="text-[10px] font-black text-black group-hover:text-white uppercase tracking-[0.2em]">{job.dept}</span>
                        <div className="w-1 h-1 bg-[#E2E8F0] rounded-full group-hover:bg-white/20" />
                        <span className="text-[10px] font-black text-[#94A3B8] group-hover:text-white/40 uppercase tracking-[0.2em]">{job.type}</span>
                     </div>
                     <h3 className="text-2xl font-bold text-black group-hover:text-white tracking-tight transition-colors leading-none uppercase">
                        {job.title}
                     </h3>
                  </div>
                  
                  <div className="flex items-center gap-8">
                     <div className="hidden lg:flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2 text-[#64748B] font-black text-[10px] tracking-tight group-hover:text-white transition-colors uppercase italic opacity-70">
                           <MapPin className="w-3.5 h-3.5" /> {job.location}
                        </div>
                        <div className="flex items-center gap-2 text-[#94A3B8] text-[9px] font-black uppercase tracking-[0.2em]">
                           <Clock className="w-3 h-3" /> 48H AGO
                        </div>
                     </div>
                     <div className="w-12 h-12 bg-[#F8FAFC] group-hover:bg-white rounded-lg flex items-center justify-center text-black shadow-sm group-hover:scale-110 transition-transform">
                        <ArrowRight className="w-5 h-5" />
                     </div>
                  </div>
                </motion.div>
              ))}
           </div>
        </section>

        {/* Global Opportunity */}
        <motion.section 
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="py-20 px-6 text-center"
        >
           <div className="max-w-[1280px] mx-auto p-12 bg-black rounded-xl relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 w-80 h-80 bg-white opacity-[0.05] blur-[120px] rounded-full" />
              <div className="relative z-10 flex flex-col items-center gap-8">
                 <h2 className="text-4xl lg:text-6xl font-bold text-white tracking-tighter leading-none uppercase">General Inquiry</h2>
                 <p className="text-sm text-slate-400 font-medium max-w-lg mx-auto leading-relaxed italic opacity-80">
                    "Seeking visionary engineers to build the world's most secure decentralized document physicalization standard."
                 </p>
                 <button className="h-11 px-8 bg-white text-black hover:bg-white/90 font-black text-[10px] uppercase tracking-widest rounded-lg transition-all shadow-xl active:scale-95">
                    Send Application
                 </button>
              </div>
           </div>
        </motion.section>
      </main>

      <SiteFooter />
    </div>
  );
}
