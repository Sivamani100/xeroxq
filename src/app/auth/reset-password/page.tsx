"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Mail, KeyRound } from "lucide-react";

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword]         = useState("");
  const [confirm, setConfirm]           = useState("");
  const [showPassword, setShowPassword]   = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [success, setSuccess]           = useState(false);

  // Email resend state if session is missing
  const [resendEmail, setResendEmail]   = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError]   = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      // 1. Check for query parameters (PKCE code or OTP token)
      const queryCode = searchParams.get("code");
      const queryTokenHash = searchParams.get("token_hash");
      const queryType = searchParams.get("type");

      // Read hash parameters
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      const hashParams = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      // 2. PKCE Exchange (?code=...)
      if (queryCode) {
        try {
          await supabase.auth.exchangeCodeForSession(queryCode);
        } catch (e) {
          console.warn("[ResetPassword] PKCE exchange handled:", e);
        }
      }

      // 3. OTP Verification (?token_hash=...)
      if (queryTokenHash && (queryType === "recovery" || !queryType)) {
        try {
          await supabase.auth.verifyOtp({
            token_hash: queryTokenHash,
            type: "recovery",
          });
        } catch (e) {
          console.warn("[ResetPassword] OTP verify handled:", e);
        }
      }

      // 4. Hash Fragment (#access_token=...)
      if (accessToken && refreshToken) {
        try {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        } catch (e) {
          console.warn("[ResetPassword] setSession handled:", e);
        }
      }

      // 5. Auth State Change Listener
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
    setResendError(null);

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
      // 1. Attempt to update password directly in Supabase
      const { error: updateErr } = await supabase.auth.updateUser({ password });
      if (updateErr) throw updateErr;

      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      const e = err as Error;
      const msg = e.message || "Failed to reset password. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;

    setResendLoading(true);
    setResendError(null);

    try {
      const isElectron = !!(typeof window !== "undefined" && window.electron);
      const redirectTo = isElectron
        ? `https://xeroxq.arkio.in/auth/reset-password`
        : `${window.location.origin}/auth/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(resendEmail.trim(), {
        redirectTo,
      });

      if (error) throw error;
      setResendSuccess(true);
    } catch (err) {
      const e = err as Error;
      setResendError(e.message || "Failed to send reset email.");
    } finally {
      setResendLoading(false);
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
              Your password has been saved in Supabase. Redirecting to login...
            </p>
          </div>
          <div className="w-8 h-8 border-2 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mt-4" />
        </motion.div>
      </main>
    );
  }

  // ── Reset Form (Default Active View) ────────────────────────────────────────
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
            <div className="flex flex-col gap-3 p-4 bg-amber-50 text-amber-900 rounded-xl text-xs border border-amber-200">
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{error}</span>
              </div>

              {/* Inline Quick-Resend Option if session was invalid */}
              <div className="pt-2 border-t border-amber-200/60 flex flex-col gap-2">
                <p className="text-[11px] text-amber-800">
                  If your link has expired, enter your email below to send a brand new link:
                </p>
                {resendSuccess ? (
                  <p className="text-[11px] font-semibold text-green-700">
                    ✓ New reset link sent! Please check your inbox.
                  </p>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="your.email@example.com"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-[12px] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleResendLink}
                      disabled={resendLoading}
                      className="px-3 py-1.5 bg-primary-blue text-white rounded-lg text-[11px] font-medium hover:bg-blue-700 transition-colors"
                    >
                      {resendLoading ? "Sending..." : "Send Link"}
                    </button>
                  </div>
                )}
                {resendError && <p className="text-[11px] text-red-600">{resendError}</p>}
              </div>
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
