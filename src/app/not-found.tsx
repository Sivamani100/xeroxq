"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Printer, ArrowLeft, Search, AlertTriangle, Home } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white flex flex-col selection:bg-black selection:text-white overflow-hidden">
      <SiteHeader />
      
      <main className="flex-1 flex items-center justify-center relative px-6 py-32">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-primary/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-2xl mx-auto text-center relative z-10 space-y-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-20 h-20 bg-black rounded-lg flex items-center justify-center mx-auto shadow-2xl shadow-black/20"
          >
            <AlertTriangle className="w-8 h-8 text-white" />
          </motion.div>
          
          <div className="space-y-4">
             <motion.div
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
               className="inline-flex items-center gap-2 px-4 py-1.5 bg-black/5 rounded-full border border-black/5"
             >
                <span className="text-[11px] font-black tracking-[0.2em] text-black uppercase">Signal Lost | 404</span>
             </motion.div>
             <motion.h1 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3 }}
               className="text-[48px] lg:text-[72px] font-bold text-black tracking-tighter leading-none uppercase"
             >
                Signal Lost.
             </motion.h1>
             <motion.p 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.4 }}
               className="text-[13px] text-[#64748B] font-medium max-w-sm mx-auto leading-relaxed italic"
             >
                "The requested protocol node is offline or purged from the global print mesh. Hardware bridge failed."
             </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6"
          >
            <button 
              onClick={() => router.push('/')}
              className="h-12 px-8 bg-black hover:bg-black/9 font-black text-[10px] uppercase tracking-widest rounded-lg shadow-xl shadow-black/20 transition-all flex items-center gap-2 group text-white"
            >
              <Home className="w-4 h-4 text-white" /> RETURN TO MESH
            </button>
            <button 
              onClick={() => router.back()}
              className="h-12 px-8 border-[#E2E8F0] hover:bg-[#F8FAFC] text-black font-black text-[10px] uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> PREVIOUS NODE
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="pt-24 border-t border-[#E2E8F0] max-w-xs mx-auto"
          >
             <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.3em]">XeroxQ Network Safety Protocol Enabled</p>
          </motion.div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
