"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Lock } from "lucide-react";
import { ThemeToggle } from "@/lib/theme";

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

    if (password.length < 8) {
      setIsError(true);
      setMessage("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setIsError(true);
      setMessage("Password must include at least one letter and one number.");
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
      <main className="min-h-screen w-full bg-[#FAFAFA] dark:bg-[#111113] text-[#171717] dark:text-[#EDEDED] flex items-center justify-center p-6 font-sans relative">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <ThemeToggle compact />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full p-10 bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-[20px] text-center space-y-6 shadow-[0_1px_2px_rgba(17,17,19,0.04)]"
        >
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-[#16A34A]/10 dark:bg-[#4CC38A]/15 rounded-full flex items-center justify-center border border-[#16A34A]/20 dark:border-[#4CC38A]/25">
              <CheckCircle2 className="w-8 h-8 text-[#16A34A] dark:text-[#4CC38A]" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-[#171717] dark:text-[#EDEDED] tracking-tight">Password Updated!</h1>
            <p className="text-[#525252] dark:text-[#A1A1A6] font-medium text-[14px]">
              {message}
            </p>
          </div>
          <div className="w-8 h-8 border-2 border-[#FB432C] border-t-transparent rounded-full animate-spin mx-auto mt-4" />
        </motion.div>
      </main>
    );
  }

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
        <div className="flex flex-col gap-2 mb-8">
          <div className="w-12 h-12 bg-[#FB432C]/10 rounded-2xl flex items-center justify-center border border-[#FB432C]/20 mb-2">
            <Lock className="w-6 h-6 text-[#FB432C]" />
          </div>
          <h1 className="text-[28px] font-semibold text-[#171717] dark:text-[#EDEDED] leading-[1.2] tracking-tight">
            Create New Password
          </h1>
          <p className="text-[14px] text-[#525252] dark:text-[#A1A1A6]">
            Please enter your new password below.
          </p>
        </div>

        <form onSubmit={handlePasswordUpdate} className="flex flex-col gap-5">
          {/* New Password Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-semibold text-[#171717] dark:text-[#EDEDED]" htmlFor="password">
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
                className="w-full auth-input pr-12 text-[13px]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#737373] dark:text-[#85858B] hover:text-[#171717] dark:hover:text-[#EDEDED] transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-semibold text-[#171717] dark:text-[#EDEDED]" htmlFor="confirm-password">
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
              className="w-full auth-input text-[13px]"
            />
          </div>

          {/* Error Banner */}
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
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </motion.div>
    </main>
  );
}
