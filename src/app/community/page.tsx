"use client";

import { motion } from "framer-motion";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { 
  Users, 
  Globe, 
  ShieldCheck, 
  Heart, 
  ArrowRight, 
  Network,
  MessageCircle,
  Printer,
  Users2,
  Code2,
  AtSign,
  Megaphone
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CommunityPage() {
  const values = [
    { title: "Privacy as a Right", desc: "Encryption isn't an option—it's the default state of the protocol. Your physical documents are strictly your business, nobody else's.", icon: ShieldCheck },
    { title: "Distributed Power", desc: "By decentralizing print shops, we remove single points of failure and surveillance, empowering local entrepreneurs with global protocol access.", icon: Network },
    { title: "Open Source Vision", desc: "The XeroxQ protocol is built by the community, for the community. Transparent code for a transparent world of document physicalization.", icon: Globe }
  ];

  const stats = [
    { value: "500+", label: "Verified Shop Nodes", sub: "across Andhra Pradesh" },
    { value: "26", label: "Districts Covered", sub: "in Phase 1" },
    { value: "99.9%", label: "Mesh Uptime", sub: "since launch" }
  ];

  const channels = [
    {
      title: "Discord Server",
      desc: "Real-time discussions with fellow developers, shop owners, and the core team. Get help, share feedback, and collaborate on protocol improvements.",
      members: "1,200+",
      icon: MessageCircle,
      color: "bg-indigo-500",
      cta: "Join Discord"
    },
    {
      title: "GitHub Repository",
      desc: "Browse the codebase, report issues, and submit pull requests. Every contribution strengthens the mesh for everyone.",
      members: "340+",
      icon: Code2,
      color: "bg-gray-800",
      cta: "View Repo"
    },
    {
      title: "Twitter / X",
      desc: "Follow us for real-time network status updates, product launches, and privacy-first thought leadership from the core team.",
      members: "5,600+",
      icon: AtSign,
      color: "bg-sky-500",
      cta: "Follow Us"
    }
  ];

  const voices = [
    {
      name: "Ravi K.",
      role: "Shop Owner, Guntur",
      quote: "XeroxQ doubled my daily footfall. Customers love the QR system—no more WhatsApp hassle.",
      initials: "RK"
    },
    {
      name: "Priya S.",
      role: "CS Student, Vijayawada",
      quote: "I contributed to the contrast-AI module as my first open-source PR. The mentorship from the core team was incredible.",
      initials: "PS"
    },
    {
      name: "Anand M.",
      role: "Field Affiliate, Visakhapatnam",
      quote: "Onboarded 30 shops in my district in 2 weeks. The partner program is genuinely rewarding.",
      initials: "AM"
    },
    {
      name: "Lakshmi R.",
      role: "Shop Owner, Tirupati",
      quote: "My customers feel safe printing Aadhaar and medical reports here now. That trust is priceless.",
      initials: "LR"
    }
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-sans selection:bg-[#FB432C] selection:text-white overflow-x-hidden">
      <SiteHeader />
      
      <main className="flex-1 pt-32 pb-0">
        
        {/* Community Hero */}
        <section className="relative pt-12 pb-16 text-center overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 0)', backgroundSize: '40px 40px' }} />
               
          <div className="max-w-[1280px] mx-auto px-6 relative z-10">
             <motion.div 
               variants={{
                 hidden: { opacity: 0, y: 20 },
                 visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
               }}
               initial="hidden"
               animate="visible"
               className="max-w-4xl mx-auto"
             >
               <div className="inline-flex items-center gap-2.5 px-4 h-8 rounded-full bg-black/5 border border-black/5 mb-8">
                 <Users2 className="w-3.5 h-3.5 text-black" />
                 <span className="text-[10px] font-bold text-black uppercase tracking-[0.2em] leading-none">The Community</span>
               </div>
               
               <h1 className="text-[50px] md:text-[80px] font-extrabold tracking-tighter text-black leading-[0.95] mb-6 uppercase">
                 A Growing Mesh <br /> Of Trust.
               </h1>
               <p className="text-lg md:text-xl font-medium text-gray-500 leading-relaxed italic max-w-2xl mx-auto">
                 XeroxQ is more than a protocol. It's a movement of developers, shopkeepers, and privacy advocates physicalizing the digital world across Andhra Pradesh.
               </p>
             </motion.div>
          </div>
        </section>

        {/* Live Stats Bar */}
        <section className="py-12 border-y border-gray-100 bg-white">
           <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {stats.map((stat, i) => (
                 <motion.div 
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="p-6 border border-gray-100 rounded-[24px] flex items-center justify-between group hover:border-[#FB432C]/30 hover:shadow-lg transition-all duration-300"
                 >
                    <div>
                       <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1 group-hover:text-[#FB432C] transition-colors">{stat.label}</span>
                       <span className="text-[11px] font-bold text-gray-400 italic">{stat.sub}</span>
                    </div>
                    <span className="text-3xl font-black text-black tracking-tight">{stat.value}</span>
                 </motion.div>
              ))}
           </div>
        </section>

        {/* Core Values */}
        <section className="py-24 bg-white relative z-20">
           <div className="max-w-[1280px] mx-auto px-6">
              <div className="text-center mb-16">
                 <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-black mb-4">What We Stand For</h2>
                 <p className="text-gray-500 font-medium">The principles that guide every line of code and every shop onboarded.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {values.map((value, i) => (
                    <motion.div 
                       key={value.title}
                       initial={{ opacity: 0, y: 30 }}
                       whileInView={{ opacity: 1, y: 0 }}
                       viewport={{ once: true }}
                       transition={{ delay: i * 0.15, duration: 0.5 }}
                       className="p-10 bg-[#F8FAFC] rounded-[32px] border border-gray-200 hover:border-black/10 hover:shadow-2xl hover:shadow-black/5 hover:-translate-y-2 transition-all duration-500 group text-center md:text-left"
                    >
                       <div className="w-16 h-16 rounded-[20px] bg-white border border-gray-100 flex items-center justify-center group-hover:scale-110 group-hover:bg-black transition-all duration-500 shadow-sm mx-auto md:mx-0 mb-8">
                          <div className="group-hover:invert transition-all duration-500 text-black">
                             <value.icon className="w-7 h-7" />
                          </div>
                       </div>
                       <h3 className="text-2xl font-black text-black tracking-tighter uppercase leading-none mb-3 group-hover:text-[#FB432C] transition-colors">{value.title}</h3>
                       <p className="text-[15px] text-gray-600 font-medium leading-relaxed">
                          {value.desc}
                       </p>
                    </motion.div>
                 ))}
              </div>
           </div>
        </section>

        {/* Community Channels */}
        <section className="py-32 bg-[#F8FAFC] border-y border-gray-100">
           <div className="max-w-[1280px] mx-auto px-6">
              <div className="text-center mb-20">
                 <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-black mb-4">Join The Conversation</h2>
                 <p className="text-gray-500 font-medium max-w-lg mx-auto">Connect with shopkeepers, developers, and affiliates building the secure printing future.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {channels.map((ch, i) => (
                    <motion.div
                       key={ch.title}
                       initial={{ opacity: 0, y: 30 }}
                       whileInView={{ opacity: 1, y: 0 }}
                       viewport={{ once: true }}
                       transition={{ delay: i * 0.15, duration: 0.6 }}
                       className="group bg-white p-10 rounded-[32px] border border-gray-200 hover:border-black hover:shadow-2xl hover:shadow-black/5 hover:-translate-y-2 transition-all duration-500 flex flex-col justify-between"
                    >
                       <div>
                          <div className="flex items-center justify-between mb-8">
                             <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-500", ch.color)}>
                                <ch.icon className="w-6 h-6" />
                             </div>
                             <span className="px-3 py-1.5 bg-gray-50 border border-gray-100 text-[10px] font-black text-gray-500 uppercase tracking-widest rounded-full">
                                {ch.members} Members
                             </span>
                          </div>
                          <h3 className="text-2xl font-black text-black tracking-tighter uppercase leading-none mb-4">{ch.title}</h3>
                          <p className="text-[14px] font-medium text-gray-500 leading-relaxed">
                             {ch.desc}
                          </p>
                       </div>
                       
                       <div className="mt-8 pt-6 border-t border-gray-100">
                          <button className="w-full h-14 bg-black hover:bg-[#FB432C] text-white font-bold text-[12px] uppercase tracking-widest rounded-xl transition-all duration-300 shadow-lg shadow-black/10 flex items-center justify-center gap-3">
                             {ch.cta} <ArrowRight className="w-4 h-4" />
                          </button>
                       </div>
                    </motion.div>
                 ))}
              </div>
           </div>
        </section>

        {/* Community Voices */}
        <section className="py-32 bg-white">
           <div className="max-w-[1280px] mx-auto px-6">
              <div className="text-center mb-20">
                 <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-black mb-4">Voices from the Mesh</h2>
                 <p className="text-gray-500 font-medium">Real stories from the people making XeroxQ possible, every single day.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {voices.map((voice, i) => (
                    <motion.div
                       key={i}
                       initial={{ opacity: 0, y: 20 }}
                       whileInView={{ opacity: 1, y: 0 }}
                       viewport={{ once: true }}
                       transition={{ delay: i * 0.1 }}
                       className="group p-10 rounded-[32px] border border-gray-200 hover:border-black/10 hover:shadow-2xl hover:shadow-black/5 transition-all duration-500 bg-white"
                    >
                       <p className="text-xl md:text-2xl font-bold text-black tracking-tight leading-snug mb-8 italic">
                          "{voice.quote}"
                       </p>
                       <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
                          <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-black text-sm tracking-tighter shrink-0">
                             {voice.initials}
                          </div>
                          <div>
                             <span className="font-bold text-black block text-sm">{voice.name}</span>
                             <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{voice.role}</span>
                          </div>
                       </div>
                    </motion.div>
                 ))}
              </div>
           </div>
        </section>

        {/* CTA Banner */}
        <section className="py-24 px-6 bg-[#F8FAFC] border-t border-gray-100">
           <div className="max-w-[1280px] mx-auto p-12 md:p-20 bg-black rounded-[40px] relative overflow-hidden group shadow-2xl text-center">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FB432C] opacity-[0.05] blur-[100px] rounded-full mix-blend-overlay pointer-events-none" />
              
              <div className="relative z-10 space-y-8 max-w-2xl mx-auto">
                 <div className="w-20 h-20 rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
                    <Heart className="w-10 h-10 text-[#FB432C]" />
                 </div>
                 <h2 className="text-4xl md:text-6xl font-extrabold text-white tracking-tighter leading-none uppercase">
                    Be Part of<br /> Something Real.
                 </h2>
                 <p className="text-lg text-gray-400 font-medium italic leading-relaxed max-w-lg mx-auto">
                    Whether you're a developer, a shop owner, or simply someone who believes your documents should stay private—there's a place for you here.
                 </p>
                 <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <button className="h-16 px-10 bg-white text-black hover:bg-[#FB432C] hover:text-white font-black text-[14px] uppercase tracking-widest rounded-[16px] transition-all duration-300 shadow-xl hover:-translate-y-1">
                       Join the Community
                    </button>
                    <button className="h-16 px-10 bg-white/10 border border-white/20 text-white hover:bg-white/20 font-bold text-[12px] uppercase tracking-widest rounded-[16px] transition-all backdrop-blur-sm">
                       Become a Partner
                    </button>
                 </div>
              </div>
           </div>
        </section>

      </main>

      <SiteFooter />
    </div>
  );
}
