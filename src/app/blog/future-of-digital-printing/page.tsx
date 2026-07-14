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
  Cpu,
  Clock
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function BlogPost() {
  const router = useRouter();

  const post = {
    title: "Future of Digital Printing: AI, Quantum Security, and the Next Decade of Document Technology",
    author: "XeroxQ Innovation Lab",
    role: "Future Technology Researchers",
    date: "May 08, 2026",
    readTime: "18 min",
    category: "Innovation",
    content: [
      { type: "p", text: "The digital printing landscape is undergoing its most profound transformation since the invention of the printing press. Artificial intelligence, quantum computing, blockchain technology, and decentralized networks are converging to create a new paradigm in document processing. XeroxQ is at the forefront of this revolution, pioneering technologies that will define how India handles documents in the next decade and beyond." },
      { type: "h2", text: "AI-Powered Document Intelligence" },
      { type: "p", text: "Artificial intelligence is revolutionizing every aspect of digital printing. XeroxQ's AI engine can automatically optimize document layouts, predict printing needs, detect sensitive content, and suggest security protocols. Machine learning algorithms reduce processing time by 90% while improving quality and consistency across all outputs." },
      { type: "h2", text: "Quantum-Ready Security Architecture" },
      { type: "p", text: "With quantum computers threatening to break current encryption, XeroxQ is implementing post-quantum cryptographic algorithms that will protect documents for decades to come. Our quantum-resistant encryption ensures that even future quantum computers cannot access your sensitive documents." },
      { type: "h2", text: "Blockchain Document Verification" },
      { type: "p", text: "Blockchain technology is creating immutable audit trails for document printing. XeroxQ's blockchain integration provides tamper-proof verification of document authenticity, complete access logs, and smart contract automation for enterprise workflows. This creates unprecedented trust and accountability in document processing." },
      { type: "h2", text: "Decentralized Mesh Networks" },
      { type: "p", text: "The future of printing infrastructure is decentralized. XeroxQ's mesh network eliminates single points of failure, provides infinite scalability, and ensures local processing regardless of internet connectivity. Each node operates independently while maintaining network-wide security and consistency." },
      { type: "h2", text: "Augmented Reality Document Preview" },
      { type: "p", text: "AR technology is transforming how we interact with documents before printing. XeroxQ's AR preview allows users to see exactly how documents will look in real-world contexts, make adjustments in 3D space, and ensure perfect output before committing to print. This reduces waste and improves satisfaction." },
      { type: "h2", text: "Voice-Activated Printing Services" },
      { type: "p", text: "Natural language processing is making printing as simple as speaking. XeroxQ's voice interface allows users to print documents, specify requirements, and manage complex workflows through natural conversation. The system understands context, preferences, and security requirements automatically." },
      { type: "h2", text: "Drone Delivery and Autonomous Logistics" },
      { type: "p", text: "Autonomous delivery systems are eliminating the final mile problem in document delivery. XeroxQ's drone network can deliver printed documents within 30 minutes across major cities, while autonomous vehicles handle bulk deliveries with perfect reliability and tracking." },
      { type: "h2", text: "The 2030 Vision: Fully Autonomous Document Ecosystem" },
      { type: "p", text: "By 2030, XeroxQ envisions a fully autonomous document ecosystem where AI handles all optimization, quantum security protects all data, blockchain verifies all transactions, and autonomous systems manage all logistics. Human intervention will be limited to creative decisions and strategic oversight." }
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
                          <div className="w-10 h-10 rounded-xl bg-cyan-500 flex items-center justify-center">
                             <Cpu className="w-5 h-5 text-white" />
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

                 <div className="p-6 bg-cyan-50 rounded-xl border border-cyan-200 space-y-4">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500 border border-cyan-600 flex items-center justify-center shadow-sm">
                       <Cpu className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-[11px] text-cyan-700 font-black uppercase tracking-tight leading-relaxed">
                       INNOVATION LEADER: AI-powered printing with quantum security and autonomous delivery by 2030.
                    </p>
                 </div>
              </div>
            </aside>

            <div className="lg:col-span-9 max-w-3xl">
              <div className="space-y-12 text-left">
                <div className="space-y-6">
                   <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 rounded-md border border-cyan-500/20">
                      <Cpu className="w-3.5 h-3.5 text-cyan-600" />
                      <span className="text-[10px] font-black tracking-[0.2em] text-cyan-700 uppercase">{post.category}</span>
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

                <div className="mt-20 p-8 bg-cyan-50 rounded-xl border border-cyan-200 relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                       <div className="w-14 h-14 shrink-0 rounded-lg bg-cyan-500 border border-cyan-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                          <ShieldCheck className="w-8 h-8 text-white" />
                       </div>
                       <div className="space-y-3 text-left flex-1">
                          <h4 className="text-xl font-bold text-cyan-800 tracking-tight leading-none uppercase">EXPERIENCE FUTURE OF PRINTING</h4>
                          <p className="text-[13px] text-cyan-700 font-medium leading-relaxed">Join the printing revolution with AI-powered processing, quantum security, and autonomous delivery.</p>
                          <button className="mt-4 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-black text-[10px] uppercase tracking-widest rounded-md transition-all active:scale-95">
                             TRY FUTURE PRINTING
                          </button>
                       </div>
                    </div>
                 </div>

                <div className="flex items-center justify-between pt-16 border-t border-[#E2E8F0]">
                   <button className="group flex flex-col gap-2 items-start text-left">
                      <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Previous Article</span>
                      <span className="text-base font-bold text-black tracking-tight group-hover:underline">Data Privacy Nightmare</span>
                   </button>
                   <button className="group flex flex-col gap-2 items-end text-right">
                      <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Next Article</span>
                      <span className="text-base font-bold text-black tracking-tight group-hover:underline">Manual vs Automated Printing</span>
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
