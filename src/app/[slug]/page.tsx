"use client";

import { useState, useRef, useEffect, use } from "react";
import { 
  Upload, 
  CheckCircle2, 
  FileText, 
  Printer, 
  ShieldCheck, 
  Clock, 
  ArrowRight, 
  Store, 
  Zap, 
  Trash2,
  Smartphone,
  RefreshCw,
  History,
  Crop,
  Palette
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { generateToken, cn } from "@/lib/utils";
import { ImageCropper } from "@/components/editing/image-cropper";
import { SiteFooter } from "@/components/layout/site-footer";

// Shadcn UI Imports
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

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

interface HistoryItem {
  token: string;
  shopName: string;
  date: string;
  fileName: string;
}

export default function ShopCustomerPortal({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [shop, setShop] = useState<Shop | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionStep, setConversionStep] = useState(0);
  const [token, setToken] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<{
    color: boolean;
    copies: number;
    doubleSided: boolean;
  }>({
    color: false,
    copies: 1,
    doubleSided: false,
  });
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [jobStatus, setJobStatus] = useState<string>("pending");
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [docxFileToProcess, setDocxFileToProcess] = useState<File | null>(null);
  const [showDocxChoice, setShowDocxChoice] = useState(false);
  
  const [location, setLocation] = useState<'shop' | 'home'>('shop');
  const [customerPhone, setCustomerPhone] = useState("");
  const [detectedPages, setDetectedPages] = useState(1);
  const [isPricingLoading, setIsPricingLoading] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);


  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchShop() {
      // Ensure user has a session for RLS (Anonymous)
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        await supabase.auth.signInAnonymously();
      }

      const { data, error } = await supabase
        .from("shops")
        .select("*")
        .eq("slug", slug)
        .single();
      
      if (error) {
        if (error.code !== "PGRST116") {
          console.error("Shop Connection Error:", error.message || error);
        }
        setNotFound(true);
      } else if (!data) {
        setNotFound(true);
      } else {
        setShop(data);
      }
    }
    fetchShop();

    // Load History
    const saved = localStorage.getItem("xeroxq_history");
    if (saved) setHistoryItems(JSON.parse(saved));
  }, [slug]);

  // Live Status Updates
  useEffect(() => {
    if (!token) return;

    const channel = supabase
      .channel(`job-status-${token}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "jobs", filter: `token=eq.${token}` },
        (payload) => {
          const newStatus = payload.new.status;
          setJobStatus(newStatus);
          
          // High-fidelity intimation when print is ready
          if (newStatus === 'printed') {
            // 1. Play professional ding sound
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
            audio.play().catch(() => {}); // Browser might block auto-play without interaction
            
            // 2. Vibrate device (for mobile users)
            if (window.navigator.vibrate) {
              window.navigator.vibrate([200, 100, 200]);
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [token]);

  // ── File Validation Constants ─────────────────────────────────────────────
  const MAX_FILE_SIZE_MB = 25;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
  
  const ALLOWED_FILE_TYPES: Record<string, string[]> = {
    "application/pdf": ["pdf"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
    "application/msword": ["doc"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ["xlsx"],
    "application/vnd.ms-excel": ["xls"],
    "image/jpeg": ["jpg", "jpeg"],
    "image/png": ["png"],
    "image/webp": ["webp"],
    // Some OS/browsers send octet-stream for office docs — allow it with extension check
    "application/octet-stream": ["pdf", "docx", "doc", "xlsx", "xls"],
  };

  const ALL_ALLOWED_EXTENSIONS = new Set(["pdf", "docx", "doc", "xlsx", "xls", "jpg", "jpeg", "png", "webp"]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // ── Size Check ────────────────────────────────────────────────────────
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      alert(`File too large!\n\nYour file is ${(selectedFile.size / 1024 / 1024).toFixed(1)}MB. Maximum allowed size is ${MAX_FILE_SIZE_MB}MB.\n\nPlease compress your file and try again.`);
      e.target.value = ""; // Reset the input
      return;
    }

    // ── Extension Check ───────────────────────────────────────────────────
    const ext = selectedFile.name.split(".").pop()?.toLowerCase() || "";
    if (!ALL_ALLOWED_EXTENSIONS.has(ext)) {
      alert(`Unsupported file type ".${ext}".\n\nAllowed types: PDF, Word (DOCX/DOC), Excel (XLSX/XLS), Images (JPG, PNG, WebP).`);
      e.target.value = "";
      return;
    }

    // ── MIME Type Check ───────────────────────────────────────────────────
    const mimeType = selectedFile.type;
    const allowedExtensionsForMime = ALLOWED_FILE_TYPES[mimeType];
    
    // If MIME is not in our allowlist (and not octet-stream which we handle separately), reject
    if (!allowedExtensionsForMime && mimeType !== "") {
      // Double check extension since MIME can be unreliable
      if (!ALL_ALLOWED_EXTENSIONS.has(ext)) {
        alert(`This file type is not supported for printing.\n\nAllowed types: PDF, Word, Excel, JPG, PNG.`);
        e.target.value = "";
        return;
      }
    }

    // ── Accept File ───────────────────────────────────────────────────────
    if (ext === "docx" || ext === "doc") {
      setDocxFileToProcess(selectedFile);
      setFile(selectedFile);
    } else {
      setFile(selectedFile);
      setDocxFileToProcess(null);
    }

    // Trigger Page Detection for Pricing
    const runDetection = async () => {
      setIsPricingLoading(true);
      const pages = await detectPageCount(selectedFile);
      setDetectedPages(pages);
      setIsPricingLoading(false);
    };
    runDetection();
  };



  const handleCropComplete = async (croppedDataUrl: string) => {
    if (!cropperImage || !file) return;
    
    // Convert dataURL to blob
    const res = await fetch(croppedDataUrl);
    const blob = await res.blob();
    
    const croppedFile = new File([blob], file.name, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
    
    setFile(croppedFile);
    setShowCropper(false);
    setCropperImage(null);
  };

  const detectPageCount = async (fileToDetect: File | Blob): Promise<number> => {
    const type = fileToDetect.type;
    const name = fileToDetect instanceof File ? fileToDetect.name.toLowerCase() : "";
    
    // Images are always 1 page
    if (type.startsWith("image/") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png")) return 1;
    
    // PDF detection (Robust)
    if (type === "application/pdf" || name.endsWith(".pdf")) {
      try {
        const buffer = await fileToDetect.arrayBuffer();
        const decoder = new TextDecoder();
        // Scan first 100KB AND last 10KB
        const head = decoder.decode(buffer.slice(0, 100000));
        const tail = decoder.decode(buffer.slice(Math.max(0, buffer.byteLength - 10000)));
        const combined = head + tail;
        
        const countMatch = combined.match(/\/Count\s+(\d+)/);
        if (countMatch) return parseInt(countMatch[1]);
        
        const typePageMatch = combined.match(/\/Type\s*\/Page\b/g);
        if (typePageMatch) return typePageMatch.length;
      } catch (e) {
        console.error("PDF Page Detection Err:", e);
      }
    }

    // DOCX detection (Lightweight XML scan)
    if (name.endsWith(".docx")) {
      try {
        const buffer = await fileToDetect.arrayBuffer();
        const content = new TextDecoder().decode(buffer);
        const pageMatches = content.match(/<w:lastRenderedPageBreak\/>/g);
        if (pageMatches) return pageMatches.length + 1;
      } catch (e) {
        console.error("DOCX Page Detection Err:", e);
      }
    }
    
    return 1;
  };


  const handleUpload = async (forceFileType?: 'raw' | 'pdf') => {
    if (!file && !docxFileToProcess) return;
    const activeFile = forceFileType === 'raw' ? docxFileToProcess : (docxFileToProcess || file);
    if (!activeFile || !shop) return;
    
    const fileExt = activeFile.name.split(".").pop()?.toLowerCase();
    const needsConversion = forceFileType === 'pdf' && ["docx", "doc"].includes(fileExt || "");
    
    setUploading(true);
    if (needsConversion) setIsConverting(true);

    try {
      let finalFile: File | Blob = activeFile;
      let finalFileName = activeFile.name;

      
      // 1. Preparing the document
      if (needsConversion) {
        setConversionStep(1); // Optimizing Signal
        const convFormData = new FormData();
        convFormData.append("file", activeFile as Blob);
        
        // Minor delay to show the first step

        await new Promise(r => setTimeout(r, 800));
        setConversionStep(2); // Connecting to Agent
        const response = await fetch("/api/agent", {
          method: "POST",
          body: convFormData,
        });

        if (!response.ok) {
          let errorMsg = "Agent conversion failed";
          try {
            const errData = await response.json();
            errorMsg = errData.error || errorMsg;
          } catch(e) {
            errorMsg = `System Agent Protocol Failure (${response.status})`;
          }
          throw new Error(errorMsg);
        }

        setConversionStep(3); // Wrapping Payload
        finalFile = await response.blob();
        if (activeFile) {
          finalFileName = `${activeFile.name.replace(/\.[^/.]+$/, "")}.pdf`;
        }

      }

      // 1.5 Detect Page Count
      const pageCount = await detectPageCount(finalFile);

      const finalExt = finalFileName.split(".").pop();
      const storagePath = `${Math.random().toString(36).substring(2)}.${finalExt}`;

      // 2. Upload to Storage
      if (!finalFile) throw new Error("File preparation failed - no payload generated");
      
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(storagePath, finalFile as Blob, {
          contentType: finalExt === 'pdf' ? 'application/pdf' : 'application/octet-stream',
          upsert: true
        });

      if (uploadError) throw new Error(`Storage Error: ${uploadError.message || JSON.stringify(uploadError)}`);

      // 3. Insert into DB (with Retry Logic for collisions)
      let newToken = "";
      let dbError: { code?: string; message?: string } | null = null;
      let retries = 3;

      while (retries > 0) {
        newToken = generateToken();
        const { error } = await supabase.from("jobs").insert({
          token: newToken,
          customer_name: customerName || "Guest",
          file_path: storagePath,
          file_name: finalFileName,
          preferences: preferences,
          page_count: pageCount,
          is_preorder: location === 'home',
          is_paid: location === 'home', // For now, assume payment is done if they complete the flow
          customer_phone: customerPhone,
          shop_id: shop.id,
          expires_at: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        });

        if (!error) {
          dbError = null;
          // Increment persistent billing counter (survives job deletion)
          await supabase.rpc('increment_shop_files', { shop_row_id: shop.id });
          break;
        }

        dbError = error;
        // Only retry if it's a unique constraint violation on the token
        if (error.code === "23505" && error.message?.includes("jobs_shop_token_unique")) {
          retries--;
          console.warn(`[Portal] Token Collision (${newToken}). Retrying... (${retries} left)`);
          continue;
        }
        
        // If it's a different error, break and throw
        break;
      }

      if (dbError) {
        // ROLLBACK: Delete the uploaded file from storage if DB record generation failed
        console.error("[Portal] DB Insertion Protocol Failure. Initiating Storage Rollback...", dbError);
        await supabase.storage.from("documents").remove([storagePath]);
        throw new Error(`Database Protocol Failure: ${dbError.message || "Unknown Error"}`);
      }
      
      // 4. Save to History (Local)
      const historyItem: HistoryItem = {
        token: newToken,
        shopName: shop.name,
        date: new Date().toISOString(),
        fileName: finalFileName
      };
      const updatedHistory = [historyItem, ...historyItems.slice(0, 19)];
      setHistoryItems(updatedHistory);
      localStorage.setItem("xeroxq_history", JSON.stringify(updatedHistory));

      setToken(newToken);
      setJobStatus("pending");
    } catch (error) {
      console.error("Mercury Upload Terminal Error Snapshot:", error);
      const e = error as { message?: string };
      const message = e?.message || (typeof error === 'string' ? error : "Upload protocol failed due to an unknown network or storage error.");
      alert(`Mercury Terminal Alert: ${message}`);
    } finally {
      setUploading(false);
      setIsConverting(false);
      setConversionStep(0);
      setDocxFileToProcess(null);
    }
  };


  const deleteHistoryItem = (tokenToDelete: string) => {
    const updated = historyItems.filter(item => item.token !== tokenToDelete);
    setHistoryItems(updated);
    localStorage.setItem("xeroxq_history", JSON.stringify(updated));
  };

  if (notFound) {
    return (
      <main className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-10 border border-black/5 shadow-2xl rounded-[5.57px] max-w-[400px] w-full flex flex-col items-center text-center"
        >
          <div className="w-16 h-16 bg-red-50 rounded-[5.57px] flex items-center justify-center mb-6 border border-red-100">
            <Store className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-[24px] font-black text-black tracking-tight mb-2">Shop Offline</h1>
          <p className="text-[14px] font-medium text-auth-slate-50 mb-8 leading-relaxed">
            This shop does not exist or is no longer active, yaar.
          </p>
          <Button 
            onClick={() => window.location.href = "/"} 
            className="w-full h-12 bg-black text-white hover:bg-black/90 font-bold rounded-[5.57px] transition-all"
          >
            Go Back Home
          </Button>
        </motion.div>
      </main>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex flex-col items-center">
        {/* Skeleton App Bar */}
        <div className="sticky top-0 z-50 w-full flex justify-center px-4 sm:px-6 py-4 bg-[#FDFDFD]/80 backdrop-blur-md">
           <div className="w-full max-w-[800px] bg-white border border-black/5 rounded-[5.57px] px-6 py-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                 <Skeleton className="w-11 h-11 rounded-[5.57px]" />
                 <div className="flex flex-col gap-2">
                    <Skeleton className="w-32 h-5" />
                    <Skeleton className="w-20 h-3" />
                 </div>
              </div>
              <div className="flex gap-2">
                 <Skeleton className="w-24 h-9 rounded-lg" />
                 <Skeleton className="w-10 h-10 rounded-full" />
              </div>
           </div>
        </div>

        {/* Skeleton Main Work Area */}
        <div className="w-full max-w-[800px] px-4 sm:px-6 py-12 space-y-12">
            
           {/* Section 1: Interaction Card Skeleton */}
           <div className="space-y-6">
              <div className="flex items-center justify-between">
                 <div className="space-y-2">
                    <Skeleton className="w-48 h-8" />
                    <Skeleton className="w-64 h-4" />
                 </div>
                 <Skeleton className="w-24 h-6 rounded-full" />
              </div>
              
              <div className="bg-white border border-black/5 rounded-[32px] p-8 shadow-sm space-y-8">
                 <div className="flex flex-col items-center py-10 space-y-4 border-2 border-dashed border-black/5 rounded-[24px]">
                    <Skeleton className="w-16 h-16 rounded-full" />
                    <Skeleton className="w-48 h-6" />
                    <Skeleton className="w-32 h-4" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-14 rounded-2xl" />
                    <Skeleton className="h-14 rounded-2xl" />
                 </div>
                 <Skeleton className="w-full h-14 rounded-2xl" />
              </div>
           </div>

           {/* Section 2: Sidebar/History Skeleton */}
           <div className="space-y-6">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-lg" />
                    <Skeleton className="w-40 h-6" />
                 </div>
                 <Skeleton className="w-16 h-4" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {[...Array(2)].map((_, i) => (
                    <div key={i} className="p-6 bg-white border border-black/5 rounded-[24px] space-y-4">
                       <div className="flex justify-between items-start">
                          <Skeleton className="w-10 h-10 rounded-xl" />
                          <Skeleton className="w-20 h-5" />
                       </div>
                       <div className="space-y-2">
                          <Skeleton className="w-full h-5" />
                          <Skeleton className="w-[60%] h-3" />
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFDFD]">
      <main className="flex-1 flex flex-col items-center overflow-x-hidden px-4 sm:px-6 pb-12 font-sans selection:bg-black selection:text-white">
      {/* Target App Bar / Command Strip */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 w-full flex justify-center mb-0 py-2 bg-[#FDFDFD]/80 backdrop-blur-md"
      >
        <div className="w-full max-w-[800px] bg-white/80 backdrop-blur-xl border border-black/5 rounded-[16px] px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-black rounded-[10px] flex items-center justify-center shadow-lg transform -rotate-3 transition-transform hover:rotate-0">
               <Printer className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
               <h1 className="text-[20px] font-black text-black leading-none tracking-tight mb-1">{shop.name}</h1>
               <div className="flex items-center gap-2">
                 <div className={cn("w-1.5 h-1.5 rounded-full", shop.is_open !== false ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-500")} />
                 <span className="text-[10px] font-bold text-auth-slate-50 uppercase tracking-[0.1em]">
                    Shop Status: {shop.is_open !== false ? "Open" : "Closed"}
                 </span>
               </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <button className="h-10 w-10 flex items-center justify-center rounded-[5.57px] border border-black/5 bg-white text-auth-slate-50 hover:text-black hover:bg-black/5 transition-all active:scale-95 shadow-sm">
                  <History className="w-[18px] h-[18px]" />
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh] sm:h-[70vh] bg-white/95 backdrop-blur-3xl border-t border-black/5 p-0 shadow-3xl rounded-t-[5.57px] md:max-w-[700px] md:mx-auto">
                <div className="w-12 h-1.5 bg-black/10 rounded-full mx-auto mt-4 mb-2" />
                <div className="p-8 pb-4">
                  <SheetHeader className="text-left mb-6">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-8 h-8 bg-black rounded-[5.57px] flex items-center justify-center">
                         <History className="w-4 h-4 text-white" />
                      </div>
                      <SheetTitle className="text-[24px] font-black text-black tracking-tight uppercase">Recent Jobs</SheetTitle>
                    </div>
                    <SheetDescription className="text-[13px] text-auth-slate-50 font-medium">Your recent print jobs from this shop.</SheetDescription>
                  </SheetHeader>
                  <div className="flex flex-col gap-4 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar pb-10">
                    {historyItems.length === 0 ? (
                      <div className="py-24 flex flex-col items-center justify-center gap-8 text-center border-2 border-dashed border-black/5 rounded-[5.57px] bg-[#F9F9F9] w-full">
                        <div className="relative">
                          <img 
                            src="/hot-air-balloon.svg" 
                            alt="No Jobs Yet" 
                            className="w-48 h-48 drop-shadow-2xl"
                          />
                        </div>
                        <div className="space-y-2">
                           <p className="text-[18px] font-black text-black tracking-tight uppercase">History Clear</p>
                           <p className="text-[12px] font-bold text-auth-slate-30 uppercase tracking-[0.15em] max-w-[240px] px-4">Ready for your first high-fidelity print job?</p>
                        </div>
                      </div>
                    ) : historyItems.map((item) => (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={item.token} 
                        className="p-5 bg-white border border-black/5 rounded-[12px] flex items-center justify-between group shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="flex flex-col min-w-0 pr-4">
                          <p className="text-[14px] font-black text-black truncate mb-0.5">{item.fileName}</p>
                          <p className="text-[10px] text-auth-slate-50 font-bold uppercase tracking-wider opacity-60">
                            {item.token} • {new Date(item.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="h-9 w-9 bg-black/5 border border-black/5 rounded-[6px] flex items-center justify-center">
                             <span className="text-[14px] font-black text-black">{item.token}</span>
                           </div>
                           <Dialog>
                             <DialogTrigger asChild>
                               <button className="w-8 h-8 flex items-center justify-center text-auth-slate-30 hover:text-red-500 transition-colors">
                                 <Trash2 className="w-4 h-4" />
                               </button>
                             </DialogTrigger>
                             <DialogContent className="sm:max-w-md rounded-[5.57px] p-8 bg-white border border-[#E2E8F0] shadow-2xl">
                               <DialogHeader className="text-left mb-6">
                                 <div className="w-10 h-10 bg-red-50 rounded-[5.57px] flex items-center justify-center mb-3 shadow-lg shadow-red-100/50">
                                   <Trash2 className="w-5 h-5 text-red-500" />
                                 </div>
                                 <DialogTitle className="text-[20px] font-bold text-black tracking-tight">Delete From History?</DialogTitle>
                                 <DialogDescription className="font-bold tracking-[0.1em] text-auth-slate-50 text-[10px] uppercase leading-relaxed">
                                   This will remove the job record from your device's history. This cannot be undone.
                                 </DialogDescription>
                               </DialogHeader>
                               <div className="flex gap-3 pt-2">
                                 <DialogClose asChild>
                                    <button className="flex-1 h-[40px] bg-white border border-[#E2E8F0] text-black hover:bg-[#F8FAFC] rounded-[5.57px] text-[12px] font-bold transition-all">
                                      Abort
                                    </button>
                                 </DialogClose>
                                 <button 
                                   onClick={() => deleteHistoryItem(item.token)}
                                   className="flex-1 h-[40px] bg-red-500 text-white hover:bg-red-600 rounded-[5.57px] text-[12px] font-bold transition-all shadow-lg shadow-red-500/20"
                                 >
                                   Confirm Delete
                                 </button>
                               </div>
                             </DialogContent>
                           </Dialog>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </motion.div>

      {/* Main Container Core */}
      <AnimatePresence mode="wait">
        {token ? (
          <motion.div 
            key="success"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-[480px] bg-white border border-black/5 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.12)] rounded-[5.57px] p-8 sm:p-12 text-center mt-12"
          >
            <motion.div 
               animate={{ rotate: 360 }}
               transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
               className="w-20 h-20 bg-green-50 rounded-[5.57px] flex items-center justify-center mx-auto mb-8 border border-green-100 shadow-inner"
            >
               <CheckCircle2 className="w-10 h-10 text-green-600" />
            </motion.div>
            
            <h2 className="text-[28px] font-black tracking-tight text-black leading-none mb-3 uppercase">File Sent!</h2>
            <div className="flex items-center justify-center gap-2 mb-8">
               <div className={cn("w-2 h-2 rounded-full", jobStatus === 'printed' ? "bg-green-500" : "bg-orange-500 animate-pulse")} />
               <span className="text-[11px] font-black tracking-[0.15em] uppercase text-auth-slate-50">
                  Status: {jobStatus === 'printed' ? "Printed" : "Waiting for Shop"}
               </span>
            </div>

            <AnimatePresence>
              {jobStatus === 'printed' && (
                <motion.div 
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="mb-8 p-5 bg-emerald-500 text-white rounded-[5.57px] shadow-[0_20px_40px_rgba(16,185,129,0.2)] flex flex-col items-center gap-2 relative overflow-hidden"
                >
                  <motion.div 
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="flex items-center gap-2"
                  >
                    <Printer className="w-5 h-5" />
                    <span className="text-[14px] font-black uppercase tracking-widest">Your Print is Ready!</span>
                  </motion.div>
                  <p className="text-[10px] font-bold opacity-80 uppercase tracking-tight">Collect your documents from the counter now</p>
                  <div className="absolute top-0 left-0 w-full h-1 bg-white/20" />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="py-12 bg-black rounded-[5.57px] mb-8 shadow-2xl relative overflow-hidden group">
               <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
               <p className="text-[11px] font-black tracking-[0.2em] text-white/40 uppercase mb-4">{shop?.generate_token !== false ? "Your Print Code" : "Status Registered"}</p>
               <span className="text-[88px] font-black tracking-tighter text-white leading-none inline-block">
                  {shop?.generate_token !== false ? token : <CheckCircle2 className="w-20 h-20" />}
               </span>
            </div>

            <p className="text-[14px] font-medium text-auth-slate-50 leading-relaxed mb-10 max-w-[320px] mx-auto">
               {location === 'home' ? (
                 `Your file has been sent successfully. The shopkeeper will process it and you'll be notified here when it's ready, yaar.`
               ) : (
                 shop?.generate_token !== false 
                   ? `Tell me your name (${customerName || 'Guest'}) and verify with this 2-digit code at the counter, yaar.`
                   : `Your file from ${customerName || 'Guest'} has been added to the queue. Verify at the counter to print.`
               )}
            </p>

            <button 
               onClick={() => window.location.reload()}
               className="w-full h-14 bg-black text-white hover:bg-black/90 font-black text-[14px] rounded-[5.57px] transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-black/20"
            >
               Finish & Start New
            </button>

            {location === 'home' && (
               <div className="mt-8 p-6 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[18px] text-left shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg transform -rotate-3">
                      <Smartphone className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex flex-col">
                      <p className="text-[14px] font-black text-black uppercase tracking-tight">Premium Pre-order</p>
                      <p className="text-[9px] font-bold text-auth-slate-30 uppercase tracking-widest">Home / Work Service</p>
                    </div>
                  </div>
                  <p className="text-[13px] font-medium text-auth-slate-50 leading-relaxed mb-6">
                    Since you are ordering from home, your job has been prioritized and marked as <b>ONLINE PAID</b>. No need to visit the shop until it's ready.
                  </p>
                  <a 
                    href={`tel:${shop?.contact_number || ''}`}
                    className="flex items-center justify-center gap-3 w-full h-12 bg-white border-2 border-black/5 rounded-[12px] text-[13px] font-black uppercase hover:bg-black hover:text-white hover:border-black transition-all shadow-sm"
                  >
                    <Smartphone className="w-4 h-4" />
                    Call Shop: {shop?.contact_number || '9849497911'}
                  </a>
               </div>
             )}
          </motion.div>
        ) : (
          <motion.div 
            key="upload"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-[600px] flex flex-col items-center pt-12 pb-12"
          >
            <div className="text-center mb-10">
               <motion.div 
                 initial={{ y: -10, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 className="flex items-center justify-center gap-3 mb-4"
               >
                 <Zap className="w-5 h-5 text-black" />
                 <span className="text-[11px] font-black tracking-[0.25em] text-auth-slate-50 uppercase">Mercury Print Protocol</span>
               </motion.div>
               <h2 className="text-[40px] font-black tracking-tight text-auth-slate-90 leading-[0.9] mb-4">
                  Send Document
               </h2>
               <p className="text-[15px] font-medium text-auth-slate-50 leading-relaxed max-w-[420px]">
                 Upload your document here for instant printing. Safe and secure document sharing.
               </p>
            </div>

            <div className="w-full bg-white border border-black/5 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.08)] rounded-[5.57px] p-2 md:p-8 overflow-hidden relative">
               <input
                 type="file"
                 ref={fileInputRef}
                 className="hidden"
                 onChange={handleFileChange}
                 accept="*/*"
               />
               {shop.is_open === false ? (
                 <div className="p-10 flex flex-col items-center text-center">
                   <div className="w-20 h-20 bg-red-50 border border-red-100 rounded-[5.57px] flex items-center justify-center mb-8 transform rotate-3">
                      <ShieldCheck className="w-10 h-10 text-red-500" />
                   </div>
                   <h3 className="text-[24px] font-black text-black tracking-tight uppercase mb-2">Shop Closed</h3>
                   <p className="text-[14px] font-medium text-auth-slate-50 max-w-[300px]">
                     This shop is not accepting documents right now. Come back when we're open, yaar.
                   </p>
                 </div>
               ) : shop.accept_preorders && !locationConfirmed ? (
                  <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="text-center">
                      <p className="text-[11px] font-black tracking-[0.25em] text-auth-slate-50 uppercase mb-4">Select Service Type</p>
                      <h3 className="text-[22px] font-black text-black tracking-tight leading-none">Where are you?</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button 
                        onClick={() => setLocation('shop')}
                        className={cn(
                          "flex flex-col items-center gap-4 p-6 border-2 transition-all rounded-[12px] group relative overflow-hidden",
                          location === 'shop' ? "border-black bg-black text-white shadow-xl" : "border-black/5 bg-white hover:border-black/20"
                        )}
                      >
                        <Store className={cn("w-10 h-10 transition-transform group-hover:scale-110", location === 'shop' ? "text-white" : "text-black/40 group-hover:text-black")} />
                        <div className="text-center">
                          <p className="text-[14px] font-black uppercase">At Shop</p>
                          <p className={cn("text-[10px] font-bold opacity-60", location === 'shop' ? "text-white/70" : "text-auth-slate-50")}>Pay at counter</p>
                        </div>
                        {location === 'shop' && <motion.div layoutId="loc-active" className="absolute top-2 right-2"><CheckCircle2 className="w-4 h-4 text-white" /></motion.div>}
                      </button>
                      
                      <button 
                        onClick={() => setLocation('home')}
                        className={cn(
                          "flex flex-col items-center gap-4 p-6 border-2 transition-all rounded-[12px] group relative overflow-hidden",
                          location === 'home' ? "border-black bg-black text-white shadow-xl" : "border-black/5 bg-white hover:border-black/20"
                        )}
                      >
                        <Smartphone className={cn("w-10 h-10 transition-transform group-hover:scale-110", location === 'home' ? "text-white" : "text-black/40 group-hover:text-black")} />
                        <div className="text-center">
                          <p className="text-[14px] font-black uppercase">Home / Work</p>
                          <p className={cn("text-[10px] font-bold opacity-60", location === 'home' ? "text-white/70" : "text-auth-slate-50")}>Pay online (Pre-order)</p>
                        </div>
                        {location === 'home' && <motion.div layoutId="loc-active" className="absolute top-2 right-2"><CheckCircle2 className="w-4 h-4 text-white" /></motion.div>}
                      </button>
                    </div>

                    <div className="flex justify-center">
                      <button 
                        onClick={() => setLocationConfirmed(true)}
                        className="h-14 px-12 bg-black text-white rounded-full font-black text-[14px] uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                      >
                        <span>Next Step</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
               ) : !file ? (
                 <motion.div 
                   whileHover={{ scale: 0.995 }}
                   className="w-full min-h-[340px] border-2 border-dashed border-black/10 rounded-[5.57px] flex flex-col items-center justify-center gap-6 bg-[#F9F9F9]/50 hover:bg-[#F9F9F9] transition-all cursor-pointer p-8 group relative overflow-hidden"
                   onClick={() => fileInputRef.current?.click()}
                 >
                    <motion.div 
                      whileHover={{ y: -5 }}
                      className="w-20 h-20 bg-white border border-black/5 shadow-2xl rounded-[5.57px] flex items-center justify-center relative z-10"
                    >
                       <Upload className="w-8 h-8 text-black" />
                    </motion.div>
                    <div className="text-center relative z-10">
                       <p className="text-[20px] font-black text-black tracking-tight">Upload Document</p>
                       <p className="text-[11px] font-black tracking-[0.1em] text-auth-slate-30 uppercase mt-2">Supported Files: Any Format</p>
                       {shop.accept_preorders && (
                         <div className="mt-4 flex items-center justify-center gap-2">
                           <Badge variant="outline" className="bg-black/5 border-none text-[9px] font-black uppercase tracking-widest px-3 py-1">
                             {location === 'home' ? "Pre-order Mode" : "At Counter Mode"}
                           </Badge>
                           <button onClick={() => setLocationConfirmed(false)} className="text-[9px] font-black uppercase tracking-widest text-auth-slate-30 hover:text-black transition-colors underline decoration-black/10 underline-offset-4">Change Location</button>
                         </div>
                       )}
                    </div>
                    
                    {/* Background visual cues */}
                    <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-black/5 rounded-full blur-3xl group-hover:bg-black/10 transition-colors" />
                    <div className="absolute -top-8 -left-8 w-32 h-32 bg-black/5 rounded-full blur-3xl group-hover:bg-black/10 transition-colors" />
                 </motion.div>
               ) : (
                 <motion.div 
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="flex flex-col gap-8 p-4 md:p-2"
                 >
                    {shop.require_customer_name !== false && (
                      <div className="flex flex-col gap-5">
                         <div className="flex items-center justify-between ml-1">
                            <label className="text-[11px] font-black tracking-[0.2em] text-auth-slate-50 uppercase">Your Name</label>
                            {customerName && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full uppercase tracking-widest animate-fade-in">Valid</span>}
                         </div>
                         <input 
                            type="text" 
                            placeholder="Enter your name..."
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full h-14 px-6 text-[16px] font-bold text-black bg-[#F8F8F8] border border-black/5 rounded-[5.57px] focus:bg-white focus:shadow-xl focus:border-black/10 transition-all outline-none"
                         />
                      </div>
                    )}

                    <div className="flex items-center gap-5 p-5 border border-black/5 rounded-[18px] bg-[#F8F8F8] group">
                       <div className="w-14 h-14 bg-white border border-black/5 rounded-[14px] shrink-0 flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110 relative">
                          <FileText className="w-7 h-7 text-black" />
                          <div className="absolute -top-1 -right-1 bg-red-500 text-[8px] font-black text-white px-1.5 py-0.5 rounded-[4px] uppercase tracking-tighter">
                             {file.name.split('.').pop()}
                          </div>
                       </div>
                       <div className="flex-1 min-w-0 flex flex-col">
                          <span className="text-[15px] font-black text-black truncate">{file.name}</span>
                          <span className="text-[11px] font-bold tracking-wider text-auth-slate-50 uppercase mt-1 opacity-60">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                       </div>
                       <button 
                         onClick={() => setFile(null)}
                         className="w-11 h-11 flex items-center justify-center bg-white border border-black/5 rounded-[10px] text-auth-slate-30 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm active:scale-95"
                       >
                          <Trash2 className="w-5 h-5" />
                       </button>
                    </div>

                    {/* Single Column Preferences Stack */}
                    <div className="flex flex-col gap-6">
                      {/* 1. Color Mode Row */}
                      {(shop.show_color_mode !== false || location === 'home') && (
                        <div className="flex flex-col gap-3">
                          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-auth-slate-50 ml-1">Color Preference</span>
                          <button 
                            type="button"
                            onClick={() => setPreferences({ ...preferences, color: !preferences.color })}
                            className={cn(
                              "flex items-center justify-between px-6 h-14 rounded-[14px] border transition-all relative overflow-hidden group",
                              preferences.color 
                                ? "bg-gradient-to-r from-[#FF512F] via-[#DD2476] to-[#6A11CB] text-white border-transparent shadow-lg shadow-purple-500/20" 
                                : "bg-[#F8F8F8] border-black/5 text-black"
                            )}
                          >
                            <div className="flex items-center gap-3 relative z-10">
                              <Palette className={cn("w-4 h-4", preferences.color ? "text-white" : "text-black/40")} />
                              <span className="text-[14px] font-black uppercase">{preferences.color ? "Full Color Print" : "Black & White"}</span>
                            </div>
                            <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center relative z-10", preferences.color ? "border-white bg-white" : "border-black/10")}>
                              {preferences.color && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
                            </div>
                            {preferences.color && <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />}
                          </button>
                        </div>
                      )}

                      {/* 2. Copies Row */}
                      {shop.show_copies !== false && (
                        <div className="flex flex-col gap-3">
                          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-auth-slate-50 ml-1">Quantity / Copies</span>
                          <div className="flex items-center justify-between h-14 px-2 bg-[#F8F8F8] border border-black/5 rounded-[14px] group hover:border-black/10 transition-all">
                             <motion.button 
                               type="button" 
                               whileTap={{ scale: 0.95 }} 
                               onClick={() => setPreferences({ ...preferences, copies: Math.max(1, preferences.copies - 1) })} 
                               className="w-10 h-10 flex items-center justify-center rounded-[10px] bg-white border border-black/5 text-black font-black text-[22px] shadow-sm hover:bg-[#FDFDFD]"
                             >
                               -
                             </motion.button>
                             <div className="flex flex-col items-center leading-none">
                               <span className="font-black text-[18px] text-black tabular-nums">{preferences.copies}</span>
                               <span className="text-[9px] font-bold text-auth-slate-30 uppercase tracking-widest">{preferences.copies > 1 ? 'Total Copies' : 'Single Copy'}</span>
                             </div>
                             <motion.button 
                               type="button" 
                               whileTap={{ scale: 0.95 }} 
                               onClick={() => setPreferences({ ...preferences, copies: preferences.copies + 1 })} 
                               className="w-10 h-10 flex items-center justify-center rounded-[10px] bg-white border border-black/5 text-black font-black text-[22px] shadow-sm hover:bg-[#FDFDFD]"
                             >
                               +
                             </motion.button>
                          </div>
                        </div>
                      )}

                      {/* 3. Side Preference Row */}
                      <div className="flex flex-col gap-3">
                         <span className="text-[11px] font-black uppercase tracking-[0.2em] text-auth-slate-50 ml-1">Side Preference</span>
                         <button 
                           type="button"
                           onClick={() => setPreferences({ ...preferences, doubleSided: !preferences.doubleSided })}
                           className={cn(
                             "flex items-center justify-between px-6 h-14 rounded-[14px] border transition-all",
                             preferences.doubleSided ? "bg-black text-white border-black shadow-lg shadow-black/10" : "bg-[#F8F8F8] border-black/5 text-black"
                           )}
                         >
                           <div className="flex items-center gap-3">
                             <FileText className={cn("w-4 h-4", preferences.doubleSided ? "text-white" : "text-black/40")} />
                             <span className="text-[14px] font-black uppercase">{preferences.doubleSided ? "Double Sided Print" : "Single Sided Print"}</span>
                           </div>
                           <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", preferences.doubleSided ? "border-white bg-white" : "border-black/10")}>
                             {preferences.doubleSided && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
                           </div>
                         </button>
                      </div>
                    </div>

                    {location === 'home' && (
                      <div className="flex flex-col gap-4 mt-2">
                        <label className="text-[11px] font-black tracking-[0.2em] text-auth-slate-50 uppercase ml-1">Your Mobile Number</label>
                        <input 
                          type="tel" 
                          placeholder="+91 XXXXX XXXXX"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="w-full h-14 px-6 text-[16px] font-bold text-black bg-[#F8F8F8] border border-black/5 rounded-[5.57px] outline-none focus:bg-white transition-all"
                        />
                      </div>
                    )}

                    {location === 'home' && (
                       <div className="p-6 bg-black text-white rounded-[18px] flex items-center justify-between shadow-2xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.05] rounded-full blur-2xl" />
                          <div className="flex flex-col relative z-10">
                             <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Total Est. Price</span>
                             <div className="flex items-baseline gap-1">
                                <span className="text-[24px] font-black">₹{((preferences.color ? (shop?.price_color || 0) : (shop?.price_mono || 0)) * (preferences.doubleSided ? Math.ceil(detectedPages / 2) : detectedPages) * preferences.copies).toFixed(2)}</span>
                                <span className={cn("text-[10px] font-bold uppercase", isPricingLoading ? "animate-pulse text-auth-slate-30" : "opacity-60 text-white")}>
                                  {isPricingLoading ? "Calculating Pages..." : `${detectedPages} Pages`}
                                </span>
                             </div>
                          </div>
                          <div className="text-right relative z-10">
                             <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Includes</span>
                             <p className="text-[12px] font-black uppercase">{preferences.copies} Copies • {preferences.color ? 'Color' : 'Mono'}</p>
                          </div>
                       </div>
                    )}

                    <button 
                       onClick={() => {
                          const active = docxFileToProcess || file;
                          if (active?.name.toLowerCase().endsWith('.docx')) {
                            setShowDocxChoice(true);
                          } else {
                            handleUpload();
                          }
                       }}

                       disabled={uploading || (shop.require_customer_name !== false && !customerName.trim()) || (location === 'home' && !customerPhone.trim())}
                       className="w-full h-14 bg-black text-white hover:bg-black/90 disabled:bg-black/10 disabled:text-black/20 font-black text-[15px] tracking-tight rounded-[5.57px] transition-all flex items-center justify-center gap-3 shadow-2xl shadow-black/20 transform hover:scale-[1.01] active:scale-[0.99]"
                    >
                       {uploading ? (
                         <div className="flex items-center gap-3">
                           <RefreshCw className="w-5 h-5 animate-spin" />
                           <span className="text-[12px] uppercase tracking-wider">
                             {isConverting ? (
                                conversionStep === 1 ? "Preparing File..." :
                                conversionStep === 2 ? "Converting Document..." :
                                "Finishing PDF..."
                             ) : "Sending to Shop..."}
                           </span>
                         </div>
                       ) : (
                         <div className="flex items-center gap-2">
                            <Zap className={cn("w-4 h-4", location === 'home' ? "animate-pulse" : "")} />
                            <span>{location === 'home' ? "Authorize & Send to Shop" : "Send to Shop Terminal"}</span>
                         </div>
                       )}
                    </button>

                 </motion.div>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={showDocxChoice} onOpenChange={setShowDocxChoice}>
        <DialogContent className="sm:max-w-[425px] bg-white rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
          <div className="p-8">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <DialogHeader className="text-left p-0">
              <DialogTitle className="text-2xl font-black text-black">Optimize Document?</DialogTitle>
              <DialogDescription className="text-[15px] font-medium text-auth-slate-30 mt-2">
                We can convert your Word document to a professional PDF to ensure pixel-perfect printing at the shop.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="flex flex-col gap-3 p-8 pt-0">
            <Button 
              onClick={() => { setShowDocxChoice(false); handleUpload('pdf'); }}
              className="w-full h-14 bg-black text-white hover:bg-black/90 font-black text-[15px] rounded-2xl transition-all shadow-xl shadow-black/10"
            >
              <Zap className="w-5 h-5 mr-2 text-yellow-400 fill-yellow-400" /> 
              Convert to PDF (Recommended)
            </Button>
            <Button 
              variant="outline"
              onClick={() => { setShowDocxChoice(false); handleUpload('raw'); }}
              className="w-full h-14 border-2 border-black/5 bg-white text-black hover:bg-black/5 font-black text-[15px] rounded-2xl transition-all"
            >
              Send Original Docx
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </main>
      <SiteFooter />
    </div>
  );
}
