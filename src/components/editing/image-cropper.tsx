"use client";

import React, { useState, useCallback } from "react";
import Cropper, { Point, Area } from "react-easy-crop";
import { getCroppedImg } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Maximize2, Crop, Check, X, Square, RectangleHorizontal, RectangleVertical } from "lucide-react";
import { motion } from "framer-motion";

interface ImageCropperProps {
  image: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

export function ImageCropper({ image, onCropComplete, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [pixelCrop, setPixelCrop] = useState<Area | null>(null);

  const onCropChange = (crop: Point) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropAreaComplete = useCallback((_area: Area, pixelArea: Area) => {
    setPixelCrop(pixelArea);
  }, []);

  const handleConfirm = async () => {
    if (!pixelCrop) return;
    try {
      const croppedBlob = await getCroppedImg(image, pixelCrop);
      if (croppedBlob) {
        onCropComplete(croppedBlob);
      }
    } catch (e) {
      console.error("Error cropping image:", e);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl bg-white/95 backdrop-blur-2xl border-black/5 p-0 overflow-hidden rounded-[32px] shadow-3xl">
        <DialogHeader className="p-6 border-b border-black/5 bg-[#FDFDFD]">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg transform rotate-3">
               <Crop className="w-5 h-5 text-white" />
             </div>
             <div>
               <DialogTitle className="text-[20px] font-black text-black tracking-tight uppercase">Perfect Your Print</DialogTitle>
               <p className="text-[11px] font-black tracking-[0.1em] text-auth-slate-50 uppercase mt-0.5 opacity-60">Crop & Align your photo for best result</p>
             </div>
          </div>
        </DialogHeader>

        <div className="relative h-[400px] sm:h-[500px] bg-black/90 group">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={onCropChange}
            onCropComplete={onCropAreaComplete}
            onZoomChange={onZoomChange}
            classes={{
              containerClassName: "bg-black/90",
              mediaClassName: "opacity-90",
              cropAreaClassName: "border-2 border-white/50 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
            }}
          />
          
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => setAspect(undefined)}
              className={`p-2 rounded-full transition-all ${aspect === undefined ? "bg-white text-black scale-110" : "text-white hover:bg-white/10"}`}
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setAspect(1)}
              className={`p-2 rounded-full transition-all ${aspect === 1 ? "bg-white text-black scale-110" : "text-white hover:bg-white/10"}`}
            >
              <Square className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setAspect(4/5)}
              className={`p-2 rounded-full transition-all ${aspect === 4/5 ? "bg-white text-black scale-110" : "text-white hover:bg-white/10"}`}
            >
              <RectangleVertical className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setAspect(16/9)}
              className={`p-2 rounded-full transition-all ${aspect === 16/9 ? "bg-white text-black scale-110" : "text-white hover:bg-white/10"}`}
            >
              <RectangleHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-8 bg-[#FDFDFD] border-t border-black/5">
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-6">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-auth-slate-50 min-w-[60px]">Scale</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => onZoomChange(Number(e.target.value))}
                className="flex-1 h-1.5 bg-black/5 rounded-lg appearance-none cursor-pointer accent-black"
              />
              <span className="text-[11px] font-black tabular-nums text-black w-8">{zoom.toFixed(1)}x</span>
            </div>

            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={onCancel}
                className="flex-1 h-14 border border-black/5 text-auth-slate-90 font-black hover:bg-black/5 rounded-[16px] transition-all"
              >
                <X className="w-5 h-5 mr-2" /> DISCARD
              </Button>
              <Button 
                onClick={handleConfirm}
                className="flex-[2] h-14 bg-black text-white hover:bg-black/90 font-black rounded-[16px] shadow-xl shadow-black/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Check className="w-5 h-5 mr-2" /> SET PROTOCOL
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
