"use client";

import { motion } from "framer-motion";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { 
  Puzzle, 
  ArrowRight, 
  Globe, 
  Cloud, 
  Database,
  Search,
  MessageSquare,
  Lock
} from "lucide-react";

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      {...props}
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}

function SlackIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z" />
      <path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
      <path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5z" />
      <path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5s.67-1.5 1.5-1.5z" />
      <path d="M10 14.5c0 .83-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5z" />
      <path d="M10 20.5V19h1.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5z" />
      <path d="M14 9.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z" />
      <path d="M14 3.5V5h-1.5c-.83 0-1.5-.67-1.5-1.5S11.67 2 12.5 2s1.5.67 1.5 1.5z" />
    </svg>
  );
}

export default function Integrations() {
  const integrations = [
    { name: "Google Drive", category: "Storage", icon: Cloud, color: "text-blue-500", desc: "Print documents directly from your cloud storage with one-click XeroxQ sync." },
    { name: "Slack", category: "Workflow", icon: SlackIcon, color: "text-purple-500", desc: "Trigger print jobs and receive delivery alerts directly in your team channels." },
    { name: "GitHub", category: "Developer", icon: GithubIcon, color: "text-black", desc: "Automate technical documentation printing with our GitHub Action integration." },
    { name: "DocuSign", category: "Legal", icon: Lock, color: "text-blue-600", desc: "Seamlessly transition from digital signature to physical archive with secure bridging." },
    { name: "Dropbox", category: "Storage", icon: BoxIcon, color: "text-blue-400", desc: "Enterprise-grade storage syncing for large-scale document delivery." },
    { name: "Microsoft 365", category: "Office", icon: Briefcase, color: "text-red-500", desc: "Send Word and Excel files directly to the XeroxQ mesh from your web browser." }
  ];

  return (
    <div className="min-h-screen bg-white selection:bg-black selection:text-white">
      <SiteHeader />
      
      <main className="pt-32 pb-16">
        {/* Integrations Hero */}
        <section className="relative pb-24 text-center">
          <div className="max-w-[1280px] mx-auto px-6 space-y-12 relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="inline-flex items-center gap-2 px-3 py-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded-md shadow-sm mb-6"
            >
              <Puzzle className="w-3.5 h-3.5 text-black" />
              <span className="text-[10px] font-black tracking-[0.2em] text-black uppercase">XeroxQ Connect Hub</span>
            </motion.div>
            
            <div className="space-y-6 max-w-4xl mx-auto">
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-[64px] lg:text-[100px] font-bold text-black tracking-tighter leading-[0.85] uppercase"
              >
                Integrate Your <br className="hidden lg:block" /> Document Workflow.
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-2xl text-[#64748B] font-medium max-w-2xl mx-auto leading-relaxed"
              >
                Bridge the digital and physical worlds. Sync your existing tools with the XeroxQ decentralized mesh in minutes.
              </motion.p>
            </div>

            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, delay: 0.3 }}
               className="max-w-md mx-auto relative group"
            >
               <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] group-hover:text-black transition-colors" />
               <input 
                  type="text" 
                  placeholder="Search 100+ native hooks..." 
                  className="w-full h-14 pl-12 pr-6 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold placeholder:text-[#94A3B8] focus:border-black/5 focus:shadow-xl transition-all outline-none" 
               />
            </motion.div>
          </div>
        </section>

        {/* Integration Grid */}
        <section className="py-16 border-y border-[#E2E8F0] bg-[#F8FAFC]">
           <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {integrations.map((int, i) => (
                <motion.div 
                  key={int.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="p-8 bg-white border border-[#E2E8F0] rounded-xl hover:shadow-2xl hover:bg-[#F8FAFC] transition-all group text-left cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-8">
                     <div className={`w-12 h-12 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
                        <int.icon className={`w-6 h-6 ${int.color}`} />
                     </div>
                     <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em]">{int.category}</span>
                  </div>
                  <h3 className="text-xl font-bold text-black tracking-tight mb-3 uppercase leading-none">{int.name}</h3>
                  <p className="text-sm text-[#64748B] font-medium leading-relaxed mb-8 italic opacity-80">"{int.desc}"</p>
                  <button className="text-[10px] font-black text-black flex items-center gap-2 border-b border-black/5 hover:border-black transition-all pb-1 uppercase tracking-widest">
                     Activate Hook <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              ))}
           </div>
        </section>

        {/* API CTA */}
        <motion.section 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="py-20 px-6 text-center"
        >
           <div className="max-w-[1280px] mx-auto p-12 bg-black rounded-xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-96 h-96 bg-white opacity-[0.03] blur-[120px] rounded-full" />
              <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                 <div className="text-left space-y-4 max-w-xl">
                    <h2 className="text-4xl font-bold text-white tracking-tighter leading-none uppercase">High-Fidelity Bridge.</h2>
                    <p className="text-sm text-slate-400 font-medium leading-relaxed italic opacity-80">"Leverage the Protocol API and SDKs for custom physicalization logic across the decentralized mesh."</p>
                 </div>
                 <div className="flex flex-col sm:flex-row items-center gap-4">
                    <button className="h-11 px-8 bg-white text-black hover:bg-white/90 font-black text-[10px] uppercase tracking-widest rounded-lg transition-all shadow-xl shadow-white/5">
                       DOCUMENTATION
                    </button>
                    <button className="h-11 px-8 border border-white/20 hover:bg-white/5 text-white font-black text-[10px] uppercase tracking-widest rounded-lg transition-all">
                       CORE SANDBOX
                    </button>
                 </div>
              </div>
           </div>
        </motion.section>
      </main>

      <SiteFooter />
    </div>
  );
}

function BoxIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

function Briefcase(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      <rect width="20" height="14" x="2" y="6" rx="2" />
    </svg>
  );
}
