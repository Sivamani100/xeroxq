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
    <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-slate-50 border border-slate-200 rounded-2xl p-8 flex flex-col items-center text-center shadow-sm"
      >
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>
        
        <h1 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h1>
        <p className="text-slate-500 text-sm mb-8 leading-relaxed">
          {error.message || "We encountered an unexpected error while loading this page. Our team has been notified."}
        </p>

        <button
          onClick={() => reset()}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl transition-all font-medium text-sm w-full justify-center"
        >
          <RefreshCcw className="w-4 h-4" />
          Try Again
        </button>
      </motion.div>
    </div>
  );
}
