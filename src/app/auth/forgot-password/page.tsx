"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, KeyRound, Mail, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/lib/theme";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setIsError(false);

    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=/auth/update-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (error) {
        setIsError(true);
        setMessage(`Error: ${error.message}`);
      } else {
        setSubmitted(true);
        setMessage("Check your email for the password reset link!");
      }
    } catch (err) {
      const e = err as Error;
      setIsError(true);
      setMessage(e.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-[#FAFAFA] dark:bg-[#111113] text-[#171717] dark:text-[#EDEDED] flex items-center justify-center p-6 font-sans relative">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle compact />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px] rounded-[20px] bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] p-7 sm:p-8 shadow-[0_1px_2px_rgba(17,17,19,0.04)]"
      >
        {/* Header */}
        <div className="flex flex-col gap-2 mb-8">
          <div className="w-12 h-12 bg-[#FB432C]/10 rounded-2xl flex items-center justify-center border border-[#FB432C]/20 mb-2">
            <KeyRound className="w-6 h-6 text-[#FB432C]" />
          </div>
          <h1 className="text-[28px] font-semibold text-[#171717] dark:text-[#EDEDED] leading-[1.2] tracking-tight">
            Forgot Password
          </h1>
          <p className="text-[14px] text-[#525252] dark:text-[#A1A1A6]">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 bg-[#F4F4F5] dark:bg-[#232325] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-2xl text-center space-y-4"
          >
            <div className="w-14 h-14 bg-[#16A34A]/10 dark:bg-[#4CC38A]/15 rounded-full flex items-center justify-center border border-[#16A34A]/20 dark:border-[#4CC38A]/25 mx-auto">
              <CheckCircle2 className="w-7 h-7 text-[#16A34A] dark:text-[#4CC38A]" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-[#171717] dark:text-[#EDEDED]">Reset Link Sent!</h2>
              <p className="text-sm text-[#525252] dark:text-[#A1A1A6] leading-relaxed">
                We sent a password reset email to <strong className="text-[#171717] dark:text-[#EDEDED]">{email}</strong>. Please check your inbox and click the link to proceed.
              </p>
            </div>
            <button
              onClick={() => router.push("/login")}
              className="w-full h-[42px] btn-auth-primary text-[14px] font-semibold cursor-pointer mt-2"
            >
              Return to Login
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleResetRequest} className="flex flex-col gap-5">
            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-semibold text-[#171717] dark:text-[#EDEDED]" htmlFor="email">
                Your Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full auth-input pl-10 text-[13px]"
                />
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737373] dark:text-[#85858B]" />
              </div>
            </div>

            {/* Error Message */}
            {message && isError && (
              <div className="flex items-center gap-3 p-3.5 bg-[#DC2626]/10 dark:bg-[#E5484D]/15 text-[#DC2626] dark:text-[#E5484D] rounded-xl text-xs border border-[#DC2626]/20 dark:border-[#E5484D]/25 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[44px] btn-auth-primary text-[14px] font-semibold tracking-tight cursor-pointer mt-2"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

            {/* Back to Login */}
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="w-full h-[38px] flex items-center justify-center gap-2 text-[13px] font-semibold text-[#525252] dark:text-[#A1A1A6] hover:text-[#171717] dark:hover:text-[#EDEDED] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>
          </form>
        )}
      </motion.div>
    </main>
  );
}
