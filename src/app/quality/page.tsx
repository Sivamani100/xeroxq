"use client";

import { motion } from "framer-motion";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { 
  FileCheck2, 
  Scan, 
  Printer, 
  Wand2, 
  CheckCircle2,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function QualityPage() {
  const qualityPillars = [
    {
      icon: <Scan className="w-6 h-6 text-black" />,
      title: "A4 Normalization Engine",
      desc: "Every uploaded document (whether PDF, DOCX, or Image) is automatically re-rendered and normalized to perfect A4 dimensions. This entirely eliminates cut-off margins or misaligned prints at the shop.",
      highlight: "Perfect Margins"
    },
    {
      icon: <Wand2 className="w-6 h-6 text-black" />,
      title: "Contrast AI Optimization",
      desc: "For photographs of documents (like ID cards or handwritten notes), our edge-engine automatically adjusts contrast and drops white-balance to ensure crisp, legible grayscale printing.",
      highlight: "Auto-Enhance"
    },
    {
      icon: <FileCheck2 className="w-6 h-6 text-black" />,
      title: "Vector Data Retention",
      desc: "Unlike WhatsApp which heavily compresses your files into blurry images, XeroxQ preserves raw vector data for PDFs and text documents ensuring absolute typographic sharpness.",
      highlight: "Zero Compression"
    },
    {
      icon: <Printer className="w-6 h-6 text-black" />,
      title: "Verified Hardware Nodes",
      desc: "All shops in our Andhra Pradesh network must pass a manual verification of their hardware. We only route documents to commercial-grade laser printing machines.",
      highlight: "Commercial Grade"
    }
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-sans selection:bg-[#FB432C] selection:text-white overflow-x-hidden">
      <SiteHeader />
      
      <main className="flex-1 pt-32 pb-0">
        
        {/* Quality Header */}
        <section className="relative pt-12 pb-16 text-center">
          <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 0)', backgroundSize: '40px 40px' }} />
               
          <div className="max-w-[1280px] mx-auto px-6 relative z-10">
             <motion.div 
               variants={{
                 hidden: { opacity: 0, y: 20 },
                 visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
               }}
               initial="hidden"
               animate="visible"
               className="mx-auto max-w-2xl text-center"
             >
               <div className="inline-flex items-center gap-2.5 px-4 h-8 rounded-full bg-black/5 border border-black/5 mb-8 mx-auto">
                 <div className="w-2 h-2 rounded-full bg-[#FB432C] animate-pulse" />
                 <span className="text-[10px] font-bold text-black uppercase tracking-[0.2em] leading-none">Standardization Layer</span>
               </div>
               
               <h2 className="text-[40px] md:text-[54px] font-extrabold tracking-tighter text-black leading-none mb-6 uppercase">
                 Quality Assurance
               </h2>
               <p className="text-lg font-medium text-gray-500 leading-relaxed italic max-w-2xl mx-auto">
                 In the past, sending files over messaging apps destroyed print quality. Our custom rendering pipeline ensures every document that hits the printer is impossibly sharp.
               </p>
             </motion.div>
          </div>
        </section>

        {/* Dynamic Quality Grid */}
        <section className="pb-32 relative z-20">
           <div className="max-w-[1280px] mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {qualityPillars.map((pillar, i) => (
                    <motion.div 
                       key={i}
                       initial={{ opacity: 0, y: 30 }}
                       whileInView={{ opacity: 1, y: 0 }}
                       viewport={{ once: true, margin: "-50px" }}
                       transition={{ delay: i * 0.1, duration: 0.6 }}
                       className="group bg-white p-8 md:p-10 rounded-[32px] border border-black/5 hover:border-black/10 hover:shadow-2xl hover:shadow-black/5 transition-all duration-500"
                    >
                       <div className="flex justify-between items-start mb-8">
                          <div className="w-16 h-16 rounded-[20px] bg-[#F8FAFC] border border-gray-100 flex items-center justify-center group-hover:scale-110 group-hover:bg-black group-hover:text-white transition-all duration-500 shadow-sm">
                             {/* Small hack to make icon white on hover: using CSS approach */}
                             <div className="group-hover:invert transition-all duration-500">
                                {pillar.icon}
                             </div>
                          </div>
                          
                          <div className="px-3 py-1.5 bg-[#FDFDFD] border border-gray-100 shadow-sm rounded-full flex items-center gap-2 group-hover:border-[#FB432C]/30 transition-colors">
                            <ShieldCheck className="w-3 h-3 text-black group-hover:text-[#FB432C] transition-colors" />
                            <span className="text-[10px] font-black text-black uppercase tracking-widest group-hover:text-[#FB432C] transition-colors">{pillar.highlight}</span>
                          </div>
                       </div>
                       
                       <h3 className="text-2xl font-black uppercase tracking-tighter text-black mb-4 group-hover:text-[#FB432C] transition-colors">
                          {pillar.title}
                       </h3>
                       <p className="text-[#64748B] font-medium leading-relaxed text-[15px]">
                          {pillar.desc}
                       </p>
                    </motion.div>
                 ))}
              </div>
           </div>
        </section>

        {/* Bottom Banner Note */}
        <section className="py-24 bg-black">
           <div className="max-w-[1280px] mx-auto px-6">
              <div className="flex flex-col md:flex-row items-center justify-between bg-white/5 border border-white/10 rounded-[32px] p-10 md:p-16 text-center md:text-left gap-10">
                 <div className="space-y-4 max-w-xl">
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white">Trust the Hardware.</h2>
                    <p className="text-gray-400 font-medium leading-relaxed">
                       Have you experienced dull or smudged prints from a XeroxQ verified shop? Please report the node ID to our support team and we will investigate their hardware.
                    </p>
                 </div>
                 <button className="shrink-0 h-14 px-8 bg-white hover:bg-[#FB432C] text-black hover:text-white font-bold text-[12px] uppercase tracking-widest rounded-full transition-all duration-300">
                    Report Shop Node
                 </button>
              </div>
           </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
