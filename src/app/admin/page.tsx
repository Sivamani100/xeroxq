"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Printer, 
  Trash2, 
  Search, 
  Clock, 
  RefreshCw,
  FileText,
  QrCode,
  LogOut,
  ChevronRight,
  Zap,
  Activity,
  ArrowUpRight,
  Settings2,
  MousePointer2,
  Copy,
  Maximize,
  ShieldCheck,
  CheckCircle2,
  Download,
  Plus,
  Minus,
  RotateCcw,
  Grid,
  ArrowUpToLine,
  ArrowDownToLine,
  Palette,
  History,
  Crop,
  Bell,
  BellOff
} from "lucide-react";
import { Rnd } from "react-rnd";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

import * as mammoth from "mammoth";
import html2canvas from "html2canvas-pro";
import { QRCodeSVG } from "qrcode.react";

// Dialog components for modals
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ImageCropper } from "@/components/editing/image-cropper";
import { Skeleton } from "@/components/ui/skeleton";

interface Shop {
  id: string;
  name: string;
  slug: string;
  upi_id?: string;
  price_mono?: number;
  price_color?: number;
  is_open?: boolean;
}

interface Job {
  id: string;
  token: string;
  customer_name: string;
  file_path: string;
  file_name: string;
  preferences: {
    color: boolean;
    copies: number;
    doubleSided: boolean;
  };
  status: string;
  created_at: string;
  expires_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [shop, setShop] = useState<Shop | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [creatingShop, setCreatingShop] = useState(false);
  const [newShopData, setNewShopData] = useState({ name: "", slug: "", upi_id: "" });
  const [printingJobId, setPrintingJobId] = useState<string | null>(null);
  const [showingSettings, setShowingSettings] = useState(false);
  const [updatingSettings, setUpdatingSettings] = useState(false);
  const [activePrintJob, setActivePrintJob] = useState<Job | null>(null);
  const [printPreviewUrl, setPrintPreviewUrl] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [canvasItems, setCanvasItems] = useState<{id: string, x: number, y: number, width: number, height: number, pageIndex: number, zIndex?: number, isGrayscale?: boolean, payloadUrl?: string, rawHtml?: string}[]>([]);
  const [history, setHistory] = useState<typeof canvasItems[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isHistoryAction = useRef(false);
  const [isGridSnapped, setIsGridSnapped] = useState(false);

  const [selectedCanvasIds, setSelectedCanvasIds] = useState<string[]>([]);
  const [pageCount, setPageCount] = useState(1);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [verifyingJobId, setVerifyingJobId] = useState<string | null>(null);
  const [verificationMode, setVerificationMode] = useState<'complete' | 'reprint' | null>(null);
  const [deleteConfirmJob, setDeleteConfirmJob] = useState<Job | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [tokenChallengeInput, setTokenChallengeInput] = useState("");
  const [activeDownloadId, setActiveDownloadId] = useState<string | null>(null);
  const [purgedJob, setPurgedJob] = useState<Job | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canvasZoom, setCanvasZoom] = useState(1.0);
  const [isCompositing, setIsCompositing] = useState(false);
  const [croppingItemId, setCroppingItemId] = useState<string | null>(null);
  const addImageInputRef = useRef<HTMLInputElement>(null);
  const [viewportWidth, setViewportWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 0);
  const [viewportHeight, setViewportHeight] = useState(typeof window !== "undefined" ? window.innerHeight : 0);

