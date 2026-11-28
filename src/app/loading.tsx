"use client";

import { motion } from "framer-motion";

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#FAFAFA]/85 dark:bg-[#111113]/85 backdrop-blur-sm flex items-center justify-center pointer-events-none">
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2.5 h-2.5 bg-[#FB432C] rounded-full"
              animate={{
                y: ["0%", "-100%", "0%"],
                opacity: [0.35, 1, 0.35],
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
        <p className="text-[11px] font-semibold tracking-wider text-[#737373] dark:text-[#85858B] uppercase">Loading</p>
      </div>
    </div>
  );
}
