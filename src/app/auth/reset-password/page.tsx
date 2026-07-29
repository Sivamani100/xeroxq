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
    let isMounted = true;

    async function init() {
      // ── 1. Check for explicit error query params from Supabase
      const urlError = searchParams.get("error");
      const errorCode = searchParams.get("error_code");
      const errorDescription = searchParams.get("error_description");
      if (urlError || errorCode) {
        if (isMounted) {
          setError(errorDescription || "This password reset link has expired or is invalid.");
          setStatus("expired");
        }
        return;
      }

      // Read hash fragment or query params
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      const hashParams = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
      const queryCode = searchParams.get("code");
      const queryTokenHash = searchParams.get("token_hash");
      const queryType = searchParams.get("type");

      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const hashType = hashParams.get("type");

      const isRecoveryLink =
        !!(queryCode || queryTokenHash || accessToken || queryType === "recovery" || hashType === "recovery");

      // ── 2. Check for PKCE Authorization Code (?code=...)
      if (queryCode) {
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(queryCode);
          if (error) {
            console.warn("[ResetPassword] PKCE exchange error:", error.message);
            if (isMounted) {
              setError(error.message || "Invalid or expired reset code.");
              setStatus("expired");
            }
            return;
          }
          if (data?.session && isMounted) {
            setStatus("ready");
            return;
          }
        } catch (e) {
          console.warn("[ResetPassword] PKCE exception:", e);
        }
      }

      // ── 3. Check for OTP Recovery Token (?token_hash=...&type=recovery)
      if (queryTokenHash && (queryType === "recovery" || !queryType)) {
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: queryTokenHash,
            type: "recovery",
          });
          if (error) {
            console.warn("[ResetPassword] OTP verify error:", error.message);
            if (isMounted) {
              setError(error.message || "Invalid or expired recovery token.");
              setStatus("expired");
            }
            return;
          }
          if (data?.session && isMounted) {
            setStatus("ready");
            return;
          }
        } catch (e) {
          console.warn("[ResetPassword] OTP exception:", e);
        }
      }

      // ── 4. Check for Hash Fragment (#access_token=...&refresh_token=...)
      if (accessToken && refreshToken) {
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            console.warn("[ResetPassword] setSession error:", error.message);
            if (isMounted) {
              setError(error.message || "Invalid or expired session token.");
              setStatus("expired");
            }
            return;
          }
          if (data?.session && isMounted) {
            setStatus("ready");
            return;
          }
        } catch (e) {
          console.warn("[ResetPassword] setSession exception:", e);
        }
      }

      // ── 5. Check if session already exists
      const { data: { session } } = await supabase.auth.getSession();
      if (session && isMounted) {
        setStatus("ready");
        return;
      }

      // ── 6. Listen for auth state changes (PASSWORD_RECOVERY or SIGNED_IN)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, currentSession) => {
          if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || currentSession) && isMounted) {
            setStatus("ready");
          }
        }
      );

      // If URL has no recovery tokens and no session exists, mark expired
      if (!isRecoveryLink && !session && isMounted) {
        setStatus("expired");
      }

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
