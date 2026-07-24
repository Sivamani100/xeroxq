"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Eye, EyeOff, XCircle } from "lucide-react";

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword]       = useState("");
  const [confirm, setConfirm]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [success, setSuccess]         = useState(false);

  // "checking" — verifying the link | "ready" — show form | "expired" — bad link
  const [status, setStatus] = useState<"checking" | "ready" | "expired">("checking");

  useEffect(() => {
    async function init() {
      // ── 1. Check for error query params Supabase sends on invalid/expired links
      const urlError = searchParams.get("error");
      const errorCode = searchParams.get("error_code");
      if (urlError || errorCode) {
        setStatus("expired");
        return;
      }

      // ── 2. Supabase JS client auto-processes the hash fragment on init.
      //        So getSession() is the most reliable check — no event waiting needed.
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setStatus("ready");
        return;
      }

      // ── 3. If no session yet, try to set it from the hash fragment manually.
      //        e.g. #access_token=...&refresh_token=...&type=recovery
      const hash = window.location.hash;
      if (hash) {
        // Remove leading # and parse as URLSearchParams
        const params = new URLSearchParams(hash.slice(1));
        const accessToken  = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        const type         = params.get("type");

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!error) {
            setStatus("ready");
            return;
          }
        }

        // Hash exists but has an error param
        if (params.get("error") || params.get("error_code")) {
          setStatus("expired");
          return;
        }
      }

      // ── 4. Listen for PASSWORD_RECOVERY event as a fallback.
      //        Set a 10s timeout so we don't spin forever.
      const timer = setTimeout(() => setStatus("expired"), 10000);

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event) => {
          if (event === "PASSWORD_RECOVERY") {
            clearTimeout(timer);
            setStatus("ready");
          }
        }
      );

      return () => {
        clearTimeout(timer);
        subscription.unsubscribe();
      };
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (!/[a-zA-Z]/.test(password)) { setError("Password must contain at least one letter."); return; }
    if (!/[0-9]/.test(password)) { setError("Password must contain at least one number."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      const e = err as Error;
      setError(e.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <main className="min-h-screen w-full bg-white flex items-center justify-center p-6 font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full p-12 bg-[#FAFAFC] border border-slate-200 rounded-[30px] text-center space-y-6"
        >
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center border border-green-100">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-black tracking-tight">Password Updated!</h1>
            <p className="text-auth-slate-50 font-medium">
              Your password has been reset. Redirecting to login...
            </p>
          </div>
          <div className="w-8 h-8 border-2 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto" />
        </motion.div>
      </main>
    );
  }

  // ── Expired / invalid link screen ──────────────────────────────────────────
  if (status === "expired") {
    return (
      <main className="min-h-screen w-full bg-white flex items-center justify-center p-6 font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full p-12 bg-[#FAFAFC] border border-slate-200 rounded-[30px] text-center space-y-6"
        >
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center border border-red-100">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-black">Link Expired</h1>
            <p className="text-auth-slate-50 font-medium text-[14px] leading-relaxed">
              This password reset link has expired or is invalid. Reset links are valid for 1 hour.
            </p>
          </div>
          <button
            onClick={() => router.push("/login")}
            className="w-full h-[42px] btn-auth-primary text-[14px] cursor-pointer"
          >
            Back to Login
          </button>
          <p className="text-[12px] text-auth-slate-20">
            You can request a new reset link from the login page.
          </p>
        </motion.div>
      </main>
    );
  }

  // ── Verifying screen ───────────────────────────────────────────────────────
  if (status === "checking") {
    return (
      <main className="min-h-screen w-full bg-white flex items-center justify-center p-6 font-sans">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-md w-full p-12 bg-[#FAFAFC] border border-slate-200 rounded-[30px] text-center space-y-6"
        >
          <div className="w-10 h-10 border-2 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-auth-slate-50 font-medium text-[14px]">Verifying reset link...</p>
        </motion.div>
      </main>
    );
  }

  // ── Reset form ─────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen w-full bg-white flex items-center justify-center p-6 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px]"
      >
        <div className="flex flex-col gap-[1.75px] mb-8">
          <h1 className="text-[36px] font-bold text-black leading-[1.2]">Reset Password</h1>
          <p className="text-[14px] font-medium text-auth-slate-50">
            Choose a new secure password for your account.
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
                className="w-full auth-input pr-12 placeholder:text-auth-slate-20 text-[12.27px]"
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
              className="w-full auth-input placeholder:text-auth-slate-20 text-[12.27px]"
            />
          </div>

          {/* Hint */}
          <div className="flex items-start gap-2 p-3 bg-blue-50/50 border border-blue-100 rounded-[5.57px]">
            <div className="w-1.5 h-1.5 rounded-full bg-primary-blue mt-1.5 shrink-0" />
            <p className="text-[11px] font-medium text-auth-slate-50 leading-[1.6]">
              Minimum 8 characters with at least one letter and one number.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[42.03px] btn-auth-primary text-[14.02px] tracking-tight cursor-pointer mt-2"
          >
            {loading ? "Updating..." : "Set New Password"}
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
