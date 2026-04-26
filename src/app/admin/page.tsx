"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
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
  Settings,
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
  BellOff,
  Smartphone
} from "lucide-react";
import { Rnd } from "react-rnd";
import { TableVirtuoso } from "react-virtuoso";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { extractPhoneFromUpi, generateWhatsAppLink } from "@/lib/whatsapp";

import * as mammoth from "mammoth";
const html2canvas = typeof window !== 'undefined' ? require("html2canvas-pro") : null;
import { QRCodeSVG } from "qrcode.react";

const XeroxQPrintDialog = dynamic(
  () => import("@/components/desktop/xeroxq-print-dialog"),
  { ssr: false }
);

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
  require_customer_name?: boolean;
  show_copies?: boolean;
  show_color_mode?: boolean;
  generate_token?: boolean;
  accept_preorders?: boolean;
  contact_number?: string;
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
  page_count: number;
  is_preorder: boolean;
  is_paid: boolean;
  customer_phone?: string;
  created_at: string;
  expires_at: string;
}

interface Notification {
  id: string;
  type: 'success' | 'info' | 'error' | 'new_job';
  message: string;
  subMessage?: string;
  timestamp: Date;
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
  const [canvasItems, setCanvasItems] = useState<{ id: string, x: number, y: number, width: number, height: number, pageIndex: number, zIndex?: number, isGrayscale?: boolean, payloadUrl?: string, rawHtml?: string }[]>([]);
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
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canvasZoom, setCanvasZoom] = useState(1.0);
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null);
  const [initialPinchZoom, setInitialPinchZoom] = useState<number>(1.0);
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
          audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
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
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
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

                // Push visual In-App Alert
                setNotifications(prev => [
                  {
                    id: `job-${newJob.id}`,
                    type: 'new_job',
                    message: `Incoming Document: ${newJob.customer_name || 'Anonymous'}`,
                    subMessage: `File: ${newJob.file_name}`,
                    timestamp: new Date()
                  },
                  ...prev.slice(0, 4) // Keep max 5 notifications
                ]);
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
      const audioCtx = audioContextRef.current || new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
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
        .select("id, token, customer_name, customer_phone, is_preorder, is_paid, file_name, file_path, status, preferences, page_count, created_at, expires_at")
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

    // Get the current session JWT — this is used for server-side auth, not owner_id from body
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert("You must be logged in to create a shop.");
      setCreatingShop(false);
      return;
    }

    try {
      const slug = newShopData.slug.toLowerCase().replace(/[^a-z0-9-]/g, "");

      const res = await fetch("/api/create-shop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // JWT goes in header — server extracts owner_id from it, never from body
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: newShopData.name,
          slug,
          upi_id: newShopData.upi_id,
        }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Shop creation failed");

      setShop(body.shop);
      if (body.shop) fetchJobs(body.shop.id);
    } catch (error) {
      const e = error as Error;
      alert("Error creating shop: " + e.message);
    } finally {
      setCreatingShop(false);
    }
  };


  const updateStatus = async (id: string, status: string) => {
    await supabase.from("jobs").update({ status }).eq("id", id);
  };

  const initiateVerification = async (job: Job, mode: 'complete' | 'reprint') => {
    if (shop?.generate_token === false) {
      // Skip verification if shop disabled tokens
      if (mode === 'complete') {
        await updateStatus(job.id, "printed");
        setJobs(docs => docs.map(d => d.id === job.id ? { ...d, status: 'printed' } : d));

        // Success notification
        setNotifications(prev => [{
          id: `status-${Date.now()}`,
          type: 'success',
          message: "Job Completed",
          subMessage: `Document ${job.file_name} marked as printed.`,
          timestamp: new Date()
        }, ...prev]);
      } else {
        handlePrint(job);
      }
    } else {
      setVerifyingJobId(job.id);
      setVerificationMode(mode);
    }
  };

  const handleVerifyComplete = async () => {
    const job = jobs.find(j => j.id === verifyingJobId);
    if (!job) return;

    if (tokenChallengeInput === job.token) {
      if (verificationMode === 'complete') {
        await updateStatus(job.id, "printed");
        setJobs(docs => docs.map(d => d.id === job.id ? { ...d, status: 'printed' } : d));
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
        .createSignedUrl(job.file_path, 60 * 5); // 5 minutes signed url

      if (error) {
        if (error.message?.includes("Object not found") || (error as { status?: number }).status === 404) {
          if (confirm("CRITICAL: Mesh payload not found. It was likely purged for privacy compliance. Purge stale database record too?")) {
            handleDeleteJob(job);
          }
          return;
        }
        throw error;
      }

      if (data?.signedUrl) {
        // Pass the pre-signed URL directly to the Xerox Dialog -> Native IPC
        setPrintPreviewUrl(data.signedUrl);
      }
    } catch (error) {
      const e = error as Error;
      console.error("Payload decryption failed:", error);
      // Inline Error Feedback
      setNotifications(prev => [{
        id: `err-${Date.now()}`,
        type: 'error',
        message: "Decryption Failed",
        subMessage: e.message,
        timestamp: new Date()
      }, ...prev]);
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

      // Push Success Feedback
      setNotifications(prev => [{
        id: `purge-${job.id}`,
        type: 'success',
        message: "Cache Purged Successful",
        subMessage: `Job ${job.token} data securely wiped.`,
        timestamp: new Date()
      }, ...prev]);
    } catch (error) {
      const e = error as Error;
      console.error("Deletion protocol failed:", error);
      setNotifications(prev => [{
        id: `purge-err-${Date.now()}`,
        type: 'error',
        message: "Purge Failed",
        subMessage: e.message,
        timestamp: new Date()
      }, ...prev]);
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
            // Basic XSS Sanitize: strip script tags and event handlers before document.write
            const safeHtml = item.rawHtml
              .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
              .replace(/on[a-z]+=/gi, "data-removed=");
            imagesHtml += `<div style="position: absolute; left: ${leftMm}mm; top: ${topMm}mm; width: ${widthMm}mm; height: ${heightMm}mm; ${filterCss} ${zIndexCss}">${safeHtml}</div>`;
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

      // 1. Resolve Extension and Filename
      const cleanCustomer = (job.customer_name || "ANONYMOUS").replace(/[^a-z0-9]/gi, '_');
      const originalFileName = job.file_name || "document.pdf";

      // MIME Map fallback for older corrupted records
      const MIME_MAP: Record<string, string> = {
        "vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
        "vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
        "msword": "doc",
        "plain": "txt"
      };

      let ext = originalFileName.split('.').pop()?.toLowerCase() || 'file';
      if (MIME_MAP[ext]) ext = MIME_MAP[ext];

      const downloadFilename = `${cleanCustomer}.${ext}`;

      // 2. Generate Secure Signed URL
      const { data, error } = await supabase.storage
        .from("documents")
        .createSignedUrl(job.file_path, 60 * 5);

      if (error) {
        if ((error as { status?: number }).status === 404 || error.message?.includes('Object not found')) {
          setPurgedJob(job);
          return;
        }
        throw error;
      }

      if (!data?.signedUrl) throw new Error("No signal URL generated");

      // 3. Trigger Download via Fetch to ensure filename is respected in all browsers
      const response = await fetch(data.signedUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", downloadFilename);
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

    } catch (error) {
      const e = error as Error;
      console.error("Downlink Protocol Failure:", error);
      alert("Downlink Failed: " + (e.message || "Unknown signal error"));
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
      alert("Composited export failed: " + (e as Error).message);
    } finally {
      setIsCompositing(false);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingSettings(true);

    // Server/Client bound limits to prevent DB errors or logical abuse
    const monoPrice = Math.max(0, Math.min(1000, shop?.price_mono || 0));
    const colorPrice = Math.max(0, Math.min(1000, shop?.price_color || 0));

    const { error } = await supabase
      .from("shops")
      .update({
        upi_id: shop?.upi_id,
        price_mono: monoPrice,
        price_color: colorPrice,
        is_open: shop?.is_open,
        require_customer_name: shop?.require_customer_name !== false,
        show_copies: shop?.show_copies !== false,
        show_color_mode: shop?.show_color_mode !== false,
        generate_token: shop?.generate_token !== false,
        accept_preorders: shop?.accept_preorders === true,
        contact_number: shop?.contact_number || ""
      })
      .eq("id", shop?.id);

    if (error) {
      setNotifications(prev => [{
        id: `sync-err-${Date.now()}`,
        type: 'error',
        message: "Sync Failure",
        subMessage: error.message,
        timestamp: new Date()
      }, ...prev]);
    } else {
      setShowingSettings(false);
      setNotifications(prev => [{
        id: `sync-ok-${Date.now()}`,
        type: 'success',
        message: "Configurations Synced",
        subMessage: "Your shop preferences are now cloud-consistent.",
        timestamp: new Date()
      }, ...prev]);
    }
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

  const shopPhone = shop?.upi_id ? extractPhoneFromUpi(shop.upi_id) : null;
  const qrUrl = typeof window !== "undefined"
    ? `${window.location.origin}/${shop?.slug}`
    : "";

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
      {/* XEROX CONNECTKEY PRINT EDITOR */}
      {activePrintJob && printPreviewUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8 backdrop-blur-sm">
          <XeroxQPrintDialog
            documentPath={printPreviewUrl} // Passing the actual URL for download in main.js
            onClose={() => { setActivePrintJob(null); setPrintPreviewUrl(null); }}
          />
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
                <div className="flex items-center gap-1.5 mt-1">
                  <button
                    onClick={() => setShop({ ...shop!, is_open: !shop?.is_open })}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      shop?.is_open !== false ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-500"
                    )}
                  />
                  <span className="text-[9px] lg:text-[10px] font-bold text-[#7E8B9E] tracking-[0.05em] uppercase leading-none">
                    {shop?.is_open !== false ? "Open" : "Closed"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Quick Stats Bar Removed */}

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
                    title="Shop Settings"
                  >
                    <Settings className="w-4 h-4 lg:w-[14px] lg:h-[14px]" />
                    <span className="hidden lg:inline">Settings</span>
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl rounded-xl p-0 bg-white border border-[#E2E8F0] shadow-2xl overflow-hidden selection:bg-black selection:text-white">
                  <div className="flex flex-col h-full max-h-[95vh]">
                    <DialogHeader className="p-6 pb-3 bg-[#F8FAFC]/50 backdrop-blur-xl border-b border-[#E2E8F0] relative overflow-hidden">
                      {/* Decorative Background Accent */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-black/[0.02] rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

                      <div className="flex items-center gap-3 relative z-10">
                        <div className="w-10 h-10 bg-black rounded-[5.57px] flex items-center justify-center shadow-lg transform -rotate-3 transition-transform hover:rotate-0 shrink-0">
                          <Settings className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 mb-0">
                            <Zap className="w-2.5 h-2.5 text-black animate-pulse" />
                            <span className="text-[9px] font-black tracking-[0.2em] text-black/40 uppercase">Terminal Calibration Protocol</span>
                          </div>
                          <DialogTitle className="text-[20px] font-black tracking-tighter text-black uppercase leading-none">Shop Settings</DialogTitle>
                        </div>
                      </div>
                    </DialogHeader>

                    <form onSubmit={handleUpdateSettings} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative">
                      {/* Section 1: Terminal Identity */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 bg-black rounded-[4px] flex items-center justify-center">
                            <Activity className="w-2.5 h-2.5 text-white" />
                          </div>
                          <h3 className="text-[11px] font-black uppercase tracking-[0.1em] text-black">Terminal Parameters</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[5.57px] relative transition-all hover:border-black/5">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] font-black tracking-[0.1em] text-auth-slate-50 uppercase ml-1">Merchant Identity (UPI)</label>
                            <input
                              type="text"
                              value={shop?.upi_id || ""}
                              onChange={(e) => setShop({ ...shop!, upi_id: e.target.value })}
                              className="auth-input w-full h-[42px] px-3 font-mono text-[13px] font-bold text-black border border-[#E2E8F0] rounded-[5.57px] outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all bg-white"
                              placeholder="shop@upi"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] font-black tracking-[0.1em] text-auth-slate-50 uppercase ml-1">Shop Contact (For Pre-orders)</label>
                            <input
                              type="text"
                              value={shop?.contact_number || ""}
                              onChange={(e) => setShop({ ...shop!, contact_number: e.target.value })}
                              className="auth-input w-full h-[42px] px-3 font-mono text-[13px] font-bold text-black border border-[#E2E8F0] rounded-[5.57px] outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all bg-white"
                              placeholder="+91 XXXXX XXXXX"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] font-black tracking-[0.1em] text-auth-slate-50 uppercase ml-1">Network Status</label>
                            <button
                              type="button"
                              onClick={() => setShop({ ...shop!, is_open: !shop?.is_open })}
                              className={cn(
                                "flex items-center justify-between px-4 h-[42px] rounded-[5.57px] border transition-all duration-300 shadow-sm",
                                shop?.is_open !== false ? "bg-white border-green-200 text-green-700" : "bg-white border-red-200 text-red-700"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <div className={cn("w-1.5 h-1.5 rounded-full", shop?.is_open !== false ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                                <span className="text-[11px] font-black uppercase tracking-wider">{shop?.is_open !== false ? "Online" : "Offline"}</span>
                              </div>
                              <div className={cn(
                                "w-7 h-3.5 rounded-full relative transition-colors duration-500",
                                shop?.is_open !== false ? "bg-black" : "bg-red-500"
                              )}>
                                <div className={cn(
                                  "absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-all duration-500 shadow-sm",
                                  shop?.is_open !== false ? "right-0.5" : "left-0.5"
                                )} />
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: UI Logic */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 bg-black rounded-[4px] flex items-center justify-center">
                            <Palette className="w-2.5 h-2.5 text-white" />
                          </div>
                          <h3 className="text-[11px] font-black uppercase tracking-[0.1em] text-black">Interaction Logic</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 bg-white p-6 rounded-[5.57px] border border-[#E2E8F0] relative">
                          <div className="absolute inset-3 border border-dashed border-black/[0.03] rounded-[5.57px] pointer-events-none" />

                          {[
                            { label: "Require Name", sub: "Identity validation", key: "require_customer_name" },
                            { label: "2-Digit Token", sub: "Access codes", key: "generate_token" },
                            { label: "Copy Selector", sub: "Qty parameters", key: "show_copies" },
                            { label: "Color Options", sub: "Profile toggles", key: "show_color_mode" },
                            { label: "Accept Pre-orders", sub: "Home/Work Service", key: "accept_preorders" }
                          ].map((toggle) => (
                            <div key={toggle.key} className="flex items-center justify-between relative z-10 group/item">
                              <div className="flex flex-col gap-0">
                                <span className="text-[12px] font-black text-black uppercase tracking-tight">{toggle.label}</span>
                                <span className="text-[9px] text-auth-slate-50 font-bold uppercase tracking-wider opacity-60 leading-none">{toggle.sub}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setShop({ ...shop!, [toggle.key]: !(shop?.[toggle.key as keyof Shop] !== false) })}
                                className={cn(
                                  "w-10 h-5 rounded-full relative transition-all duration-500 shrink-0 shadow-inner",
                                  shop?.[toggle.key as keyof Shop] !== false ? "bg-black" : "bg-[#E2E8F0]"
                                )}
                              >
                                <div className={cn(
                                  "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-500 shadow-lg",
                                  shop?.[toggle.key as keyof Shop] !== false ? "right-0.5" : "left-0.5"
                                )} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Section 3: Billing & System Reset (Combined Row) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Billing Protocol */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Zap className="w-2.5 h-2.5 text-black" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.1em] text-black">Billing Protocol</h3>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col gap-1 p-2.5 border border-[#E2E8F0] rounded-[5.57px] bg-white shadow-sm">
                              <span className="text-[8px] font-black text-auth-slate-50 uppercase tracking-[0.1em] ml-0.5">Mono (₹)</span>
                              <div className="flex items-center gap-1.5">
                                <div className="w-6 h-6 bg-black/5 rounded-[3px] flex items-center justify-center font-black text-black text-[10px]">₹</div>
                                <input
                                  type="number"
                                  value={shop?.price_mono || 0}
                                  onChange={(e) => setShop({ ...shop!, price_mono: Number(e.target.value) })}
                                  className="flex-1 bg-transparent border-none text-[16px] font-black text-black outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-full"
                                />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1 p-2.5 border border-[#E2E8F0] rounded-[5.57px] bg-white shadow-sm">
                              <span className="text-[8px] font-black text-auth-slate-50 uppercase tracking-[0.1em] ml-0.5">Color (₹)</span>
                              <div className="flex items-center gap-1.5">
                                <div className="w-6 h-6 bg-black/5 rounded-[3px] flex items-center justify-center font-black text-black text-[10px]">₹</div>
                                <input
                                  type="number"
                                  value={shop?.price_color || 0}
                                  onChange={(e) => setShop({ ...shop!, price_color: Number(e.target.value) })}
                                  className="flex-1 bg-transparent border-none text-[16px] font-black text-black outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-full"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Emergency Flush */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Trash2 className="w-2.5 h-2.5 text-red-500" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.1em] text-red-600">Emergency Reset</h3>
                          </div>
                          <div className="p-3 border border-red-100 rounded-[5.57px] bg-red-50/20 flex flex-col justify-between h-[68px] relative overflow-hidden group">
                            <button
                              type="button"
                              onClick={handleFlushQueue}
                              disabled={updatingSettings || jobs.length === 0}
                              className="w-full h-full bg-red-500 text-white font-black text-[11px] uppercase tracking-widest rounded-[4px] hover:bg-red-600 active:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:opacity-30"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete All Data
                            </button>
                          </div>
                          <p className="text-[8px] text-red-900/30 font-bold uppercase tracking-tight text-center mt-1">Permanently purge all queue documents</p>
                        </div>
                      </div>
                    </form>

                    <DialogFooter className="p-6 bg-[#F8FAFC] border-t border-[#E2E8F0] flex flex-row items-center justify-between gap-4">
                      <DialogClose asChild>
                        <button
                          type="button"
                          className="h-12 px-8 bg-white border border-[#E2E8F0] text-black hover:bg-[#F1F5F9] active:bg-[#E2E8F0] rounded-[5.57px] text-[12px] font-black uppercase tracking-tight transition-all active:scale-95"
                        >
                          Cancel
                        </button>
                      </DialogClose>
                      <button
                        type="submit"
                        onClick={(e) => {
                          e.preventDefault();
                          handleUpdateSettings(e as any);
                        }}
                        disabled={updatingSettings}
                        className="flex-1 h-12 bg-black text-white hover:bg-black/90 active:bg-black/80 font-black text-[13px] uppercase tracking-tighter rounded-[5.57px] transition-all flex items-center justify-center shadow-xl active:scale-95 disabled:opacity-50"
                      >
                        {updatingSettings ? (
                          <div className="flex items-center gap-2">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span className="tracking-[0.1em]">Syncing...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>Save</span>
                            <ArrowUpRight className="w-4 h-4" />
                          </div>
                        )}
                      </button>
                    </DialogFooter>
                  </div>
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
              <p className="text-[20px] font-black text-black tracking-tight uppercase">Queue Empty</p>
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
                    <div className="flex flex-col">
                      <span className="text-[13px] font-black text-black tracking-widest uppercase">{job.customer_name || "ANONYMOUS"}</span>
                      {job.customer_phone && (
                        <span className="text-[10px] font-bold text-[#7E8B9E] mt-0.5">{job.customer_phone}</span>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
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

                  {/* Row 3: Print detail tags (Conditional) */}
                  {job.is_preorder ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "inline-flex items-center h-6 px-2.5 rounded-md text-[10px] font-black uppercase tracking-tight",
                          job.preferences.color 
                            ? "bg-gradient-to-r from-[#FF512F] to-[#DD2476] text-white border-none shadow-sm" 
                            : "bg-white border border-[#E2E8F0] text-black"
                        )}>
                          {job.preferences.color ? '🎨 COLOR' : '⬛ MONO'}
                        </span>
                        <span className="inline-flex items-center h-6 px-2.5 rounded-md text-[10px] font-black bg-white border border-[#E2E8F0] text-black uppercase tracking-tight">
                          {job.preferences.doubleSided ? '📄 2-Sided' : '📄 1-Sided'}
                        </span>
                        <span className="inline-flex items-center h-6 px-2.5 rounded-md text-[10px] font-black bg-orange-50 border border-orange-100 text-orange-700 uppercase tracking-tight">
                          📄 {job.page_count || 1} {(job.page_count || 1) === 1 ? 'PAGE' : 'PAGES'}
                        </span>
                      </div>
                      {job.customer_phone && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl">
                          <Smartphone className="w-4 h-4 text-amber-600" />
                          <span className="text-[14px] font-black text-black tracking-tight">{job.customer_phone}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center h-6 px-2.5 rounded-md text-[10px] font-black bg-white border border-[#E2E8F0] text-black uppercase tracking-tight">Standard Print</span>
                    </div>
                  )}

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
                          onClick={() => initiateVerification(job, 'complete')}
                          className="flex-1 h-10 bg-white border border-[#E2E8F0] text-black rounded-xl text-[12px] font-bold hover:bg-[#F8FAFC] transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => initiateVerification(job, 'reprint')}
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
                    {job.customer_phone && (
                      <a
                        href={`tel:${job.customer_phone}`}
                        className="h-10 px-3 flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all text-[11px] font-bold uppercase"
                      >
                        <Smartphone className="w-4 h-4" /> Call
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── DESKTOP TABLE (shown at lg+) ── */}
        {filteredJobs.length > 0 && (
          <div className="hidden lg:flex flex-1 bg-white border border-[#E2E8F0] rounded-[5.57px] shadow-[0px_2px_8px_rgba(0,0,0,0.02)] flex-col overflow-hidden">
            <div className="flex-1 min-w-full relative h-[600px]">
              <TableVirtuoso
                style={{ height: '100%' }}
                data={filteredJobs}
                components={{
                  Table: ({ style, ...props }) => (
                    <table {...props} style={{ ...style, width: '100%', tableLayout: 'fixed' }} className="w-full border-collapse" />
                  )
                }}
                fixedHeaderContent={() => (
                  <tr className="bg-[#F8FAFC]">
                    <th className="py-4 pl-6 text-[11px] font-bold uppercase tracking-[0.1em] text-[#7E8B9E] w-[14%] border-b border-[#E2E8F0]">Customer</th>
                    <th className="py-4 px-4 text-[11px] font-bold uppercase tracking-[0.1em] text-[#7E8B9E] w-[28%] border-b border-[#E2E8F0]">File Info</th>
                    <th className="py-4 px-4 text-[11px] font-bold uppercase tracking-[0.1em] text-[#7E8B9E] text-center w-[16%] border-b border-[#E2E8F0]">Print Details</th>
                    <th className="py-4 px-4 text-[11px] font-bold uppercase tracking-[0.1em] text-[#7E8B9E] text-center w-[10%] border-b border-[#E2E8F0]">Format</th>
                    <th className="py-4 px-4 text-[11px] font-bold uppercase tracking-[0.1em] text-[#7E8B9E] text-center w-[14%] border-b border-[#E2E8F0]">Print</th>
                    <th className="py-4 pr-6 text-[11px] font-bold uppercase tracking-[0.1em] text-[#7E8B9E] text-right w-[18%] border-b border-[#E2E8F0]">Actions</th>
                  </tr>
                )}
                itemContent={(_index, job) => (
                  <>
                    <td className="py-5 pl-6 border-b border-[#E2E8F0]">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <p className="font-black text-[12px] text-black tracking-widest uppercase leading-none">{job.customer_name || "ANONYMOUS"}</p>
                        </div>
                        {job.customer_phone && (
                          <p className="text-[11px] font-bold text-auth-slate-50 tracking-tight mt-1">
                            {job.customer_phone}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-5 px-4 border-b border-[#E2E8F0]">
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
                    <td className="py-5 px-4 text-center border-b border-[#E2E8F0]">
                      {job.is_preorder ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className={cn(
                              "h-6 px-2 rounded-[5.57px] flex items-center text-[10px] font-black uppercase tracking-tight",
                              job.preferences.color 
                                ? "bg-gradient-to-r from-[#FF512F] to-[#DD2476] text-white border-none shadow-sm" 
                                : "bg-white border border-[#E2E8F0] text-black"
                            )}>
                              {job.preferences.color ? '🎨 COLOR' : '⬛ MONO'}
                            </span>
                            <span className="h-6 px-2 rounded-[5.57px] flex items-center text-[10px] font-black bg-white border border-[#E2E8F0] text-black uppercase tracking-tight">
                              {job.preferences.doubleSided ? '📄 2-SIDED' : '📄 1-SIDED'}
                            </span>
                          </div>
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="h-6 px-2 rounded-[5.57px] flex items-center text-[10px] font-black bg-white border border-[#E2E8F0] text-black uppercase tracking-tight">
                              {job.preferences.copies}X COPIES
                            </span>
                            <span className="h-6 px-2 rounded-[5.57px] flex items-center text-[10px] font-black bg-orange-50 border border-orange-100 text-orange-700 uppercase tracking-tight">
                              {job.page_count || 1}P TOTAL
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] font-black text-black opacity-30 uppercase tracking-widest">Default Settings</span>
                      )}
                    </td>
                    <td className="py-5 px-4 text-center border-b border-[#E2E8F0]">
                      <span className="text-[11px] font-black text-red-600 uppercase tracking-[0.15em]">
                        {job.file_name.split('.').pop()?.substring(0, 4) || 'RAW'}
                      </span>
                    </td>
                    <td className="py-5 px-4 text-center border-b border-[#E2E8F0]">
                      {job.status !== "printed" ? (
                        <button
                          onClick={() => handlePrint(job)}
                          className="h-[34px] px-4 bg-black text-white rounded-[5.57px] text-[10px] font-bold hover:bg-black/90 transition-all shadow-sm flex items-center gap-2 uppercase tracking-widest mx-auto"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-white/30" /> Print
                        </button>
                      ) : (
                        <button
                          onClick={() => initiateVerification(job, 'reprint')}
                          className="h-[34px] px-4 bg-white border border-green-200 text-green-700 rounded-[5.57px] text-[10px] font-bold hover:bg-green-50 transition-all flex items-center gap-2 uppercase tracking-widest mx-auto"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Print
                        </button>
                      )}
                    </td>
                    <td className="py-5 pr-6 text-right border-b border-[#E2E8F0]">
                      <div className="flex items-center justify-end gap-2">
                        {job.status !== "printed" ? (
                          <button
                            onClick={() => initiateVerification(job, 'complete')}
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
                  </>
                )}
              />
            </div>
          </div>
        )}
      </div>

      {/* VERIFICATION CHALLENGE MODAL */}
      <Dialog open={!!verifyingJobId} onOpenChange={(open) => !open && setVerifyingJobId(null)}>
        <DialogContent className="sm:max-w-[420px] bg-white border border-[#E2E8F0] shadow-2xl p-8 rounded-[5.57px] overflow-hidden">
          <DialogHeader className="text-left mb-6">
            <div className="w-10 h-10 bg-black rounded-[5.57px] flex items-center justify-center mb-3 shadow-lg rotate-3 transition-transform hover:rotate-0 duration-500">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <DialogTitle className="text-[20px] font-bold tracking-tight text-black">Identify & Authenticate</DialogTitle>
            <DialogDescription className="font-bold tracking-[0.1em] text-auth-slate-50 text-[10px] uppercase leading-relaxed">
              Verify the 2-digit code with the customer to complete this print job.
            </DialogDescription>
          </DialogHeader>

          <div className="w-full space-y-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-black/5 rounded-[5.57px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <input
                type="text"
                maxLength={2}
                placeholder="--"
                autoFocus
                value={tokenChallengeInput}
                onChange={(e) => setTokenChallengeInput(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyComplete()}
                className="relative w-full h-[100px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[5.57px] text-center text-[56px] font-black tracking-[0.2em] text-black focus:bg-white focus:ring-4 focus:ring-black/5 transition-all outline-none shadow-inner"
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
        <DialogContent className="max-w-[420px] p-8 border border-[#E2E8F0] bg-white rounded-[5.57px] shadow-2xl">
          <DialogHeader className="text-left mb-6">
            <div className="w-10 h-10 bg-red-50 rounded-[5.57px] flex items-center justify-center mb-3 shadow-lg shadow-red-100/50">
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

      {/* ── REAL-TIME NOTIFICATION OVERLAY ── */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none w-full max-w-[400px]">
        <AnimatePresence mode="popLayout">
          {notifications.map((notif) => (
            <XeroxQNotification
              key={notif.id}
              notification={notif}
              onClose={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- SUB-COMPONENT: XEROXQ PREMIUM NOTIFICATION ---
function XeroxQNotification({ notification, onClose }: { notification: Notification, onClose: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(notification.id), 6000);
    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-green-500" />,
    error: <ShieldCheck className="w-5 h-5 text-red-500" />,
    info: <Activity className="w-5 h-5 text-blue-500" />,
    new_job: <Zap className="w-5 h-5 text-[#FF591E] fill-[#FF591E]/20" />
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className="pointer-events-auto w-full bg-white/90 backdrop-blur-xl border border-[#E2E8F0] shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-[20px] p-4 flex items-start gap-4 relative overflow-hidden"
    >
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
        notification.type === 'new_job' ? "bg-orange-50" : "bg-slate-50"
      )}>
        {icons[notification.type]}
      </div>

      <div className="flex-1 min-w-0 pr-6">
        <p className="text-[13px] font-black text-black tracking-tight uppercase leading-tight">
          {notification.message}
        </p>
        {notification.subMessage && (
          <p className="text-[11px] font-medium text-auth-slate-50 mt-0.5 line-clamp-1">
            {notification.subMessage}
          </p>
        )}
      </div>

      <button
        onClick={() => onClose(notification.id)}
        className="absolute top-4 right-4 text-[#7E8B9E] hover:text-black transition-colors"
      >
        <Minus className="w-4 h-4" />
      </button>

      {/* Progress Bar Loader */}
      <motion.div
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: 6, ease: "linear" }}
        className="absolute bottom-0 left-0 h-[3px] bg-[#FF591E]/30 rounded-full"
      />
    </motion.div>
  );
}
