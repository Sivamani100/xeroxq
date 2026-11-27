"use client";

import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Image as ImageIcon, Lock, Plus, Upload, Zap } from "lucide-react";
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
  error,
}: Props) {
  const docInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const openDocsPicker = () => {
    if (!disabled) docInputRef.current?.click();
  };

  const openPhotosPicker = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) photoInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length > 0) onFilesAdded(picked);
    e.target.value = "";
  };

  const hasFiles = files.length > 0;

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Main Apple-style frosted upload card */}
      <motion.div
        layout
        onClick={openDocsPicker}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        animate={{ scale: isDragging ? 1.015 : 1 }}
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
          "bg-white/95 backdrop-blur-2xl",
          "border transition-all duration-200",
          hasFiles ? "rounded-[22px] p-3.5" : "rounded-[28px] p-3",
          !isDragging &&
            !error &&
            "border-black/[0.06] shadow-[0_12px_36px_-8px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.95)]",
          isDragging &&
            "border-[#3568FF] shadow-[0_0_0_4px_rgba(53,104,255,0.14),0_16px_40px_rgba(53,104,255,0.12)]",
          error &&
            !isDragging &&
            "border-[#EF4444]/60 shadow-[0_0_0_3px_rgba(239,68,68,0.10)]",
          disabled && "pointer-events-none"
        )}
      >
        {/* Disabled frosted overlay */}
        <AnimatePresence>
          {disabled && (
            <motion.div
              key="closed-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-white/85 backdrop-blur-md z-20 px-6 text-center rounded-[inherit]"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#F2F2F7] border border-black/[0.06] flex items-center justify-center mb-2.5">
                {disabledReason === "trial" ? (
                  <Zap className="w-5 h-5 text-amber-500" />
                ) : (
                  <Lock className="w-5 h-5 text-[#6B7280]" />
                )}
              </div>
              <span className="font-bold text-[#111827] text-sm">
                {disabledReason === "trial"
                  ? "Shop test limit reached"
                  : disabledReason === "busy"
                  ? "Sending your files…"
                  : "This shop is closed right now"}
              </span>
              <span className="text-xs text-[#6B7280] mt-1">
                {disabledReason === "trial"
                  ? "This new shop can take more prints after verification."
                  : disabledReason === "busy"
                  ? "Please wait a moment."
                  : "Please check back when the shop opens."}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Compact 1-bar layout when files are already staged */}
        {hasFiles ? (
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-[13px] bg-[#F2F2F7] flex items-center justify-center shrink-0">
                <Plus className="w-5 h-5 text-[#111827]" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-[#111827] leading-tight">
                  Add more files
                </p>
                <p className="text-[11px] text-[#6B7280] truncate">
                  {isDragging
                    ? "Drop here to add"
                    : "PDF, Word, Slides, or Photos"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={openPhotosPicker}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#111827] text-xs font-semibold transition-colors"
              >
                <ImageIcon className="w-3.5 h-3.5 text-[#3568FF]" />
                Photos
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openDocsPicker();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-semibold shadow-xs transition-opacity hover:opacity-95"
                style={{
                  background: "linear-gradient(135deg, #FB432C 0%, #FF591E 100%)",
                }}
              >
                <FileText className="w-3.5 h-3.5" />
                Files
              </button>
            </div>
          </div>
        ) : (
          /* Full Apple / macOS Empty Upload Sheet */
          <div
            className={cn(
              "rounded-[22px] px-5 py-7 sm:py-8 flex flex-col items-center text-center transition-colors duration-200",
              isDragging
                ? "bg-[#3568FF]/[0.05] border-2 border-dashed border-[#3568FF]"
                : "bg-[#F9F9FB] border border-dashed border-black/[0.11] hover:border-black/[0.20]"
            )}
          >
            {/* Fanned mini document & photo stack */}
            <div className="relative h-16 w-28 mb-4 flex items-center justify-center">
              {/* Left tilted DOCX chip card */}
              <motion.div
                animate={{
                  rotate: isDragging ? -16 : -10,
                  x: isDragging ? -22 : -14,
                  y: isDragging ? -2 : 2,
                }}
                transition={SPRING}
                className="absolute w-11 h-14 rounded-[11px] bg-white border border-black/[0.07] shadow-[0_4px_12px_rgba(0,0,0,0.06)] flex flex-col items-center justify-center gap-1"
              >
                <div className="w-5 h-1 rounded-full bg-[#3568FF]/30" />
                <div className="w-6 h-1 rounded-full bg-[#3568FF]/20" />
                <span className="text-[8px] font-extrabold text-[#3568FF] tracking-wider mt-0.5">
                  DOC
                </span>
              </motion.div>

              {/* Right tilted Image card */}
              <motion.div
                animate={{
                  rotate: isDragging ? 16 : 10,
                  x: isDragging ? 22 : 14,
                  y: isDragging ? -2 : 2,
                }}
                transition={SPRING}
                className="absolute w-11 h-14 rounded-[11px] bg-white border border-black/[0.07] shadow-[0_4px_12px_rgba(0,0,0,0.06)] flex flex-col items-center justify-center gap-1"
              >
                <ImageIcon className="w-4 h-4 text-emerald-500" />
                <span className="text-[8px] font-extrabold text-emerald-600 tracking-wider">
                  IMG
                </span>
              </motion.div>

              {/* Center hero PDF / Upload card */}
              <motion.div
                animate={{
                  y: isDragging ? -4 : 0,
                  scale: isDragging ? 1.06 : 1,
                }}
                transition={SPRING}
                className="relative z-10 w-12 h-15 rounded-[13px] bg-white border border-black/[0.08] shadow-[0_8px_20px_rgba(0,0,0,0.09)] flex flex-col items-center justify-center gap-1"
              >
                <div
                  className="w-7 h-7 rounded-[9px] flex items-center justify-center"
                  style={{
                    background: isDragging
                      ? "#3568FF"
                      : "linear-gradient(135deg, #FB432C 0%, #FF591E 100%)",
                  }}
                >
                  <Upload className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-[8px] font-extrabold text-[#111827] tracking-wider">
                  PDF
                </span>
              </motion.div>
            </div>

            {/* Clear action prompt */}
            <h2 className="text-[16px] font-bold text-[#111827] tracking-tight">
              {isDragging ? "Drop here to add your files" : "Choose what you want to print"}
            </h2>
            <p className="text-[12.5px] text-[#6B7280] mt-1 max-w-[290px] leading-relaxed">
              Works with PDF, Word, PowerPoint, Excel &amp; Photos (up to 25 MB)
            </p>

            {/* Dual native quick-picker buttons */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 w-full">
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={(e) => {
                  e.stopPropagation();
                  openDocsPicker();
                }}
                className={cn(
                  "inline-flex items-center justify-center gap-2 px-5 h-10 rounded-full",
                  "text-white text-[13px] font-semibold",
                  "shadow-[0_6px_20px_rgba(251,67,44,0.28),inset_0_1px_0_rgba(255,255,255,0.25)]",
                  "transition-opacity hover:opacity-95"
                )}
                style={{
                  background: "linear-gradient(135deg, #FB432C 0%, #FF591E 100%)",
                }}
              >
                <FileText className="w-3.5 h-3.5" strokeWidth={2.3} />
                Pick File
              </motion.button>

              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={openPhotosPicker}
                className={cn(
                  "inline-flex items-center justify-center gap-2 px-4 h-10 rounded-full",
                  "bg-white hover:bg-[#F2F2F7] text-[#111827] text-[13px] font-semibold",
                  "border border-black/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
                  "transition-colors"
                )}
              >
                <ImageIcon className="w-3.5 h-3.5 text-[#3568FF]" strokeWidth={2.2} />
                Pick Photo
              </motion.button>
            </div>
          </div>
        )}

        {/* Hidden document + photo pickers */}
        <input
          ref={docInputRef}
          type="file"
          accept={ACCEPT_DOCS_ATTR}
          multiple
          className="sr-only"
          onChange={handleInputChange}
          tabIndex={-1}
        />
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={handleInputChange}
          tabIndex={-1}
        />
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
            className="rounded-2xl bg-red-50 border border-red-200/70 px-3.5 py-2.5 text-[12.5px] font-medium text-red-600 flex items-center gap-2"
          >
            <span>⚠</span>
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
