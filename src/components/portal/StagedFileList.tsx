"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, AlertTriangle, X, Crop, Sparkles, LayoutGrid } from "lucide-react";
import { StagedFile, isImageFile, formatFileSize } from "@/lib/file-utils";
import cn from "@/lib/utils";

interface Props {
  files: StagedFile[];
  onRemove: (id: string) => void;
  onCropRequest: (
    id: string,
    dataUrl: string,
    presetHint?: "id_card" | "a4" | "free",
    fileName?: string
  ) => void;
  onCombineImages?: (layout: "id_two_up" | "one_per_page") => Promise<void> | void;
  isCombining?: boolean;
}

const SPRING = { type: "spring" as const, stiffness: 380, damping: 30 };

function getDocBadge(name: string): {
  label: string;
  bg: string;
  text: string;
} {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, { label: string; bg: string; text: string }> = {
    pdf: { label: "PDF", bg: "bg-[#DC2626]/10 dark:bg-[#E5484D]/15", text: "text-[#DC2626] dark:text-[#E5484D]" },
    docx: { label: "DOC", bg: "bg-blue-500/10 dark:bg-blue-500/15", text: "text-blue-600 dark:text-blue-400" },
    doc: { label: "DOC", bg: "bg-blue-500/10 dark:bg-blue-500/15", text: "text-blue-600 dark:text-blue-400" },
    pptx: { label: "PPT", bg: "bg-[#FB432C]/10 dark:bg-[#FB432C]/15", text: "text-[#FB432C]" },
    ppt: { label: "PPT", bg: "bg-[#FB432C]/10 dark:bg-[#FB432C]/15", text: "text-[#FB432C]" },
    xlsx: { label: "XLS", bg: "bg-[#16A34A]/10 dark:bg-[#4CC38A]/15", text: "text-[#16A34A] dark:text-[#4CC38A]" },
    xls: { label: "XLS", bg: "bg-[#16A34A]/10 dark:bg-[#4CC38A]/15", text: "text-[#16A34A] dark:text-[#4CC38A]" },
    csv: { label: "CSV", bg: "bg-[#F4F4F5] dark:bg-[#232325]", text: "text-[#525252] dark:text-[#A1A1A6]" },
  };
  return (
    map[ext] ?? {
      label: (ext || "FILE").slice(0, 4).toUpperCase(),
      bg: "bg-[#F4F4F5] dark:bg-[#232325]",
      text: "text-[#525252] dark:text-[#A1A1A6]",
    }
  );
}

