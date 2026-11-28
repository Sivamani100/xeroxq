"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import {
  Check,
  CreditCard,
  Crop,
  FileText,
  FlipHorizontal2,
  Maximize2,
  RotateCcw,
  RotateCw,
  ScanLine,
  SlidersHorizontal,
  Sparkles,
  Square,
  UserSquare2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  detectDocumentBoundsFromImage,
  loadImageElement,
  renderTransformedImageDataUrl,
  type ImageFilterMode,
  type NormalizedCropRect,
} from "@/lib/image-auto-crop";

export interface ImageCropperProps {
  image: string;
  onCropComplete: (croppedImage: string) => void;
  onCancel: () => void;
  aspect?: number;
  initialCrop?: NormalizedCropRect;
  initialPreset?: string;
  fileName?: string;
}

type PresetId = "free" | "id_card" | "passport" | "a4" | "square";

const PRESETS: {
  id: PresetId;
  label: string;
  aspect?: number;
  icon: React.ReactNode;
}[] = [
  { id: "free", label: "Free", icon: <Maximize2 className="w-3.5 h-3.5" /> },
  {
    id: "id_card",
    label: "Aadhaar / ID",
    aspect: 85.6 / 54,
    icon: <CreditCard className="w-3.5 h-3.5" />,
  },
  {
    id: "passport",
    label: "Passport",
    aspect: 35 / 45,
    icon: <UserSquare2 className="w-3.5 h-3.5" />,
  },
  {
    id: "a4",
    label: "A4 Doc",
    aspect: 210 / 297,
    icon: <FileText className="w-3.5 h-3.5" />,
  },
  {
    id: "square",
    label: "Square",
    aspect: 1,
    icon: <Square className="w-3.5 h-3.5" />,
  },
];

const FILTERS: { id: ImageFilterMode; label: string }[] = [
  { id: "original", label: "Original" },
  { id: "id_boost", label: "ID Boost" },
  { id: "clear_doc", label: "Clean B&W" },
  { id: "vivid", label: "Vivid Photo" },
];

type DragHandle = "move" | "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w";

const MIN_BOX = 0.1;

function clampRect(r: NormalizedCropRect): NormalizedCropRect {
  const w = Math.max(MIN_BOX, Math.min(1, r.width));
  const h = Math.max(MIN_BOX, Math.min(1, r.height));
  const x = Math.max(0, Math.min(1 - w, r.x));
  const y = Math.max(0, Math.min(1 - h, r.y));
  return { x, y, width: w, height: h };
}

function fitAspectInsideBox(
  targetAspect: number,
  displayWidth: number,
  displayHeight: number
): NormalizedCropRect {
  const imgAspect = displayWidth / Math.max(1, displayHeight);
  let w: number;
  let h: number;
  if (targetAspect > imgAspect) {
    w = 0.88;
    h = (w * imgAspect) / targetAspect;
  } else {
    h = 0.88;
    w = (h * targetAspect) / imgAspect;
  }
  if (w > 0.94) {
    w = 0.94;
    h = (w * imgAspect) / targetAspect;
  }
  if (h > 0.94) {
    h = 0.94;
    w = (h * targetAspect) / imgAspect;
  }
  return clampRect({
    x: (1 - w) / 2,
    y: (1 - h) / 2,
    width: w,
    height: h,
  });
}

