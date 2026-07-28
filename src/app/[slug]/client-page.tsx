"use client";



import { useState, useRef, useEffect, use } from "react";
import { 
  Upload, 
  CheckCircle2, 
  FileText, 
  Printer, 
  ShieldCheck, 
  ShieldAlert,
  Clock, 
  ArrowRight, 
  Store, 
  Zap, 
  Trash2,
  Smartphone,
  RefreshCw,
  History,
  Crop,
  Palette,
  User,
  Phone
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
  show_duplex?: boolean;
  generate_token?: boolean;
  accept_preorders?: boolean;
  contact_number?: string;
  feedback_enabled?: boolean;
  custom_feedback_enabled?: boolean;
  custom_feedback_title?: string;
  total_files_processed?: number;
  approval_status?: string;
}

interface FeedbackQuestion {
  question_id: string;
  question_text: string;
  question_type: string;
  options: string[];
  is_required: boolean;
  display_order: number;
  source: 'default' | 'custom';
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
  const [files, setFiles] = useState<File[]>([]);
  const [batchTokens, setBatchTokens] = useState<{ token: string; fileName: string; jobId: string }[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; percent: number; fileName: string } | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionStep, setConversionStep] = useState(0);
  const [token, setToken] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
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
  const [isDeleted, setIsDeleted] = useState(false);
  const [deletionReason, setDeletionReason] = useState<'user' | 'policy' | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackQuestions, setFeedbackQuestions] = useState<FeedbackQuestion[]>([]);
  const [feedbackResponses, setFeedbackResponses] = useState<Record<string, string>>({});
  const [writtenFeedback, setWrittenFeedback] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackEnabled, setFeedbackEnabled] = useState(true);
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [docxFileToProcess, setDocxFileToProcess] = useState<File | null>(null);
  const [showDocxChoice, setShowDocxChoice] = useState(false);
  
  const [location, setLocation] = useState<'shop' | 'home'>('shop');
  const [customerPhone, setCustomerPhone] = useState("");
  const [detectedPages, setDetectedPages] = useState(1);
  const [isPricingLoading, setIsPricingLoading] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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

  // Live Status Updates + Initial Status Fetch
  useEffect(() => {
    if (!token || !shop) return;

    // Fetch initial job status
    const fetchInitialStatus = async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('status, is_deleted_by_user, is_auto_deleted, file_path, expires_at, created_at')
        .eq('token', token)
        .eq('shop_id', shop.id)
        .maybeSingle();
      
      if (!data || error) {
        setDeletionReason('policy');
        setIsDeleted(true);
      } else if (data.is_deleted_by_user) {
        setDeletionReason('user');
        setIsDeleted(true);
      } else {
        const nowMs = Date.now();
        const createdMs = new Date(data.created_at).getTime();
        const expiresMs = data.expires_at ? new Date(data.expires_at).getTime() : createdMs + 5 * 60 * 1000;
        
        if (data.is_auto_deleted || (data.file_path === null && data.is_deleted_by_user) || (nowMs - createdMs >= 5 * 60 * 1000)) {
          setDeletionReason('policy');
          setIsDeleted(true);
        } else {
          setJobStatus(data.status);
        }
      }
    };
    
    fetchInitialStatus();

    // 3-second background polling to auto-detect 5-minute expiration
    const interval = setInterval(() => {
      fetchInitialStatus();
    }, 3000);

    const channel = supabase
      .channel(`job-status-${token}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "jobs", filter: `token=eq.${token}` },
        (payload) => {
          const newStatus = payload.new.status;
          const isDeletedByUser = payload.new.is_deleted_by_user;
          const isAutoDeleted = payload.new.is_auto_deleted;
          const isFilePathNull = payload.new.file_path === null;
          
          if (isDeletedByUser) {
            setDeletionReason('user');
            setIsDeleted(true);
          } else if (isAutoDeleted || isFilePathNull) {
            setDeletionReason('policy');
            setIsDeleted(true);
          }

          setJobStatus(newStatus);
          
          // High-fidelity intimation when print is ready
          if (newStatus === 'printed') {
            // 1. Play professional ding sound using Web Audio API (zero external network dependency)
            try {
              const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.type = "sine";
              osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
              osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);
              gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.3);
            } catch (e) {
              // Audio context initialization error or browser restriction
            }
            
            // 2. Vibrate device (for mobile users)
            if (window.navigator.vibrate) {
              window.navigator.vibrate([200, 100, 200]);
            }
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "jobs", filter: `token=eq.${token}` },
        () => {
          setIsDeleted(true);
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [token, shop]);

  // ── File Validation Constants ─────────────────────────────────────────────
  const MAX_FILE_SIZE_MB = 25;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
  
  const ALLOWED_FILE_TYPES: Record<string, string[]> = {
    "application/pdf": ["pdf"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
    "application/msword": ["doc"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ["xlsx"],
    "application/vnd.ms-excel": ["xls"],
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": ["pptx"],
    "application/vnd.ms-powerpoint": ["ppt"],
    "text/csv": ["csv"],
    "image/jpeg": ["jpg", "jpeg"],
    "image/png": ["png"],
    "image/webp": ["webp"],
    // Some OS/browsers send octet-stream for office docs — allow it with extension check
    "application/octet-stream": ["pdf", "docx", "doc", "xlsx", "xls", "pptx", "ppt", "csv"],
  };

  const ALL_ALLOWED_EXTENSIONS = new Set(["pdf", "docx", "doc", "xlsx", "xls", "pptx", "ppt", "csv", "jpg", "jpeg", "png", "webp"]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const validFiles: File[] = [];
    for (const selectedFile of selectedFiles) {
      if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
        alert(`File "${selectedFile.name}" is too large (max ${MAX_FILE_SIZE_MB}MB). Skipped.`);
        continue;
      }
      const ext = selectedFile.name.split(".").pop()?.toLowerCase() || "";
      if (!ext || !ALL_ALLOWED_EXTENSIONS.has(ext)) {
        alert(`File "${selectedFile.name}" has an unsupported format. Skipped.`);
        continue;
      }
      validFiles.push(selectedFile);
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      setIsPricingLoading(true);
      detectPageCount(validFiles[0]).then(pages => {
        setDetectedPages(prev => prev + (pages * validFiles.length));
        setIsPricingLoading(false);
      });
    }
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files || []);
    if (droppedFiles.length === 0) return;

    const validFiles: File[] = [];
    for (const file of droppedFiles) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        alert(`File "${file.name}" is too large (max ${MAX_FILE_SIZE_MB}MB). Skipped.`);
        continue;
      }
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      if (!ext || !ALL_ALLOWED_EXTENSIONS.has(ext)) {
        alert(`File "${file.name}" has an unsupported format. Skipped.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      setIsPricingLoading(true);
      detectPageCount(validFiles[0]).then(pages => {
        setDetectedPages(prev => prev + (pages * validFiles.length));
        setIsPricingLoading(false);
      });
    }
  };



  const handleCropComplete = async (croppedDataUrl: string) => {
    if (!cropperImage || files.length === 0) return;
    
    // Convert dataURL to blob
    const res = await fetch(croppedDataUrl);
    const blob = await res.blob();
    
    const croppedFile = new File([blob], files[0].name, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
    
    setFiles([croppedFile]);
    setShowCropper(false);
    setCropperImage(null);
  };

  const detectPageCount = async (fileToDetect: File | Blob): Promise<number> => {
    const type = fileToDetect.type;
    const name = fileToDetect instanceof File ? fileToDetect.name.toLowerCase() : "";
    
    // Images are always 1 page — return instantly with zero processing
    if (type.startsWith("image/") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png") || name.endsWith(".webp")) return 1;
    
    // PDF detection — slice header (128KB) and trailer (128KB) for instant metadata scan
    if (type === "application/pdf" || name.endsWith(".pdf")) {
      try {
        const size = fileToDetect.size;
        let text = "";
        if (size <= 256 * 1024) {
          const buffer = await fileToDetect.arrayBuffer();
          text = new TextDecoder("latin1").decode(buffer);
        } else {
          // Slice start and end of PDF where page catalog trees reside
          const [headSlice, tailSlice] = await Promise.all([
            fileToDetect.slice(0, 128 * 1024).arrayBuffer(),
            fileToDetect.slice(Math.max(0, size - 128 * 1024)).arrayBuffer(),
          ]);
          text = new TextDecoder("latin1").decode(headSlice) + " " + new TextDecoder("latin1").decode(tailSlice);
        }

        // Find /Count in catalog object
        const matches = [...text.matchAll(/\/Count\s+(\d+)/g)];
        if (matches.length > 0) {
          const counts = matches.map(m => parseInt(m[1]));
          return Math.max(...counts);
        }
        // Fallback: count /Type /Page entries
        const pageMatches = text.match(/\/Type\s*\/Page\b/g);
        if (pageMatches) return pageMatches.length;
      } catch (e) { /* silent fallback */ }
    }

    // DOCX detection — only scan first 32KB
    if (name.endsWith(".docx")) {
      try {
        const slice = fileToDetect.slice(0, 32000);
        const content = new TextDecoder().decode(await slice.arrayBuffer());
        const pageMatches = content.match(/<w:lastRenderedPageBreak\/>/g);
        if (pageMatches) return pageMatches.length + 1;
      } catch (e) { /* silent fallback */ }
    }
    
    return 1;
  };


  const handleUpload = async (forceFileType?: 'raw' | 'pdf') => {
    if (files.length === 0 || !shop) return;
    setUploading(true);
    setUploadProgress({ current: 0, total: files.length, percent: 0, fileName: "Starting..." });

    // Atomic counter using a closure ref — safe across parallel async tasks
    let completedCount = 0;
    const createdBatch: ({ token: string; fileName: string; jobId: string } | null)[] = new Array(files.length).fill(null);
    const newHistory: HistoryItem[] = [];

    const uploadSingleFile = async (activeFile: File, index: number): Promise<void> => {
      const fileExt = activeFile.name.split(".").pop()?.toLowerCase() || "";
      const needsConversion = forceFileType === 'pdf' && ["docx", "doc", "pptx", "ppt", "xlsx", "xls", "csv"].includes(fileExt);

      let finalFile: File | Blob = activeFile;
      let finalFileName = activeFile.name;

      if (needsConversion) {
        const convFormData = new FormData();
        convFormData.append("file", activeFile as Blob);
        const response = await fetch("/api/agent", { method: "POST", body: convFormData });
        if (response.ok) {
          finalFile = await response.blob();
          finalFileName = `${activeFile.name.replace(/\.[^/.]+$/, "")}.pdf`;
        }
      }

      const finalExt = finalFileName.split(".").pop() || fileExt;
      const storagePath = `${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2)}.${finalExt}`;

      // Detect page count and upload to storage in parallel
      const [pageCount, uploadResult] = await Promise.all([
        detectPageCount(finalFile),
        supabase.storage.from("documents").upload(storagePath, finalFile as Blob, {
          contentType: finalExt === 'pdf' ? 'application/pdf' : 'application/octet-stream',
          upsert: true,
        }),
      ]);

      if (uploadResult.error) {
        throw new Error(`Storage Error (${activeFile.name}): ${uploadResult.error.message}`);
      }

      // Insert DB record with token collision retry
      let dbData: { id: string } | null = null;
      let dbError: { code?: string; message?: string } | null = null;
      let retries = 3;

      while (retries > 0) {
        const newToken = generateToken();
        const { data, error } = await supabase.from("jobs").insert({
          token: newToken,
          customer_name: customerName || "Guest",
          file_path: storagePath,
          file_name: finalFileName,
          preferences,
          page_count: pageCount,
          is_preorder: location === 'home',
          is_paid: location === 'home',
          customer_phone: customerPhone,
          shop_id: shop.id,
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        }).select("id").single();

        if (!error) {
          dbData = data;
          dbError = null;
          createdBatch[index] = { token: newToken, fileName: finalFileName, jobId: data.id };
          newHistory.push({ token: newToken, shopName: shop.name, date: new Date().toISOString(), fileName: finalFileName });
          break;
        }
        dbError = error;
        if (error.code === "23505" && error.message?.includes("jobs_shop_token_unique")) {
          retries--; continue;
        }
        break;
      }

      if (dbError) {
        // Cleanup orphaned storage file
        Promise.resolve(supabase.storage.from("documents").remove([storagePath])).catch(() => {});
        throw new Error(`Database Error (${activeFile.name}): ${dbError.message || "Unknown"}`);
      }

      if (dbData) {
        // Atomic increment + progress update
        completedCount++;
        setUploadProgress({
          current: completedCount,
          total: files.length,
          percent: Math.round((completedCount / files.length) * 100),
          fileName: finalFileName,
        });
      }
    };

    try {
      // ALL files upload in parallel — maximum speed
      await Promise.all(files.map((f, i) => uploadSingleFile(f, i)));

      // Single RPC call for all files at once (instead of one per file)
      if (newHistory.length > 0) {
        Promise.resolve(supabase.rpc('increment_shop_files', { shop_row_id: shop.id })).catch(() => {});
      }

      const validBatch = createdBatch.filter(Boolean) as { token: string; fileName: string; jobId: string }[];
      const updatedHistory = [...newHistory, ...historyItems].slice(0, 20);
      setHistoryItems(updatedHistory);
      localStorage.setItem("xeroxq_history", JSON.stringify(updatedHistory));

      if (validBatch.length > 0) {
        setBatchTokens(validBatch);
        setToken(validBatch[0].token);
        setJobId(validBatch[0].jobId);
        setJobStatus("pending");
      }
    } catch (error) {
      console.error("Upload Error:", error);
      const e = error as { message?: string };
      alert(`Upload Failed: ${e?.message || "An error occurred during file upload."}`);
    } finally {
      setUploading(false);
      setIsConverting(false);
      setConversionStep(0);
      setDocxFileToProcess(null);
      setUploadProgress(null);
    }
  };


  const deleteHistoryItem = (tokenToDelete: string) => {
    const updated = historyItems.filter(item => item.token !== tokenToDelete);
    setHistoryItems(updated);
    localStorage.setItem("xeroxq_history", JSON.stringify(updated));
  };

  const handleDeleteFile = async () => {
    if ((!token && batchTokens.length === 0) || !shop) return;
    
    setIsDeleting(true);
    try {
      // Gather target job IDs and tokens from batchTokens or single jobId/token
      let targetJobIds: string[] = [];
      let targetTokens: string[] = [];

      if (batchTokens.length > 0) {
        targetJobIds = batchTokens.map(b => b.jobId).filter(Boolean);
        targetTokens = batchTokens.map(b => b.token).filter(Boolean);
      } else {
        if (jobId) targetJobIds = [jobId];
        if (token) targetTokens = [token];
      }

      // Fetch all target jobs to get their file_paths and current status
      let jobsToDelete: { id: string; token: string; file_path: string | null; is_deleted_by_user: boolean }[] = [];

      if (targetJobIds.length > 0) {
        const { data } = await supabase
          .from('jobs')
          .select('id, token, file_path, is_deleted_by_user')
          .in('id', targetJobIds);
        if (data) jobsToDelete = data;
      } else if (targetTokens.length > 0) {
        const { data } = await supabase
          .from('jobs')
          .select('id, token, file_path, is_deleted_by_user')
          .eq('shop_id', shop.id)
          .in('token', targetTokens);
        if (data) jobsToDelete = data;
      }

      if (jobsToDelete.length === 0) {
        alert('Could not find uploaded file(s). They may have already been processed or deleted.');
        setIsDeleting(false);
        return;
      }

      // Collect storage file paths to remove
      const storagePaths = jobsToDelete
        .map(j => j.file_path)
        .filter((path): path is string => Boolean(path));

      if (storagePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove(storagePaths);
        
        if (storageError && !storageError.message.includes('Object not found')) {
          console.warn('Storage deletion warning:', storageError.message);
        }
      }

      // Mark all jobs as deleted in DB
      const jobIdsToUpdate = jobsToDelete.map(j => j.id);
      const { error: updateError } = await supabase
        .from('jobs')
        .update({
          is_deleted_by_user: true,
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .in('id', jobIdsToUpdate);

      if (updateError) {
        throw updateError;
      }

      setDeletionReason('user');
      setIsDeleted(true);

      // Update local history to reflect deletion for all batch tokens
      const allBatchTokenSet = new Set(jobsToDelete.map(j => j.token));
      const updatedHistory = historyItems.map(item => 
        allBatchTokenSet.has(item.token) || item.token === token ? { ...item, isDeleted: true } : item
      );
      setHistoryItems(updatedHistory);
      localStorage.setItem('xeroxq_history', JSON.stringify(updatedHistory));

    } catch (error) {
      console.error('Error deleting files:', error);
      alert('Failed to delete file(s). Please try again or contact the shop.');
    } finally {
      setIsDeleting(false);
    }
  };

  // ── FEEDBACK FUNCTIONS ────────────────────────────────────────────────────
  
  const fetchFeedbackQuestions = async (shopId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_feedback_questions', {
        p_shop_id: shopId
      });
      
      if (error) {
        console.error('Error fetching feedback questions:', error);
        return;
      }
      
      if (data) {
        setFeedbackQuestions(data.map((q: any) => ({
          question_id: `${q.source}-${q.id}`,
          question_text: q.question_text,
          question_type: q.question_type,
          options: Array.isArray(q.options) ? q.options : (q.options ? JSON.parse(q.options) : []),
          is_required: q.is_required,
          display_order: q.display_order,
          source: q.source
        })));
      }
    } catch (error) {
      console.error('Error fetching feedback questions:', error);
    }
  };

  const handleOpenFeedback = async () => {
    if (!shop) return;
    
    // Reset previous responses every time modal is opened
    setFeedbackResponses({});
    setWrittenFeedback('');
    setFeedbackSubmitted(false);
    setFeedbackQuestions([]);
    
    // Check if feedback is enabled - but still show modal even if disabled
    try {
      const { data: enabledData } = await supabase.rpc('is_feedback_enabled_for_shop', {
        p_shop_id: shop.id
      });
      setFeedbackEnabled(enabledData === true);
    } catch {
      setFeedbackEnabled(false);
    }
    
    // Fetch questions if available
    try {
      await fetchFeedbackQuestions(shop.id);
    } catch {
      // If fetch fails, we'll show the default rating form
      setFeedbackQuestions([]);
    }
    
    // Always open the modal
    setShowFeedbackModal(true);
  };

  const handleSubmitFeedback = async () => {
    if (!shop || !token) return;
    
    // Validate required questions
    const missingRequired = feedbackQuestions.filter(q => 
      q.is_required && !feedbackResponses[q.question_id]
    );
    
    if (missingRequired.length > 0) {
      alert('Please answer all required questions');
      return;
    }
    
    setIsSubmittingFeedback(true);
    
    try {
      // Separate default and custom responses
      const defaultResponses: Record<string, string> = {};
      const customResponses: Record<string, string> = {};
      
      feedbackQuestions.forEach(q => {
        if (q.source === 'default') {
          defaultResponses[q.question_id] = feedbackResponses[q.question_id] || '';
        } else {
          customResponses[q.question_id] = feedbackResponses[q.question_id] || '';
        }
      });
      
      // Include overall rating if provided (from default star rating)
      if (feedbackResponses.overall_rating) {
        defaultResponses.overall_rating = feedbackResponses.overall_rating;
      }
      
      // Get job ID from state or fallback to token lookup
      let targetJobId = jobId;
      
      if (!targetJobId) {
        const { data: jobData, error: jobError } = await supabase
          .from('jobs')
          .select('id')
          .eq('token', token)
          .eq('shop_id', shop.id)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (jobError || !jobData || jobData.length === 0) {
          throw new Error('Could not find job');
        }
        targetJobId = jobData[0].id;
      }
      
      const { data, error } = await supabase.rpc('submit_feedback', {
        p_job_id: targetJobId,
        p_shop_id: shop.id,
        p_customer_name: customerName,
        p_customer_phone: customerPhone,
        p_default_responses: defaultResponses,
        p_custom_responses: customResponses,
        p_written_feedback: writtenFeedback
      });
      
      if (error) {
        throw error;
      }
      
      if (data && data[0]?.success) {
        setFeedbackSubmitted(true);
        setTimeout(() => {
          setShowFeedbackModal(false);
          window.location.reload();
        }, 2000);
      } else {
        alert(data?.[0]?.message || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmittingFeedback(false);
    }
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
            className="w-full h-12 bg-black text-white hover:bg-black/90 font-bold rounded-[5.57px] transition-all cursor-pointer"
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
        className="sticky top-0 z-50 w-full flex flex-col items-center mb-0 pt-[30px] pb-2 bg-[#FDFDFD]/80 backdrop-blur-md"
      >
        <div className="w-full max-w-[800px] bg-white/80 backdrop-blur-xl border border-black/5 rounded-[16px] px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-black rounded-[10px] flex items-center justify-center shadow-lg p-2 transform -rotate-3 transition-transform hover:rotate-0 overflow-hidden">
               <img src="/favicon.ico" alt="XeroxQ Logo" className="w-full h-full object-contain filter brightness-0 invert" />
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
            {shop.approval_status !== "approved" && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Trial ({shop.total_files_processed || 0}/3)
              </span>
            )}
            <Sheet>
              <SheetTrigger asChild>
                <button className="h-10 w-10 flex items-center justify-center rounded-[5.57px] border border-black/5 bg-white text-auth-slate-50 hover:text-black hover:bg-black/5 transition-all active:scale-95 shadow-sm cursor-pointer">
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
                    ) : historyItems.map((item, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={`history-${idx}-${item.token}`} 
                        className="p-5 bg-white border border-black/5 rounded-2xl flex items-center justify-between group shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="flex flex-col min-w-0 pr-4">
                          <p className="text-[14px] font-black text-black truncate mb-0.5">{item.fileName}</p>
                          <p className="text-[10px] text-auth-slate-50 font-bold uppercase tracking-wider opacity-60">
                            {item.token} • {new Date(item.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="h-9 w-9 bg-black/5 border border-black/5 rounded-xl flex items-center justify-center">
                             <span className="text-[14px] font-black text-black">{item.token}</span>
                           </div>
                           <Dialog>
                             <DialogTrigger asChild>
                               <button className="w-8 h-8 flex items-center justify-center text-auth-slate-30 hover:text-red-500 transition-colors cursor-pointer">
                                 <Trash2 className="w-4 h-4" />
                               </button>
                             </DialogTrigger>
                             <DialogContent className="sm:max-w-md rounded-2xl p-8 bg-white border border-[#E2E8F0] shadow-2xl">
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
                                    <button className="flex-1 h-[40px] bg-white border border-[#E2E8F0] text-black hover:bg-[#F8FAFC] rounded-2xl text-[12px] font-bold transition-all cursor-pointer">
                                      Abort
                                    </button>
                                 </DialogClose>
                                 <button 
                                   onClick={() => deleteHistoryItem(item.token)}
                                   className="flex-1 h-[40px] bg-red-500 text-white hover:bg-red-600 rounded-2xl text-[12px] font-bold transition-all shadow-lg shadow-red-500/20 cursor-pointer"
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
            className="w-full max-w-[480px] bg-white border border-black/5 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.12)] rounded-3xl p-8 sm:p-12 text-center mt-12"
          >
<h2 className="text-[28px] font-black tracking-tight text-black leading-none mb-3 uppercase">File Sent!</h2>
            <div className="flex items-center justify-center gap-2 mb-8">
               <div className={cn("w-2 h-2 rounded-full", isDeleted ? "bg-red-500" : jobStatus === 'printed' ? "bg-green-500" : "bg-orange-500 animate-pulse")} />
               <span className="text-[11px] font-black tracking-[0.15em] uppercase text-auth-slate-50">
                  Status: {isDeleted ? "Deleted" : jobStatus === 'printed' ? "Printed" : "Waiting for Shop"}
               </span>
            </div>

            <AnimatePresence>
              {jobStatus === 'printed' && !isDeleted && (
                <motion.div 
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="mb-8 p-5 bg-emerald-500 text-white rounded-2xl shadow-[0_20px_40px_rgba(16,185,129,0.2)] flex flex-col items-center gap-2 relative overflow-hidden"
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

            {batchTokens.length > 1 ? (
              <div className="space-y-3 mb-6">
                <p className="text-[11px] font-black tracking-[0.2em] text-auth-slate-50 uppercase text-center mb-2">
                  {shop?.generate_token !== false ? "Your Print Codes" : "Status Registered"}
                </p>
                <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {batchTokens.map((item, idx) => (
                    <div key={`${idx}-${item.token}-${item.jobId}`} className="p-4 bg-black text-white rounded-2xl flex items-center justify-between shadow-lg">
                      <div className="flex flex-col text-left min-w-0 pr-2">
                        <span className="text-[13px] font-extrabold text-white truncate max-w-[220px]">{item.fileName}</span>
                        <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest mt-0.5">File #{idx + 1}</span>
                      </div>
                      <div className="bg-white/10 px-4 py-2 rounded-xl text-[26px] font-black tracking-widest text-white shrink-0">
                        {shop?.generate_token !== false ? item.token : <CheckCircle2 className="w-6 h-6 text-white" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-12 bg-black rounded-2xl mb-6 shadow-2xl relative overflow-hidden group">
                 <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                 <p className="text-[11px] font-black tracking-[0.2em] text-white/40 uppercase mb-4">{shop?.generate_token !== false ? "Your Print Code" : "Status Registered"}</p>
                 <span className="text-[88px] font-black tracking-tighter text-white leading-none inline-block">
                    {shop?.generate_token !== false ? token : <CheckCircle2 className="w-20 h-20" />}
                 </span>
              </div>
            )}

            {/* Delete File Button - Always show until file is deleted */}
            {!isDeleted ? (
              <div className="mb-6">
                <button
                  onClick={handleDeleteFile}
                  disabled={isDeleting}
                  className="flex items-center justify-center gap-2 w-full h-12 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 font-bold text-[13px] rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm active:scale-[0.98]"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{batchTokens.length > 1 ? "Deleting All Files..." : "Deleting File..."}</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>{batchTokens.length > 1 ? "Delete All Uploaded Files" : "Delete Uploaded File"}</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-auth-slate-30 mt-2 text-center">
                  Once deleted, your uploaded {batchTokens.length > 1 ? "files are" : "file is"} permanently deleted from cloud storage.
                </p>
              </div>
            ) : deletionReason === 'user' ? (
              /* User Manually Deleted Message */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-5 bg-red-50 border border-red-200 rounded-2xl text-center flex flex-col items-center gap-2 shadow-sm"
              >
                <div className="flex items-center justify-center gap-2 text-red-600 font-black text-[13px] uppercase tracking-wider">
                  <Trash2 className="w-4 h-4" />
                  <span>{batchTokens.length > 1 ? "All Files Deleted By You" : "File Deleted By You"}</span>
                </div>
                <p className="text-[13px] font-extrabold text-red-700 leading-snug">
                  You have manually deleted your uploaded {batchTokens.length > 1 ? "files" : "file"}.
                </p>
                <p className="text-[11px] font-medium text-red-600/80">
                  Your document{batchTokens.length > 1 ? "s were" : " was"} manually deleted and permanently deleted from cloud storage.
                </p>
              </motion.div>
            ) : (
              /* Auto Deleted By 5-Minute Privacy Policy Message */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-5 bg-red-50 border border-red-200 rounded-2xl text-center flex flex-col items-center gap-2 shadow-sm"
              >
                <div className="flex items-center justify-center gap-2 text-red-600 font-black text-[13px] uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4" />
                  <span>File Deleted</span>
                </div>
                <p className="text-[13px] font-extrabold text-red-700 leading-snug">
                  Due to software policies, we deleted your file.
                </p>
                <p className="text-[11px] font-medium text-red-600/80">
                  Your uploaded document has been automatically deleted from cloud storage after 5 minutes for privacy protection.
                </p>
              </motion.div>
            )}

            <p className="text-[14px] font-medium text-auth-slate-50 leading-relaxed mb-10 max-w-[320px] mx-auto">
               {location === 'home' ? (
                 `Your file has been sent successfully. The shopkeeper will process it and you'll be notified here when it's ready, yaar.`
               ) : (
                 shop?.generate_token !== false 
                   ? `Tell me your name (${customerName || 'Guest'}) and verify with this 2-digit code at the counter, yaar.`
                   : `Your file from ${customerName || 'Guest'} has been added to the queue. Verify at the counter to print.`
               )}
            </p>

            <div className="w-full">
               <button 
                  onClick={() => {
                    setFiles([]);
                    setBatchTokens([]);
                    setToken(null);
                    setJobId(null);
                    setJobStatus("pending");
                    setIsDeleted(false);
                    setLocation('shop');
                  }}
                  className="group relative w-full h-14 bg-black text-white font-black text-[15px] rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-black/30 cursor-pointer overflow-hidden flex items-center justify-center gap-3"
               >
                 <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                 <div className="relative flex items-center gap-2.5">
                   <div className="w-7 h-7 bg-white/10 rounded-xl flex items-center justify-center">
                     <Upload className="w-3.5 h-3.5 text-white" />
                   </div>
                   <span className="tracking-tight">Upload Another File</span>
                 </div>
               </button>
            </div>

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
            className="w-full max-w-[600px] flex flex-col items-center pt-[30px] pb-12"
          >
            <div className="text-center mb-10">
               <motion.div 
                 initial={{ y: -10, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 className="flex items-center justify-center gap-3 mb-4"
               >
                 <Zap className="w-5 h-5 text-black" />
                 <span className="text-[11px] font-black tracking-[0.25em] text-auth-slate-50 uppercase">XeroxQ Instant Print</span>
               </motion.div>
               <h2 className="text-[40px] font-black tracking-tight text-auth-slate-90 leading-[0.9] mb-4">
                  Send Document
               </h2>
               <p className="text-[15px] font-medium text-auth-slate-50 leading-relaxed max-w-[420px]">
                 Upload your document here for instant printing. Safe and secure document sharing.
               </p>
            </div>

            <div className="w-full bg-white border border-black/5 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.08)] rounded-3xl p-3 sm:p-6 overflow-hidden relative">
               <input
                 type="file"
                 ref={fileInputRef}
                 multiple
                 className="hidden"
                 onChange={handleFileChange}
                 accept="*/*"
               />
               {shop.is_open === false ? (
                 <div className="p-10 flex flex-col items-center text-center">
                   <div className="w-20 h-20 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mb-8 transform rotate-3">
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
                          "flex flex-col items-center gap-4 p-6 border-2 transition-all rounded-2xl group relative overflow-hidden cursor-pointer",
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
                          "flex flex-col items-center gap-4 p-6 border-2 transition-all rounded-2xl group relative overflow-hidden cursor-pointer",
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
                        className="h-14 px-12 bg-black text-white rounded-full font-black text-[14px] uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 cursor-pointer"
                      >
                        <span>Next Step</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
               ) : files.length === 0 ? (
                 <motion.div
                   whileHover={{ scale: 1.008 }}
                   whileTap={{ scale: 0.98 }}
                   onClick={() => fileInputRef.current?.click()}
                   className="w-full max-w-[540px] mx-auto cursor-pointer group py-2"
                 >
                   <div className={cn(
                      "relative w-full rounded-[28px] border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center gap-5 p-8 sm:p-10 overflow-hidden shadow-sm hover:shadow-xl",
                      isDragging 
                        ? "border-[#FF591E] bg-orange-50/50 scale-[1.02]" 
                        : "border-slate-200 group-hover:border-slate-400 bg-gradient-to-b from-white via-slate-50/50 to-slate-100/30"
                    )}>
                     {/* Ambient floating glow orb */}
                     <div className="absolute w-40 h-40 bg-black/5 rounded-full blur-2xl group-hover:bg-black/10 group-hover:scale-125 transition-all duration-700 pointer-events-none" />

                     {/* Animated upload icon with float and pulse */}
                     <motion.div
                       animate={{ y: [0, -6, 0] }}
                       transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                       className="relative z-10"
                     >
                       <div className="w-20 h-20 sm:w-24 sm:h-24 bg-black rounded-[24px] sm:rounded-[28px] flex items-center justify-center shadow-2xl shadow-black/25 group-hover:shadow-black/40 group-hover:scale-105 transition-all duration-300">
                         <Upload className="w-9 h-9 sm:w-11 sm:h-11 text-white group-hover:translate-y-[-2px] transition-transform" />
                       </div>
                       <div className="absolute -top-1.5 -right-1.5 w-6 h-6 sm:w-7 sm:h-7 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white">
                         <span className="text-white text-[11px] font-black leading-none">+</span>
                       </div>
                     </motion.div>

                     {/* Text content */}
                     <div className="text-center space-y-1 z-10">
                       <h3 className="text-[18px] sm:text-[20px] font-black text-slate-900 tracking-tight">{isDragging ? "Drop your files here!" : "Drag & drop files here"}</h3>
                       <p className="text-[12px] sm:text-[13px] font-semibold text-slate-500 flex items-center justify-center gap-1.5"><span>or <span className="text-black font-extrabold underline decoration-2 decoration-black/20 underline-offset-4">browse from device</span></span><span className="text-slate-300">•</span><span className="text-slate-400 text-[11px]">Multiple files allowed</span></p>
                     </div>

                     {/* Supported format pills */}
                     <div className="flex flex-wrap items-center justify-center gap-1.5 z-10 max-w-[90%]">
                       {['PDF', 'DOCX', 'PPTX', 'JPG', 'PNG', 'CAD'].map(fmt => (
                         <span key={fmt} className="px-2.5 py-1 bg-black/5 group-hover:bg-black/10 text-slate-800 text-[9px] sm:text-[10px] font-extrabold tracking-wider uppercase rounded-full border border-black/5 transition-colors">{fmt}</span>
                       ))}
                       <span className="px-2.5 py-1 bg-black text-white text-[9px] sm:text-[10px] font-black tracking-wider uppercase rounded-full shadow-sm">+ More</span>
                     </div>

                     {shop.accept_preorders && (
                       <div className="flex items-center gap-2 z-10 pt-1">
                         <Badge variant="outline" className="bg-black/5 border-none text-[9px] font-black uppercase tracking-widest px-3 py-1">
                           {location === 'home' ? 'Pre-order Mode' : 'At Counter Mode'}
                         </Badge>
                         <button onClick={(e) => { e.stopPropagation(); setLocationConfirmed(false); }} className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-black transition-colors underline decoration-black/10 underline-offset-4 cursor-pointer">Change</button>
                       </div>
                     )}

                     {/* Corner accent gradients */}
                     <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-black/[0.04] to-transparent rounded-3xl pointer-events-none" />
                     <div className="absolute bottom-0 left-0 w-36 h-36 bg-gradient-to-tr from-black/[0.04] to-transparent rounded-3xl pointer-events-none" />
                   </div>
                 </motion.div>
               ) : (
                 <motion.div 
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="flex flex-col gap-6 p-4 md:p-2"
                 >
                    {shop.require_customer_name === true && (
                      <div className="flex flex-col gap-2 bg-[#F8FAFC] p-4 rounded-2xl border-2 border-slate-200 focus-within:border-black transition-all">
                         <div className="flex items-center justify-between">
                            <label className="text-[12px] font-black tracking-wider text-slate-800 uppercase flex items-center gap-1.5">
                               <User className="w-3.5 h-3.5 text-black" />
                               Your Name <span className="text-red-500">*</span>
                            </label>
                            {customerName ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">Filled ✓</span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Required for Queue</span>
                            )}
                         </div>
                         <div className="relative flex items-center">
                            <input 
                               type="text" 
                               placeholder="e.g. Rahul Sharma"
                               value={customerName}
                               onChange={(e) => setCustomerName(e.target.value)}
                               className="w-full h-12 px-4 text-[15px] font-bold text-slate-900 bg-white border-2 border-slate-300 rounded-xl focus:border-black focus:ring-4 focus:ring-black/10 transition-all outline-none placeholder:text-slate-400 placeholder:font-medium shadow-sm"
                            />
                         </div>
                      </div>
                    )}
                    {/* Selected files header */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-[13px] font-black text-slate-900 uppercase tracking-wider">
                        {files.length} {files.length === 1 ? 'File' : 'Files'} Selected
                      </span>
                      <button
                        onClick={() => setFiles([])}
                        className="text-[11px] font-bold text-red-500 hover:text-red-700 uppercase tracking-wider underline cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>

                    {/* Selected files list */}
                    <div className="flex flex-col gap-3 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin">
                      {files.map((f, index) => (
                        <div key={index} className="flex items-center gap-4 p-4 border border-black/5 rounded-2xl bg-[#F8F8F8] group">
                          <div className="w-11 h-11 bg-white border border-black/5 rounded-xl shrink-0 flex items-center justify-center shadow-md relative">
                            <FileText className="w-5 h-5 text-black" />
                            <div className="absolute -top-1 -right-1 bg-black text-[7px] font-black text-white px-1 py-0.2 rounded-xs uppercase">
                              {f.name.split('.').pop()?.substring(0, 4)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col text-left">
                            <span className="text-[14px] font-extrabold text-black truncate">{f.name}</span>
                            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase opacity-80">{(f.size / (1024 * 1024)).toFixed(2)} MB</span>
                          </div>
                          <button 
                            onClick={() => setFiles(prev => prev.filter((_, i) => i !== index))}
                            className="w-8 h-8 flex items-center justify-center bg-white border border-black/5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-2xs active:scale-95 cursor-pointer"
                            title="Remove file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2.5 bg-black/5 hover:bg-black/10 text-black text-[12px] font-extrabold uppercase tracking-wider rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 border border-black/5"
                    >
                      <Upload className="w-3.5 h-3.5" /> + Add More Files
                    </button>

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
                       {shop.show_duplex === true && (
                         <div className="flex flex-col gap-3">
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-auth-slate-50 ml-1">Print Side</span>
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
                       )}
                     </div>

                     {location === 'home' && (
                       <div className="flex flex-col gap-2 bg-[#F8FAFC] p-4 rounded-2xl border-2 border-slate-200 focus-within:border-black transition-all mt-2">
                         <div className="flex items-center justify-between">
                            <label className="text-[12px] font-black tracking-wider text-slate-800 uppercase flex items-center gap-1.5">
                               Your Mobile Number <span className="text-red-500">*</span>
                            </label>
                            {customerPhone ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">Filled ✓</span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">For Order Updates</span>
                            )}
                         </div>
                         <input 
                           type="tel" 
                           placeholder="e.g. +91 98765 43210"
                           value={customerPhone}
                           onChange={(e) => setCustomerPhone(e.target.value)}
                           className="w-full h-12 px-4 text-[15px] font-bold text-slate-900 bg-white border-2 border-slate-300 rounded-xl focus:border-black focus:ring-4 focus:ring-black/10 transition-all outline-none placeholder:text-slate-400 placeholder:font-medium shadow-sm"
                         />
                       </div>
                     )}

                     {location === 'home' && (
                        <div className="p-6 bg-black text-white rounded-2xl flex items-center justify-between shadow-2xl relative overflow-hidden">
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
                          const hasOfficeDoc = files.some(f => {
                            const ext = f.name.split('.').pop()?.toLowerCase() || '';
                            return ['docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'csv'].includes(ext);
                          });
                          if (hasOfficeDoc) {
                            setShowDocxChoice(true);
                          } else {
                            handleUpload();
                          }
                        }}
                        disabled={uploading || (shop?.require_customer_name === true && !customerName.trim()) || (location === 'home' && !customerPhone.trim())}
                        className={cn(
                          "w-full font-black text-[15px] tracking-tight rounded-2xl transition-all flex items-center justify-center shadow-2xl mt-4",
                          uploading
                            ? "h-16 bg-[#FF591E] text-white cursor-not-allowed shadow-orange-500/30"
                            : "h-14 gap-3 bg-black text-white hover:bg-black/90 disabled:bg-black/10 disabled:text-black/20 shadow-black/20 transform hover:scale-[1.01] active:scale-[0.99]"
                        )}
                     >
                        {uploading ? (
                          <div className="flex flex-col justify-center w-full px-5 gap-2">
                            <div className="flex items-center justify-between w-full gap-3">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-white shrink-0" />
                                <span className="text-[11px] font-bold text-white truncate">
                                  {uploadProgress && uploadProgress.current < uploadProgress.total
                                    ? `File ${uploadProgress.current + 1} of ${uploadProgress.total} · ${uploadProgress.fileName}`
                                    : `Finishing up...`
                                  }
                                </span>
                              </div>
                              <span className="text-white font-mono font-black text-[14px] shrink-0">{uploadProgress?.percent || 0}%</span>
                            </div>
                            <div className="w-full bg-white/30 h-[3px] rounded-full overflow-hidden">
                              <div
                                className="bg-white h-full rounded-full transition-all duration-500"
                                style={{ width: `${uploadProgress?.percent || 0}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                             <Zap className={cn("w-4 h-4", location === 'home' ? "animate-pulse" : "")} />
                             <span>Upload {files.length > 1 ? `All ${files.length} Files` : 'File'}</span>
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
              <DialogTitle className="text-2xl font-black text-black">Optimize Office Document?</DialogTitle>
              <DialogDescription className="text-[15px] font-medium text-auth-slate-30 mt-2">
                We recommend converting your Word, PowerPoint, or Excel document to a professional PDF to ensure pixel-perfect printing at the shop.
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

      {/* FEEDBACK MODAL */}
      <Dialog open={showFeedbackModal} onOpenChange={setShowFeedbackModal}>
        <DialogContent className="sm:max-w-[520px] bg-white border border-[#E2E8F0] shadow-2xl p-0 rounded-[16px] overflow-hidden max-h-[90vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
            <DialogHeader>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">🎉</span>
              </div>
              <DialogTitle className="text-[22px] font-black tracking-tight text-white">
                {feedbackSubmitted ? 'Thank You!' : 'How was your experience?'}
              </DialogTitle>
              <DialogDescription className="text-white/90 text-[13px] font-medium">
                {feedbackSubmitted 
                  ? 'Your feedback helps us improve our service.'
                  : `Help ${shop?.name || 'us'} serve you better by sharing your thoughts.`
                }
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6">
            {feedbackSubmitted ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">✓</span>
                </div>
                <p className="text-[16px] font-bold text-green-700 mb-2">Feedback Submitted!</p>
                <p className="text-[13px] text-gray-600">Redirecting you to start fresh...</p>
              </motion.div>
            ) : (
              <>
                {/* Default Feedback Questions */}
                {feedbackQuestions.filter(q => q.source === 'default').length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-4">
                      Platform Feedback
                    </h3>
                    <div className="space-y-4">
                      {feedbackQuestions
                        .filter(q => q.source === 'default')
                        .map((question, idx) => (
                        <div key={`question-${idx}-${question.question_id || 'unknown'}`} className="bg-[#F8FAFC] rounded-xl p-4">
                          <p className="text-[14px] font-bold text-black mb-3">
                            {question.question_text}
                            {question.is_required && <span className="text-red-500 ml-1">*</span>}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {(question.options || []).map((option: string, optIdx: number) => (
                              <button
                                type="button"
                                key={`default-${question.question_id}-${optIdx}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFeedbackResponses(prev => ({ ...prev, [question.question_id]: option }));
                                }}
                                className={cn(
                                  "px-3 py-2 rounded-lg text-[13px] font-semibold transition-all border-2",
                                  feedbackResponses[question.question_id] === option
                                    ? "bg-black text-white border-black shadow-lg scale-105"
                                    : "bg-white border-gray-200 text-gray-700 hover:border-black/40 hover:bg-gray-50"
                                )}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Shop Feedback Questions */}
                {feedbackQuestions.filter(q => q.source === 'custom').length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-4">
                      {shop?.custom_feedback_title || 'About This Shop'}
                    </h3>
                    <div className="space-y-4">
                      {feedbackQuestions
                        .filter(q => q.source === 'custom')
                        .map((question, idx) => (
                        <div key={`custom-q-${idx}-${question.question_id || 'unknown'}`} className="bg-[#F8FAFC] rounded-xl p-4">
                          <p className="text-[14px] font-bold text-black mb-3">
                            {question.question_text}
                            {question.is_required && <span className="text-red-500 ml-1">*</span>}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {(question.options || []).map((option: string, optIdx: number) => (
                              <button
                                type="button"
                                key={`custom-${question.question_id}-${optIdx}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFeedbackResponses(prev => ({ ...prev, [question.question_id]: option }));
                                }}
                                className={cn(
                                  "px-3 py-2 rounded-lg text-[13px] font-semibold transition-all border-2",
                                  feedbackResponses[question.question_id] === option
                                    ? "bg-black text-white border-black shadow-lg scale-105"
                                    : "bg-white border-gray-200 text-gray-700 hover:border-black/40 hover:bg-gray-50"
                                )}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Default Star Rating - Always show if no other questions */}
                {feedbackQuestions.length === 0 && (
                  <div className="mb-6">
                    <h3 className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-4">
                      Rate Your Experience
                    </h3>
                    <div className="bg-[#F8FAFC] rounded-xl p-4">
                      <p className="text-[14px] font-bold text-black mb-3">How would you rate your overall experience?</p>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setFeedbackResponses(prev => ({ ...prev, overall_rating: star.toString() }))}
                            className="text-[28px] transition-all hover:scale-110"
                          >
                                <span className={feedbackResponses.overall_rating && parseInt(feedbackResponses.overall_rating) >= star ? 'text-yellow-400' : 'text-gray-300'}>
                                  ★
                                </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Written Feedback */}
                <div className="mb-6">
                  <label className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-3 block">
                    Tell us about your experience (Optional)
                  </label>
                  <textarea
                    value={writtenFeedback}
                    onChange={(e) => setWrittenFeedback(e.target.value)}
                    placeholder="What did you like? What can we improve?"
                    className="w-full h-24 p-4 bg-[#F8FAFC] border border-gray-200 rounded-xl text-[14px] resize-none focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/20 transition-all"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowFeedbackModal(false);
                      window.location.reload();
                    }}
                    className="flex-1 h-12 bg-gray-100 text-gray-700 font-bold text-[14px] rounded-xl hover:bg-gray-200 transition-all"
                  >
                    Skip & Start New
                  </button>
                  <button
                    onClick={handleSubmitFeedback}
                    disabled={isSubmittingFeedback}
                    className="flex-1 h-12 bg-black text-white font-bold text-[14px] rounded-xl hover:bg-black/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmittingFeedback ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Feedback</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      </main>
      <SiteFooter />
    </div>
  );
}
