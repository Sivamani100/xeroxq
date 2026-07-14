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
  Globe,
  Clock
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function BlogPost() {
  const router = useRouter();

  const post = {
    title: "Mesh Network Infrastructure: How XeroxQ's Decentralized Architecture is Revolutionizing Indian Printing",
    author: "XeroxQ Network Engineering Team",
    role: "Infrastructure & Protocol Architects",
    date: "May 08, 2026",
    readTime: "16 min",
    category: "Infrastructure",
    content: [
      { type: "p", text: "Traditional printing infrastructure relies on centralized servers, creating bottlenecks, security vulnerabilities, and single points of failure. XeroxQ has pioneered a decentralized mesh network architecture that eliminates these limitations, creating a resilient, scalable, and secure printing ecosystem across India. This revolutionary approach transforms how documents are processed, stored, and delivered, setting new standards for infrastructure design in the digital age." },
      { type: "h2", text: "The Problem with Centralized Printing Infrastructure" },
      { type: "p", text: "Centralized printing infrastructure suffers from multiple critical issues: single points of failure, bandwidth bottlenecks, security vulnerabilities, geographic limitations, scalability constraints, and high operational costs. When a central server goes down, entire printing networks become useless, affecting thousands of users." },
      { type: "h2", text: "XeroxQ's Decentralized Mesh Network Architecture" },
      { type: "p", text: "XeroxQ's mesh network consists of 500+ independent nodes across India, each capable of autonomous operation. Nodes communicate directly with each other, creating a resilient network that can function even when individual nodes or connections fail. This architecture ensures 99.99% uptime and infinite scalability." },
      { type: "h2", text: "How the Mesh Network Works" },
      { type: "p", text: "When a user sends a document, the mesh network automatically routes it to the optimal nearby node based on availability, load, and location. Nodes share capacity and resources dynamically, ensuring efficient utilization. If one node becomes unavailable, the network automatically reroutes to alternative nodes without user intervention." },
      { type: "h2", text: "Security Benefits of Decentralization" },
      { type: "p", text: "The mesh architecture enhances security through distributed processing, no central attack surface, local document storage, encrypted node-to-node communication, and automatic failover security. Even if a node is compromised, the network remains secure and operational." },
      { type: "h2", text: "Performance and Speed Advantages" },
      { type: "p", text: "Decentralization eliminates latency by processing documents locally. Users experience 5-minute processing times regardless of network load or geographic location. The mesh network automatically balances load, preventing congestion that plagues centralized systems." },
      { type: "h2", text: "Scalability and Growth Potential" },
      { type: "p", text: "The mesh network scales infinitely by adding new nodes. Each new node increases network capacity and coverage rather than consuming resources. XeroxQ can grow from 500 to 5,000 nodes without performance degradation, serving millions of users seamlessly." },
      { type: "h2", text: "Cost Efficiency of Mesh Architecture" },
      { type: "p", text: "Decentralized infrastructure reduces costs by 60-80% compared to centralized systems. There's no need for expensive data centers, dedicated bandwidth, or large maintenance teams. Each node operates independently, sharing infrastructure costs across the network." },
      { type: "h2", text: "The Future of Mesh Network Infrastructure" },
      { type: "p", text: "XeroxQ continues to advance mesh network technology with AI-powered routing, quantum-resistant encryption, autonomous node management, and predictive capacity planning. The future includes satellite connectivity, drone nodes, and integration with IoT devices for unprecedented coverage and capability." }
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
                          <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center">
                             <Globe className="w-5 h-5 text-white" />
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

                 <div className="p-6 bg-teal-50 rounded-xl border border-teal-200 space-y-4">
                    <div className="w-10 h-10 rounded-lg bg-teal-500 border border-teal-600 flex items-center justify-center shadow-sm">
                       <Globe className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-[11px] text-teal-700 font-black uppercase tracking-tight leading-relaxed">
                       NETWORK LEADER: 500+ decentralized nodes with 99.99% uptime and infinite scalability across India.
                    </p>
                 </div>
              </div>
            </aside>

            <div className="lg:col-span-9 max-w-3xl">
              <div className="space-y-12 text-left">
                <div className="space-y-6">
                   <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/10 rounded-md border border-teal-500/20">
                      <Globe className="w-3.5 h-3.5 text-teal-600" />
                      <span className="text-[10px] font-black tracking-[0.2em] text-teal-700 uppercase">{post.category}</span>
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

                <div className="mt-20 p-8 bg-teal-50 rounded-xl border border-teal-200 relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                       <div className="w-14 h-14 shrink-0 rounded-lg bg-teal-500 border border-teal-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                          <ShieldCheck className="w-8 h-8 text-white" />
                       </div>
                       <div className="space-y-3 text-left flex-1">
                          <h4 className="text-xl font-bold text-teal-800 tracking-tight leading-none uppercase">EXPERIENCE DECENTRALIZED PRINTING</h4>
                          <p className="text-[13px] text-teal-700 font-medium leading-relaxed">Join India's most resilient printing network with 500+ nodes, 99.99% uptime, and infinite scalability.</p>
                          <button className="mt-4 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-black text-[10px] uppercase tracking-widest rounded-md transition-all active:scale-95">
                             JOIN THE MESH NETWORK
                          </button>
                       </div>
                    </div>
                 </div>

                <div className="flex items-center justify-between pt-16 border-t border-[#E2E8F0]">
                   <button className="group flex flex-col gap-2 items-start text-left">
                      <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Previous Article</span>
                      <span className="text-base font-bold text-black tracking-tight group-hover:underline">Manual vs Automated Printing</span>
                   </button>
                   <button className="group flex flex-col gap-2 items-end text-right">
                      <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Next Article</span>
                      <span className="text-base font-bold text-black tracking-tight group-hover:underline">WhatsApp Privacy Hazard</span>
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
