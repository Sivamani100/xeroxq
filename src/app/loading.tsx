"use client";

import { motion } from "framer-motion";

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-[9999] bg-white/80 backdrop-blur-sm flex items-center justify-center pointer-events-none">
      <div className="flex flex-col items-center gap-4">
        {/* Modern multi-dot loading sequence */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2.5 h-2.5 bg-slate-900 rounded-full"
              animate={{
                y: ["0%", "-100%", "0%"],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.15,
              }}
            />
          ))}
        </div>
        <p className="text-[11px] font-bold tracking-[0.1em] text-slate-400 uppercase">Loading</p>
      </div>
    </div>
  );
}
