"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { 
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Register() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      if (error) throw error;
    } catch (err) {
      const e = err as Error;
      setError(e.message || `Social login via ${provider} failed`);
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <main className="h-screen w-full bg-white flex flex-col lg:flex-row overflow-hidden font-sans relative">
        <div className="w-full lg:w-[630px] shrink-0 flex flex-col justify-center px-8 lg:pl-[180px] lg:pr-[82px] py-12 lg:py-0 relative z-10 bg-white">
           <div className="w-full lg:w-[378px]">
              <SkeletonLoader type="form" />
           </div>
        </div>
        <div className="hidden lg:block relative flex-1 bg-[#F8FAFC]">
           <Skeleton className="absolute inset-0 w-full h-full" />
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="min-h-screen w-full bg-white flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full p-12 bg-[#FAFAFC] border border-slate-20 rounded-[30px] text-center space-y-8"
        >
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center border border-green-100">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-black tracking-tight">Welcome Aboard!</h1>
            <p className="text-auth-slate-50 font-medium">Account created successfully. Redirecting to login...</p>
          </div>
          <div className="pt-4">
             <div className="w-8 h-8 border-2 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </motion.div>
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
          className="w-full lg:w-[368px] flex flex-col gap-[21.03px]"
        >
          {/* Header */}
          <div className="flex flex-col gap-[1.75px]">
            <h1 className="text-[40px] lg:text-[42.06px] leading-[1.2] font-bold text-black whitespace-nowrap">
              Create Account
            </h1>
            <p className="text-[14px] lg:text-[14.02px] font-medium text-auth-slate-50 tracking-[0.01em]">
              Sign up to start your print shop network.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} className="flex flex-col gap-[21.54px] w-full max-w-[368px]">
            <div className="flex flex-col gap-[16.72px]">

              {/* Email */}
              <div className="flex flex-col gap-[5.57px]">
                <label className="text-[12.27px] font-semibold text-auth-slate-90 leading-[1.5]" htmlFor="email">Work Email</label>
                <input 
                  id="email"
                  type="email" 
                  placeholder="office@example.com"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full auth-input placeholder:text-auth-slate-20 text-[12.27px]"
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-[5.57px]">
                <label className="text-[12.27px] font-semibold text-auth-slate-90 leading-[1.5]" htmlFor="password">Security Password</label>
                <input 
                  id="password"
                  type="password" 
                  placeholder="••••••••••••"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full auth-input placeholder:text-auth-slate-20 text-[12.27px]"
                />
              </div>
            </div>

            {/* Info Note */}
            <div className="flex items-start gap-2 p-3 bg-blue-50/50 border border-blue-100 rounded-[5.57px]">
              <div className="w-1.5 h-1.5 rounded-full bg-primary-blue mt-1.5 shrink-0" />
              <p className="text-[11px] font-medium text-auth-slate-50 leading-[1.6]">
                After creating your account, you&apos;ll set up your shop details from your dashboard.
              </p>
            </div>

            {/* Terms */}
            <div className="flex flex-col gap-[10.51px]">
              <div className="flex items-start gap-[7.01px]">
                <div className="pt-1">
                  <input type="checkbox" className="w-[12.27px] h-[12.27px] rounded-[1.39px] border-auth-slate-20 bg-input-bg accent-primary-blue cursor-pointer" required />
                </div>
                <p className="text-[12.27px] font-medium text-auth-slate-50 leading-[1.8]">
                  By signing up, I agree to XeroxQ&apos;s <span className="text-primary-blue font-[500]">Terms of Use</span> and <span className="text-primary-blue font-[500]">Privacy Policy.</span>
                </p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 mt-[-5px]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-[12.27px]">
              <button
                disabled={loading}
                className="w-full h-[42.03px] btn-auth-primary text-[14.02px] tracking-tight"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>


            </div>
            
            {/* Sign In Link */}
            <p className="mt-[-5px] text-center text-[12.27px] font-medium text-auth-slate-50">
              Already have a shop? <button type="button" onClick={() => router.push("/login")} className="text-primary-blue hover:underline font-semibold leading-[1.5]">Sign In here!</button>
            </p>
          </form>
        </motion.div>
      </div>

      {/* Right Panel - Image */}
      <div className="hidden lg:block relative flex-1 bg-[#F8FAFC]">
        <img 
          src="/login-image.png"
          alt="Premium Cloud Node Services"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div 
          className="absolute left-0 top-0 bottom-0 w-[265px]"
          style={{ background: 'linear-gradient(270deg, rgba(255, 255, 255, 0) 38.63%, #FFFFFF 100%)' }}
        />
        <div 
          className="absolute left-0 top-0 bottom-0 w-[265px]"
          style={{ background: 'linear-gradient(270deg, rgba(255, 255, 255, 0) 0%, #FFFFFF 100%)' }}
        />
      </div>
    </main>
  );
}
