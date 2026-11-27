"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, AlertTriangle, X, Crop } from "lucide-react";
import { StagedFile, isImageFile, formatFileSize } from "@/lib/file-utils";
import cn from "@/lib/utils";

interface Props {
  files: StagedFile[];
  onRemove: (id: string) => void;
  onCropRequest: (id: string, dataUrl: string) => void;
}

const SPRING = { type: "spring" as const, stiffness: 380, damping: 30 };

function getDocBadge(name: string): {
  label: string;
  bg: string;
  text: string;
} {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, { label: string; bg: string; text: string }> = {
    pdf: { label: "PDF", bg: "bg-[#FEE2E2]", text: "text-[#DC2626]" },
    docx: { label: "DOC", bg: "bg-[#DBEAFE]", text: "text-[#2563EB]" },
    doc: { label: "DOC", bg: "bg-[#DBEAFE]", text: "text-[#2563EB]" },
    pptx: { label: "PPT", bg: "bg-[#FFEDD5]", text: "text-[#EA580C]" },
    ppt: { label: "PPT", bg: "bg-[#FFEDD5]", text: "text-[#EA580C]" },
    xlsx: { label: "XLS", bg: "bg-[#DCFCE7]", text: "text-[#16A34A]" },
    xls: { label: "XLS", bg: "bg-[#DCFCE7]", text: "text-[#16A34A]" },
    csv: { label: "CSV", bg: "bg-[#F3F4F6]", text: "text-[#4B5563]" },
  };
  return (
    map[ext] ?? {
      label: (ext || "FILE").slice(0, 4).toUpperCase(),
      bg: "bg-[#F2F2F7]",
      text: "text-[#4B5563]",
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
  onCropRequest: (id: string, dataUrl: string) => void;
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

  const handleCrop = useCallback(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) onCropRequest(file.id, dataUrl);
    };
    reader.readAsDataURL(file.file);
  }, [file, onCropRequest]);

  return (
    <motion.div
      layout
      key={file.id}
      initial={{ y: 8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ x: -16, opacity: 0 }}
      transition={SPRING}
      className="px-4 py-3 flex items-center gap-3"
    >
      {/* Thumbnail (for images) OR crisp iOS document icon */}
      {isImage && file.previewUrl ? (
        <div className="shrink-0 w-11 h-11 rounded-[12px] overflow-hidden bg-[#F2F2F7] border border-black/[0.08] shadow-xs">
          <img
            src={file.previewUrl}
            alt={file.file.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div
          className={cn(
            "shrink-0 w-11 h-11 rounded-[12px] flex items-center justify-center border border-black/[0.04]",
            badge.bg
          )}
        >
          <span className={cn("text-[11px] font-extrabold tracking-tight", badge.text)}>
            {badge.label}
          </span>
        </div>
      )}

      {/* Name + size + pages */}
      <div className="flex-1 min-w-0">
        <p
          className="text-[13.5px] font-semibold text-[#111827] leading-snug truncate"
          title={file.file.name}
        >
          {file.file.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5 text-[11.5px] text-[#6B7280]">
          <span>{formatFileSize(file.file.size)}</span>
          <span className="text-black/20">·</span>
          {file.pageCountStatus === "detecting" ? (
            <span className="inline-flex items-center gap-1 text-[#3568FF]">
              <Loader2 className="w-3 h-3 animate-spin" />
              Checking pages…
            </span>
          ) : file.pageCountStatus === "error" ? (
            <span className="inline-flex items-center gap-1 text-amber-600">
              <AlertTriangle className="w-3 h-3" />1 page
            </span>
          ) : (
            <span className="font-medium text-[#111827]">
              {file.pageCount} {file.pageCount === 1 ? "page" : "pages"}
            </span>
          )}
        </div>
      </div>

      {/* Crop pill (images only) */}
      {isImage && (
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          transition={SPRING}
          onClick={handleCrop}
          className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11.5px] font-semibold text-[#111827] bg-[#F2F2F7] hover:bg-[#E5E5EA] transition-colors"
          aria-label="Crop or rotate photo"
        >
          <Crop className="w-3 h-3 text-[#3568FF]" />
          Crop
        </motion.button>
      )}

      {/* Remove trigger */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.9 }}
        transition={SPRING}
        onClick={handleRemoveClick}
        aria-label={confirmDelete ? "Confirm remove file" : "Remove file"}
        className={cn(
          "shrink-0 flex items-center justify-center rounded-full text-xs font-semibold transition-colors",
          confirmDelete
            ? "bg-[#FF3B30] text-white px-2.5 py-1.5 shadow-xs"
            : "bg-[#F2F2F7] text-[#6B7280] w-7 h-7 hover:bg-red-50 hover:text-[#FF3B30]"
        )}
      >
        {confirmDelete ? "Sure?" : <X className="w-3.5 h-3.5" strokeWidth={2.3} />}
      </motion.button>
    </motion.div>
  );
}

export default function StagedFileList({ files, onRemove, onCropRequest }: Props) {
  if (files.length === 0) return null;

  return (
    <div className="w-full rounded-[22px] bg-white/95 backdrop-blur-2xl border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden divide-y divide-black/[0.05]">
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
    </div>
  );
}
