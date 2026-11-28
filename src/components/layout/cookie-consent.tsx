"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";
import Link from "next/link";

export function CookieConsent() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 1. Don't show inside Electron desktop app
    if (typeof window !== "undefined" && (window as unknown as { electron?: unknown }).electron) {
      return;
    }

    // 2. Don't show on customer-side upload/portal pages (e.g. /s/shop-slug or /shop-slug)
    const isCustomerPage = 
      pathname.startsWith("/s/") || 
      (![
        "/", 
        "/login", 
        "/register", 
        "/about", 
        "/privacy", 
        "/terms", 
        "/cookies", 
        "/how-it-works", 
        "/help-center",
        "/contact",
        "/admin",
        "/platform-admin"
      ].includes(pathname) && !pathname.startsWith("/admin") && !pathname.startsWith("/platform-admin") && !pathname.startsWith("/auth"));

    if (isCustomerPage) return;

    // 3. Check if user already accepted/declined
    const consent = localStorage.getItem("xeroxq_cookie_consent");
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  const handleAccept = () => {
    localStorage.setItem("xeroxq_cookie_consent", "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("xeroxq_cookie_consent", "declined");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto z-[2000] max-w-[440px] pointer-events-auto"
        >
          <div className="bg-white dark:bg-[#19191B] border border-[#171717]/[0.10] dark:border-white/[0.10] rounded-2xl p-5 shadow-lg text-[#171717] dark:text-[#EDEDED] font-sans">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#171717] dark:bg-[#EDEDED] text-white dark:text-[#111113] flex items-center justify-center shrink-0">
                  <Cookie className="w-4 h-4" strokeWidth={1.75} />
                </div>
                <h4 className="text-[13px] font-semibold tracking-tight">
                  We use cookies
                </h4>
              </div>
              <button
                onClick={() => setIsVisible(false)}
                className="text-[#737373] dark:text-[#85858B] hover:text-[#171717] dark:hover:text-[#EDEDED] transition-colors p-1 -mr-1 -mt-1 rounded-md cursor-pointer"
                aria-label="Close cookie banner"
              >
                <X className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>

            <p className="text-[12px] text-[#525252] dark:text-[#A1A1A6] leading-relaxed mt-2.5 mb-4">
              We use essential cookies to manage authentication, maintain your session, and ensure platform security. Learn more in our{" "}
              <Link href="/privacy" className="text-[#171717] dark:text-[#EDEDED] font-medium underline underline-offset-2 hover:text-[#FB432C] transition-colors">
                Privacy Policy
              </Link>
              .
            </p>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleAccept}
                className="flex-1 h-9 bg-[#171717] dark:bg-[#EDEDED] hover:bg-[#262626] dark:hover:bg-white text-white dark:text-[#111113] text-[12px] font-medium rounded-lg transition-colors cursor-pointer"
              >
                Accept
              </button>
              <button
                onClick={handleDecline}
                className="flex-1 h-9 bg-[#F4F4F5] dark:bg-[#232325] hover:bg-[#E4E4E7] dark:hover:bg-white/[0.12] text-[#525252] dark:text-[#A1A1A6] hover:text-[#171717] dark:hover:text-[#EDEDED] border border-[#171717]/[0.10] dark:border-white/[0.10] text-[12px] font-medium rounded-lg transition-colors cursor-pointer"
              >
                Decline
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
