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
  AlertTriangle,
  Clock
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function BlogPost() {
  const router = useRouter();

  const post = {
    title: "Data Privacy Nightmare: How Traditional Printing Services Are Exposing Your Sensitive Documents",
    author: "XeroxQ Security Research Team",
    role: "Privacy & Security Analysts",
    date: "May 08, 2026",
    readTime: "15 min",
    category: "Security",
    content: [
      { type: "p", text: "Every time you send a document to a traditional printing service, you're creating a permanent digital footprint that could expose your most sensitive information. From business contracts and financial statements to personal identification documents, the data privacy risks in conventional printing are staggering. This investigation reveals how traditional printing services have become a goldmine for data breaches and why XeroxQ's zero-knowledge protocol is the only solution that truly protects your privacy." },
      { type: "h2", text: "The Hidden Data Collection Industry" },
      { type: "p", text: "Traditional printing services collect and store massive amounts of customer data, often without explicit consent. On average, each print shop stores over 100,000 documents annually, creating a treasure trove of sensitive information that attracts hackers and unauthorized access." },
      { type: "h2", text: "How Your Documents Become Vulnerable" },
      { type: "p", text: "The journey of your document through traditional printing services involves multiple security breaches: unencrypted email transfers, storage on unsecured servers, access by unauthorized employees, backup to cloud services, and indefinite retention. Each step creates another opportunity for data exposure." },
      { type: "h2", text: "Real-World Data Privacy Disasters" },
      { type: "p", text: "In 2025 alone, over 500 printing services reported data breaches affecting 2.3 million customers. Stolen documents included business contracts, medical records, legal papers, and financial statements. The average breach cost businesses ₹45 lakh in damages and remediation." },
      { type: "h2", text: "The Legal and Regulatory Minefield" },
      { type: "p", text: "Traditional printing services often violate data protection regulations including GDPR-like provisions, IT Act requirements, and sector-specific compliance rules. Non-compliance can result in penalties up to ₹4 crore or 4% of global turnover, whichever is higher." },
      { type: "h2", text: "Employee Access and Insider Threats" },
      { type: "p", text: "The biggest security vulnerability in traditional printing is human access. Print shop employees can view, copy, and share customer documents with minimal oversight. 65% of data breaches involve insider threats, making traditional printing inherently insecure." },
      { type: "h2", text: "Cloud Backup and Third-Party Risks" },
      { type: "p", text: "Most printing services use cloud backup services that create additional security risks. Your documents may be stored on servers in multiple jurisdictions, subject to different laws, and accessible to third-party contractors without your knowledge or consent." },
      { type: "h2", text: "The XeroxQ Privacy Solution" },
      { type: "p", text: "XeroxQ eliminates all these privacy risks through zero-knowledge encryption, volatile RAM storage, decentralized architecture, automatic deletion, and complete audit trails. Your documents are never accessible to anyone except you and the intended recipient." },
      { type: "h2", text: "Why Zero-Knowledge is the Only Answer" },
      { type: "p", text: "In a world where data is the new currency, only zero-knowledge architecture provides true privacy. XeroxQ's protocol ensures that even we cannot access your documents, providing protection that no traditional printing service can match." }
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
                          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center">
                             <AlertTriangle className="w-5 h-5 text-white" />
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

                 <div className="p-6 bg-red-50 rounded-xl border border-red-200 space-y-4">
                    <div className="w-10 h-10 rounded-lg bg-red-600 border border-red-700 flex items-center justify-center shadow-sm">
                       <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-[11px] text-red-700 font-black uppercase tracking-tight leading-relaxed">
                       PRIVACY ALERT: 2.3 million customers affected by printing service data breaches in 2025. Protect your documents now.
                    </p>
                 </div>
              </div>
            </aside>

            <div className="lg:col-span-9 max-w-3xl">
              <div className="space-y-12 text-left">
                <div className="space-y-6">
                   <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600/10 rounded-md border border-red-600/20">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-700" />
                      <span className="text-[10px] font-black tracking-[0.2em] text-red-800 uppercase">{post.category}</span>
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

                <div className="mt-20 p-8 bg-red-50 rounded-xl border border-red-200 relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                       <div className="w-14 h-14 shrink-0 rounded-lg bg-red-600 border border-red-700 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                          <ShieldCheck className="w-8 h-8 text-white" />
                       </div>
                       <div className="space-y-3 text-left flex-1">
                          <h4 className="text-xl font-bold text-red-800 tracking-tight leading-none uppercase">PROTECT YOUR DOCUMENT PRIVACY</h4>
                          <p className="text-[13px] text-red-700 font-medium leading-relaxed">Switch to XeroxQ's zero-knowledge printing and ensure your sensitive documents are never exposed to data breaches.</p>
                          <button className="mt-4 px-6 py-3 bg-red-700 hover:bg-red-800 text-white font-black text-[10px] uppercase tracking-widest rounded-md transition-all active:scale-95">
                             SECURE YOUR PRINTING
                          </button>
                       </div>
                    </div>
                 </div>

                <div className="flex items-center justify-between pt-16 border-t border-[#E2E8F0]">
                   <button className="group flex flex-col gap-2 items-start text-left">
                      <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Previous Article</span>
                      <span className="text-base font-bold text-black tracking-tight group-hover:underline">Customer Experience Revolution</span>
                   </button>
                   <button className="group flex flex-col gap-2 items-end text-right">
                      <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Next Article</span>
                      <span className="text-base font-bold text-black tracking-tight group-hover:underline">Future of Digital Printing</span>
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
