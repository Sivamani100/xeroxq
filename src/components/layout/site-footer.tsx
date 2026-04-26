"use client";

import { Printer, Mail, Send, Activity, ShieldCheck, Globe, Users, ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import React from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

export function SiteFooter() {
  const router = useRouter();

  const footerLinks = {
    Platform: [
      { name: "How it Works", href: "/how-it-works" },
      { name: "Shop Locator", href: "/shops" },
      { name: "Support Hub", href: "/support" },
      { name: "Quality Assurance", href: "/quality" }
    ],
    Network: [
      { name: "Partner Program", href: "/partners" },
      { name: "AP Shop Registry", href: "/register" },
      { name: "Developer Tools", href: "/docs" },
      { name: "Status Map", href: "/status" }
    ],
    About: [
      { name: "Our Story", href: "/about" },
      { name: "Vision", href: "/vision" },
      { name: "Careers", href: "/careers" },
      { name: "News", href: "/news" }
    ],
    Privacy: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Data Protection", href: "/data" },
      { name: "Security", href: "/security" }
    ]
  };

  const socials = [
    { 
      name: "GitHub", 
      href: "https://github.com/xeroxq", 
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 group-hover:scale-110 transition-transform">
          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
        </svg>
      )
    },
    { 
      name: "X", 
      href: "#", 
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 group-hover:scale-110 transition-transform">
          <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932L18.901 1.153zM17.61 20.644h2.039L6.486 3.24H4.298l13.312 17.404z" />
        </svg>
      )
    },
    { 
      name: "LinkedIn", 
      href: "#", 
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 group-hover:scale-110 transition-transform">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
          <rect width="4" height="12" x="2" y="9" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      )
    },
    { 
      name: "Telegram", 
      href: "#", 
      icon: <Send className="w-5 h-5 group-hover:scale-110 transition-transform" strokeWidth={1.5} /> 
    }
  ];

  return (
    <motion.footer 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.1
          }
        }
      }}
      className="py-24 bg-black border-t border-zinc-900 relative z-[100] overflow-hidden"
    >
      {/* Background Decorative Mesh Fade */}
      <div className="absolute inset-0 z-0 opacity-[0.1] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 100% 100%, #FB432C 0%, transparent 40%)' }} />
      
      <div className="max-w-[1280px] mx-auto px-6 relative z-10 text-white">
        
        {/* Top: Newsletter / Subscription High-Fidelity */}
        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
          }}
          className="flex flex-col lg:flex-row items-center justify-between gap-12 pb-16 mb-16 border-b border-zinc-900"
        >
           <div className="space-y-5 max-w-lg text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/5 rounded-full">
                 <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                 <span className="text-sm font-semibold text-white tracking-tight leading-none">For Xerox Shop Owners</span>
              </div>
              <h3 className="text-3xl font-bold text-white tracking-tighter uppercase leading-[1.1]">Join the XeroxQ <br /> Network in AP today.</h3>
           </div>
           
           <div className="w-full max-w-md space-y-6">
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  const email = (e.currentTarget.elements.namedItem("email") as HTMLInputElement).value;
                  try {
                    const { error } = await supabase.from("newsletter_subs").insert({ email });
                    if (error) throw error;
                    alert("Mercury Protocol: Registration successful! Welcome to the network.");
                    (e.target as HTMLFormElement).reset();
                  } catch (err) {
                    console.error("Newsletter Failure:", err);
                    alert("System Alert: Registration failed. You might already be in our network!");
                  }
                }}
                className="flex flex-col sm:flex-row p-1.5 bg-zinc-950 border border-zinc-800 rounded-[2rem] sm:rounded-full focus-within:border-white/20 focus-within:ring-4 focus-within:ring-white/[0.02] transition-all gap-2 sm:gap-0"
              >
                 <input 
                   name="email"
                   type="email" 
                   required
                   placeholder="Enter your email" 
                   className="flex-1 bg-transparent border-none outline-none px-6 py-4 sm:py-0 text-sm font-medium text-white tracking-tight placeholder:text-zinc-700"
                 />
                  <button type="submit" className="h-12 sm:h-10 px-8 bg-[#FB432C] text-white rounded-full font-bold text-sm transition-all duration-300 shadow-xl shadow-brand-primary/20 hover:bg-white hover:text-black hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap">
                     Register Shop
                  </button>
              </form>
              <p className="text-sm font-normal text-zinc-400 tracking-tight text-center lg:text-left px-6">
                 Join 1,200+ shop owners. No joining fees. Grow your business safely.
              </p>
           </div>
        </motion.div>

        {/* Middle: Brand & Links Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-16">
          <motion.div 
            variants={{
              hidden: { opacity: 0, x: -20 },
              visible: { opacity: 1, x: 0, transition: { duration: 0.8 } }
            }}
            className="lg:col-span-4 space-y-8 text-left"
          >
            <div 
              className="flex items-center group cursor-pointer w-fit invert brightness-0" 
              onClick={() => router.push('/')}
            >
              <img 
                src="/xeroxqlogo.svg" 
                alt="XeroxQ" 
                className="h-12 w-auto transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            <p className="text-base font-medium text-zinc-400 leading-relaxed max-w-sm">
              "Empowering Xerox Shop Owners across Andhra Pradesh with modern printing technology."
            </p>
            
            {/* Social Grid */}
            <div className="flex items-center gap-3">
              {socials.map((social, i) => (
                <a 
                  key={i}
                  href={social.href} 
                  title={social.name}
                  className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-[#FB432C] hover:text-white hover:shadow-xl hover:shadow-brand-primary/20 transition-all duration-500 group text-white"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </motion.div>

          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-12 text-left pt-2">
            {Object.entries(footerLinks).map(([category, links]) => (
              <motion.div 
                key={category} 
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                }}
                className="flex flex-col"
              >
                <span className="text-base font-bold text-white tracking-[0.2em] mb-[10px]">{category}</span>
                <ul className="space-y-[8px]">
                  {links.map(link => (
                    <li key={link.name}>
                      <button 
                        onClick={() => router.push(link.href)}
                        className="group flex items-center gap-2 text-base font-medium text-zinc-400 hover:text-white transition-all tracking-tight whitespace-nowrap"
                      >
                        {link.name} 
                        <ArrowUpRight className="w-5 h-5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-brand-primary" strokeWidth={2} />
                      </button>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom: Legal & Status Bar */}
        <motion.div 
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { duration: 0.8, delay: 0.4 } }
          }}
          className="pt-10 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8"
        >
          <div className="space-y-2 text-center md:text-left order-2 md:order-1">
            <p className="text-base font-medium text-zinc-500 tracking-tight leading-none">© 2026 XeroxQ Labs. Empowering Shop Owners in AP.</p>
          </div>
        </motion.div>
      </div>
    </motion.footer>
  );
}
