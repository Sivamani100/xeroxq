"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { 
  Printer, 
  Mail, 
  Lock, 
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
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
          {/* Header Frame 2 */}
          <div className="flex flex-col gap-[1.75px]">
            <h1 className="text-[40px] lg:text-[42.06px] leading-[1.2] font-bold text-black">
              Hey,<br /> Welcome Back!
            </h1>
            <p className="text-[14px] lg:text-[14.02px] font-medium text-auth-slate-50 tracking-[0.01em]">
              We are very happy to see you back!
            </p>
          </div>

          {/* Form Frame 16 */}
          <form onSubmit={handleLogin} className="flex flex-col gap-[31.54px] w-[377.86px]">
            {/* Frame 14 - Inputs */}
            <div className="flex flex-col gap-[16.72px]">
              {/* Frame 12 - Email */}
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

              {/* Frame 13 - Password */}
              <div className="flex flex-col gap-[5.57px]">
                <label className="text-[12.27px] font-semibold text-auth-slate-90 leading-[1.5]" htmlFor="password">Password</label>
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

            {/* Checkboxes Frame 11 */}
            <div className="flex flex-col gap-[10.51px]">
              <div className="flex items-start gap-[7.01px]">
                <div className="pt-1">
                  <input type="checkbox" className="w-[12.27px] h-[12.27px] rounded-[1.39px] border-auth-slate-20 bg-input-bg accent-primary-blue cursor-pointer" required />
                </div>
                <p className="text-[12.27px] font-medium text-auth-slate-50 leading-[1.8]">
                  By signing up, you are creating a XeroxQ account, and you agree to XeroxQ’s <span className="text-primary-blue font-[500]">Terms of Use</span> and <span className="text-primary-blue font-[500]">Privacy Policy.</span>
                </p>
              </div>
              <div className="flex items-center gap-[7.01px]">
                <input type="checkbox" className="w-[12.27px] h-[12.27px] rounded-[1.39px] border-auth-slate-20 bg-input-bg accent-primary-blue cursor-pointer" />
                <p className="text-[12.27px] font-medium text-auth-slate-50 leading-[1.8]">
                  Remember Me as <span className="text-primary-blue font-[500]">User</span> of <span className="text-primary-blue font-[500]">XeroxQ Community.</span>
                </p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 mt-[-10px]">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            {/* Frame 22 - Login Block */}
            <div className="flex flex-col gap-[12.27px]">
              {/* Frame 17 - Login Button */}
              <button
                disabled={loading}
                className="w-full h-[42.03px] btn-auth-primary text-[14.02px] tracking-tight"
              >
                {loading ? "Verifying..." : "Login"}
              </button>


            </div>
            
            {/* Sign Up Link */}
            <p className="mt-[-5px] text-center text-[12.27px] font-medium text-auth-slate-50">
              Don’t have account? <button type="button" onClick={() => router.push("/register")} className="text-primary-blue hover:underline font-semibold leading-[1.5]">Sign Up here!</button>
            </p>
          </form>
        </motion.div>
      </div>

      {/* Right Panel - Image */}
      <div className="hidden lg:block relative flex-1 bg-[#F8FAFC]">
        <img 
          src="/login-image.png"
          alt="Commit Community Login"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Subtle Fade Overlay Gradient (Rectangle 3 / 4 style overlaying left boundary) */}
        <div 
          className="absolute left-[-26px] xl:left-[-50px] top-0 bottom-0 w-[265px] pointer-events-none"
          style={{ background: "linear-gradient(270deg, rgba(255, 255, 255, 0) 38.63%, #FFFFFF 100%)" }}
        />
      </div>
    </main>
  );
}
