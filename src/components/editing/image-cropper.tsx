import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Crop, Check, X } from "lucide-react";

interface ImageCropperProps {
  image: string;
  onCropComplete: (croppedImage: string) => void;
  onCancel: () => void;
  aspect?: number;
}

export function ImageCropper({ image, onCropComplete, onCancel, aspect = 1 }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropAreaComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return '';

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return canvas.toDataURL('image/jpeg');
  };

  const handleApply = async () => {
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      onCropComplete(croppedImage);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="sm:max-w-[600px] bg-white border-black/5 shadow-2xl rounded-3xl p-6 text-black overflow-hidden border-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl font-black tracking-tight text-black">
            <Crop className="w-6 h-6 text-black" />
            Adjust Image
          </DialogTitle>
        </DialogHeader>
        
        <div className="relative h-[400px] w-full bg-[#f8f8f8] border border-black/5 rounded-2xl overflow-hidden mt-4">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={onCropChange}
            onCropComplete={onCropAreaComplete}
            onZoomChange={onZoomChange}
          />
        </div>

        <div className="mt-6 flex flex-col gap-4">
          <div className="flex items-center gap-4 px-2">
            <span className="text-[11px] font-black tracking-widest text-auth-slate-50 uppercase">Zoom</span>
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={(val) => setZoom(val[0])}
              className="flex-1"
            />
          </div>
        </div>

        <DialogFooter className="mt-8 gap-3 sm:gap-2">
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="border-2 border-black/5 bg-white text-black hover:bg-black/5 font-black text-[15px] h-12 rounded-xl transition-all flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleApply}
            className="bg-black hover:bg-black/90 text-white font-black text-[15px] h-12 rounded-xl transition-all shadow-xl shadow-black/10 flex-1 sm:flex-none"
          >
            Confirm Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
