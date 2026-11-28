"use client";

import { motion } from "framer-motion";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { 
  ArrowRight,
  Smartphone,
  Lock,
  Printer,
  QrCode,
  Zap,
  Globe,
  FileCheck2
} from "lucide-react";

export default function HowItWorksPage() {
  const customSteps = [
    { 
      title: "Scan & Connect", 
      description: "Walk into any partner Xerox shop in AP and scan their unique XeroxQ QR code. No app downloads required.", 
      icon: <QrCode className="h-6 w-6" />,
      benefits: ["No WhatsApp required", "Instant connection", "Works on any phone"]
    },
    { 
      title: "Upload Document", 
      description: "Select the document from your phone. It is instantly encrypted before it even leaves your device.", 
      icon: <Smartphone className="h-6 w-6" />,
      benefits: ["AES-256 encryption", "PDF/DOCX support", "Zero local trace"]
    },
    { 
      title: "Secure Transfer", 
      description: "The file is routed directly to the shop's terminal. The shop owner cannot download or save your file locally.", 
      icon: <Lock className="h-6 w-6" />,
      benefits: ["Direct to printer", "Shop owner isolation", "End-to-End verified"]
    },
    { 
      title: "Print & Vanish", 
      description: "The document prints immediately. Once the job is done, the file is permanently deleted from the network.", 
      icon: <Printer className="h-6 w-6" />,
      benefits: ["7-pass erasure", "Instant physicalization", "Complete privacy"]
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#111113] text-[#171717] dark:text-[#EDEDED] selection:bg-[#FB432C] selection:text-white overflow-x-hidden font-sans flex flex-col">
      <SiteHeader />
      
      <main className="flex-1 pt-32 pb-0">

        {/* Hero Section styled like the landing page component header */}
        <section className="relative pt-12 pb-16 text-center overflow-hidden">
          <div className="max-w-[1280px] mx-auto px-6 relative z-10">
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
              }}
              initial="hidden"
              animate="visible"
              className="mx-auto mb-16 max-w-2xl text-center"
            >
              <div className="inline-flex items-center gap-2.5 px-4 h-8 rounded-full bg-[#F4F4F5] dark:bg-[#232325] border border-[#171717]/[0.08] dark:border-white/[0.08] mb-8 mx-auto">
                <div className="w-2 h-2 rounded-full bg-[#FB432C]" />
                <span className="text-[10px] font-bold text-[#171717] dark:text-[#EDEDED] uppercase tracking-[0.2em] leading-none">The XeroxQ Protocol</span>
              </div>
              <h2 className="text-[40px] md:text-[54px] font-extrabold tracking-tighter text-[#171717] dark:text-[#EDEDED] leading-[0.95] mb-6 uppercase">
                Privacy-First Printing <br/> In 4 Steps
              </h2>
              <p className="text-lg font-medium text-[#525252] dark:text-[#A1A1A6] leading-relaxed italic max-w-2xl mx-auto">
                We re-engineered how printing works from the ground up. Protect your personal documents without sacrificing convenience.
              </p>
            </motion.div>

            {/* Step Indicators with Connecting Line (Identical to Landing Page) */}
            <motion.div 
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { delay: 0.4, duration: 0.8 } }
              }}
              initial="hidden"
              animate="visible"
              className="relative mx-auto mb-16 w-full max-w-4xl hidden md:block"
            >
              <div
                aria-hidden="true"
                className="absolute left-[12.5%] top-1/2 h-[1px] w-[75%] -translate-y-1/2 bg-[#171717]/[0.08] dark:bg-white/[0.08]"
              ></div>
              <div className="relative grid grid-cols-4">
                {customSteps.map((_, index) => (
                  <div
                    key={index}
                    className="flex h-10 w-10 items-center justify-center justify-self-center rounded-full bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] font-bold text-[#171717] dark:text-[#EDEDED] text-sm shadow-sm ring-8 ring-[#FAFAFA] dark:ring-[#111113] transition-all duration-300 hover:border-[#FB432C] hover:text-[#FB432C] hover:scale-110"
                  >
                    0{index + 1}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Steps Grid (Identical to StepCard in how-it-works.tsx) */}
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4 mb-24">
              {customSteps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: index * 0.15, duration: 0.8, type: 'spring', bounce: 0.3 }}
                  className={cn(
                    "relative rounded-2xl border border-[#171717]/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#19191B] p-6 lg:p-8 text-[#171717] dark:text-[#EDEDED] transition-all duration-500 ease-in-out group text-left",
                    "hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/5 dark:hover:shadow-black/40 hover:border-[#FB432C]/30"
                  )}
                >
                  {/* Icon */}
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#171717] dark:bg-[#232325] text-white shadow-lg shadow-black/20 group-hover:bg-[#FB432C] group-hover:scale-110 transition-all duration-500">
                    {step.icon}
                  </div>
                  {/* Title and Description */}
                  <h3 className="mb-3 text-lg font-bold tracking-tight uppercase">{step.title}</h3>
                  <p className="mb-8 text-xs font-medium text-[#525252] dark:text-[#A1A1A6] leading-relaxed">{step.description}</p>
                  {/* Benefits List */}
                  <ul className="space-y-4">
                    {step.benefits.map((benefit, bIndex) => (
                      <li key={bIndex} className="flex items-center gap-3">
                        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#171717]/5 dark:bg-white/10 group-hover:bg-[#FB432C]/15 transition-colors">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#171717] dark:bg-[#EDEDED] group-hover:bg-[#FB432C] transition-colors"></div>
                        </div>
                        <span className="text-[11px] font-bold text-[#525252] dark:text-[#A1A1A6] uppercase tracking-tight">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>

          </div>
        </section>

        {/* Global CTA matching landing page style */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="pb-32 px-6"
        >
           <div className="max-w-[1280px] mx-auto p-12 lg:p-20 bg-[#171717] dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-[32px] relative overflow-hidden text-center group shadow-2xl">
              <div className="relative z-10 flex flex-col items-center gap-8">
                 
                 <div className="space-y-4">
                    <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tighter uppercase leading-none">
                       Ready to Print Securely?
                    </h2>
                    <p className="text-white/70 font-medium max-w-lg mx-auto leading-relaxed">
                       Find a XeroxQ enabled shop near you and experience true privacy. Free for users. Free for shops.
                    </p>
                 </div>

                 <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <Link href="/shops">
                       <button className="h-14 px-10 bg-[#FB432C] hover:bg-[#E03923] text-white font-bold text-[12px] uppercase tracking-widest rounded-full transition-all shadow-xl shadow-[#FB432C]/20 flex items-center gap-2">
                          Find A Shop <ArrowRight className="w-4 h-4" />
                       </button>
                    </Link>
                    <Link href="/register">
                       <button className="h-14 px-10 bg-white/10 border border-white/20 hover:bg-white/20 text-white font-bold text-[12px] uppercase tracking-widest rounded-full transition-all flex items-center gap-2">
                          <Globe className="w-4 h-4" /> Register Shop
                       </button>
                    </Link>
                 </div>
              </div>
           </div>
        </motion.section>
      </main>

      <SiteFooter />
    </div>
  );
}
