"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, KeyRound, Mail, ArrowLeft } from "lucide-react";

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
    <main className="min-h-screen w-full bg-white flex items-center justify-center p-6 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px]"
      >
        {/* Header */}
        <div className="flex flex-col gap-2 mb-8">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 mb-2">
            <KeyRound className="w-6 h-6 text-primary-blue" />
          </div>
          <h1 className="text-[32px] font-bold text-black leading-[1.2]">Forgot Password</h1>
          <p className="text-[14px] font-medium text-auth-slate-50">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 bg-[#FAFAFC] border border-slate-200 rounded-2xl text-center space-y-4"
          >
            <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center border border-green-100 mx-auto">
              <CheckCircle2 className="w-7 h-7 text-green-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-black">Reset Link Sent!</h2>
              <p className="text-sm text-auth-slate-50 leading-relaxed">
                We sent a password reset email to <strong>{email}</strong>. Please check your inbox and click the link to proceed.
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
            <div className="flex flex-col gap-[5.57px]">
              <label className="text-[12.27px] font-semibold text-auth-slate-90" htmlFor="email">
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
                  className="w-full auth-input pl-10 placeholder:text-auth-slate-20 text-[13px]"
                />
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-auth-slate-20" />
              </div>
            </div>

            {/* Error Message */}
            {message && isError && (
              <div className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-xl text-xs border border-red-100 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
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
              className="w-full h-[38px] flex items-center justify-center gap-2 text-[13px] font-semibold text-auth-slate-50 hover:text-black transition-colors cursor-pointer"
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