  useEffect(() => {
    if (isHistoryAction.current) {
      isHistoryAction.current = false;
      return;
    }
    setHistory(prev => {
      const newHist = prev.slice(0, historyIndex + 1);
      newHist.push(canvasItems);
      return newHist;
    });
    setHistoryIndex(prev => prev + 1);
  }, [canvasItems]);
  
  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
      setViewportHeight(window.innerHeight);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = -e.deltaY;
        // Direct zoom manipulation without bubbling to browser
        setCanvasZoom(prev => Math.max(0.4, Math.min(3.0, prev + delta * 0.005)));
      }
    };
    
    // Non-passive true allows preventDefault to actually halt zooming at the browser level
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [activePrintJob, printPreviewUrl]);


  const isMobileView = viewportWidth < 768;
  const sidebarOffset = isMobileView ? 16 : 360;
  const baseScale = Math.min((viewportWidth - sidebarOffset) / 850, viewportHeight / 1300);
  const finalScale = Math.max(0.2, Math.min(1, baseScale)) * canvasZoom;


  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) return;

      if (e.ctrlKey && e.key === "a") {
        e.preventDefault();
        setSelectedCanvasIds(canvasItems.map(i => i.id));
      }
      
      if (e.key === "Delete" || e.key === "Backspace") {
        setCanvasItems(items => items.filter(i => !selectedCanvasIds.includes(i.id)));
        setSelectedCanvasIds([]);
      }

      if (e.key === " ") setIsSpacePressed(true);

      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const delta = e.shiftKey ? 10 : 1;
        setCanvasItems(items => items.map(item => {
          if (!selectedCanvasIds.includes(item.id)) return item;
          if (e.key === "ArrowUp") return { ...item, y: item.y - delta };
          if (e.key === "ArrowDown") return { ...item, y: item.y + delta };
          if (e.key === "ArrowLeft") return { ...item, x: item.x - delta };
          if (e.key === "ArrowRight") return { ...item, x: item.x + delta };
          return item;
        }));
      }

      if (e.ctrlKey && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        setCanvasZoom(z => Math.min(3.0, z + 0.1));
      }
      if (e.ctrlKey && e.key === "-") {
        e.preventDefault();
        setCanvasZoom(z => Math.max(0.4, z - 0.1));
      }
      if (e.ctrlKey && e.key === "0") {
        e.preventDefault();
        setCanvasZoom(1.0);
        setPanOffset({ x: 0, y: 0 });
      }

      if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        if (historyIndex > 0) {
          isHistoryAction.current = true;
          const newIdx = historyIndex - 1;
          setHistoryIndex(newIdx);
          setCanvasItems(history[newIdx]);
        }
      }

      if (e.ctrlKey && e.key === "y") {
        e.preventDefault();
        if (historyIndex < history.length - 1) {
          isHistoryAction.current = true;
          const newIdx = historyIndex + 1;
          setHistoryIndex(newIdx);
          setCanvasItems(history[newIdx]);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === " ") setIsSpacePressed(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      clearInterval(timer);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [canvasItems, selectedCanvasIds, history, historyIndex]);
  
  // Persist sound settings & Auto-Resume Audio Protocol
  useEffect(() => {
    const saved = localStorage.getItem("xeroxq_admin_sound");
    if (saved === "true") {
      setIsSoundEnabled(true);
      
      // Browser Auto-play Policy Bypass: 
      // Initialize/Resume AudioContext on the very first user interaction anywhere on the document.
      const unlockAudio = async () => {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        // Cleanup after first interaction
        window.removeEventListener('mousedown', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
        console.log("XeroxQ Alert Engine: Unlocked via interaction");
      };

      window.addEventListener('mousedown', unlockAudio);
      window.addEventListener('keydown', unlockAudio);
      window.addEventListener('touchstart', unlockAudio);

      return () => {
        window.removeEventListener('mousedown', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      };
    }
  }, []);

  const requestNotificationPermission = async () => {
    // 1. Initialize AudioContext (requires user gesture)
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
    }

    // 2. Request Browser Permission
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
          setIsSoundEnabled(true);
          localStorage.setItem("xeroxq_admin_sound", "true");
          // Play a small test sound to confirm
          playNotificationPing();
      } else {
          alert("Permission denied. Desktop notifications will not be shown, but sound may still play if active.");
          setIsSoundEnabled(true);
          localStorage.setItem("xeroxq_admin_sound", "true");
      }
    } else {
        setIsSoundEnabled(true);
        localStorage.setItem("xeroxq_admin_sound", "true");
    }
  };

  const toggleSound = () => {
    const newVal = !isSoundEnabled;
    setIsSoundEnabled(newVal);
    localStorage.setItem("xeroxq_admin_sound", newVal.toString());
    
    // If we're enabling, also try to initialize/resume immediately 
    // since this toggle is a user-initiated gesture.
    if (newVal) {
        requestNotificationPermission();
    }
  };

  const stats = {
    total: jobs.length,
    printed: jobs.filter(j => j.status === "printed").length,
    active: jobs.filter(j => j.status !== "printed").length
  };

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: shopData } = await supabase
        .from("shops")
        .select("*")
        .eq("owner_id", user.id)
        .single();

      if (shopData) {
        setShop(shopData);
        fetchJobs(shopData.id);

        const channelName = `jobs-${shopData.id}-${Date.now()}`;
        const subscription = supabase
          .channel(channelName)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "jobs", filter: `shop_id=eq.${shopData.id}` },
            (payload) => {
              if (payload.eventType === 'INSERT') {
                  const newJob = payload.new as Job;
                  if (localStorage.getItem("xeroxq_admin_sound") === "true") {
                      playNotificationPing();
                      sendDesktopNotification(newJob);
                  }
              }
              fetchJobs(shopData.id);
            }
          )
          .subscribe();

        return () => { supabase.removeChannel(subscription); };
      } else {
        setLoading(false);
      }
    }

    checkUser();
  }, [router]);

  const playNotificationPing = async () => {
    try {
      const audioCtx = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      if (!audioContextRef.current) audioContextRef.current = audioCtx;
      
      // Final fallback resume in case the interaction listener hasn't fired yet
      if (audioCtx.state === 'suspended') {
          await audioCtx.resume();
      }

      if (audioCtx.state !== 'running') {
          console.warn("XeroxQ Alert Engine: State is blocked by browser policy. Interaction required.");
          return;
      }

      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      // "WhatsApp Web" style dual-tone notification
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1046.50, audioCtx.currentTime); // C6

      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(audioCtx.currentTime + 0.5);
      osc2.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn("Notification Audio Protocol failed:", e);
    }
  };

  const sendDesktopNotification = (job: Job) => {
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification("XeroxQ: New Job Signal", {
            body: `Customer ${job.customer_name || 'Anonymous'} transmitted a new document for physicalization.`,
            icon: "/xeroxq_logo.png",
            tag: job.id // Avoid duplicate alerts for same job
        });
    }
  };

  const fetchJobs = async (shopId: string) => {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingShop(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const slug = newShopData.slug.toLowerCase().replace(/[^a-z0-9-]/g, "");

      const res = await fetch("/api/create-shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_id: user.id,
          name: newShopData.name,
          slug,
          upi_id: newShopData.upi_id,
        }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Shop creation failed");

      setShop(body.shop);
      if (body.shop) fetchJobs(body.shop.id);
    } catch (error: any) {
      alert("Error creating shop: " + error.message);
    } finally {
      setCreatingShop(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("jobs").update({ status }).eq("id", id);
  };

  const handleVerifyComplete = async () => {
    const job = jobs.find(j => j.id === verifyingJobId);
    if (!job) return;

    if (tokenChallengeInput === job.token) {
      if (verificationMode === 'complete') {
        await updateStatus(job.id, "printed");
        setJobs(docs => docs.map(d => d.id === job.id ? { ...d, status: 'printed'} : d));
      } else if (verificationMode === 'reprint') {
        // Trigger the actual print logic for an already printed job
        handlePrint(job);
      }
      
      setVerifyingJobId(null);
      setVerificationMode(null);
      setTokenChallengeInput("");
    } else {
      alert("Verification Failed: Invalid Token Credentials");
    }
  };

  const handlePrint = async (job: Job) => {
    setActivePrintJob(job);
    setIsDecrypting(true);
    setPrintPreviewUrl(null);
    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .createSignedUrl(job.file_path, 60 * 5);

      if (error) {
        // Handle missing files (404) gracefully
        if (error.message?.includes("Object not found") || (error as any).status === 404) {
          if (confirm("CRITICAL: Mesh payload not found. It was likely purged for privacy compliance. Purge stale database record too?")) {
            handleDeleteJob(job);
          }
          return;
        }
        throw error;
      }

      if (data?.signedUrl) {
        const response = await fetch(data.signedUrl);
        const arrayBuffer = await response.arrayBuffer();
        
        const ext = job.file_name.split('.').pop()?.toLowerCase() || '';
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'bmp'].includes(ext);
        
        let mimeType = 'application/pdf';
        if (ext === 'png') mimeType = 'image/png';
        else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
        else if (ext === 'webp') mimeType = 'image/webp';

        const blob = new Blob([arrayBuffer], { type: mimeType });
        const localUrl = URL.createObjectURL(blob);
        if (isImage) {
           const img = new Image();
           img.src = localUrl;
           img.onload = () => {
              const ratio = img.width / img.height;
              const initialWidth = 400;
              const initialHeight = initialWidth / ratio;
              
              setPrintPreviewUrl(localUrl);
              setCanvasItems([{ 
                 id: `init-${Date.now()}`, 
                 x: (794 - initialWidth) / 2, 
                 y: 50, 
                 width: initialWidth, 
                 height: initialHeight, 
                 pageIndex: 0,
                 payloadUrl: localUrl
              }]);
              setPageCount(1);
              setActivePageIndex(0);
           };
        } else if (ext === 'pdf') {
           try {
              const { pdfjs } = await import("react-pdf");
              pdfjs.GlobalWorkerOptions.workerSrc = new URL(
                'pdfjs-dist/build/pdf.worker.min.mjs',
                import.meta.url,
              ).toString();
              
              const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });

             const pdf = await loadingTask.promise;
             const numPages = pdf.numPages;
             
             let newCanvasItems = [];
             for (let i = 1; i <= numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 1.5 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                if (!context) continue;
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                await page.render({ canvasContext: context, viewport } as any).promise;
                
                const imgDataUrl = canvas.toDataURL('image/png');
                const initialWidth = 600;
                const initialHeight = initialWidth / (viewport.width / viewport.height);
                
                newCanvasItems.push({
                   id: `pdf-${i}-${Date.now()}`,
                   x: 0,
                   y: 0,
                   width: 794,
                   height: 1123,
                   pageIndex: i - 1,
                   payloadUrl: imgDataUrl
                });
             }
             
             setPrintPreviewUrl(localUrl); // fallback
             setCanvasItems(newCanvasItems);
             setPageCount(numPages);
             setActivePageIndex(0);
           } catch(e) {
             console.error("PDF Parse error", e);
             setPrintPreviewUrl(null);
             setCanvasItems([{
                id: `pdf-error-${Date.now()}`,
                x: 0,
                y: 0,
                width: 794,
                height: 1123,
                pageIndex: 0,
                rawHtml: `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; background: #FFF1F2; border: 2px dashed #FECACA; color: #991B1B; padding: 40px; text-align: center;">
                  <h3 style="margin: 0 0 10px 0;">PDF Render Error</h3>
                  <p style="font-size: 14px; margin: 0;">We couldn't render this PDF in the canvas. You can still use the "Transmit to Printer" button to attempt a native browser print.</p>
                </div>`
             }]);
             setPageCount(1);
             setActivePageIndex(0);
           }
        } else if (ext === 'docx' || ext === 'doc') {
           try {
             const result = await mammoth.convertToHtml({ arrayBuffer });
             
             setPrintPreviewUrl(localUrl);
             setCanvasItems([{
                id: `docx-${Date.now()}`,
                x: 0,
                y: 0,
                width: 794,
                height: 1123,
                pageIndex: 0,
                rawHtml: `<div style="padding: 40px; font-family: Arial, sans-serif; font-size: 14pt; line-height: 1.5; color: black; background: white; width: 100%; height: 100%; box-sizing: border-box; word-break: break-word;">${result.value}</div>`
             }]);
             setPageCount(1);
             setActivePageIndex(0);
           } catch(e) {
             console.error("DOCX Parse error", e);
             setPrintPreviewUrl(null);
             setCanvasItems([{
                id: `docx-error-${Date.now()}`,
                x: 0,
                y: 0,
                width: 794,
                height: 1123,
                pageIndex: 0,
                rawHtml: `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; background: #FFF1F2; border: 2px dashed #FECACA; color: #991B1B; padding: 40px; text-align: center;">
                  <h3 style="margin: 0 0 10px 0;">DOCX Render Error</h3>
                  <p style="font-size: 14px; margin: 0;">We couldn't render this Word document. Please ensure it is not password protected or corrupted.</p>
                </div>`
             }]);
             setPageCount(1);
             setActivePageIndex(0);
           }
        } else {
            // Native Mode / Unknown format - Still open the editor with a placeholder
            setPrintPreviewUrl(null);
            setCanvasItems([{
               id: `unknown-${Date.now()}`,
               x: 50,
               y: 50,
               width: 300,
               height: 400,
               pageIndex: 0,
               rawHtml: `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; background: #F8FAFC; border: 2px dashed #E2E8F0; border-radius: 12px; color: #64748B; font-family: sans-serif; gap: 12px; padding: 20px; text-align: center;">
                 <div style="background: white; border-radius: 50%; padding: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                 </div>
                 <div style="font-weight: 700; color: #1E293B;">Universal Print Container</div>
                 <div style="font-size: 12px; line-height: 1.4;">${job.file_name}<br/>Format: ${ext.toUpperCase() || 'RAW'}</div>
                 <div style="font-size: 10px; opacity: 0.7;">Native rendering not supported. Print as a placeholder or add items.</div>
               </div>`
            }]);
            setPageCount(1);
            setActivePageIndex(0);
         }
      }
    } catch (error: any) {
      console.error("Payload decryption failed:", error);
      alert("Execution failed to decrypt: " + error.message);
      setActivePrintJob(null);
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleDeleteJob = async (job: Job) => {
      setIsDeleting(true);
      try {
        // 1. Remove from Storage
        if (job.file_path) {
          const { error: storageError } = await supabase.storage
            .from('documents')
            .remove([job.file_path]);
          
          // Ignore 404/Object not found - goal is cleanup
          if (storageError && !storageError.message.includes("Object not found")) {
            console.warn("Storage cleanup warning:", storageError.message);
          }
        }
        
        // 2. Remove from DB
        const { error } = await supabase
          .from('jobs')
          .delete()
          .eq('id', job.id);

        if (error) throw error;
        
        setJobs(jobs.filter(j => j.id !== job.id));
        setDeleteConfirmJob(null);
      } catch (error: any) {
        console.error("Deletion protocol failed:", error);
        alert("Purge failed: " + error.message);
      } finally {
        setIsDeleting(false);
      }
   };

  const executeCanvasPrint = async () => {
    if (!activePrintJob) return;
    
    const imgWindow = window.open("", "_blank");
    if (imgWindow) {
      let pagesHtml = '';
      
      for (let p = 0; p < pageCount; p++) {
        let imagesHtml = '';
        const pageItems = canvasItems.filter(i => i.pageIndex === p);
        
        pageItems.forEach(item => {
          const leftMm = (item.x / 794) * 210;
          const topMm = (item.y / 1123) * 297;
          const widthMm = (item.width / 794) * 210;
          const heightMm = (item.height / 1123) * 297;
          const filterCss = item.isGrayscale ? 'filter: grayscale(100%);' : '';
          const zIndexCss = `z-index: ${item.zIndex || 0};`;
          
          if (item.rawHtml) {
             imagesHtml += `<div style="position: absolute; left: ${leftMm}mm; top: ${topMm}mm; width: ${widthMm}mm; height: ${heightMm}mm; ${filterCss} ${zIndexCss}">${item.rawHtml}</div>`;
          } else {
             const src = item.payloadUrl || "";
             imagesHtml += `<img src="${src}" style="position: absolute; left: ${leftMm}mm; top: ${topMm}mm; width: ${widthMm}mm; height: ${heightMm}mm; object-fit: contain; ${filterCss} ${zIndexCss}" />`;
          }
        });

        // Compact HTML to avoid whitespace nodes triggering extra page breaks
        pagesHtml += `<div class="print-page-container" style="width: 210mm; height: 297mm; position: relative; background: white; overflow: hidden; margin: 0; box-sizing: border-box;">${imagesHtml}</div>`;
      }

      imgWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>XeroxQ Protocol | ${activePrintJob.file_name}</title>
            <style>
              * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              @page { margin: 0; size: A4; }
              html, body { margin: 0; padding: 0; background: #fff; width: 210mm; height: 297mm; }
              .print-page-container { 
                width: 210mm; 
                height: 297mm; 
                page-break-after: always; 
                break-after: page;
                margin: 0;
                padding: 0;
                position: relative;
                display: block;
                overflow: hidden;
              }
              .print-page-container:last-child { page-break-after: auto; break-after: auto; }
              @media screen {
                body { background: #f0f0f0; display: flex; flex-direction: column; align-items: center; padding: 40px 0; height: auto; }
                .print-page-container { margin-bottom: 20px; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
              }
            </style>
          </head>
          <body>
            ${pagesHtml}
            <script>
              // Ensure all images are loaded before printing
              window.onload = () => {
                setTimeout(() => { 
                  window.print(); 
                  window.close(); 
                }, 1000);
              };
            </script>
          </body>
        </html>
      `);
      imgWindow.document.close();
    }
    
    setActivePrintJob(null);
    setPrintPreviewUrl(null);
  };
  
  const handleDownload = async (job: Job) => {
    try {
      setActiveDownloadId(job.id);
      const cleanCustomer = (job.customer_name || "ANONYMOUS").replace(/[^a-z0-9]/gi, '_');
      const fileName = job.file_name || "document.pdf";
      const ext = fileName.split('.').pop() || 'file';
      const downloadFilename = `${cleanCustomer}.${ext}`;

      // 1. Generate Secure Signed URL with Forced Download Attachment Header
      const { data, error } = await supabase.storage
        .from("documents")
        .createSignedUrl(job.file_path, 60 * 5, { 
          download: downloadFilename 
        });
      
      if (error) {
        if ((error as any).status === 404 || error.message?.includes('Object not found')) {
           setPurgedJob(job);
           return;
        }
        throw error;
      }
      
      if (!data?.signedUrl) throw new Error("No signal URL generated");

      // 2. Direct Window Assignment for System Prompt
      const link = document.createElement("a");
      link.href = data.signedUrl;
      link.download = downloadFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error: any) {
      console.error("Downlink Protocol Failure:", error);
      alert("Downlink Failed: " + (error.message || "Unknown signal error"));
    } finally {
      // 3. Micro-animation delay for UX stability
      setTimeout(() => setActiveDownloadId(null), 800);
    }
  };
  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const ratio = img.width / img.height;
        const width = 400;
        const height = width / ratio;
        
        setCanvasItems(prev => [
          ...prev, 
          { 
            id: `img-${Date.now()}`, 
            x: (794 - width) / 2, 
            y: 100, 
            width, 
            height, 
            pageIndex: activePageIndex,
            payloadUrl: dataUrl
          }
        ]);
      };
    };
    reader.readAsDataURL(file);
    // Clear input so same file can be added again
    e.target.value = '';
  };

  const saveCanvasAsImage = async () => {
    setIsCompositing(true);
    try {
      if (pageCount === 1) {
        // Single Page Mode: Download as high-res PNG
        const a4Container = document.querySelector("#a4-page-0");
        if (!a4Container) return;
        
        const origOpacity = (a4Container as HTMLElement).style.opacity;
        (a4Container as HTMLElement).style.opacity = '1';
        
        const canvas = await html2canvas(a4Container as HTMLElement, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
        });
        
        (a4Container as HTMLElement).style.opacity = origOpacity;
        
        const link = document.createElement("a");
        link.href = canvas.toDataURL('image/png');
        link.download = `Composited_${activePrintJob?.file_name || "Document"}.png`;
        link.click();
      } else {
        // Multi-Page Mode: Download as bundled PDF
        const { jsPDF } = await import("jspdf");
        const pdf = new jsPDF("p", "mm", "a4");
        
        for (let i = 0; i < pageCount; i++) {
          const a4Container = document.querySelector(`#a4-page-${i}`);
          if (!a4Container) continue;
          
          const origOpacity = (a4Container as HTMLElement).style.opacity;
          (a4Container as HTMLElement).style.opacity = '1';
          
          const canvas = await html2canvas(a4Container as HTMLElement, {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff"
          });
          
          (a4Container as HTMLElement).style.opacity = origOpacity;
          
          const imgData = canvas.toDataURL('image/png', 1.0);
          if (i > 0) pdf.addPage();
          // A4 dimensions in mm: 210 x 297
          pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
        }
        
        pdf.save(`Composited_Document_${activePrintJob?.file_name || "Document"}.pdf`);
      }
    } catch (e) {
      console.error(e);
      alert("Composited export failed: " + (e as any).message);
    } finally {
      setIsCompositing(false);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingSettings(true);
    const { error } = await supabase
      .from("shops")
      .update({
        upi_id: shop?.upi_id,
        price_mono: shop?.price_mono,
        price_color: shop?.price_color,
        is_open: shop?.is_open
      })
      .eq("id", shop?.id);
    
    if (error) alert("Sync failed: " + error.message);
    else setShowingSettings(false);
    setUpdatingSettings(false);
  };

  const handleFlushQueue = async () => {
    if (!shop || !confirm("CRITICAL: Flush entire terminal queue? All records and files will be permanently purged, yaar.")) return;
    
    setUpdatingSettings(true);
    try {
      // 1. List all files for this shop (we'll just clear the bucket for these jobs)
      const filePaths = jobs.map(j => j.file_path).filter(Boolean);
      if (filePaths.length > 0) {
        await supabase.storage.from('documents').remove(filePaths);
      }
      
      // 2. Delete all records for this shop
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('shop_id', shop.id);
        
      if (error) throw error;
      
      setJobs([]);
      setShowingSettings(false);
    } catch (error) {
      console.error("Flush failure:", error);
    } finally {
      setUpdatingSettings(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const filteredJobs = jobs.filter(job => 
    job.token.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (job.customer_name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const qrUrl = typeof window !== "undefined" ? `${window.location.origin}/${shop?.slug}` : "";
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrUrl)}&color=0-0-0&bgcolor=255-255-255&margin=10`;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        {/* Skeleton Header */}
        <div className="w-full bg-white border-b border-[#E2E8F0]">
          <div className="max-w-[1440px] mx-auto px-6 py-4 lg:px-[82px] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-[40px] h-[40px] rounded-[5.57px]" />
              <div className="flex flex-col gap-2">
                <Skeleton className="w-[140px] h-[20px]" />
                <Skeleton className="w-[90px] h-[12px]" />
              </div>
            </div>
            <div className="flex gap-3">
              <Skeleton className="w-[80px] h-[36px] rounded-[5.57px]" />
              <Skeleton className="w-[60px] h-[36px] rounded-[5.57px]" />
              <div className="h-[20px] w-[1px] bg-[#E2E8F0] mx-1" />
              <Skeleton className="w-[80px] h-[36px] rounded-[5.57px]" />
            </div>
          </div>
        </div>

        {/* Skeleton Subheader */}
        <div className="w-full bg-[#F8FAFC]">
          <div className="max-w-[1440px] mx-auto px-6 pt-6 pb-4 lg:px-[82px] flex items-center justify-between">
             <Skeleton className="w-[150px] h-[28px]" />
             <div className="flex gap-2">
                <Skeleton className="w-[200px] h-[36px] rounded-[5.57px]" />
                <Skeleton className="w-[36px] h-[36px] rounded-[5.57px]" />
             </div>
          </div>
        </div>

        {/* Skeleton Main Grid */}
        <main className="max-w-[1440px] mx-auto px-6 lg:px-[82px] mt-2 flex flex-col h-[calc(100vh-180px)]">
           <div className="flex-1 bg-white border border-[#E2E8F0] rounded-[5.57px] overflow-hidden shadow-sm flex flex-col">
              <div className="p-0 flex-1 overflow-hidden">
                 <div className="divide-y divide-[#E2E8F0]">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="flex items-center gap-6 px-6 py-6">
                         <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                         <div className="flex-1 space-y-2">
                            <Skeleton className="w-[30%] h-4" />
                            <Skeleton className="w-[20%] h-3" />
                         </div>
                         <Skeleton className="w-[10%] h-6 rounded-lg" />
                         <Skeleton className="w-[15%] h-8 rounded-lg" />
                         <Skeleton className="w-[15%] h-8 rounded-lg" />
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </main>
      </div>
    );
  }

  // --- STATE 1: INITIALIZE SHOP (Split-Screen) ---
  if (!shop) {
    return (
      <div className="flex w-full h-screen bg-white overflow-hidden relative">
        {/* Left Side (Form) */}
        <div className="w-full lg:w-[630px] h-full flex flex-col justify-center px-8 lg:px-[82px] pl-8 lg:pl-[180px] shrink-0 relative z-10 bg-white items-center lg:items-start">
          <form onSubmit={handleCreateShop} className="flex flex-col gap-[31.54px] w-full max-w-[378px]">
            <div className="flex flex-col gap-[1.75px] mb-4 text-center lg:text-left">
              <h1 className="text-[40px] lg:text-[42.06px] leading-[1.2] font-bold text-black whitespace-nowrap">
                Setup<br /> Your Shop
              </h1>
              <p className="text-[14px] lg:text-[14.02px] font-medium text-auth-slate-50 tracking-[0.01em]">
                Connect your shop to the network.
              </p>
            </div>

            <div className="flex flex-col gap-[16.72px]">
              <div className="flex flex-col gap-[5.57px]">
                <label className="text-[14.02px] font-bold tracking-[0.02em] text-auth-slate-90">Shop Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="Your Shop Name"
                  className="auth-input w-full h-[46.79px]"
                  value={newShopData.name}
                  onChange={(e) => setNewShopData({ ...newShopData, name: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-[5.57px]">
                <label className="text-[14.02px] font-bold tracking-[0.02em] text-auth-slate-90">Shop Link</label>
                <input 
                  type="text" 
                  required
                  placeholder="unique-slug"
                  className="auth-input w-full h-[46.79px] font-mono"
                  value={newShopData.slug}
                  onChange={(e) => setNewShopData({ ...newShopData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                />
              </div>
              <div className="flex flex-col gap-[5.57px]">
                <label className="text-[14.02px] font-bold tracking-[0.02em] text-auth-slate-90">UPI Merchant ID</label>
                <input 
                  type="text" 
                  required
                  placeholder="shop@upi"
                  className="auth-input w-full h-[46.79px] font-mono"
                  value={newShopData.upi_id}
                  onChange={(e) => setNewShopData({ ...newShopData, upi_id: e.target.value })}
                />
              </div>
            </div>

            <button 
              disabled={creatingShop}
              className="w-full h-[42.03px] btn-auth-primary text-[14.02px] tracking-tight mt-2"
            >
              {creatingShop ? "Connecting..." : "Create Shop"}
            </button>

            <button 
              type="button"
              onClick={handleLogout} 
              className="mt-6 text-[12.27px] font-bold text-auth-slate-50 tracking-[0.01em] text-center w-full hover:text-black transition-colors"
            >
              Signing Out? <span className="text-black ml-1">Logout</span>
            </button>
          </form>
        </div>

        {/* Right Side (Image Gradient overlay) */}
        <div className="hidden lg:block flex-1 relative h-full">
          <div className="absolute w-[265px] h-full left-[-135px] top-0 bg-gradient-to-l from-white/0 to-white z-10" />
          <div className="absolute w-[265px] h-full left-[-135px] top-0 bg-gradient-to-l from-white/0 to-white z-20" />
          <div className="absolute w-[265px] h-full left-[-151px] top-0 bg-gradient-to-l from-white/0 via-white/40 to-white z-30" />
          <div 
            className="absolute inset-0 w-full h-full bg-cover bg-center"
            style={{ backgroundImage: "url('/login-image.png')" }}
          />
        </div>
      </div>
    );
  }

  // --- STATE 2: ACTIVE DASHBOARD (Top-Header Paradigm) ---
  return (
    <div className="flex flex-col w-full h-screen overflow-hidden bg-[#F8FAFC] relative text-black">
      {/* IMAGE CANVAs EDITOR */}
      {activePrintJob && printPreviewUrl && (
        <div className="fixed inset-0 z-40 bg-[#0A0A0A] flex flex-col md:flex-row overflow-hidden font-sans">
          
          {/* ===== MOBILE-ONLY COMPACT TOOLBAR ===== */}
          <div className="flex md:hidden bg-white border-b border-[#E2E8F0] flex-col z-20 shrink-0">
            {/* Row 1: Title + Quick Actions */}
            <div className="flex items-center justify-between px-3 py-[14px] border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-black rounded-[6px] flex items-center justify-center shrink-0">
                  <MousePointer2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-[14px] font-bold text-black tracking-tight leading-none">Canvas Editor</h2>
                  <p className="text-[8px] font-bold text-auth-slate-50 uppercase tracking-widest mt-1">A4 Print Composer</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <input type="file" ref={addImageInputRef} onChange={handleAddImage} accept="image/*" className="hidden" />
                {/* Download Dialog - mobile */}
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="w-8 h-8 flex items-center justify-center hover:bg-[#E2E8F0] rounded transition-colors text-black" title="Download">
                      {isCompositing ? <div className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] bg-white text-black border-none shadow-2xl rounded-[32px]">
                    <DialogHeader>
                      <DialogTitle>Download Asset</DialogTitle>
                      <DialogDescription>Select your preferred download protocol.</DialogDescription>
                    </DialogHeader>
                    {isCompositing ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <div className="w-10 h-10 border-4 border-black/10 border-t-black rounded-full animate-spin" />
                        <div className="text-center">
                          <p className="text-[14px] font-bold text-black">Generating Protocol...</p>
                          <p className="text-[11px] text-auth-slate-50 mt-1 uppercase tracking-widest font-bold">Bundling {pageCount} {pageCount > 1 ? 'Pages' : 'Page'}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-3 py-4">
                        <button onClick={saveCanvasAsImage} className="flex items-center justify-between p-4 rounded-2xl border border-[#E2E8F0] hover:border-black hover:bg-black/5 transition-all group">
                          <div className="text-left flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#F8FAFC] rounded-xl flex items-center justify-center group-hover:bg-white transition-colors"><Palette className="w-5 h-5" /></div>
                            <div>
                              <p className="font-bold text-[14px] text-black">Composited {pageCount > 1 ? 'PDF' : 'Image'}</p>
                              <p className="text-[11px] text-auth-slate-50 uppercase tracking-widest font-bold">Includes All Edits</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </button>
                        <button onClick={() => activePrintJob && handleDownload(activePrintJob)} className="flex items-center justify-between p-4 rounded-2xl border border-[#E2E8F0] hover:border-black hover:bg-black/5 transition-all group">
                          <div className="text-left flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#F8FAFC] rounded-xl flex items-center justify-center group-hover:bg-white transition-colors"><FileText className="w-5 h-5" /></div>
                            <div>
                              <p className="font-bold text-[14px] text-black">Raw Document</p>
                              <p className="text-[11px] text-auth-slate-50 uppercase tracking-widest font-bold">Original Submission</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </button>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
                {/* Exit */}
                <button
                  onClick={() => { setActivePrintJob(null); setPrintPreviewUrl(null); setSelectedCanvasIds([]); }}
                  className="w-8 h-8 flex items-center justify-center hover:bg-red-50 rounded transition-colors"
                  title="Exit Session"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>

            {/* Row 2 & 3: 2-row × 6-col tool grid — zero scroll, all visible */}
            <div className="grid grid-cols-6 gap-1 px-2 py-2">
              {/* --- ROW A: Composition Tools --- */}
              <button onClick={() => { const img = new Image(); img.src = printPreviewUrl!; img.onload = () => { const r=img.width/img.height; const nw=300; setCanvasItems([...canvasItems,{id:`img-${Date.now()}`,x:50,y:50,width:nw,height:nw/r,pageIndex:activePageIndex}]); }; }}
                className="flex flex-col items-center justify-center gap-0.5 h-[52px] border border-black rounded-[8px] text-black bg-white hover:bg-black/5 active:scale-95 transition-all" title="Add Image Instance">
                <Maximize className="w-[14px] h-[14px]" />
                <span className="text-[6.5px] font-black uppercase tracking-tight leading-none text-center">Add Img</span>
              </button>
              <button onClick={() => { const o=canvasItems.find(i=>i.id===selectedCanvasIds[0]); if(o) setCanvasItems([...canvasItems,{...o,id:`img-${Date.now()}`,x:o.x+20,y:o.y+20}]); }}
                disabled={selectedCanvasIds.length===0}
                className="flex flex-col items-center justify-center gap-0.5 h-[52px] border border-[#E2E8F0] rounded-[8px] text-black bg-white hover:bg-[#F8FAFC] active:scale-95 transition-all disabled:opacity-40" title="Duplicate">
                <Copy className="w-[14px] h-[14px]" />
                <span className="text-[6.5px] font-black uppercase tracking-tight leading-none">Dup</span>
              </button>
              <button disabled={selectedCanvasIds.length===0}
                onClick={() => setCanvasItems(items=>items.map(i=>selectedCanvasIds.includes(i.id)?{...i,width:Math.round(i.width*1.1),height:Math.round(i.height*1.1)}:i))}
                className="flex flex-col items-center justify-center gap-0.5 h-[52px] border border-[#E2E8F0] rounded-[8px] text-black bg-white hover:bg-[#F8FAFC] active:scale-95 transition-all disabled:opacity-40" title="Scale Up">
                <Plus className="w-[14px] h-[14px]" />
                <span className="text-[6.5px] font-black uppercase tracking-tight leading-none">Scale+</span>
              </button>
              <button disabled={selectedCanvasIds.length===0}
                onClick={() => setCanvasItems(items=>items.map(i=>selectedCanvasIds.includes(i.id)?{...i,width:Math.round(i.width*0.9),height:Math.round(i.height*0.9)}:i))}
                className="flex flex-col items-center justify-center gap-0.5 h-[52px] border border-[#E2E8F0] rounded-[8px] text-black bg-white hover:bg-[#F8FAFC] active:scale-95 transition-all disabled:opacity-40" title="Scale Down">
                <Minus className="w-[14px] h-[14px]" />
                <span className="text-[6.5px] font-black uppercase tracking-tight leading-none">Scale-</span>
              </button>
              <button disabled={selectedCanvasIds.length===0}
                onClick={() => setCanvasItems(items=>items.map(i=>selectedCanvasIds.includes(i.id)?{...i,zIndex:(i.zIndex||0)+1}:i))}
                className="flex flex-col items-center justify-center gap-0.5 h-[52px] border border-[#E2E8F0] rounded-[8px] text-black bg-white hover:bg-[#F8FAFC] active:scale-95 transition-all disabled:opacity-40" title="Bring Forward">
                <ArrowUpToLine className="w-[14px] h-[14px]" />
                <span className="text-[6.5px] font-black uppercase tracking-tight leading-none">Fwd</span>
              </button>
              <button disabled={selectedCanvasIds.length===0}
                onClick={() => setCanvasItems(items=>items.map(i=>selectedCanvasIds.includes(i.id)?{...i,zIndex:(i.zIndex||0)-1}:i))}
                className="flex flex-col items-center justify-center gap-0.5 h-[52px] border border-[#E2E8F0] rounded-[8px] text-black bg-white hover:bg-[#F8FAFC] active:scale-95 transition-all disabled:opacity-40" title="Send Back">
                <ArrowDownToLine className="w-[14px] h-[14px]" />
                <span className="text-[6.5px] font-black uppercase tracking-tight leading-none">Back</span>
              </button>

              {/* --- ROW B: Edit & Page Tools --- */}
              <button disabled={selectedCanvasIds.length===0}
                onClick={() => setCanvasItems(items=>items.map(i=>selectedCanvasIds.includes(i.id)?{...i,isGrayscale:!i.isGrayscale}:i))}
                className="flex flex-col items-center justify-center gap-0.5 h-[52px] border border-[#E2E8F0] rounded-[8px] text-black bg-white hover:bg-[#F8FAFC] active:scale-95 transition-all disabled:opacity-40" title="Toggle B&W">
                <Palette className="w-[14px] h-[14px]" />
                <span className="text-[6.5px] font-black uppercase tracking-tight leading-none">B&W</span>
              </button>
              <button disabled={selectedCanvasIds.length===0}
                onClick={() => setCroppingItemId(selectedCanvasIds[0])}
                className="flex flex-col items-center justify-center gap-0.5 h-[52px] border border-[#E2E8F0] rounded-[8px] text-black bg-white hover:bg-[#F8FAFC] active:scale-95 transition-all disabled:opacity-40" title="Crop">
                <Crop className="w-[14px] h-[14px]" />
                <span className="text-[6.5px] font-black uppercase tracking-tight leading-none">Crop</span>
              </button>
              <button onClick={() => { setCanvasItems(canvasItems.filter(i=>!selectedCanvasIds.includes(i.id))); setSelectedCanvasIds([]); }}
                disabled={selectedCanvasIds.length===0}
                className="flex flex-col items-center justify-center gap-0.5 h-[52px] border border-red-200 bg-red-50 rounded-[8px] text-red-600 hover:bg-red-100 active:scale-95 transition-all disabled:opacity-40" title="Delete Selected">
                <Trash2 className="w-[14px] h-[14px]" />
                <span className="text-[6.5px] font-black uppercase tracking-tight leading-none">Delete</span>
              </button>
              <button onClick={() => setIsGridSnapped(!isGridSnapped)}
                className={`flex flex-col items-center justify-center gap-0.5 h-[52px] border rounded-[8px] active:scale-95 transition-all ${isGridSnapped ? 'border-[#FF591E] bg-[#FF591E]/10 text-[#FF591E]' : 'border-[#E2E8F0] text-black bg-white hover:bg-[#F8FAFC]'}`}
                title="Snap to Grid">
                <Grid className="w-[14px] h-[14px]" />
                <span className="text-[6.5px] font-black uppercase tracking-tight leading-none">{isGridSnapped ? 'Snap On' : 'Snap Off'}</span>
              </button>
              <button onClick={() => { setPageCount(prev=>prev+1); setActivePageIndex(pageCount); }}
                className="flex flex-col items-center justify-center gap-0.5 h-[52px] bg-black text-white rounded-[8px] hover:bg-black/90 active:scale-95 transition-all shadow-sm" title="Add Page">
                <Plus className="w-[14px] h-[14px]" />
                <span className="text-[6.5px] font-black uppercase tracking-tight leading-none">Add Pg</span>
              </button>
              <button onClick={() => { setCanvasItems(items=>items.filter(i=>i.pageIndex!==pageCount-1)); setPageCount(prev=>Math.max(1,prev-1)); if(activePageIndex>=pageCount-1) setActivePageIndex(Math.max(0,pageCount-2)); }}
                disabled={pageCount<=1}
                className="flex flex-col items-center justify-center gap-0.5 h-[52px] border border-red-200 bg-red-50 text-red-600 rounded-[8px] hover:bg-red-100 active:scale-95 transition-all disabled:opacity-40" title="Remove Last Page">
                <Minus className="w-[14px] h-[14px]" />
                <span className="text-[6.5px] font-black uppercase tracking-tight leading-none">Rem Pg</span>
              </button>
            </div>

            {/* Row 4: Transmit Action */}
            <div className="px-2 pb-2.5">
              <button onClick={executeCanvasPrint}
                className="w-full h-10 btn-primary-gradient text-white font-bold text-[12px] rounded-[8px] flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98] transition-all">
                <Zap className="w-3.5 h-3.5" /> Transmit to Printer
              </button>
            </div>
          </div>

          {/* ===== DESKTOP-ONLY SIDEBAR (unchanged) ===== */}
          <div className="hidden md:flex w-[320px] bg-white border-r border-[#E2E8F0] shadow-2xl flex-col z-20 shrink-0">
             <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <div className="flex items-center justify-between mb-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-black rounded flex items-center justify-center shrink-0">
                      <MousePointer2 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-[17px] font-bold text-black tracking-tight leading-none">Canvas Editor</h2>
                      <p className="text-[9px] font-bold text-auth-slate-50 uppercase tracking-widest mt-1">A4 Print Composer</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <input type="file" ref={addImageInputRef} onChange={handleAddImage} accept="image/*" className="hidden" />
                    <button onClick={() => addImageInputRef.current?.click()} className="w-8 h-8 flex items-center justify-center hover:bg-[#E2E8F0] rounded transition-colors text-black" title="Add Image">
                      <Plus className="w-4 h-4" />
                    </button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="w-8 h-8 flex items-center justify-center hover:bg-[#E2E8F0] rounded transition-colors text-black" title="Download Asset">
                          {isCompositing ? <div className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
                        </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px] bg-white text-black border-none shadow-2xl rounded-[32px]">
                         <DialogHeader>
                           <DialogTitle>Download Asset</DialogTitle>
                           <DialogDescription>Select your preferred download protocol.</DialogDescription>
                         </DialogHeader>
                         {isCompositing ? (
                           <div className="flex flex-col items-center justify-center py-12 gap-4">
                              <div className="w-10 h-10 border-4 border-black/10 border-t-black rounded-full animate-spin" />
                              <div className="text-center">
                                <p className="text-[14px] font-bold text-black">Generating Protocol...</p>
                                <p className="text-[11px] text-auth-slate-50 mt-1 uppercase tracking-widest font-bold">Bundling {pageCount} {pageCount > 1 ? 'Pages' : 'Page'}</p>
                              </div>
                           </div>
                         ) : (
                           <div className="grid gap-3 py-4">
                              <button onClick={saveCanvasAsImage} className="flex items-center justify-between p-4 rounded-2xl border border-[#E2E8F0] hover:border-black hover:bg-black/5 transition-all group">
                                <div className="text-left flex items-center gap-4">
                                  <div className="w-10 h-10 bg-[#F8FAFC] rounded-xl flex items-center justify-center group-hover:bg-white transition-colors"><Palette className="w-5 h-5" /></div>
                                  <div>
                                    <p className="font-bold text-[14px] text-black">Composited {pageCount > 1 ? 'PDF' : 'Image'}</p>
                                    <p className="text-[11px] text-auth-slate-50 uppercase tracking-widest font-bold">Includes All Edits</p>
                                  </div>
                                </div>
                                <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                              </button>
                              <button onClick={() => activePrintJob && handleDownload(activePrintJob)} className="flex items-center justify-between p-4 rounded-2xl border border-[#E2E8F0] hover:border-black hover:bg-black/5 transition-all group">
                                <div className="text-left flex items-center gap-4">
                                  <div className="w-10 h-10 bg-[#F8FAFC] rounded-xl flex items-center justify-center group-hover:bg-white transition-colors"><FileText className="w-5 h-5" /></div>
                                  <div>
                                    <p className="font-bold text-[14px] text-black">Raw Document</p>
                                    <p className="text-[11px] text-auth-slate-50 uppercase tracking-widest font-bold">Original Submission</p>
                                  </div>
                                </div>
                                <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                              </button>
                           </div>
                         )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
             </div>

             <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-6">
                <div>
                  <h3 className="text-[12px] font-bold text-auth-slate-50 uppercase tracking-[0.1em] mb-3">Composition Tools</h3>
                  <div className="grid grid-cols-2 gap-2">
                     <button onClick={() => { const img = new Image(); img.src = printPreviewUrl!; img.onload = () => { const ratio = img.width / img.height; const nw = 300; const nh = nw / ratio; setCanvasItems([...canvasItems, { id: `img-${Date.now()}`, x: 50, y: 50, width: nw, height: nh, pageIndex: activePageIndex }]); }; }} className="col-span-2 h-[36px] border border-black rounded flex items-center justify-center gap-2 text-[12px] font-bold text-black hover:bg-black/5 hover:scale-[1.01] transition-all">
                       <Maximize className="w-4 h-4" /> Add Image Instance
                     </button>
                     <button onClick={() => { const original = canvasItems.find(i => i.id === selectedCanvasIds[0]); if(original) setCanvasItems([...canvasItems, { ...original, id: `img-${Date.now()}`, x: original.x + 20, y: original.y + 20 }]); }} disabled={selectedCanvasIds.length === 0} className="col-span-2 h-[36px] border border-[#E2E8F0] rounded flex items-center justify-center gap-2 text-[12px] font-bold text-black hover:bg-[#F8FAFC] transition-colors disabled:opacity-50">
                       <Copy className="w-4 h-4" /> Duplicate Selected
                     </button>
                     <button disabled={selectedCanvasIds.length === 0} onClick={() => setCanvasItems(items => items.map(i => selectedCanvasIds.includes(i.id) ? { ...i, width: Math.round(i.width * 1.1), height: Math.round(i.height * 1.1) } : i))} className="h-[36px] border border-[#E2E8F0] rounded flex items-center justify-center gap-1 text-[11px] font-bold text-black hover:bg-[#F8FAFC] transition-colors disabled:opacity-50">
                        <Plus className="w-3 h-3" /> Scale Up
                     </button>
                     <button disabled={selectedCanvasIds.length === 0} onClick={() => setCanvasItems(items => items.map(i => selectedCanvasIds.includes(i.id) ? { ...i, width: Math.round(i.width * 0.9), height: Math.round(i.height * 0.9) } : i))} className="h-[36px] border border-[#E2E8F0] rounded flex items-center justify-center gap-1 text-[11px] font-bold text-black hover:bg-[#F8FAFC] transition-colors disabled:opacity-50">
                        <Minus className="w-3 h-3" /> Scale Down
                     </button>
                     <button disabled={selectedCanvasIds.length === 0} onClick={() => setCanvasItems(items => items.map(i => selectedCanvasIds.includes(i.id) ? { ...i, zIndex: (i.zIndex || 0) + 1 } : i))} className="h-[36px] border border-[#E2E8F0] rounded flex items-center justify-center gap-1 text-[11px] font-bold text-black hover:bg-[#F8FAFC] transition-colors disabled:opacity-50">
                        <ArrowUpToLine className="w-3 h-3" /> Fwd
                     </button>
                     <button disabled={selectedCanvasIds.length === 0} onClick={() => setCanvasItems(items => items.map(i => selectedCanvasIds.includes(i.id) ? { ...i, zIndex: (i.zIndex || 0) - 1 } : i))} className="h-[36px] border border-[#E2E8F0] rounded flex items-center justify-center gap-1 text-[11px] font-bold text-black hover:bg-[#F8FAFC] transition-colors disabled:opacity-50">
                        <ArrowDownToLine className="w-3 h-3" /> Back
                     </button>
                     <button disabled={selectedCanvasIds.length === 0} onClick={() => setCanvasItems(items => items.map(i => selectedCanvasIds.includes(i.id) ? { ...i, isGrayscale: !i.isGrayscale } : i))} className="col-span-2 h-[36px] border border-[#E2E8F0] rounded flex items-center justify-center gap-2 text-[12px] font-bold text-black hover:bg-[#F8FAFC] transition-colors disabled:opacity-50">
                       <Palette className="w-3 h-3" /> Toggle B&W (Grayscale)
                     </button>
                     <button disabled={selectedCanvasIds.length === 0} onClick={() => setCroppingItemId(selectedCanvasIds[0])} className="col-span-2 h-[36px] border border-[#E2E8F0] rounded flex items-center justify-center gap-2 text-[12px] font-bold text-black hover:bg-[#F8FAFC] transition-colors disabled:opacity-50">
                       <Crop className="w-3 h-3" /> Crop Selected
                     </button>
                     <button onClick={() => { setCanvasItems(canvasItems.filter(i => !selectedCanvasIds.includes(i.id))); setSelectedCanvasIds([]); }} disabled={selectedCanvasIds.length === 0} className="col-span-2 h-[36px] border border-red-200 bg-red-50 text-red-600 rounded flex items-center justify-center gap-2 text-[12px] font-bold hover:bg-red-100 transition-colors disabled:opacity-50">
                       <Trash2 className="w-3 h-3" /> Delete Selected
                     </button>
                  </div>
                </div>

                <div>
                   <h3 className="text-[12px] font-bold text-auth-slate-50 uppercase tracking-[0.1em] mb-2 mt-2">Page Layout</h3>
                   <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setIsGridSnapped(!isGridSnapped)} className={`col-span-2 h-[36px] border ${isGridSnapped ? 'border-[#FF591E] bg-[#FF591E]/10 text-[#FF591E]' : 'border-[#E2E8F0] bg-white text-black'} rounded flex items-center justify-center gap-2 text-[12px] font-bold transition-all`}>
                         <Grid className="w-3 h-3" /> {isGridSnapped ? "Snap to Grid: ON" : "Snap to Grid: OFF"}
                      </button>
                      <button onClick={() => { setPageCount(prev => prev + 1); setActivePageIndex(pageCount); }} className="h-[36px] bg-black text-white rounded flex items-center justify-center gap-2 text-[11px] font-bold hover:bg-black/90 transition-all shadow-lg shadow-black/20">
                         <Plus className="w-3 h-3" /> Add Page
                      </button>
                      <button onClick={() => { setCanvasItems(items => items.filter(i => i.pageIndex !== pageCount - 1)); setPageCount(prev => Math.max(1, prev - 1)); if(activePageIndex >= pageCount - 1) setActivePageIndex(Math.max(0, pageCount - 2)); }} disabled={pageCount <= 1} className="h-[36px] text-red-600 border border-red-200 bg-red-50 text-[11px] font-bold hover:bg-red-100 rounded flex items-center justify-center transition-colors disabled:opacity-50">
                         Remove Last
                      </button>
                   </div>
                </div>

                <div className="mt-auto">
                  <button onClick={() => { setActivePrintJob(null); setPrintPreviewUrl(null); setSelectedCanvasIds([]); }} className="w-full h-[44px] bg-white border border-[#E2E8F0] text-black font-bold text-[13px] rounded mb-3 hover:bg-[#F8FAFC] transition-colors flex items-center justify-center gap-2">
                    <LogOut className="w-4 h-4 text-red-500" /> Exit Session
                  </button>
                  <button onClick={executeCanvasPrint} className="w-full h-[50px] btn-primary-gradient text-white font-bold text-[14px] rounded shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                    <Zap className="w-[16px] h-[16px]" /> Transmit to Printer
                  </button>
                </div>
             </div>
          </div>

           {/* Canvas Work Area */}
           <div 
             ref={scrollContainerRef}
             className={`flex-1 relative overflow-auto bg-[#0A0B0D] ${isSpacePressed ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`}
             style={{
               backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
               backgroundSize: '40px 40px'
             }}
             onMouseDown={(e) => {
               if (isSpacePressed || e.button === 1) {
                 e.preventDefault();
                 setIsPanning(true);
               } else if (e.target === e.currentTarget || (e.target as HTMLElement).id === "canvas-scale-container") {
                 setSelectedCanvasIds([]);
               }
             }}
             onMouseMove={(e) => {
               if (isPanning && scrollContainerRef.current) {
                 scrollContainerRef.current.scrollLeft -= e.movementX;
                 scrollContainerRef.current.scrollTop -= e.movementY;
               }
             }}
             onMouseUp={() => setIsPanning(false)}
             onMouseLeave={() => setIsPanning(false)}
           >
               {/* Zoom Overlay Controls */}
               <div className="fixed bottom-4 left-1/2 -translate-x-1/2 md:bottom-8 md:left-auto md:right-8 md:translate-x-0 flex items-center gap-1 bg-[#1A1D23]/90 backdrop-blur-md border border-white/10 p-1 md:p-1.5 rounded-full shadow-2xl z-[100]">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setCanvasZoom(z => Math.max(0.4, z - 0.2)); }}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all"
                    title="Zoom Out"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <div className="w-[80px] text-center">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setCanvasZoom(1.0); }}
                      className="text-[12px] font-bold text-white/90 hover:text-[#FF591E] transition-colors"
                    >
                      {Math.round(canvasZoom * 100)}%
                    </button>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setCanvasZoom(z => Math.min(3.0, z + 0.2)); }}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all"
                    title="Zoom In"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                  <div className="w-[1px] h-6 bg-white/10 mx-1" />
                  <button 
                    onClick={(e) => { e.stopPropagation(); setCanvasZoom(1.0); setPanOffset({x:0, y:0}); }}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
               </div>

               {/* The Sizing Layer forces Native Scrollbars */}
               <div id="canvas-scale-container" style={{ minWidth: '100%', minHeight: `${(1123 * pageCount + (pageCount * 64) + 160) * finalScale}px`, position: 'relative' }}>
                  
                  {/* The Transform Mapping Layer */}
                  <div 
                    className="absolute top-0 left-0 w-full flex flex-col items-center py-20 gap-16 transition-transform duration-75 ease-out pointer-events-none"
                    style={{
                      transform: `scale(${finalScale})`,
                      transformOrigin: 'top center'
                    }}
                  >
                    <div className="flex flex-col items-center gap-16 pointer-events-auto">

              {Array.from({ length: pageCount }).map((_, pageIdx) => (
                <div key={pageIdx} className="relative group flex flex-col items-center gap-4">
                  {/* Page Label */}
                  <div className="flex items-center justify-between w-full px-2 opacity-50 group-hover:opacity-100 transition-opacity">
                    <span className="text-[11px] font-bold text-white uppercase tracking-widest">Page {pageIdx + 1}</span>
                    <span className="text-[9px] font-medium text-white/40">210 x 297mm</span>
                  </div>

                  {/* The A4 Page Surface */}
                  <div 
                    id={`a4-page-${pageIdx}`}
                    className={`bg-white relative shadow-[0_0_80px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-300 ${activePageIndex === pageIdx ? "ring-4 ring-[#FF591E]/30" : "opacity-90 hover:opacity-100"}`}
                    style={{ width: 794, height: 1123 }}
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCanvasIds([]);
                        setActivePageIndex(pageIdx);
                    }}
                  >
                    {canvasItems.filter(item => item.pageIndex === pageIdx).map((item) => (
                      <Rnd
                        key={item.id}
                        bounds="parent"
                        position={{ x: item.x, y: item.y }}
                        size={{ width: item.width, height: item.height }}
                        dragGrid={isGridSnapped ? [20, 20] : [1, 1]}
                        resizeGrid={isGridSnapped ? [20, 20] : [1, 1]}
                        onDragStop={(e, d) => {
                          setCanvasItems(items => items.map(i => i.id === item.id ? { ...i, x: d.x, y: d.y } : i));
                        }}
                        onResizeStop={(e, dir, ref, delta, position) => {
                          setCanvasItems(items => items.map(i => i.id === item.id ? { 
                            ...i, 
                            width: Number(ref.style.width.replace('px','')), 
                            height: Number(ref.style.height.replace('px','')),
                            ...position
                          } : i));
                        }}
                        lockAspectRatio={true}
                        scale={finalScale}
                        onClick={(e: Event) => { 
                           e.stopPropagation(); 
                           if ((e as unknown as React.MouseEvent).shiftKey) {
                             setSelectedCanvasIds(prev => prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]);
                           } else {
                             setSelectedCanvasIds([item.id]);
                           }
                           setActivePageIndex(pageIdx);
                        }}
                        className={`hover:ring-2 hover:ring-black/20 ${selectedCanvasIds.includes(item.id) ? "ring-2 ring-[#FF591E] shadow-xl" : ""}`}
                        style={{ zIndex: item.zIndex !== undefined ? item.zIndex : (selectedCanvasIds.includes(item.id) ? 20 : 1) }}
                      >
                        {item.rawHtml ? (
                           <div 
                              className="w-full h-full" 
                              style={{ filter: item.isGrayscale ? "grayscale(100%)" : "none" }}
                              dangerouslySetInnerHTML={{ __html: item.rawHtml }} 
                           />
                        ) : (
                           <img 
                             src={item.payloadUrl || ""} 
                             className="w-full h-full object-contain pointer-events-none" 
                             style={{ filter: item.isGrayscale ? "grayscale(100%)" : "none" }}
                             alt="Canvas segment" 
                           />
                        )}
                      </Rnd>
                    ))}
                  </div>
                 </div>
              ))}
                </div>
             </div>
          </div>
       </div>
       </div>
    )}

      {/* FULL SCREEN DECRYPTION LOADER (For PDF/DOCX bypassing the modal) */}
      <AnimatePresence>
        {activePrintJob && isDecrypting && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-[100] bg-white/95 flex flex-col items-center justify-center p-6 backdrop-blur-2xl transition-all duration-500"
           >
              {/* Central Multi-Layered Spinner */}
              <div className="relative mb-8">
                 {/* Outer Pulsing Rings */}
                 <motion.div 
                   animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0, 0.1] }}
                   transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                   className="absolute inset-[-40px] border border-[#FF591E]/20 rounded-full"
                 />
                 
                 {/* Main Rotating Ring */}
                 <motion.div 
                   animate={{ rotate: 360 }}
                   transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                   className="w-20 h-20 rounded-full border-t-2 border-[#FF591E] shadow-[0_0_15px_rgba(255,89,30,0.2)]"
                 />
                 
                 {/* Inner Icon with Pulse */}
                 <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [0.95, 1.05, 0.95] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Printer className="w-7 h-7 text-[#FF591E]" />
                    </motion.div>
                 </div>

                 {/* The Scanning Line Effect */}
                 <motion.div 
                   animate={{ top: ["0%", "100%", "0%"] }}
                   transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                   className="absolute left-0 right-0 h-[1.5px] bg-[#FF591E]/40 z-10"
                 />
              </div>

              {/* Friendly Protocol Strings */}
              <div className="text-center max-w-sm">
                <motion.p 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-[18px] font-black text-black tracking-tight uppercase mb-1"
                >
                  Getting your file ready yaar
                </motion.p>
                <div className="flex flex-col gap-1">
                   <motion.p 
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     className="text-[10px] font-bold text-[#FF591E] uppercase tracking-widest"
                   >
                     Secure Printing In Progress...
                   </motion.p>
                   <p className="text-[12px] font-medium text-auth-slate-50 leading-relaxed px-4">
                     Wait a second, we're making sure your print is private and perfectly formatted for the hardware.
                   </p>
                </div>
              </div>

              {/* Subtle Footer Decor */}
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-3 opacity-30">
                 <div className="h-[1px] w-8 bg-black/10" />
                 <span className="text-[9px] font-bold text-black uppercase tracking-[0.3em]">XeroxQ Shop</span>
                 <div className="h-[1px] w-8 bg-black/10" />
              </div>
           </motion.div>
        )}
      </AnimatePresence>

       {/* TOP HEADER - IDENTITY, ACTIONS */}
      <div className="shrink-0 relative w-full bg-white border-b border-[#E2E8F0] z-30">
         <div className="max-w-[1440px] mx-auto px-4 py-[22px] lg:py-6 lg:px-[82px]">
            {/* Single row: logo + name on left, icon buttons on right */}
            <div className="flex items-center justify-between gap-3">
               {/* Left: logo + shop name */}
               <div className="flex items-center gap-2 lg:gap-4 shrink-0">
                 <div className="w-8 h-8 lg:w-9 lg:h-9 bg-black rounded-lg lg:rounded-[5.57px] flex items-center justify-center shrink-0 shadow-md shadow-black/20">
                   <Printer className="text-white w-4 h-4" />
                 </div>
                 <div className="flex flex-col">
                   <h1 className="text-[16px] lg:text-[18px] font-bold text-black leading-none tracking-tight whitespace-nowrap">{shop.name}</h1>
                   <p className="text-[9px] lg:text-[10px] font-bold text-[#7E8B9E] tracking-[0.12em] uppercase leading-none mt-0.5">Dashboard</p>
                 </div>
               </div>

               {/* Right: action buttons */}
               <div className="flex items-center gap-2 shrink-0">
                  {/* Live indicator - full text on desktop, hidden on mobile */}
                  <div className="hidden lg:flex items-center gap-2 px-3 h-[32px] bg-green-50 border border-green-100 rounded-[5.57px]">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                    <span className="text-[10px] font-bold text-green-700 uppercase tracking-widest">Secure Printing Active</span>
                  </div>

                  {/* Bell / Alerts — mobile: small icon-only | desktop: icon + text */}
                  <button
                    onClick={isSoundEnabled ? toggleSound : requestNotificationPermission}
                    className={cn(
                       "h-8 w-8 lg:h-[36px] lg:w-auto lg:px-3 border transition-all rounded-lg lg:rounded-[5.57px] flex items-center justify-center lg:gap-2 shadow-sm font-bold text-[12px]",
                       isSoundEnabled
                         ? "bg-orange-50 border-orange-100 text-[#FF591E]"
                         : "bg-white border-[#E2E8F0] text-black hover:bg-[#F8FAFC]"
                    )}
                    title={isSoundEnabled ? "Alerts Active" : "Enable Sound Notifications"}
                  >
                    {isSoundEnabled ? <Bell className="w-4 h-4 lg:w-[14px] lg:h-[14px]" /> : <BellOff className="w-4 h-4 lg:w-[14px] lg:h-[14px]" />}
                    <span className="hidden lg:inline">{isSoundEnabled ? "Active" : "Alerts"}</span>
                  </button>

                  {/* Config — mobile: small icon-only | desktop: icon + text */}
                  <Dialog open={showingSettings} onOpenChange={setShowingSettings}>
                     <DialogTrigger asChild>
                       <button
                         className="h-8 w-8 lg:h-[36px] lg:w-auto lg:px-3 border border-[#E2E8F0] bg-white text-black hover:bg-[#F8FAFC] transition-colors rounded-lg lg:rounded-[5.57px] flex items-center justify-center lg:gap-2 shadow-sm font-bold text-[12px]"
                         title="Shop Config"
                       >
                         <Settings2 className="w-4 h-4 lg:w-[14px] lg:h-[14px]" />
                         <span className="hidden lg:inline">Config</span>
                       </button>
                     </DialogTrigger>
                     <DialogContent className="sm:max-w-md rounded-[32px] p-8 bg-white border border-[#E2E8F0] shadow-2xl">
                       <DialogHeader className="text-left mb-4">
                         <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mb-3 shadow-lg">
                           <Settings2 className="w-5 h-5 text-white" />
                         </div>
                         <DialogTitle className="text-[20px] font-bold tracking-tight text-black">Shop Settings</DialogTitle>
                         <DialogDescription className="font-bold tracking-[0.1em] text-auth-slate-50 text-[10px] uppercase">
                           Shop Configuration
                         </DialogDescription>
                       </DialogHeader>
                       <form onSubmit={handleUpdateSettings} className="flex flex-col gap-5 mt-2">
                          <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold tracking-[0.1em] text-auth-slate-50 uppercase">Merchant UPI ID</label>
                            <input 
                              type="text" 
                              value={shop?.upi_id || ""}
                              onChange={(e) => setShop({ ...shop, upi_id: e.target.value })}
                              className="auth-input w-full h-[40px] px-3 font-mono text-[14px] font-bold text-black border border-[#E2E8F0] rounded-[5.57px] outline-none focus:ring-1 focus:ring-black focus:border-black transition-all bg-white"
                            />
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => setShop({ ...shop, is_open: shop?.is_open === false ? true : false })}
                            className="flex flex-row items-center justify-between px-4 h-[40px] bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] rounded-[5.57px] transition-colors cursor-pointer mt-2"
                          >
                            <span className="text-[11px] font-bold tracking-[0.05em] uppercase text-black">Shop Status</span>
                            <div className="flex items-center gap-2">
                              <div className={cn("w-2 h-2 rounded-full", shop?.is_open !== false ? "bg-[#059669] animate-pulse shadow-[0_0_8px_rgba(5,150,105,0.6)]" : "bg-red-500")} />
                              <span className={cn("text-[11px] font-bold uppercase tracking-[0.05em]", shop?.is_open !== false ? "text-[#059669]" : "text-red-500")}>
                                {shop?.is_open !== false ? "Online" : "Offline"}
                              </span>
                            </div>
                          </button>
                          
                          <div className="flex flex-col gap-3 pt-4 border-t border-[#E2E8F0] mt-2">
                             <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold tracking-[0.1em] text-red-500 uppercase">Emergency Clear</span>
                                <p className="text-[11px] text-auth-slate-50 font-medium">Instantly delete all files and job history from this shop.</p>
                             </div>
                             <button 
                               type="button"
                               onClick={handleFlushQueue}
                               disabled={updatingSettings || jobs.length === 0}
                               className="w-full h-[40px] bg-red-50 border border-red-100 text-red-600 font-bold text-[12px] rounded-[5.57px] hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                             >
                               <Trash2 className="w-4 h-4" /> Clear All Jobs
                             </button>
                          </div>

                          <div className="flex gap-3 mt-6">
                             <button 
                               type="button"
                               onClick={() => setShowingSettings(false)}
                               className="w-[120px] h-[40px] bg-white border border-[#E2E8F0] text-black hover:bg-[#F8FAFC] rounded-[5.57px] text-[12px] font-bold transition-colors"
                             >
                               Cancel
                             </button>
                             <button 
                               type="submit"
                               disabled={updatingSettings}
                               className="flex-1 h-[40px] bg-black text-white hover:bg-black/90 font-bold text-[12px] rounded-[5.57px] transition-colors flex items-center justify-center shadow-lg"
                             >
                               {updatingSettings ? "Syncing..." : "Save Settings"}
                             </button>
                          </div>
                       </form>
                     </DialogContent>
                  </Dialog>

                  {/* QR — mobile: small icon-only | desktop: icon + text */}
                  <Dialog open={showQR} onOpenChange={setShowQR}>
                    <DialogTrigger asChild>
                      <button
                        className="h-8 w-8 lg:h-[36px] lg:w-auto lg:px-3 border border-[#E2E8F0] bg-white text-black hover:bg-[#F8FAFC] transition-colors rounded-lg lg:rounded-[5.57px] flex items-center justify-center lg:gap-2 shadow-sm font-bold text-[12px]"
                        title="Customer QR"
                      >
                        <QrCode className="w-4 h-4 lg:w-[14px] lg:h-[14px]" />
                        <span className="hidden lg:inline">QR</span>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md rounded-[32px] p-8 bg-white border border-[#E2E8F0] shadow-2xl">
                      <DialogHeader className="text-left mb-4">
                        <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mb-3 shadow-lg">
                           <QrCode className="w-5 h-5 text-white" />
                        </div>
                        <DialogTitle className="text-[20px] font-bold tracking-tight text-black">Customer Link</DialogTitle>
                        <DialogDescription className="font-bold tracking-[0.1em] text-auth-slate-50 text-[10px] uppercase leading-relaxed">
                          Scan this QR code to securely send your documents to the shop's print queue.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col items-center gap-4 mt-2">
                        <div className="p-6 bg-white border border-[#E2E8F0] rounded-[24px] w-full flex justify-center shadow-inner group relative">
                           <div className="absolute inset-4 border border-dashed border-black/5 rounded-[20px] group-hover:border-black/10 transition-colors" />
                           <div className="relative z-10 p-2 bg-white rounded-xl transition-transform duration-500 group-hover:scale-105">
                             {qrUrl ? (
                               <QRCodeSVG 
                                 value={qrUrl} 
                                 size={160}
                                 level="H"
                                 includeMargin={false}
                                 imageSettings={{
                                   src: "/logo.png",
                                   x: undefined,
                                   y: undefined,
                                   height: 24,
                                   width: 24,
                                   excavate: true,
                                 }}
                               />
                             ) : (
                               <div className="w-[160px] h-[160px] flex items-center justify-center text-slate-400">
                                 Generating...
                               </div>
                             )}
                           </div>
                        </div>
                        
                        <div className="w-full space-y-4">
                          <div className="w-full flex flex-col gap-1.5">
                             <span className="text-[10px] font-bold text-auth-slate-50 tracking-[0.1em] uppercase">Static Link Handle</span>
                             <div className="bg-white px-4 py-3 rounded-[5.57px] text-[11px] font-mono font-bold text-black border border-[#E2E8F0] w-full text-center truncate shadow-sm">
                                {qrUrl}
                             </div>
                          </div>

                          <div className="flex gap-3 pt-2">
                            <button 
                              onClick={() => window.open(`/admin/poster?name=${encodeURIComponent(shop.name)}&slug=${shop.slug}&upi=${shop.upi_id || ''}`, '_blank')}
                              className="flex-1 h-[40px] bg-white border border-[#E2E8F0] text-black hover:bg-[#F8FAFC] rounded-[5.57px] text-[12px] font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                            >
                              <Printer className="w-3.5 h-3.5" /> Poster
                            </button>
                            <button onClick={() => setShowQR(false)} className="flex-1 h-[40px] bg-black text-white hover:bg-black/90 rounded-[5.57px] text-[12px] font-bold transition-all flex items-center justify-center shadow-lg shadow-black/10">
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Separator */}
                  <div className="h-6 w-[1px] bg-[#E2E8F0] mx-0.5" />

                  {/* Logout — mobile: small icon-only | desktop: icon + text */}
                  <button
                    onClick={handleLogout}
                    className="h-8 w-8 lg:h-[36px] lg:w-auto lg:px-2 flex items-center justify-center lg:gap-2 rounded-lg lg:rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors font-bold text-[12px]"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4 lg:w-[14px] lg:h-[14px]" />
                    <span className="hidden lg:inline">Logout</span>
                  </button>
               </div>
            </div>
         </div>
      </div>

      {/* SUB HEADER - ACTIVE QUEUE TITLE & SEARCH (STATIC) */}
      <div className="shrink-0 w-full bg-[#F8FAFC]">
         <div className="max-w-[1440px] w-full mx-auto px-6 pt-6 pb-4 lg:px-[82px]">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
               <h2 className="text-[20px] font-bold tracking-tight text-black flex items-center gap-2">
                  <span className="gradient-text-startup">Active Queue</span>
               </h2>
               <div className="relative w-full lg:w-[260px] flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-auth-slate-50" />
                    <input 
                      type="text"
                      placeholder="Search by name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="auth-input w-full h-[36px] bg-white pl-9 text-[12px]"
                    />
                  </div>
                  <button 
                    onClick={() => shop && fetchJobs(shop.id)}
                    className="h-[36px] w-[36px] flex items-center justify-center bg-white border border-[#E2E8F0] rounded-[5.57px] text-auth-slate-50 hover:text-black hover:border-black/20 transition-all shadow-sm group"
                    title="Refresh Queue"
                  >
                    <RefreshCw className="w-[14px] h-[14px] group-active:rotate-180 transition-transform duration-500" />
                  </button>
               </div>
            </div>
         </div>
      </div>

      {/* MAIN BODY - RESPONSIVE QUEUE */}
      <div className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-[82px] pb-6 flex flex-col overflow-y-auto scrollbar-thin">

        {/* ── EMPTY STATE ── */}
        {filteredJobs.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 py-24">
            <img src="/hot-air-balloon.svg" alt="Queue Empty" className="w-40 h-40 drop-shadow-2xl" />
            <div className="text-center space-y-1">
              <p className="text-[20px] font-black text-black tracking-tight uppercase">Terminal Clear</p>
              <p className="text-[12px] font-bold text-[#7E8B9E] uppercase tracking-[0.15em] leading-relaxed max-w-xs">
                The network is silent. Customer print jobs will appear here in real-time.
              </p>
            </div>
          </div>
        )}

        {/* ── MOBILE CARDS (shown below lg) ── */}
        {filteredJobs.length > 0 && (
          <div className="flex flex-col gap-3 lg:hidden pb-6 overflow-y-auto scrollbar-thin">
            {filteredJobs.map((job) => {
              const isExpired = new Date(job.expires_at) < currentTime;
              const diff = new Date(job.expires_at).getTime() - currentTime.getTime();
              const minsLeft = Math.floor(diff / 60000);
              return (
                <div key={job.id} className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-4 flex flex-col gap-3">
                  {/* Row 1: Customer + Status badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-black text-black tracking-widest uppercase">{job.customer_name || "ANONYMOUS"}</span>
                    {job.status === "printed" ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-100 rounded-full text-[10px] font-bold text-green-700 uppercase tracking-widest">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Done
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 border border-orange-200 rounded-full text-[10px] font-bold text-[#FF591E] uppercase tracking-widest">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FF591E] animate-pulse" /> Pending
                      </span>
                    )}
                  </div>

                  {/* Row 2: File info */}
                  <div className="flex items-center gap-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2.5">
                    <div className="w-9 h-9 bg-white border border-[#E2E8F0] rounded-lg flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-[#323A46]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[13px] text-black truncate">{job.file_name}</p>
                      <p className="text-[11px] text-[#7E8B9E] font-medium">Synced {new Date(job.created_at).toLocaleTimeString()}</p>
                    </div>
                    <span className="text-[11px] font-black text-red-500 uppercase shrink-0">
                      {job.file_name.split('.').pop()?.substring(0, 4) || 'RAW'}
                    </span>
                  </div>

                  {/* Row 3: Print detail tags */}
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center h-6 px-2.5 rounded-md text-[10px] font-bold bg-white border border-[#E2E8F0] text-[#323A46] uppercase">
                      {job.preferences.color ? '🎨 Color' : '⬛ Mono'}
                    </span>
                    <span className="inline-flex items-center h-6 px-2.5 rounded-md text-[10px] font-bold bg-white border border-[#E2E8F0] text-[#323A46] uppercase">
                      {job.preferences.copies} {job.preferences.copies > 1 ? 'copies' : 'copy'}
                    </span>
                    {job.preferences.doubleSided && (
                      <span className="inline-flex items-center h-6 px-2.5 rounded-md text-[10px] font-bold bg-white border border-[#E2E8F0] text-[#323A46] uppercase">2-Sided</span>
                    )}
                  </div>

                  {/* Row 4: Action buttons */}
                  <div className="flex items-center gap-2 pt-1 border-t border-[#F1F5F9]">
                    {job.status !== "printed" ? (
                      <>
                        <button
                          onClick={() => handlePrint(job)}
                          className="flex-1 h-10 bg-black text-white rounded-xl text-[12px] font-bold transition-all hover:bg-black/90 flex items-center justify-center gap-2 uppercase tracking-widest"
                        >
                          <Printer className="w-3.5 h-3.5" /> Print
                        </button>
                        <button
                          onClick={() => { setVerifyingJobId(job.id); setVerificationMode('complete'); }}
                          className="flex-1 h-10 bg-white border border-[#E2E8F0] text-black rounded-xl text-[12px] font-bold hover:bg-[#F8FAFC] transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => { setVerifyingJobId(job.id); setVerificationMode('reprint'); }}
                        className="flex-1 h-10 bg-white border border-green-200 text-green-700 rounded-xl text-[12px] font-bold hover:bg-green-50 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                      >
                        <Printer className="w-3.5 h-3.5" /> Reprint
                      </button>
                    )}
                    <button
                      onClick={() => handleDownload(job)}
                      disabled={activeDownloadId === job.id}
                      className="h-10 w-10 flex items-center justify-center rounded-xl border border-[#E2E8F0] text-[#7E8B9E] hover:text-black hover:border-black/20 transition-all"
                    >
                      {activeDownloadId === job.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => setDeleteConfirmJob(job)}
                      className="h-10 w-10 flex items-center justify-center rounded-xl border border-[#E2E8F0] text-[#7E8B9E] hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── DESKTOP TABLE (shown at lg+) ── */}
        {filteredJobs.length > 0 && (
          <div className="hidden lg:flex flex-1 bg-white border border-[#E2E8F0] rounded-[5.57px] shadow-[0px_2px_8px_rgba(0,0,0,0.02)] flex-col overflow-hidden">
            <div className="flex-1 min-w-full overflow-auto scrollbar-thin relative">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#F8FAFC] sticky top-0 z-10 shadow-[inset_0_-1px_0_0_#E2E8F0]">
                  <tr>
                    <th className="py-4 pl-6 text-[11px] font-bold uppercase tracking-[0.1em] text-[#7E8B9E] w-[14%]">Customer</th>
                    <th className="py-4 px-4 text-[11px] font-bold uppercase tracking-[0.1em] text-[#7E8B9E] w-[28%]">File Info</th>
                    <th className="py-4 px-4 text-[11px] font-bold uppercase tracking-[0.1em] text-[#7E8B9E] text-center w-[16%]">Print Details</th>
                    <th className="py-4 px-4 text-[11px] font-bold uppercase tracking-[0.1em] text-[#7E8B9E] text-center w-[10%]">Format</th>
                    <th className="py-4 px-4 text-[11px] font-bold uppercase tracking-[0.1em] text-[#7E8B9E] text-center w-[14%]">Print</th>
                    <th className="py-4 pr-6 text-[11px] font-bold uppercase tracking-[0.1em] text-[#7E8B9E] text-right w-[18%]">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {filteredJobs.map((job) => {
                    const isExpired = new Date(job.expires_at) < currentTime;
                    const diff = new Date(job.expires_at).getTime() - currentTime.getTime();
                    const minsLeft = Math.floor(diff / 60000);
                    return (
                      <tr key={job.id} className="group border-b border-[#E2E8F0] last:border-b-0 hover:bg-[#F8FAFC]/50 transition-colors">
                        <td className="py-5 pl-6">
                          <p className="font-bold text-[12px] text-black tracking-widest uppercase">{job.customer_name || "ANONYMOUS"}</p>
                        </td>
                        <td className="py-5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[5.57px] flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4 text-[#323A46]" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-[13px] text-black truncate max-w-[200px]">{job.file_name}</p>
                              <p className="text-[11px] text-[#7E8B9E] font-medium">Synced {new Date(job.created_at).toLocaleTimeString()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="h-6 px-2 rounded-[5.57px] flex items-center text-[10px] font-bold bg-white border border-[#E2E8F0] text-[#323A46] uppercase">
                              {job.preferences.color ? 'COLOR' : 'MONO'}
                            </span>
                            <span className="h-6 px-2 rounded-[5.57px] flex items-center text-[10px] font-bold bg-white border border-[#E2E8F0] text-[#323A46] uppercase">
                              {job.preferences.copies}x
                            </span>
                          </div>
                        </td>
                        <td className="py-5 px-4 text-center">
                          <span className="text-[11px] font-black text-red-600 uppercase tracking-[0.15em]">
                            {job.file_name.split('.').pop()?.substring(0, 4) || 'RAW'}
                          </span>
                        </td>
                        <td className="py-5 px-4 text-center">
                          {job.status !== "printed" ? (
                            <button
                              onClick={() => handlePrint(job)}
                              className="h-[34px] px-4 bg-black text-white rounded-[5.57px] text-[10px] font-bold hover:bg-black/90 transition-all shadow-sm flex items-center gap-2 uppercase tracking-widest mx-auto"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-white/30" /> Print
                            </button>
                          ) : (
                            <button
                              onClick={() => { setVerifyingJobId(job.id); setVerificationMode('reprint'); }}
                              className="h-[34px] px-4 bg-white border border-green-200 text-green-700 rounded-[5.57px] text-[10px] font-bold hover:bg-green-50 transition-all flex items-center gap-2 uppercase tracking-widest mx-auto"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Print
                            </button>
                          )}
                        </td>
                        <td className="py-5 pr-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {job.status !== "printed" ? (
                              <button
                                onClick={() => { setVerifyingJobId(job.id); setVerificationMode('complete'); }}
                                className="h-[34px] px-3 bg-white border border-black/10 text-black rounded-[5.57px] text-[10px] font-bold hover:bg-black/5 transition-all shadow-sm flex items-center gap-1.5 uppercase tracking-widest"
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-black/20" /> Complete
                              </button>
                            ) : (
                              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50 border border-green-100 rounded-[5.57px]">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                <span className="text-[10px] font-bold text-green-700 uppercase tracking-widest">Done</span>
                              </div>
                            )}
                            <button
                              onClick={() => handleDownload(job)}
                              disabled={activeDownloadId === job.id}
                              className="h-[34px] w-[34px] flex items-center justify-center rounded-[5.57px] text-[#7E8B9E] hover:text-black hover:bg-[#F8FAFC] transition-colors"
                              title="Download"
                            >
                              {activeDownloadId === job.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => setDeleteConfirmJob(job)}
                              className="h-[34px] w-[34px] flex items-center justify-center rounded-[5.57px] text-[#7E8B9E] hover:text-red-500 hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* VERIFICATION CHALLENGE MODAL */}
      <Dialog open={!!verifyingJobId} onOpenChange={(open) => !open && setVerifyingJobId(null)}>
        <DialogContent className="sm:max-w-[420px] bg-white border border-[#E2E8F0] shadow-2xl p-8 rounded-[32px] overflow-hidden">
           <DialogHeader className="text-left mb-6">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mb-3 shadow-lg rotate-3 transition-transform hover:rotate-0 duration-500">
                 <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <DialogTitle className="text-[20px] font-bold tracking-tight text-black">Identify & Authenticate</DialogTitle>
              <DialogDescription className="font-bold tracking-[0.1em] text-auth-slate-50 text-[10px] uppercase leading-relaxed">
                 Verify the 2-digit code with the customer to complete this print job.
              </DialogDescription>
           </DialogHeader>
           
           <div className="w-full space-y-6">
              <div className="relative group">
                 <div className="absolute inset-0 bg-black/5 rounded-[24px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                 <input 
                   type="text" 
                   maxLength={2}
                   placeholder="--"
                   autoFocus
                   value={tokenChallengeInput}
                   onChange={(e) => setTokenChallengeInput(e.target.value.replace(/\D/g,''))}
                   onKeyDown={(e) => e.key === 'Enter' && handleVerifyComplete()}
                   className="relative w-full h-[100px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[24px] text-center text-[56px] font-black tracking-[0.2em] text-black focus:bg-white focus:ring-4 focus:ring-black/5 transition-all outline-none shadow-inner"
                 />
              </div>
              
              <div className="flex gap-3">
                 <button 
                   onClick={() => { setVerifyingJobId(null); setTokenChallengeInput(""); }}
                   className="flex-1 h-[40px] bg-white border border-[#E2E8F0] text-black font-bold text-[12px] rounded-[5.57px] hover:bg-[#F8FAFC] transition-all"
                 >
                   Abort
                 </button>
                 <button 
                   onClick={handleVerifyComplete}
                   className="flex-1 h-[40px] bg-black text-white font-bold text-[12px] rounded-[5.57px] hover:bg-black/90 shadow-xl shadow-black/10 transition-all active:scale-[0.98]"
                 >
                   Verify
                 </button>
              </div>
           </div>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={!!deleteConfirmJob} onOpenChange={(open) => !open && setDeleteConfirmJob(null)}>
         <DialogContent className="max-w-[420px] p-8 border border-[#E2E8F0] bg-white rounded-[32px] shadow-2xl">
            <DialogHeader className="text-left mb-6">
               <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-red-100/50">
                  <Trash2 className="w-5 h-5 text-red-500" />
               </div>
               <DialogTitle className="text-[20px] font-bold tracking-tight text-black">Delete Confirmation</DialogTitle>
               <DialogDescription className="font-bold tracking-[0.1em] text-auth-slate-50 text-[10px] uppercase leading-relaxed">
                 This action will permanently delete the <span className="text-black font-bold">"{deleteConfirmJob?.customer_name}"</span> print job. This cannot be undone.
               </DialogDescription>
            </DialogHeader>

            <div className="flex gap-3 w-full pt-2">
               <button 
                 onClick={() => setDeleteConfirmJob(null)}
                 className="flex-1 h-[40px] bg-white border border-[#E2E8F0] text-black font-bold text-[12px] rounded-[5.57px] hover:bg-[#F8FAFC] transition-all"
               >
                 Abort
               </button>
               <button 
                 disabled={isDeleting}
                 onClick={() => deleteConfirmJob && handleDeleteJob(deleteConfirmJob)}
                 className="flex-1 h-[40px] bg-red-500 text-white font-bold text-[12px] rounded-[5.57px] hover:bg-red-600 shadow-xl shadow-red-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
               >
                 {isDeleting ? (
                   <RefreshCw className="w-4 h-4 animate-spin" />
                 ) : (
                   "Authorize Purge"
                 )}
               </button>
            </div>
         </DialogContent>
      </Dialog>

       {/* PURGED SIGNAL MODAL */}
       <Dialog open={!!purgedJob} onOpenChange={(open) => !open && setPurgedJob(null)}>
          <DialogContent className="max-w-[420px] p-8 border border-[#E2E8F0] bg-white rounded-[32px] shadow-2xl">
             <DialogHeader className="text-left mb-6">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-amber-100/50">
                   <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <DialogTitle className="text-[20px] font-bold tracking-tight text-black">File Deleted</DialogTitle>
                <DialogDescription className="font-bold tracking-[0.1em] text-auth-slate-50 text-[10px] uppercase leading-relaxed">
                  Files shared over 3 hours ago are automatically deleted for privacy.
                </DialogDescription>
             </DialogHeader>
 
             <button 
               onClick={() => setPurgedJob(null)}
               className="w-full h-[40px] bg-black text-white font-bold text-[12px] rounded-[5.57px] hover:bg-black/90 shadow-xl shadow-black/10 transition-all active:scale-[0.98]"
             >
               Understood
             </button>
          </DialogContent>
        </Dialog>
     </div>
   );
 }
