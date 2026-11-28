"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Hammer, AlertTriangle } from "lucide-react";
import { ThemeToggle } from "@/lib/theme";

export default function MaintenancePage() {
  const [estimatedTime, setEstimatedTime] = useState("15 minutes");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    // Simulate countdown updates
    const interval = setInterval(() => {
      setEstimatedTime(prev => {
        const minutes = parseInt(prev);
        if (minutes > 5) return `${minutes - 1} minutes`;
        if (minutes > 1) return `${minutes - 1} minutes`;
        return "1 minute";
      });
    }, 60000); // Update every minute

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#111113] text-[#171717] dark:text-[#EDEDED] flex items-center justify-center p-6 relative">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle compact />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="max-w-md w-full rounded-[20px] bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] p-8 relative z-10 text-center"
      >
        {/* Icon */}
        <div className="w-16 h-16 bg-[#F4F4F5] dark:bg-[#232325] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Hammer className="w-7 h-7 text-[#FB432C]" />
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/15 border border-amber-500/25 rounded-full mb-5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-300" />
          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">Maintenance</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-semibold text-[#171717] dark:text-[#EDEDED] tracking-tight leading-tight mb-4">
          Site Under Maintenance
        </h1>

        {/* Description */}
        <p className="text-sm text-[#525252] dark:text-[#A1A1A6] leading-relaxed mb-6">
          We&apos;re performing system updates to keep your print queue fast and reliable.
          We&apos;ll be back shortly.
        </p>

        {/* Estimated Time */}
        <div className="bg-[#F4F4F5] dark:bg-[#232325] rounded-xl p-4 mb-6 border border-[#171717]/[0.06] dark:border-white/[0.08]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-[#737373] dark:text-[#85858B]">
              Estimated Time
            </span>
            <span className="text-sm text-[#171717] dark:text-[#EDEDED] font-semibold">{estimatedTime}</span>
          </div>
          <div className="text-[11px] text-[#737373] dark:text-[#85858B]">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>

        {/* Status Indicators */}
        <div className="space-y-3 mb-7 text-xs">
          <div className="flex items-center justify-between font-medium text-[#525252] dark:text-[#A1A1A6]">
            <span>System Status</span>
            <span className="text-amber-600 dark:text-amber-300 font-semibold">Updating...</span>
          </div>
          <div className="flex items-center justify-between font-medium text-[#525252] dark:text-[#A1A1A6]">
            <span>Security Protocol</span>
            <span className="text-[#16A34A] dark:text-[#4CC38A] font-semibold">Active</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-[#FB432C] hover:bg-[#E03923] text-white rounded-xl py-3 font-semibold text-sm transition-colors mb-5 cursor-pointer"
        >
          Check Status Now
        </button>

        {/* Support Info */}
        <div className="border-t border-[#171717]/[0.08] dark:border-white/[0.08] pt-5">
          <p className="text-xs text-[#737373] dark:text-[#85858B] mb-1">
            Need immediate assistance?
          </p>
          <a
            href="mailto:support@xeroxq.com"
            className="text-xs font-semibold text-[#171717] dark:text-[#EDEDED] underline hover:no-underline"
          >
            Contact Support Team
          </a>
        </div>
      </motion.div>
    </div>
  );
}
