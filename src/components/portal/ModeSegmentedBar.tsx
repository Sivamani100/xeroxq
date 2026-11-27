"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Smartphone } from "lucide-react";
import cn from "@/lib/utils";

interface Props {
  mode: "shop" | "home";
  onChange: (m: "shop" | "home") => void;
  show: boolean;
}

const SPRING = { type: "spring" as const, stiffness: 420, damping: 32 };

const SEGMENTS: { key: "shop" | "home"; label: string; icon: React.ReactNode }[] = [
  { key: "shop", label: "At the Shop", icon: <MapPin className="w-3.5 h-3.5" /> },
  { key: "home", label: "Order Ahead", icon: <Smartphone className="w-3.5 h-3.5" /> },
];

export default function ModeSegmentedBar({ mode, onChange, show }: Props) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="seg-bar"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={SPRING}
          className="w-full"
        >
          <div
            className="relative flex items-center bg-[#E5E5EA]/85 rounded-full p-1 w-full border border-black/[0.04]"
            role="tablist"
            aria-label="Order mode"
          >
            {SEGMENTS.map((seg) => {
              const isActive = mode === seg.key;
              return (
                <button
                  key={seg.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => {
                    if (!isActive) onChange(seg.key);
                  }}
                  className={cn(
                    "relative flex-1 flex items-center justify-center gap-1.5",
                    "py-2 px-3 rounded-full z-10",
                    "text-[13px] font-semibold select-none transition-colors duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FB432C]/50",
                    isActive ? "text-[#111827]" : "text-[#6B7280] hover:text-[#111827]"
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="seg-pill"
                      transition={SPRING}
                      className="absolute inset-0 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] -z-10"
                    />
                  )}
                  {seg.icon}
                  <span>{seg.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
