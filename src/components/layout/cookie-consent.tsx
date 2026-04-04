"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted/declined
    const consent = localStorage.getItem("xeroxq_cookie_consent");
    if (!consent) {
      // Delay showing the banner for a better UX
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

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
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="fixed bottom-6 left-6 right-6 z-[2000] flex justify-center pointer-events-none"
        >
          <div className="w-full max-w-[500px] pointer-events-auto bg-black/80 backdrop-blur-2xl border border-white/10 rounded-[24px] p-6 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)]">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center shrink-0">
                <Cookie className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Cookie Protocol</h3>
                <p className="text-[12px] font-medium text-slate-400 leading-relaxed italic">
                  "XeroxQ uses cookies to maintain your print terminal state and secure your session logic. No document contents are tracked."
                </p>
                <div className="flex items-center gap-3 pt-3">
                  <Button 
                    onClick={handleAccept}
                    className="h-9 px-6 bg-white text-black hover:bg-[#F8FAFC] font-black text-[10px] uppercase tracking-widest rounded-lg transition-all"
                  >
                    Accept All
                  </Button>
                  <Button 
                    variant="ghost"
                    onClick={handleDecline}
                    className="h-9 px-6 text-slate-400 hover:text-white hover:bg-white/5 font-black text-[10px] uppercase tracking-widest rounded-lg transition-all"
                  >
                    Decline
                  </Button>
                  <button 
                    onClick={() => setIsVisible(false)}
                    className="ml-auto p-1.5 text-slate-500 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
