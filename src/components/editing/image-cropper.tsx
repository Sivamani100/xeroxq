"use client";

import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Crop, Check, X, RotateCcw, Square, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageCropperProps {
  image: string;
  onCropComplete: (croppedImage: string) => void;
  onCancel: () => void;
  aspect?: number;
}

const ASPECT_PRESETS = [
  { label: "Original", icon: <Maximize2 className="w-3.5 h-3.5" />, value: undefined as number | undefined },
  { label: "A4", icon: <Square className="w-3.5 h-3.5" />, value: 210 / 297 },
  { label: "Square", icon: <Square className="w-3.5 h-3.5" />, value: 1 },
  { label: "4:3", icon: <Maximize2 className="w-3.5 h-3.5" />, value: 4 / 3 },
  { label: "16:9", icon: <Maximize2 className="w-3.5 h-3.5" />, value: 16 / 9 },
];

export function ImageCropper({ image, onCropComplete, onCancel, aspect }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [applying, setApplying] = useState(false);

  const activeAspect = aspect ?? ASPECT_PRESETS[selectedPreset]?.value;

  const onCropAreaComplete = useCallback(
    (_: unknown, pixels: { x: number; y: number; width: number; height: number }) => {
      setCroppedAreaPixels(pixels);
    },
    []
  );

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.addEventListener("load", () => resolve(img));
      img.addEventListener("error", reject);
      img.setAttribute("crossOrigin", "anonymous");
      img.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: { x: number; y: number; width: number; height: number }, rot = 0): Promise<string> => {
    const img = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    const maxSize = Math.max(img.width, img.height);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));
    canvas.width = safeArea;
    canvas.height = safeArea;
    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.translate(-img.width / 2, -img.height / 2);
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, safeArea, safeArea);
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    ctx.putImageData(data, Math.round(0 - safeArea / 2 + img.width / 2 - pixelCrop.x), Math.round(0 - safeArea / 2 + img.height / 2 - pixelCrop.y));
    return canvas.toDataURL("image/jpeg", 0.95);
  };

  const handleApply = async () => {
    if (!croppedAreaPixels || applying) return;
    setApplying(true);
    try {
      const cropped = await getCroppedImg(image, croppedAreaPixels, rotation);
      if (cropped) onCropComplete(cropped);
    } catch (e) {
      console.error("Crop error:", e);
    } finally {
      setApplying(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => onCancel()}>
      <DialogContent className="sm:max-w-[640px] p-0 overflow-hidden border-none bg-white/90 backdrop-blur-2xl rounded-[28px] shadow-[0_32px_80px_rgba(0,0,0,0.18)]">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 text-[20px] font-black tracking-tight text-[#1A1A2E]">
              <div className="w-9 h-9 bg-gradient-to-br from-[#FB432C] to-[#FF591E] rounded-[12px] flex items-center justify-center shadow-[0_4px_12px_rgba(251,67,44,0.3)]">
                <Crop className="w-4 h-4 text-white" />
              </div>
              Adjust Image
            </DialogTitle>
            <button onClick={onCancel} className="w-9 h-9 flex items-center justify-center rounded-full bg-black/[0.06] hover:bg-black/10 transition-colors">
              <X className="w-4 h-4 text-[#6B7280]" />
            </button>
          </div>
        </DialogHeader>

        {!aspect && (
          <div className="px-6 pt-4 flex gap-2 overflow-x-auto pb-1">
            {ASPECT_PRESETS.map((preset, i) => (
              <button
                key={preset.label}
                onClick={() => setSelectedPreset(i)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all",
                  selectedPreset === i
                    ? "bg-gradient-to-br from-[#FB432C] to-[#FF591E] text-white shadow-[0_4px_12px_rgba(251,67,44,0.3)]"
                    : "bg-black/[0.06] text-[#6B7280] hover:bg-black/10"
                )}
              >
                {preset.icon}
                {preset.label}
              </button>
            ))}
          </div>
        )}

        <div className="relative mx-6 mt-4 h-[300px] rounded-[20px] overflow-hidden bg-[#F6F7FB]">
          <Cropper image={image} crop={crop} zoom={zoom} rotation={rotation} aspect={activeAspect} onCropChange={setCrop} onCropComplete={onCropAreaComplete} onZoomChange={setZoom} />
        </div>

        <div className="px-6 pt-4 pb-6 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-bold tracking-widest text-[#6B7280] uppercase w-14 shrink-0">Zoom</span>
            <Slider value={[zoom]} min={1} max={3} step={0.05} onValueChange={(v) => setZoom(v[0])} className="flex-1" />
            <span className="text-[12px] font-bold text-[#1A1A2E] w-10 text-right tabular-nums">{zoom.toFixed(1)}×</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-bold tracking-widest text-[#6B7280] uppercase w-14 shrink-0">Rotate</span>
            <Slider value={[rotation]} min={-180} max={180} step={1} onValueChange={(v) => setRotation(v[0])} className="flex-1" />
            <span className="text-[12px] font-bold text-[#1A1A2E] w-10 text-right tabular-nums">{rotation}°</span>
          </div>
          <div className="flex gap-3 mt-2">
            <button onClick={() => { setCrop({ x: 0, y: 0 }); setZoom(1); setRotation(0); setSelectedPreset(0); }} className="flex items-center gap-2 px-4 h-11 rounded-full bg-black/[0.06] hover:bg-black/10 text-[#6B7280] text-[13px] font-semibold transition-all">
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
            <button onClick={onCancel} className="flex-1 h-11 rounded-full border border-black/[0.08] bg-white text-[#1A1A2E] text-[14px] font-semibold hover:bg-black/[0.03] transition-all">
              Cancel
            </button>
            <motion.button onClick={handleApply} disabled={applying} whileTap={{ scale: 0.97 }} className={cn("flex-1 h-11 rounded-full text-white text-[14px] font-bold transition-all flex items-center justify-center gap-2 bg-gradient-to-br from-[#FB432C] to-[#FF591E] shadow-[0_8px_24px_rgba(251,67,44,0.35)] disabled:opacity-60 disabled:cursor-not-allowed")}>
              <AnimatePresence mode="wait">
                {applying ? (
                  <motion.div key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <motion.div key="apply" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                    <Check className="w-4 h-4" /> Apply Crop
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
