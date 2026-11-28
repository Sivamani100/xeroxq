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
    title: "Business Transformation Opportunities: How Digital Printing is Revolutionizing Indian Enterprises",
    author: "XeroxQ Business Transformation Team",
    role: "Enterprise Digital Solutions",
    date: "May 08, 2026",
    readTime: "14 min",
    category: "Business Transformation",
    content: [
      { type: "p", text: "Digital transformation is reshaping Indian enterprises, and printing technology is at the forefront of this revolution. From traditional paper-based workflows to smart, secure, and sustainable printing solutions, businesses are discovering unprecedented opportunities for efficiency, security, and cost reduction. XeroxQ's zero-knowledge printing protocol is enabling enterprises to transform their document workflows while maintaining complete data privacy and compliance." },
      { type: "h2", text: "The Digital Printing Revolution in Indian Business" },
      { type: "p", text: "Indian enterprises are rapidly adopting digital printing solutions, with the market growing from ₹8,000 crore in 2020 to projected ₹25,000 crore by 2026. This transformation is driven by the need for enhanced security, operational efficiency, and regulatory compliance in document management." },
      { type: "h2", text: "Key Transformation Opportunities" },
      { type: "p", text: "Businesses can transform through secure document workflows, automated printing processes, real-time document tracking, cost optimization through AI, and compliance automation. XeroxQ's decentralized mesh network enables enterprises to maintain complete control over their document infrastructure." },
      { type: "h2", text: "Security-First Transformation" },
      { type: "p", text: "With increasing data protection regulations and cyber threats, enterprises are prioritizing security in their printing transformation. XeroxQ's zero-knowledge encryption ensures that even the service provider cannot access sensitive business documents, providing unprecedented security for enterprise workflows." },
      { type: "h2", text: "Cost Reduction Through Smart Printing" },
      { type: "p", text: "Digital printing transformation can reduce enterprise printing costs by 40-60% through optimized resource allocation, reduced waste, automated workflows, and elimination of unnecessary infrastructure. XeroxQ's volatile RAM storage eliminates the need for expensive secure storage solutions." },
      { type: "h2", text: "Sustainability and ESG Benefits" },
      { type: "p", text: "Modern digital printing solutions support enterprise ESG goals through reduced paper waste, energy-efficient processes, and minimized carbon footprint. XeroxQ's distributed network reduces transportation needs and supports local printing ecosystems." },
      { type: "h2", text: "Implementation Roadmap for Enterprises" },
      { type: "p", text: "Successful transformation requires strategic planning, stakeholder buy-in, phased implementation, and comprehensive training. XeroxQ provides enterprise-grade support with dedicated account managers, 24/7 technical assistance, and customized implementation strategies." }
    ]
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#111113] text-[#171717] dark:text-[#EDEDED]">
      <SiteHeader />
      
      <main className="pt-32 pb-16">
        <article className="max-w-[1280px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            
            <aside className="hidden lg:block lg:col-span-3 sticky top-32">
              <div className="space-y-10">
                 <button 
                  onClick={() => router.push('/blog')}
                  className="flex items-center gap-3 text-[10px] font-black text-[#737373] dark:text-[#85858B] hover:text-[#171717] dark:hover:text-[#EDEDED] uppercase tracking-[0.3em] transition-all group"
                 >
                   <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> Back to Registry
                 </button>

                 <div className="space-y-8">
                    <div className="flex flex-col gap-2">
                       <span className="text-[10px] font-black text-[#737373] dark:text-[#85858B] uppercase tracking-[0.3em]">Written By</span>
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center">
                             <TrendingUp className="w-5 h-5 text-white" />
                          </div>
                          <div>
                             <div className="font-bold text-[#171717] dark:text-[#EDEDED] text-xs tracking-tight">{post.author}</div>
                             <div className="text-[10px] font-black text-[#525252] dark:text-[#A1A1A6] uppercase tracking-tighter">{post.role}</div>
                          </div>
                       </div>
                    </div>

                    <div className="flex flex-col gap-4 pt-8 border-t border-[#171717]/[0.08] dark:border-white/[0.08]">
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-[#737373] dark:text-[#85858B] uppercase tracking-[0.3em]">Published</span>
                          <span className="text-xs font-bold text-[#171717] dark:text-[#EDEDED] mt-1 uppercase tracking-tight">{post.date}</span>
                       </div>
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-[#737373] dark:text-[#85858B] uppercase tracking-[0.3em]">Read Time</span>
                          <span className="text-xs font-bold text-[#171717] dark:text-[#EDEDED] uppercase tracking-tight">{post.readTime}</span>
                       </div>
                    </div>

                    <div className="flex items-center gap-2 pt-4">
                       <button className="w-9 h-9 rounded-lg bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] flex items-center justify-center hover:bg-[#171717] hover:text-white dark:hover:bg-[#EDEDED] dark:hover:text-[#111113] transition-all text-[#525252] dark:text-[#A1A1A6]">
                          <Share2 className="w-3.5 h-3.5" />
                       </button>
                       <button className="w-9 h-9 rounded-lg bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] flex items-center justify-center hover:bg-[#171717] hover:text-white dark:hover:bg-[#EDEDED] dark:hover:text-[#111113] transition-all text-[#525252] dark:text-[#A1A1A6]">
                          <Bookmark className="w-3.5 h-3.5" />
                       </button>
                    </div>
                 </div>

                 <div className="p-6 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800/50 space-y-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500 border border-indigo-600 dark:border-indigo-500 flex items-center justify-center shadow-sm">
                       <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-[11px] text-indigo-700 dark:text-indigo-300 font-black uppercase tracking-tight leading-relaxed">
                       TRANSFORMATION LEADER: Enterprise-grade digital printing with 40-60% cost reduction and zero-knowledge security.
                    </p>
                 </div>
              </div>
            </aside>

            <div className="lg:col-span-9 max-w-3xl">
              <div className="space-y-12 text-left">
                <div className="space-y-6">
                   <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 dark:bg-indigo-950/50 rounded-md border border-indigo-500/20 dark:border-indigo-800/50">
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-[10px] font-black tracking-[0.2em] text-indigo-700 dark:text-indigo-300 uppercase">{post.category}</span>
                   </div>
                   <h1 className="text-4xl lg:text-6xl font-bold text-[#171717] dark:text-[#EDEDED] tracking-tighter leading-[0.95]">
                      {post.title}
                   </h1>
                </div>

                <div className="prose prose-slate dark:prose-invert max-w-none space-y-10">
                  {post.content.map((item, i) => {
                    if (item.type === "p") return <p key={i} className="text-lg text-[#525252] dark:text-[#A1A1A6] font-medium leading-[1.6]">{item.text}</p>;
                    if (item.type === "h2") return <h2 key={i} className="text-2xl font-bold text-[#171717] dark:text-[#EDEDED] tracking-tight pt-8 uppercase">{item.text}</h2>;
                    return null;
                  })}
                </div>

                <div className="mt-20 p-8 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800/50 relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                       <div className="w-14 h-14 shrink-0 rounded-lg bg-indigo-500 border border-indigo-600 dark:border-indigo-500 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                          <ShieldCheck className="w-8 h-8 text-white" />
                       </div>
                       <div className="space-y-3 text-left flex-1">
                          <h4 className="text-xl font-bold text-indigo-800 dark:text-indigo-200 tracking-tight leading-none uppercase">TRANSFORM YOUR ENTERPRISE PRINTING</h4>
                          <p className="text-[13px] text-indigo-700 dark:text-indigo-300 font-medium leading-relaxed">Discover how XeroxQ's zero-knowledge printing can revolutionize your document workflows with enterprise-grade security.</p>
                          <button className="mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest rounded-md transition-all active:scale-95">
                             START TRANSFORMATION
                          </button>
                       </div>
                    </div>
                 </div>

                <div className="flex items-center justify-between pt-16 border-t border-[#171717]/[0.08] dark:border-white/[0.08]">
                   <button className="group flex flex-col gap-2 items-start text-left">
                      <span className="text-[10px] font-black text-[#737373] dark:text-[#85858B] uppercase tracking-widest">Previous Article</span>
                      <span className="text-base font-bold text-[#171717] dark:text-[#EDEDED] tracking-tight group-hover:underline">WhatsApp Virtual Number System</span>
                   </button>
                   <button className="group flex flex-col gap-2 items-end text-right">
                      <span className="text-[10px] font-black text-[#737373] dark:text-[#85858B] uppercase tracking-widest">Next Article</span>
                      <span className="text-base font-bold text-[#171717] dark:text-[#EDEDED] tracking-tight group-hover:underline">Cost Analysis ROI</span>
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
