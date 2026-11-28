"use client";

import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Lock, Plus, Upload, Zap } from "lucide-react";
import { StagedFile } from "@/lib/file-utils";
import cn from "@/lib/utils";

interface Props {
  files: StagedFile[];
  isDragging: boolean;
  disabled?: boolean;
  disabledReason?: "closed" | "trial" | "busy" | null;
  onFilesAdded: (files: File[]) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onOpenDocsPicker?: () => void;
  error?: string | null;
}

const ACCEPT_DOCS_ATTR = [
  ".pdf",
  ".docx",
  ".doc",
  ".pptx",
  ".ppt",
  ".xlsx",
  ".xls",
  ".csv",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "image/*",
].join(",");

const SPRING = { type: "spring" as const, stiffness: 380, damping: 30 };

export default function PortalDropzone({
  files,
  isDragging,
  disabled,
  disabledReason,
  onFilesAdded,
  onDragOver,
  onDragLeave,
  onDrop,
  onOpenDocsPicker,
  error,
}: Props) {
  const docInputRef = useRef<HTMLInputElement>(null);

  const openDocsPicker = () => {
    if (disabled) return;
    if (onOpenDocsPicker) {
      onOpenDocsPicker();
    } else {
      docInputRef.current?.click();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length > 0) onFilesAdded(picked);
    e.target.value = "";
  };

  const hasFiles = files.length > 0;

  return (
    <div className={cn("flex flex-col gap-2 w-full", !hasFiles && "flex-1")}>
      {/* Main Upload Dropzone Card */}
      <motion.div
        layout
        onClick={openDocsPicker}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        animate={{ scale: isDragging ? 1.012 : 1 }}
        transition={SPRING}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openDocsPicker();
          }
        }}
        aria-label="Choose documents or photos to print"
        className={cn(
          "relative overflow-hidden cursor-pointer select-none",
          "transition-colors duration-200",
          hasFiles
            ? "rounded-2xl bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] p-2.5"
            : "flex-1 min-h-[195px] flex flex-col items-center justify-center rounded-[22px] border-[1.5px] border-dashed px-5 py-6 sm:py-7 text-center",
          !hasFiles &&
            !isDragging &&
            !error &&
            "border-[#FB432C]/40 bg-[#FFF5F4] dark:bg-[#19191B] hover:border-[#FB432C]/75",
          !hasFiles &&
            isDragging &&
            "border-[#FB432C] bg-[#FB432C]/[0.08]",
          hasFiles &&
            isDragging &&
            "border-[#FB432C] bg-[#FB432C]/[0.04]",
          error &&
            !isDragging &&
            "border-[#DC2626]/70 dark:border-[#E5484D]/70",
          disabled && "pointer-events-none",
          disabled && disabledReason === "busy" && "opacity-60"
        )}
      >
        {/* Disabled overlay (closed/trial only — never blur-cover during fast upload) */}
        <AnimatePresence>
          {disabled && disabledReason !== "busy" && (
            <motion.div
              key="closed-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-white/92 dark:bg-[#19191B]/92 backdrop-blur-sm z-20 px-6 text-center rounded-[inherit]"
            >
              <div className="w-11 h-11 rounded-xl bg-[#F4F4F5] dark:bg-[#232325] border border-[#171717]/[0.08] dark:border-white/[0.08] flex items-center justify-center mb-2.5">
                {disabledReason === "trial" ? (
                  <Zap className="w-5 h-5 text-[#FB432C]" strokeWidth={1.75} />
                ) : (
                  <Lock className="w-5 h-5 text-[#737373] dark:text-[#85858B]" strokeWidth={1.75} />
                )}
              </div>
              <span className="font-semibold text-[#171717] dark:text-[#EDEDED] text-[14px]">
                {disabledReason === "trial"
                  ? "Shop test limit reached"
                  : "This shop is closed right now"}
              </span>
              <span className="text-[12px] text-[#525252] dark:text-[#A1A1A6] mt-1">
                {disabledReason === "trial"
                  ? "This new shop can take more prints after verification."
                  : "Please check back when the shop opens."}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Compact drop strip when files are already staged */}
        {hasFiles ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-[#FB432C]/35 dark:border-[#FB432C]/40 bg-[#FFF5F4]/60 dark:bg-[#232325] px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#FB432C] flex items-center justify-center shrink-0 text-white">
                <Plus className="w-4 h-4" strokeWidth={2.25} />
              </div>
              <div className="min-w-0 text-left">
                <p className="text-[13px] font-semibold text-[#171717] dark:text-[#EDEDED] leading-tight">
                  {isDragging ? "Drop to add files" : "Add more files"}
                </p>
                <p className="text-[11.5px] text-[#737373] dark:text-[#85858B] truncate">
                  Tap here or drop PDFs, Office docs &amp; photos
                </p>
              </div>
            </div>
            <span className="shrink-0 text-[11px] font-semibold text-[#FB432C]">
              + Browse
            </span>
          </div>
        ) : (
          /* Empty Centered Hero Dropzone matching mockup */
          <div className="flex flex-col items-center text-center">
            {/* Fanned sheets + bold red upload tile */}
            <div className="relative h-16 w-28 mb-4 flex items-center justify-center">
              <motion.div
                animate={{
                  rotate: isDragging ? -16 : -10,
                  x: isDragging ? -18 : -12,
                  y: isDragging ? -2 : 1,
                }}
                transition={SPRING}
                className="absolute w-11 h-14 rounded-xl bg-white dark:bg-[#232325] border border-[#171717]/[0.08] dark:border-white/[0.10] shadow-xs"
              />
              <motion.div
                animate={{
                  rotate: isDragging ? 16 : 10,
                  x: isDragging ? 18 : 12,
                  y: isDragging ? -2 : 1,
                }}
                transition={SPRING}
                className="absolute w-11 h-14 rounded-xl bg-white dark:bg-[#232325] border border-[#171717]/[0.08] dark:border-white/[0.10] shadow-xs"
              />
              <motion.div
                animate={{
                  y: isDragging ? -3 : 0,
                  scale: isDragging ? 1.05 : 1,
                }}
                transition={SPRING}
                className="relative z-10 w-12 h-12 rounded-xl bg-[#FB432C] flex items-center justify-center shadow-md shadow-[#FB432C]/25 translate-x-2 translate-y-1"
              >
                <Upload className="w-5 h-5 text-white" strokeWidth={2.25} />
              </motion.div>
            </div>

            <h2 className="text-[18px] font-bold text-[#171717] dark:text-[#EDEDED] tracking-tight">
              {isDragging ? "Drop here to add your files" : "Drop files here to upload"}
            </h2>
            <p className="text-[12.5px] text-[#525252] dark:text-[#A1A1A6] mt-1 leading-relaxed">
              PDF, Word, PowerPoint, Excel, or Photos
              <br />
              <span className="text-[11.5px] text-[#737373] dark:text-[#85858B]">
                Up to 25 MB per file
              </span>
            </p>

            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={(e) => {
                e.stopPropagation();
                openDocsPicker();
              }}
              className="mt-5 inline-flex items-center justify-center gap-2 px-7 h-11 rounded-full bg-[#FB432C] hover:bg-[#E03923] text-white text-[14px] font-semibold shadow-sm shadow-[#FB432C]/25 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" strokeWidth={2.25} />
              <span>Choose Files</span>
            </motion.button>
          </div>
        )}

        {/* Fallback hidden document picker when parent doesn't supply onOpenDocsPicker */}
        {!onOpenDocsPicker && (
          <input
            ref={docInputRef}
            type="file"
            accept={ACCEPT_DOCS_ATTR}
            multiple
            className="sr-only"
            onChange={handleInputChange}
            tabIndex={-1}
          />
        )}
      </motion.div>

      {/* Inline validation error */}
      <AnimatePresence>
        {error && (
          <motion.div
            key="dropzone-error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl bg-[#DC2626]/[0.06] dark:bg-[#E5484D]/15 border border-[#DC2626]/20 dark:border-[#E5484D]/25 px-3.5 py-2.5 text-[12.5px] font-medium text-[#DC2626] dark:text-[#E5484D] flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
