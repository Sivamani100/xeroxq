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
  MessageCircle,
  Clock,
  Eye
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function BlogPost() {
  const router = useRouter();

  const post = {
    title: "Why WhatsApp Printing is a National Privacy Hazard",
    author: "XeroxQ Labs",
    role: "Security Research Team",
    date: "March 28, 2026",
    readTime: "6 min",
    category: "Security",
    content: [
      { type: "p", text: "Every time you send a document via WhatsApp to a local print shop, you're creating a permanent digital footprint that compromises your privacy. Here's the architectural failure we're solving." },
      { type: "h2", text: "The Permanent Storage Problem" },
      { type: "p", text: "When you send a document through WhatsApp to a print shop, that file gets stored on the shop owner's device permanently. Even after they print your document, the original file remains in their WhatsApp media folder, backed up to cloud storage, and potentially accessible to anyone with device access." },
      { type: "p", text: "This creates a massive security vulnerability. Your sensitive documents—business contracts, personal identification, financial statements—are sitting on someone else's phone, potentially for years." },
      { type: "h2", text: "The Backup Nightmare" },
      { type: "p", text: "WhatsApp automatically backs up all media to Google Drive or iCloud. This means your documents aren't just on the shop owner's phone—they're in the cloud, accessible through backup recovery processes, and potentially vulnerable to cloud provider breaches." },
      { type: "p", text: "Even if the shop owner manually deletes your file, it often remains in their cloud backup for months or years, creating a long-term privacy risk that most users never consider." },
      { type: "h2", text: "The Shared Device Risk" },
      { type: "p", text: "Most print shops are family-run businesses with shared devices. Your documents could be viewed by employees, family members, or anyone who borrows the shop owner's phone. There's no access control, no encryption, and no audit trail." },
      { type: "p", text: "This violates basic data protection principles and puts businesses and individuals at significant risk of data leaks and identity theft." },
      { type: "h2", text: "The XeroxQ Solution" },
      { type: "p", text: "XeroxQ eliminates these privacy risks through zero-knowledge architecture. Your documents are encrypted locally on your device before transmission, and the shop owner only receives a temporary, volatile copy that's automatically purged after printing." },
      { type: "p", text: "No permanent storage. No cloud backups. No shared device access. Just secure, private printing that respects your data sovereignty." }
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
                          <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center">
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
                    <div className="w-10 h-10 rounded-lg bg-red-500 border border-red-600 flex items-center justify-center shadow-sm">
                       <Eye className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-[11px] text-red-700 font-black uppercase tracking-tight leading-relaxed">
                       CRITICAL PRIVACY WARNING: WhatsApp printing exposes your documents to permanent storage and unauthorized access.
                    </p>
                 </div>
              </div>
            </aside>

            <div className="lg:col-span-9 max-w-3xl">
              <div className="space-y-12 text-left">
                <div className="space-y-6">
                   <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 rounded-md border border-red-500/20">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                      <span className="text-[10px] font-black tracking-[0.2em] text-red-700 uppercase">{post.category}</span>
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
                       <div className="w-14 h-14 shrink-0 rounded-lg bg-red-500 border border-red-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                          <ShieldCheck className="w-8 h-8 text-white" />
                       </div>
                       <div className="space-y-3 text-left flex-1">
                          <h4 className="text-xl font-bold text-red-800 tracking-tight leading-none uppercase">SWITCH TO SECURE PRINTING</h4>
                          <p className="text-[13px] text-red-700 font-medium leading-relaxed">Protect your privacy with XeroxQ's zero-knowledge printing protocol.</p>
                          <button className="mt-4 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase tracking-widest rounded-md transition-all active:scale-95">
                             GET SECURE PRINTING
                          </button>
                       </div>
                    </div>
                 </div>

                <div className="flex items-center justify-between pt-16 border-t border-[#E2E8F0]">
                   <button className="group flex flex-col gap-2 items-start text-left">
                      <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Previous Article</span>
                      <span className="text-base font-bold text-black tracking-tight group-hover:underline">The Zero-Knowledge Print Protocol</span>
                   </button>
                   <button className="group flex flex-col gap-2 items-end text-right">
                      <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Next Article</span>
                      <span className="text-base font-bold text-black tracking-tight group-hover:underline">WhatsApp Virtual Number System</span>
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
