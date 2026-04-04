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
  Globe,
  Clock
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function BlogPost({ params }: { params: { slug: string } }) {
  const router = useRouter();

  const post = {
    title: "The Zero-Knowledge Print Protocol: A Deep Dive",
    author: "XeroxQ Engineering",
    role: "Core Protocol Leads",
    date: "April 02, 2026",
    readTime: "8 min",
    category: "Engineering",
    content: [
      { type: "p", text: "At its core, the XeroxQ protocol is designed to solve a fundamental flaw in traditional printing infrastructure: the 'Centralized Payload Leak.' In a standard document workflow, files are often transmitted and stored on centralized servers, creating a massive attack surface for sensitive document theft." },
      { type: "h2", text: "Local Payload Encryption" },
      { type: "p", text: "XeroxQ flips the script. When a user sends a 'Signal' (our term for a print job), the XeroxQ Client locally encrypts the document using AES-256-GCM. The raw document content never leaves the user's device in an unencrypted state." },
      { type: "p", text: "The encryption key is then shared with the target Shop Node via a secure, one-time handshake. This ensures that even if our global mesh routing is intercepted, the document remains a 'Glow'—a meaningless cluster of encrypted data." },
      { type: "h2", text: "The Ephemeral Purge" },
      { type: "p", text: "Security doesn't stop at physicalization. Once the Shop Node completes the print job, the protocol triggers an 'Autonomous Purge.' The transient document fragment is wiped from the shop's memory using a 7-pass secure delete process." },
      { type: "p", text: "This zero-persistence architecture ensures that the shopkeeper never 'owns' your data—they only facilitate its physical arrival." }
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
                          <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center">
                             <User className="w-5 h-5 text-white" />
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

                 <div className="p-6 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-4">
                    <div className="w-10 h-10 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center shadow-sm">
                       <ShieldCheck className="w-5 h-5 text-black" />
                    </div>
                    <p className="text-[11px] text-[#64748B] font-black uppercase tracking-tight leading-relaxed">
                       This article was verified by our global protocol security auditors on April 04, 2026.
                    </p>
                 </div>
              </div>
            </aside>

            <div className="lg:col-span-9 max-w-3xl">
              <div className="space-y-12 text-left">
                <div className="space-y-6">
                   <div className="inline-flex items-center gap-2 px-3 py-1 bg-black/5 rounded-md border border-black/5">
                      <Zap className="w-3.5 h-3.5 text-black" />
                      <span className="text-[10px] font-black tracking-[0.2em] text-black uppercase">{post.category}</span>
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

                <div className="mt-20 p-8 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                       <div className="w-14 h-14 shrink-0 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                          <Globe className="w-8 h-8 text-black" />
                       </div>
                       <div className="space-y-3 text-left flex-1">
                          <h4 className="text-xl font-bold text-black tracking-tight leading-none uppercase">THE PRIVACY DIGEST</h4>
                          <p className="text-[13px] text-[#64748B] font-medium leading-relaxed">Join advocates reading about decentralized hardware protocols.</p>
                          <form className="relative pt-2">
                             <input type="email" placeholder="ledger@xeroxq.lab" className="w-full h-12 pl-4 pr-32 bg-white border border-[#E2E8F0] rounded-lg text-xs font-bold shadow-sm outline-none" />
                             <button className="absolute right-1.5 top-[14px] h-9 px-6 bg-black text-white font-black text-[10px] uppercase tracking-widest rounded-md transition-all active:scale-95">
                                SIGN UP
                             </button>
                          </form>
                       </div>
                    </div>
                 </div>

                <div className="flex items-center justify-between pt-16 border-t border-[#E2E8F0]">
                   <button className="group flex flex-col gap-2 items-start text-left">
                      <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Previous Article</span>
                      <span className="text-base font-bold text-black tracking-tight group-hover:underline">Scaling the Global Mesh</span>
                   </button>
                   <button className="group flex flex-col gap-2 items-end text-right">
                      <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Next Article</span>
                      <span className="text-base font-bold text-black tracking-tight group-hover:underline">Future of Physicalization</span>
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
