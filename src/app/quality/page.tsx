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
      icon: <Scan className="w-6 h-6" />,
      title: "A4 Normalization Engine",
      desc: "Every uploaded document (whether PDF, DOCX, or Image) is automatically re-rendered and normalized to perfect A4 dimensions. This entirely eliminates cut-off margins or misaligned prints at the shop.",
      highlight: "Perfect Margins"
    },
    {
      icon: <Wand2 className="w-6 h-6" />,
      title: "Contrast AI Optimization",
      desc: "For photographs of documents (like ID cards or handwritten notes), our edge-engine automatically adjusts contrast and drops white-balance to ensure crisp, legible grayscale printing.",
      highlight: "Auto-Enhance"
    },
    {
      icon: <FileCheck2 className="w-6 h-6" />,
      title: "Vector Data Retention",
      desc: "Unlike WhatsApp which heavily compresses your files into blurry images, XeroxQ preserves raw vector data for PDFs and text documents ensuring absolute typographic sharpness.",
      highlight: "Zero Compression"
    },
    {
      icon: <Printer className="w-6 h-6" />,
      title: "Verified Hardware Nodes",
      desc: "All shops in our Andhra Pradesh network must pass a manual verification of their hardware. We only route documents to commercial-grade laser printing machines.",
      highlight: "Commercial Grade"
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#111113] text-[#171717] dark:text-[#EDEDED] flex flex-col font-sans selection:bg-[#FB432C] selection:text-white overflow-x-hidden">
      <SiteHeader />
      
      <main className="flex-1 pt-32 pb-0">
        
        {/* Quality Header */}
        <section className="relative pt-12 pb-16 text-center">
          <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05] text-[#171717] dark:text-white pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(currentColor 1.5px, transparent 0)', backgroundSize: '40px 40px' }} />
               
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
               <div className="inline-flex items-center gap-2.5 px-4 h-8 rounded-full bg-[#F4F4F5] dark:bg-[#232325] border border-[#171717]/[0.10] dark:border-white/[0.10] mb-8 mx-auto">
                 <div className="w-2 h-2 rounded-full bg-[#FB432C]" />
                 <span className="text-[10px] font-bold text-[#171717] dark:text-[#EDEDED] uppercase tracking-[0.2em] leading-none">Standardization Layer</span>
               </div>
               
               <h2 className="text-[40px] md:text-[54px] font-extrabold tracking-tighter text-[#171717] dark:text-[#EDEDED] leading-none mb-6 uppercase">
                 Quality Assurance
               </h2>
               <p className="text-lg font-medium text-[#525252] dark:text-[#A1A1A6] leading-relaxed italic max-w-2xl mx-auto">
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
                       className="group bg-white dark:bg-[#19191B] p-8 md:p-10 rounded-[32px] border border-[#171717]/[0.08] dark:border-white/[0.08] hover:border-[#171717]/20 dark:hover:border-white/20 hover:shadow-2xl hover:shadow-black/5 dark:hover:shadow-black/40 transition-all duration-500"
                    >
                       <div className="flex justify-between items-start mb-8">
                          <div className="w-16 h-16 rounded-[20px] bg-[#F4F4F5] dark:bg-[#232325] border border-[#171717]/[0.10] dark:border-white/[0.10] text-[#171717] dark:text-[#EDEDED] flex items-center justify-center group-hover:scale-110 group-hover:bg-[#171717] group-hover:text-white dark:group-hover:bg-[#EDEDED] dark:group-hover:text-[#111113] transition-all duration-500 shadow-sm">
                             {pillar.icon}
                          </div>
                          
                          <div className="px-3 py-1.5 bg-[#F4F4F5] dark:bg-[#232325] border border-[#171717]/[0.10] dark:border-white/[0.10] shadow-sm rounded-full flex items-center gap-2 group-hover:border-[#FB432C]/30 transition-colors">
                            <ShieldCheck className="w-3 h-3 text-[#171717] dark:text-[#EDEDED] group-hover:text-[#FB432C] transition-colors" />
                            <span className="text-[10px] font-black text-[#171717] dark:text-[#EDEDED] uppercase tracking-widest group-hover:text-[#FB432C] transition-colors">{pillar.highlight}</span>
                          </div>
                       </div>
                       
                       <h3 className="text-2xl font-black uppercase tracking-tighter text-[#171717] dark:text-[#EDEDED] mb-4 group-hover:text-[#FB432C] transition-colors">
                          {pillar.title}
                       </h3>
                       <p className="text-[#525252] dark:text-[#A1A1A6] font-medium leading-relaxed text-[15px]">
                          {pillar.desc}
                       </p>
                    </motion.div>
                 ))}
              </div>
           </div>
        </section>

        {/* Bottom Banner Note */}
        <section className="py-24 bg-[#171717] dark:bg-[#141416] border-t border-white/[0.08]">
           <div className="max-w-[1280px] mx-auto px-6">
              <div className="flex flex-col md:flex-row items-center justify-between bg-white/[0.04] dark:bg-[#19191B] border border-white/[0.08] rounded-[32px] p-10 md:p-16 text-center md:text-left gap-10">
                 <div className="space-y-4 max-w-xl">
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white">Trust the Hardware.</h2>
                    <p className="text-[#A1A1A6] font-medium leading-relaxed">
                       Have you experienced dull or smudged prints from a XeroxQ verified shop? Please report the node ID to our support team and we will investigate their hardware.
                    </p>
                 </div>
                 <button className="shrink-0 h-14 px-8 bg-white hover:bg-[#FB432C] text-[#171717] hover:text-white font-bold text-[12px] uppercase tracking-widest rounded-full transition-all duration-300">
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
