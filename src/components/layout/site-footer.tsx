"use client";

import { Printer, Mail, Send, Activity, ShieldCheck, Globe, Users, ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import React from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

export function SiteFooter() {
  const router = useRouter();
  const [subMessage, setSubMessage] = React.useState<{ type: "ok" | "err"; text: string } | null>(null);

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
      { name: "Software Licenses", href: "/licenses" },
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
    <footer className="py-16 bg-[#FAFAFA] dark:bg-[#111113] border-t border-[#171717]/[0.08] dark:border-white/[0.08] relative z-20">
      <div className="max-w-6xl mx-auto px-6 text-[#171717] dark:text-[#EDEDED]">
        {/* Top: Newsletter */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 pb-12 mb-12 border-b border-[#171717]/[0.08] dark:border-white/[0.08]">
          <div className="space-y-2 max-w-md">
            <span className="text-[12px] font-medium text-[#FB432C]">For Xerox shop owners</span>
            <h3 className="text-[24px] font-semibold tracking-tight leading-snug">
              Join the XeroxQ print shop network.
            </h3>
          </div>

          <div className="w-full max-w-md space-y-2">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSubMessage(null);
                const form = e.currentTarget;
                const email = (form.elements.namedItem("email") as HTMLInputElement).value;
                try {
                  const { error } = await supabase.from("newsletter_subs").insert({ email });
                  if (error) throw error;
                  setSubMessage({ type: "ok", text: "Registered. We will keep you updated." });
                  form.reset();
                } catch (err) {
                  console.error("Newsletter Failure:", err);
                  setSubMessage({ type: "err", text: "Could not register this email. It may already be registered." });
                }
              }}
              className="flex flex-col sm:flex-row p-1.5 bg-white dark:bg-[#19191B] border border-[#171717]/[0.10] dark:border-white/[0.10] rounded-xl gap-2"
            >
              <input
                name="email"
                type="email"
                required
                placeholder="Enter your email"
                className="flex-1 bg-transparent border-none outline-none px-3.5 py-2 text-[13px] text-[#171717] dark:text-[#EDEDED] placeholder:text-[#737373] dark:placeholder:text-[#85858B]"
              />
              <button
                type="submit"
                className="h-9 px-4 bg-[#FB432C] hover:bg-[#E03923] text-white rounded-lg font-medium text-[13px] transition-colors whitespace-nowrap cursor-pointer"
              >
                Register shop
              </button>
            </form>
            {subMessage ? (
              <p className={cn("text-[12px] font-medium px-1", subMessage.type === "ok" ? "text-[#16A34A] dark:text-[#4CC38A]" : "text-[#DC2626] dark:text-[#E5484D]")}>
                {subMessage.text}
              </p>
            ) : (
              <p className="text-[12px] text-[#737373] dark:text-[#85858B] px-1">
                No joining fees. Instant counter QR setup.
              </p>
            )}
          </div>
        </div>

        {/* Middle: Brand & Links Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-12">
          <div className="lg:col-span-4 space-y-5 text-left">
            <button
              type="button"
              className="flex items-center gap-2.5 cursor-pointer w-fit"
              onClick={() => router.push('/')}
            >
              <img
                src="/logo_color.png"
                alt="XeroxQ"
                className="h-8 w-8 rounded-md object-contain"
              />
              <span className="text-[17px] font-semibold tracking-tight">XeroxQ</span>
            </button>
            <p className="text-[14px] text-[#525252] dark:text-[#A1A1A6] leading-relaxed max-w-xs">
              Privacy-first document sending and queue management built for local print shops.
            </p>

            <div className="flex items-center gap-2">
              {socials.map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  title={social.name}
                  className="w-9 h-9 rounded-lg bg-white dark:bg-[#19191B] border border-[#171717]/[0.10] dark:border-white/[0.10] flex items-center justify-center hover:border-[#FB432C] hover:text-[#FB432C] transition-colors text-[#525252] dark:text-[#A1A1A6]"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-left">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category} className="flex flex-col">
                <span className="text-[13px] font-semibold text-[#171717] dark:text-[#EDEDED] mb-3">{category}</span>
                <ul className="space-y-2">
                  {links.map(link => (
                    <li key={link.name}>
                      <button
                        type="button"
                        onClick={() => router.push(link.href)}
                        className="group inline-flex items-center gap-1 text-[13px] text-[#525252] dark:text-[#A1A1A6] hover:text-[#171717] dark:hover:text-[#EDEDED] transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <span>{link.name}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#FB432C]" strokeWidth={1.75} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-[#171717]/[0.08] dark:border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-[#737373] dark:text-[#85858B]">
            © 2026 XeroxQ Labs. Privacy-first printing.
          </p>
        </div>
      </div>
    </footer>
  );
}
