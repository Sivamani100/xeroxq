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
          {/* Light Theme Cookie Consent Dialog */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.12)] text-black font-sans">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Cookie className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-[13px] font-bold text-black tracking-tight">
                  We use cookies
                </h4>
              </div>
              <button
                onClick={() => setIsVisible(false)}
                className="text-[#7E8B9E] hover:text-black transition-colors p-1 -mr-1 -mt-1 rounded-md cursor-pointer"
                aria-label="Close cookie banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[12px] text-[#7E8B9E] font-medium leading-relaxed mt-2.5 mb-4">
              We use essential cookies to manage authentication, maintain your terminal session, and ensure platform security. Learn more in our{" "}
              <Link href="/privacy" className="text-black font-bold underline underline-offset-2 hover:text-blue-600 transition-colors">
                Privacy Policy
              </Link>
              .
            </p>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleAccept}
                className="flex-1 h-9 bg-black hover:bg-black/90 text-white text-[12px] font-bold rounded-lg transition-all shadow-sm cursor-pointer uppercase tracking-wider"
              >
                Accept
              </button>
              <button
                onClick={handleDecline}
                className="flex-1 h-9 bg-white hover:bg-[#F8FAFC] text-[#7E8B9E] hover:text-black border border-[#E2E8F0] text-[12px] font-bold rounded-lg transition-all cursor-pointer uppercase tracking-wider"
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
