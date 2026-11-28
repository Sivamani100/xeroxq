"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Printer, ArrowLeft, Search, AlertTriangle, Home } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#111113] text-[#171717] dark:text-[#EDEDED] flex flex-col selection:bg-[#FB432C] selection:text-white overflow-hidden">
      <SiteHeader />

      <main className="flex-1 flex items-center justify-center relative px-6 py-28">
        <div className="max-w-xl mx-auto text-center relative z-10 space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-16 h-16 bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-2xl flex items-center justify-center mx-auto"
          >
            <AlertTriangle className="w-7 h-7 text-[#FB432C]" />
          </motion.div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#F4F4F5] dark:bg-[#19191B] rounded-full border border-[#171717]/[0.08] dark:border-white/[0.08]">
              <span className="text-[11px] font-semibold tracking-wider text-[#525252] dark:text-[#A1A1A6] uppercase">404 · Page Not Found</span>
            </div>
            <h1 className="text-[40px] lg:text-[56px] font-semibold text-[#171717] dark:text-[#EDEDED] tracking-tight leading-none">
              Page not found.
            </h1>
            <p className="text-sm text-[#525252] dark:text-[#A1A1A6] max-w-sm mx-auto leading-relaxed">
              The shop link or page you requested doesn&apos;t exist or has been moved.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => router.push('/')}
              suppressHydrationWarning
              className="h-11 px-7 bg-[#FB432C] hover:bg-[#E03923] font-semibold text-xs text-white rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4" /> Return Home
            </button>
            <button
              onClick={() => router.back()}
              suppressHydrationWarning
              className="h-11 px-7 border border-[#171717]/[0.10] dark:border-white/[0.10] bg-white dark:bg-[#19191B] hover:bg-[#F4F4F5] dark:hover:bg-[#232325] text-[#171717] dark:text-[#EDEDED] font-semibold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Go Back
            </button>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
