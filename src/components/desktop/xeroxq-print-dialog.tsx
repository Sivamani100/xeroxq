'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { 
  Menu, Lock, Layers, Copy, Paperclip, CheckCircle2,
  RefreshCw, Settings2, FolderDown, Leaf, Monitor, Droplet, 
  Settings, ChevronRight, X, Printer, FileText, Minus, Plus,
  RotateCcw, Sun, ZoomIn, ZoomOut, Crop, SlidersHorizontal,
  Contrast, Sparkles, Move, Maximize, BookOpen, Layout,
  ScanLine, Zap, Grid, AlignCenter, ArrowUpRight, Wand2, Focus, Eye,
  HelpCircle, Stamp, IndianRupee, FileSpreadsheet, ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Document, Page, pdfjs } from 'react-pdf';
import { supabase } from '@/lib/supabase';

// Disable default CSS for react-pdf to prevent conflicts
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Initialize PDF.js worker
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();
}

export default function XeroxQPrintDialog({ 
  documentPath, 
  base64Data, 
  jobId,
  shopId,
  onClose 
}: { 
  documentPath?: string, 
  base64Data?: string, 
  jobId?: string,
  shopId?: string,
  onClose?: () => void 
}) {
  const [isElectron, setIsElectron] = useState(false);
  const [printers, setPrinters] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'printing' | 'success'>('idle');

  // PRINT SETTINGS
  const [selectedPrinter, setSelectedPrinter] = useState('CPD-RAVEN IPP');
  const [copies, setCopies] = useState(1);
  const [colorMode, setColorMode] = useState<'color' | 'monochrome'>('color');
  const [sides, setSides] = useState<'simplex' | 'duplex'>('simplex');
  const [paperSupply, setPaperSupply] = useState('Automatically Select');
  const [finishing, setFinishing] = useState('None');
  const [appliedSettingsMessage, setAppliedSettingsMessage] = useState<string | null>(null);
  
  // IMAGE LABORATORY (Advanced Studio State)
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [exposure, setExposure] = useState(100);
  const [hue, setHue] = useState(0);
  const [invert, setInvert] = useState(false);
  const [threshold, setThreshold] = useState(0); // 0 (off) to 255
  const [mirrorH, setMirrorH] = useState(false);
  const [mirrorV, setMirrorV] = useState(false);
  const [isBaking, setIsBaking] = useState(false);
  const [bakedPages, setBakedPages] = useState<string[]>([]);
  
  const [contentScale, setContentScale] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isCropMode, setIsCropMode] = useState(false);

  // STUDIO NEW FEATURES STATE
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [showMarginGuide, setShowMarginGuide] = useState(true);
  const [showCenterGrid, setShowCenterGrid] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // ADVANCED NEW FEATURES STATE
  const [paperSize, setPaperSize] = useState<'A4' | 'Legal' | 'A3' | 'Letter'>('A4');
  const [pageRangeMode, setPageRangeMode] = useState<'all' | 'odd' | 'even' | 'custom'>('all');
  const [customRangeInput, setCustomRangeInput] = useState('');
  const [watermarkText, setWatermarkText] = useState<string>('NONE');
  const [bwRate, setBwRate] = useState<number>(2);
  const [colorRate, setColorRate] = useState<number>(10);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);

  // POSTER PRINTING STATE
  const [posterMode, setPosterMode] = useState<'1x1' | '2x2' | '3x3'>('1x1');

  // PREVIEW & GESTURE STATE
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pdfError, setPdfError] = useState(false);
  const pathWithoutQuery = documentPath?.split('?')[0].toLowerCase() || '';
  const isImage = pathWithoutQuery.match(/\.(jpg|jpeg|png|webp|gif|bmp)$/i);
  // Anything that is not natively rendered by React-PDF (.pdf) or image tags is treated as Raw Data.
  const isRawFormat = documentPath && !isImage && !pathWithoutQuery.endsWith('.pdf');
  
  // Interactive Manipulation State (In Points)
  const [imgRect, setImgRect] = useState({ x: 0, y: 0, w: 500, h: 500 });
  const [cropRect, setCropRect] = useState({ t: 0, b: 0, l: 0, r: 0 }); // In pixels/points from edges
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, rectX: 0, rectY: 0, rectW: 0, rectH: 0, cropT: 0, cropB: 0, cropL: 0, cropR: 0 });

  // Image Scale-Up State
  const [imageScale, setImageScale] = useState(100); // percentage: 25–300
  const naturalImgSize = useRef<{ w: number; h: number } | null>(null);

  const [zoom, setZoom] = useState(0.8); 
  const [activeTab, setActiveTab] = useState<'settings' | 'laboratory'>('laboratory');
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const touchStartDist = useRef<number | null>(null);
  const touchStartZoom = useRef<number>(zoom);

  const paperOptions = ['Automatically Select', 'Tray 1 (Bypass)', 'Tray 2', 'Tray 3'];

  // Paper Dimensions Helper (in pt)
  const getPaperDims = (size: string, orient: 'portrait' | 'landscape') => {
    let w = 595.27, h = 841.88;
    if (size === 'Legal') { w = 595.27; h = 1008.0; }
    else if (size === 'A3') { w = 841.88; h = 1190.55; }
    else if (size === 'Letter') { w = 612.0; h = 792.0; }
    return orient === 'landscape' ? { w: h, h: w } : { w, h };
  };

  const currentDims = getPaperDims(paperSize, orientation);

  // Effective Printed Page Count Calculation
  const getEffectivePageCount = () => {
    let count = 1;
    if (isImage) {
      count = posterMode === '2x2' ? 4 : posterMode === '3x3' ? 9 : 1;
    } else {
      const total = numPages || 1;
      if (pageRangeMode === 'odd') count = Math.ceil(total / 2);
      else if (pageRangeMode === 'even') count = Math.floor(total / 2);
      else if (pageRangeMode === 'custom' && customRangeInput.trim()) {
        const parts = customRangeInput.split(',').flatMap(p => {
          if (p.includes('-')) {
            const [s, e] = p.split('-').map(n => parseInt(n.trim()));
            if (!isNaN(s) && !isNaN(e) && s <= e) {
              return Array.from({ length: e - s + 1 }, (_, i) => s + i);
            }
          }
          const v = parseInt(p.trim());
          return !isNaN(v) ? [v] : [];
        });
        count = parts.length > 0 ? parts.length : total;
      } else {
        count = total;
      }
    }
    return count;
  };

  const effectivePages = getEffectivePageCount();
  const estimatedCost = (colorMode === 'monochrome' ? bwRate : colorRate) * effectivePages * copies;

  // Commit Crop Action
  const commitCrop = () => {
    if (!isCropMode) {
      setIsCropMode(true);
      return;
    }
    const croppedW = Math.max(20, imgRect.w - cropRect.l - cropRect.r);
    const croppedH = Math.max(20, imgRect.h - cropRect.t - cropRect.b);
    
    // Shift position so image stays centered
    const shiftX = (cropRect.l - cropRect.r) / 2;
    const shiftY = (cropRect.t - cropRect.b) / 2;

    setImgRect(prev => ({
      ...prev,
      w: croppedW,
      h: croppedH,
      x: prev.x + shiftX,
      y: prev.y + shiftY,
    }));
    setCropRect({ t: 0, b: 0, l: 0, r: 0 });
    setIsCropMode(false);
    
    if (naturalImgSize.current) {
      naturalImgSize.current = { w: croppedW, h: croppedH };
      setImageScale(100);
    }

    setAppliedSettingsMessage('Crop Committed Successfully');
    setTimeout(() => setAppliedSettingsMessage(null), 3000);
  };

  // Smart Presets Handler
  const applyPreset = (presetName: string) => {
    setActivePreset(presetName);
    switch (presetName) {
      case 'clean_doc':
        setBrightness(115);
        setContrast(145);
        setExposure(110);
        setSaturation(100);
        setHue(0);
        setInvert(false);
        setThreshold(0);
        setColorMode('monochrome');
        setAppliedSettingsMessage('Applied Document Enhancer');
        break;
      case 'id_card':
        setContentScale(95);
        setBrightness(105);
        setContrast(115);
        setExposure(105);
        setSaturation(100);
        setImgRect(prev => ({ ...prev, x: 0, y: 0 }));
        setAppliedSettingsMessage('Applied ID Card Optimization');
        break;
      case 'vivid':
        setBrightness(105);
        setContrast(115);
        setSaturation(135);
        setExposure(105);
        setHue(0);
        setInvert(false);
        setColorMode('color');
        setAppliedSettingsMessage('Applied Vivid Photo Preset');
        break;
      case 'high_contrast':
        setBrightness(100);
        setContrast(170);
        setThreshold(120);
        setColorMode('monochrome');
        setAppliedSettingsMessage('Applied High Contrast B&W');
        break;
      case 'reset':
        setBrightness(100);
        setContrast(100);
        setExposure(100);
        setSaturation(100);
        setHue(0);
        setInvert(false);
        setThreshold(0);
        setMirrorH(false);
        setMirrorV(false);
        setContentScale(100);
        setRotation(0);
        setCropRect({ t: 0, b: 0, l: 0, r: 0 });
        setImgRect(prev => ({ ...prev, x: 0, y: 0 }));
        setIsCropMode(false);
        setActivePreset(null);
        setAppliedSettingsMessage('Reset Laboratory Settings');
        break;
    }
    setTimeout(() => setAppliedSettingsMessage(null), 3000);
  };

  // Studio Keyboard Hotkeys Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'r' || e.key === 'R') {
        setRotation(r => (r + 90) % 360);
        setCropRect({ t: 0, b: 0, l: 0, r: 0 });
        setImgRect(prev => ({ ...prev, x: 0, y: 0 }));
        setIsCropMode(false);
      } else if (e.key === 'c' || e.key === 'C') {
        if (rotation === 0) setIsCropMode(c => !c);
      } else if (e.key === 'i' || e.key === 'I') {
        setInvert(inv => !inv);
      } else if (e.key === 'm' || e.key === 'M') {
        setMirrorH(mh => !mh);
      } else if (e.key === 'v' || e.key === 'V') {
        setMirrorV(mv => !mv);
      } else if (e.key === '0') {
        applyPreset('reset');
      } else if (e.key === '?') {
        setShowShortcutsModal(s => !s);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rotation]);

  useEffect(() => {
    // If it's an image, we pre-set page count to 1
    if (isImage) setNumPages(1);
      const electronWindow = window as unknown as { electronAPI?: { getPrinters: () => Promise<{ success: boolean; printers: { name?: string; deviceId?: string }[] }> } };
      if (typeof window !== 'undefined' && electronWindow.electronAPI) {
        setIsElectron(true);
        electronWindow.electronAPI.getPrinters()
        .then((res) => {
          if (res.success) {
             // @ts-ignore
             const names = res.printers.map((p) => p.name || p.deviceId || String(p));
             setPrinters(names);
             if (names.length > 0) setSelectedPrinter(names[0]);
          }
        })
        .catch(console.error);
    }
  }, []);

  const handleCycle = <T,>(current: T, options: T[], setter: (v: T) => void) => {
    const idx = options.indexOf(current);
    const nextIdx = (idx + 1) % options.length;
    setter(options[nextIdx]);
  };

  // Pinch-to-Zoom Logic
  useEffect(() => {
    const el = previewContainerRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const d = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
        touchStartDist.current = d;
        touchStartZoom.current = zoom;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && touchStartDist.current !== null) {
        e.preventDefault(); // Prevent browser zoom/scroll while pinching
        const d = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
        const factor = d / touchStartDist.current;
        const newZoom = Math.max(0.2, Math.min(3.0, touchStartZoom.current * factor));
        setZoom(newZoom);
      }
    };

    const handleTouchEnd = () => {
      touchStartDist.current = null;
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault(); // Prevent full page zoom
        const delta = e.deltaY > 0 ? -0.05 : 0.05;
        // Need to use functional state update for zoom to avoid stale closures in passive listener
        setZoom(z => Math.max(0.2, Math.min(3.0, z + delta)));
      }
    };

    el.addEventListener('touchstart', handleTouchStart);
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);
    el.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // INTERACTIVE MANIPULATION ENGINE (Drag & Resize)
  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - dragStart.x) / zoom;
      const dy = (e.clientY - dragStart.y) / zoom;

      const A4_PT_W = 595.27;
      const A4_PT_H = 841.88;

      if (isDragging) {
        if (isCropMode) {
          // Drag inside crop box -> move cropRect inside image
          setCropRect(prev => {
            let { t, b, l, r } = { ...prev };
            const cropW = dragStart.rectW - dragStart.cropL - dragStart.cropR;
            const cropH = dragStart.rectH - dragStart.cropT - dragStart.cropB;

            let newL = Math.max(0, Math.min(dragStart.rectW - cropW, dragStart.cropL + dx));
            let newT = Math.max(0, Math.min(dragStart.rectH - cropH, dragStart.cropT + dy));
            let newR = dragStart.rectW - newL - cropW;
            let newB = dragStart.rectH - newT - cropH;

            return { t: newT, b: newB, l: newL, r: newR };
          });
        } else {
          setImgRect(prev => {
             let newX = dragStart.rectX + dx;
             let newY = dragStart.rectY + dy;
             
             // Clamp to paper boundaries
             const limitX = Math.max(0, currentDims.w/2 - prev.w/2);
             const limitY = Math.max(0, currentDims.h/2 - prev.h/2);
             newX = Math.max(-limitX, Math.min(limitX, newX));
             newY = Math.max(-limitY, Math.min(limitY, newY));

             return { ...prev, x: newX, y: newY };
          });
        }
      } else if (isResizing && resizeHandle) {
        if (isCropMode) {
          // Adjust CROP boundaries
          setCropRect(prev => {
            let { t, b, l, r } = { ...prev };
            if (resizeHandle.includes('e')) r = Math.max(0, Math.min(dragStart.rectW - l - 20, dragStart.cropR - dx));
            if (resizeHandle.includes('s')) b = Math.max(0, Math.min(dragStart.rectH - t - 20, dragStart.cropB - dy));
            if (resizeHandle.includes('w')) l = Math.max(0, Math.min(dragStart.rectW - r - 20, dragStart.cropL + dx));
            if (resizeHandle.includes('n')) t = Math.max(0, Math.min(dragStart.rectH - b - 20, dragStart.cropT + dy));
            return { t, b, l, r };
          });
        } else {
          // === FIGMA-STYLE IMAGE RESIZE ===
          setImgRect(prev => {
            let { x, y, w, h } = { ...prev };
            const ratio = dragStart.rectW / dragStart.rectH;

            if (resizeHandle === 'se') {
              // Corner: scale proportionally from top-left
              const newW = Math.max(20, dragStart.rectW + dx);
              w = newW; h = w / ratio;
            } else if (resizeHandle === 'sw') {
              // Corner: scale from top-right, x moves
              const newW = Math.max(20, dragStart.rectW - dx);
              x = dragStart.rectX + (dragStart.rectW - newW);
              w = newW; h = w / ratio;
            } else if (resizeHandle === 'ne') {
              // Corner: scale from bottom-left, y moves
              const newH = Math.max(20, dragStart.rectH - dy);
              y = dragStart.rectY + (dragStart.rectH - newH);
              h = newH; w = h * ratio;
            } else if (resizeHandle === 'nw') {
              // Corner: scale from bottom-right, both x & y move
              const newW = Math.max(20, dragStart.rectW - dx);
              x = dragStart.rectX + (dragStart.rectW - newW);
              w = newW; h = w / ratio;
              y = dragStart.rectY + (dragStart.rectH - h);
            } else if (resizeHandle === 'e') {
              w = Math.max(20, dragStart.rectW + dx);
              h = w / ratio;
            } else if (resizeHandle === 's') {
              h = Math.max(20, dragStart.rectH + dy);
              w = h * ratio;
            } else if (resizeHandle === 'w') {
              const newW = Math.max(20, dragStart.rectW - dx);
              x = dragStart.rectX + (dragStart.rectW - newW);
              w = newW; h = w / ratio;
            } else if (resizeHandle === 'n') {
              const newH = Math.max(20, dragStart.rectH - dy);
              y = dragStart.rectY + (dragStart.rectH - newH);
              h = newH; w = h * ratio;
            }

            // Sync imageScale live
            if (naturalImgSize.current) {
              setImageScale(Math.round((w / naturalImgSize.current.w) * 100));
            }

            return { x, y, w, h };
          });
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeHandle(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, zoom, resizeHandle, isCropMode]);

  const onStartDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ 
      x: e.clientX, y: e.clientY, 
      rectX: imgRect.x, rectY: imgRect.y, rectW: imgRect.w, rectH: imgRect.h,
      cropT: cropRect.t, cropB: cropRect.b, cropL: cropRect.l, cropR: cropRect.r
    });
  };

  const onStartResize = (e: React.MouseEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
    setDragStart({ 
      x: e.clientX, y: e.clientY, 
      rectX: imgRect.x, rectY: imgRect.y, rectW: imgRect.w, rectH: imgRect.h,
      cropT: cropRect.t, cropB: cropRect.b, cropL: cropRect.l, cropR: cropRect.r
    });
  };

  const handlePrint = async () => {
    if (!isElectron) {
      // WEB-ONLY HIGH-FIDELITY BAKE
      try {
        setIsBaking(true);
        setStatus('printing');
        
        // --- STEP 1: PROTOCOL BUFFER SCAN (Page Forcing) ---
        // We must ensure all pages are rendered into the DOM. pdf-to-printer/react-pdf
        // may lazy-load them. We force a scroll to the bottom then back up.
        if (previewContainerRef.current) {
          const container = previewContainerRef.current;
          const originalScroll = container.scrollTop;
          
          // Flash scroll to bottom to trigger lazy loaders
          container.scrollTo({ top: container.scrollHeight, behavior: 'auto' });
          await new Promise(r => setTimeout(r, 400));
          container.scrollTo({ top: originalScroll, behavior: 'auto' });
          await new Promise(r => setTimeout(r, 400));
        }

        // --- STEP 2: HIGH-FIDELITY BAKE ---
        const canvases = document.querySelectorAll('.react-pdf__Page__canvas');
        const previewImage = document.querySelector('#laboratory-preview-image') as HTMLImageElement;
        
        // If it's a PDF, we expect canvases. If it's an image, we expect previewImage.
        if (!isImage && numPages && canvases.length < numPages) {
           throw new Error(`Laboratory Sync Error: Only ${canvases.length} of ${numPages} pages are ready. Please scroll to the bottom and try again.`);
        }

        const captured: string[] = [];
        const A4_PT_W = 595.27; // Absolute A4 width in points
        const A4_PT_H = 841.88; // Absolute A4 height in points
        const RES_MULT = 3;      // 3x Resolution for crisp output

        if (isImage && previewImage) {
          const RES_MULT = 3;
          const dims = getPaperDims(paperSize, orientation);

          if (posterMode === '1x1') {
            // Standard Single Page Bake
            const bakeCanvas = document.createElement('canvas');
            bakeCanvas.width = dims.w * RES_MULT;
            bakeCanvas.height = dims.h * RES_MULT;
            const ctx = bakeCanvas.getContext('2d');
            if (ctx) {
              ctx.scale(RES_MULT, RES_MULT);
              ctx.fillStyle = "white";
              ctx.fillRect(0, 0, dims.w, dims.h);
              
              ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) invert(${invert ? 1 : 0}) hue-rotate(${hue}deg) ${colorMode === 'monochrome' ? 'grayscale(1)' : ''}`;
              
              const physicalW = imgRect.w - cropRect.l - cropRect.r;
              const physicalH = imgRect.h - cropRect.t - cropRect.b;
              const drawX = dims.w/2 + imgRect.x - imgRect.w/2 + cropRect.l;
              const drawY = dims.h/2 + imgRect.y - imgRect.h/2 + cropRect.t;

              ctx.save();
              ctx.translate(drawX + physicalW/2, drawY + physicalH/2);
              ctx.rotate((rotation * Math.PI) / 180);
              ctx.scale(mirrorH ? -1 : 1, mirrorV ? -1 : 1);
              
              ctx.drawImage(
                previewImage,
                cropRect.l * (previewImage.naturalWidth / imgRect.w),
                cropRect.t * (previewImage.naturalHeight / imgRect.h),
                physicalW * (previewImage.naturalWidth / imgRect.w),
                physicalH * (previewImage.naturalHeight / imgRect.h),
                -physicalW/2,
                -physicalH/2,
                physicalW,
                physicalH
              );
              ctx.restore();

              if (watermarkText !== 'NONE') {
                ctx.save();
                ctx.font = "bold 32px sans-serif";
                ctx.fillStyle = "rgba(239, 68, 68, 0.25)";
                ctx.textAlign = "center";
                ctx.translate(dims.w / 2, dims.h / 2);
                ctx.rotate((-35 * Math.PI) / 180);
                ctx.fillText(watermarkText, 0, 0);
                ctx.restore();
              }

              captured.push(bakeCanvas.toDataURL('image/jpeg', 0.95));
            }
          } else {
            // === POSTER TILING BAKE (2x2 or 3x3) ===
            const gridDim = posterMode === '2x2' ? 2 : 3;
            for (let r = 0; r < gridDim; r++) {
              for (let c = 0; c < gridDim; c++) {
                const tileCanvas = document.createElement('canvas');
                tileCanvas.width = dims.w * RES_MULT;
                tileCanvas.height = dims.h * RES_MULT;
                const ctx = tileCanvas.getContext('2d');
                if (ctx) {
                  ctx.scale(RES_MULT, RES_MULT);
                  ctx.fillStyle = "white";
                  ctx.fillRect(0, 0, dims.w, dims.h);
                  
                  ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) invert(${invert ? 1 : 0}) hue-rotate(${hue}deg) ${colorMode === 'monochrome' ? 'grayscale(1)' : ''}`;

                  const physicalW = imgRect.w - cropRect.l - cropRect.r;
                  const physicalH = imgRect.h - cropRect.t - cropRect.b;
                  const drawX = dims.w/2 + imgRect.x - imgRect.w/2 + cropRect.l;
                  const drawY = dims.h/2 + imgRect.y - imgRect.h/2 + cropRect.t;

                  ctx.save();
                  // Scale and offset for grid tile
                  ctx.translate(-c * dims.w, -r * dims.h);
                  ctx.scale(gridDim, gridDim);

                  ctx.translate(drawX + physicalW/2, drawY + physicalH/2);
                  ctx.rotate((rotation * Math.PI) / 180);
                  ctx.scale(mirrorH ? -1 : 1, mirrorV ? -1 : 1);

                  ctx.drawImage(
                    previewImage,
                    cropRect.l * (previewImage.naturalWidth / imgRect.w),
                    cropRect.t * (previewImage.naturalHeight / imgRect.h),
                    physicalW * (previewImage.naturalWidth / imgRect.w),
                    physicalH * (previewImage.naturalHeight / imgRect.h),
                    -physicalW/2,
                    -physicalH/2,
                    physicalW,
                    physicalH
                  );
                  ctx.restore();

                  // Tile label at bottom margin
                  ctx.font = "bold 9px sans-serif";
                  ctx.fillStyle = "rgba(0,0,0,0.5)";
                  ctx.fillText(`POSTER TILE [Row ${r+1}, Col ${c+1}] · Page ${r*gridDim+c+1} of ${gridDim*gridDim}`, 15, dims.h - 15);

                  captured.push(tileCanvas.toDataURL('image/jpeg', 0.95));
                }
              }
            }
          }
        } else {
            // Bake PDF canvases
            canvases.forEach((canvasElement: Element) => {
               const canvas = canvasElement as HTMLCanvasElement;
               const bakeCanvas = document.createElement('canvas');
               bakeCanvas.width = canvas.width * RES_MULT;
               bakeCanvas.height = canvas.height * RES_MULT;
               const ctx = bakeCanvas.getContext('2d');
               if (ctx) {
                 ctx.scale(RES_MULT, RES_MULT);
                 ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) invert(${invert ? 1 : 0}) hue-rotate(${hue}deg) ${colorMode === 'monochrome' ? 'grayscale(1)' : ''}`;
                 if (mirrorH || mirrorV) {
                   ctx.translate(mirrorH ? canvas.width : 0, mirrorV ? canvas.height : 0);
                   ctx.scale(mirrorH ? -1 : 1, mirrorV ? -1 : 1);
                 }
                 ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height);
                 captured.push(bakeCanvas.toDataURL('image/jpeg', 0.95));
               }
            });
        }

        setBakedPages(captured);
        
        setTimeout(() => {
          window.print();
          setIsBaking(false);
          setStatus('idle');
          setBakedPages([]);
        }, 800);

      } catch (err) {
        console.error(err);
        alert(`Print failed: ${(err as Error).message}`);
      } finally {
        setIsBaking(false);
        setStatus('idle');
      }
      return;
    }

    try {
      setStatus('printing');
      const electronWindow = window as unknown as { 
        electronAPI?: { 
          printNative: (opts: unknown) => Promise<{ 
            success: boolean; 
            error?: string; 
            rawError?: any; 
            platform?: string; 
            appliedOptions?: { 
              printer?: string; 
              copies?: number; 
              monochrome?: boolean; 
              side?: string; 
              paperSize?: string; 
              bin?: string; 
            } 
          }> 
        } 
      };
      
      const printApi = electronWindow.electronAPI;
      if (!printApi) {
        throw new Error("Electron API is not available on this interface.");
      }

      const res = await printApi.printNative({
        filePath: documentPath, 
        base64Data: base64Data, 
        options: {
          printer: selectedPrinter,
          copies,
          side: sides,
          monochrome: colorMode === 'monochrome',
          paperSupply,
          finishing,
          editParams: {
            brightness,
            contrast,
            saturation,
            contentScale,
            rotation
          }
        }
      });

      if (res.success) {
        // Confirmation Loop: parse options returned from main process
        const options = res.appliedOptions;
        if (options) {
          const sideLabel = options.side === 'duplex' ? 'Duplex ON' : 'Duplex OFF';
          const colorLabel = options.monochrome ? 'Grayscale' : 'Full Color';
          const paperLabel = options.paperSize || options.bin || 'Default Tray';
          const confirmMsg = `Printed: ${options.copies} ${options.copies === 1 ? 'copy' : 'copies'}, ${colorLabel}, ${sideLabel}, ${paperLabel}`;
          setAppliedSettingsMessage(confirmMsg);
        }
        setStatus('success');
        setTimeout(() => { if (onClose) onClose(); }, 3000); // 3 seconds to let them see the applied options confirmation
      } else {
        // Real remote error logging to Supabase
        const errorMessage = res.error || 'Spool failure';
        const rawErrorData = res.rawError || {};
        
        try {
          if (shopId && jobId) {
            await supabase.from('automation_logs').insert({
              event_type: 'PRINT_FAILURE',
              shop_id: shopId,
              job_id: jobId,
              severity: 'error',
              details: {
                error_message: errorMessage,
                raw_error: rawErrorData,
                platform: res.platform || (typeof window !== 'undefined' ? window.navigator.platform : 'unknown'),
                printer_name: selectedPrinter,
                timestamp: new Date().toISOString(),
                options: {
                  printer: selectedPrinter,
                  copies,
                  side: sides,
                  monochrome: colorMode === 'monochrome',
                  paperSupply
                }
              }
            });
            console.log('[XeroxQ] Logged printing exception to remote audit database.');
          }
        } catch (dbErr) {
          console.error('[XeroxQ] Failed to write failure trace to automation_logs:', dbErr);
        }

        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error(err);
      setStatus('idle');
      alert(`Print Failed: ${(err as Error).message}`);
    }
  };

  return (
    <div id="xeroxq-studio-container" className="flex h-screen w-screen fixed inset-0 z-[99999] bg-[#F8FAFC] overflow-hidden flex-col font-sans select-none text-black transition-all duration-500">
      
      {/* ===== STUDIO HEADER ===== */}
      <div className="shrink-0 relative w-full bg-white border-b border-[#E2E8F0] z-40">
        <div className="px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 shrink-0">
             {onClose && (
               <button 
                 onClick={onClose}
                 className="h-[36px] px-3.5 border border-[#E2E8F0] bg-white text-black hover:bg-[#F8FAFC] rounded-[5.57px] flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer group"
                 title="Return to Queue (Esc)"
               >
                 <ArrowLeft className="w-4 h-4 text-black group-hover:-translate-x-0.5 transition-transform" />
                 <span>Back</span>
               </button>
             )}
             <div className="w-[1px] h-6 bg-[#E2E8F0]" />
             <div className="w-9 h-9 bg-black rounded-[5.57px] flex items-center justify-center shrink-0 shadow-md shadow-black/20">
               <Printer className="w-4 h-4 text-white" />
             </div>
             <div className="flex flex-col">
                <h1 className="text-[18px] font-bold text-black leading-none tracking-tight whitespace-nowrap">XeroxQ Studio</h1>
                <p className="text-[10px] font-bold text-[#7E8B9E] tracking-[0.12em] uppercase leading-none mt-1.5">Professional Laboratory</p>
             </div>
          </div>

          <div className="flex items-center gap-2 px-1.5 py-1.5 bg-[#F8FAFC] rounded-[5.57px] border border-[#E2E8F0]">
             <button 
               onClick={() => setActiveTab('settings')}
               className={cn("px-4 py-1.5 rounded-[4px] text-[11px] font-bold uppercase tracking-[0.1em] transition-all cursor-pointer", activeTab === 'settings' ? "bg-white text-black shadow-sm border border-[#E2E8F0]" : "text-[#7E8B9E] hover:text-black")}
             >
               Protocol
             </button>
             <button 
               onClick={() => setActiveTab('laboratory')}
               className={cn("px-4 py-1.5 rounded-[4px] text-[11px] font-bold uppercase tracking-[0.1em] transition-all cursor-pointer", activeTab === 'laboratory' ? "bg-white text-black shadow-sm border border-[#E2E8F0]" : "text-[#7E8B9E] hover:text-black")}
             >
               Laboratory
             </button>
          </div>
          
          <div className="flex items-center gap-2 pr-12 lg:pr-[50px]">
             {/* Estimated Bill Header Badge */}
             <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F1F5F9] border border-[#E2E8F0] rounded-[5.57px]">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[11px] font-black text-black tabular-nums">₹{estimatedCost}</span>
                <span className="text-[8px] font-bold text-[#7E8B9E] uppercase tracking-wider">Est. Bill</span>
             </div>

             {/* Keyboard Shortcuts Trigger */}
             <button
               onClick={() => setShowShortcutsModal(true)}
               className="h-[36px] px-2.5 flex items-center gap-1 border border-[#E2E8F0] bg-white text-[#7E8B9E] hover:text-black hover:bg-[#F8FAFC] transition-colors rounded-[5.57px] shadow-sm cursor-pointer text-[10px] font-bold uppercase tracking-wider"
               title="Keyboard Shortcuts (?)"
             >
                <HelpCircle className="w-[14px] h-[14px]" />
                <span className="hidden sm:inline">Shortcuts</span>
             </button>
          </div>
        </div>
      </div>

      {/* ===== STUDIO WORKSPACE ===== */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* === LABORATORY SIDEBAR === */}
        <div className="w-[360px] bg-white border-r border-[#E2E8F0] flex flex-col shrink-0 relative z-30 shadow-sm">
           
           <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
              
              {activeTab === 'settings' ? (
                /* PRINT PROTOCOL SECTION */
                <div className="space-y-6 animate-in fade-in slide-in-from-left duration-300">
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#7E8B9E] uppercase tracking-[0.1em]">Hardware Output</label>
                      <select 
                        value={selectedPrinter}
                        onChange={e => setSelectedPrinter(e.target.value)}
                        className="w-full h-[40px] bg-white border border-[#E2E8F0] rounded-[5.57px] text-[12px] font-bold px-3 hover:bg-[#F8FAFC] focus:ring-1 focus:ring-black outline-none transition-all cursor-pointer shadow-sm appearance-none"
                      >
                         <option value="CPD-RAVEN IPP">CPD-RAVEN IPP</option>
                         {printers.map((p, i) => <option key={i} value={p}>{p}</option>)}
                      </select>
                   </div>

                   <div className="flex items-center justify-between bg-[#F8FAFC] border border-[#E2E8F0] rounded-[5.57px] p-3 shadow-sm">
                      <span className="text-[10px] font-bold text-[#7E8B9E] uppercase tracking-[0.1em] ml-1">Copies</span>
                      <div className="flex items-center gap-3">
                         <button onClick={() => setCopies(Math.max(1, copies - 1))} className="h-[32px] w-[32px] flex items-center justify-center rounded-[4px] border border-[#E2E8F0] bg-white text-black font-bold shadow-sm hover:bg-[#F8FAFC] transition-all cursor-pointer">
                            <Minus className="w-[14px] h-[14px]" />
                         </button>
                         <span className="text-[14px] font-bold w-6 text-center tabular-nums">{copies}</span>
                         <button onClick={() => setCopies(copies + 1)} className="h-[32px] w-[32px] flex items-center justify-center rounded-[4px] border border-[#E2E8F0] bg-white text-black font-bold shadow-sm hover:bg-[#F8FAFC] transition-all cursor-pointer">
                            <Plus className="w-[14px] h-[14px]" />
                         </button>
                      </div>
                   </div>

                   {/* PAGE RANGE SELECTOR */}
                   <div className="space-y-2.5 bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-[5.57px]">
                      <label className="text-[10px] font-bold text-black uppercase tracking-[0.1em] flex items-center justify-between">
                         <span>Page Range Selection</span>
                         <span className="text-[9px] font-bold text-[#3568FF] uppercase">{effectivePages} Pages Selected</span>
                      </label>
                      <div className="grid grid-cols-4 gap-1">
                         {(['all', 'odd', 'even', 'custom'] as const).map(m => (
                           <button
                             key={m}
                             onClick={() => setPageRangeMode(m)}
                             className={cn(
                               "py-1.5 rounded-[4px] border text-[9px] font-bold uppercase tracking-tight transition-all cursor-pointer",
                               pageRangeMode === m ? "bg-black text-white border-black" : "bg-white text-black border-[#E2E8F0] hover:bg-[#F1F5F9]"
                             )}
                           >
                              {m}
                           </button>
                         ))}
                      </div>
                      {pageRangeMode === 'custom' && (
                        <input
                          type="text"
                          placeholder="e.g. 1-3, 5, 8-10"
                          value={customRangeInput}
                          onChange={e => setCustomRangeInput(e.target.value)}
                          className="w-full h-[32px] bg-white border border-[#E2E8F0] rounded-[4px] text-[11px] font-bold px-2.5 outline-none focus:border-black transition-all"
                        />
                      )}
                   </div>

                   {/* REAL-TIME COST CALCULATOR PANEL */}
                   <div className="space-y-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 p-3.5 rounded-[5.57px]">
                      <div className="flex items-center justify-between">
                         <label className="text-[10px] font-black text-emerald-950 uppercase tracking-[0.1em] flex items-center gap-1.5">
                            <IndianRupee className="w-3.5 h-3.5 text-emerald-600" /> Billing Calculator
                         </label>
                         <span className="text-[14px] font-black text-emerald-700 tabular-nums">₹{estimatedCost}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[9px] font-bold text-emerald-900">
                         <div className="flex items-center justify-between bg-white/80 p-1.5 rounded border border-emerald-100">
                            <span>B&W Rate:</span>
                            <div className="flex items-center gap-1">
                               <span>₹</span>
                               <input type="number" min="1" max="100" value={bwRate} onChange={e => setBwRate(Math.max(1, parseInt(e.target.value) || 1))} className="w-8 text-center bg-transparent border-b border-emerald-400 font-bold outline-none" />
                            </div>
                         </div>
                         <div className="flex items-center justify-between bg-white/80 p-1.5 rounded border border-emerald-100">
                            <span>Color Rate:</span>
                            <div className="flex items-center gap-1">
                               <span>₹</span>
                               <input type="number" min="1" max="200" value={colorRate} onChange={e => setColorRate(Math.max(1, parseInt(e.target.value) || 1))} className="w-8 text-center bg-transparent border-b border-emerald-400 font-bold outline-none" />
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="h-[1px] bg-[#E2E8F0] w-full" />

                    <div className="grid grid-cols-2 gap-2">
                       <button 
                         onClick={() => setSides('simplex')} 
                         className={cn("flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-[5.57px] border transition-all cursor-pointer", sides === 'simplex' ? "bg-black text-white border-black shadow-lg shadow-black/10" : "bg-white text-[#7E8B9E] border-[#E2E8F0] hover:bg-[#F8FAFC]")}>
                          <FileText className="w-4 h-4" />
                          <div className="text-center">
                             <div className="text-[10px] font-bold uppercase tracking-[0.1em]">Single</div>
                             <div className={cn("text-[8px] font-bold uppercase tracking-[0.1em]", sides === 'simplex' ? "text-white/60" : "text-[#7E8B9E]/60")}>Side Scan</div>
                          </div>
                       </button>
                       <button 
                         onClick={() => setSides('duplex')} 
                         className={cn("flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-[5.57px] border transition-all cursor-pointer", sides === 'duplex' ? "bg-black text-white border-black shadow-lg shadow-black/10" : "bg-white text-[#7E8B9E] border-[#E2E8F0] hover:bg-[#F8FAFC]")}>
                          <BookOpen className="w-4 h-4" />
                          <div className="text-center">
                             <div className="text-[10px] font-bold uppercase tracking-[0.1em]">Double</div>
                             <div className={cn("text-[8px] font-bold uppercase tracking-[0.1em]", sides === 'duplex' ? "text-white/60" : "text-[#7E8B9E]/60")}>Side Scan</div>
                          </div>
                       </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                       <button 
                         onClick={() => setColorMode('color')} 
                         className={cn("flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-[5.57px] border transition-all cursor-pointer", colorMode === 'color' ? "bg-[#FF591E] text-white border-[#FF591E] shadow-lg shadow-[#FF591E]/20" : "bg-white text-[#7E8B9E] border-[#E2E8F0] hover:bg-[#F8FAFC]")}>
                          <Droplet className="w-4 h-4" />
                          <div className="text-center">
                             <div className="text-[10px] font-bold uppercase tracking-[0.1em]">Full Color</div>
                             <div className={cn("text-[8px] font-bold uppercase tracking-[0.1em]", colorMode === 'color' ? "text-white/60" : "text-[#7E8B9E]/60")}>Vibrant</div>
                          </div>
                       </button>
                    </div>

                   <button onClick={() => handleCycle(paperSupply, paperOptions, setPaperSupply)} className="w-full flex items-center justify-between p-3 rounded-[5.57px] border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-all text-left bg-white shadow-sm cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-[4px] bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center shrink-0 text-[#323A46]">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[12px] font-bold text-black border-none">Paper Tray</span>
                          <span className="text-[9px] font-bold text-[#7E8B9E] uppercase tracking-[0.1em] mt-0.5">{paperSupply}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-[14px] h-[14px] text-[#7E8B9E]" />
                   </button>

                   <div className="h-[1px] bg-[#E2E8F0] w-full" />

                   <div className="space-y-4 pb-4">
                      <label className="text-[10px] font-bold text-[#7E8B9E] uppercase tracking-[0.1em]">System Protocols</label>
                      
                      <div className="space-y-3">
                         <label className="flex items-center gap-3 cursor-pointer group">
                            <div 
                              onClick={() => setSides(sides === 'duplex' ? 'simplex' : 'duplex')}
                              className={cn("w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all", sides === 'duplex' ? "bg-black border-black" : "border-[#E2E8F0] bg-white group-hover:border-black/30")}
                            >
                               {sides === 'duplex' && <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={3} />}
                            </div>
                            <span className="text-[11px] font-bold text-black uppercase tracking-[0.1em]">Print on both sides</span>
                         </label>

                         <label className="flex items-center gap-3 cursor-pointer group opacity-50">
                            <div className="w-4 h-4 rounded-[4px] border border-[#E2E8F0] bg-white flex items-center justify-center">
                            </div>
                            <span className="text-[11px] font-bold text-black uppercase tracking-[0.1em]">Background graphics</span>
                         </label>

                         <label className="flex items-center gap-3 cursor-pointer group opacity-50">
                            <div className="w-4 h-4 rounded-[4px] border border-[#E2E8F0] bg-white flex items-center justify-center">
                            </div>
                            <span className="text-[11px] font-bold text-black uppercase tracking-[0.1em]">Headers and footers</span>
                         </label>
                      </div>
                   </div>
                </div>
              ) : (
                /* IMAGE LABORATORY SECTION */
                  <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300 pb-6">
                    
                    {/* SMART ENHANCEMENT PRESETS */}
                    <div className="space-y-3 bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-[5.57px] shadow-sm">
                       <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-black uppercase tracking-[0.1em] flex items-center gap-1.5">
                             <Wand2 className="w-3.5 h-3.5 text-[#3568FF]" /> Studio Smart Enhancers
                          </label>
                          <span className="text-[9px] font-bold text-[#7E8B9E] uppercase tracking-wider">1-Click</span>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => applyPreset('clean_doc')}
                            className={cn(
                              "flex items-center gap-2 p-2 rounded-[4px] border text-left transition-all cursor-pointer",
                              activePreset === 'clean_doc' ? "bg-black text-white border-black" : "bg-white border-[#E2E8F0] hover:bg-[#F1F5F9] text-black"
                            )}
                          >
                             <FileText className="w-3.5 h-3.5 shrink-0 text-[#3568FF]" />
                             <div>
                                <div className="text-[9px] font-extrabold uppercase tracking-tight">Clean Scan</div>
                                <div className="text-[7px] font-bold opacity-60 uppercase">Fix camera doc</div>
                             </div>
                          </button>

                          <button
                            onClick={() => applyPreset('id_card')}
                            className={cn(
                              "flex items-center gap-2 p-2 rounded-[4px] border text-left transition-all cursor-pointer",
                              activePreset === 'id_card' ? "bg-black text-white border-black" : "bg-white border-[#E2E8F0] hover:bg-[#F1F5F9] text-black"
                            )}
                          >
                             <Focus className="w-3.5 h-3.5 shrink-0 text-[#16A34A]" />
                             <div>
                                <div className="text-[9px] font-extrabold uppercase tracking-tight">ID Card</div>
                                <div className="text-[7px] font-bold opacity-60 uppercase">Aadhaar / PAN fit</div>
                             </div>
                          </button>

                          <button
                            onClick={() => applyPreset('vivid')}
                            className={cn(
                              "flex items-center gap-2 p-2 rounded-[4px] border text-left transition-all cursor-pointer",
                              activePreset === 'vivid' ? "bg-black text-white border-black" : "bg-white border-[#E2E8F0] hover:bg-[#F1F5F9] text-black"
                            )}
                          >
                             <Sparkles className="w-3.5 h-3.5 shrink-0 text-[#FF591E]" />
                             <div>
                                <div className="text-[9px] font-extrabold uppercase tracking-tight">Vivid Photo</div>
                                <div className="text-[7px] font-bold opacity-60 uppercase">Color Pop</div>
                             </div>
                          </button>

                          <button
                            onClick={() => applyPreset('high_contrast')}
                            className={cn(
                              "flex items-center gap-2 p-2 rounded-[4px] border text-left transition-all cursor-pointer",
                              activePreset === 'high_contrast' ? "bg-black text-white border-black" : "bg-white border-[#E2E8F0] hover:bg-[#F1F5F9] text-black"
                            )}
                          >
                             <Contrast className="w-3.5 h-3.5 shrink-0 text-purple-600" />
                             <div>
                                <div className="text-[9px] font-extrabold uppercase tracking-tight">Mono Text</div>
                                <div className="text-[7px] font-bold opacity-60 uppercase">Crisp B&W</div>
                             </div>
                          </button>
                       </div>

                       <button
                          onClick={() => applyPreset('reset')}
                          className="w-full py-1.5 bg-white border border-[#E2E8F0] hover:bg-[#F1F5F9] rounded-[4px] text-[9px] font-bold uppercase tracking-[0.1em] text-[#7E8B9E] hover:text-black transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                       >
                          <RotateCcw className="w-3 h-3" /> Reset All Enhancements
                       </button>
                    </div>

                    <div className="h-[1px] bg-[#E2E8F0] w-full" />

                    {/* LAYOUT, PAPER SIZE & ORIENTATION CONTROLS */}
                    <div className="space-y-3">
                       <label className="text-[10px] font-bold text-[#7E8B9E] uppercase tracking-[0.1em] flex items-center justify-between">
                          <span>Paper Size & Orientation</span>
                       </label>
                       
                       {/* Paper Size Switcher */}
                       <div className="grid grid-cols-4 gap-1">
                          {(['A4', 'Legal', 'A3', 'Letter'] as const).map(s => (
                            <button
                              key={s}
                              onClick={() => setPaperSize(s)}
                              className={cn(
                                "py-1.5 rounded-[4px] border text-[9px] font-extrabold uppercase tracking-tight transition-all cursor-pointer",
                                paperSize === s ? "bg-black text-white border-black shadow-sm" : "bg-white border-[#E2E8F0] text-black hover:bg-[#F8FAFC]"
                              )}
                            >
                              {s}
                            </button>
                          ))}
                       </div>

                       <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={() => setOrientation('portrait')}
                            className={cn(
                              "h-[34px] flex items-center justify-center gap-1.5 rounded-[5.57px] border text-[10px] font-extrabold uppercase tracking-[0.1em] transition-all cursor-pointer",
                              orientation === 'portrait' ? "bg-black text-white border-black shadow-sm" : "bg-white border-[#E2E8F0] text-black hover:bg-[#F8FAFC]"
                            )}
                          >
                             <Layout className="w-3.5 h-3.5" /> Portrait {paperSize}
                          </button>
                          <button
                            onClick={() => setOrientation('landscape')}
                            className={cn(
                              "h-[34px] flex items-center justify-center gap-1.5 rounded-[5.57px] border text-[10px] font-extrabold uppercase tracking-[0.1em] transition-all cursor-pointer",
                              orientation === 'landscape' ? "bg-black text-white border-black shadow-sm" : "bg-white border-[#E2E8F0] text-black hover:bg-[#F8FAFC]"
                            )}
                          >
                             <Layout className="w-3.5 h-3.5 rotate-90" /> Landscape {paperSize}
                          </button>
                       </div>

                       <div className="grid grid-cols-3 gap-2 pt-1">
                          <button
                            onClick={() => setImgRect(prev => ({ ...prev, x: 0 }))}
                            className="h-[32px] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] rounded-[4px] text-[9px] font-bold uppercase tracking-tight text-black transition-all flex items-center justify-center gap-1 cursor-pointer"
                            title="Center Horizontally"
                          >
                             <AlignCenter className="w-3 h-3" /> Center X
                          </button>
                          <button
                            onClick={() => setImgRect(prev => ({ ...prev, y: 0 }))}
                            className="h-[32px] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] rounded-[4px] text-[9px] font-bold uppercase tracking-tight text-black transition-all flex items-center justify-center gap-1 cursor-pointer"
                            title="Center Vertically"
                          >
                             <AlignCenter className="w-3 h-3 rotate-90" /> Center Y
                          </button>
                          <button
                            onClick={() => {
                              const dims = getPaperDims(paperSize, orientation);
                              setImgRect(prev => ({ ...prev, x: 0, y: 0, w: dims.w * 0.9, h: (dims.w * 0.9) * (prev.h / prev.w) }));
                            }}
                            className="h-[32px] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] rounded-[4px] text-[9px] font-bold uppercase tracking-tight text-black transition-all flex items-center justify-center gap-1 cursor-pointer"
                            title="Fit 90% Page"
                          >
                             <Maximize className="w-3 h-3" /> Fit Page
                          </button>
                       </div>
                    </div>

                    <div className="h-[1px] bg-[#E2E8F0] w-full" />

                    {/* DOCUMENT WATERMARK & STAMP ENGINE */}
                    <div className="space-y-2.5">
                       <label className="text-[10px] font-bold text-[#7E8B9E] uppercase tracking-[0.1em] flex items-center justify-between">
                          <span className="flex items-center gap-1.5"><Stamp className="w-3.5 h-3.5 text-purple-600" /> Document Stamp Watermark</span>
                       </label>
                       <div className="grid grid-cols-3 gap-1">
                          {['NONE', 'CONFIDENTIAL', 'OFFICIAL COPY', 'DO NOT COPY', 'DRAFT', 'URGENT'].map(w => (
                            <button
                              key={w}
                              onClick={() => setWatermarkText(w)}
                              className={cn(
                                "py-1.5 rounded-[4px] border text-[8px] font-extrabold uppercase tracking-tight transition-all cursor-pointer truncate px-1",
                                watermarkText === w ? "bg-purple-900 text-white border-purple-900 shadow-sm" : "bg-white border-[#E2E8F0] text-black hover:bg-[#F8FAFC]"
                              )}
                            >
                               {w === 'NONE' ? 'Off' : w}
                            </button>
                          ))}
                       </div>
                    </div>

                    <div className="h-[1px] bg-[#E2E8F0] w-full" />

                    {/* Brightness & Exposure */}
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <div className="flex justify-between items-center">
                           <label className="text-[9px] font-bold text-[#7E8B9E] uppercase tracking-[0.1em]">Brightness</label>
                           <span className="text-[9px] font-bold text-black">{brightness}%</span>
                         </div>
                         <div className="flex items-center gap-2">
                           <Sun className="w-3.5 h-3.5 text-[#7E8B9E]" />
                           <input type="range" min="0" max="200" value={brightness} onChange={(e) => setBrightness(parseInt(e.target.value))} className="w-full h-1 bg-[#E2E8F0] rounded-lg appearance-none accent-black" />
                         </div>
                       </div>
                       <div className="space-y-2">
                         <div className="flex justify-between items-center">
                           <label className="text-[9px] font-bold text-[#7E8B9E] uppercase tracking-[0.1em]">Exposure</label>
                           <span className="text-[9px] font-bold text-black">{exposure}%</span>
                         </div>
                         <div className="flex items-center gap-2">
                           <Sparkles className="w-3.5 h-3.5 text-[#7E8B9E]" />
                           <input type="range" min="0" max="250" value={exposure} onChange={(e) => setExposure(parseInt(e.target.value))} className="w-full h-1 bg-[#E2E8F0] rounded-lg appearance-none accent-black" />
                         </div>
                       </div>
                    </div>

                    {/* Contrast & High Threshold */}
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <div className="flex justify-between items-center">
                           <label className="text-[9px] font-bold text-[#7E8B9E] uppercase tracking-[0.1em]">Contrast</label>
                           <span className="text-[9px] font-bold text-black">{contrast}%</span>
                         </div>
                         <div className="flex items-center gap-2">
                           <Contrast className="w-3.5 h-3.5 text-[#7E8B9E]" />
                           <input type="range" min="0" max="200" value={contrast} onChange={(e) => setContrast(parseInt(e.target.value))} className="w-full h-1 bg-[#E2E8F0] rounded-lg appearance-none accent-black" />
                         </div>
                       </div>
                       <div className="space-y-2">
                         <div className="flex justify-between items-center">
                           <label className="text-[9px] font-bold text-[#7E8B9E] uppercase tracking-[0.1em]">Threshold</label>
                           <span className="text-[9px] font-bold text-black">{threshold === 0 ? "OFF" : threshold}</span>
                         </div>
                         <div className="flex items-center gap-2">
                           <Layers className="w-3.5 h-3.5 text-[#7E8B9E]" />
                           <input type="range" min="0" max="200" value={threshold} onChange={(e) => setThreshold(parseInt(e.target.value))} className="w-full h-1 bg-[#E2E8F0] rounded-lg appearance-none accent-black" />
                         </div>
                       </div>
                    </div>

                    <div className="h-[1px] bg-[#E2E8F0] w-full" />

                    {/* Hue & Saturation */}
                    <div className="space-y-3">
                       <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold text-[#7E8B9E] uppercase tracking-[0.1em]">Hue & Saturation</label>
                          <div className="flex gap-2 text-[9px] font-bold text-black">
                             <span>H: {hue}°</span>
                             <span>S: {saturation}%</span>
                          </div>
                       </div>
                       <div className="flex items-center gap-2 mb-2">
                         <Droplet className="w-3.5 h-3.5 text-[#7E8B9E]" />
                         <input type="range" min="0" max="360" value={hue} onChange={(e) => setHue(parseInt(e.target.value))} className="w-full h-1.5 bg-[#E2E8F0] rounded-lg appearance-none accent-black" />
                       </div>
                       <div className="flex items-center gap-2">
                         <div className="w-3.5 h-3.5" />
                         <input type="range" min="0" max="200" value={saturation} onChange={(e) => setSaturation(parseInt(e.target.value))} className="w-full h-1.5 bg-[#E2E8F0] rounded-lg appearance-none accent-black" />
                       </div>
                    </div>

                    <div className="h-[1px] bg-[#E2E8F0] w-full" />

                    {/* IMAGE SCALE-UP CONTROL */}
                    <div className="space-y-3 bg-gradient-to-br from-[#0F0F23] to-[#1a1a3e] border border-[#3568FF]/30 p-4 rounded-[5.57px] shadow-lg">
                       <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-white uppercase tracking-[0.1em] flex items-center gap-1.5">
                             <ZoomIn className="w-3.5 h-3.5 text-[#3568FF]" /> Image Scale
                          </label>
                          <div className="flex items-center gap-2">
                             <span className="text-[11px] font-black text-white tabular-nums">{imageScale}%</span>
                             <button
                               onClick={() => {
                                 setImageScale(100);
                                 if (naturalImgSize.current) {
                                   setImgRect(prev => ({ ...prev, w: naturalImgSize.current!.w, h: naturalImgSize.current!.h }));
                                 }
                               }}
                               className="text-[8px] font-bold uppercase tracking-wider text-[#3568FF] hover:text-white transition-colors cursor-pointer"
                             >Reset</button>
                          </div>
                       </div>

                       {/* Main Scale Slider */}
                       <div className="space-y-1">
                         <div className="relative">
                           <input
                             type="range"
                             min="25"
                             max="300"
                             step="1"
                             value={imageScale}
                             onChange={(e) => {
                               const s = parseInt(e.target.value);
                               setImageScale(s);
                               if (naturalImgSize.current) {
                                 setImgRect(prev => ({
                                   ...prev,
                                   w: naturalImgSize.current!.w * s / 100,
                                   h: naturalImgSize.current!.h * s / 100,
                                 }));
                               }
                             }}
                             className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#3568FF]"
                             style={{
                               background: `linear-gradient(to right, #3568FF 0%, #3568FF ${((imageScale - 25) / 275) * 100}%, #2d2d4e ${((imageScale - 25) / 275) * 100}%, #2d2d4e 100%)`
                             }}
                           />
                         </div>
                         <div className="flex justify-between text-[8px] font-bold text-[#7E8B9E] uppercase">
                           <span>25%</span><span>100%</span><span>200%</span><span>300%</span>
                         </div>
                       </div>

                       {/* Quick Scale Preset Buttons */}
                       <div className="grid grid-cols-4 gap-1.5">
                         {[50, 75, 100, 125, 150, 200, 250, 300].map(pct => (
                           <button
                             key={pct}
                             onClick={() => {
                               setImageScale(pct);
                               if (naturalImgSize.current) {
                                 setImgRect(prev => ({
                                   ...prev,
                                   w: naturalImgSize.current!.w * pct / 100,
                                   h: naturalImgSize.current!.h * pct / 100,
                                 }));
                               }
                             }}
                             className={cn(
                               "h-[26px] rounded-[4px] text-[9px] font-extrabold uppercase tracking-tight transition-all cursor-pointer",
                               imageScale === pct
                                 ? "bg-[#3568FF] text-white shadow-sm"
                                 : "bg-[#2d2d4e] text-[#7E8B9E] hover:bg-[#3568FF]/20 hover:text-white"
                             )}
                           >
                             {pct}%
                           </button>
                         ))}
                       </div>

                       {/* Fill Page Button */}
                       <button
                         onClick={() => {
                           const sheetW = orientation === 'portrait' ? 595.27 : 841.88;
                           const sheetH = orientation === 'portrait' ? 841.88 : 595.27;
                           if (naturalImgSize.current) {
                             const ratio = naturalImgSize.current.w / naturalImgSize.current.h;
                             let fw = sheetW * 0.95;
                             let fh = fw / ratio;
                             if (fh > sheetH * 0.95) { fh = sheetH * 0.95; fw = fh * ratio; }
                             const newScale = Math.round((fw / naturalImgSize.current.w) * 100);
                             setImageScale(newScale);
                             setImgRect(prev => ({ ...prev, x: 0, y: 0, w: fw, h: fh }));
                           }
                         }}
                         className="w-full h-[30px] bg-[#3568FF]/10 border border-[#3568FF]/30 hover:bg-[#3568FF] text-[#3568FF] hover:text-white rounded-[4px] text-[9px] font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                       >
                         <Maximize className="w-3 h-3" /> Fill Page (95%)
                       </button>
                    </div>

                    <div className="h-[1px] bg-[#E2E8F0] w-full" />

                    {/* Content Scaling (PDF) */}
                    <div className="space-y-3">
                       <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold text-[#7E8B9E] uppercase tracking-[0.1em]">PDF Content Scale</label>
                          <span className="text-[10px] font-bold text-black">{contentScale}%</span>
                       </div>
                       <div className="flex items-center gap-2">
                         <Maximize className="w-3.5 h-3.5 text-[#7E8B9E]" />
                         <input type="range" min="50" max="200" value={contentScale} onChange={(e) => setContentScale(parseInt(e.target.value))} className="w-full h-1.5 bg-[#E2E8F0] rounded-lg appearance-none accent-black" />
                       </div>
                    </div>

                    <div className="h-[1px] bg-[#E2E8F0] w-full" />

                    {/* POSTER PRINTING & TILING ENGINE */}
                    <div className="space-y-3 bg-gradient-to-br from-indigo-950 to-slate-900 border border-indigo-500/30 p-4 rounded-[5.57px] shadow-lg">
                       <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-white uppercase tracking-[0.1em] flex items-center gap-1.5">
                             <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" /> Poster Printing & Tiling
                          </label>
                          <span className="text-[9px] font-bold text-indigo-300 uppercase">{posterMode === '1x1' ? 'Single Sheet' : `${posterMode} Poster`}</span>
                       </div>

                       <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { id: '1x1', label: 'Single', desc: '1 Page' },
                            { id: '2x2', label: '2×2 Poster', desc: '4 Pages Grid' },
                            { id: '3x3', label: '3×3 Poster', desc: '9 Pages Grid' },
                          ].map(p => (
                            <button
                              key={p.id}
                              onClick={() => setPosterMode(p.id as any)}
                              className={cn(
                                "py-2 px-1 rounded-[4px] border text-center transition-all cursor-pointer",
                                posterMode === p.id ? "bg-indigo-600 text-white border-indigo-500 shadow-md" : "bg-indigo-900/40 text-indigo-200 border-indigo-800/60 hover:bg-indigo-800/50"
                              )}
                            >
                               <div className="text-[9px] font-extrabold uppercase tracking-tight">{p.label}</div>
                               <div className="text-[7px] font-bold opacity-70 uppercase mt-0.5">{p.desc}</div>
                            </button>
                          ))}
                       </div>

                       {/* Poster Fill Quick Presets */}
                       <div className="grid grid-cols-2 gap-1.5 pt-1">
                          <button
                            onClick={() => {
                              const dims = currentDims;
                              const ratio = naturalImgSize.current ? naturalImgSize.current.w / naturalImgSize.current.h : 1;
                              let fw = dims.w;
                              let fh = fw / ratio;
                              if (fh < dims.h) { fh = dims.h; fw = fh * ratio; }
                              setImgRect(prev => ({ ...prev, x: 0, y: 0, w: fw, h: fh }));
                              if (naturalImgSize.current) {
                                setImageScale(Math.round((fw / naturalImgSize.current.w) * 100));
                              }
                            }}
                            className="h-[28px] bg-indigo-900/60 border border-indigo-700/60 hover:bg-indigo-600 text-white rounded-[4px] text-[8px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                             <Maximize className="w-3 h-3 text-indigo-300" /> Full Cover (100% Bleed)
                          </button>
                          <button
                            onClick={() => {
                              const dims = currentDims;
                              setImgRect(prev => ({ ...prev, x: 0, y: 0, w: dims.w, h: dims.h }));
                              if (naturalImgSize.current) {
                                setImageScale(Math.round((dims.w / naturalImgSize.current.w) * 100));
                              }
                            }}
                            className="h-[28px] bg-indigo-900/60 border border-indigo-700/60 hover:bg-indigo-600 text-white rounded-[4px] text-[8px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                             <Maximize className="w-3 h-3 text-indigo-300" /> Stretch Fill Sheet
                          </button>
                       </div>
                    </div>

                    <div className="h-[1px] bg-[#E2E8F0] w-full" />

                    {/* Quick Transform Grid */}
                    <div className="grid grid-cols-2 gap-2">
                       <button onClick={() => setInvert(!invert)} className={cn("h-[36px] flex items-center justify-center gap-1.5 rounded-[5.57px] border text-[11px] font-bold uppercase tracking-[0.1em] transition-all cursor-pointer", invert ? "bg-black text-white border-black" : "bg-white border-[#E2E8F0] text-black hover:bg-[#F8FAFC]")}>
                         Invert
                       </button>
                       <button onClick={() => {
                         setRotation(r => (r + 90) % 360);
                         // Reset crop and position when rotating to ensure stability
                         setCropRect({ t: 0, b: 0, l: 0, r: 0 });
                         setImgRect(prev => ({ ...prev, x: 0, y: 0 }));
                         setIsCropMode(false);
                       }} className="h-[36px] flex items-center justify-center gap-1.5 rounded-[5.57px] border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-black text-[11px] font-bold uppercase tracking-[0.1em] transition-all cursor-pointer">
                         Rotate
                       </button>
                       <button onClick={() => setMirrorH(!mirrorH)} className={cn("h-[36px] flex items-center justify-center gap-1.5 rounded-[5.57px] border text-[11px] font-bold uppercase tracking-[0.1em] transition-all cursor-pointer", mirrorH ? "bg-[#3568FF] text-white border-[#3568FF]" : "bg-white border-[#E2E8F0] text-black hover:bg-[#F8FAFC]")}>
                         Mirror H
                       </button>
                       <button onClick={() => setMirrorV(!mirrorV)} className={cn("h-[36px] flex items-center justify-center gap-1.5 rounded-[5.57px] border text-[11px] font-bold uppercase tracking-[0.1em] transition-all cursor-pointer", mirrorV ? "bg-[#3568FF] text-white border-[#3568FF]" : "bg-white border-[#E2E8F0] text-black hover:bg-[#F8FAFC]")}>
                         Mirror V
                       </button>
                    </div>
                    
                    <button 
                      onClick={commitCrop} 
                      disabled={rotation !== 0}
                      className={cn("w-full h-[40px] flex items-center justify-center gap-2 rounded-[5.57px] border transition-all font-bold uppercase tracking-[0.1em] text-[11px] shadow-sm cursor-pointer", 
                        isCropMode ? "bg-[#059669] text-white border-[#059669]" : "bg-black text-white border-black hover:bg-black/90",
                        rotation !== 0 && "opacity-50 cursor-not-allowed"
                      )}
                    >
                       <Crop className="w-3.5 h-3.5" /> {rotation !== 0 ? "Reset Rotation to Crop" : (isCropMode ? "Confirm & Apply Crop" : "Crop Image Mode")}
                    </button>

                    <div className="mt-2 bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-[5.57px] flex gap-2">
                       <Sparkles className="w-3.5 h-3.5 text-[#3568FF] shrink-0 mt-0.5" />
                       <p className="text-[9px] font-bold text-[#7E8B9E] uppercase tracking-[0.1em] leading-relaxed"> Laboratory effects apply to the entire mesh stream in real-time. </p>
                    </div>
                 </div>
              )}
           </div>

           {/* FINAL ACTION SECTION */}
           <div className="p-6 pb-8 border-t border-[#E2E8F0] bg-[#F8FAFC] flex flex-col gap-3 relative z-40">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.1em] text-[#7E8B9E] mb-1">
                 <span>Total Spool Size</span>
                 <span className="text-black font-black">{(copies * (numPages || 1))} PAGES</span>
              </div>
              <button 
                onClick={handlePrint}
                disabled={status !== 'idle'}
                className="w-full h-[42px] bg-black text-white hover:bg-black/90 font-bold text-[12px] uppercase tracking-[0.1em] rounded-[5.57px] transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/10 disabled:opacity-50"
              >
                {status === 'printing' ? <RefreshCw className="w-4 h-4 animate-spin" /> : status === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <Printer className="w-4 h-4" />}
                {status === 'printing' ? 'Spooling...' : status === 'success' ? 'Ready' : 'Print'}
              </button>
           </div>
        </div>

        {/* === ULTRA-WIDE CONTINUOUS PREVIEW === */}
        <div className="flex-1 bg-[#F8FAFC] relative flex flex-col overflow-hidden">
           
           {/* Studio Top Control Overlay Bar */}
           <div className="absolute top-4 left-6 right-6 flex items-center justify-between z-[100] pointer-events-none">
              <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md border border-[#E2E8F0] p-1.5 rounded-[5.57px] shadow-sm pointer-events-auto">
                 <button
                   onClick={() => setOrientation(o => o === 'portrait' ? 'landscape' : 'portrait')}
                   className="h-[30px] px-3 flex items-center gap-1.5 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] rounded-[4px] text-[10px] font-bold uppercase tracking-wider text-black transition-all cursor-pointer"
                 >
                    <Layout className={cn("w-3.5 h-3.5", orientation === 'landscape' && "rotate-90")} />
                    {orientation === 'portrait' ? 'Portrait' : 'Landscape'}
                 </button>
                 <div className="w-[1px] h-5 bg-[#E2E8F0]" />
                 <button
                   onClick={() => setShowMarginGuide(g => !g)}
                   className={cn(
                     "h-[30px] px-2.5 flex items-center gap-1.5 border rounded-[4px] text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer",
                     showMarginGuide ? "bg-red-50 text-red-600 border-red-200" : "bg-white text-[#7E8B9E] border-[#E2E8F0]"
                   )}
                   title="Toggle 5mm Printable Safety Margin"
                 >
                    <ScanLine className="w-3.5 h-3.5" /> Safety Margin
                 </button>
                 <button
                   onClick={() => setShowCenterGrid(g => !g)}
                   className={cn(
                     "h-[30px] px-2.5 flex items-center gap-1.5 border rounded-[4px] text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer",
                     showCenterGrid ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-white text-[#7E8B9E] border-[#E2E8F0]"
                   )}
                   title="Toggle Alignment Grid Lines"
                 >
                    <Grid className="w-3.5 h-3.5" /> Center Grid
                 </button>
              </div>

              {appliedSettingsMessage && (
                <div className="px-3 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-wider rounded-[5.57px] shadow-lg animate-in fade-in slide-in-from-top duration-300 pointer-events-auto">
                   ✨ {appliedSettingsMessage}
                </div>
              )}
           </div>

           {/* Studio Bottom Tools Bar */}
           <div className="absolute bottom-6 right-6 flex items-center gap-2 bg-white border border-[#E2E8F0] p-1.5 rounded-[5.57px] shadow-sm z-[100] animate-in slide-in-from-right duration-500">
              <div className="flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-[4px] border border-[#E2E8F0]">
                 <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="h-[28px] w-[32px] flex items-center justify-center hover:bg-white border border-transparent hover:border-[#E2E8F0] rounded-[4px] text-black transition-all active:scale-95 cursor-pointer"><Minus className="w-[14px] h-[14px]" /></button>
                 <div className="w-12 text-center">
                    <span className="text-[11px] font-bold text-black">{Math.round(zoom * 100)}%</span>
                 </div>
                 <button onClick={() => setZoom(z => Math.min(3.0, z + 0.1))} className="h-[28px] w-[32px] flex items-center justify-center hover:bg-white border border-transparent hover:border-[#E2E8F0] rounded-[4px] text-black transition-all active:scale-95 cursor-pointer"><Plus className="w-[14px] h-[14px]" /></button>
              </div>
              <div className="w-[1px] h-6 bg-[#E2E8F0] mx-1" />
              <button onClick={() => { setZoom(0.8); setRotation(0); }} className="h-[36px] w-[36px] flex items-center justify-center hover:bg-[#F8FAFC] border border-transparent hover:border-[#E2E8F0] rounded-[4px] text-black transition-all active:rotate-180 duration-500 cursor-pointer"><RotateCcw className="w-[14px] h-[14px]" /></button>
           </div>

           {/* Continuous Scroll Surface */}
           <div 
             ref={previewContainerRef}
             className="flex-1 overflow-y-auto overflow-x-hidden relative custom-scrollbar p-12 touch-none"
             style={{ 
               backgroundImage: 'linear-gradient(45deg, #E2E8F0 25%, transparent 25%, transparent 75%, #E2E8F0 75%, #E2E8F0), linear-gradient(45deg, #E2E8F0 25%, transparent 25%, transparent 75%, #E2E8F0 75%, #E2E8F0)',
               backgroundSize: '20px 20px',
               backgroundPosition: '0 0, 10px 10px',
               backgroundColor: '#F8FAFC'
             }}
           >
              <div 
                className="max-w-max mx-auto space-y-0 pb-24 h-full"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.1s ease-out' }}
              >
                  {documentPath ? (
                    isImage ? (
                       <div className="flex flex-col items-center gap-[40px] py-6">
                          <div className="relative group transition-all duration-300 ease-out">
                             <div 
                               className={cn("bg-white border border-[#E2E8F0] relative overflow-hidden transition-all duration-300", isCropMode ? "shadow-2xl ring-4 ring-black/5" : "shadow-[0px_4px_24px_rgba(0,0,0,0.06)]")}
                               style={{ 
                                 width: `${getPaperDims(paperSize, orientation).w}px`, 
                                 height: `${getPaperDims(paperSize, orientation).h}px` 
                               }}
                             >
                                {/* Watermark Stamp Overlay */}
                                {watermarkText !== 'NONE' && (
                                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 overflow-hidden">
                                      <span className="text-[36px] font-black text-red-500/20 uppercase tracking-[0.3em] rotate-[-35deg] border-4 border-dashed border-red-500/20 px-8 py-3 rounded-2xl select-none whitespace-nowrap">
                                         {watermarkText}
                                      </span>
                                   </div>
                                )}
                                {/* Safety Margin Overlay Guide (5mm) */}
                                {showMarginGuide && (
                                  <div className="absolute inset-[14px] border border-dashed border-red-400/40 pointer-events-none z-30 flex items-start justify-end p-1">
                                     <span className="text-[7px] font-bold text-red-400/70 uppercase tracking-widest bg-white/80 px-1 rounded">5mm Printable Zone</span>
                                  </div>
                                )}

                                {/* Center Crosshair Grid Overlay */}
                                {showCenterGrid && (
                                  <div className="absolute inset-0 pointer-events-none z-30">
                                     <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-blue-400/40 border-r border-dashed border-blue-400/40" />
                                     <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-blue-400/40 border-b border-dashed border-blue-400/40" />
                                  </div>
                                )}

                                {/* POSTER TILING GRID OVERLAY (2x2 or 3x3) */}
                                {posterMode !== '1x1' && (
                                  <div className="absolute inset-0 pointer-events-none z-30 border-2 border-indigo-500/60">
                                     <div className={cn("grid w-full h-full divide-x-2 divide-y-2 divide-indigo-500/60 divide-dashed", posterMode === '2x2' ? 'grid-cols-2 grid-rows-2' : 'grid-cols-3 grid-rows-3')}>
                                        {Array.from({ length: posterMode === '2x2' ? 4 : 9 }).map((_, idx) => (
                                          <div key={idx} className="flex items-center justify-center p-2 bg-indigo-500/5">
                                             <span className="text-[10px] font-black text-indigo-600 bg-white/90 px-2 py-1 rounded shadow-sm border border-indigo-200">
                                                Tile Page {idx + 1}
                                             </span>
                                          </div>
                                        ))}
                                     </div>
                                  </div>
                                )}

                                {/* === FIGMA-STYLE IMAGE CONTAINER WITH RESIZE HANDLES === */}
                                 {(() => {
                                   // 8 handles: corners + edge midpoints
                                   const handles = [
                                     // Corners
                                     { id: 'nw', cursor: 'cursor-nw-resize', style: { left: -5, top: -5 } },
                                     { id: 'ne', cursor: 'cursor-ne-resize', style: { right: -5, top: -5 } },
                                     { id: 'sw', cursor: 'cursor-sw-resize', style: { left: -5, bottom: -5 } },
                                     { id: 'se', cursor: 'cursor-se-resize', style: { right: -5, bottom: -5 } },
                                     // Edge midpoints
                                     { id: 'n', cursor: 'cursor-n-resize', style: { left: '50%', top: -5, transform: 'translateX(-50%)' } },
                                     { id: 's', cursor: 'cursor-s-resize', style: { left: '50%', bottom: -5, transform: 'translateX(-50%)' } },
                                     { id: 'w', cursor: 'cursor-w-resize', style: { top: '50%', left: -5, transform: 'translateY(-50%)' } },
                                     { id: 'e', cursor: 'cursor-e-resize', style: { top: '50%', right: -5, transform: 'translateY(-50%)' } },
                                   ];
                                   const isCorner = (id: string) => id.length === 2;

                                   return (
                                     <div
                                       className="absolute group/img"
                                       style={{ 
                                         left: `calc(50% + ${imgRect.x}px)`, 
                                         top: `calc(50% + ${imgRect.y}px)`, 
                                         width: `${imgRect.w}px`, 
                                         height: `${imgRect.h}px`,
                                         transform: 'translate(-50%, -50%)',
                                         rotate: `${rotation}deg`,
                                         scale: `${mirrorH ? -1 : 1} ${mirrorV ? -1 : 1}`,
                                       }}
                                     >
                                       {/* Drag-to-Move layer — sits behind handles */}
                                       <div
                                         className="absolute inset-0 z-10"
                                         style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                                         onMouseDown={onStartDrag}
                                         onContextMenu={(e) => {
                                           e.preventDefault();
                                           setIsCropMode(!isCropMode);
                                         }}
                                       />

                                       {/* Figma selection border — only in normal (non-crop) mode */}
                                       {!isCropMode && (
                                         <div className="absolute inset-0 z-20 pointer-events-none opacity-0 group-hover/img:opacity-100 transition-opacity duration-150">
                                           <div className="absolute inset-0 border-2 border-[#3568FF] rounded-[1px]" />

                                           {/* Size tooltip on hover */}
                                           <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#3568FF] text-white text-[9px] font-black px-2 py-0.5 rounded whitespace-nowrap shadow-lg">
                                             {Math.round(imgRect.w)} × {Math.round(imgRect.h)} pt &nbsp;·&nbsp; {imageScale}%
                                           </div>
                                         </div>
                                       )}

                                       {/* 8 Figma resize handles — normal mode only, show on hover */}
                                       {!isCropMode && handles.map(h => (
                                         <div
                                           key={h.id}
                                           className={`absolute z-30 opacity-0 group-hover/img:opacity-100 transition-opacity duration-150 ${h.cursor}`}
                                           style={{
                                             ...h.style,
                                             width: isCorner(h.id) ? 10 : (h.id === 'n' || h.id === 's' ? 20 : 10),
                                             height: isCorner(h.id) ? 10 : (h.id === 'e' || h.id === 'w' ? 20 : 10),
                                           }}
                                           onMouseDown={(e) => {
                                             e.stopPropagation();
                                             onStartResize(e, h.id);
                                           }}
                                         >
                                           {/* Visual handle dot */}
                                           <div
                                             className={`absolute inset-0 rounded-sm bg-white border-2 border-[#3568FF] shadow-[0_0_0_1px_rgba(0,0,0,0.15)] hover:scale-125 transition-transform`}
                                           />
                                         </div>
                                       ))}

                                       {/* The Full Image */}
                                       <div className="relative w-full h-full overflow-hidden">
                                         <img 
                                           id="laboratory-preview-image"
                                           src={documentPath} 
                                           alt="Laboratory Mesh" 
                                           crossOrigin="anonymous"
                                           className="absolute block m-0 p-0 pointer-events-none select-none"
                                           style={{ 
                                             left: -cropRect.l,
                                             top: -cropRect.t,
                                             width: imgRect.w,
                                             height: imgRect.h,
                                             clipPath: isCropMode ? `inset(${cropRect.t}px ${cropRect.r}px ${cropRect.b}px ${cropRect.l}px)` : 'none',
                                             opacity: isCropMode ? 0.4 : 1,
                                             filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) invert(${invert ? 1 : 0}) hue-rotate(${hue}deg) ${colorMode === 'monochrome' ? 'grayscale(1)' : ''}`,
                                           }}
                                           onLoad={(e) => {
                                             setNumPages(1);
                                             const img = e.currentTarget;
                                             const sheetW = orientation === 'portrait' ? 595.27 : 841.88;
                                             const sheetH = orientation === 'portrait' ? 841.88 : 595.27;
                                             const ratio = img.naturalWidth / img.naturalHeight;
                                             
                                             // Calculate max width/height that fits within A4 while maintaining ratio
                                             let finalW = sheetW * 0.9;
                                             let finalH = finalW / ratio;
                                             
                                             if (finalH > sheetH * 0.9) {
                                               finalH = sheetH * 0.9;
                                               finalW = finalH * ratio;
                                             }

                                             // Store natural fitted dimensions as 100% base for scale control
                                             naturalImgSize.current = { w: finalW, h: finalH };
                                             setImageScale(100);
                                             setImgRect(prev => ({ ...prev, w: finalW, h: finalH }));
                                           }}
                                         />

                                         {/* Crop overlay - inside rotated container to rotate with image */}
                                         {isCropMode && (
                                           <>
                                             {/* Dark overlay outside crop area */}
                                             <div 
                                               className="absolute bg-black/50 z-10 pointer-events-none"
                                               style={{
                                                 left: 0,
                                                 top: 0,
                                                 width: imgRect.w,
                                                 height: cropRect.t,
                                               }}
                                             />
                                             <div 
                                               className="absolute bg-black/50 z-10 pointer-events-none"
                                               style={{
                                                 left: 0,
                                                 top: imgRect.h - cropRect.b,
                                                 width: imgRect.w,
                                                 height: cropRect.b,
                                               }}
                                             />
                                             <div 
                                               className="absolute bg-black/50 z-10 pointer-events-none"
                                               style={{
                                                 left: 0,
                                                 top: cropRect.t,
                                                 width: cropRect.l,
                                                 height: imgRect.h - cropRect.t - cropRect.b,
                                               }}
                                             />
                                             <div 
                                               className="absolute bg-black/50 z-10 pointer-events-none"
                                               style={{
                                                 left: imgRect.w - cropRect.r,
                                                 top: cropRect.t,
                                                 width: cropRect.r,
                                                 height: imgRect.h - cropRect.t - cropRect.b,
                                               }}
                                             />

                                             {/* Crop selection box */}
                                             <div 
                                               className="absolute z-20 border-2 border-white shadow-lg pointer-events-auto"
                                               style={{
                                                 left: cropRect.l,
                                                 top: cropRect.t,
                                                 width: imgRect.w - cropRect.l - cropRect.r,
                                                 height: imgRect.h - cropRect.t - cropRect.b,
                                                 boxShadow: '0 0 0 1px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.5)',
                                               }}
                                             >
                                               {/* Grid lines */}
                                               <div className="absolute inset-0 pointer-events-none">
                                                 <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/50" />
                                                 <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/50" />
                                                 <div className="absolute top-1/3 left-0 right-0 h-px bg-white/50" />
                                                 <div className="absolute top-2/3 left-0 right-0 h-px bg-white/50" />
                                               </div>

                                               {/* Dimensions label */}
                                               <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/70 text-white text-[9px] font-bold px-2 py-0.5 rounded whitespace-nowrap">
                                                 {Math.round(imgRect.w - cropRect.l - cropRect.r)} × {Math.round(imgRect.h - cropRect.t - cropRect.b)} px
                                               </div>
                                             </div>

                                             {/* Crop Handles */}
                                             <div className="absolute inset-0 z-30 pointer-events-auto">
                                               {['nw', 'ne', 'sw', 'se'].map(h => (
                                                 <div 
                                                   key={h}
                                                   className={cn(
                                                     "absolute transition-all hover:scale-110",
                                                     "w-5 h-5 bg-white border-2 border-[#3568FF] rounded-full shadow-md",
                                                     h === 'nw' && "cursor-nw-resize",
                                                     h === 'ne' && "cursor-ne-resize", 
                                                     h === 'sw' && "cursor-sw-resize",
                                                     h === 'se' && "cursor-se-resize"
                                                   )}
                                                   style={{
                                                     left: h === 'nw' || h === 'sw' ? cropRect.l - 10 : imgRect.w - cropRect.r - 10,
                                                     top: h === 'nw' || h === 'ne' ? cropRect.t - 10 : imgRect.h - cropRect.b - 10,
                                                   }}
                                                   onMouseDown={(e) => onStartResize(e, h)}
                                                 />
                                               ))}
                                               {['n', 's'].map(h => (
                                                 <div 
                                                   key={h}
                                                   className="absolute transition-all hover:scale-110 w-8 h-3 bg-white border-2 border-[#3568FF] rounded-full shadow-md cursor-ns-resize"
                                                   style={{
                                                     left: cropRect.l + (imgRect.w - cropRect.l - cropRect.r) / 2 - 16,
                                                     top: h === 'n' ? cropRect.t - 6 : imgRect.h - cropRect.b - 6,
                                                   }}
                                                   onMouseDown={(e) => onStartResize(e, h)}
                                                 />
                                               ))}
                                               {['e', 'w'].map(h => (
                                                 <div 
                                                   key={h}
                                                   className="absolute transition-all hover:scale-110 w-3 h-8 bg-white border-2 border-[#3568FF] rounded-full shadow-md cursor-ew-resize"
                                                   style={{
                                                     left: h === 'w' ? cropRect.l - 6 : imgRect.w - cropRect.r - 6,
                                                     top: cropRect.t + (imgRect.h - cropRect.t - cropRect.b) / 2 - 16,
                                                   }}
                                                   onMouseDown={(e) => onStartResize(e, h)}
                                                 />
                                               ))}
                                             </div>
                                           </>
                                         )}
                                       </div>
                                     </div>
                                   );
                                 })()}
                              </div>
                           </div>
                       </div>
                    ) : (isRawFormat || pdfError) ? (
                      <div className="flex flex-col items-center justify-center py-20 px-10 text-center gap-4 opacity-50">
                        <FileText className="w-16 h-16 text-[#7E8B9E]" strokeWidth={1.5} />
                        <div>
                          <p className="text-[14px] font-bold text-black uppercase tracking-[0.1em]">Raw Data Format</p>
                          <p className="text-[10px] font-bold text-[#7E8B9E] uppercase tracking-[0.1em] mt-1">This format will be sent raw to the printer.</p>
                        </div>
                      </div>
                    ) : (
                      <Document
                        file={documentPath}
                        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                        onLoadError={() => setPdfError(true)}
                        loading={<div className="flex items-center justify-center h-full"><RefreshCw className="w-8 h-8 animate-spin text-[#7E8B9E]" /></div>}
                      >
                        <div className="flex flex-col items-center gap-[40px] py-6">
                           {Array.from(new Array(numPages || 0), (el, index) => (
                            <div 
                              key={`page_${index + 1}`} 
                              className="relative group transition-all duration-300 ease-out"
                              style={{ 
                                 filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) invert(${invert ? 1 : 0}) hue-rotate(${hue}deg) ${colorMode === 'monochrome' ? 'grayscale(1)' : ''}`,
                                 transformOrigin: 'top center',
                                 transform: `scaleX(${mirrorH ? -1 : 1}) scaleY(${mirrorV ? -1 : 1})`
                              }}
                            >
                               
                               <div 
                                 className={cn("bg-white shadow-[0px_4px_24px_rgba(0,0,0,0.06)] border border-[#E2E8F0] relative overflow-hidden flex items-center justify-center transition-all duration-300")}
                                 style={{ width: '595px', height: '842px' }}
                               >
                                  <Page 
                                    pageNumber={index + 1} 
                                    width={595} 
                                    scale={contentScale/100}
                                    rotate={rotation}
                                    renderTextLayer={false} 
                                    renderAnnotationLayer={false}
                                  />

                                  {/* Crop Guide Mockup */}
                                  {isCropMode && (
                                    <div className="absolute inset-4 border-2 border-dashed border-[#3568FF]/50 flex items-center justify-center animate-pulse">
                                       <Move className="w-12 h-12 text-[#3568FF]/20" />
                                    </div>
                                  )}
                               </div>
                            </div>
                           ))}
                        </div>
                      </Document>
                    )
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-4 opacity-40">
                       <FileText className="w-16 h-16 text-[#7E8B9E]" strokeWidth={1.5} />
                       <p className="text-[11px] font-bold text-[#7E8B9E] uppercase tracking-[0.2em] animate-pulse">Awaiting Protocol Stream...</p>
                    </div>
                  )}
              </div>
           </div>

        </div>

      </div>

      {/* === HIDDEN HIGH-FIDELITY PRINT LAYER (A4 PROTOCOL) === */}
      {typeof document !== 'undefined' && createPortal(
         <div id="xeroxq-print-layer" className="hidden">
            {bakedPages.map((src, i) => (
              <div key={i} className="print-page w-[210mm] h-[297mm] flex items-center justify-center p-0 m-0 bg-white overflow-hidden" style={{ pageBreakAfter: 'always' }}>
                 <img 
                   src={src} 
                   className="max-w-full max-h-full object-contain block m-0 p-0" 
                   alt={`Baked Page ${i+1}`} 
                 />
              </div>
            ))}
         </div>,
         document.body
      )}

      {/* BAKE LOADING OVERLAY */}
      {isBaking && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-[200] flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500 hover:cursor-wait">
           <div className="flex flex-col items-center gap-6 w-full max-w-sm p-10">
              <RefreshCw className="w-12 h-12 text-black animate-spin" />
              <div className="text-center space-y-2">
                 <h2 className="text-[20px] font-bold text-black tracking-tight leading-none">Baking High-Fidelity Mesh</h2>
                 <p className="text-[#7E8B9E] text-[10px] font-bold tracking-[0.1em] uppercase">Applying Hardware Protocol Targets</p>
                 
                 <div className="grid grid-cols-2 gap-3 mt-6">
                    <div className="bg-[#F8FAFC] p-3 rounded-[5.57px] border border-[#E2E8F0] flex flex-col items-center">
                       <span className="text-[9px] font-bold text-[#7E8B9E] uppercase tracking-[0.1em] mb-1">Color Mode</span>
                       <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-black">{colorMode === 'monochrome' ? 'B&W (Baked)' : 'Full Color'}</span>
                    </div>
                    <div className="bg-[#F8FAFC] p-3 rounded-[5.57px] border border-[#E2E8F0] flex flex-col items-center">
                       <span className="text-[9px] font-bold text-[#7E8B9E] uppercase tracking-[0.1em] mb-1">Duplex Layer</span>
                       <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-black">{sides === 'duplex' ? 'Double Side' : 'Single Side'}</span>
                    </div>
                 </div>

                 {sides === 'duplex' && (
                    <div className="bg-orange-50 p-3 rounded-[5.57px] border border-orange-200 mt-3 animate-pulse">
                       <p className="text-[10px] font-bold text-[#FF591E] uppercase tracking-[0.05em]">Note: Ensure "Two-sided" is checked in the next window.</p>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* GLOBAL SUCCESS TRANSMISSION OVERLAY */}
      {status === 'success' && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center animate-in fade-in duration-700">
           <div className="w-16 h-16 bg-[#059669] rounded-[16px] flex items-center justify-center mb-6 shadow-xl shadow-[#059669]/20 animate-bounce">
              <CheckCircle2 className="w-8 h-8 text-white" strokeWidth={3} />
           </div>
           <h2 className="text-[24px] font-bold text-black tracking-tight leading-none mb-2">Spool Successful</h2>
           <p className="text-[#7E8B9E] text-[10px] font-bold tracking-[0.1em] uppercase">Transmission Protocol Finalized</p>
           {appliedSettingsMessage && (
             <p className="text-[12px] font-bold text-emerald-600 uppercase tracking-[0.05em] mt-4 bg-emerald-50 border border-green-200 px-4 py-2 rounded-lg animate-in fade-in slide-in-from-bottom duration-300">
               {appliedSettingsMessage}
             </p>
           )}
        </div>
      )}

      {/* KEYBOARD SHORTCUTS CHEAT-SHEET MODAL */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-[100000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 bg-black text-white flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-[#3568FF]" />
                    <h3 className="text-[14px] font-extrabold uppercase tracking-wider">XeroxQ Hotkey Shortcuts</h3>
                 </div>
                 <button onClick={() => setShowShortcutsModal(false)} className="hover:opacity-75 transition-opacity cursor-pointer">
                    <X className="w-4 h-4" />
                 </button>
              </div>

              <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
                 {[
                   { key: 'R', label: 'Rotate 90° clockwise' },
                   { key: 'C', label: 'Toggle Crop Mode' },
                   { key: 'I', label: 'Invert image colors' },
                   { key: 'M', label: 'Mirror horizontally' },
                   { key: 'V', label: 'Mirror vertically' },
                   { key: '0', label: 'Reset all Laboratory adjustments' },
                   { key: 'P / Enter', label: 'Start Print / Spooling job' },
                   { key: '?', label: 'Toggle this Shortcuts Guide' },
                 ].map(item => (
                   <div key={item.key} className="flex items-center justify-between p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                      <span className="text-[11px] font-bold text-black uppercase tracking-tight">{item.label}</span>
                      <kbd className="px-2.5 py-1 bg-white border border-[#E2E8F0] text-black font-extrabold text-[11px] rounded shadow-sm">
                         {item.key}
                      </kbd>
                   </div>
                 ))}
              </div>

              <div className="px-6 py-3 bg-[#F8FAFC] border-t border-[#E2E8F0] text-right">
                 <button
                   onClick={() => setShowShortcutsModal(false)}
                   className="px-4 py-1.5 bg-black text-white rounded-lg text-[10px] font-extrabold uppercase tracking-wider hover:bg-black/90 transition-all cursor-pointer"
                 >
                    Got It
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}