function FileRow({
  file,
  onRemove,
  onCropRequest,
}: {
  file: StagedFile;
  onRemove: (id: string) => void;
  onCropRequest: Props["onCropRequest"];
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const isImage = isImageFile(file.file);
  const badge = getDocBadge(file.file.name);

  const handleRemoveClick = () => {
    if (confirmDelete) {
      if (timer) clearTimeout(timer);
      onRemove(file.id);
    } else {
      setConfirmDelete(true);
      const t = setTimeout(() => setConfirmDelete(false), 3000);
      setTimer(t);
    }
  };

  // Always open the cropper from the full uncropped originalFile if available so users can re-adjust margins
  const handleCrop = useCallback(() => {
    const sourceFile = file.originalFile ?? file.file;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        onCropRequest(file.id, dataUrl, file.presetHint, file.file.name);
      }
    };
    reader.readAsDataURL(sourceFile);
  }, [file, onCropRequest]);

  return (
    <motion.div
      layout
      key={file.id}
      initial={{ y: 8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ x: -16, opacity: 0 }}
      transition={SPRING}
      className="px-3.5 sm:px-4 py-3.5 sm:py-4 flex items-center gap-3 w-full min-w-0"
    >
      {/* Thumbnail (tap to adjust on images) OR crisp document icon */}
      {isImage && file.previewUrl ? (
        <button
          type="button"
          onClick={handleCrop}
          title="Tap to crop or adjust"
          className="shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-[#F4F4F5] dark:bg-[#232325] border border-[#171717]/[0.08] dark:border-white/[0.10] hover:border-[#FB432C] transition-colors cursor-pointer"
        >
          <img
            src={file.previewUrl}
            alt={file.file.name}
            className="w-full h-full object-cover"
          />
        </button>
      ) : (
        <div
          className={cn(
            "shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border border-[#171717]/[0.06] dark:border-white/[0.06]",
            badge.bg
          )}
        >
          <span className={cn("text-[11px] font-semibold tracking-tight", badge.text)}>
            {badge.label}
          </span>
        </div>
      )}

      {/* Name + size + pages + auto-crop + detected color badge */}
      <div className="flex-1 min-w-0">
        <p
          className="text-[13.5px] font-medium text-[#171717] dark:text-[#EDEDED] leading-snug truncate"
          title={file.file.name}
        >
          {file.file.name}
        </p>
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-0.5 text-[12px] text-[#737373] dark:text-[#85858B] tabular-nums">
          <span>{formatFileSize(file.file.size)}</span>
          <span className="opacity-40">·</span>
          {file.pageCountStatus === "detecting" ? (
            <span className="inline-flex items-center gap-1 text-[#FB432C]">
              <Loader2 className="w-3 h-3 animate-spin" />
              Checking...
            </span>
          ) : file.pageCountStatus === "error" ? (
            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-3 h-3" />1 page
            </span>
          ) : (
            <span className="font-medium text-[#171717] dark:text-[#EDEDED]">
              {file.pageCount} {file.pageCount === 1 ? "page" : "pages"}
            </span>
          )}
          {file.detectedColor !== undefined && (
            <>
              <span className="opacity-40">·</span>
              <span className={file.detectedColor ? "font-medium text-[#FB432C]" : "font-medium text-[#525252] dark:text-[#A1A1A6]"}>
                {file.detectedColor ? "Color" : "B&W"}
              </span>
            </>
          )}
          {isImage && file.autoCropped && (
            <>
              <span className="opacity-40">·</span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-[#16A34A] dark:text-[#4CC38A]">
                <Sparkles className="w-3 h-3" />
                Auto-cropped
              </span>
            </>
          )}
        </div>
      </div>

      {/* Crop & Adjust button (images only) */}
      {isImage && (
        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          transition={SPRING}
          onClick={handleCrop}
          className="shrink-0 inline-flex items-center gap-1 px-2.5 h-7 rounded-lg text-[12px] font-medium text-[#171717] dark:text-[#EDEDED] bg-[#F4F4F5] dark:bg-[#232325] hover:bg-[#E4E4E7] dark:hover:bg-white/[0.10] border border-[#171717]/[0.06] dark:border-white/[0.08] transition-colors cursor-pointer"
          aria-label="Crop, rotate or enhance photo"
        >
          <Crop className="w-3 h-3 text-[#FB432C]" strokeWidth={1.75} />
          <span>Adjust</span>
        </motion.button>
      )}

      {/* Remove trigger */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.92 }}
        transition={SPRING}
        onClick={handleRemoveClick}
        aria-label={confirmDelete ? "Confirm remove file" : "Remove file"}
        className={cn(
          "shrink-0 flex items-center justify-center rounded-lg text-[12px] font-medium transition-colors cursor-pointer",
          confirmDelete
            ? "bg-[#DC2626] text-white px-2.5 h-7"
            : "bg-[#F4F4F5] dark:bg-[#232325] text-[#737373] dark:text-[#85858B] w-7 h-7 hover:bg-[#DC2626]/10 hover:text-[#DC2626] dark:hover:text-[#E5484D]"
        )}
      >
        {confirmDelete ? "Remove?" : <X className="w-3.5 h-3.5" strokeWidth={2} />}
      </motion.button>
    </motion.div>
  );
}

export default function StagedFileList({
  files,
  onRemove,
  onCropRequest,
  onCombineImages,
  isCombining,
}: Props) {
  if (files.length === 0) return null;

  const imageCount = files.filter((f) => isImageFile(f.file)).length;

  return (
    <div className="w-full rounded-2xl bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] overflow-hidden divide-y divide-[#171717]/[0.06] dark:divide-white/[0.06]">
      <AnimatePresence initial={false}>
        {files.map((file) => (
          <FileRow
            key={file.id}
            file={file}
            onRemove={onRemove}
            onCropRequest={onCropRequest}
          />
        ))}
      </AnimatePresence>

      {/* Quick A4 Aadhaar/ID Sheet & Photo Merge Action (when 2+ images staged) */}
      {imageCount >= 2 && onCombineImages && (
        <div className="px-4 py-2.5 bg-[#FAFAFA] dark:bg-[#232325] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#525252] dark:text-[#A1A1A6]">
            <LayoutGrid className="w-3.5 h-3.5 text-[#FB432C]" strokeWidth={1.75} />
            <span>Combine photos or ID cards into one sheet?</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={isCombining}
              onClick={() => onCombineImages("id_two_up")}
              className="px-2.5 h-7 rounded-lg bg-[#FB432C]/10 hover:bg-[#FB432C]/15 text-[#FB432C] text-[12px] font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isCombining ? "Building..." : "2-on-1 A4 ID Sheet"}
            </button>
            <button
              type="button"
              disabled={isCombining}
              onClick={() => onCombineImages("one_per_page")}
              className="px-2.5 h-7 rounded-lg bg-white dark:bg-[#19191B] border border-[#171717]/[0.10] dark:border-white/[0.10] hover:bg-[#F4F4F5] dark:hover:bg-white/[0.08] text-[#171717] dark:text-[#EDEDED] text-[12px] font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              Merge A4 PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
