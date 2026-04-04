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

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Signup failed");

      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err: any) {
      setError(err.message || "An error occurred during registration");
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
    } catch (err: any) {
      setError(err.message || `Social login via ${provider} failed`);
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <main className="h-screen w-full bg-white flex flex-col lg:flex-row overflow-hidden font-sans relative">
        <div className="w-full lg:w-[630px] shrink-0 flex flex-col justify-center px-8 lg:pl-[180px] lg:pr-[82px] py-12 lg:py-0 relative z-10 bg-white">
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

              {/* OR Divider */}
              <div className="flex items-center gap-[7.01px] h-[19px]">
                <div className="flex-1 border-t-[0.7px] border-auth-slate-50" />
                <span className="text-[10.51px] font-medium text-auth-slate-50">OR</span>
                <div className="flex-1 border-t-[0.7px] border-auth-slate-50" />
              </div>

              {/* Social Buttons */}
              <div className="flex flex-row justify-center gap-[14.02px]">
                <button 
                  type="button" 
                  disabled={loading}
                  onClick={() => handleSocialLogin('google')}
                  className="flex-1 h-[46.79px] btn-auth-social text-auth-slate-50 font-medium text-[12.27px] whitespace-nowrap !px-2 lg:!px-1 xl:!px-2 !gap-1 hover:bg-black/5 transition-all active:scale-95 shadow-sm"
                >
                  <svg className="w-[20px] h-[20px] shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Sign up with Google
                </button>
                <button 
                  type="button" 
                  disabled={loading}
                  onClick={() => handleSocialLogin('azure')}
                  className="flex-1 h-[46.79px] px-[10px] btn-auth-social text-auth-slate-50 font-medium text-[12.27px] whitespace-nowrap !px-2 lg:!px-1 xl:!px-2 !gap-1 hover:bg-black/5 transition-all active:scale-95 shadow-sm"
                >
                  <svg className="w-[19.08px] h-[19.09px] shrink-0" viewBox="0 0 24 24">
                    <path fill="#F25022" d="M1 1h10v10H1z" />
                    <path fill="#7FBA00" d="M13 1h10v10H13z" />
                    <path fill="#00A4EF" d="M1 13h10v10H1z" />
                    <path fill="#FFB900" d="M13 13h10v10H13z" />
                  </svg>
                  Sign up with Microsoft
                </button>
              </div>
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
