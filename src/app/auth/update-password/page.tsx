"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Lock } from "lucide-react";

export default function UpdatePassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const router = useRouter();

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setIsError(false);

    if (password.length < 6) {
      setIsError(true);
      setMessage("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      setIsError(true);
      setMessage("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setIsError(true);
        setMessage(`Error: ${error.message}`);
      } else {
        setSuccess(true);
        setMessage("Password updated successfully! Redirecting to login...");
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    } catch (err) {
      const e = err as Error;
      setIsError(true);
      setMessage(e.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen w-full bg-white flex items-center justify-center p-6 font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full p-10 bg-[#FAFAFC] border border-slate-200 rounded-[24px] text-center space-y-6 shadow-sm"
        >
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center border border-green-100">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-black tracking-tight">Password Updated!</h1>
            <p className="text-auth-slate-50 font-medium text-[14px]">
              {message}
            </p>
          </div>
          <div className="w-8 h-8 border-2 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mt-4" />
        </motion.div>
      </main>
    );
  }

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
            <Lock className="w-6 h-6 text-primary-blue" />
          </div>
          <h1 className="text-[32px] font-bold text-black leading-[1.2]">Create New Password</h1>
          <p className="text-[14px] font-medium text-auth-slate-50">
            Please enter your new password below.
          </p>
        </div>

        <form onSubmit={handlePasswordUpdate} className="flex flex-col gap-5">
          {/* New Password Input */}
          <div className="flex flex-col gap-[5.57px]">
            <label className="text-[12.27px] font-semibold text-auth-slate-90" htmlFor="password">
              New Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
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

          {/* Confirm Password Input */}
          <div className="flex flex-col gap-[5.57px]">
            <label className="text-[12.27px] font-semibold text-auth-slate-90" htmlFor="confirm-password">
              Confirm New Password
            </label>
            <input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full auth-input placeholder:text-auth-slate-20 text-[13px]"
            />
          </div>

          {/* Error Banner */}
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
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </motion.div>
    </main>
  );
}
