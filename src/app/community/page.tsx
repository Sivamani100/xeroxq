"use client";

import { motion } from "framer-motion";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { 
  Users, 
  Globe, 
  ShieldCheck, 
  Heart, 
  ArrowRight, 
  Network,
  Zap,
  Printer,
  Scale,
  Users2
} from "lucide-react";

export default function Community() {
  const values = [
    { title: "Privacy as a Right", desc: "Encryption isn't an option; it's the default state of the protocol. We believe your physical documents are your business alone.", icon: ShieldCheck },
    { title: "Distributed Power", desc: "By decentralizing print shops, we remove single points of failure and surveillance, empowering local entrepreneurs global network access.", icon: Network },
    { title: "Open Source Vision", desc: "The XeroxQ protocol is built by the community, for the community. Transparent code for a transparent world of document physicalization.", icon: Globe }
  ];

  const teamValues = [
    { title: "Innovation", desc: "Pushing the boundaries of decentralized hardware protocols." },
    { title: "Reliability", desc: "Building the world's most stable autonomous print mesh." },
    { title: "Community", desc: "Empowering 10,000+ local shop owners worldwide." },
    { title: "Inclusion", desc: "Making professional document delivery accessible to everyone." }
  ];

  return (
    <div className="min-h-screen bg-white selection:bg-brand-primary selection:text-white overflow-hidden">
      <SiteHeader />
      
      <main className="pt-32 pb-16">
        {/* Community Hero */}
        <section className="relative pb-24 text-center">
          <div className="max-w-[1280px] mx-auto px-6 space-y-12 relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-3 py-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded-md shadow-sm mb-6"
            >
              <Users2 className="w-3.5 h-3.5 text-black" />
              <span className="text-[10px] font-black tracking-[0.2em] text-black uppercase">The XeroxQ Community</span>
            </motion.div>
            
            <div className="space-y-6 max-w-4xl mx-auto">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[64px] lg:text-[100px] font-bold text-black tracking-tighter leading-[0.85]"
              >
                A Global Mesh <br /> Of Trust.
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-2xl text-[#64748B] font-medium max-w-3xl mx-auto leading-relaxed"
              >
                XeroxQ is more than a protocol. It’s a decentralized movement of developers, shopkeepers, and privacy advocates physicalizing the digital world.
              </motion.p>
            </div>
          </div>
        </section>

        {/* Vision & Values */}
        <section className="py-20 border-y border-[#E2E8F0] bg-[#F8FAFC]">
           <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              {values.map((value, i) => (
                <div 
                  key={value.title}
                  className="p-8 bg-white rounded-xl border border-[#E2E8F0] space-y-6 hover:shadow-xl transition-all group"
                >
                  <div className="w-12 h-12 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center group-hover:scale-110 transition-transform">
                     <value.icon className="w-6 h-6 text-black" />
                  </div>
                  <div className="space-y-3">
                     <h3 className="text-xl font-bold tracking-tight text-black uppercase">{value.title}</h3>
                     <p className="text-sm text-[#64748B] font-medium leading-relaxed">{value.desc}</p>
                  </div>
                </div>
              ))}
           </div>
        </section>

        {/* The 'User' Focus */}
        <section className="py-40">
           <div className="max-w-[1280px] mx-auto px-6 flex flex-col lg:flex-row items-center gap-32">
              <div className="flex-1 space-y-12 text-left">
                 <div className="space-y-6">
                    <span className="text-[11px] font-extrabold text-brand-primary uppercase tracking-[0.3em]">Our Philosophy</span>
                    <h2 className="text-5xl lg:text-6xl font-bold text-black tracking-tight leading-[0.95]">By the people. <br /> For the people.</h2>
                    <p className="text-xl text-[#64748B] font-medium leading-relaxed">
                       At XeroxQ, every 'Shop' is an independent node. Every 'User' is a privacy champion. Together, we are building a world where physical document delivery is as secure as a blockchain transaction.
                    </p>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {teamValues.map((tv, i) => (
                       <div key={i} className="p-6 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1 group hover:bg-black transition-all">
                          <h4 className="text-sm font-bold text-black group-hover:text-white transition-colors uppercase tracking-tight">{tv.title}</h4>
                          <p className="text-[12px] text-[#64748B] font-medium group-hover:text-slate-400 transition-colors">{tv.desc}</p>
                       </div>
                    ))}
                 </div>
                 
                 <button className="h-12 px-8 bg-black text-white rounded-lg font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center gap-3 group active:scale-95">
                    Join Global Mesh <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                 </button>
              </div>

              <div className="flex-1 w-full relative">
                 <div className="aspect-square bg-slate-50 rounded-2xl overflow-hidden shadow-2xl border border-[#E2E8F0] relative group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent z-10" />
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                       <div className="w-[85%] h-[85%] border border-[#E2E8F0] rounded-xl flex items-center justify-center relative bg-white/40 backdrop-blur-sm shadow-sm">
                          <Users className="w-48 h-48 text-black opacity-10 group-hover:scale-105 transition-transform duration-700" />
                          <div className="absolute -top-4 -right-4 bg-black p-5 rounded-xl text-white shadow-2xl">
                             <div className="text-2xl font-black tracking-tighter">10K+</div>
                             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Nodes</div>
                          </div>
                          <div className="absolute -bottom-6 -left-6 bg-black p-6 rounded-xl text-white shadow-2xl group-hover:-translate-y-2 transition-transform">
                             <Heart className="w-8 h-8 fill-brand-primary text-brand-primary" />
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* Global Scalability Stats */}
        <section className="pb-16 px-6">
           <div className="max-w-[1280px] mx-auto p-12 bg-black rounded-xl relative overflow-hidden group">
              <div className="absolute bottom-0 right-0 w-80 h-80 bg-white opacity-[0.03] blur-[120px] rounded-full" />
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12 text-center lg:text-left">
                 <div className="space-y-2">
                    <div className="text-5xl font-bold text-white tracking-tighter">150+</div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Countries Reached</div>
                 </div>
                 <div className="space-y-2">
                    <div className="text-5xl font-bold text-white tracking-tighter">1.2M</div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Physicalized Signals</div>
                 </div>
                 <div className="space-y-2">
                    <div className="text-5xl font-bold text-white tracking-tighter">99.9%</div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Network Uptime</div>
                 </div>
              </div>
           </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
