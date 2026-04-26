'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { 
  Menu, Lock, Layers, Copy, Paperclip, CheckCircle2,
  RefreshCw, Settings2, FolderDown, Leaf, Monitor, Droplet, 
  Settings, ChevronRight, X, Printer, FileText, Minus, Plus,
  RotateCcw, Sun, ZoomIn, ZoomOut, Crop, SlidersHorizontal,
  Contrast, Sparkles, Move, Maximize, BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Document, Page, pdfjs } from 'react-pdf';

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
  onClose 
}: { 
  documentPath?: string, 
  base64Data?: string, 
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
  const [securePrint, setSecurePrint] = useState(false);
  const [paperSupply, setPaperSupply] = useState('Automatically Select');
  const [finishing, setFinishing] = useState('None');
  const [printQuality, setPrintQuality] = useState('Enhanced');
  
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

  const [zoom, setZoom] = useState(0.8); 
  const [activeTab, setActiveTab] = useState<'settings' | 'laboratory'>('laboratory');
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const touchStartDist = useRef<number | null>(null);
  const touchStartZoom = useRef<number>(zoom);

  const paperOptions = ['Automatically Select', 'Tray 1 (Bypass)', 'Tray 2', 'Tray 3'];
  const qualityOptions = ['Enhanced', 'Standard', 'Draft'];

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
        setImgRect(prev => {
           let newX = dragStart.rectX + dx;
           let newY = dragStart.rectY + dy;
           
           // Clamp to A4 boundaries
           const limitX = Math.max(0, A4_PT_W/2 - prev.w/2);
           const limitY = Math.max(0, A4_PT_H/2 - prev.h/2);
           newX = Math.max(-limitX, Math.min(limitX, newX));
           newY = Math.max(-limitY, Math.min(limitY, newY));

           return { ...prev, x: newX, y: newY };
        });
      } else if (isResizing && resizeHandle) {
        if (isCropMode) {
          // Adjust CROP boundaries
          setCropRect(prev => {
            let { t, b, l, r } = { ...prev };
            if (resizeHandle.includes('e')) r = Math.max(0, dragStart.cropR - dx);
            if (resizeHandle.includes('s')) b = Math.max(0, dragStart.cropB - dy);
            if (resizeHandle.includes('w')) l = Math.max(0, dragStart.cropL + dx);
            if (resizeHandle.includes('n')) t = Math.max(0, dragStart.cropT + dy);
            return { t, b, l, r };
          });
        } else {
          // Adjust IMAGE dimensions (Proportional Lock)
          setImgRect(prev => {
            let { x, y, w, h } = { ...prev };
            const ratio = dragStart.rectW / dragStart.rectH;

            // Simple proportional logic based on dominant handle
            if (resizeHandle.includes('e')) {
              w = Math.max(20, dragStart.rectW + dx);
              h = w / ratio;
            } else if (resizeHandle.includes('s')) {
              h = Math.max(20, dragStart.rectH + dy);
              w = h * ratio;
            } else if (resizeHandle.includes('w')) {
              const newW = Math.max(20, dragStart.rectW - dx);
              x = dragStart.rectX + (dragStart.rectW - newW);
              w = newW;
              h = w / ratio;
            } else if (resizeHandle.includes('n')) {
              const newH = Math.max(20, dragStart.rectH - dy);
              y = dragStart.rectY + (dragStart.rectH - newH);
              h = newH;
              w = h * ratio;
            }

            // A4 Auto-Clamping on Resize
            if (w > A4_PT_W) { w = A4_PT_W; h = w / ratio; }
            if (h > A4_PT_H) { h = A4_PT_H; w = h * ratio; }

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
            // Bake the singular image with interactive rect and crop
            const bakeCanvas = document.createElement('canvas');
            bakeCanvas.width = A4_PT_W * RES_MULT;
            bakeCanvas.height = A4_PT_H * RES_MULT;
            const ctx = bakeCanvas.getContext('2d');
            if (ctx) {
              // Ensure we start with a clean white A4 slate
              ctx.scale(RES_MULT, RES_MULT);
              ctx.fillStyle = "white";
              ctx.fillRect(0, 0, A4_PT_W, A4_PT_H);
              
              ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) invert(${invert ? 1 : 0}) hue-rotate(${hue}deg) ${colorMode === 'monochrome' ? 'grayscale(1)' : ''}`;
              
              const physicalW = imgRect.w - cropRect.l - cropRect.r;
              const physicalH = imgRect.h - cropRect.t - cropRect.b;
              const drawX = A4_PT_W/2 + imgRect.x - imgRect.w/2 + cropRect.l;
              const drawY = A4_PT_H/2 + imgRect.y - imgRect.h/2 + cropRect.t;

              ctx.save();
              ctx.translate(drawX + physicalW/2, drawY + physicalH/2);
              ctx.rotate((rotation * Math.PI) / 180);
              ctx.scale(mirrorH ? -1 : 1, mirrorV ? -1 : 1);
              
              // Draw the image clipped by the cropRect
              ctx.drawImage(
                previewImage, 
                (cropRect.l / imgRect.w) * previewImage.naturalWidth, 
                (cropRect.t / imgRect.h) * previewImage.naturalHeight,
                ((imgRect.w - cropRect.l - cropRect.r) / imgRect.w) * previewImage.naturalWidth,
                ((imgRect.h - cropRect.t - cropRect.b) / imgRect.h) * previewImage.naturalHeight,
                -physicalW/2, 
                -physicalH/2, 
                physicalW, 
                physicalH
              );
              ctx.restore();
              captured.push(bakeCanvas.toDataURL('image/jpeg', 0.95));
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
      const electronWindow = window as unknown as { electronAPI?: { printNative: (opts: unknown) => Promise<{ success: boolean; error?: string }> }, electron?: { printNative: (opts: unknown) => Promise<{ success: boolean; error?: string }> } };
      
      const res = await (electronWindow.electronAPI || electronWindow.electron)!.printNative({
        filePath: documentPath, 
        base64Data: base64Data, 
        options: {
          printer: selectedPrinter,
          copies,
          side: sides,
          monochrome: colorMode === 'monochrome',
          securePrint,
          paperSupply,
          finishing,
          quality: printQuality,
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
        setStatus('success');
        setTimeout(() => { if (onClose) onClose(); }, 1500);
      } else {
        throw new Error(res.error || 'Spool failure');
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
          <div className="flex items-center gap-4 shrink-0">
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
               className={cn("px-4 py-1.5 rounded-[4px] text-[11px] font-bold uppercase tracking-[0.1em] transition-all", activeTab === 'settings' ? "bg-white text-black shadow-sm border border-[#E2E8F0]" : "text-[#7E8B9E] hover:text-black")}
             >
               Protocol
             </button>
             <button 
               onClick={() => setActiveTab('laboratory')}
               className={cn("px-4 py-1.5 rounded-[4px] text-[11px] font-bold uppercase tracking-[0.1em] transition-all", activeTab === 'laboratory' ? "bg-white text-black shadow-sm border border-[#E2E8F0]" : "text-[#7E8B9E] hover:text-black")}
             >
               Laboratory
             </button>
          </div>
          
          <div className="flex items-center gap-2">
             {onClose && (
               <button onClick={onClose} className="h-[36px] w-[36px] flex items-center justify-center border border-[#E2E8F0] bg-white text-[#7E8B9E] hover:text-red-500 hover:bg-red-50 transition-colors rounded-[5.57px] shadow-sm">
                 <X className="w-[14px] h-[14px]" />
               </button>
             )}
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
                         <button onClick={() => setCopies(Math.max(1, copies - 1))} className="h-[32px] w-[32px] flex items-center justify-center rounded-[4px] border border-[#E2E8F0] bg-white text-black font-bold shadow-sm hover:bg-[#F8FAFC] transition-all">
                            <Minus className="w-[14px] h-[14px]" />
                         </button>
                         <span className="text-[14px] font-bold w-6 text-center tabular-nums">{copies}</span>
                         <button onClick={() => setCopies(copies + 1)} className="h-[32px] w-[32px] flex items-center justify-center rounded-[4px] border border-[#E2E8F0] bg-white text-black font-bold shadow-sm hover:bg-[#F8FAFC] transition-all">
                            <Plus className="w-[14px] h-[14px]" />
                         </button>
                      </div>
                   </div>

                   <div className="h-[1px] bg-[#E2E8F0] w-full" />

                    <div className="grid grid-cols-2 gap-2">
                       <button 
                         onClick={() => setSides('simplex')} 
                         className={cn("flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-[5.57px] border transition-all", sides === 'simplex' ? "bg-black text-white border-black shadow-lg shadow-black/10" : "bg-white text-[#7E8B9E] border-[#E2E8F0] hover:bg-[#F8FAFC]")}
                       >
                          <FileText className="w-4 h-4" />
                          <div className="text-center">
                             <div className="text-[10px] font-bold uppercase tracking-[0.1em]">Single</div>
                             <div className={cn("text-[8px] font-bold uppercase tracking-[0.1em]", sides === 'simplex' ? "text-white/60" : "text-[#7E8B9E]/60")}>Side Scan</div>
                          </div>
                       </button>
                       <button 
                         onClick={() => setSides('duplex')} 
                         className={cn("flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-[5.57px] border transition-all", sides === 'duplex' ? "bg-black text-white border-black shadow-lg shadow-black/10" : "bg-white text-[#7E8B9E] border-[#E2E8F0] hover:bg-[#F8FAFC]")}
                       >
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
                         className={cn("flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-[5.57px] border transition-all", colorMode === 'color' ? "bg-[#FF591E] text-white border-[#FF591E] shadow-lg shadow-[#FF591E]/20" : "bg-white text-[#7E8B9E] border-[#E2E8F0] hover:bg-[#F8FAFC]")}
                       >
                          <Droplet className="w-4 h-4" />
                          <div className="text-center">
                             <div className="text-[10px] font-bold uppercase tracking-[0.1em]">Full Color</div>
                             <div className={cn("text-[8px] font-bold uppercase tracking-[0.1em]", colorMode === 'color' ? "text-white/60" : "text-[#7E8B9E]/60")}>Vibrant</div>
                          </div>
                       </button>
                       <button 
                         onClick={() => setColorMode('monochrome')} 
                         className={cn("flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-[5.57px] border transition-all", colorMode === 'monochrome' ? "bg-[#323A46] text-white border-[#323A46] shadow-lg" : "bg-white text-[#7E8B9E] border-[#E2E8F0] hover:bg-[#F8FAFC]")}
                       >
                          <Layers className="w-4 h-4" />
                          <div className="text-center">
                             <div className="text-[10px] font-bold uppercase tracking-[0.1em]">Monochrome</div>
                             <div className={cn("text-[8px] font-bold uppercase tracking-[0.1em]", colorMode === 'monochrome' ? "text-white/60" : "text-[#7E8B9E]/60")}>B&W Mesh</div>
                          </div>
                       </button>
                    </div>

                   <button onClick={() => handleCycle(paperSupply, paperOptions, setPaperSupply)} className="w-full flex items-center justify-between p-3 rounded-[5.57px] border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-all text-left bg-white shadow-sm">
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

                    {/* Content Scaling */}
                    <div className="space-y-3">
                       <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold text-[#7E8B9E] uppercase tracking-[0.1em]">Content Fill Scale</label>
                          <span className="text-[10px] font-bold text-black">{contentScale}%</span>
                       </div>
                       <div className="flex items-center gap-2">
                         <Maximize className="w-3.5 h-3.5 text-[#7E8B9E]" />
                         <input type="range" min="50" max="200" value={contentScale} onChange={(e) => setContentScale(parseInt(e.target.value))} className="w-full h-1.5 bg-[#E2E8F0] rounded-lg appearance-none accent-black" />
                       </div>
                    </div>

                    <div className="h-[1px] bg-[#E2E8F0] w-full" />

                    {/* Quick Transform Grid */}
                    <div className="grid grid-cols-2 gap-2">
                       <button onClick={() => setInvert(!invert)} className={cn("h-[36px] flex items-center justify-center gap-1.5 rounded-[5.57px] border text-[11px] font-bold uppercase tracking-[0.1em] transition-all", invert ? "bg-black text-white border-black" : "bg-white border-[#E2E8F0] text-black hover:bg-[#F8FAFC]")}>
                         Invert
                       </button>
                       <button onClick={() => setRotation(r => (r + 90) % 360)} className="h-[36px] flex items-center justify-center gap-1.5 rounded-[5.57px] border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-black text-[11px] font-bold uppercase tracking-[0.1em] transition-all">
                         Rotate
                       </button>
                       <button onClick={() => setMirrorH(!mirrorH)} className={cn("h-[36px] flex items-center justify-center gap-1.5 rounded-[5.57px] border text-[11px] font-bold uppercase tracking-[0.1em] transition-all", mirrorH ? "bg-[#3568FF] text-white border-[#3568FF]" : "bg-white border-[#E2E8F0] text-black hover:bg-[#F8FAFC]")}>
                         Mirror H
                       </button>
                       <button onClick={() => setMirrorV(!mirrorV)} className={cn("h-[36px] flex items-center justify-center gap-1.5 rounded-[5.57px] border text-[11px] font-bold uppercase tracking-[0.1em] transition-all", mirrorV ? "bg-[#3568FF] text-white border-[#3568FF]" : "bg-white border-[#E2E8F0] text-black hover:bg-[#F8FAFC]")}>
                         Mirror V
                       </button>
                    </div>
                    
                    <button onClick={() => setIsCropMode(!isCropMode)} className={cn("w-full h-[40px] flex items-center justify-center gap-2 rounded-[5.57px] border transition-all font-bold uppercase tracking-[0.1em] text-[11px] shadow-sm", isCropMode ? "bg-[#059669] text-white border-[#059669]" : "bg-black text-white border-black hover:bg-black/90")}>
                       <Crop className="w-3.5 h-3.5" /> {isCropMode ? "Confirm Area" : "Select Crop Area"}
                    </button>

                    <div className="mt-2 bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-[5.57px] flex gap-2">
                       <Sparkles className="w-3.5 h-3.5 text-[#3568FF] shrink-0 mt-0.5" />
                       <p className="text-[9px] font-bold text-[#7E8B9E] uppercase tracking-[0.1em] leading-relaxed"> Laboratory effects apply to the entire mesh stream in real-time. </p>
                    </div>
                 </div>
              )}
           </div>

           {/* FINAL ACTION SECTION */}
           <div className="p-6 border-t border-[#E2E8F0] bg-[#F8FAFC] flex flex-col gap-3">
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
                {status === 'printing' ? 'Spooling...' : status === 'success' ? 'Ready' : 'Initiate Protocol'}
              </button>
           </div>
        </div>

        {/* === ULTRA-WIDE CONTINUOUS PREVIEW === */}
        <div className="flex-1 bg-[#F8FAFC] relative flex flex-col overflow-hidden">
           
           {/* Studio Tools Bar */}
           <div className="absolute bottom-6 right-6 flex items-center gap-2 bg-white border border-[#E2E8F0] p-1.5 rounded-[5.57px] shadow-sm z-[100] animate-in slide-in-from-right duration-500">
              <div className="flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-[4px] border border-[#E2E8F0]">
                 <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="h-[28px] w-[32px] flex items-center justify-center hover:bg-white border border-transparent hover:border-[#E2E8F0] rounded-[4px] text-black transition-all active:scale-95"><Minus className="w-[14px] h-[14px]" /></button>
                 <div className="w-12 text-center">
                    <span className="text-[11px] font-bold text-black">{Math.round(zoom * 100)}%</span>
                 </div>
                 <button onClick={() => setZoom(z => Math.min(3.0, z + 0.1))} className="h-[28px] w-[32px] flex items-center justify-center hover:bg-white border border-transparent hover:border-[#E2E8F0] rounded-[4px] text-black transition-all active:scale-95"><Plus className="w-[14px] h-[14px]" /></button>
              </div>
              <div className="w-[1px] h-6 bg-[#E2E8F0] mx-1" />
              <button onClick={() => { setZoom(0.8); setRotation(0); }} className="h-[36px] w-[36px] flex items-center justify-center hover:bg-[#F8FAFC] border border-transparent hover:border-[#E2E8F0] rounded-[4px] text-black transition-all active:rotate-180 duration-500"><RotateCcw className="w-[14px] h-[14px]" /></button>
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
                       <div className="flex flex-col items-center gap-[50px] py-10">
                          <div className="relative group transition-all duration-300 ease-out">
                             <div className="absolute -top-8 left-0 transition-opacity opacity-40 group-hover:opacity-100 flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 text-[#323A46]" />
                                <span className="text-[10px] font-bold text-[#323A46] uppercase tracking-[0.1em]">A4 SHEET VISUALIZATION</span>
                             </div>
                             <div 
                               className={cn("bg-white border border-[#E2E8F0] relative overflow-hidden transition-all duration-300", isCropMode ? "shadow-2xl ring-4 ring-black/5" : "shadow-[0px_4px_24px_rgba(0,0,0,0.06)]")}
                               style={{ width: '595.27px', height: '841.88px' }}
                             >
                                <div 
                                  className="absolute"
                                  style={{ 
                                    left: `calc(50% + ${imgRect.x}px)`, 
                                    top: `calc(50% + ${imgRect.y}px)`, 
                                    width: `${imgRect.w}px`, 
                                    height: `${imgRect.h}px`,
                                    transform: 'translate(-50%, -50%)',
                                    rotate: `${rotation}deg`,
                                    scale: `${mirrorH ? -1 : 1} ${mirrorV ? -1 : 1}`,
                                    cursor: isDragging ? 'grabbing' : 'grab'
                                  }}
                                  onMouseDown={onStartDrag}
                                  onContextMenu={(e) => {
                                    e.preventDefault();
                                    setIsCropMode(!isCropMode);
                                  }}
                                >
                                   {/* The Full Image (Dimmed outside crop in Crop Mode) */}
                                   <div className={cn("relative w-full h-full overflow-hidden transition-all", isCropMode ? "bg-[#F8FAFC]/80 backdrop-blur-[2px]" : "")}>
                                      <img 
                                        id="laboratory-preview-image"
                                        src={documentPath} 
                                        alt="Laboratory Mesh" 
                                        crossOrigin="anonymous"
                                        className="absolute block m-0 p-0 pointer-events-none select-none transition-opacity"
                                        style={{ 
                                          left: -cropRect.l,
                                          top: -cropRect.t,
                                          width: imgRect.w,
                                          height: imgRect.h,
                                          clipPath: isCropMode ? 'none' : `inset(${cropRect.t}px ${cropRect.r}px ${cropRect.b}px ${cropRect.l}px)`,
                                          opacity: isCropMode ? 0.4 : 1,
                                          filter: isCropMode ? 'none' : `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) invert(${invert ? 1 : 0}) hue-rotate(${hue}deg) ${colorMode === 'monochrome' ? 'grayscale(1)' : ''}`,
                                        }}
                                                                                 onLoad={(e) => {
                                           setNumPages(1);
                                           const img = e.currentTarget;
                                           const A4_PT_W = 595.27;
                                           const A4_PT_H = 841.88;
                                           const ratio = img.naturalWidth / img.naturalHeight;
                                           
                                           // Calculate max width/height that fits within A4 while maintaining ratio
                                           let finalW = A4_PT_W * 0.9; // 90% width
                                           let finalH = finalW / ratio;
                                           
                                           if (finalH > A4_PT_H * 0.9) {
                                             finalH = A4_PT_H * 0.9;
                                             finalW = finalH * ratio;
                                           }
                                           
                                           setImgRect(prev => ({ ...prev, w: finalW, h: finalH }));
                                         }}

                                      />

                                      {/* The "Visible" Crop Area Highlighting */}
                                      {isCropMode && (
                                        <div 
                                          className="absolute border-[3px] border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] z-10"
                                          style={{
                                            left: cropRect.l,
                                            top: cropRect.t,
                                            width: imgRect.w - cropRect.l - cropRect.r,
                                            height: imgRect.h - cropRect.t - cropRect.b,
                                            filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) invert(${invert ? 1 : 0}) hue-rotate(${hue}deg) ${colorMode === 'monochrome' ? 'grayscale(1)' : ''}`,
                                          }}
                                        >
                                          <img 
                                            src={documentPath}
                                            crossOrigin="anonymous"
                                            className="absolute w-full h-full object-cover"
                                            style={{
                                              width: imgRect.w,
                                              height: imgRect.h,
                                              left: -cropRect.l,
                                              top: -cropRect.t
                                            }}
                                          />

                                          {/* Floating Confirmation Button */}
                                          <div className="absolute -top-14 left-1/2 -translate-x-1/2 flex items-center justify-center">
                                             <button 
                                               onClick={() => setIsCropMode(false)}
                                               className="bg-[#059669] text-white px-4 py-2 rounded-[5.57px] text-[10px] font-bold uppercase tracking-[0.1em] shadow-lg flex items-center gap-2 hover:bg-[#047857] transition-all active:scale-95"
                                             >
                                                <CheckCircle2 className="w-[14px] h-[14px]" /> Apply Crop
                                             </button>
                                          </div>
                                        </div>
                                      )}
                                   </div>
                                   
                                   {/* Manipulation Handles */}
                                   <div className="absolute inset-0 pointer-events-none z-20">
                                      {['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'].map(h => (
                                         <div 
                                           key={h}
                                           className={cn(
                                             "absolute pointer-events-auto shadow-sm transition-all",
                                             isCropMode ? "bg-[#3568FF] w-4 h-4 rounded-[4px]" : "bg-white w-3 h-3 border-2 border-[#3568FF] rounded-full",
                                             h === 'nw' && (isCropMode ? "-top-1 -left-1 border-t-2 border-l-2 border-white" : "-top-1.5 -left-1.5"),
                                             h === 'ne' && (isCropMode ? "-top-1 -right-1 border-t-2 border-r-2 border-white" : "-top-1.5 -right-1.5"),
                                             h === 'sw' && (isCropMode ? "-bottom-1 -left-1 border-b-2 border-l-2 border-white" : "-bottom-1.5 -left-1.5"),
                                             h === 'se' && (isCropMode ? "-bottom-1 -right-1 border-b-2 border-r-2 border-white" : "-bottom-1.5 -right-1.5"),
                                             h === 'nw' && "cursor-nw-resize", h === 'ne' && "cursor-ne-resize",
                                             h === 'sw' && "cursor-sw-resize", h === 'se' && "cursor-se-resize",
                                             h === 'n' && "hidden", h === 's' && "hidden", h === 'e' && "hidden", h === 'w' && "hidden"
                                           )}
                                           style={isCropMode ? {
                                               left: h === 'nw' || h === 'sw' ? cropRect.l - 4 : h === 'ne' || h === 'se' ? imgRect.w - cropRect.r - 12 : 'auto',
                                               top: h === 'nw' || h === 'ne' ? cropRect.t - 4 : h === 'sw' || h === 'se' ? imgRect.h - cropRect.b - 12 : 'auto',
                                           } : {}}
                                           onMouseDown={(e) => onStartResize(e, h)}
                                         />
                                      ))}
                                   </div>
                                </div>
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
                        <div className="flex flex-col items-center gap-[50px] py-10">
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
                                {/* Page Metadata Tag */}
                                <div className="absolute -top-8 left-0 transition-opacity opacity-40 group-hover:opacity-100 flex items-center gap-2">
                                   <FileText className="w-3.5 h-3.5 text-[#323A46]" />
                                   <span className="text-[10px] font-bold text-[#323A46] uppercase tracking-[0.1em]">PAGE {index + 1}</span>
                                </div>
                               
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
        </div>
      )}

    </div>
  );
}
