"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getPublicOrigin } from "@/lib/site-url";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, 
  Lock, 
  AlertCircle,
  CheckCircle2,
  X
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/lib/theme";

// ── Electron bridge type ─────────────────────────────────────────────────────
declare global {
  interface Window {
    electron?: {
      openOAuthUrl?: (url: string) => Promise<{ success: boolean }>;
      onOAuthCallback?: (cb: (data: {
        code?: string | null;
        accessToken?: string | null;
        refreshToken?: string | null;
        error?: string | null;
      }) => void) => () => void;
      openResetPasswordUrl?: (url: string) => Promise<{ success: boolean }>;
    };
  }
}

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/admin");
      } else {
        setCheckingAuth(false);
      }
    }
    checkUser();
  }, [router]);

  // ── Listen for OAuth deep-link callback from Electron ─────────────────────
  useEffect(() => {
    if (!window.electron?.onOAuthCallback) return;

    const cleanup = window.electron.onOAuthCallback(async (data) => {
      try {
        setLoading(true);
        setError(null);

        const { code, accessToken, refreshToken, error: oauthError } = data;

        console.log('[XeroxQ] OAuth callback — code:', code ? 'present' : 'none',
                    '| access:', accessToken ? 'present' : 'none',
                    '| error:', oauthError || 'none');

        if (oauthError) {
          setError("Google sign-in failed. Please try again.");
          setLoading(false);
          return;
        }

        // ── Case 1: Direct tokens from server-side exchange (Recommended) ───────────
        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) throw sessionError;
          router.push("/admin");
          return;
        }

        // ── Case 2: PKCE code fallback (verifier in localStorage) ──
        if (code) {
          const { data: sessionData, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          if (sessionData?.session) {
            router.push("/admin");
            return;
          }
        }

        setError("Google sign-in failed. Please try again.");
        setLoading(false);
      } catch (err) {
        const e = err as Error;
        setError(e.message || "Sign-in failed after OAuth callback.");
        setLoading(false);
      }
    });

    cleanupRef.current = cleanup;
    return () => {
      if (cleanupRef.current) cleanupRef.current();
    };
  }, [router]);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;
      router.push("/admin");
    } catch (err) {
      const e = err as Error;
      setError(e.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'azure') => {
    try {
      setLoading(true);
      setError(null);

      const isElectron = !!(window.electron?.openOAuthUrl);

      if (isElectron) {
        // ── Desktop: get OAuth URL, open in system browser ──────────────────
        // We use signInWithOAuth with skipBrowserRedirect=true to just get the URL
        const oauthBase = getPublicOrigin();

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${oauthBase}/auth/callback?electron=1`,
            skipBrowserRedirect: true,
          },
        });
        if (error) throw error;
        if (!data.url) throw new Error("No OAuth URL returned");
        // Open in the system default browser (Chrome, Edge, etc.)
        await window.electron!.openOAuthUrl!(data.url);
        // Loading stays true — waiting for the deep-link callback
      } else {
        // ── Web: normal OAuth redirect ───────────────────────────────────────
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
      }
    } catch (err) {
      const e = err as Error;
      setError(e.message || `Sign in with ${provider} failed`);
      setLoading(false);
    }
  };

  // ── Forgot Password ────────────────────────────────────────────────────────
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError(null);

    try {
      const isElectron = !!(window.electron);
      const redirectTo = isElectron
        ? `${getPublicOrigin()}/auth/callback?next=/auth/reset-password`
        : `${window.location.origin}/auth/callback?next=/auth/reset-password`;

      // Wrap in a timeout so it never hangs forever if Supabase is unreachable
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out. Please check your connection and try again.")), 15000)
      );

      const resetPromise = supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
        redirectTo,
      });

      const { error } = await Promise.race([resetPromise, timeoutPromise]);

      if (error) throw error;
      setForgotSuccess(true);
    } catch (err) {
      const e = err as Error;
      setForgotError(e.message || "Failed to send reset email. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <main className="h-screen w-full bg-[#FAFAFA] dark:bg-[#111113] flex flex-col lg:flex-row overflow-hidden font-sans relative">
        <div className="w-full lg:w-[630px] shrink-0 flex flex-col justify-center px-8 lg:pl-[180px] lg:pr-[82px] py-12 lg:py-0 relative z-10 bg-[#FAFAFA] dark:bg-[#111113]">
           <div className="w-full lg:w-[378px] flex flex-col gap-[21.03px]">
              <div className="space-y-4">
                 <Skeleton className="w-[200px] h-10" />
                 <Skeleton className="w-[140px] h-4" />
              </div>
              <div className="space-y-8 mt-4">
                 <div className="space-y-3">
                    <Skeleton className="w-16 h-4" />
                    <Skeleton className="w-full h-14 rounded-2xl" />
                 </div>
                 <div className="space-y-3">
                    <Skeleton className="w-16 h-4" />
                    <Skeleton className="w-full h-14 rounded-2xl" />
                 </div>
              </div>
              <Skeleton className="w-full h-14 rounded-2xl mt-4" />
           </div>
        </div>
        <div className="hidden lg:block relative flex-1 bg-[#F4F4F5] dark:bg-[#19191B]">
           <Skeleton className="absolute inset-0 w-full h-full" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen lg:h-screen w-full bg-[#FAFAFA] dark:bg-[#111113] text-[#171717] dark:text-[#EDEDED] flex flex-col lg:flex-row overflow-x-hidden lg:overflow-hidden font-sans relative">
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-30">
        <ThemeToggle compact />
      </div>
      {/* Left Panel - Form */}
      <div className="w-full lg:w-[630px] shrink-0 flex flex-col justify-center px-6 sm:px-8 lg:pl-[140px] xl:pl-[180px] lg:pr-[72px] py-16 lg:py-0 relative z-10 bg-[#FAFAFA] dark:bg-[#111113]">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[378px] mx-auto lg:mx-0 flex flex-col gap-[21px]"
        >
          {/* Header */}
          <div className="flex flex-col gap-1">
            <h1 className="text-[36px] lg:text-[40px] leading-[1.15] font-semibold tracking-tight text-[#171717] dark:text-[#EDEDED]">
              Hey,<br /> Welcome Back!
            </h1>
            <p className="text-[14px] font-medium text-[#525252] dark:text-[#A1A1A6]">
              Sign in to manage your XeroxQ print counter.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-6 w-full">
            <div className="flex flex-col gap-4">
              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-semibold text-[#171717] dark:text-[#EDEDED]" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="shop@example.com"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full auth-input text-[13px]"
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[12.5px] font-semibold text-[#171717] dark:text-[#EDEDED]" htmlFor="password">Password</label>
                  <button
                    type="button"
                    onClick={() => { setShowForgot(true); setForgotEmail(formData.email); setForgotSuccess(false); setForgotError(null); }}
                    className="text-[11.5px] font-semibold text-[#FB432C] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••••••"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full auth-input text-[13px]"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-3.5 bg-[#DC2626]/10 dark:bg-[#E5484D]/15 text-[#DC2626] dark:text-[#E5484D] rounded-xl text-sm font-medium border border-[#DC2626]/20 dark:border-[#E5484D]/25">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-col gap-3">
              <button
                disabled={loading}
                className="w-full h-[44px] btn-auth-primary text-[14px] tracking-tight cursor-pointer"
              >
                {loading ? "Verifying..." : "Login"}
              </button>

              {/* Divider */}
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-[#171717]/[0.10] dark:border-white/[0.10]"></div>
                <span className="flex-shrink mx-4 text-[10px] font-semibold uppercase tracking-wider text-[#737373] dark:text-[#85858B]">or</span>
                <div className="flex-grow border-t border-[#171717]/[0.10] dark:border-white/[0.10]"></div>
              </div>

              {/* Google Sign In */}
              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                disabled={loading}
                className="w-full h-[44px] border border-[#171717]/[0.12] dark:border-white/[0.12] bg-white dark:bg-[#19191B] hover:bg-[#F4F4F5] dark:hover:bg-[#232325] text-[#171717] dark:text-[#EDEDED] font-semibold rounded-[8px] flex items-center justify-center gap-3 transition-colors active:scale-95 text-[14px] tracking-tight cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>{loading ? "Opening browser..." : "Continue with Google"}</span>
              </button>
            </div>

            {/* Sign Up Link */}
            <p className="text-center text-[12.5px] font-medium text-[#525252] dark:text-[#A1A1A6]">
              Don&apos;t have an account?{" "}
              <button type="button" onClick={() => router.push("/register")} className="text-[#FB432C] hover:underline font-semibold cursor-pointer">
                Sign Up here
              </button>
            </p>
          </form>
        </motion.div>
      </div>

      {/* Right Panel */}
      <div className="hidden lg:block relative flex-1 bg-[#F4F4F5] dark:bg-[#19191B]">
        <img
          src="/login-image.png"
          alt="XeroxQ Login"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute left-0 top-0 bottom-0 w-[265px] pointer-events-none dark:hidden"
          style={{ background: "linear-gradient(270deg, rgba(250, 250, 250, 0) 35%, #FAFAFA 100%)" }}
        />
        <div
          className="hidden dark:block absolute left-0 top-0 bottom-0 w-[265px] pointer-events-none"
          style={{ background: "linear-gradient(270deg, rgba(17, 17, 19, 0) 35%, #111113 100%)" }}
        />
      </div>

      {/* ── Forgot Password Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showForgot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowForgot(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-2xl shadow-2xl p-8 w-full max-w-[420px] relative"
            >
              {/* Close */}
              <button
                onClick={() => setShowForgot(false)}
                className="absolute top-4 right-4 text-[#737373] dark:text-[#85858B] hover:text-[#171717] dark:hover:text-[#EDEDED] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {forgotSuccess ? (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-14 h-14 rounded-full bg-[#16A34A]/10 dark:bg-[#4CC38A]/15 flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7 text-[#16A34A] dark:text-[#4CC38A]" />
                  </div>
                  <h2 className="text-[22px] font-semibold text-[#171717] dark:text-[#EDEDED] text-center">Check your email</h2>
                  <p className="text-[13px] text-[#525252] dark:text-[#A1A1A6] text-center leading-relaxed">
                    We&apos;ve sent a password reset link to <strong className="text-[#171717] dark:text-[#EDEDED]">{forgotEmail}</strong>.
                    Check your inbox and follow the link to reset your password.
                  </p>
                  <button
                    onClick={() => setShowForgot(false)}
                    className="w-full h-[42px] btn-auth-primary text-[14px] mt-2 cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-1 mb-6">
                    <h2 className="text-[24px] font-semibold text-[#171717] dark:text-[#EDEDED]">Forgot password?</h2>
                    <p className="text-[13px] text-[#525252] dark:text-[#A1A1A6] leading-relaxed">
                      Enter your email and we&apos;ll send you a reset link.
                    </p>
                  </div>

                  <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12.5px] font-semibold text-[#171717] dark:text-[#EDEDED]" htmlFor="forgot-email">
                        Email address
                      </label>
                      <input
                        id="forgot-email"
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full auth-input text-[13px]"
                      />
                    </div>

                    {forgotError && (
                      <div className="flex items-center gap-3 p-3 bg-[#DC2626]/10 dark:bg-[#E5484D]/15 text-[#DC2626] dark:text-[#E5484D] rounded-xl text-sm border border-[#DC2626]/20 dark:border-[#E5484D]/25">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{forgotError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full h-[42px] btn-auth-primary text-[14px] cursor-pointer mt-2"
                    >
                      {forgotLoading ? "Sending..." : "Send reset link"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowForgot(false)}
                      className="w-full h-[38px] text-[13px] font-semibold text-[#525252] dark:text-[#A1A1A6] hover:text-[#171717] dark:hover:text-[#EDEDED] transition-colors cursor-pointer"
                    >
                      Back to login
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
