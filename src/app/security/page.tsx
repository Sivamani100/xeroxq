"use client";

import { motion } from "framer-motion";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ShieldCheck, Lock, Cpu, BugPlay, Server, QrCode, ScanEye, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function SecurityPage() {
  const [isReporting, setIsReporting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSubmitReport = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setSubmitting(true);
    setFeedback(null);
    const formData = new FormData(form);

    try {
      const { error } = await supabase.from("security_reports").insert({
        reporter_name: formData.get("name"),
        email: formData.get("email"),
        type: formData.get("type"),
        severity: formData.get("severity"),
        description: formData.get("description"),
        status: "reported"
      });

      if (error) throw error;
      setFeedback({
        type: "success",
        message: "Vulnerability report successfully committed to the security audit mesh. Our team will review this within 24H."
      });
      form.reset();
    } catch (err: any) {
      console.error("Security Report Error:", err);
      const msg = err.message || "Connection failure. Report not dispatched.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const securityLayers = [
    {
      title: "Private Bucket Isolation",
      desc: "Documents are transmitted over TLS 1.3 and stored inside private shop-scoped cloud storage encrypted with AES-256 at rest, accessible only via short-lived signed URLs.",
      icon: Lock,
      bg: "bg-blue-500",
      border: "border-blue-400"
    },
    {
      title: "Ephemeral Auto-Purge",
      desc: "Uploaded print files are transient by design: customers can manually delete their files anytime, and expired print jobs are automatically purged after their 5-minute window.",
      icon: Server,
      bg: "bg-emerald-500",
      border: "border-emerald-400"
    },
    {
      title: "The QR & Session Binding",
      desc: "Uploads bind directly to the target shop and anonymous user session so only the submitting session and authenticated shopkeeper can track or manage the print job.",
      icon: QrCode,
      bg: "bg-purple-500",
      border: "border-purple-400"
    },
    {
      title: "Partner Shop Verification",
      desc: "Every physical print shop partner undergoes platform verification before its routing slug and live queue go public.",
      icon: ScanEye,
      bg: "bg-orange-500",
      border: "border-orange-400"
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#111113] text-[#171717] dark:text-[#EDEDED] flex flex-col font-sans selection:bg-[#FB432C] selection:text-white overflow-x-hidden">
      <SiteHeader />
      
      <main className="flex-1 pt-32 pb-0">
        
        {/* Security Hero */}
        <section className="relative pt-12 pb-16 text-center border-b border-[#171717]/[0.08] dark:border-white/[0.08] overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05] text-[#171717] dark:text-white pointer-events-none" 
               style={{ backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
               
          <div className="max-w-[1280px] mx-auto px-6 relative z-10">
             <motion.div 
               variants={{
                 hidden: { opacity: 0, y: 20 },
                 visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
               }}
               initial="hidden"
               animate="visible"
               className="max-w-4xl mx-auto"
             >
               <div className="inline-flex items-center gap-2.5 px-4 h-8 rounded-full bg-[#F4F4F5] dark:bg-[#232325] border border-[#171717]/[0.10] dark:border-white/[0.10] mb-8">
                 <ShieldCheck className="w-3.5 h-3.5 text-[#171717] dark:text-[#EDEDED]" />
                 <span className="text-[10px] font-bold text-[#171717] dark:text-[#EDEDED] uppercase tracking-[0.2em] leading-none">Architecture Overview</span>
               </div>
               
               <h1 className="text-[40px] md:text-[80px] font-extrabold tracking-tighter text-[#171717] dark:text-[#EDEDED] leading-[0.95] mb-6 uppercase">
                 Security First.
               </h1>
               <p className="text-lg md:text-2xl font-medium text-[#525252] dark:text-[#A1A1A6] leading-relaxed italic max-w-2xl mx-auto">
                 "Our infrastructure is explicitly designed to handle highly sensitive legal, medical, and government prints with absolute zero-knowledge properties."
               </p>
             </motion.div>
          </div>
        </section>

        {/* 4 Security Layers */}
        <section className="py-32 bg-white dark:bg-[#111113] relative z-20">
           <div className="max-w-[1280px] mx-auto px-6">
              <div className="text-center mb-20">
                 <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-[#171717] dark:text-[#EDEDED] mb-4">Defense in Depth</h2>
                 <p className="text-[#525252] dark:text-[#A1A1A6] font-medium max-w-lg mx-auto">The four pillars of the XeroxQ cryptographic standard.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {securityLayers.map((layer, i) => (
                    <motion.div 
                       key={layer.title}
                       initial={{ opacity: 0, y: 30 }}
                       whileInView={{ opacity: 1, y: 0 }}
                       viewport={{ once: true }}
                       transition={{ delay: i * 0.1, duration: 0.6 }}
                       className="group p-8 rounded-[32px] bg-[#171717] dark:bg-[#19191B] border border-white/[0.08] text-white relative overflow-hidden transition-all duration-700 hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/20"
                    >
                       <div className={cn("absolute top-0 right-0 w-32 h-32 opacity-20 blur-[50px] rounded-full group-hover:scale-150 transition-transform duration-1000", layer.bg)} />
                       
                       <div className="relative z-10">
                          <div className={cn("w-14 h-14 rounded-[16px] border flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-500", layer.bg, layer.border)}>
                             <layer.icon className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="text-xl font-black tracking-tighter uppercase leading-none mb-4">{layer.title}</h3>
                          <p className="text-[13px] font-medium text-[#A1A1A6] leading-relaxed">
                             {layer.desc}
                          </p>
                       </div>
                    </motion.div>
                 ))}
              </div>
           </div>
        </section>

        {/* Bug Bounty */}
        <section className="py-24 bg-[#F4F4F5]/70 dark:bg-[#151518] border-y border-[#171717]/[0.08] dark:border-white/[0.08]">
           <div className="max-w-[1000px] mx-auto px-6 text-center">
              <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 viewport={{ once: true }}
                 transition={{ duration: 0.6 }}
              >
                 <div className="w-20 h-20 bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-[24px] flex items-center justify-center mx-auto mb-8 shadow-sm">
                    <BugPlay className="w-10 h-10 text-[#171717] dark:text-[#EDEDED]" />
                 </div>
                 <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-[#171717] dark:text-[#EDEDED] mb-6">Found a vulnerability?</h2>
                 <p className="text-lg text-[#525252] dark:text-[#A1A1A6] font-medium leading-relaxed mb-10 max-w-2xl mx-auto italic">
                    If you are a security researcher, ethical hacker, or cryptographer and have discovered a theoretical exploit in our ephemeral network, we want to hear from you.
                 </p>
                 
                 <div className="inline-flex flex-col sm:flex-row items-center gap-4">
                    <button onClick={() => setIsReporting(true)} className="h-14 px-8 bg-[#171717] dark:bg-[#EDEDED] text-white dark:text-[#111113] hover:bg-[#FB432C] dark:hover:bg-[#FB432C] dark:hover:text-white font-bold text-[12px] uppercase tracking-widest rounded-xl shadow-xl shadow-black/10 transition-all">
                       Submit Report (PGP Key)
                    </button>
                    <a href="#" className="h-14 px-8 bg-white dark:bg-[#19191B] border border-[#171717]/[0.10] dark:border-white/[0.10] text-[#171717] dark:text-[#EDEDED] hover:border-[#171717]/40 dark:hover:border-white/30 font-bold text-[12px] uppercase tracking-widest rounded-xl shadow-sm flex items-center transition-all">
                       View Bounty Payouts
                    </a>
                 </div>
              </motion.div>
           </div>
        </section>

        <Dialog open={isReporting} onOpenChange={(open) => { setIsReporting(open); if (!open) setFeedback(null); }}>
          <DialogContent className="sm:max-w-[500px] bg-white dark:bg-[#19191B] text-[#171717] dark:text-[#EDEDED] rounded-3xl p-8 border border-[#171717]/[0.08] dark:border-white/[0.08] shadow-2xl">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-[#171717] dark:text-[#EDEDED]">Security Disclosure</DialogTitle>
              <DialogDescription className="text-[13px] font-medium text-[#525252] dark:text-[#A1A1A6] italic">
                Report a vulnerability to the XeroxQ security mesh.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitReport} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-[#171717] dark:text-[#EDEDED]">Researcher Name</Label>
                  <Input name="name" required placeholder="Ghost01" className="h-12 bg-[#F4F4F5] dark:bg-[#232325] text-[#171717] dark:text-[#EDEDED] placeholder:text-[#737373] dark:placeholder:text-[#85858B] border-[#171717]/[0.12] dark:border-white/[0.12] rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-[#171717] dark:text-[#EDEDED]">Secure Email</Label>
                  <Input name="email" type="email" required placeholder="alias@proton.me" className="h-12 bg-[#F4F4F5] dark:bg-[#232325] text-[#171717] dark:text-[#EDEDED] placeholder:text-[#737373] dark:placeholder:text-[#85858B] border-[#171717]/[0.12] dark:border-white/[0.12] rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-[#171717] dark:text-[#EDEDED]">Vulnerability Type</Label>
                  <select name="type" className="w-full h-12 bg-[#F4F4F5] dark:bg-[#232325] text-[#171717] dark:text-[#EDEDED] border border-[#171717]/[0.12] dark:border-white/[0.12] rounded-xl px-4 text-sm outline-none" required>
                    <option value="web" className="bg-white dark:bg-[#19191B]">Web Interface</option>
                    <option value="protocol" className="bg-white dark:bg-[#19191B]">Protocol/Auth</option>
                    <option value="api" className="bg-white dark:bg-[#19191B]">API / Backend</option>
                    <option value="node" className="bg-white dark:bg-[#19191B]">Physical Node</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-[#171717] dark:text-[#EDEDED]">Severity</Label>
                  <select name="severity" className="w-full h-12 bg-[#F4F4F5] dark:bg-[#232325] border border-[#171717]/[0.12] dark:border-white/[0.12] rounded-xl px-4 text-sm outline-none font-bold text-red-600 dark:text-red-400" required>
                    <option value="low" className="bg-white dark:bg-[#19191B] text-[#171717] dark:text-[#EDEDED]">Low</option>
                    <option value="medium" className="bg-white dark:bg-[#19191B] text-[#171717] dark:text-[#EDEDED]">Medium</option>
                    <option value="high" className="bg-white dark:bg-[#19191B] text-[#171717] dark:text-[#EDEDED]">High</option>
                    <option value="critical" className="bg-white dark:bg-[#19191B] text-red-600 dark:text-red-400">CRITICAL</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-[#171717] dark:text-[#EDEDED]">Description / PoC</Label>
                <Textarea name="description" required placeholder="Outline the exploit steps and potential impact..." className="min-h-[120px] bg-[#F4F4F5] dark:bg-[#232325] text-[#171717] dark:text-[#EDEDED] placeholder:text-[#737373] dark:placeholder:text-[#85858B] border-[#171717]/[0.12] dark:border-white/[0.12] rounded-xl" />
              </div>

              {feedback && (
                <div
                  role="status"
                  className={cn(
                    "p-3.5 rounded-xl border text-xs font-semibold flex items-start gap-2.5",
                    feedback.type === "success"
                      ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                      : "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400"
                  )}
                >
                  {feedback.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <span>{feedback.message}</span>
                </div>
              )}

              <button 
                type="submit" 
                disabled={submitting}
                className="w-full h-14 bg-[#FB432C] hover:bg-[#E03923] disabled:opacity-60 text-white font-black text-[12px] uppercase tracking-widest rounded-xl shadow-lg transition-all"
              >
                {submitting ? "Dispatching Report..." : "Submit Secure Disclosure"}
              </button>
            </form>
          </DialogContent>
        </Dialog>

      </main>

      <SiteFooter />
    </div>
  );
}
