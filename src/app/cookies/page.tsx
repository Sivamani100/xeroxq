"use client";

import { motion } from "framer-motion";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Cookie, ShieldCheck, Database, Info } from "lucide-react";

export default function CookiePolicy() {
  const sections = [
    { title: "What are Cookies?", content: "Cookies are small text files stored on your browser or device by websites, apps, and ads. XeroxQ uses minimal cookies to ensure technical stability, remember your preferences, and maintain secure sessions." },
    { title: "Strictly Necessary", content: "These cookies are required for the XeroxQ platform to function. They handle authentication (keeping you logged into your shop) and security (protecting against CSRF attacks). These cannot be disabled." },
    { title: "Functional Cookies", content: "We use functional cookies to remember your location preferences so we can show you the nearest print shops automatically. This improves your document delivery efficiency." },
    { title: "Performance & Analytics", content: "XeroxQ uses privacy-focused, anonymized analytics to understand network load and optimize the 'Signal' delivery speed. We do not track individual users or document contents." },
    { title: "Managing Cookies", content: "Most web browsers allow you to control cookies through their settings. However, disabling all cookies may limit your ability to use certain features of the XeroxQ print network." }
  ];

  return (
    <div className="min-h-screen bg-white selection:bg-[#FB432C] selection:text-white">
      <SiteHeader />
      
      <main className="pt-32 pb-16">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 items-start">
            
            <aside className="hidden lg:block lg:col-span-3 sticky top-32">
              <div className="space-y-10">
                 <div className="flex flex-col gap-3 text-left">
                    <span className="text-[10px] font-black text-black uppercase tracking-[0.2em] mb-3">Cookie Navigation</span>
                    {sections.map((section, i) => (
                      <a key={section.title} href={`#section-${i}`} className="text-[11px] font-black text-[#64748B] hover:text-black transition-colors flex items-center gap-2 uppercase tracking-widest">
                         <div className="w-1 h-1 bg-[#E2E8F0] rounded-full" /> {section.title}
                      </a>
                    ))}
                 </div>
                 
                 <div className="p-6 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-4">
                    <div className="w-10 h-10 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center shadow-sm">
                       <ShieldCheck className="w-5 h-5 text-black" />
                    </div>
                    <div className="space-y-2">
                       <h4 className="text-xs font-black text-black tracking-tight leading-none uppercase">Privacy-Centric</h4>
                       <p className="text-[11px] text-[#64748B] font-medium leading-relaxed italic">
                          "Zero third-party tracking logic. Essential ephemeral state management only."
                       </p>
                    </div>
                 </div>
              </div>
            </aside>

            <div className="lg:col-span-9 max-w-3xl text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-12"
              >
                 <div className="space-y-6">
                   <div className="inline-flex items-center gap-2 px-3 py-1 bg-black/5 rounded-md border border-black/5">
                      <Cookie className="w-3.5 h-3.5 text-black" />
                      <span className="text-[10px] font-black tracking-[0.1em] text-black uppercase">Transparency Declaration</span>
                   </div>
                   <h1 className="text-5xl lg:text-7xl font-bold text-black tracking-tighter leading-[0.95] uppercase">Cookie Policy</h1>
                   <div className="flex items-center gap-8 pt-4">
                      <div className="flex flex-col">
                         <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest leading-none mb-2">LAST REVISION</span>
                         <span className="text-[11px] font-black text-black uppercase tracking-widest">APR 04, 2026</span>
                      </div>
                      <div className="w-[1px] h-10 bg-[#E2E8F0]" />
                      <div className="flex flex-col">
                         <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest leading-none mb-2">PROTOCOL ID</span>
                         <span className="text-[11px] font-black text-black uppercase tracking-widest">v2.1-STABLE</span>
                      </div>
                   </div>
                </div>

                <div className="prose prose-slate max-w-none">
                  <p className="text-xl text-[#475569] font-medium leading-relaxed mb-16">
                    XeroxQ uses essential data storage technology to provide a high-fidelity print experience. We believe in total transparency regarding how and why we use cookies.
                  </p>
                  
                  <div className="space-y-16">
                    {sections.map((section, i) => (
                      <motion.section 
                        key={section.title} 
                        id={`section-${i}`} 
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05 }}
                        className="scroll-mt-32"
                      >
                        <h3 className="text-xl font-bold text-black tracking-tight mb-4 uppercase">{section.title}</h3>
                        <p className="text-[#64748B] font-medium text-sm leading-relaxed italic opacity-80">"{section.content}"</p>
                      </motion.section>
                    ))}
                  </div>
                </div>

                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="mt-24 p-12 bg-black rounded-xl border border-white/10 relative overflow-hidden text-center group shadow-2xl"
                >
                   <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-[0.03] blur-[100px] rounded-full" />
                   <div className="relative z-10 flex flex-col items-center gap-8">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-md text-white text-[10px] font-black tracking-widest uppercase">
                         <Info className="w-3.5 h-3.5 text-white" />
                         CONSENT PREFERENCE
                      </div>
                      <div className="space-y-3">
                         <h4 className="text-2xl font-bold text-white tracking-tight leading-none uppercase">Encryption of Choice.</h4>
                         <p className="text-sm text-slate-400 font-medium max-w-sm mx-auto italic opacity-70">"Essential state management is required for optimal node physicalization."</p>
                      </div>
                      <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="h-11 px-8 bg-white hover:bg-[#F8FAFC] text-black font-black text-[10px] uppercase tracking-widest rounded-lg shadow-2xl transition-all active:scale-95">
                         ACCEPT PROTOCOL COOKIES
                      </button>
                   </div>
                </motion.div>
              </motion.div>
            </div>

          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
