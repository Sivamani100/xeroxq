"use client";

import { motion, AnimatePresence } from "framer-motion";
import { User, Phone, Minus, Plus, Palette, Copy, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
  mode: "shop" | "home";
  customerName: string;
  customerPhone: string;
  color: boolean;
  copies: number;
  doubleSided: boolean;
  totalPages: number;
  fileCount?: number;
  isPricingLoading: boolean;
  onNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onColorChange: (v: boolean) => void;
  onCopiesChange: (v: number) => void;
  onDoubleSidedChange: (v: boolean) => void;
}

const SPRING = { type: "spring" as const, stiffness: 420, damping: 32 };

function IconTile({
  bg,
  children,
}: {
  bg: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "shrink-0 w-7 h-7 rounded-[8px] flex items-center justify-center text-white shadow-xs",
        bg
      )}
    >
      {children}
    </span>
  );
}

function InlineSegmented({
  layoutId,
  options,
  value,
  onChange,
}: {
  layoutId: string;
  options: { key: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex items-center bg-[#F4F4F5] dark:bg-[#232325] rounded-lg p-0.5 border border-[#171717]/[0.06] dark:border-white/[0.06] shrink-0">
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={cn(
              "relative z-10 px-2.5 sm:px-3 py-1 rounded-md text-[11.5px] sm:text-[12px] font-medium transition-colors whitespace-nowrap cursor-pointer",
              active
                ? "text-[#171717] dark:text-[#EDEDED]"
                : "text-[#737373] dark:text-[#85858B] hover:text-[#171717] dark:hover:text-[#EDEDED]"
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={SPRING}
                className="absolute inset-0 rounded-md bg-white dark:bg-[#19191B] border border-[#171717]/[0.06] dark:border-white/[0.08] -z-10"
              />
            )}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default function PrintPreferencesDeck({
  shop,
  mode,
  customerName,
  customerPhone,
  color,
  copies,
  doubleSided,
  totalPages,
  fileCount,
  isPricingLoading,
  onNameChange,
  onPhoneChange,
  onColorChange,
  onCopiesChange,
  onDoubleSidedChange,
}: Props) {
  const showColorMode = shop.show_color_mode !== false;
  const showDuplex = shop.show_duplex !== false;
  const showCopies = shop.show_copies !== false;

  const sheetsPerCopy = doubleSided ? Math.ceil(totalPages / 2) : totalPages;
  const totalSheets = sheetsPerCopy * copies;

  return (
    <div className="w-full rounded-[16px] bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] shadow-[0_1px_2px_rgba(17,17,19,0.04)] overflow-hidden divide-y divide-[#171717]/[0.06] dark:divide-white/[0.07]">
      {/* 1. Customer Name — shown ONLY when enabled by the shopkeeper */}
      <AnimatePresence initial={false}>
        {shop.require_customer_name && (
          <motion.div
            key="name-row"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 flex items-center gap-3">
              <IconTile bg="bg-[#007AFF] dark:bg-[#2F7CF6]">
                <User className="w-3.5 h-3.5" strokeWidth={2} />
              </IconTile>
              <input
                id="customer-name"
                type="text"
                value={customerName}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="Your name (required)"
                className="flex-1 min-w-0 bg-transparent outline-none text-[14px] font-medium text-[#171717] dark:text-[#EDEDED] placeholder:text-[#737373] dark:placeholder:text-[#85858B]"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Phone input (Pre-Order mode only) */}
      <AnimatePresence initial={false}>
        {mode === "home" && (
          <motion.div
            key="phone-row"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 flex items-center gap-3">
              <IconTile bg="bg-[#16A34A] dark:bg-[#4CC38A]">
                <Phone className="w-3.5 h-3.5" strokeWidth={2} />
              </IconTile>
              <span className="text-[13px] font-medium text-[#525252] dark:text-[#A1A1A6] pr-2 border-r border-[#171717]/[0.10] dark:border-white/[0.10] select-none">
                +91
              </span>
              <input
                id="customer-phone"
                type="tel"
                inputMode="tel"
                value={customerPhone}
                onChange={(e) => onPhoneChange(e.target.value)}
                placeholder="Mobile number (for pickup update)"
                className="flex-1 min-w-0 bg-transparent outline-none text-[14px] font-medium text-[#171717] dark:text-[#EDEDED] placeholder:text-[#737373] dark:placeholder:text-[#85858B]"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Color Mode */}
      {showColorMode && (
        <div className="px-3.5 sm:px-4 py-3 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <IconTile bg="bg-[#FB432C]">
              <Palette className="w-3.5 h-3.5" strokeWidth={2} />
            </IconTile>
            <span className="text-[13.5px] sm:text-[14px] font-medium text-[#171717] dark:text-[#EDEDED]">Color</span>
          </div>
          <InlineSegmented
            layoutId="color-pill"
            options={[
              { key: "bw", label: "B&W" },
              { key: "color", label: "Color" },
            ]}
            value={color ? "color" : "bw"}
            onChange={(v) => onColorChange(v === "color")}
          />
        </div>
      )}

      {/* 4. Print Sides */}
      {showDuplex && (
        <div className="px-3.5 sm:px-4 py-3 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <IconTile bg="bg-[#5856D6] dark:bg-[#6E6CE8]">
              <BookOpen className="w-3.5 h-3.5" strokeWidth={2} />
            </IconTile>
            <span className="text-[13.5px] sm:text-[14px] font-medium text-[#171717] dark:text-[#EDEDED]">Sides</span>
          </div>
          <InlineSegmented
            layoutId="duplex-pill"
            options={[
              { key: "single", label: "One Side" },
              { key: "double", label: "Both Sides" },
            ]}
            value={doubleSided ? "double" : "single"}
            onChange={(v) => onDoubleSidedChange(v === "double")}
          />
        </div>
      )}

      {/* 5. Copies Stepper */}
      {showCopies && (
        <div className="px-3.5 sm:px-4 py-3 flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <IconTile bg="bg-[#D97706] dark:bg-[#F59E0B]">
              <Copy className="w-3.5 h-3.5" strokeWidth={2} />
            </IconTile>
            <span className="text-[13.5px] sm:text-[14px] font-medium text-[#171717] dark:text-[#EDEDED]">Copies</span>
          </div>
          <div className="inline-flex items-center gap-1 bg-[#F4F4F5] dark:bg-[#232325] rounded-full p-0.5 border border-[#171717]/[0.06] dark:border-white/[0.08]">
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={() => onCopiesChange(Math.max(1, copies - 1))}
              disabled={copies <= 1}
              aria-label="Decrease copies"
              className="w-7 h-7 rounded-full bg-white dark:bg-[#19191B] border border-[#171717]/[0.06] dark:border-white/[0.08] flex items-center justify-center text-[#171717] dark:text-[#EDEDED] disabled:opacity-35 transition-opacity"
            >
              <Minus className="w-3.5 h-3.5" strokeWidth={2} />
            </motion.button>
            <span className="w-8 text-center text-[13.5px] font-semibold text-[#171717] dark:text-[#EDEDED] tabular-nums select-none">
              {copies}
            </span>
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={() => onCopiesChange(Math.min(99, copies + 1))}
              disabled={copies >= 99}
              aria-label="Increase copies"
              className="w-7 h-7 rounded-full bg-white dark:bg-[#19191B] border border-[#171717]/[0.06] dark:border-white/[0.08] flex items-center justify-center text-[#171717] dark:text-[#EDEDED] disabled:opacity-35 transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            </motion.button>
          </div>
        </div>
      )}

      {/* Clean Summary Strip */}
      <div className="px-4 py-3 bg-[#F4F4F5]/70 dark:bg-[#141416] flex items-center justify-between text-[12.5px] text-[#525252] dark:text-[#A1A1A6]">
        {isPricingLoading ? (
          <Skeleton className="h-3.5 w-40 rounded-full" />
        ) : (
          <>
            <span className="font-medium">
              {fileCount ? `${fileCount} ${fileCount === 1 ? "file" : "files"} · ` : ""}
              {totalPages} {totalPages === 1 ? "page" : "pages"}
            </span>
            <span className="font-semibold text-[#171717] dark:text-[#EDEDED] tabular-nums">
              {totalSheets} {totalSheets === 1 ? "sheet" : "sheets"} to print
            </span>
          </>
        )}
      </div>
    </div>
  );
}
