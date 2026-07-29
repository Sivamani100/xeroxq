"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound } from "lucide-react";

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword]         = useState("");
  const [confirm, setConfirm]           = useState("");
  const [showPassword, setShowPassword]   = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [success, setSuccess]           = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      // 1. Check for PKCE authorization code or OTP token in URL
      const queryCode = searchParams.get("code");
      const queryTokenHash = searchParams.get("token_hash");
      const queryType = searchParams.get("type");

      // 2. Read hash parameters if present
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      const hashParams = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (queryCode) {
        await supabase.auth.exchangeCodeForSession(queryCode);
      } else if (queryTokenHash && (queryType === "recovery" || !queryType)) {
        await supabase.auth.verifyOtp({ token_hash: queryTokenHash, type: "recovery" });
      } else if (accessToken && refreshToken) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (session && isMounted) {
            setError(null);
          }
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (!/[a-zA-Z]/.test(password)) {
      setError("Password must contain at least one letter.");
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError("Password must contain at least one number.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match. Please check again.");
      return;
    }

    setLoading(true);
    try {
      // Update password directly in Supabase
      const { error: updateErr } = await supabase.auth.updateUser({ password });
      if (updateErr) throw updateErr;

      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      const e = err as Error;
      setError(e.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Success Screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <main className="min-h-screen w-full bg-white flex items-center justify-center p-6 font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full p-12 bg-[#FAFAFC] border border-slate-200 rounded-[30px] text-center space-y-6 shadow-sm"
        >
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center border border-green-100">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-black tracking-tight">Password Updated!</h1>
            <p className="text-auth-slate-50 font-medium text-[14px]">
              Your new password has been saved to Supabase. Redirecting to login...
            </p>
          </div>
          <div className="w-8 h-8 border-2 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mt-4" />
        </motion.div>
      </main>
    );
  }

  // ── Reset Form ─────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen w-full bg-white flex items-center justify-center p-6 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px]"
      >
        <div className="flex flex-col gap-2 mb-8">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 mb-2">
            <KeyRound className="w-6 h-6 text-primary-blue" />
          </div>
          <h1 className="text-[32px] font-bold text-black leading-[1.2]">Reset Password</h1>
          <p className="text-[14px] font-medium text-auth-slate-50">
            Create a new password for your XeroxQ account.
          </p>
        </div>

        <form onSubmit={handleReset} className="flex flex-col gap-5">
          {/* New Password */}
          <div className="flex flex-col gap-[5.57px]">
            <label className="text-[12.27px] font-semibold text-auth-slate-90" htmlFor="new-password">
              New Password
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full auth-input pr-12 placeholder:text-auth-slate-20 text-[13px]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-auth-slate-20 hover:text-auth-slate-50 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-[5.57px]">
            <label className="text-[12.27px] font-semibold text-auth-slate-90" htmlFor="confirm-password">
              Confirm Password
            </label>
            <input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              placeholder="Repeat your new password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full auth-input placeholder:text-auth-slate-20 text-[13px]"
            />
          </div>

          {/* Guidelines */}
          <div className="flex items-start gap-2 p-3 bg-blue-50/50 border border-blue-100 rounded-[8px]">
            <div className="w-1.5 h-1.5 rounded-full bg-primary-blue mt-1.5 shrink-0" />
            <p className="text-[11.5px] font-medium text-auth-slate-50 leading-[1.6]">
              Minimum 8 characters with at least one letter and one number.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-xl text-xs border border-red-100 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[44px] btn-auth-primary text-[14px] font-semibold tracking-tight cursor-pointer mt-2"
          >
            {loading ? "Saving to Supabase..." : "Set New Password"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/login")}
            className="w-full h-[38px] text-[13px] font-semibold text-auth-slate-50 hover:text-black transition-colors cursor-pointer"
          >
            Back to login
          </button>
        </form>
      </motion.div>
    </main>
  );
}
