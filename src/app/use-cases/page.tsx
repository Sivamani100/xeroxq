"use client";

import { motion } from "framer-motion";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { 
  GraduationCap, 
  Plane, 
  Store, 
  Pencil, 
  ArrowRight, 
  CheckCircle2,
  Lock,
  Globe,
  Zap,
  Briefcase
} from "lucide-react";

export default function UseCases() {
  const cases = [
    { 
      title: "Students & Academia", 
      desc: "Instant campus document physicalization. Print your thesis, notes, and research papers from any device to the nearest encrypted shop node.", 
      icon: GraduationCap, 
      color: "bg-blue-500/10 text-blue-600",
      features: ["Student-ID Bridging", "High-Speed Batch Printing", "Academic Network Discounts"]
    },
    { 
      title: "Travelers & Nomads", 
      desc: "Print boarding passes, visas, and essential travel documents in any city. Our global mesh ensures you're never more than 5 minutes from a shop.", 
      icon: Plane, 
      color: "bg-amber-500/10 text-amber-600",
      features: ["Offline Support", "Multi-Region Shop Routing", "Private Document Purging"]
    },
    { 
      title: "Local Merchants", 
      desc: "Automate your shipping labels, invoices, and menus. Connect your POS system to XeroxQ for 100% autonomous document output.", 
      icon: Store, 
      color: "bg-emerald-500/10 text-emerald-600",
      features: ["POS Integration", "Automated Billing", "Inventory Labeling"]
    },
    { 
      title: "Architects & Engineers", 
      desc: "Scale your high-fidelity blueprints and technical drawings. Distributed plotting across verified high-resolution network nodes.", 
      icon: Pencil, 
      color: "bg-[#FB432C]/10 text-[#FB432C]",
      features: ["DPI Verification", "Large-Format Routing", "Secure Blueprint Sync"]
    }
  ];

  return (
    <div className="min-h-screen bg-white selection:bg-black selection:text-white">
      <SiteHeader />
      
      <main className="pt-32 pb-16">
        {/* Use Cases Hero */}
        <section className="relative pb-24 text-center">
          <div className="max-w-[1280px] mx-auto px-6 space-y-12 relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="inline-flex items-center gap-2 px-3 py-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded-md shadow-sm mb-6"
            >
              <Briefcase className="w-3.5 h-3.5 text-black" />
              <span className="text-[10px] font-black tracking-[0.2em] text-black uppercase">XeroxQ Use Cases</span>
            </motion.div>
            
            <div className="space-y-6 max-w-4xl mx-auto">
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-[64px] lg:text-[100px] font-bold text-black tracking-tighter leading-[0.85] uppercase"
              >
                Engineered For <br className="hidden lg:block" /> Every Signal.
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-2xl text-[#64748B] font-medium max-w-2xl mx-auto leading-relaxed"
              >
                From simple class notes to high-fidelity architectural blueprints, our protocol ensures every physicalization is secure and autonomous.
              </motion.p>
            </div>
          </div>
        </section>

        {/* Use Cases Grid */}
        <section className="py-16 border-y border-[#E2E8F0] bg-[#F8FAFC]">
           <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {cases.map((useCase, i) => (
                <motion.div 
                  key={useCase.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 }}
                  className="group p-8 bg-white rounded-xl border border-[#E2E8F0] hover:shadow-2xl transition-all relative overflow-hidden text-left shadow-sm"
                >
                  <div className="flex flex-col md:flex-row items-start gap-8 relative z-10">
                     <div className={`w-14 h-14 shrink-0 rounded-lg ${useCase.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
                        <useCase.icon className="w-7 h-7" />
                     </div>
                     <div className="space-y-6 flex-1">
                        <div className="space-y-3">
                           <h3 className="text-2xl font-bold text-black tracking-tight uppercase leading-none">{useCase.title}</h3>
                           <p className="text-[#64748B] font-medium text-sm leading-relaxed italic opacity-80">"{useCase.desc}"</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                           {useCase.features.map((feature, j) => (
                              <div key={feature} className="flex items-center gap-2.5 group/feat">
                                 <CheckCircle2 className="w-3.5 h-3.5 text-black group-hover/feat:scale-110 transition-transform" />
                                 <span className="text-[10px] font-black text-black tracking-widest uppercase">{feature}</span>
                              </div>
                           ))}
                        </div>
                        <button className="h-11 px-6 border border-black/5 bg-[#F8FAFC] hover:bg-black hover:text-white transition-all rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center gap-2 group/btn shadow-sm active:scale-95">
                           Solution Overview <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                     </div>
                  </div>
                </motion.div>
              ))}
           </div>
        </section>

        {/* Network Efficiency */}
        <section className="py-24">
           <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-12 text-center">
              {[
                { title: "Zero Wait Time", desc: "Prioritized shop routing protocol eliminates waiting in line for your documents.", icon: Zap },
                { title: "100% Privacy", desc: "Documents are encrypted end-to-end and purged after physicalization.", icon: Lock },
                { title: "Global Reach", desc: "A decentralized mesh of 10,000+ verified nodes across every continent.", icon: Globe }
              ].map((item, i) => (
                <motion.div 
                  key={item.title} 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="space-y-6"
                >
                   <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mx-auto text-white shadow-xl shadow-black/10 group-hover:scale-110 transition-transform">
                      <item.icon className="w-8 h-8" />
                   </div>
                   <h4 className="text-xl font-bold text-black tracking-tight uppercase leading-none">{item.title}</h4>
                   <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-xs mx-auto italic">"{item.desc}"</p>
                </motion.div>
              ))}
           </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
