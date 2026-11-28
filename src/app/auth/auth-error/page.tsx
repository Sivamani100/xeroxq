"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/lib/theme";

export default function AuthError() {
  const router = useRouter();

  return (
    <main className="min-h-screen w-full bg-[#FAFAFA] dark:bg-[#111113] text-[#171717] dark:text-[#EDEDED] flex items-center justify-center p-6 font-sans relative">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle compact />
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px] p-8 bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-[20px] text-center space-y-6 shadow-[0_1px_2px_rgba(17,17,19,0.04)]"
      >
        <div className="w-16 h-16 bg-amber-500/15 rounded-full flex items-center justify-center border border-amber-500/25 mx-auto">
          <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-300" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-[#171717] dark:text-[#EDEDED] tracking-tight">
            Authentication Link Expired
          </h1>
          <p className="text-sm text-[#525252] dark:text-[#A1A1A6] leading-relaxed">
            The password reset link is invalid, expired, or has already been used. Please request a new link.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={() => router.push("/auth/forgot-password")}
            className="w-full h-[44px] btn-auth-primary text-[14px] font-semibold cursor-pointer"
          >
            Request New Reset Link
          </button>

          <button
            onClick={() => router.push("/login")}
            className="w-full h-[38px] flex items-center justify-center gap-2 text-[13px] font-semibold text-[#525252] dark:text-[#A1A1A6] hover:text-[#171717] dark:hover:text-[#EDEDED] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>
        </div>
      </motion.div>
    </main>
  );
}
