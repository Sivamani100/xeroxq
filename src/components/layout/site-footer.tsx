"use client";

import { Printer, Mail, Send, Activity } from "lucide-react";
import { useRouter } from "next/navigation";

export function SiteFooter() {
  const router = useRouter();

  const footerLinks = {
    Solutions: [
      { name: "Enterprise", href: "/enterprise" },
      { name: "Integrations", href: "/integrations" },
      { name: "Use Cases", href: "/use-cases" },
      { name: "Case Studies", href: "/case-studies" }
    ],
    Support: [
      { name: "Help Center", href: "/help-center" },
      { name: "Demo Request", href: "/demo-request" },
      { name: "Global Shops", href: "/shops" },
      { name: "Community", href: "/community" }
    ],
    Company: [
      { name: "About Us", href: "/community" },
      { name: "Careers", href: "/careers" },
      { name: "Partners", href: "/partners" },
      { name: "Blog", href: "/blog" }
    ],
    Legal: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Use", href: "/terms" },
      { name: "Cookie Policy", href: "/cookies" },
      { name: "Security", href: "/privacy#security" }
    ]
  };

  return (
    <footer className="py-24 bg-white border-t border-[#E2E8F0] relative z-[100]">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-16 mb-8">
          <div className="space-y-8 max-w-sm">
            <div 
              className="flex items-center gap-3 group cursor-pointer" 
              onClick={() => router.push('/')}
            >
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-black/10">
                <Printer className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tighter text-black">XeroxQ</span>
            </div>
            <p className="text-[#64748B] font-medium leading-relaxed">
              The high-fidelity protocol for secure document delivery. Distributed, encrypted, and built for a privacy-centric future.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://github.com/xeroxq" target="_blank" className="w-10 h-10 rounded-lg border border-[#E2E8F0] flex items-center justify-center hover:bg-black hover:text-white transition-all group shadow-sm bg-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 group-hover:scale-110 transition-transform">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-lg border border-[#E2E8F0] flex items-center justify-center hover:bg-black hover:text-white transition-all group shadow-sm bg-white">
                 <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 group-hover:scale-110 transition-transform">
                    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932L18.901 1.153zM17.61 20.644h2.039L6.486 3.24H4.298l13.312 17.404z" />
                 </svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-lg border border-[#E2E8F0] flex items-center justify-center hover:bg-black hover:text-white transition-all group shadow-sm bg-white">
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 group-hover:scale-110 transition-transform">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect width="4" height="12" x="2" y="9" />
                    <circle cx="4" cy="4" r="2" />
                 </svg>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 lg:gap-24 text-left">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category} className="space-y-5">
                <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.3em]">{category}</span>
                <ul className="space-y-3">
                  {links.map(link => (
                    <li key={link.name}>
                      <button 
                        onClick={() => router.push(link.href)}
                        className="text-[12px] font-bold text-[#64748B] hover:text-black transition-colors uppercase tracking-tight"
                      >
                        {link.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-8 border-t border-[#E2E8F0] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-1">
            <p className="text-[13px] font-bold text-[#94A3B8] uppercase tracking-widest">© 2026 XeroxQ Labs. Built for the privacy era.</p>
            <p className="text-[10px] font-medium text-[#94A3B8] uppercase tracking-[0.1em]">All trademarks belong to their respective owners.</p>
          </div>
          <div className="flex items-center gap-8">
            <button 
              onClick={() => router.push('/help-center')}
              className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] hover:brightness-110 transition-all bg-emerald-500/5 px-4 py-1.5 rounded-lg border border-emerald-500/10 shadow-sm"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> All Systems Operational
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
