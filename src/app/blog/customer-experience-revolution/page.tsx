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
  MessageCircle,
  Clock
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function BlogPost() {
  const router = useRouter();

  const post = {
    title: "Customer Experience Revolution: How XeroxQ is Redefining Printing Service Delivery in India",
    author: "XeroxQ Customer Experience Team",
    role: "CX & Service Design Experts",
    date: "May 08, 2026",
    readTime: "12 min",
    category: "Customer Experience",
    content: [
      { type: "p", text: "The printing industry in India has long been plagued by poor customer experiences—long wait times, inconsistent quality, security concerns, and opaque pricing. XeroxQ is revolutionizing this landscape with a customer-centric approach that combines cutting-edge technology, human-centered design, and unprecedented transparency. Our zero-knowledge protocol not only secures documents but transforms the entire customer journey from upload to collection." },
      { type: "h2", text: "The Traditional Printing Customer Experience Problem" },
      { type: "p", text: "Traditional printing services in India suffer from multiple pain points: average wait times of 2-4 hours, inconsistent quality across locations, lack of real-time tracking, opaque pricing structures, and serious security vulnerabilities. 78% of customers report frustration with existing printing services." },
      { type: "h2", text: "XeroxQ's Customer Experience Revolution" },
      { type: "p", text: "XeroxQ has reimagined every touchpoint of the customer journey: 5-minute processing times, real-time order tracking, transparent pricing, consistent quality across 500+ locations, and military-grade security. The result is a 98% customer satisfaction rate and 4.9/5 app ratings." },
      { type: "h2", text: "Mobile-First Customer Experience" },
      { type: "p", text: "With 85% of printing requests originating from mobile devices, XeroxQ has built a mobile-first experience that includes location detection, one-tap ordering, live chat support, digital payments, and instant notifications. The app reduces the time from need to print from hours to minutes." },
      { type: "h2", text: "Personalized Service at Scale" },
      { type: "p", text: "XeroxQ's AI-powered personalization engine learns customer preferences, suggests optimal printing locations, anticipates needs based on usage patterns, and provides customized recommendations. This creates a white-glove experience at mass-market prices." },
      { type: "h2", text: "Transparent Pricing and Trust Building" },
      { type: "p", text: "Hidden fees and opaque pricing have eroded trust in the printing industry. XeroxQ's transparent pricing model shows exact costs upfront, provides detailed breakdowns, offers volume discounts automatically, and eliminates surprise charges. This transparency has built unprecedented customer trust." },
      { type: "h2", text: "Security as a Customer Experience Feature" },
      { type: "p", text: "Unlike competitors who treat security as a technical feature, XeroxQ integrates security into the customer experience. Customers receive real-time security updates, access audit logs, get deletion confirmations, and enjoy peace of mind knowing their documents are protected by zero-knowledge encryption." },
      { type: "h2", text: "The Future of Printing Customer Experience" },
      { type: "p", text: "XeroxQ continues to innovate with AR preview technology, voice-activated printing, predictive availability, drone delivery, and blockchain verification. These innovations will further reduce friction and enhance the customer experience, setting new standards for the industry." }
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
                          <div className="w-10 h-10 rounded-xl bg-pink-500 flex items-center justify-center">
                             <MessageCircle className="w-5 h-5 text-white" />
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

                 <div className="p-6 bg-pink-50 rounded-xl border border-pink-200 space-y-4">
                    <div className="w-10 h-10 rounded-lg bg-pink-500 border border-pink-600 flex items-center justify-center shadow-sm">
                       <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-[11px] text-pink-700 font-black uppercase tracking-tight leading-relaxed">
                       CX LEADER: 98% customer satisfaction with 5-minute processing and 4.9/5 app ratings across 500+ locations.
                    </p>
                 </div>
              </div>
            </aside>

            <div className="lg:col-span-9 max-w-3xl">
              <div className="space-y-12 text-left">
                <div className="space-y-6">
                   <div className="inline-flex items-center gap-2 px-3 py-1 bg-pink-500/10 rounded-md border border-pink-500/20">
                      <MessageCircle className="w-3.5 h-3.5 text-pink-600" />
                      <span className="text-[10px] font-black tracking-[0.2em] text-pink-700 uppercase">{post.category}</span>
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

                <div className="mt-20 p-8 bg-pink-50 rounded-xl border border-pink-200 relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                       <div className="w-14 h-14 shrink-0 rounded-lg bg-pink-500 border border-pink-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                          <ShieldCheck className="w-8 h-8 text-white" />
                       </div>
                       <div className="space-y-3 text-left flex-1">
                          <h4 className="text-xl font-bold text-pink-800 tracking-tight leading-none uppercase">EXPERIENCE FUTURE OF PRINTING</h4>
                          <p className="text-[13px] text-pink-700 font-medium leading-relaxed">Join thousands of customers enjoying 5-minute printing with military-grade security and 98% satisfaction.</p>
                          <button className="mt-4 px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white font-black text-[10px] uppercase tracking-widest rounded-md transition-all active:scale-95">
                             TRY XEROXQ NOW
                          </button>
                       </div>
                    </div>
                 </div>

                <div className="flex items-center justify-between pt-16 border-t border-[#E2E8F0]">
                   <button className="group flex flex-col gap-2 items-start text-left">
                      <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Previous Article</span>
                      <span className="text-base font-bold text-black tracking-tight group-hover:underline">Cost Analysis ROI</span>
                   </button>
                   <button className="group flex flex-col gap-2 items-end text-right">
                      <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Next Article</span>
                      <span className="text-base font-bold text-black tracking-tight group-hover:underline">Data Privacy Nightmare</span>
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
