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
  TrendingUp,
  Clock
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function BlogPost() {
  const router = useRouter();

  const post = {
    title: "Cost Analysis & ROI: How XeroxQ Delivers 300% Return on Investment for Enterprise Printing",
    author: "XeroxQ Finance Team",
    role: "ROI & Cost Analysis Experts",
    date: "May 08, 2026",
    readTime: "16 min",
    category: "Cost Analysis",
    content: [
      { type: "p", text: "Enterprise printing costs have traditionally been a significant operational expense, often overlooked in cost optimization strategies. XeroxQ's revolutionary approach to document printing delivers an average 300% ROI within the first year through security cost reduction, operational efficiency, infrastructure savings, and compliance automation. This comprehensive analysis reveals how enterprises are transforming their printing from a cost center to a strategic advantage." },
      { type: "h2", text: "Traditional Printing Cost Structure" },
      { type: "p", text: "Conventional enterprise printing involves multiple cost layers: hardware acquisition, software licensing, secure storage infrastructure, maintenance contracts, consumables, and compliance management. These costs typically represent 2-5% of total operational expenses for mid-to-large enterprises." },
      { type: "h2", text: "XeroxQ Cost Optimization Model" },
      { type: "p", text: "XeroxQ eliminates traditional cost structures through zero-knowledge architecture, volatile RAM storage, decentralized infrastructure, automated compliance, and pay-per-use pricing. This reduces total printing costs by 60-80% while enhancing security and capabilities." },
      { type: "h2", text: "Security Cost Savings Analysis" },
      { type: "p", text: "Enterprise security spending on document protection averages ₹15-25 lakh annually. XeroxQ's built-in military-grade encryption eliminates these costs while providing superior protection. The zero-knowledge protocol removes the need for expensive secure storage solutions and reduces insurance premiums." },
      { type: "h2", text: "Operational Efficiency Gains" },
      { type: "p", text: "Automated workflows, real-time tracking, and AI-powered optimization reduce administrative overhead by 70%. Enterprises report saving 200+ hours monthly in printing management time, allowing IT teams to focus on strategic initiatives rather than routine printing operations." },
      { type: "h2", text: "Infrastructure Cost Elimination" },
      { type: "p", text: "XeroxQ's decentralized mesh network eliminates the need for on-premise printing servers, secure storage arrays, and backup systems. Enterprises save ₹50-100 lakh in infrastructure costs while gaining superior reliability and scalability." },
      { type: "h2", text: "Compliance Automation Benefits" },
      { type: "p", text: "Regulatory compliance costs average ₹20-30 lakh annually for document management. XeroxQ's automated audit trails, secure deletion, and access controls reduce compliance costs by 85% while improving audit outcomes and reducing regulatory risk." },
      { type: "h2", text: "ROI Calculation Framework" },
      { type: "p", text: "Enterprise customers achieve 300% average ROI through: 60-80% cost reduction, 200+ hours monthly time savings, 85% compliance cost reduction, 40% productivity gains, and 70% security infrastructure savings. The payback period averages 4-6 months with 3-year total savings of ₹2-5 crore for mid-size enterprises." }
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
                          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                             <TrendingUp className="w-5 h-5 text-white" />
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

                 <div className="p-6 bg-emerald-50 rounded-xl border border-emerald-200 space-y-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500 border border-emerald-600 flex items-center justify-center shadow-sm">
                       <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-[11px] text-emerald-700 font-black uppercase tracking-tight leading-relaxed">
                       ROI LEADER: 300% average return on investment with 60-80% cost reduction and 4-6 month payback period.
                    </p>
                 </div>
              </div>
            </aside>

            <div className="lg:col-span-9 max-w-3xl">
              <div className="space-y-12 text-left">
                <div className="space-y-6">
                   <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-md border border-emerald-500/20">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-[10px] font-black tracking-[0.2em] text-emerald-700 uppercase">{post.category}</span>
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

                <div className="mt-20 p-8 bg-emerald-50 rounded-xl border border-emerald-200 relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                       <div className="w-14 h-14 shrink-0 rounded-lg bg-emerald-500 border border-emerald-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                          <ShieldCheck className="w-8 h-8 text-white" />
                       </div>
                       <div className="space-y-3 text-left flex-1">
                          <h4 className="text-xl font-bold text-emerald-800 tracking-tight leading-none uppercase">CALCULATE YOUR PRINTING ROI</h4>
                          <p className="text-[13px] text-emerald-700 font-medium leading-relaxed">Discover how XeroxQ can deliver 300% ROI for your enterprise with our comprehensive cost analysis.</p>
                          <button className="mt-4 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest rounded-md transition-all active:scale-95">
                             GET ROI ANALYSIS
                          </button>
                       </div>
                    </div>
                 </div>

                <div className="flex items-center justify-between pt-16 border-t border-[#E2E8F0]">
                   <button className="group flex flex-col gap-2 items-start text-left">
                      <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Previous Article</span>
                      <span className="text-base font-bold text-black tracking-tight group-hover:underline">Business Transformation Opportunities</span>
                   </button>
                   <button className="group flex flex-col gap-2 items-end text-right">
                      <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Next Article</span>
                      <span className="text-base font-bold text-black tracking-tight group-hover:underline">Customer Experience Revolution</span>
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
