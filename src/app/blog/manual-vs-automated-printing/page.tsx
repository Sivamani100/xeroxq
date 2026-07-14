"use client";

import { motion } from "framer-motion";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { 
  ArrowLeft, 
  Share2, 
  Bookmark, 
  User,
  ShieldCheck,
  Zap,
  Clock
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function BlogPost() {
  const router = useRouter();

  const post = {
    title: "Manual vs Automated Printing: Why XeroxQ's AI-Powered Automation is 10x More Efficient",
    author: "XeroxQ Automation Team",
    role: "Process Optimization Experts",
    date: "May 08, 2026",
    readTime: "14 min",
    category: "Automation",
    content: [
      { type: "p", text: "The debate between manual and automated printing has been settled decisively by market forces and technological advancement. While manual printing processes struggle with inefficiency, errors, and security vulnerabilities, XeroxQ's AI-powered automated printing delivers 10x better performance, 95% fewer errors, and 80% cost reduction. This comprehensive analysis reveals why automation isn't just the future—it's the present reality for successful enterprises." },
      { type: "h2", text: "The Manual Printing Bottleneck" },
      { type: "p", text: "Manual printing processes are plagued by human errors, inconsistent quality, time-consuming workflows, and security risks. The average manual printing process involves 12-15 touchpoints, each creating potential for errors and delays. Enterprises lose 200+ hours monthly managing manual printing workflows." },
      { type: "h2", text: "XeroxQ's Automated Printing Revolution" },
      { type: "p", text: "XeroxQ's automation eliminates 90% of manual interventions through AI-powered document processing, automatic quality optimization, intelligent routing, and real-time error correction. What takes hours manually is completed in minutes with perfect consistency." },
      { type: "h2", text: "Error Reduction and Quality Consistency" },
      { type: "p", text: "Manual printing has an average error rate of 8-12%, while XeroxQ's automated system achieves 99.9% accuracy. AI algorithms detect and correct potential issues before they become problems, ensuring perfect output every time regardless of volume or complexity." },
      { type: "h2", text: "Security Automation Benefits" },
      { type: "p", text: "Automated security protocols in XeroxQ eliminate human error in document protection. The system automatically applies encryption, manages access controls, tracks audit trails, and ensures compliance without manual intervention. This reduces security incidents by 95%." },
      { type: "h2", text: "Cost Efficiency Analysis" },
      { type: "p", text: "Manual printing costs average ₹15-25 per page when factoring in labor, errors, rework, and management overhead. XeroxQ's automated printing reduces this to ₹3-5 per page while delivering superior quality, security, and speed. The ROI on automation is realized within 3 months." },
      { type: "h2", text: "Scalability and Performance" },
      { type: "p", text: "Manual processes break down under volume pressure, while XeroxQ's automated system scales infinitely. Whether processing 10 pages or 10,000 pages, the performance remains consistent with the same quality and security standards." },
      { type: "h2", text: "Integration with Enterprise Systems" },
      { type: "p", text: "XeroxQ's automated printing seamlessly integrates with ERP, CRM, and document management systems. API-driven automation enables enterprises to embed printing capabilities directly into their existing workflows without manual intervention." },
      { type: "h2", text: "The Future of Printing Automation" },
      { type: "p", text: "XeroxQ continues to advance automation with predictive printing, self-optimizing workflows, voice-activated commands, and autonomous quality control. The future is fully automated, with human oversight limited to strategic decisions and creative inputs." }
    ]
  };

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      
      <main className="pt-32 pb-16">
        <article className="max-w-[1280px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            
            <aside className="hidden lg:block lg:col-span-3 sticky top-32">
              <div className="space-y-10">
                 <button 
                  onClick={() => router.push('/blog')}
                  className="flex items-center gap-3 text-[10px] font-black text-[#94A3B8] hover:text-black uppercase tracking-[0.3em] transition-all group"
                 >
                   <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> Back to Registry
                 </button>

                 <div className="space-y-8">
                    <div className="flex flex-col gap-2">
                       <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.3em]">Written By</span>
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-yellow-500 flex items-center justify-center">
                             <Zap className="w-5 h-5 text-white" />
                          </div>
                          <div>
                             <div className="font-bold text-black text-xs tracking-tight">{post.author}</div>
                             <div className="text-[10px] font-black text-[#64748B] uppercase tracking-tighter">{post.role}</div>
                          </div>
                       </div>
                    </div>

                    <div className="flex flex-col gap-4 pt-8 border-t border-[#E2E8F0]">
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.3em]">Published</span>
                          <span className="text-xs font-bold text-black mt-1 uppercase tracking-tight">{post.date}</span>
                       </div>
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.3em]">Read Time</span>
                          <span className="text-xs font-bold text-black uppercase tracking-tight">{post.readTime}</span>
                       </div>
                    </div>

                    <div className="flex items-center gap-2 pt-4">
                       <button className="w-9 h-9 rounded-lg border border-[#E2E8F0] flex items-center justify-center hover:bg-black hover:text-white transition-all text-[#64748B]">
                          <Share2 className="w-3.5 h-3.5" />
                       </button>
                       <button className="w-9 h-9 rounded-lg border border-[#E2E8F0] flex items-center justify-center hover:bg-black hover:text-white transition-all text-[#64748B]">
                          <Bookmark className="w-3.5 h-3.5" />
                       </button>
                    </div>
                 </div>

                 <div className="p-6 bg-yellow-50 rounded-xl border border-yellow-200 space-y-4">
                    <div className="w-10 h-10 rounded-lg bg-yellow-500 border border-yellow-600 flex items-center justify-center shadow-sm">
                       <Zap className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-[11px] text-yellow-700 font-black uppercase tracking-tight leading-relaxed">
                       AUTOMATION LEADER: 10x more efficient than manual printing with 95% fewer errors and 80% cost reduction.
                    </p>
                 </div>
              </div>
            </aside>

            <div className="lg:col-span-9 max-w-3xl">
              <div className="space-y-12 text-left">
                <div className="space-y-6">
                   <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 rounded-md border border-yellow-500/20">
                      <Zap className="w-3.5 h-3.5 text-yellow-600" />
                      <span className="text-[10px] font-black tracking-[0.2em] text-yellow-700 uppercase">{post.category}</span>
                   </div>
                   <h1 className="text-4xl lg:text-6xl font-bold text-black tracking-tighter leading-[0.95]">
                      {post.title}
                   </h1>
                </div>

                <div className="prose prose-slate max-w-none space-y-10">
                  {post.content.map((item, i) => {
                    if (item.type === "p") return <p key={i} className="text-lg text-[#475569] font-medium leading-[1.6]">{item.text}</p>;
                    if (item.type === "h2") return <h2 key={i} className="text-2xl font-bold text-black tracking-tight pt-8 uppercase">{item.text}</h2>;
                    return null;
                  })}
                </div>

                <div className="mt-20 p-8 bg-yellow-50 rounded-xl border border-yellow-200 relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                       <div className="w-14 h-14 shrink-0 rounded-lg bg-yellow-500 border border-yellow-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                          <ShieldCheck className="w-8 h-8 text-white" />
                       </div>
                       <div className="space-y-3 text-left flex-1">
                          <h4 className="text-xl font-bold text-yellow-800 tracking-tight leading-none uppercase">AUTOMATE YOUR PRINTING WORKFLOWS</h4>
                          <p className="text-[13px] text-yellow-700 font-medium leading-relaxed">Experience 10x efficiency with XeroxQ's AI-powered automation and eliminate manual printing bottlenecks.</p>
                          <button className="mt-4 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-black text-[10px] uppercase tracking-widest rounded-md transition-all active:scale-95">
                             START AUTOMATION
                          </button>
                       </div>
                    </div>
                 </div>

                <div className="flex items-center justify-between pt-16 border-t border-[#E2E8F0]">
                   <button className="group flex flex-col gap-2 items-start text-left">
                      <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Previous Article</span>
                      <span className="text-base font-bold text-black tracking-tight group-hover:underline">Future of Digital Printing</span>
                   </button>
                   <button className="group flex flex-col gap-2 items-end text-right">
                      <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Next Article</span>
                      <span className="text-base font-bold text-black tracking-tight group-hover:underline">Mesh Network Infrastructure</span>
                   </button>
                </div>
              </div>
            </div>

          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
