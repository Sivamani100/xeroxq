"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowLeft } from "lucide-react";

export default function AuthError() {
  const router = useRouter();

  return (
    <main className="min-h-screen w-full bg-white flex items-center justify-center p-6 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px] p-8 bg-[#FAFAFC] border border-slate-200 rounded-3xl text-center space-y-6 shadow-sm"
      >
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center border border-amber-100 mx-auto">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-black tracking-tight">Authentication Link Expired</h1>
          <p className="text-sm text-auth-slate-50 leading-relaxed">
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
            className="w-full h-[38px] flex items-center justify-center gap-2 text-[13px] font-semibold text-auth-slate-50 hover:text-black transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>
        </div>
      </motion.div>
    </main>
  );
}
