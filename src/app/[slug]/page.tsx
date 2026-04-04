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
  History
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { generateToken, cn } from "@/lib/utils";

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
  const [preferences, setPreferences] = useState({
    color: false,
    copies: 1,
    doubleSided: false,
  });
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [jobStatus, setJobStatus] = useState<string>("pending");

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
        console.error("Shop Connection Error:", error);
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
          setJobStatus(payload.new.status);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [token]);

  const handleUpload = async () => {
    if (!file || !shop) return;
    
    const fileExt = file.name.split(".").pop()?.toLowerCase();
    const needsConversion = ["docx", "doc", "xlsx"].includes(fileExt || "");
    
    setUploading(true);
    if (needsConversion) setIsConverting(true);

    try {
      let finalFile: File | Blob = file;
      let finalFileName = file.name;
      
      // 1. Preparing the document
      if (needsConversion) {
        setConversionStep(1); // Optimizing Signal
        const convFormData = new FormData();
        convFormData.append("file", file);
        
        // Minor delay to show the first step
        await new Promise(r => setTimeout(r, 800));
        setConversionStep(2); // Connecting to Agent

        const response = await fetch("/api/agent", {
          method: "POST",
          body: convFormData,
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Agent conversion failed");
        }

        setConversionStep(3); // Wrapping Payload
        finalFile = await response.blob();
        finalFileName = `${file.name.replace(/\.[^/.]+$/, "")}.pdf`;
      }

      const finalExt = finalFileName.split(".").pop();
      const storagePath = `${Math.random().toString(36).substring(2)}.${finalExt}`;

      // 2. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(storagePath, finalFile);

      if (uploadError) throw uploadError;

      // 3. Insert into DB (with Retry Logic for collisions)
      let newToken = "";
      let dbError: any = null;
      let retries = 3;

      while (retries > 0) {
        newToken = generateToken();
        const { error } = await supabase.from("jobs").insert({
          token: newToken,
          customer_name: customerName || "Guest",
          file_path: storagePath,
          file_name: finalFileName,
          preferences: preferences,
          shop_id: shop.id,
          expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        });

        if (!error) {
          dbError = null;
          break;
        }

        dbError = error;
        // Only retry if it's a unique constraint violation on the token
        if (error.code === "23505" && error.message?.includes("jobs_token_key")) {
          retries--;
          console.warn(`[Portal] Token Collision (${newToken}). Retrying... (${retries} left)`);
          continue;
        }
        
        // If it's a different error, break and throw
        break;
      }

      if (dbError) throw dbError;

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
    } catch (error: any) {
      console.error("Upload failed details:", {
        message: error.message,
        name: error.name,
        status: error.status || error.statusCode,
        raw: error
      });
      alert(error.message || "Upload failed. Please check your connection and try again.");
    } finally {
      setUploading(false);
      setIsConverting(false);
      setConversionStep(0);
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
          className="bg-white p-10 border border-black/5 shadow-2xl rounded-[16px] max-w-[400px] w-full flex flex-col items-center text-center"
        >
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6 border border-red-100">
            <Store className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-[24px] font-black text-black tracking-tight mb-2">Shop Offline</h1>
          <p className="text-[14px] font-medium text-auth-slate-50 mb-8 leading-relaxed">
            This shop does not exist or is no longer active, yaar.
          </p>
          <Button 
            onClick={() => window.location.href = "/"} 
            className="w-full h-12 bg-black text-white hover:bg-black/90 font-bold rounded-[8px] transition-all"
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
           <div className="w-full max-w-[800px] bg-white border border-black/5 rounded-[16px] px-6 py-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                 <Skeleton className="w-11 h-11 rounded-[10px]" />
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
    <main className="min-h-screen bg-[#FDFDFD] flex flex-col items-center overflow-x-hidden px-4 sm:px-6 pb-12 font-sans selection:bg-black selection:text-white">
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
                <button className="h-10 w-10 flex items-center justify-center rounded-[10px] border border-black/5 bg-white text-auth-slate-50 hover:text-black hover:bg-black/5 transition-all active:scale-95 shadow-sm">
                  <History className="w-[18px] h-[18px]" />
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh] sm:h-[70vh] bg-white/95 backdrop-blur-3xl border-t border-black/5 p-0 shadow-3xl rounded-t-[32px] md:max-w-[700px] md:mx-auto">
                <div className="w-12 h-1.5 bg-black/10 rounded-full mx-auto mt-4 mb-2" />
                <div className="p-8 pb-4">
                  <SheetHeader className="text-left mb-6">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-8 h-8 bg-black rounded-[8px] flex items-center justify-center">
                         <History className="w-4 h-4 text-white" />
                      </div>
                      <SheetTitle className="text-[24px] font-black text-black tracking-tight uppercase">Recent Jobs</SheetTitle>
                    </div>
                    <SheetDescription className="text-[13px] text-auth-slate-50 font-medium">Your recent print jobs from this shop.</SheetDescription>
                  </SheetHeader>
                  <div className="flex flex-col gap-4 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar pb-10">
                    {historyItems.length === 0 ? (
                      <div className="py-20 flex flex-col items-center gap-4 text-center border-2 border-dashed border-black/5 rounded-[12px]">
                        <Clock className="w-8 h-8 text-auth-slate-20" />
                        <p className="text-[14px] font-bold text-auth-slate-30">No Active Data</p>
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
                             <DialogContent className="sm:max-w-md rounded-[32px] p-8 bg-white border border-[#E2E8F0] shadow-2xl">
                               <DialogHeader className="text-left mb-6">
                                 <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-red-100/50">
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
            className="w-full max-w-[480px] bg-white border border-black/5 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.12)] rounded-[24px] p-8 sm:p-12 text-center mt-12"
          >
            <motion.div 
               animate={{ rotate: 360 }}
               transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
               className="w-20 h-20 bg-green-50 rounded-[24px] flex items-center justify-center mx-auto mb-8 border border-green-100 shadow-inner"
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

            <div className="py-12 bg-black rounded-[20px] mb-8 shadow-2xl relative overflow-hidden group">
               <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
               <p className="text-[11px] font-black tracking-[0.2em] text-white/40 uppercase mb-4">Your Print Code</p>
               <span className="text-[88px] font-black tracking-tighter text-white leading-none inline-block">
                  {token}
               </span>
            </div>

            <p className="text-[14px] font-medium text-auth-slate-50 leading-relaxed mb-10 max-w-[320px] mx-auto">
               Tell me your name (<span className="text-black font-black uppercase">{customerName}</span>) and verify with this 4-character code at the counter, yaar.
            </p>

            <button 
               onClick={() => window.location.reload()}
               className="w-full h-14 bg-black text-white hover:bg-black/90 font-black text-[14px] rounded-[12px] transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-black/20"
            >
               Finish & Start New
            </button>
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

            <div className="w-full bg-white border border-black/5 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.08)] rounded-[24px] p-2 md:p-8 overflow-hidden">
               {shop.is_open === false ? (
                 <div className="p-10 flex flex-col items-center text-center">
                   <div className="w-20 h-20 bg-red-50 border border-red-100 rounded-[20px] flex items-center justify-center mb-8 transform rotate-3">
                      <ShieldCheck className="w-10 h-10 text-red-500" />
                   </div>
                   <h3 className="text-[24px] font-black text-black tracking-tight uppercase mb-2">Shop Closed</h3>
                   <p className="text-[14px] font-medium text-auth-slate-50 max-w-[300px]">
                     This shop is not accepting documents right now. Come back when we're open, yaar.
                   </p>
                 </div>
               ) : !file ? (
                 <motion.div 
                   whileHover={{ scale: 0.995 }}
                   className="w-full min-h-[340px] border-2 border-dashed border-black/10 rounded-[18px] flex flex-col items-center justify-center gap-6 bg-[#F9F9F9]/50 hover:bg-[#F9F9F9] transition-all cursor-pointer p-8 group relative overflow-hidden"
                   onClick={() => fileInputRef.current?.click()}
                 >
                   <input
                     type="file"
                     ref={fileInputRef}
                     className="hidden"
                     onChange={(e) => setFile(e.target.files?.[0] || null)}
                     accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                   />
                   <motion.div 
                     whileHover={{ y: -5 }}
                     className="w-20 h-20 bg-white border border-black/5 shadow-2xl rounded-[20px] flex items-center justify-center relative z-10"
                   >
                      <Upload className="w-8 h-8 text-black" />
                   </motion.div>
                   <div className="text-center relative z-10">
                      <p className="text-[20px] font-black text-black tracking-tight">Upload Document</p>
                      <p className="text-[11px] font-black tracking-[0.1em] text-auth-slate-30 uppercase mt-2">Supported Files: PDF/DOCX/IMG</p>
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
                          className="w-full h-14 px-6 text-[16px] font-bold text-black bg-[#F8F8F8] border border-black/5 rounded-[14px] focus:bg-white focus:shadow-xl focus:border-black/10 transition-all outline-none"
                       />
                    </div>

                    <div className="flex items-center gap-5 p-5 border border-black/5 rounded-[18px] bg-[#F8F8F8] group">
                       <div className="w-14 h-14 bg-white border border-black/5 rounded-[14px] shrink-0 flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110">
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

                    <div className="grid grid-cols-2 gap-8">
                       <div className="flex flex-col gap-4">
                          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-auth-slate-50 ml-1">Color Mode</span>
                          <div className="flex bg-[#F8F8F8] border border-black/5 rounded-[14px] p-1.5 h-[54px] shadow-inner">
                             <button 
                               onClick={() => setPreferences({ ...preferences, color: false })}
                               className={cn(
                                 "flex-1 h-full text-[12px] font-black uppercase tracking-[0.1em] rounded-[10px] transition-all",
                                 !preferences.color ? "bg-white shadow-xl text-black" : "text-auth-slate-30 hover:text-black hover:bg-white/50"
                               )}
                             >Mono</button>
                             <button 
                               onClick={() => setPreferences({ ...preferences, color: true })}
                               className={cn(
                                 "flex-1 h-full text-[12px] font-black uppercase tracking-[0.1em] rounded-[10px] transition-all",
                                 preferences.color ? "bg-white shadow-xl text-black" : "text-auth-slate-30 hover:text-black hover:bg-white/50"
                               )}
                             >Color</button>
                          </div>
                       </div>
                       
                       <div className="flex flex-col gap-4">
                          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-auth-slate-50 ml-1">Copies</span>
                          <div className="flex items-center justify-between h-[54px] px-2 bg-[#F8F8F8] border border-black/5 rounded-[14px] shadow-inner">
                             <motion.button whileTap={{ scale: 0.9 }} onClick={() => setPreferences({ ...preferences, copies: Math.max(1, preferences.copies - 1) })} className="w-10 h-10 flex items-center justify-center rounded-[8px] bg-white border border-black/5 text-black font-black text-[22px] shadow-sm hover:bg-white/80">-</motion.button>
                             <span className="font-black text-[18px] text-black tabular-nums">{preferences.copies}</span>
                             <motion.button whileTap={{ scale: 0.9 }} onClick={() => setPreferences({ ...preferences, copies: preferences.copies + 1 })} className="w-10 h-10 flex items-center justify-center rounded-[8px] bg-white border border-black/5 text-black font-black text-[22px] shadow-sm hover:bg-white/80">+</motion.button>
                          </div>
                       </div>
                    </div>

                    <button 
                       onClick={handleUpload}
                       disabled={uploading || !customerName.trim()}
                       className="w-full h-14 bg-black text-white hover:bg-black/90 disabled:bg-black/10 disabled:text-black/20 font-black text-[15px] tracking-tight rounded-[16px] transition-all flex items-center justify-center gap-3 shadow-2xl shadow-black/20 transform hover:scale-[1.01] active:scale-[0.99]"
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
                         <>Print Now <ArrowRight className="w-6 h-6" /></>
                       )}
                    </button>
                 </motion.div>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
