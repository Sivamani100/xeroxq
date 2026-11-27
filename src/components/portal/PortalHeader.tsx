"use client";

import { motion, AnimatePresence } from "framer-motion";
import { History } from "lucide-react";
import cn from "@/lib/utils";

interface Shop {
  id: string;
  name: string;
  slug: string;
  upi_id?: string;
  price_mono?: number;
  price_color?: number;
  is_open?: boolean;
  require_customer_name?: boolean;
  show_copies?: boolean;
  show_color_mode?: boolean;
  show_duplex?: boolean;
  generate_token?: boolean;
  accept_preorders?: boolean;
  contact_number?: string;
  feedback_enabled?: boolean;
  custom_feedback_enabled?: boolean;
  custom_feedback_title?: string;
  total_files_processed?: number;
  approval_status?: string;
  is_active?: boolean;
}

interface Props {
  shop: Shop;
  historyCount: number;
  onHistoryOpen: () => void;
}

const SPRING = { type: "spring" as const, stiffness: 380, damping: 30 };

export default function PortalHeader({ shop, historyCount, onHistoryOpen }: Props) {
  const isOpen = shop.is_open !== false;
  const isTrial = shop.approval_status !== "approved";
  const filesLeft = Math.max(0, 3 - (shop.total_files_processed ?? 0));

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full",
        "bg-white/80 backdrop-blur-2xl backdrop-saturate-150",
        "border-b border-black/[0.06]"
      )}
    >
      <div className="max-w-xl mx-auto px-4 h-[62px] flex items-center justify-between gap-3">
        {/* Left: Real XeroxQ App Icon + Shop Identity */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              "shrink-0 w-10 h-10 rounded-[13px] bg-white p-1.5",
              "border border-black/[0.07]",
              "shadow-[0_2px_10px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)]",
              "flex items-center justify-center overflow-hidden"
            )}
          >
            <img
              src="/logo_color.png"
              alt="XeroxQ"
              className="w-full h-full object-contain select-none"
            />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="font-bold text-[#111827] text-[15px] leading-tight truncate">
                {shop.name}
              </h1>
              {isTrial && (
                <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
                  {filesLeft} free {filesLeft === 1 ? "print" : "prints"} left
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="relative flex h-1.5 w-1.5">
                {isOpen && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34C759] opacity-60" />
                )}
                <span
                  className={cn(
                    "relative inline-flex rounded-full h-1.5 w-1.5",
                    isOpen ? "bg-[#34C759]" : "bg-[#FF3B30]"
                  )}
                />
              </span>
              <span
                className={cn(
                  "text-[11px] font-medium leading-none",
                  isOpen ? "text-[#6B7280]" : "text-[#DC2626]"
                )}
              >
                {isOpen ? "Open now · Ready to print" : "Closed right now"}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Clean History Capsule */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          transition={SPRING}
          onClick={onHistoryOpen}
          className={cn(
            "shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
            "bg-[#F2F2F7] hover:bg-[#E5E5EA] active:bg-[#DCDCE0]",
            "border border-black/[0.04]",
            "text-[#111827] text-[13px] font-semibold transition-colors"
          )}
          aria-label="View upload history"
        >
          <History className="w-3.5 h-3.5 text-[#6B7280]" strokeWidth={2.2} />
          <span>History</span>
          <AnimatePresence>
            {historyCount > 0 && (
              <motion.span
                key="history-badge"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={SPRING}
                className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#111827] text-white text-[10px] font-bold leading-none tabular-nums"
              >
                {historyCount > 99 ? "99+" : historyCount}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </header>
  );
}
