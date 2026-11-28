"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { motion } from "framer-motion";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log to an external service here if scaling
    console.error("[XeroxQ] Global Error Boundary Caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen w-full bg-[#FAFAFA] dark:bg-[#111113] text-[#171717] dark:text-[#EDEDED] flex flex-col items-center justify-center p-6 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-2xl p-8 flex flex-col items-center text-center"
      >
        <div className="w-12 h-12 bg-[#DC2626]/10 dark:bg-[#E5484D]/15 rounded-full flex items-center justify-center mb-5">
          <AlertCircle className="w-6 h-6 text-[#DC2626] dark:text-[#E5484D]" />
        </div>

        <h1 className="text-xl font-semibold text-[#171717] dark:text-[#EDEDED] mb-2">Something went wrong</h1>
        <p className="text-[#525252] dark:text-[#A1A1A6] text-sm mb-7 leading-relaxed">
          {error.message || "We encountered an unexpected error while loading this page. Please try again."}
        </p>

        <button
          onClick={() => reset()}
          className="flex items-center gap-2 bg-[#FB432C] hover:bg-[#E03923] text-white px-6 py-3 rounded-xl transition-colors font-semibold text-sm w-full justify-center cursor-pointer"
        >
          <RefreshCcw className="w-4 h-4" />
          Try Again
        </button>
      </motion.div>
    </div>
  );
}
