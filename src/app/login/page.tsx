"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, 
  Lock, 
  AlertCircle,
  CheckCircle2,
  X
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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

        // ── Case 1: PKCE code — exchange client-side (verifier is in localStorage) ──
        if (code) {
          const { data: sessionData, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          if (sessionData?.session) {
            router.push("/admin");
            return;
          }
          throw new Error("No session returned from code exchange.");
        }

        // ── Case 2: Direct tokens (fallback) ───────────────────────────────
        if (!accessToken || !refreshToken) {
          setError("Google sign-in failed. Please try again.");
          setLoading(false);
          return;
        }
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) throw sessionError;
        router.push("/admin");
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
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            // Point back to our Next.js callback with ?electron=1 so it knows
            // to redirect via xeroxq:// deep link instead of web redirect
            redirectTo: `http://127.0.0.1:3000/auth/callback?electron=1`,
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
      // In Electron: don't pass redirectTo — let Supabase use the configured Site URL
      // (https://xeroxq.arkio.in/auth/reset-password). Passing 127.0.0.1 would be
      // rejected as an unauthorized redirect URL by Supabase.
      // In web: use the current origin so it works both in dev and production.
      const redirectTo = isElectron
        ? `https://xeroxq.arkio.in/auth/reset-password`
        : `${window.location.origin}/auth/reset-password`;

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
      <main className="h-screen w-full bg-white flex flex-col lg:flex-row overflow-hidden font-sans relative">
        <div className="w-full lg:w-[630px] shrink-0 flex flex-col justify-center px-8 lg:pl-[180px] lg:pr-[82px] py-12 lg:py-0 relative z-10 bg-white">
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
        <div className="hidden lg:block relative flex-1 bg-[#F8FAFC]">
           <Skeleton className="absolute inset-0 w-full h-full" />
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen w-full bg-white flex flex-col lg:flex-row overflow-hidden font-sans relative">
      {/* Left Panel - Form */}
      <div className="w-full lg:w-[630px] shrink-0 flex flex-col justify-center px-8 lg:pl-[180px] lg:pr-[82px] py-12 lg:py-0 relative z-10 bg-white">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full lg:w-[378px] flex flex-col gap-[21.03px]"
        >
          {/* Header */}
          <div className="flex flex-col gap-[1.75px]">
            <h1 className="text-[40px] lg:text-[42.06px] leading-[1.2] font-bold text-black">
              Hey,<br /> Welcome Back!
            </h1>
            <p className="text-[14px] lg:text-[14.02px] font-medium text-auth-slate-50 tracking-[0.01em]">
              We are very happy to see you back!
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-[31.54px] w-[377.86px]">
            <div className="flex flex-col gap-[16.72px]">
              {/* Email */}
              <div className="flex flex-col gap-[5.57px]">
                <label className="text-[12.27px] font-semibold text-auth-slate-90 leading-[1.5]" htmlFor="email">Email</label>
                <input 
                  id="email"
                  type="email" 
                  placeholder="commitcommunity@gmail.com"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full auth-input placeholder:text-auth-slate-20 text-[12.27px]"
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-[5.57px]">
                <div className="flex items-center justify-between">
                  <label className="text-[12.27px] font-semibold text-auth-slate-90 leading-[1.5]" htmlFor="password">Password</label>
                  <button
                    type="button"
                    onClick={() => { setShowForgot(true); setForgotEmail(formData.email); setForgotSuccess(false); setForgotError(null); }}
                    className="text-[11px] font-semibold text-primary-blue hover:underline cursor-pointer"
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
                  className="w-full auth-input placeholder:text-auth-slate-20 text-[12.27px]"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 mt-[-10px]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-col gap-[12.27px]">
              <button
                disabled={loading}
                className="w-full h-[42.03px] btn-auth-primary text-[14.02px] tracking-tight cursor-pointer"
              >
                {loading ? "Verifying..." : "Login"}
              </button>

              {/* Divider */}
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-4 text-[10px] font-bold uppercase tracking-wider text-auth-slate-50">or</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Google Sign In */}
              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                disabled={loading}
                className="w-full h-[42.03px] border border-slate-200 hover:bg-slate-50 text-black font-semibold rounded-[5.57px] flex items-center justify-center gap-3 transition-all active:scale-95 text-[14.02px] tracking-tight bg-white cursor-pointer"
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
            <p className="mt-[-5px] text-center text-[12.27px] font-medium text-auth-slate-50">
              Don't have account? <button type="button" onClick={() => router.push("/register")} className="text-primary-blue hover:underline font-semibold leading-[1.5] cursor-pointer">Sign Up here!</button>
            </p>
          </form>
        </motion.div>
      </div>

      {/* Right Panel */}
      <div className="hidden lg:block relative flex-1 bg-[#F8FAFC]">
        <img 
          src="/login-image.png"
          alt="XeroxQ Login"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div 
          className="absolute left-[-26px] xl:left-[-50px] top-0 bottom-0 w-[265px] pointer-events-none"
          style={{ background: "linear-gradient(270deg, rgba(255, 255, 255, 0) 38.63%, #FFFFFF 100%)" }}
        />
      </div>

      {/* ── Forgot Password Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showForgot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowForgot(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-[420px] relative"
            >
              {/* Close */}
              <button
                onClick={() => setShowForgot(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {forgotSuccess ? (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7 text-green-500" />
                  </div>
                  <h2 className="text-[22px] font-bold text-black text-center">Check your email</h2>
                  <p className="text-[13px] text-auth-slate-50 text-center leading-relaxed">
                    We've sent a password reset link to <strong>{forgotEmail}</strong>. 
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
                    <h2 className="text-[26px] font-bold text-black">Forgot password?</h2>
                    <p className="text-[13px] text-auth-slate-50 leading-relaxed">
                      Enter your email and we'll send you a reset link.
                    </p>
                  </div>

                  <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-[5.57px]">
                      <label className="text-[12.27px] font-semibold text-auth-slate-90" htmlFor="forgot-email">
                        Email address
                      </label>
                      <input
                        id="forgot-email"
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full auth-input placeholder:text-auth-slate-20 text-[12.27px]"
                      />
                    </div>

                    {forgotError && (
                      <div className="flex items-center gap-3 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
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
                      className="w-full h-[38px] text-[13px] font-semibold text-auth-slate-50 hover:text-black transition-colors cursor-pointer"
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
