"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getPublicOrigin } from "@/lib/site-url";
import { motion } from "framer-motion";
import { 
  CheckCircle2,
  AlertCircle
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

export default function Register() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
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
    return () => { if (cleanupRef.current) cleanupRef.current(); };
  }, [router]);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // ── Client-side Password Strength Validation ──────────────────────────
    const pwd = formData.password;
    if (pwd.length < 8) {
      setError("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }
    if (!/[a-zA-Z]/.test(pwd)) {
      setError("Password must contain at least one letter.");
      setLoading(false);
      return;
    }
    if (!/[0-9]/.test(pwd)) {
      setError("Password must contain at least one number.");
      setLoading(false);
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Signup failed");

      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      // Generic error — don't leak whether the email already exists
      const e = err as Error;
      setError(e.message || "Registration failed. Please try again.");
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
        await window.electron!.openOAuthUrl!(data.url);
        // Loading stays true — waiting for the deep-link callback
      } else {
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

  if (checkingAuth) {
    return (
      <main className="h-screen w-full bg-[#FAFAFA] dark:bg-[#111113] flex flex-col lg:flex-row overflow-hidden font-sans relative">
        <div className="w-full lg:w-[630px] shrink-0 flex flex-col justify-center px-8 lg:pl-[180px] lg:pr-[82px] py-12 lg:py-0 relative z-10 bg-[#FAFAFA] dark:bg-[#111113]">
           <div className="w-full lg:w-[378px] flex flex-col gap-[21.03px]">
              <div className="space-y-4">
                 <Skeleton className="w-[220px] h-10" />
                 <Skeleton className="w-[160px] h-4" />
              </div>
              <div className="space-y-6 mt-4">
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

  if (success) {
    return (
      <main className="min-h-screen w-full bg-[#FAFAFA] dark:bg-[#111113] text-[#171717] dark:text-[#EDEDED] flex items-center justify-center p-6 relative">
        <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-30">
          <ThemeToggle compact />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full p-10 bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-[24px] text-center space-y-8 shadow-[0_1px_2px_rgba(17,17,19,0.04)]"
        >
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-[#16A34A]/10 dark:bg-[#4CC38A]/15 rounded-full flex items-center justify-center border border-[#16A34A]/20 dark:border-[#4CC38A]/25">
              <CheckCircle2 className="w-10 h-10 text-[#16A34A] dark:text-[#4CC38A]" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-[#171717] dark:text-[#EDEDED] tracking-tight">Welcome Aboard!</h1>
            <p className="text-[#525252] dark:text-[#A1A1A6] font-medium">Account created successfully. Redirecting to login...</p>
          </div>
          <div className="pt-4">
             <div className="w-8 h-8 border-2 border-[#FB432C] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </motion.div>
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
          className="w-full max-w-[368px] mx-auto lg:mx-0 flex flex-col gap-[21px]"
        >
          {/* Header */}
          <div className="flex flex-col gap-1">
            <h1 className="text-[36px] lg:text-[40px] leading-[1.15] font-semibold tracking-tight text-[#171717] dark:text-[#EDEDED]">
              Create Account
            </h1>
            <p className="text-[14px] font-medium text-[#525252] dark:text-[#A1A1A6]">
              Sign up to start your print shop network.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} className="flex flex-col gap-5 w-full">
            <div className="flex flex-col gap-4">

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-semibold text-[#171717] dark:text-[#EDEDED]" htmlFor="email">Work Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="office@example.com"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full auth-input text-[13px]"
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-semibold text-[#171717] dark:text-[#EDEDED]" htmlFor="password">Security Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••••••"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full auth-input text-[13px]"
                />
              </div>
            </div>

            {/* Info Note */}
            <div className="flex items-start gap-2.5 p-3 bg-[#F4F4F5] dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FB432C] mt-1.5 shrink-0" />
              <p className="text-[11.5px] font-medium text-[#525252] dark:text-[#A1A1A6] leading-[1.55]">
                After creating your account, you&apos;ll set up your shop details from your dashboard.
              </p>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2">
              <div className="pt-1">
                <input type="checkbox" className="w-3.5 h-3.5 rounded border-[#171717]/25 dark:border-white/25 accent-[#FB432C] cursor-pointer" required />
              </div>
              <p className="text-[12.27px] font-medium text-[#525252] dark:text-[#A1A1A6] leading-[1.7]">
                By signing up, I agree to XeroxQ&apos;s{" "}
                <button type="button" onClick={() => router.push("/terms")} className="text-[#FB432C] font-medium hover:underline">
                  Terms of Use
                </button>{" "}
                and{" "}
                <button type="button" onClick={() => router.push("/privacy")} className="text-[#FB432C] font-medium hover:underline">
                  Privacy Policy
                </button>.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-3 bg-[#DC2626]/10 dark:bg-[#E5484D]/15 text-[#DC2626] dark:text-[#E5484D] rounded-xl text-sm font-medium border border-[#DC2626]/20 dark:border-[#E5484D]/25">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                disabled={loading}
                className="w-full h-[44px] btn-auth-primary text-[14px] tracking-tight cursor-pointer"
              >
                {loading ? "Creating Account..." : "Create Account"}
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
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{loading ? "Opening browser..." : "Continue with Google"}</span>
              </button>
            </div>

            {/* Sign In Link */}
            <p className="text-center text-[12.5px] font-medium text-[#525252] dark:text-[#A1A1A6]">
              Already have a shop?{" "}
              <button type="button" onClick={() => router.push("/login")} className="text-[#FB432C] hover:underline font-semibold cursor-pointer">
                Sign In here
              </button>
            </p>
          </form>
        </motion.div>
      </div>

      {/* Right Panel - Image */}
      <div className="hidden lg:block relative flex-1 bg-[#F4F4F5] dark:bg-[#19191B]">
        <img
          src="/login-image.png"
          alt="XeroxQ Cloud Node Services"
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
    </main>
  );
}