export function ImageCropper({
  image,
  onCropComplete,
  onCancel,
  aspect,
  initialCrop,
  initialPreset,
  fileName,
}: ImageCropperProps) {
  const [preset, setPreset] = useState<PresetId>(() => {
    if (aspect) return "free";
    if (
      initialPreset === "id_card" ||
      initialPreset === "a4" ||
      initialPreset === "passport" ||
      initialPreset === "square"
    ) {
      return initialPreset;
    }
    return "free";
  });

  const [cropRect, setCropRect] = useState<NormalizedCropRect>(
    initialCrop ?? { x: 0.04, y: 0.04, width: 0.92, height: 0.92 }
  );
  const [quarterTurns, setQuarterTurns] = useState(0); // 0, 90, 180, 270
  const [fineAngle, setFineAngle] = useState(0); // -45 to +45
  const [flipH, setFlipH] = useState(false);
  const [filterMode, setFilterMode] = useState<ImageFilterMode>("original");
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [showFineSliders, setShowFineSliders] = useState(false);

  const [rotatedPreviewUrl, setRotatedPreviewUrl] = useState<string>(image);
  const [imgDimensions, setImgDimensions] = useState<{ w: number; h: number }>({
    w: 800,
    h: 600,
  });
  const [autoBadge, setAutoBadge] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [detecting, setDetecting] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{
    handle: DragHandle;
    startClientX: number;
    startClientY: number;
    startRect: NormalizedCropRect;
    stageW: number;
    stageH: number;
  } | null>(null);

  const totalRotation = quarterTurns + fineAngle;
  const activeAspect =
    aspect ?? PRESETS.find((p) => p.id === preset)?.aspect ?? undefined;

  // Rebuild rotated preview whenever rotation or flip changes, and optionally run initial auto-detect
  const rebuildStagePreview = useCallback(
    async (runInitialDetect: boolean) => {
      try {
        const rendered = await renderTransformedImageDataUrl(image, {
          crop: { x: 0, y: 0, width: 1, height: 1 },
          rotationDeg: totalRotation,
          flipH,
          filter: "original",
        });
        const img = await loadImageElement(rendered);
        const w = img.naturalWidth || 800;
        const h = img.naturalHeight || 600;
        setImgDimensions({ w, h });
        setRotatedPreviewUrl(rendered);

        if (runInitialDetect && !initialCrop && !aspect) {
          const analysis = detectDocumentBoundsFromImage(img);
          if (analysis.wasAutoCropped) {
            setCropRect(analysis.rect);
            setAutoBadge("Smart edges detected — drag corners to adjust");
          } else {
            setCropRect({ x: 0, y: 0, width: 1, height: 1 });
          }
        }
      } catch {
        setRotatedPreviewUrl(image);
      }
    },
    [image, totalRotation, flipH, initialCrop, aspect]
  );

  const hasMountedRef = useRef(false);
  useEffect(() => {
    const first = !hasMountedRef.current;
    hasMountedRef.current = true;
    rebuildStagePreview(first);
  }, [rebuildStagePreview]);

  // Apply aspect constraint if fixed `aspect` prop passed
  useEffect(() => {
    if (aspect && imgDimensions.w > 0 && imgDimensions.h > 0) {
      setCropRect(fitAspectInsideBox(aspect, imgDimensions.w, imgDimensions.h));
    }
  }, [aspect, imgDimensions.w, imgDimensions.h]);

  const handleAutoDetect = async () => {
    if (detecting) return;
    setDetecting(true);
    try {
      const img = await loadImageElement(rotatedPreviewUrl);
      const analysis = detectDocumentBoundsFromImage(img);
      setPreset("free");
      if (analysis.wasAutoCropped) {
        setCropRect(analysis.rect);
        setAutoBadge(
          analysis.suggestedPreset === "id_card"
            ? "Auto-framed ID / Card — adjust corners anytime"
            : "Auto-framed document — adjust corners anytime"
        );
      } else {
        setCropRect({ x: 0.04, y: 0.04, width: 0.92, height: 0.92 });
        setAutoBadge("Already tight — drag any corner to trim");
      }
    } catch {
      /* ignore */
    } finally {
      setDetecting(false);
    }
  };

  const handleSelectPreset = (p: PresetId) => {
    setPreset(p);
    setAutoBadge(null);
    const found = PRESETS.find((item) => item.id === p);
    if (found?.aspect) {
      setCropRect(
        fitAspectInsideBox(found.aspect, imgDimensions.w, imgDimensions.h)
      );
    }
  };

  const handleReset = () => {
    setPreset("free");
    setQuarterTurns(0);
    setFineAngle(0);
    setFlipH(false);
    setFilterMode("original");
    setBrightness(100);
    setContrast(100);
    setAutoBadge(null);
    setCropRect({ x: 0, y: 0, width: 1, height: 1 });
  };

  // Pointer drag handlers for corner, edge, and move handles
  const beginDrag = (handle: DragHandle, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const box = stageRef.current?.getBoundingClientRect();
    if (!box || box.width < 10 || box.height < 10) return;

    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    dragStateRef.current = {
      handle,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startRect: { ...cropRect },
      stageW: box.width,
      stageH: box.height,
    };
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const st = dragStateRef.current;
      if (!st) return;

      const dx = (e.clientX - st.startClientX) / st.stageW;
      const dy = (e.clientY - st.startClientY) / st.stageH;
      const s = st.startRect;

      if (st.handle === "move") {
        setCropRect(
          clampRect({
            x: s.x + dx,
            y: s.y + dy,
            width: s.width,
            height: s.height,
          })
        );
        return;
      }

      let left = s.x;
      let top = s.y;
      let right = s.x + s.width;
      let bottom = s.y + s.height;

      if (st.handle.includes("w")) left = Math.max(0, Math.min(right - MIN_BOX, s.x + dx));
      if (st.handle.includes("e")) right = Math.min(1, Math.max(left + MIN_BOX, s.x + s.width + dx));
      if (st.handle.includes("n")) top = Math.max(0, Math.min(bottom - MIN_BOX, s.y + dy));
      if (st.handle.includes("s")) bottom = Math.min(1, Math.max(top + MIN_BOX, s.y + s.height + dy));

      let nextW = right - left;
      let nextH = bottom - top;

      // Enforce selected aspect preset if locked (not Free)
      if (activeAspect) {
        const displayRatio = st.stageW / Math.max(1, st.stageH);
        const normAspect = activeAspect / displayRatio; // normalized w / normalized h

        if (st.handle === "n" || st.handle === "s") {
          nextW = nextH * normAspect;
          const centerX = (left + right) / 2;
          left = centerX - nextW / 2;
          if (left < 0) left = 0;
          if (left + nextW > 1) {
            nextW = 1 - left;
            nextH = nextW / normAspect;
            if (st.handle === "n") top = bottom - nextH;
          }
        } else {
          nextH = nextW / normAspect;
          if (st.handle.includes("n")) {
            top = bottom - nextH;
            if (top < 0) {
              top = 0;
              nextH = bottom;
              nextW = nextH * normAspect;
              if (st.handle.includes("w")) left = right - nextW;
            }
          } else {
            if (top + nextH > 1) {
              nextH = 1 - top;
              nextW = nextH * normAspect;
              if (st.handle.includes("w")) left = right - nextW;
            }
          }
        }
      }

      setCropRect(
        clampRect({
          x: left,
          y: top,
          width: nextW,
          height: nextH,
        })
      );
    };

    const onUp = () => {
      dragStateRef.current = null;
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [activeAspect]);

  const handleApply = async () => {
    if (applying) return;
    setApplying(true);
    try {
      const output = await renderTransformedImageDataUrl(rotatedPreviewUrl, {
        crop: cropRect,
        rotationDeg: 0,
        filter: filterMode,
        brightness,
        contrast,
      });
      if (output) onCropComplete(output);
    } catch (e) {
      console.error("Crop apply error:", e);
    } finally {
      setApplying(false);
    }
  };

  // Live preview CSS filter matching export output
  const previewCssFilter =
    filterMode === "clear_doc"
      ? `grayscale(100%) brightness(${Math.round(brightness * 1.12)}%) contrast(${Math.round(
          contrast * 1.45
        )}%)`
      : filterMode === "id_boost"
      ? `brightness(${Math.round(brightness * 1.06)}%) contrast(${Math.round(
          contrast * 1.18
        )}%) saturate(118%)`
      : filterMode === "vivid"
      ? `brightness(${Math.round(brightness * 1.04)}%) contrast(${Math.round(
          contrast * 1.12
        )}%) saturate(130%)`
      : `brightness(${brightness}%) contrast(${contrast}%)`;

  const imgAspectRatio = imgDimensions.w / Math.max(1, imgDimensions.h);

  return (
    <Dialog open onOpenChange={() => onCancel()}>
      <DialogContent className="sm:max-w-[700px] max-h-[94dvh] overflow-y-auto p-0 border border-[#171717]/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#19191B] text-[#171717] dark:text-[#EDEDED] rounded-[24px] shadow-[0_24px_64px_rgba(0,0,0,0.28)]">
        <DialogHeader className="px-5 pt-5 pb-0">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="flex items-center gap-3 text-[18px] sm:text-[20px] font-semibold tracking-tight text-[#171717] dark:text-[#EDEDED] min-w-0">
              <div className="w-9 h-9 shrink-0 bg-[#FB432C] rounded-[10px] flex items-center justify-center">
                <Crop className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <span className="block leading-tight">Crop &amp; Adjust</span>
                {fileName && (
                  <span className="block text-[11px] font-medium text-[#737373] dark:text-[#85858B] truncate">
                    {fileName}
                  </span>
                )}
              </div>
            </DialogTitle>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleAutoDetect}
                disabled={detecting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F4F4F5] dark:bg-[#232325] hover:bg-[#E4E4E7] dark:hover:bg-[#2C2C2E] text-[#171717] dark:text-[#EDEDED] text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <ScanLine className="w-3.5 h-3.5 text-[#FB432C]" />
                <span>{detecting ? "Scanning…" : "Auto-Crop"}</span>
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F4F4F5] dark:bg-[#232325] hover:bg-[#E4E4E7] dark:hover:bg-[#2C2C2E] transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-[#525252] dark:text-[#A1A1A6]" />
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Aspect Presets */}
        {!aspect && (
          <div className="px-5 pt-3 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {PRESETS.map((p) => {
              const active = preset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all",
                    active
                      ? "bg-[#171717] dark:bg-[#EDEDED] text-white dark:text-[#111113]"
                      : "bg-[#F4F4F5] dark:bg-[#232325] text-[#525252] dark:text-[#A1A1A6] hover:bg-[#E4E4E7] dark:hover:bg-[#2C2C2E]"
                  )}
                >
                  {p.icon}
                  {p.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Smart Detection Banner */}
        {autoBadge && (
          <div className="mx-5 mt-2 px-3 py-1.5 rounded-full bg-[#16A34A]/10 dark:bg-[#4CC38A]/15 border border-[#16A34A]/20 dark:border-[#4CC38A]/25 text-[11.5px] font-semibold text-[#16A34A] dark:text-[#4CC38A] inline-flex items-center gap-1.5 w-fit">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>{autoBadge}</span>
          </div>
        )}

        {/* Interactive Corner-Handle Crop Stage */}
        <div className="mx-5 mt-3 rounded-[20px] bg-[#16181D] p-3 sm:p-4 flex items-center justify-center min-h-[260px] sm:min-h-[310px] select-none overflow-hidden">
          <div
            ref={stageRef}
            className="relative max-w-full max-h-[290px] touch-none"
            style={{
              aspectRatio: `${imgAspectRatio}`,
              height: imgAspectRatio < 1 ? "280px" : "auto",
              width: imgAspectRatio >= 1 ? "min(100%, 460px)" : "auto",
            }}
          >
            <img
              src={rotatedPreviewUrl}
              alt="Crop preview"
              draggable={false}
              className="w-full h-full object-contain block pointer-events-none select-none rounded-[6px]"
              style={{ filter: previewCssFilter }}
            />

            {/* Dimmed Backdrop outside active crop region using 4 masks */}
            <div
              className="absolute left-0 top-0 right-0 bg-black/55 pointer-events-none"
              style={{ height: `${cropRect.y * 100}%` }}
            />
            <div
              className="absolute left-0 bottom-0 right-0 bg-black/55 pointer-events-none"
              style={{ height: `${Math.max(0, 1 - (cropRect.y + cropRect.height)) * 100}%` }}
            />
            <div
              className="absolute left-0 bg-black/55 pointer-events-none"
              style={{
                top: `${cropRect.y * 100}%`,
                height: `${cropRect.height * 100}%`,
                width: `${cropRect.x * 100}%`,
              }}
            />
            <div
              className="absolute right-0 bg-black/55 pointer-events-none"
              style={{
                top: `${cropRect.y * 100}%`,
                height: `${cropRect.height * 100}%`,
                width: `${Math.max(0, 1 - (cropRect.x + cropRect.width)) * 100}%`,
              }}
            />

            {/* Interactive Crop Frame */}
            <div
              onPointerDown={(e) => beginDrag("move", e)}
              className="absolute border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.45)] cursor-move"
              style={{
                left: `${cropRect.x * 100}%`,
                top: `${cropRect.y * 100}%`,
                width: `${cropRect.width * 100}%`,
                height: `${cropRect.height * 100}%`,
              }}
            >
              {/* Rule-of-thirds guides */}
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3">
                <div className="border-r border-b border-white/25" />
                <div className="border-r border-b border-white/25" />
                <div className="border-b border-white/25" />
                <div className="border-r border-b border-white/25" />
                <div className="border-r border-b border-white/25" />
                <div className="border-b border-white/25" />
                <div className="border-r border-white/25" />
                <div className="border-r border-white/25" />
                <div />
              </div>

              {/* 4 Corner Handles (large touch targets) */}
              {(
                [
                  { id: "nw", pos: "-left-2.5 -top-2.5 cursor-nwse-resize" },
                  { id: "ne", pos: "-right-2.5 -top-2.5 cursor-nesw-resize" },
                  { id: "sw", pos: "-left-2.5 -bottom-2.5 cursor-nesw-resize" },
                  { id: "se", pos: "-right-2.5 -bottom-2.5 cursor-nwse-resize" },
                ] as const
              ).map((h) => (
                <div
                  key={h.id}
                  onPointerDown={(e) => beginDrag(h.id, e)}
                  className={cn(
                    "absolute w-6 h-6 flex items-center justify-center touch-none",
                    h.pos
                  )}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-white border-2 border-[#FB432C] shadow-md" />
                </div>
              ))}

              {/* 4 Edge Drag Bars */}
              <div
                onPointerDown={(e) => beginDrag("n", e)}
                className="absolute -top-2 left-4 right-4 h-4 cursor-ns-resize flex items-center justify-center touch-none"
              >
                <span className="w-7 h-1 rounded-full bg-white shadow" />
              </div>
              <div
                onPointerDown={(e) => beginDrag("s", e)}
                className="absolute -bottom-2 left-4 right-4 h-4 cursor-ns-resize flex items-center justify-center touch-none"
              >
                <span className="w-7 h-1 rounded-full bg-white shadow" />
              </div>
              <div
                onPointerDown={(e) => beginDrag("w", e)}
                className="absolute -left-2 top-4 bottom-4 w-4 cursor-ew-resize flex items-center justify-center touch-none"
              >
                <span className="h-7 w-1 rounded-full bg-white shadow" />
              </div>
              <div
                onPointerDown={(e) => beginDrag("e", e)}
                className="absolute -right-2 top-4 bottom-4 w-4 cursor-ew-resize flex items-center justify-center touch-none"
              >
                <span className="h-7 w-1 rounded-full bg-white shadow" />
              </div>
            </div>
          </div>
        </div>

        {/* Tool Controls: Rotate / Flip / Document Filters */}
        <div className="px-5 pt-3.5 pb-5 space-y-3.5">
          {/* Row 1: Quick Orientation + Scan Filters */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setQuarterTurns((q) => (q - 90 + 360) % 360)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#F4F4F5] dark:bg-[#232325] hover:bg-[#E4E4E7] dark:hover:bg-[#2C2C2E] text-xs font-semibold text-[#171717] dark:text-[#EDEDED] transition-colors"
                title="Rotate 90° Left"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>90°</span>
              </button>
              <button
                type="button"
                onClick={() => setQuarterTurns((q) => (q + 90) % 360)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#F4F4F5] dark:bg-[#232325] hover:bg-[#E4E4E7] dark:hover:bg-[#2C2C2E] text-xs font-semibold text-[#171717] dark:text-[#EDEDED] transition-colors"
                title="Rotate 90° Right"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>90°</span>
              </button>
              <button
                type="button"
                onClick={() => setFlipH((f) => !f)}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-colors",
                  flipH
                    ? "bg-[#171717] dark:bg-[#EDEDED] text-white dark:text-[#111113]"
                    : "bg-[#F4F4F5] dark:bg-[#232325] hover:bg-[#E4E4E7] dark:hover:bg-[#2C2C2E] text-[#171717] dark:text-[#EDEDED]"
                )}
                title="Flip Horizontal"
              >
                <FlipHorizontal2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setShowFineSliders((s) => !s)}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-colors",
                  showFineSliders
                    ? "bg-[#FB432C]/15 text-[#FB432C]"
                    : "bg-[#F4F4F5] dark:bg-[#232325] hover:bg-[#E4E4E7] dark:hover:bg-[#2C2C2E] text-[#171717] dark:text-[#EDEDED]"
                )}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Tune</span>
              </button>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterMode(f.id)}
                  className={cn(
                    "px-2.5 py-1.5 rounded-full text-[11.5px] font-semibold whitespace-nowrap transition-colors",
                    filterMode === f.id
                      ? "bg-[#171717] dark:bg-[#EDEDED] text-white dark:text-[#111113]"
                      : "bg-[#F4F4F5] dark:bg-[#232325] hover:bg-[#E4E4E7] dark:hover:bg-[#2C2C2E] text-[#525252] dark:text-[#A1A1A6]"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Fine Tune Sliders */}
          {showFineSliders && (
            <div className="rounded-[16px] bg-[#F4F4F5] dark:bg-[#232325] border border-[#171717]/[0.06] dark:border-white/[0.08] p-3 space-y-2.5">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#737373] dark:text-[#85858B] w-20 shrink-0">
                  Straighten
                </span>
                <Slider
                  value={[fineAngle]}
                  min={-45}
                  max={45}
                  step={1}
                  onValueChange={(v) => setFineAngle(v[0])}
                  className="flex-1"
                />
                <span className="text-xs font-semibold text-[#171717] dark:text-[#EDEDED] w-10 text-right tabular-nums">
                  {fineAngle}°
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#737373] dark:text-[#85858B] w-20 shrink-0">
                  Brightness
                </span>
                <Slider
                  value={[brightness]}
                  min={70}
                  max={150}
                  step={2}
                  onValueChange={(v) => setBrightness(v[0])}
                  className="flex-1"
                />
                <span className="text-xs font-semibold text-[#171717] dark:text-[#EDEDED] w-10 text-right tabular-nums">
                  {brightness}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#737373] dark:text-[#85858B] w-20 shrink-0">
                  Contrast
                </span>
                <Slider
                  value={[contrast]}
                  min={70}
                  max={175}
                  step={2}
                  onValueChange={(v) => setContrast(v[0])}
                  className="flex-1"
                />
                <span className="text-xs font-semibold text-[#171717] dark:text-[#EDEDED] w-10 text-right tabular-nums">
                  {contrast}%
                </span>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 h-11 rounded-full bg-[#F4F4F5] dark:bg-[#232325] hover:bg-[#E4E4E7] dark:hover:bg-[#2C2C2E] text-[#525252] dark:text-[#A1A1A6] text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Full Photo
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 h-11 rounded-full border border-[#171717]/[0.10] dark:border-white/[0.10] bg-white dark:bg-[#19191B] hover:bg-[#F4F4F5] dark:hover:bg-[#232325] text-[#171717] dark:text-[#EDEDED] text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={handleApply}
              disabled={applying}
              className="flex-1 h-11 rounded-full bg-[#FB432C] hover:bg-[#E03923] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
            >
              {applying ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" strokeWidth={2} />
                  <span>Save Changes</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
