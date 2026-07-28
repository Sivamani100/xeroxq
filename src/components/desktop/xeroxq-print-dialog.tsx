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
  HelpCircle, Stamp, IndianRupee, FileSpreadsheet, ArrowLeft,
  Undo2, Redo2
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
  // Printer type returned by the Electron IPC 'get-printers' handler
  type PrinterInfo = {
    name: string;
    displayName: string;
    isDefault: boolean;
    status: number;
    isVirtual?: boolean;
  };

  const [isElectron, setIsElectron] = useState(false);
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [printersLoading, setPrintersLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'printing' | 'success' | 'error'>('idle');
  const [printError, setPrintError] = useState<string | null>(null);

  // PRINT SETTINGS
  const [selectedPrinter, setSelectedPrinter] = useState('');
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
  const [showMarginGuide, setShowMarginGuide] = useState(false);
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
  const isRawFormat = documentPath && !isImage && !pathWithoutQuery.endsWith('.pdf');

  // Interactive Manipulation State (In Points)
  const [imgRect, setImgRect] = useState({ x: 0, y: 0, w: 500, h: 500 });
  const [cropRect, setCropRect] = useState({ t: 0, b: 0, l: 0, r: 0 }); // Active dragging crop mask offsets
  const [cropBounds, setCropBounds] = useState({ t: 0, b: 0, l: 0, r: 0 }); // Committed crop boundary mask offsets
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, rectX: 0, rectY: 0, rectW: 0, rectH: 0, cropT: 0, cropB: 0, cropL: 0, cropR: 0 });
  const dragStartCenter = useRef<{ x: number; y: number } | null>(null);

  // Image Scale-Up State & Cropping Data
  const [croppedDataUrl, setCroppedDataUrl] = useState<string | null>(null);
  const [imageScale, setImageScale] = useState(100); // percentage: 25–300
  const naturalImgSize = useRef<{ w: number; h: number } | null>(null);

  const [zoom, setZoom] = useState(0.8);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const touchStartDist = useRef<number | null>(null);
  const touchStartZoom = useRef<number>(zoom);

  // DISCRETE ACTION HISTORY STACK ENGINE (Silent Undo/Redo)
  const historyStack = useRef<any[]>([]);
  const historyIndex = useRef<number>(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const pushHistory = (overrideSnap?: any) => {
    const snap = overrideSnap || {
      brightness, contrast, exposure, saturation, hue, invert, threshold,
      rotation, mirrorH, mirrorV, paperSize, orientation, colorMode,
      imgRect, croppedDataUrl, cropRect, cropBounds
    };

    const nextStack = historyStack.current.slice(0, historyIndex.current + 1);
    nextStack.push(snap);
    historyStack.current = nextStack;
    historyIndex.current = nextStack.length - 1;
    setCanUndo(historyIndex.current > 0);
    setCanRedo(false);
  };

  const applySnapshot = (snap: any) => {
    if (!snap) return;
    setBrightness(snap.brightness);
    setContrast(snap.contrast);
    setExposure(snap.exposure);
    setSaturation(snap.saturation);
    setHue(snap.hue);
    setInvert(snap.invert);
    setThreshold(snap.threshold);
    setRotation(snap.rotation);
    setMirrorH(snap.mirrorH);
    setMirrorV(snap.mirrorV);
    setPaperSize(snap.paperSize);
    setOrientation(snap.orientation);
    setColorMode(snap.colorMode);
    setImgRect(snap.imgRect);
    setCroppedDataUrl(snap.croppedDataUrl);
    setCropRect(snap.cropRect);
    setCropBounds(snap.cropBounds || { t: 0, b: 0, l: 0, r: 0 });
  };

  const handleUndo = () => {
    if (historyIndex.current > 0) {
      const prevIdx = historyIndex.current - 1;
      const snap = historyStack.current[prevIdx];
      if (snap) {
        historyIndex.current = prevIdx;
        applySnapshot(snap);
        setCanUndo(prevIdx > 0);
        setCanRedo(prevIdx < historyStack.current.length - 1);
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex.current < historyStack.current.length - 1) {
      const nextIdx = historyIndex.current + 1;
      const snap = historyStack.current[nextIdx];
      if (snap) {
        historyIndex.current = nextIdx;
        applySnapshot(snap);
        setCanUndo(nextIdx > 0);
        setCanRedo(nextIdx < historyStack.current.length - 1);
      }
    }
  };

  // Push initial snapshot once on mount
  useEffect(() => {
    if (historyStack.current.length === 0) {
      pushHistory();
    }
  }, []);

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

  // ── Compute the set of visible page numbers for the preview canvas ──────────
  // Returns a Set<number> of 1-based page numbers to display
  const getVisiblePageNumbers = (): Set<number> => {
    const total = numPages || 0;
    if (total === 0) return new Set();

    if (pageRangeMode === 'all') {
      return new Set(Array.from({ length: total }, (_, i) => i + 1));
    }
    if (pageRangeMode === 'odd') {
      return new Set(Array.from({ length: total }, (_, i) => i + 1).filter(n => n % 2 !== 0));
    }
    if (pageRangeMode === 'even') {
      return new Set(Array.from({ length: total }, (_, i) => i + 1).filter(n => n % 2 === 0));
    }
    if (pageRangeMode === 'custom' && customRangeInput.trim()) {
      const pages = new Set<number>();
      customRangeInput.split(',').forEach(part => {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
          const [startStr, endStr] = trimmed.split('-');
          const start = parseInt(startStr.trim());
          const end = parseInt(endStr.trim());
          if (!isNaN(start) && !isNaN(end)) {
            for (let p = Math.max(1, start); p <= Math.min(total, end); p++) pages.add(p);
          }
        } else {
          const p = parseInt(trimmed);
          if (!isNaN(p) && p >= 1 && p <= total) pages.add(p);
        }
      });
      return pages;
    }
    // Fallback: show all
    return new Set(Array.from({ length: total }, (_, i) => i + 1));
  };

  // Effective Printed Page Count Calculation (respects odd, even, custom range 1,3,5, all)
  const getEffectivePageCount = () => {
    if (isImage) {
      return posterMode === '2x2' ? 4 : posterMode === '3x3' ? 9 : 1;
    }
    const visible = getVisiblePageNumbers();
    return visible.size > 0 ? visible.size : (numPages || 1);
  };

  const effectivePages = getEffectivePageCount();
  const estimatedCost = (colorMode === 'monochrome' ? bwRate : colorRate) * effectivePages * copies;

  // ── Build the CSS filter string for the preview canvas ──────────────────
  // grayscale MUST come last — it overrides saturation. When monochrome is ON
  // we also force saturation to 0 so color leaks through the chain.
  const buildPreviewFilter = () => {
    const sat = colorMode === 'monochrome' ? 0 : saturation;
    return [
      `brightness(${brightness}%)`,
      `contrast(${contrast}%)`,
      `saturate(${sat}%)`,
      `hue-rotate(${hue}deg)`,
      invert ? 'invert(1)' : '',
      colorMode === 'monochrome' ? 'grayscale(1)' : '',
    ].filter(Boolean).join(' ');
  };

  // Commit Crop Action (Figma Frame Clipping Mask - Zero Distortion)
  const commitCrop = () => {
    if (!isCropMode) {
      setIsCropMode(true);
      return;
    }

    const addedL = cropRect.l;
    const addedT = cropRect.t;
    const addedR = cropRect.r;
    const addedB = cropRect.b;

    setCropBounds(prev => ({
      t: prev.t + addedT,
      b: prev.b + addedB,
      l: prev.l + addedL,
      r: prev.r + addedR,
    }));

    // Shift frame position so the cropped region stays centered in place
    setImgRect(prev => ({
      ...prev,
      x: prev.x + (addedL - addedR) / 2,
      y: prev.y + (addedT - addedB) / 2,
    }));

    setCropRect({ t: 0, b: 0, l: 0, r: 0 });
    setIsCropMode(false);

    setAppliedSettingsMessage('Crop Applied Successfully');
    setTimeout(() => pushHistory(), 50);
    setTimeout(() => setAppliedSettingsMessage(null), 3000);
  };

  const resetCrop = () => {
    setCroppedDataUrl(null);
    setCropBounds({ t: 0, b: 0, l: 0, r: 0 });
    setCropRect({ t: 0, b: 0, l: 0, r: 0 });
    setIsCropMode(false);
    setAppliedSettingsMessage('Reset Image Crop');
    setTimeout(() => pushHistory(), 50);
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
    setTimeout(() => pushHistory(), 50);
    setTimeout(() => setAppliedSettingsMessage(null), 3000);
  };

  // Studio Keyboard Hotkeys Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'r' || e.key === 'R') {
        setRotation(r => (r + 90) % 360);
        pushHistory();
      } else if (e.key === 'c' || e.key === 'C') {
        if (rotation === 0) setIsCropMode(c => !c);
      } else if (e.key === 'i' || e.key === 'I') {
        setInvert(inv => !inv);
        pushHistory();
      } else if (e.key === 'm' || e.key === 'M') {
        setMirrorH(mh => !mh);
        pushHistory();
      } else if (e.key === 'v' || e.key === 'V') {
        setMirrorV(mv => !mv);
        pushHistory();
      } else if (e.key === '0') {
        applyPreset('reset');
      } else if (e.key === '?') {
        setShowShortcutsModal(s => !s);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  // ── Load real system printers via Electron IPC ────────────────────────────
  const fetchPrinters = () => {
    const electronWindow = window as unknown as { electronAPI?: { getPrinters: () => Promise<{ success: boolean; printers: PrinterInfo[] }> } };
    if (!electronWindow.electronAPI) return;
    setPrintersLoading(true);
    electronWindow.electronAPI.getPrinters()
      .then((res) => {
        if (res.success && res.printers?.length > 0) {
          setPrinters(res.printers);
          // Pre-select the system default printer, or the first one
          const defaultPrinter = res.printers.find(p => p.isDefault) || res.printers[0];
          setSelectedPrinter(defaultPrinter.name);
        } else {
          setPrinters([]);
        }
      })
      .catch(console.error)
      .finally(() => setPrintersLoading(false));
  };

  useEffect(() => {
    if (isImage) setNumPages(1);
    const electronWindow = window as unknown as { electronAPI?: { getPrinters: () => Promise<{ success: boolean; printers: PrinterInfo[] }> } };
    if (typeof window !== 'undefined' && electronWindow.electronAPI) {
      setIsElectron(true);
      fetchPrinters();
    }
  }, []);

  // INTERACTIVE MANIPULATION ENGINE (Drag, Resize & Rotate)
  useEffect(() => {
    if (!isDragging && !isResizing && !isRotating) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isRotating && dragStartCenter.current) {
        const dx = e.clientX - dragStartCenter.current.x;
        const dy = e.clientY - dragStartCenter.current.y;
        let deg = Math.round((Math.atan2(dy, dx) * (180 / Math.PI)) + 90);
        if (deg < 0) deg += 360;

        // Figma magnetic angle snaps at 0, 90, 180, 270
        if (Math.abs(deg - 0) < 4 || Math.abs(deg - 360) < 4) deg = 0;
        else if (Math.abs(deg - 90) < 4) deg = 90;
        else if (Math.abs(deg - 180) < 4) deg = 180;
        else if (Math.abs(deg - 270) < 4) deg = 270;

        setRotation(deg);
        return;
      }

      const dx = (e.clientX - dragStart.x) / zoom;
      const dy = (e.clientY - dragStart.y) / zoom;

      if (isDragging) {
        if (isCropMode) {
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

             // Figma Magnetic Center Snap
             if (Math.abs(newX) < 6) newX = 0;
             if (Math.abs(newY) < 6) newY = 0;
             
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
          setCropRect(prev => {
            let { t, b, l, r } = { ...prev };
            if (resizeHandle.includes('e')) r = Math.max(0, Math.min(dragStart.rectW - l - 20, dragStart.cropR - dx));
            if (resizeHandle.includes('s')) b = Math.max(0, Math.min(dragStart.rectH - t - 20, dragStart.cropB - dy));
            if (resizeHandle.includes('w')) l = Math.max(0, Math.min(dragStart.rectW - r - 20, dragStart.cropL + dx));
            if (resizeHandle.includes('n')) t = Math.max(0, Math.min(dragStart.rectH - b - 20, dragStart.cropT + dy));
            return { t, b, l, r };
          });
        } else {
          setImgRect(prev => {
            let { x, y, w, h } = { ...prev };
            const ratio = dragStart.rectW / dragStart.rectH;

            if (resizeHandle === 'se') {
              const newW = Math.max(20, dragStart.rectW + dx);
              w = newW; h = w / ratio;
            } else if (resizeHandle === 'sw') {
              const newW = Math.max(20, dragStart.rectW - dx);
              x = dragStart.rectX + (dragStart.rectW - newW);
              w = newW; h = w / ratio;
            } else if (resizeHandle === 'ne') {
              const newH = Math.max(20, dragStart.rectH - dy);
              y = dragStart.rectY + (dragStart.rectH - newH);
              h = newH; w = h * ratio;
            } else if (resizeHandle === 'nw') {
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

            if (naturalImgSize.current) {
              setImageScale(Math.round((w / naturalImgSize.current.w) * 100));
            }

            return { x, y, w, h };
          });
        }
      }
    };

    const handleMouseUp = () => {
      if (isDragging || isResizing || isRotating) {
        setTimeout(() => pushHistory(), 50);
      }
      setIsDragging(false);
      setIsResizing(false);
      setIsRotating(false);
      setResizeHandle(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, isRotating, dragStart, zoom, resizeHandle, isCropMode]);

  const onStartDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ 
      x: e.clientX, y: e.clientY, 
      rectX: imgRect.x, rectY: imgRect.y, rectW: imgRect.w, rectH: imgRect.h,
      cropT: cropRect.t, cropB: cropRect.b, cropL: cropRect.l, cropR: cropRect.r
    });
  };

  const onStartRotate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRotating(true);
    const container = (e.currentTarget as HTMLElement).closest('.group\\/img') as HTMLElement;
    if (container) {
      const rect = container.getBoundingClientRect();
      dragStartCenter.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
    }
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
    setStatus('printing');
    setPrintError(null);

    // ── Helper to bake canvas into pixel-level grayscale/filtered base64 or PDF ──
    const getBakedPayload = async (): Promise<{ finalFilePath?: string; finalBase64?: string }> => {
      try {
        if (isImage) {
          const imgElement = document.getElementById('laboratory-preview-image') as HTMLImageElement;
          const dims = getPaperDims(paperSize, orientation);
          const RES_MULT = 2;

          const canvas = document.createElement('canvas');
          canvas.width = dims.w * RES_MULT;
          canvas.height = dims.h * RES_MULT;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            ctx.scale(RES_MULT, RES_MULT);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, dims.w, dims.h);

            ctx.filter = buildPreviewFilter();

            ctx.save();
            ctx.translate(dims.w / 2 + imgRect.x, dims.h / 2 + imgRect.y);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.scale(mirrorH ? -1 : 1, mirrorV ? -1 : 1);

            if (imgElement && imgElement.complete) {
              const frameW = imgRect.w - cropBounds.l - cropBounds.r;
              const frameH = imgRect.h - cropBounds.t - cropBounds.b;
              ctx.save();
              ctx.beginPath();
              ctx.rect(-frameW / 2, -frameH / 2, frameW, frameH);
              ctx.clip();
              ctx.drawImage(imgElement, -frameW / 2 - cropBounds.l, -frameH / 2 - cropBounds.t, imgRect.w, imgRect.h);
              ctx.restore();
            }
            ctx.restore();

            if (colorMode === 'monochrome') {
              const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const d = imgData.data;
              for (let i = 0; i < d.length; i += 4) {
                const g = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
                d[i] = g;
                d[i + 1] = g;
                d[i + 2] = g;
              }
              ctx.putImageData(imgData, 0, 0);
            }

            return { finalBase64: canvas.toDataURL('image/jpeg', 0.95) };
          }
        }

        // PDF document baking
        const visiblePages = getVisiblePageNumbers();
        const pageNumbers = Array.from(visiblePages).sort((a, b) => a - b);
        const needsBaking = colorMode === 'monochrome' || pageRangeMode !== 'all' || brightness !== 100 || contrast !== 100 || invert || hue !== 0;

        if (needsBaking && pageNumbers.length > 0 && typeof document !== 'undefined') {
          const { default: jsPDF } = await import('jspdf');
          let pdf: any = null;

          for (let idx = 0; idx < pageNumbers.length; idx++) {
            const pNum = pageNumbers[idx];
            const pageContainer = document.querySelector(`.react-pdf__Page[data-page-number="${pNum}"]`);
            const pageCanvas = pageContainer?.querySelector('canvas') as HTMLCanvasElement;

            if (pageCanvas) {
              const offCanvas = document.createElement('canvas');
              offCanvas.width = pageCanvas.width;
              offCanvas.height = pageCanvas.height;
              const offCtx = offCanvas.getContext('2d');

              if (offCtx) {
                offCtx.filter = buildPreviewFilter();
                offCtx.drawImage(pageCanvas, 0, 0);

                if (colorMode === 'monochrome') {
                  const imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
                  const d = imgData.data;
                  for (let i = 0; i < d.length; i += 4) {
                    const g = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
                    d[i] = g;
                    d[i + 1] = g;
                    d[i + 2] = g;
                  }
                  offCtx.putImageData(imgData, 0, 0);
                }

                const pageDataUrl = offCanvas.toDataURL('image/jpeg', 0.92);
                const isLandscape = orientation === 'landscape';
                const fmt = paperSize.toLowerCase() === 'a4' ? 'a4' : paperSize.toLowerCase();

                if (!pdf) {
                  pdf = new jsPDF({
                    orientation: isLandscape ? 'l' : 'p',
                    unit: 'pt',
                    format: fmt,
                  });
                } else {
                  pdf.addPage(fmt, isLandscape ? 'l' : 'p');
                }

                const pdfW = pdf.internal.pageSize.getWidth();
                const pdfH = pdf.internal.pageSize.getHeight();
                pdf.addImage(pageDataUrl, 'JPEG', 0, 0, pdfW, pdfH);
              }
            }
          }

          if (pdf) {
            return { finalBase64: pdf.output('datauristring') };
          }
        }
      } catch (err) {
        console.warn('[XeroxQ Studio] Baking fallback:', err);
      }

      return { finalFilePath: documentPath, finalBase64: base64Data };
    };

    if (!isElectron) {
      try {
        setIsBaking(true);
        const captured: string[] = [];
        const RES_MULT = 2; // 2x density for crisp print output

        if (isImage) {
          const imgElement = document.getElementById('laboratory-preview-image') as HTMLImageElement;
          const dims = getPaperDims(paperSize, orientation);

          if (posterMode === '1x1') {
            const canvas = document.createElement('canvas');
            canvas.width = dims.w * RES_MULT;
            canvas.height = dims.h * RES_MULT;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.scale(RES_MULT, RES_MULT);
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, dims.w, dims.h);

              ctx.filter = buildPreviewFilter();

              ctx.save();
              ctx.translate(dims.w / 2 + imgRect.x, dims.h / 2 + imgRect.y);
              ctx.rotate((rotation * Math.PI) / 180);
              ctx.scale(mirrorH ? -1 : 1, mirrorV ? -1 : 1);

              if (imgElement && imgElement.complete) {
                const frameW = imgRect.w - cropBounds.l - cropBounds.r;
                const frameH = imgRect.h - cropBounds.t - cropBounds.b;
                ctx.save();
                ctx.beginPath();
                ctx.rect(-frameW / 2, -frameH / 2, frameW, frameH);
                ctx.clip();
                ctx.drawImage(imgElement, -frameW / 2 - cropBounds.l, -frameH / 2 - cropBounds.t, imgRect.w, imgRect.h);
                ctx.restore();
              }
              ctx.restore();

              captured.push(canvas.toDataURL('image/jpeg', 0.95));
            }
          } else {
            // Poster Tiling Mode
            const gridDim = posterMode === '2x2' ? 2 : 3;
            const tileW = dims.w;
            const tileH = dims.h;

            const fullCanvas = document.createElement('canvas');
            fullCanvas.width = (dims.w * gridDim) * RES_MULT;
            fullCanvas.height = (dims.h * gridDim) * RES_MULT;
            const fullCtx = fullCanvas.getContext('2d');

            if (fullCtx) {
              fullCtx.scale(RES_MULT, RES_MULT);
              fullCtx.fillStyle = '#ffffff';
              fullCtx.fillRect(0, 0, dims.w * gridDim, dims.h * gridDim);
              fullCtx.filter = buildPreviewFilter();

              fullCtx.save();
              fullCtx.translate((dims.w * gridDim) / 2 + imgRect.x * gridDim, (dims.h * gridDim) / 2 + imgRect.y * gridDim);
              fullCtx.rotate((rotation * Math.PI) / 180);
              fullCtx.scale(mirrorH ? -1 : 1, mirrorV ? -1 : 1);

              if (imgElement && imgElement.complete) {
                fullCtx.drawImage(imgElement, -(imgRect.w * gridDim) / 2, -(imgRect.h * gridDim) / 2, imgRect.w * gridDim, imgRect.h * gridDim);
              }
              fullCtx.restore();

              for (let r = 0; r < gridDim; r++) {
                for (let c = 0; c < gridDim; c++) {
                  const tileCanvas = document.createElement('canvas');
                  tileCanvas.width = tileW * RES_MULT;
                  tileCanvas.height = tileH * RES_MULT;
                  const tCtx = tileCanvas.getContext('2d');
                  if (tCtx) {
                    tCtx.drawImage(
                      fullCanvas,
                      c * tileW * RES_MULT,
                      r * tileH * RES_MULT,
                      tileW * RES_MULT,
                      tileH * RES_MULT,
                      0, 0,
                      tileW * RES_MULT,
                      tileH * RES_MULT
                    );

                    captured.push(tileCanvas.toDataURL('image/jpeg', 0.95));
                  }
                }
              }
            }
          }
        }

        setBakedPages(captured);

        setTimeout(() => {
          window.print();
          setIsBaking(false);
          setStatus('idle');
          setBakedPages([]);
          onClose?.();
        }, 800);

      } catch (err) {
        console.error('Web Print Error:', err);
        setIsBaking(false);
        setStatus('idle');
      }
      return;
    }

    // ── ELECTRON PATH: send directly to the native printer ──────────────────
    try {
      const electronWindow = window as unknown as {
        electronAPI?: {
          printNative: (opts: {
            filePath?: string;
            base64Data?: string;
            options: {
              printer: string;
              copies: number;
              monochrome: boolean;
              side: 'simplex' | 'duplex';
              orientation: 'portrait' | 'landscape';
              paperSize: string;
              pageRange?: string;
            };
          }) => Promise<{ success: boolean; error?: string; rawError?: object }>;
        };
      };

      if (!electronWindow.electronAPI) {
        throw new Error('electronAPI not available');
      }

      const payload = await getBakedPayload();

      const result = await electronWindow.electronAPI.printNative({
        filePath: payload.finalFilePath,
        base64Data: payload.finalBase64,
        options: {
          printer: selectedPrinter,
          copies,
          monochrome: colorMode === 'monochrome',
          side: sides,                              // 'simplex' | 'duplex'
          orientation,
          paperSize,
          pageRange: pageRangeMode === 'custom' ? customRangeInput : pageRangeMode,
        },
      });

      if (result.success) {
        setStatus('success');
        setTimeout(() => {
          setStatus('idle');
          onClose?.();
        }, 2000);
      } else {
        console.error('[XeroxQ Studio] Native print failed:', result.rawError);
        setPrintError(result.error || 'Print failed — check printer connection');
        setStatus('error');
        setTimeout(() => setStatus('idle'), 4000);
      }
    } catch (err) {
      const e = err as Error;
      console.error('[XeroxQ Studio] printNative exception:', e);
      setPrintError(e.message || 'Unexpected error');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 4000);
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-white text-[#0F172A] z-[99999] flex flex-col font-sans select-none overflow-hidden">
      
      {/* Studio Header Bar */}
      <header className="h-[48px] border-b border-[#E2E8F0] bg-white px-5 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-black rounded-[6px] flex items-center justify-center p-1 shadow-sm overflow-hidden shrink-0">
            <img src="/favicon.ico" alt="XeroxQ Logo" className="w-full h-full object-contain filter brightness-0 invert" />
          </div>
          <span className="font-black text-[14px] text-slate-900 tracking-tight">XeroxQ Studio</span>
        </div>

        <div className="flex items-center gap-2 pr-32">
          <button
            onClick={() => setShowShortcutsModal(true)}
            className="h-[32px] w-[32px] flex items-center justify-center bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] rounded-[6px] text-black hover:border-black/20 transition-all cursor-pointer shadow-xs"
            title="Keyboard Shortcuts (?)"
          >
            <HelpCircle className="w-4 h-4 text-black" />
          </button>
        </div>
      </header>

      {/* Main Studio 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* LEFT LABORATORY CONTROL SIDEBAR */}
        <div className="w-[280px] xl:w-[310px] bg-white border-r border-slate-200/80 flex flex-col shrink-0 relative z-30 shadow-xs">
          
          <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
            
            {/* Paper Size & Orientation & Alignment */}
            <div className="space-y-3">
               <label className="text-[11px] font-bold text-slate-500 ml-0.5">Canvas Layout & Paper</label>
               
               {/* Paper Size Switcher */}
               <div className="bg-slate-100/80 p-1 rounded-xl grid grid-cols-4 gap-1 border border-slate-200/60">
                  {(['A4', 'Legal', 'A3', 'Letter'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => { setPaperSize(s); pushHistory(); }}
                      className={cn(
                        "py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer",
                        paperSize === s ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                      )}
                    >
                      {s}
                    </button>
                  ))}
               </div>

               <div className="bg-slate-100/80 p-1 rounded-xl grid grid-cols-2 gap-1 border border-slate-200/60">
                  <button
                    onClick={() => { setOrientation('portrait'); pushHistory(); }}
                    className={cn(
                      "h-9 flex items-center justify-center gap-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer",
                      orientation === 'portrait' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                     <Layout className="w-3.5 h-3.5" /> Portrait
                  </button>
                  <button
                    onClick={() => { setOrientation('landscape'); pushHistory(); }}
                    className={cn(
                      "h-9 flex items-center justify-center gap-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer",
                      orientation === 'landscape' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                     <Layout className="w-3.5 h-3.5 rotate-90" /> Landscape
                  </button>
               </div>

               <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                  <button
                    onClick={() => { setImgRect(prev => ({ ...prev, x: 0 })); pushHistory(); }}
                    className="h-8 bg-slate-50 border border-slate-200/80 hover:bg-slate-100 rounded-xl text-[10px] font-bold text-slate-700 hover:text-slate-900 transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                    title="Center Horizontally"
                  >
                     <AlignCenter className="w-3 h-3" /> Center X
                  </button>
                  <button
                    onClick={() => { setImgRect(prev => ({ ...prev, y: 0 })); pushHistory(); }}
                    className="h-8 bg-slate-50 border border-slate-200/80 hover:bg-slate-100 rounded-xl text-[10px] font-bold text-slate-700 hover:text-slate-900 transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                    title="Center Vertically"
                  >
                     <AlignCenter className="w-3 h-3 rotate-90" /> Center Y
                  </button>
                  <button
                    onClick={() => {
                      const dims = getPaperDims(paperSize, orientation);
                      setImgRect(prev => ({ ...prev, x: 0, y: 0, w: dims.w * 0.9, h: (dims.w * 0.9) * (prev.h / prev.w) }));
                      pushHistory();
                    }}
                    className="h-8 bg-slate-50 border border-slate-200/80 hover:bg-slate-100 rounded-xl text-[10px] font-bold text-slate-700 hover:text-slate-900 transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                    title="Fit Page"
                  >
                     <Maximize className="w-3 h-3" /> Fit Page
                  </button>
               </div>
            </div>

            <div className="h-px bg-slate-200/70 w-full" />

            {/* Brightness & Exposure */}
            <div className="grid grid-cols-2 gap-3">
               <div className="space-y-2">
                 <div className="flex justify-between items-center">
                   <label className="text-[11px] font-bold text-slate-500">Brightness</label>
                   <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{brightness}%</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <Sun className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                   <input type="range" min="0" max="200" value={brightness} onChange={(e) => setBrightness(parseInt(e.target.value))} onMouseUp={() => pushHistory()} onTouchEnd={() => pushHistory()} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none accent-black cursor-pointer" />
                 </div>
               </div>
               <div className="space-y-2">
                 <div className="flex justify-between items-center">
                   <label className="text-[11px] font-bold text-slate-500">Exposure</label>
                   <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{exposure}%</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <Sparkles className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                   <input type="range" min="0" max="250" value={exposure} onChange={(e) => setExposure(parseInt(e.target.value))} onMouseUp={() => pushHistory()} onTouchEnd={() => pushHistory()} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none accent-black cursor-pointer" />
                 </div>
               </div>
            </div>

            {/* Contrast & High Threshold */}
            <div className="grid grid-cols-2 gap-3">
               <div className="space-y-2">
                 <div className="flex justify-between items-center">
                   <label className="text-[11px] font-bold text-slate-500">Contrast</label>
                   <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{contrast}%</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <Contrast className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                   <input type="range" min="0" max="200" value={contrast} onChange={(e) => setContrast(parseInt(e.target.value))} onMouseUp={() => pushHistory()} onTouchEnd={() => pushHistory()} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none accent-black cursor-pointer" />
                 </div>
               </div>
               <div className="space-y-2">
                 <div className="flex justify-between items-center">
                   <label className="text-[11px] font-bold text-slate-500">Threshold</label>
                   <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{threshold === 0 ? "Off" : threshold}</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                   <input type="range" min="0" max="200" value={threshold} onChange={(e) => setThreshold(parseInt(e.target.value))} onMouseUp={() => pushHistory()} onTouchEnd={() => pushHistory()} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none accent-black cursor-pointer" />
                 </div>
               </div>
            </div>

            <div className="h-px bg-slate-200/70 w-full" />

            {/* Hue & Saturation */}
            <div className="space-y-2">
               <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-slate-500">Hue & Saturation</label>
                  <div className="flex gap-2 text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                     <span>H: {hue}°</span>
                     <span>S: {saturation}%</span>
                  </div>
               </div>
               <div className="flex items-center gap-2 mb-1.5">
                 <Droplet className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                 <input type="range" min="0" max="360" value={hue} onChange={(e) => setHue(parseInt(e.target.value))} onMouseUp={() => pushHistory()} onTouchEnd={() => pushHistory()} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none accent-black cursor-pointer" />
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-3.5 h-3.5 shrink-0" />
                 <input type="range" min="0" max="200" value={saturation} onChange={(e) => setSaturation(parseInt(e.target.value))} onMouseUp={() => pushHistory()} onTouchEnd={() => pushHistory()} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none accent-black cursor-pointer" />
               </div>
            </div>

            {/* Content Scaling (PDF) */}
            <div className="space-y-2">
               <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-slate-500">PDF Scale</label>
                  <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{contentScale}%</span>
               </div>
               <div className="flex items-center gap-2">
                 <Maximize className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                 <input type="range" min="50" max="200" value={contentScale} onChange={(e) => setContentScale(parseInt(e.target.value))} onMouseUp={() => pushHistory()} onTouchEnd={() => pushHistory()} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none accent-black cursor-pointer" />
               </div>
            </div>

            <div className="h-px bg-slate-200/70 w-full" />

            {/* Rotation & Angle Control Section */}
            <div className="space-y-2">
               <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                     <RotateCcw className="w-3.5 h-3.5 text-slate-700" /> Rotation Angle
                  </label>
                  <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{rotation}°</span>
               </div>
               
               <div className="flex items-center gap-2 mb-2">
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input 
                    type="range" 
                    min="0" 
                    max="360" 
                    value={rotation} 
                    onChange={(e) => setRotation(parseInt(e.target.value))} 
                    onMouseUp={() => pushHistory()} 
                    onTouchEnd={() => pushHistory()} 
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none accent-black cursor-pointer" 
                  />
               </div>

               {/* Presets & Fine-Tune Steppers */}
               <div className="bg-slate-100/80 p-1 rounded-xl grid grid-cols-4 gap-1 border border-slate-200/60">
                  {[0, 90, 180, 270].map(deg => (
                     <button
                       key={deg}
                       onClick={() => { setRotation(deg); pushHistory(); }}
                       className={cn(
                         "py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer",
                         rotation === deg ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                       )}
                     >
                        {deg}°
                     </button>
                  ))}
               </div>
             </div>

            {/* Quick Transform Grid */}
            <div className="grid grid-cols-3 gap-1.5">
               <button onClick={() => { setInvert(!invert); pushHistory(); }} className={cn("h-9 flex items-center justify-center gap-1 rounded-xl border text-[11px] font-bold transition-all cursor-pointer", invert ? "bg-black text-white border-black shadow-xs" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900")}>
                 Invert
               </button>
               <button onClick={() => { setMirrorH(!mirrorH); pushHistory(); }} className={cn("h-9 flex items-center justify-center gap-1 rounded-xl border text-[11px] font-bold transition-all cursor-pointer", mirrorH ? "bg-blue-600 text-white border-blue-600 shadow-xs" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900")}>
                 Mirror H
               </button>
               <button onClick={() => { setMirrorV(!mirrorV); pushHistory(); }} className={cn("h-9 flex items-center justify-center gap-1 rounded-xl border text-[11px] font-bold transition-all cursor-pointer", mirrorV ? "bg-blue-600 text-white border-blue-600 shadow-xs" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900")}>
                 Mirror V
               </button>
            </div>

            {/* IMAGE CROP ENGINE SECTION */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                   <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                      <Crop className="w-3.5 h-3.5 text-slate-900" /> Crop Image Tool
                   </label>
                   {croppedDataUrl && <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">Cropped</span>}
                </div>
                
                <button 
                  onClick={commitCrop} 
                  disabled={rotation !== 0}
                  className={cn("w-full h-10 flex items-center justify-center gap-2 rounded-xl border transition-all font-bold text-[12px] shadow-sm cursor-pointer", 
                    isCropMode ? "bg-emerald-600 text-white border-emerald-600 shadow-emerald-600/20 animate-pulse" : "bg-slate-900 text-white border-slate-900 hover:bg-black",
                    rotation !== 0 && "opacity-50 cursor-not-allowed"
                  )}
                >
                   <Crop className="w-3.5 h-3.5" /> 
                   {rotation !== 0 ? "Reset Rotation to Crop" : (isCropMode ? "Confirm & Apply Crop" : "Crop Image Mode")}
                </button>

                {(isCropMode || croppedDataUrl) && (
                   <button 
                     onClick={resetCrop}
                     className="w-full h-8 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-xl text-[10px] font-bold text-slate-600 transition-all cursor-pointer"
                   >
                     Reset Original Uncropped Image
                   </button>
                )}
            </div>

          </div>

        </div>

        {/* === ULTRA-WIDE CONTINUOUS PREVIEW CANVAS === */}
        <div className="flex-1 bg-[#F8FAFC] relative flex flex-col overflow-hidden">
          
          {/* Studio Top Control Overlay Bar */}
          <div className="absolute top-4 left-6 right-6 flex items-center justify-between z-[100] pointer-events-none">
            {appliedSettingsMessage && (
              <div className="px-3 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-wider rounded-[5.57px] shadow-lg animate-in fade-in slide-in-from-top duration-300 pointer-events-auto">
                ✨ {appliedSettingsMessage}
              </div>
            )}
          </div>

          {/* Studio Bottom Floating Tools Bar (Sleek Figma Minimal Pill) */}
          <div className="absolute bottom-5 right-6 flex items-center gap-1 bg-white/95 backdrop-blur-md border border-[#E2E8F0] px-2.5 h-[32px] rounded-full shadow-sm z-[100] transition-all">
             <button 
               onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} 
               className="h-6 w-6 flex items-center justify-center hover:bg-[#F1F5F9] rounded-full text-black transition-all active:scale-90 cursor-pointer"
               title="Zoom Out"
             >
                <Minus className="w-3 h-3" />
             </button>
             <button 
               onClick={() => setZoom(0.8)} 
               className="w-10 text-center hover:bg-[#F1F5F9] py-0.5 rounded transition-colors cursor-pointer"
               title="Click to Reset Zoom (80%)"
             >
                <span className="text-[10px] font-extrabold text-black tabular-nums">{Math.round(zoom * 100)}%</span>
             </button>
             <button 
               onClick={() => setZoom(z => Math.min(3.0, z + 0.1))} 
               className="h-6 w-6 flex items-center justify-center hover:bg-[#F1F5F9] rounded-full text-black transition-all active:scale-90 cursor-pointer"
               title="Zoom In"
             >
                <Plus className="w-3 h-3" />
             </button>
             
             <div className="w-px h-3.5 bg-[#E2E8F0] mx-1" />

             <button 
                onClick={handleUndo} 
                disabled={!canUndo}
                className="h-6 w-6 flex items-center justify-center hover:bg-[#F1F5F9] rounded-full text-black transition-all active:scale-90 disabled:opacity-25 cursor-pointer"
                title="Undo (Ctrl+Z)"
             >
                <Undo2 className="w-3 h-3" />
             </button>
             <button 
                onClick={handleRedo} 
                disabled={!canRedo}
                className="h-6 w-6 flex items-center justify-center hover:bg-[#F1F5F9] rounded-full text-black transition-all active:scale-90 disabled:opacity-25 cursor-pointer"
                title="Redo (Ctrl+Y)"
             >
                <Redo2 className="w-3 h-3" />
             </button>

             <div className="w-px h-3.5 bg-[#E2E8F0] mx-1" />

             <button 
                onClick={() => { setZoom(0.8); setRotation(0); }} 
                className="h-6 w-6 flex items-center justify-center hover:bg-[#F1F5F9] rounded-full text-black transition-all active:rotate-180 duration-500 cursor-pointer" 
                title="Reset View & Rotation"
             >
                <RotateCcw className="w-3 h-3" />
             </button>
          </div>

          {/* Continuous Scroll Surface */}
          <div 
            ref={previewContainerRef}
            className="flex-1 overflow-auto relative custom-scrollbar p-12 touch-none"
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
                      {/* LAYER 1: CLIPPED PAPER IMAGE FRAME (Clips image content to white paper boundaries) */}
                      <div 
                        className={cn("bg-white border border-[#E2E8F0] relative overflow-hidden transition-all duration-300", isCropMode ? "shadow-2xl ring-4 ring-black/5" : "shadow-[0px_4px_24px_rgba(0,0,0,0.06)]")}
                        style={{ 
                          width: `${getPaperDims(paperSize, orientation).w}px`, 
                          height: `${getPaperDims(paperSize, orientation).h}px` 
                        }}
                      >
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

                                {/* Image Content Layer clipped inside paper bounds */}
                                {(() => {
                                  const frameW = isCropMode ? imgRect.w : Math.max(20, imgRect.w - cropBounds.l - cropBounds.r);
                                  const frameH = isCropMode ? imgRect.h : Math.max(20, imgRect.h - cropBounds.t - cropBounds.b);

                                  return (
                                    <div
                                      className="absolute"
                                      style={{ 
                                        left: `calc(50% + ${imgRect.x}px)`, 
                                        top: `calc(50% + ${imgRect.y}px)`, 
                                        width: `${frameW}px`, 
                                        height: `${frameH}px`,
                                        transformOrigin: 'center center',
                                        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                                      }}
                                    >
                                      <div 
                                        className="w-full h-full overflow-hidden relative pointer-events-none"
                                        style={{
                                          filter: buildPreviewFilter(),
                                        }}
                                      >
                                        <img
                                          id="laboratory-preview-image"
                                          src={croppedDataUrl || (base64Data ? `data:image/png;base64,${base64Data}` : documentPath)}
                                          className="max-w-none max-h-none absolute pointer-events-none select-none transition-transform duration-200"
                                          style={{
                                            left: isCropMode ? 0 : -cropBounds.l,
                                            top: isCropMode ? 0 : -cropBounds.t,
                                            width: `${imgRect.w}px`,
                                            height: `${imgRect.h}px`,
                                            transform: `scale(${mirrorH ? -1 : 1}, ${mirrorV ? -1 : 1})`,
                                            transformOrigin: 'center center',
                                          }}
                                          onLoad={(e) => {
                                            const img = e.currentTarget;
                                            if (!naturalImgSize.current) {
                                              naturalImgSize.current = { w: img.naturalWidth, h: img.naturalHeight };
                                              const paper = getPaperDims(paperSize, orientation);
                                              const maxW = paper.w * 0.85;
                                              const maxH = paper.h * 0.85;
                                              const aspect = img.naturalWidth / img.naturalHeight;
                                              let w = maxW;
                                              let h = w / aspect;
                                              if (h > maxH) {
                                                h = maxH;
                                                w = h * aspect;
                                              }
                                              setImgRect({ x: 0, y: 0, w: Math.round(w), h: Math.round(h) });
                                            }
                                          }}
                                          alt="Laboratory Target"
                                        />
                                      </div>
                                    </div>
                                  );
                                })()}
                      </div>

                      {/* LAYER 2: INTERACTIVE SELECTION & HANDLES OVERLAY (Projects outside paper bounds so handles & rotation stem are ALWAYS 100% visible and interactive) */}
                      <div 
                        className="absolute inset-0 pointer-events-none overflow-visible z-20"
                        style={{ 
                          width: `${getPaperDims(paperSize, orientation).w}px`, 
                          height: `${getPaperDims(paperSize, orientation).h}px` 
                        }}
                      >
                                  {/* FIGMA SMART ALIGNMENT GUIDELINES (Show while dragging or resizing) */}
                                  {(isDragging || isResizing) && (
                                     <>
                                        {/* Center Vertical Axis (X = 0) */}
                                        {Math.abs(imgRect.x) < 8 && (
                                           <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-[#FF007A] z-40 pointer-events-none" />
                                        )}

                                        {/* Center Horizontal Axis (Y = 0) */}
                                        {Math.abs(imgRect.y) < 8 && (
                                           <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-[#FF007A] z-40 pointer-events-none" />
                                        )}
                                     </>
                                  )}

                                 {/* FIGMA-STYLE SELECTION BOX & 8 RESIZE HANDLES OVERLAY */}
                                  {(() => {
                                    const handles = [
                                      { id: 'nw', cursor: 'cursor-nw-resize', style: { left: -6, top: -6 } },
                                      { id: 'ne', cursor: 'cursor-ne-resize', style: { right: -6, top: -6 } },
                                      { id: 'sw', cursor: 'cursor-sw-resize', style: { left: -6, bottom: -6 } },
                                      { id: 'se', cursor: 'cursor-se-resize', style: { right: -6, bottom: -6 } },
                                      { id: 'n', cursor: 'cursor-n-resize', style: { left: '50%', top: -6, transform: 'translateX(-50%)' } },
                                      { id: 's', cursor: 'cursor-s-resize', style: { left: '50%', bottom: -6, transform: 'translateX(-50%)' } },
                                      { id: 'w', cursor: 'cursor-w-resize', style: { top: '50%', left: -6, transform: 'translateY(-50%)' } },
                                      { id: 'e', cursor: 'cursor-e-resize', style: { top: '50%', right: -6, transform: 'translateY(-50%)' } },
                                    ];
                                    const isCorner = (id: string) => id.length === 2;
                                    const frameW = isCropMode ? imgRect.w : Math.max(20, imgRect.w - cropBounds.l - cropBounds.r);
                                    const frameH = isCropMode ? imgRect.h : Math.max(20, imgRect.h - cropBounds.t - cropBounds.b);

                                    return (
                                      <div
                                        className="absolute group/img pointer-events-auto"
                                        style={{ 
                                          left: `calc(50% + ${imgRect.x}px)`, 
                                          top: `calc(50% + ${imgRect.y}px)`, 
                                          width: `${frameW}px`, 
                                          height: `${frameH}px`,
                                          transformOrigin: 'center center',
                                          transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
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

                                        {/* Figma selection border & Top Stem Rotation handle — only in normal (non-crop) mode */}
                                        {!isCropMode && (
                                          <div className="absolute inset-0 z-20 pointer-events-none opacity-0 group-hover/img:opacity-100 transition-opacity duration-150">
                                            <div className="absolute inset-0 border-2 border-[#3568FF] rounded-[1px]" />

                                            {/* Figma Top Stem Rotation Handle */}
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center z-40 pointer-events-auto">
                                               <button
                                                 onMouseDown={onStartRotate}
                                                 className="w-5 h-5 rounded-full bg-white border-2 border-[#3568FF] shadow-md hover:scale-125 transition-transform flex items-center justify-center cursor-grab active:cursor-grabbing"
                                                 title="Drag to rotate image face to any angle"
                                               >
                                                  <RotateCcw className="w-2.5 h-2.5 text-[#3568FF]" />
                                               </button>
                                               <div className="w-px h-3 bg-[#3568FF]" />
                                            </div>

                                            {/* Size & Angle tooltip on hover */}
                                            <div className="absolute -top-13 left-1/2 -translate-x-1/2 bg-[#3568FF] text-white text-[9px] font-black px-2 py-0.5 rounded whitespace-nowrap shadow-lg">
                                              {Math.round(frameW)} × {Math.round(frameH)} pt &nbsp;·&nbsp; {rotation}°
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
                                              width: isCorner(h.id) ? 12 : (h.id === 'n' || h.id === 's' ? 22 : 12),
                                              height: isCorner(h.id) ? 12 : (h.id === 'e' || h.id === 'w' ? 22 : 12),
                                            }}
                                            onMouseDown={(e) => {
                                              e.stopPropagation();
                                              onStartResize(e, h.id);
                                            }}
                                          >
                                            <div className="w-full h-full bg-white border-2 border-[#3568FF] rounded-[2px] shadow-md hover:scale-125 transition-transform" />
                                          </div>
                                        ))}

                                        {/* === FIGMA CROP MODE OVERLAY === */}
                                        {isCropMode && (
                                          <>
                                            {/* Dimmed backdrop outside crop area */}
                                            <div className="absolute inset-0 z-20 pointer-events-none">
                                              <div className="absolute left-0 right-0 top-0 bg-black/50" style={{ height: cropRect.t }} />
                                              <div className="absolute left-0 right-0 bottom-0 bg-black/50" style={{ height: cropRect.b }} />
                                              <div className="absolute top-0 bottom-0 left-0 bg-black/50" style={{ width: cropRect.l, top: cropRect.t, bottom: cropRect.b }} />
                                              <div className="absolute top-0 bottom-0 right-0 bg-black/50" style={{ width: cropRect.r, top: cropRect.t, bottom: cropRect.b }} />
                                            </div>

                                            {/* Active Crop Box Boundary */}
                                            <div 
                                              className="absolute z-20 border-2 border-[#3568FF] shadow-2xl cursor-move pointer-events-auto"
                                              style={{
                                                top: cropRect.t,
                                                bottom: cropRect.b,
                                                left: cropRect.l,
                                                right: cropRect.r,
                                              }}
                                              onMouseDown={onStartDrag}
                                            >
                                              {/* Rule of thirds grid lines */}
                                              <div className="absolute inset-0 pointer-events-none opacity-40">
                                                <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white" />
                                                <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white" />
                                                <div className="absolute top-1/3 left-0 right-0 h-px bg-white" />
                                                <div className="absolute top-2/3 left-0 right-0 h-px bg-white" />
                                              </div>

                                              {/* Dimensions label */}
                                              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#3568FF] text-white text-[9px] font-black px-2 py-0.5 rounded whitespace-nowrap shadow">
                                                {Math.round(imgRect.w - cropRect.l - cropRect.r)} × {Math.round(imgRect.h - cropRect.t - cropRect.b)} px
                                              </div>
                                            </div>

                                            {/* Crop Resize Handles */}
                                            <div className="absolute inset-0 z-30 pointer-events-auto">
                                              {['nw', 'ne', 'sw', 'se'].map(h => (
                                                <div
                                                  key={h}
                                                  className={cn(
                                                    "absolute transition-all hover:scale-125",
                                                    "w-4 h-4 bg-white border-2 border-[#3568FF] rounded-full shadow-md",
                                                    h === 'nw' && "cursor-nw-resize",
                                                    h === 'ne' && "cursor-ne-resize",
                                                    h === 'sw' && "cursor-sw-resize",
                                                    h === 'se' && "cursor-se-resize"
                                                  )}
                                                  style={{
                                                    left: h === 'nw' || h === 'sw' ? cropRect.l - 8 : imgRect.w - cropRect.r - 8,
                                                    top: h === 'nw' || h === 'ne' ? cropRect.t - 8 : imgRect.h - cropRect.b - 8,
                                                  }}
                                                  onMouseDown={(e) => onStartResize(e, h)}
                                                />
                                              ))}
                                              {['n', 's'].map(h => (
                                                <div
                                                  key={h}
                                                  className="absolute transition-all hover:scale-110 w-6 h-2.5 bg-white border-2 border-[#3568FF] rounded-full shadow-md cursor-ns-resize"
                                                  style={{
                                                    left: cropRect.l + (imgRect.w - cropRect.l - cropRect.r) / 2 - 12,
                                                    top: h === 'n' ? cropRect.t - 5 : imgRect.h - cropRect.b - 5,
                                                  }}
                                                  onMouseDown={(e) => onStartResize(e, h)}
                                                />
                                              ))}
                                              {['e', 'w'].map(h => (
                                               <div
                                                 key={h}
                                                 className="absolute transition-all hover:scale-110 w-2.5 h-6 bg-white border-2 border-[#3568FF] rounded-full shadow-md cursor-ew-resize"
                                                 style={{
                                                   left: h === 'w' ? cropRect.l - 5 : imgRect.w - cropRect.r - 5,
                                                   top: cropRect.t + (imgRect.h - cropRect.t - cropRect.b) / 2 - 12,
                                                 }}
                                                 onMouseDown={(e) => onStartResize(e, h)}
                                               />
                                             ))}
                                           </div>
                                         </>
                                       )}
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
                      {Array.from(new Array(numPages || 0), (_, index) => {
                        const pageNum = index + 1;
                        const visiblePages = getVisiblePageNumbers();
                        // Hide pages not in the selected range
                        if (!visiblePages.has(pageNum)) return null;
                        return (
                          <div
                            key={`page_${pageNum}`}
                            className="relative group transition-all duration-300 ease-out"
                            style={{
                              // Use buildPreviewFilter so grayscale always wins over saturation
                              filter: buildPreviewFilter(),
                              transformOrigin: 'top center',
                              transform: `scaleX(${mirrorH ? -1 : 1}) scaleY(${mirrorV ? -1 : 1})`
                            }}
                          >
                            {/* Page number badge */}
                            <div className="absolute -top-5 left-0 text-[9px] font-black text-slate-400 uppercase tracking-widest z-10">
                              Page {pageNum}{sides === 'duplex' ? (pageNum % 2 !== 0 ? ' · Front' : ' · Back') : ''}
                            </div>

                            <div
                              className={cn("bg-white shadow-[0px_4px_24px_rgba(0,0,0,0.06)] border border-[#E2E8F0] relative overflow-hidden flex items-center justify-center transition-all duration-300")}
                              style={{ width: '595px', height: '842px' }}
                            >
                              <Page
                                pageNumber={pageNum}
                                width={595}
                                scale={contentScale / 100}
                                rotate={rotation}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                              />

                              {isCropMode && (
                                <div className="absolute inset-4 border-2 border-dashed border-[#3568FF]/50 flex items-center justify-center animate-pulse">
                                  <Move className="w-12 h-12 text-[#3568FF]/20" />
                                </div>
                              )}
                            </div>

                            {/* Duplex indicator: show a faint 'back side' ghost below front pages */}
                            {sides === 'duplex' && pageNum % 2 !== 0 && (
                              <div className="mt-1 w-[595px] h-2 bg-slate-200/60 rounded-b-sm border border-t-0 border-slate-200/40 flex items-center justify-center">
                                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">↕ Double-Sided</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
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

        {/* === HARDWARE OUTPUT SIDEBAR (RIGHT) === */}
        <div className="w-[300px] xl:w-[325px] bg-white border-l border-slate-200/80 flex flex-col shrink-0 relative z-30 shadow-xs">
          
          <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">

            {/* HARDWARE OUTPUT SELECTOR */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-500 ml-0.5">Hardware Output</label>
                <button
                  onClick={fetchPrinters}
                  disabled={printersLoading}
                  title="Refresh printer list"
                  className="h-6 w-6 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-900 transition-all disabled:opacity-40 cursor-pointer shadow-2xs"
                >
                  <RefreshCw className={`w-3 h-3 ${printersLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <select
                value={selectedPrinter}
                onChange={e => setSelectedPrinter(e.target.value)}
                className="w-full h-11 bg-slate-50 border border-slate-200/90 rounded-xl text-[12px] font-bold text-slate-900 px-3.5 hover:border-slate-300 focus:border-black outline-none transition-all cursor-pointer shadow-2xs appearance-none"
              >
                {printersLoading ? (
                  <option value="" disabled>Scanning for printers…</option>
                ) : printers.length === 0 ? (
                  <option value="" disabled>No printers found — click ↻ to retry</option>
                ) : (
                  printers.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.displayName}{p.isDefault ? ' ★' : ''}{p.isVirtual ? ' (virtual)' : ''}
                    </option>
                  ))
                )}
              </select>
              {!printersLoading && printers.length === 0 && (
                <p className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                  Connect a printer and click ↻ above to refresh
                </p>
              )}
            </div>

            {/* COPIES STEPPER */}
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 ml-1">Copies</span>
              <div className="flex items-center gap-3">
                <button onClick={() => setCopies(Math.max(1, copies - 1))} className="h-8 w-8 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-900 font-extrabold shadow-2xs hover:bg-slate-100 active:scale-95 transition-all cursor-pointer">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-[15px] font-mono font-bold text-slate-900 w-6 text-center tabular-nums">{copies}</span>
                <button onClick={() => setCopies(copies + 1)} className="h-8 w-8 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-900 font-extrabold shadow-2xs hover:bg-slate-100 active:scale-95 transition-all cursor-pointer">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* PAGE RANGE SELECTOR */}
            <div className="space-y-3 bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl shadow-2xs">
              <label className="text-[11px] font-bold text-slate-900 flex items-center justify-between">
                <span>Page Range</span>
                <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{effectivePages} pages selected</span>
              </label>
              <div className="bg-slate-200/70 p-1 rounded-xl grid grid-cols-4 gap-1 border border-slate-200/60">
                {(['all', 'odd', 'even', 'custom'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setPageRangeMode(m)}
                    className={cn(
                      "py-1.5 rounded-lg text-[11px] font-bold capitalize transition-all cursor-pointer",
                      pageRangeMode === m ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
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
                  className="w-full h-9 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-900 px-3 outline-none focus:border-black transition-all shadow-2xs"
                />
              )}
            </div>

            {/* REAL-TIME COST CALCULATOR PANEL */}
            <div className="space-y-3 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-emerald-950 flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-600" /> Billing Calculator
                </label>
                <span className="text-[18px] font-black text-emerald-600 tabular-nums">₹{estimatedCost}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-emerald-900">
                <div className="flex items-center justify-between bg-white/90 p-2 rounded-xl border border-emerald-200/60 shadow-2xs">
                  <span>B&W Rate:</span>
                  <div className="flex items-center gap-1">
                    <span>₹</span>
                    <input type="number" min="1" max="100" value={bwRate} onChange={e => setBwRate(Math.max(1, parseInt(e.target.value) || 1))} className="w-8 text-center bg-transparent border-b border-emerald-400 font-bold outline-none" />
                  </div>
                </div>
                <div className="flex items-center justify-between bg-white/90 p-2 rounded-xl border border-emerald-200/60 shadow-2xs">
                  <span>Color Rate:</span>
                  <div className="flex items-center gap-1">
                    <span>₹</span>
                    <input type="number" min="1" max="200" value={colorRate} onChange={e => setColorRate(Math.max(1, parseInt(e.target.value) || 1))} className="w-8 text-center bg-transparent border-b border-emerald-400 font-bold outline-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* DUPLEX / TWO SIDE CONTROL */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setSides('simplex')}
                className={cn("flex flex-col items-center justify-center gap-1 py-3.5 px-2 rounded-2xl border transition-all cursor-pointer", sides === 'simplex' ? "bg-black text-white border-black shadow-lg shadow-black/10" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100")}>
                <FileText className="w-4 h-4" />
                <div className="text-center">
                  <div className="text-[11px] font-bold">Single Side</div>
                  <div className={cn("text-[9px] font-bold", sides === 'simplex' ? "text-white/70" : "text-slate-400")}>Single Scan</div>
                </div>
              </button>
              <button
                onClick={() => setSides('duplex')}
                className={cn("flex flex-col items-center justify-center gap-1 py-3.5 px-2 rounded-2xl border transition-all cursor-pointer", sides === 'duplex' ? "bg-black text-white border-black shadow-lg shadow-black/10" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100")}>
                <BookOpen className="w-4 h-4" />
                <div className="text-center">
                  <div className="text-[11px] font-bold">Double Side</div>
                  <div className={cn("text-[9px] font-bold", sides === 'duplex' ? "text-white/70" : "text-slate-400")}>Double Scan</div>
                </div>
              </button>
            </div>

            {/* COLOR MODE SELECTOR */}
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => setColorMode(colorMode === 'color' ? 'monochrome' : 'color')}
                className={cn("flex flex-col items-center justify-center gap-0.5 py-3.5 px-3 rounded-2xl border transition-all cursor-pointer", colorMode === 'color' ? "bg-orange-500 text-white border-orange-500" : "bg-slate-900 text-white border-slate-900")}>
                <Droplet className="w-4 h-4" />
                <div className="text-center">
                  <div className="text-[12px] font-bold">{colorMode === 'color' ? 'Full Color' : 'Monochrome'}</div>
                  <div className="text-[9.5px] font-bold text-white/80">{colorMode === 'color' ? 'Vibrant Print' : 'Black & White'}</div>
                </div>
              </button>
            </div>
          </div>

          {/* RIGHT FOOTER ACTION */}
          <div className="p-4 border-t border-slate-200/80 bg-slate-50/80 backdrop-blur-sm flex flex-col gap-3 relative z-40">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
              <span>Total Spool Size</span>
              <span className="text-slate-900 font-bold">{(copies * effectivePages)} Pages</span>
            </div>
            {printError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                <X className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <p className="text-[10px] font-bold text-red-700 leading-tight">{printError}</p>
              </div>
            )}
            <button
              onClick={handlePrint}
              disabled={status !== 'idle' || !selectedPrinter || printersLoading}
              className="w-full h-12 bg-black text-white hover:bg-black/90 font-bold text-[14px] rounded-2xl transition-all flex items-center justify-center gap-2.5 shadow-xl shadow-black/15 disabled:opacity-50 cursor-pointer transform active:scale-[0.99]"
            >
              {status === 'printing' ? <RefreshCw className="w-4 h-4 animate-spin" /> : status === 'success' ? <CheckCircle2 className="w-4 h-4" /> : status === 'error' ? <X className="w-4 h-4" /> : <Printer className="w-4 h-4" />}
              <span>{status === 'printing' ? 'Spooling...' : status === 'success' ? 'Sent!' : status === 'error' ? 'Print Failed' : 'Print Document'}</span>
            </button>
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
                alt={`Baked Page ${i + 1}`}
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
                { key: 'Ctrl + Z', label: 'Undo step back' },
                { key: 'Ctrl + Y', label: 'Redo step forward' },
                { key: 'R', label: 'Rotate 90° clockwise' },
                { key: 'C', label: 'Toggle Crop Mode' },
                { key: 'I', label: 'Invert image colors' },
                { key: 'M', label: 'Mirror horizontally' },
                { key: 'V', label: 'Mirror vertically' },
                { key: '0', label: 'Reset all Laboratory adjustments' },
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
