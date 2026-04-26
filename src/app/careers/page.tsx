"use client";

import { motion } from "framer-motion";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { 
  ArrowRight, 
  Cpu, 
  ShieldCheck, 
  Globe,
  MapPin,
  Clock,
  Briefcase
} from "lucide-react";

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

export default function CareersPage() {
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [applying, setApplying] = useState(false);

  const jobs = [
    { id: "protocol-engineer", title: "Lead Protocol Engineer", location: "Remote / Global", type: "Full-Time", dept: "Engineering", time: "48H AGO" },
    { id: "security-auditor", title: "Security Auditor", location: "Lisbon, PT", type: "Full-Time", dept: "Security", time: "3D AGO" },
    { id: "growth-lead", title: "Global Mesh Growth Lead", location: "Remote / US", type: "Full-Time", dept: "Growth", time: "1W AGO" },
    { id: "ui-architect", title: "Full-Stack UI Architect", location: "Remote / Global", type: "Full-Time", dept: "Design", time: "1W AGO" }
  ];

  const perks = [
    { title: "Remote Protocol", desc: "Work from anywhere in the global mesh. Distributed teams for a distributed protocol.", icon: Globe },
    { title: "Hardware DNA", desc: "Help build the world's most secure document physicalization standards alongside industry leaders.", icon: ShieldCheck },
    { title: "Founder Model", desc: "Extreme ownership, high-fidelity output, and sub-second decision making are our core principles.", icon: Cpu }
  ];

  const handleApply = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApplying(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const { error } = await supabase.from("job_applications").insert({
        job_id: selectedJob.id,
        full_name: formData.get("name"),
        email: formData.get("email"),
        resume_url: formData.get("resume"),
        portfolio_url: formData.get("portfolio"),
        message: formData.get("message")
      });

      if (error) throw error;
      alert("System Alert: Application successfully committed to the recruitment mesh.");
      setSelectedJob(null);
    } catch (err) {
      console.error("Application Error:", err);
      alert("System Alert: Connection failure. Application not dispatched.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-sans selection:bg-[#FB432C] selection:text-white overflow-x-hidden">
      <SiteHeader />
      
      <main className="flex-1 pt-32 pb-0">
        {/* Careers Hero */}
        <section className="relative pt-12 pb-24 text-center">
          <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 0)', backgroundSize: '40px 40px' }} />
               
          <div className="max-w-[1280px] mx-auto px-6 space-y-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2.5 px-4 h-8 rounded-full bg-black/5 border border-black/5 mx-auto"
            >
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] font-bold tracking-[0.2em] text-black uppercase">Join the Mesh</span>
            </motion.div>
            
            <div className="max-w-4xl mx-auto text-center">
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-[50px] md:text-[80px] font-extrabold text-black tracking-tighter leading-[0.95] uppercase mb-6"
              >
                Physicalize The <br /> Future With Us.
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-lg font-medium text-gray-500 leading-relaxed italic max-w-2xl mx-auto"
              >
                XeroxQ is looking for visionary decentralized hardware engineers and privacy advocates world-wide to scale the secure printing protocol.
              </motion.p>
            </div>
          </div>
        </section>

        {/* Perk Grid */}
        <section className="py-24 bg-white border-y border-gray-100 relative z-20">
           <div className="max-w-[1280px] mx-auto px-6">
              <div className="text-center mb-16">
                 <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-black mb-4">How we operate</h2>
                 <p className="text-gray-500 font-medium">We treat our team the way we treat our protocol: extreme autonomy.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {perks.map((perk, i) => (
                    <motion.div 
                       key={perk.title}
                       initial={{ opacity: 0, y: 30 }}
                       whileInView={{ opacity: 1, y: 0 }}
                       viewport={{ once: true }}
                       transition={{ delay: i * 0.15, duration: 0.5 }}
                       className="p-10 bg-[#F8FAFC] rounded-[32px] border border-gray-200 hover:border-black/10 hover:shadow-2xl hover:shadow-black/5 hover:-translate-y-2 transition-all duration-500 group text-center md:text-left"
                    >
                       <div className="w-16 h-16 rounded-[20px] bg-white border border-gray-100 flex items-center justify-center group-hover:scale-110 group-hover:bg-black transition-all duration-500 shadow-sm mx-auto md:mx-0 mb-8">
                          <div className="group-hover:invert transition-all duration-500 text-black">
                             <perk.icon className="w-7 h-7" />
                          </div>
                       </div>
                       <h3 className="text-2xl font-black text-black tracking-tighter uppercase leading-none mb-3 group-hover:text-[#FB432C] transition-colors">{perk.title}</h3>
                       <p className="text-[15px] text-[#64748B] font-medium leading-relaxed">
                          {perk.desc}
                       </p>
                    </motion.div>
                 ))}
              </div>
           </div>
        </section>

        {/* Current Roles */}
        <section className="py-32 bg-[#F8FAFC]">
           <div className="max-w-[1000px] mx-auto px-6">
              <motion.div 
                 initial={{ opacity: 0, x: -20 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 viewport={{ once: true }}
                 transition={{ duration: 0.6 }}
                 className="flex flex-col md:flex-row items-center justify-between mb-16 gap-6 text-center md:text-left"
              >
                 <h2 className="text-4xl md:text-5xl font-black text-black tracking-tighter uppercase">Node Vacancies</h2>
                 <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm shrink-0">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-black uppercase tracking-widest">Actively Hiring</span>
                 </div>
              </motion.div>

              <div className="space-y-4">
                 {jobs.map((job, i) => (
                    <motion.div 
                       key={job.title}
                       initial={{ opacity: 0, y: 20 }}
                       whileInView={{ opacity: 1, y: 0 }}
                       viewport={{ once: true }}
                       transition={{ delay: i * 0.1 }}
                       onClick={() => setSelectedJob(job)}
                       className="group bg-white p-6 md:p-8 rounded-[24px] border border-gray-200 hover:bg-black hover:border-black hover:shadow-2xl hover:shadow-black/20 hover:-translate-y-1 transition-all duration-500 cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-8 h-auto md:h-32"
                    >
                       <div className="space-y-4">
                          <div className="flex flex-wrap items-center gap-3">
                             <span className="px-3 py-1 bg-[#F8FAFC] group-hover:bg-white/10 rounded-full text-[10px] font-black text-black group-hover:text-white uppercase tracking-widest transition-colors">
                                {job.dept}
                             </span>
                             <span className="px-3 py-1 bg-green-50 text-green-700 border border-green-100 group-hover:bg-green-500/20 group-hover:text-green-400 group-hover:border-transparent rounded-full text-[10px] font-black uppercase tracking-widest transition-colors">
                                {job.type}
                             </span>
                          </div>
                          <h3 className="text-2xl md:text-3xl font-black text-black group-hover:text-white tracking-tighter transition-colors leading-none uppercase">
                             {job.title}
                          </h3>
                       </div>
                       
                       <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-gray-100 group-hover:border-white/10 pt-4 md:pt-0">
                          <div className="flex flex-col items-start md:items-end gap-2">
                             <div className="flex items-center gap-1.5 text-gray-500 font-medium text-[12px] group-hover:text-gray-300 transition-colors uppercase">
                                <MapPin className="w-3.5 h-3.5 opacity-50" /> {job.location}
                             </div>
                             <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-bold uppercase tracking-widest group-hover:text-gray-500">
                                <Clock className="w-3 h-3 opacity-50" /> {job.time}
                             </div>
                          </div>
                          <div className="w-14 h-14 bg-[#F8FAFC] group-hover:bg-[#FB432C] rounded-[16px] flex items-center justify-center text-black group-hover:text-white shadow-sm transition-all duration-500 group-hover:rotate-[-45deg] shrink-0">
                             <ArrowRight className="w-6 h-6" />
                          </div>
                       </div>
                    </motion.div>
                 ))}
              </div>
           </div>
        </section>

        {/* Global Opportunity CTA */}
        <section className="py-24 px-6 bg-white border-t border-gray-100">
           <div className="max-w-[1280px] mx-auto p-12 md:p-20 bg-black rounded-[40px] relative overflow-hidden group shadow-2xl text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-12">
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white opacity-[0.03] blur-[100px] rounded-full mix-blend-overlay pointer-events-none" />
              
              <div className="relative z-10 max-w-2xl">
                 <div className="flex items-center gap-3 mb-6 justify-center md:justify-start">
                    <Briefcase className="w-6 h-6 text-white/50" />
                    <span className="text-[12px] font-black uppercase tracking-widest text-[#FB432C]">General Inquiry</span>
                 </div>
                 <h2 className="text-4xl lg:text-6xl font-extrabold text-white tracking-tighter leading-none uppercase mb-6">
                    Don't see your role?
                 </h2>
                 <p className="text-lg text-slate-400 font-medium leading-relaxed italic opacity-80">
                    We're constantly looking for exceptional people who believe in zero-trace physicalization. Send us your resume and tell us why you belong here.
                 </p>
              </div>

              <div className="relative z-10 shrink-0">
                 <button onClick={() => setSelectedJob({ id: "general", title: "General Application" })} className="h-16 px-10 bg-white text-black hover:bg-[#FB432C] hover:text-white font-black text-[14px] uppercase tracking-widest rounded-[16px] transition-all duration-300 shadow-xl hover:shadow-[#FB432C]/20 hover:-translate-y-1">
                    Send Application
                 </button>
              </div>
           </div>
        </section>

        <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
          <DialogContent className="sm:max-w-[500px] bg-white rounded-3xl p-8 border-none shadow-2xl">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Apply for {selectedJob?.title}</DialogTitle>
              <DialogDescription className="text-[13px] font-medium text-gray-500 italic">
                Dispatch your credentials to the recruitment mesh.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleApply} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-black">Full Name</Label>
                <Input name="name" required placeholder="John Doe" className="h-12 bg-gray-50 border-gray-100 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-black">Email Address</Label>
                <Input name="email" type="email" required placeholder="john@example.com" className="h-12 bg-gray-50 border-gray-100 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-black">Resume Link</Label>
                  <Input name="resume" required placeholder="Drive/Dropbox URL" className="h-12 bg-gray-50 border-gray-100 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-black">Portfolio</Label>
                  <Input name="portfolio" placeholder="Github/Behance" className="h-12 bg-gray-50 border-gray-100 rounded-xl" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-black">Tell us your vision</Label>
                <Textarea name="message" required placeholder="Why do you want to join XeroxQ?" className="min-h-[100px] bg-gray-50 border-gray-100 rounded-xl" />
              </div>
              <button 
                type="submit" 
                disabled={applying}
                className="w-full h-14 bg-black hover:bg-[#FB432C] text-white font-black text-[12px] uppercase tracking-widest rounded-xl shadow-lg transition-all"
              >
                {applying ? "Dispatching..." : "Submit Application"}
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </main>

      <SiteFooter />
    </div>
  );
}
