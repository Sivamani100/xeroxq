"use client";

import { Printer } from "lucide-react";
import { ThemeToggle } from "@/lib/theme";
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
  historyCount?: number;
  onHistoryOpen?: () => void;
}

export default function PortalHeader({ shop }: Props) {
  const isOpen = shop.is_open !== false;
  const isTrial = shop.approval_status !== "approved";
  const filesLeft = Math.max(0, 3 - (shop.total_files_processed ?? 0));

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full",
        "bg-white/92 dark:bg-[#19191B]/95 backdrop-blur-xl",
        "border-b border-[#171717]/[0.08] dark:border-white/[0.08]"
      )}
    >
      <div className="max-w-lg sm:max-w-xl mx-auto px-3.5 sm:px-4 h-[60px] flex items-center justify-between gap-3">
        {/* Left: Brand Red App Icon + Shop Identity */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="shrink-0 w-10 h-10 rounded-xl bg-[#FB432C] flex items-center justify-center shadow-xs text-white"
            aria-hidden="true"
          >
            <Printer className="w-5 h-5" strokeWidth={2} />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="font-bold text-[#171717] dark:text-[#EDEDED] text-[16px] leading-tight truncate">
                {shop.name}
              </h1>
              {isTrial && (
                <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-[#FB432C]/10 text-[#FB432C] border border-[#FB432C]/20 tabular-nums">
                  {filesLeft} free {filesLeft === 1 ? "print" : "prints"}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={cn(
                  "inline-flex rounded-full h-2 w-2",
                  isOpen ? "bg-[#16A34A] dark:bg-[#4CC38A]" : "bg-[#DC2626] dark:bg-[#E5484D]"
                )}
              />
              <span
                className={cn(
                  "text-[12px] font-medium leading-none",
                  isOpen ? "text-[#525252] dark:text-[#A1A1A6]" : "text-[#DC2626] dark:text-[#E5484D]"
                )}
              >
                {isOpen ? "Open now · Ready to print" : "Closed right now"}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Clean Theme Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle compact showLabel={false} />
        </div>
      </div>
    </header>
  );
}
