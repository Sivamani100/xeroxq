"use client";

import { motion } from "framer-motion";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ShieldCheck, Lock, Cpu, BugPlay, Server, QrCode, ScanEye } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SecurityPage() {
  const securityLayers = [
    {
      title: "AES-GCM Encryption",
      desc: "All document payloads are encrypted on the client device using AES-256-GCM before traversing the network. XeroxQ servers route ciphertext exclusively.",
      icon: Lock,
      bg: "bg-blue-500",
      border: "border-blue-400"
    },
    {
      title: "Ephemeral Routing",
      desc: "State does not exist in the print mesh. Payloads are buffered in high-speed RAM and flushed via 7-pass military wipe exactly 30s post-print.",
      icon: Server,
      bg: "bg-emerald-500",
      border: "border-emerald-400"
    },
    {
      title: "The QR Handshake",
      desc: "Authentication is decentralized. The QR code on a shop's desk serves as a one-time physical cryptographic key for signal decryption at the terminal.",
      icon: QrCode,
      bg: "bg-purple-500",
      border: "border-purple-400"
    },
    {
      title: "Node Audits",
      desc: "Every physical shop partner undergoes rigorous signal and hardware screening in Andhra Pradesh before receiving a live routing token.",
      icon: ScanEye,
      bg: "bg-orange-500",
      border: "border-orange-400"
    }
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-sans selection:bg-[#FB432C] selection:text-white overflow-x-hidden">
      <SiteHeader />
      
      <main className="flex-1 pt-32 pb-0">
        
        {/* Security Hero */}
        <section className="relative pt-12 pb-16 text-center border-b border-gray-100 overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
               
          <div className="max-w-[1280px] mx-auto px-6 relative z-10">
             <motion.div 
               variants={{
                 hidden: { opacity: 0, y: 20 },
                 visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
               }}
               initial="hidden"
               animate="visible"
               className="max-w-4xl mx-auto"
             >
               <div className="inline-flex items-center gap-2.5 px-4 h-8 rounded-full bg-black/5 border border-black/5 mb-8">
                 <ShieldCheck className="w-3.5 h-3.5 text-black" />
                 <span className="text-[10px] font-bold text-black uppercase tracking-[0.2em] leading-none">Architecture Overview</span>
               </div>
               
               <h1 className="text-[40px] md:text-[80px] font-extrabold tracking-tighter text-black leading-[0.95] mb-6 uppercase">
                 Security First.
               </h1>
               <p className="text-lg md:text-2xl font-medium text-gray-500 leading-relaxed italic max-w-2xl mx-auto">
                 "Our infrastructure is explicitly designed to handle highly sensitive legal, medical, and government prints with absolute zero-knowledge properties."
               </p>
             </motion.div>
          </div>
        </section>

        {/* 4 Security Layers */}
        <section className="py-32 bg-white relative z-20">
           <div className="max-w-[1280px] mx-auto px-6">
              <div className="text-center mb-20">
                 <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-black mb-4">Defense in Depth</h2>
                 <p className="text-gray-500 font-medium max-w-lg mx-auto">The four pillars of the XeroxQ cryptographic standard.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {securityLayers.map((layer, i) => (
                    <motion.div 
                       key={layer.title}
                       initial={{ opacity: 0, y: 30 }}
                       whileInView={{ opacity: 1, y: 0 }}
                       viewport={{ once: true }}
                       transition={{ delay: i * 0.1, duration: 0.6 }}
                       className="group p-8 rounded-[32px] bg-black text-white relative overflow-hidden transition-all duration-700 hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/20"
                    >
                       <div className={cn("absolute top-0 right-0 w-32 h-32 opacity-20 blur-[50px] rounded-full group-hover:scale-150 transition-transform duration-1000", layer.bg)} />
                       
                       <div className="relative z-10">
                          <div className={cn("w-14 h-14 rounded-[16px] flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-500", layer.bg, layer.border)}>
                             <layer.icon className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="text-xl font-black tracking-tighter uppercase leading-none mb-4">{layer.title}</h3>
                          <p className="text-[13px] font-medium text-gray-400 leading-relaxed">
                             {layer.desc}
                          </p>
                       </div>
                    </motion.div>
                 ))}
              </div>
           </div>
        </section>

        {/* Bug Bounty */}
        <section className="py-24 bg-[#F8FAFC] border-y border-gray-100">
           <div className="max-w-[1000px] mx-auto px-6 text-center">
              <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 viewport={{ once: true }}
                 transition={{ duration: 0.6 }}
              >
                 <div className="w-20 h-20 bg-white border border-gray-200 rounded-[24px] flex items-center justify-center mx-auto mb-8 shadow-sm">
                    <BugPlay className="w-10 h-10 text-black" />
                 </div>
                 <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-black mb-6">Found a vulnerability?</h2>
                 <p className="text-lg text-gray-600 font-medium leading-relaxed mb-10 max-w-2xl mx-auto italic">
                    If you are a security researcher, ethical hacker, or cryptographer and have discovered a theoretical exploit in our ephemeral network, we want to hear from you.
                 </p>
                 
                 <div className="inline-flex flex-col sm:flex-row items-center gap-4">
                    <button className="h-14 px-8 bg-black text-white hover:bg-[#FB432C] font-bold text-[12px] uppercase tracking-widest rounded-xl shadow-xl shadow-black/10 transition-all">
                       Submit Report (PGP Key)
                    </button>
                    <a href="#" className="h-14 px-8 bg-white border border-gray-200 text-black hover:border-black font-bold text-[12px] uppercase tracking-widest rounded-xl shadow-sm flex items-center transition-all">
                       View Bounty Payouts
                    </a>
                 </div>
              </motion.div>
           </div>
        </section>

      </main>

      <SiteFooter />
    </div>
  );
}
