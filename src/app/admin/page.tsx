"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/theme";
import { getPublicOrigin, formatDisplayUrl } from "@/lib/site-url";
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
  ShieldCheck,
  CheckCircle2,
  Download,
  Plus,
  Bell,
  BellOff,
  Smartphone,
  MapPin,
  ShieldAlert,
  AlertCircle,
  Link2,
  Sun,
  Moon,
  Star,
  MessageSquare,
  X,
  Inbox,
  Copy,
  Check
} from "lucide-react";
import { TableVirtuoso } from "react-virtuoso";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
  buildSlugCandidates,
  fetchTakenShopSlugs,
  finalizeSlugInput,
  generateBaseShopSlugs,
  insertWithUniqueSlug,
  isReservedShopSlug,
  MIN_SHOP_SLUG_LENGTH,
  normalizeSlugTyping,
  resolveAvailableSlug,
} from "@/lib/shop-slug";
import { extractPhoneFromUpi, generateWhatsAppLink } from "@/lib/whatsapp";

const html2canvas = typeof window !== 'undefined' ? require("html2canvas-pro") : null;
import { QRCodeSVG } from "qrcode.react";

const XeroxQPrintDialog = dynamic(
  () => import("@/components/desktop/xeroxq-print-dialog"),
  { ssr: false }
);

const LocationMap = dynamic(
  () => import("@/components/maps/LocationMap").then((mod) => mod.LocationMap),
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
import { Skeleton } from "@/components/ui/skeleton";
import { LocationAutocomplete } from "@/components/ui/location-autocomplete";

interface Shop {
  id: string;
  name: string;
  slug: string;
  upi_id?: string;
  shop_location?: string;
  shop_lat?: number;
  shop_lng?: number;
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
    detectedColor?: boolean;
  };
  status: string;
  page_count: number;
  is_preorder: boolean;
  is_paid: boolean;
  customer_phone?: string;
  created_at: string;
  expires_at: string;
  is_deleted_by_user?: boolean;
  is_auto_deleted?: boolean;
  deleted_at?: string;
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [creatingShop, setCreatingShop] = useState(false);
  const [createShopError, setCreateShopError] = useState<string | null>(null);
  const [newShopData, setNewShopData] = useState({ name: "", phone: "", upi_id: "", shop_location: "", shop_lat: null as number | null, shop_lng: null as number | null });
  const [shopSlugInput, setShopSlugInput] = useState("");
  const [isSlugEdited, setIsSlugEdited] = useState(false);
  const [slugAvailability, setSlugAvailability] = useState<{
    checking: boolean;
    resolvedSlug: string;
    wasTaken: boolean;
    isReserved: boolean;
  }>({
    checking: false,
    resolvedSlug: "",
    wasTaken: false,
    isReserved: false,
  });
  const [printingJobId, setPrintingJobId] = useState<string | null>(null);
  const [showingSettings, setShowingSettings] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [viewReadOnlyQueue, setViewReadOnlyQueue] = useState(false);
  const [isCheckingApproval, setIsCheckingApproval] = useState(false);
  const [updatingSettings, setUpdatingSettings] = useState(false);
  const [activePrintJob, setActivePrintJob] = useState<Job | null>(null);

  const isShopApproved = shop?.approval_status === "approved";
  const filesProcessedCount = Number(shop?.total_files_processed || 0);
  const isTrialLimitReached = !isShopApproved && filesProcessedCount >= 3;
  const [printPreviewUrl, setPrintPreviewUrl] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const knownJobIdsRef = useRef<Set<string>>(new Set());
  const [verifyingJobId, setVerifyingJobId] = useState<string | null>(null);
  const [verificationMode, setVerificationMode] = useState<'complete' | 'reprint' | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [deleteConfirmJob, setDeleteConfirmJob] = useState<Job | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [tokenChallengeInput, setTokenChallengeInput] = useState("");
  const [activeDownloadId, setActiveDownloadId] = useState<string | null>(null);
  const [purgedJob, setPurgedJob] = useState<Job | null>(null);
  const [confirmFlushQueue, setConfirmFlushQueue] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const { theme, isDark, toggleTheme } = useTheme();

  // Audio element for notification sound (more reliable than Web Audio API)
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioInitializedRef = useRef(false);

  // Feedback management state
  const [showFeedbackManager, setShowFeedbackManager] = useState(false);
  const [showFeedbackResponses, setShowFeedbackResponses] = useState(false);
  const [customFeedbackQuestions, setCustomFeedbackQuestions] = useState<any[]>([]);
  const [feedbackResponses, setFeedbackResponses] = useState<any[]>([]);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionOptions, setNewQuestionOptions] = useState("Poor, Fair, Good, Great");
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [confirmDeleteQuestionId, setConfirmDeleteQuestionId] = useState<string | null>(null);
  const [feedbackAnalytics, setFeedbackAnalytics] = useState<any>(null);

  // Location picker state
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [tempLocation, setTempLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
        playNotificationPing();
      } else {
        setIsSoundEnabled(true);
        localStorage.setItem("xeroxq_admin_sound", "true");
        setNotifications(prev => [{
          id: `perm-${Date.now()}`,
          type: 'info',
          message: "Desktop alerts blocked by browser",
          subMessage: "Sound alerts are enabled whenever this tab is open.",
          timestamp: new Date()
        }, ...prev]);
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
    active: jobs.filter(
      j => j.status !== "printed" && !j.is_deleted_by_user && !j.is_auto_deleted && j.file_path !== null
    ).length
  };

  // Get current location using browser geolocation API with IP fallback
  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    setLocationError(null);
    
    console.log("[getCurrentLocation] Requesting location...");

    const applyCoords = async (latitude: number, longitude: number) => {
      console.log("[getCurrentLocation] Applying coordinates:", latitude, longitude);
      setTempLocation({ lat: latitude, lng: longitude });
      setShop(prev => prev ? { ...prev, shop_lat: latitude, shop_lng: longitude } : null);
      setIsGettingLocation(false);
      
      if (shop?.id) {
        const { error } = await supabase
          .from("shops")
          .update({ shop_lat: latitude, shop_lng: longitude })
          .eq("id", shop.id);
        if (error) console.error("[getCurrentLocation] Failed to save coordinates:", error);
      }
    };

    const tryIpFallback = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.latitude && data.longitude) {
            await applyCoords(Number(data.latitude), Number(data.longitude));
            return true;
          }
        }
      } catch (e) {
        console.warn("[getCurrentLocation] IP fallback error:", e);
      }
      return false;
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          applyCoords(position.coords.latitude, position.coords.longitude);
        },
        async (error) => {
          console.warn("[getCurrentLocation] Browser geolocation error, attempting IP fallback:", error.message);
          const ipOk = await tryIpFallback();
          if (!ipOk) {
            setLocationError("Unable to retrieve location automatically. Please search for your shop address.");
            setIsGettingLocation(false);
            setTempLocation({ lat: 20.5937, lng: 78.9629 });
          }
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
      );
    } else {
      const ipOk = await tryIpFallback();
      if (!ipOk) {
        setLocationError("Geolocation unavailable. Please search for your shop address.");
        setIsGettingLocation(false);
      }
    }
  };

  const triggerNewJobNotification = (job: Job) => {
    if (knownJobIdsRef.current.has(job.id)) return;

    knownJobIdsRef.current.add(job.id);
    playNotificationPing();
    if (localStorage.getItem("xeroxq_admin_sound") === "true") {
      sendDesktopNotification(job);
    }
    setNotifications(prev => {
      if (prev.some(n => n.id === `job-${job.id}`)) return prev;
      return [
        {
          id: `job-${job.id}`,
          type: 'new_job',
          message: `Incoming Document: ${job.customer_name || 'Anonymous'}`,
          subMessage: `File: ${job.file_name}`,
          timestamp: new Date()
        },
        ...prev.slice(0, 4)
      ];
    });
  };

  const checkApprovalStatus = async (silent: boolean = false) => {
    if (!silent) setIsCheckingApproval(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("shops")
          .select("approval_status, total_files_processed, is_open")
          .eq("owner_id", user.id)
          .single();

        if (data) {
          setShop(prev => prev ? { ...prev, ...data } : null);
          if (data.approval_status === "approved") {
            setShowApprovalModal(false);
            setViewReadOnlyQueue(false);
            if (!silent) {
              setNotifications(prev => [{
                id: `approved-${Date.now()}`,
                type: 'success',
                message: "Shop approved",
                subMessage: "Unlimited printing is now unlocked for your shop.",
                timestamp: new Date()
              }, ...prev]);
            }
          } else {
            if (!silent) {
              setNotifications(prev => [{
                id: `pending-${Date.now()}`,
                type: 'info',
                message: "Still pending approval",
                subMessage: "Platform admin approval is still in progress. Check back shortly.",
                timestamp: new Date()
              }, ...prev]);
            }
          }
        }
      }
    } finally {
      if (!silent) setIsCheckingApproval(false);
    }
  };

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Try explicit column select first (preferred for type safety)
      let { data: shopData, error: shopError } = await supabase
        .from("shops")
        .select("id, name, slug, upi_id, shop_location, shop_lat, shop_lng, price_mono, price_color, is_open, require_customer_name, show_copies, show_color_mode, show_duplex, generate_token, accept_preorders, contact_number, feedback_enabled, custom_feedback_enabled, custom_feedback_title, total_files_processed, approval_status")
        .eq("owner_id", user.id)
        .single();

      // PGRST116 = no rows returned (no shop exists yet) - this is OK, show creation form
      // 42703 = column doesn't exist (migration not applied) - fall back to * select
      if (shopError && shopError.code === "42703") {
        console.warn("[checkUser] New location columns not found, falling back to * select");
        const fallback = await supabase
          .from("shops")
          .select("*")
          .eq("owner_id", user.id)
          .single();
        shopData = fallback.data;
        shopError = fallback.error;
      }

      // Log errors except "no rows" which just means user needs to create shop
      if (shopError && shopError.code !== "PGRST116") {
        console.error("[checkUser] Error fetching shop:", shopError.message, shopError.code);
      }

      // If user has a shop, go to dashboard
      if (shopData) {
        console.log("[checkUser] Found existing shop:", shopData.id);
        setShop(shopData);
        fetchJobs(shopData.id);
        
        // Ensure map shows immediately by setting default coordinates if missing
        if (!shopData.shop_lat || !shopData.shop_lng) {
          console.log("[checkUser] Shop missing coordinates, requesting location...");
          // Request actual location — do NOT set fake Delhi coords
          setTimeout(() => {
            getCurrentLocation();
          }, 1000);
        }

        const channelName = `jobs-${shopData.id}-${Date.now()}`;
        const subscription = supabase
          .channel(channelName)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "jobs", filter: `shop_id=eq.${shopData.id}` },
            (payload) => {
              if (payload.eventType === 'INSERT') {
                const newJob = payload.new as Job;
                triggerNewJobNotification(newJob);
              }
              fetchJobs(shopData.id);
            }
          )
          .subscribe();

        // Real-time listener for shop approval status updates
        const shopSubscription = supabase
          .channel(`shop-status-${shopData.id}-${Date.now()}`)
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "shops", filter: `id=eq.${shopData.id}` },
            (payload) => {
              const updatedShop = payload.new;
              if (updatedShop) {
                setShop(prev => {
                  if (!prev) return updatedShop as any;
                  if (updatedShop.approval_status === "approved" && prev.approval_status !== "approved") {
                    setShowApprovalModal(false);
                    setViewReadOnlyQueue(false);
                  }
                  return { ...prev, ...updatedShop };
                });
              }
            }
          )
          .subscribe();

        // Auto-refresh: Polling every 3 seconds for jobs AND shop approval status
        const autoRefreshInterval = setInterval(async () => {
          fetchJobs(shopData.id);

          const { data: latestShop } = await supabase
            .from("shops")
            .select("approval_status, total_files_processed, is_open")
            .eq("id", shopData.id)
            .single();

          if (latestShop) {
            setShop(prev => {
              if (!prev) return prev;
              if (
                prev.approval_status !== latestShop.approval_status ||
                prev.total_files_processed !== latestShop.total_files_processed ||
                prev.is_open !== latestShop.is_open
              ) {
                if (latestShop.approval_status === "approved" && prev.approval_status !== "approved") {
                  setShowApprovalModal(false);
                  setViewReadOnlyQueue(false);
                }
                return { ...prev, ...latestShop };
              }
              return prev;
            });
          }
        }, 3000);

        return () => { 
          supabase.removeChannel(subscription); 
          supabase.removeChannel(shopSubscription);
          clearInterval(autoRefreshInterval);
        };
      } else {
        setLoading(false);
      }
    }

    checkUser();
  }, [router]);

  useEffect(() => {
    if (shop && isTrialLimitReached && !viewReadOnlyQueue) {
      setShowApprovalModal(true);
    }
  }, [shop, isTrialLimitReached, viewReadOnlyQueue]);

  // Initialize audio element on first user interaction
  const initAudio = () => {
    if (audioInitializedRef.current) return;
    audioInitializedRef.current = true;
    
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioContextRef.current = audioContext;
    } catch (e) {
      console.warn("AudioContext init error:", e);
    }
    
    // Remove listeners after first interaction
    window.removeEventListener('click', initAudio);
    window.removeEventListener('keydown', initAudio);
    window.removeEventListener('touchstart', initAudio);
  };

  // Add listeners for first interaction to unlock audio
  useEffect(() => {
    window.addEventListener('click', initAudio);
    window.addEventListener('keydown', initAudio);
    window.addEventListener('touchstart', initAudio);
    
    return () => {
      window.removeEventListener('click', initAudio);
      window.removeEventListener('keydown', initAudio);
      window.removeEventListener('touchstart', initAudio);
    };
  }, []);

  const playNotificationPing = async () => {
    try {
      // Try Web Audio API first (if initialized)
      if (audioContextRef.current && audioContextRef.current.state === 'running') {
        const audioCtx = audioContextRef.current;
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc1.type = "sine";
        osc1.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(1046.50, audioCtx.currentTime);

        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(audioCtx.currentTime + 0.5);
        osc2.stop(audioCtx.currentTime + 0.5);
        return;
      }
      
      // Fallback: Try to create new AudioContext and resume it
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      
      if (audioCtx.state === 'running') {
        audioContextRef.current = audioCtx;
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc1.type = "sine";
        osc1.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(1046.50, audioCtx.currentTime);

        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(audioCtx.currentTime + 0.5);
        osc2.stop(audioCtx.currentTime + 0.5);
      }
    } catch (e) {
      console.warn("Notification sound failed:", e);
    }
  };

  const sendDesktopNotification = (job: Job) => {
    if ("Notification" in window && Notification.permission === "granted") {
      const isDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
      new Notification("XeroxQ: New Job Signal", {
        body: `Customer ${job.customer_name || 'Anonymous'} transmitted a new document for physicalization.`,
        icon: isDark ? "/xeroxq_logo_white.svg" : "/xeroxq_logo_dark.svg",
        tag: job.id // Avoid duplicate alerts for same job
      });
    }
  };

  const fetchJobs = async (shopId: string) => {
    if (!shopId) {
      console.error("[fetchJobs] No shopId provided");
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("id, token, customer_name, customer_phone, is_preorder, is_paid, file_name, file_path, status, preferences, page_count, created_at, expires_at, is_deleted_by_user, is_auto_deleted, deleted_at")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[fetchJobs] Supabase error:", error.message, error.code, error.details);
        throw error;
      }
      
      const newJobs = data || [];
      const nowMs = Date.now();

      // Delete expired files (>5 minutes old) via authenticated shopkeeper session
      const staleJobs = newJobs.filter(j => {
        if (!j.file_path) return false;
        const createdMs = new Date(j.created_at).getTime();
        return nowMs - createdMs >= 5 * 60 * 1000;
      });

      if (staleJobs.length > 0) {
        const stalePaths = staleJobs.map(j => j.file_path).filter((p): p is string => Boolean(p));
        const staleIds = staleJobs.map(j => j.id);
        if (stalePaths.length > 0) {
          Promise.resolve(supabase.storage.from("documents").remove(stalePaths)).catch(() => {});
        }
        Promise.resolve(
          supabase
            .from("jobs")
            .update({ is_auto_deleted: true, file_path: null, deleted_at: new Date().toISOString() })
            .in("id", staleIds)
        ).catch(() => {});
      }

      // Auto-detect new files added by customers (Real-time polling sync)
      if (knownJobIdsRef.current.size > 0) {
        for (const job of newJobs) {
          if (!knownJobIdsRef.current.has(job.id)) {
            triggerNewJobNotification(job);
          }
        }
      } else {
        knownJobIdsRef.current = new Set(newJobs.map(j => j.id));
      }

      for (const job of newJobs) {
        knownJobIdsRef.current.add(job.id);
      }
      setJobs(newJobs);
    } catch (error: any) {
      console.error("[fetchJobs] Error fetching jobs:", error?.message || error, error?.code || "");
    } finally {
      setLoading(false);
    }
  };

  // Only track `shopSlugInput` as a dependency when the user is manually editing it
  // so auto-updating the input from `newShopData.name` never triggers a redundant re-fetch.
  const customSlugQuery = isSlugEdited ? shopSlugInput : "";

  // Live preview & availability resolution for the Setup Your Shop URL field
  useEffect(() => {
    if (shop) return;

    const trimmedName = newShopData.name.trim();
    const cleanedCustom = finalizeSlugInput(customSlugQuery);

    if (!isSlugEdited && trimmedName.length < 2) {
      setShopSlugInput("");
      setSlugAvailability({
        checking: false,
        resolvedSlug: "",
        wasTaken: false,
        isReserved: false,
      });
      return;
    }

    if (isSlugEdited && cleanedCustom.length < MIN_SHOP_SLUG_LENGTH) {
      setSlugAvailability({
        checking: false,
        resolvedSlug: "",
        wasTaken: false,
        isReserved: false,
      });
      return;
    }

    const primaryTarget = isSlugEdited
      ? cleanedCustom
      : generateBaseShopSlugs(trimmedName).compact;

    const candidates = buildSlugCandidates({
      shopName: trimmedName || "shop",
      preferredSlug: isSlugEdited ? cleanedCustom : undefined,
      isCustomSlug: isSlugEdited,
    });

    const primaryReserved = isReservedShopSlug(primaryTarget);
    const optimisticSlug = candidates[0] || primaryTarget;

    if (!isSlugEdited) {
      setShopSlugInput(optimisticSlug);
    }

    setSlugAvailability({
      checking: true,
      resolvedSlug: optimisticSlug,
      wasTaken: false,
      isReserved: primaryReserved,
    });

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        let primaryTaken = false;
        const resolved = await resolveAvailableSlug(candidates, async (batch) => {
          const takenSet = await fetchTakenShopSlugs(
            supabase as unknown as Parameters<typeof fetchTakenShopSlugs>[0],
            batch
          );
          if (takenSet.has(primaryTarget)) {
            primaryTaken = true;
          }
          return takenSet;
        });

        if (cancelled) return;

        if (!isSlugEdited) {
          setShopSlugInput(resolved);
        }

        setSlugAvailability({
          checking: false,
          resolvedSlug: resolved,
          wasTaken: !primaryReserved && primaryTaken,
          isReserved: primaryReserved,
        });
      } catch {
        if (!cancelled) {
          setSlugAvailability({
            checking: false,
            resolvedSlug: optimisticSlug,
            wasTaken: false,
            isReserved: primaryReserved,
          });
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [shop, newShopData.name, customSlugQuery, isSlugEdited]);

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingShop(true);
    setCreateShopError(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setCreateShopError("You must be logged in to create a shop.");
      setCreatingShop(false);
      return;
    }

    try {
      const name = newShopData.name.trim();
      if (name.length < 2) {
        throw new Error("Shop name must be at least 2 characters long.");
      }

      const location = newShopData.shop_location.trim();
      if (!location || location.length < 2) {
        throw new Error("Shop location is required. Please search and select or type your shop's address.");
      }

      const cleanedCustomSlug = finalizeSlugInput(shopSlugInput);
      if (isSlugEdited && cleanedCustomSlug.length < MIN_SHOP_SLUG_LENGTH) {
        throw new Error(`Shop link must be at least ${MIN_SHOP_SLUG_LENGTH} characters (letters, numbers, or hyphens).`);
      }

      const preferredSlug = isSlugEdited
        ? cleanedCustomSlug
        : generateBaseShopSlugs(name).compact;

      // Packaged Electron uses static `app://` protocol where Next API routes don't run
      if (typeof window !== "undefined" && window.location.protocol === "app:") {
        const candidates = buildSlugCandidates({
          shopName: name,
          preferredSlug: isSlugEdited ? cleanedCustomSlug : undefined,
          isCustomSlug: isSlugEdited,
        });

        const { data: createdShop, error } = await insertWithUniqueSlug<Shop>(
          candidates,
          supabase as unknown as Parameters<typeof insertWithUniqueSlug>[1],
          async (finalSlug) =>
            supabase
              .from("shops")
              .insert({
                owner_id: session.user.id,
                name,
                slug: finalSlug,
                contact_number: newShopData.phone.trim() || null,
                upi_id: newShopData.upi_id.trim() || null,
                shop_location: location,
                shop_lat: newShopData.shop_lat,
                shop_lng: newShopData.shop_lng,
                price_mono: 3,
                price_color: 10,
                is_open: true,
                require_customer_name: false,
                generate_token: false,
                show_copies: false,
                show_color_mode: false,
                accept_preorders: false,
                approval_status: "pending",
              })
              .select()
              .single()
        );

        if (error || !createdShop) {
          throw new Error(error?.message || "Shop creation failed");
        }

        setShop(createdShop);
        fetchJobs(createdShop.id);
        return;
      }

      const res = await fetch("/api/create-shop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: name,
          slug: preferredSlug,
          custom_slug: isSlugEdited,
          phone: newShopData.phone.trim(),
          upi_id: newShopData.upi_id.trim(),
          shop_location: location,
          shop_lat: newShopData.shop_lat,
          shop_lng: newShopData.shop_lng,
        }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Shop creation failed");

      setShop(body.shop);
      if (body.shop) fetchJobs(body.shop.id);
    } catch (error) {
      const e = error as Error;
      setCreateShopError(e.message || "Failed to create shop. Please check details and try again.");
    } finally {
      setCreatingShop(false);
    }
  };


  const updateStatus = async (id: string, status: string) => {
    await supabase.from("jobs").update({ status }).eq("id", id);
  };

  const initiateVerification = async (job: Job, mode: 'complete' | 'reprint') => {
    // Check if shop is awaiting approval and trial scan limit is reached
    if (isTrialLimitReached) {
      setShowApprovalModal(true);
      return;
    }

    // ── SECURITY CHECK ───────────────────────────────────────────────────────
    // Check if file was deleted by user or software privacy policy
    if (job.is_deleted_by_user) {
      setNotifications(prev => [{
        id: `action-blocked-${Date.now()}`,
        type: 'error',
        message: "Deleted by customer",
        subMessage: "The customer removed this file. Action unavailable.",
        timestamp: new Date()
      }, ...prev]);
      return;
    }

    if (job.is_auto_deleted || (job.file_path === null && !job.is_deleted_by_user)) {
      setNotifications(prev => [{
        id: `action-blocked-${Date.now()}`,
        type: 'error',
        message: "Removed by privacy policy",
        subMessage: "Files expire automatically 5 minutes after upload.",
        timestamp: new Date()
      }, ...prev]);
      return;
    }

    if (shop?.generate_token === false) {
      // Skip verification if shop disabled tokens
      if (mode === 'complete') {
        await updateStatus(job.id, "printed");
        setJobs(docs => docs.map(d => d.id === job.id ? { ...d, status: 'printed' } : d));

        setNotifications(prev => [{
          id: `status-${Date.now()}`,
          type: 'success',
          message: "Job completed",
          subMessage: `${job.file_name} marked as printed.`,
          timestamp: new Date()
        }, ...prev]);
      } else {
        handlePrint(job);
      }
    } else {
      setTokenChallengeInput("");
      setTokenError(null);
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
        handlePrint(job);
      }

      setVerifyingJobId(null);
      setVerificationMode(null);
      setTokenChallengeInput("");
      setTokenError(null);
    } else {
      setTokenError("Incorrect 2-digit code. Check with the customer and try again.");
    }
  };

  const handlePrint = async (job: Job) => {
    if (isTrialLimitReached) {
      setShowApprovalModal(true);
      return;
    }

    if (job.is_deleted_by_user) {
      setNotifications(prev => [{
        id: `print-blocked-${Date.now()}`,
        type: 'error',
        message: "Deleted by customer",
        subMessage: "The customer removed this file. Printing is disabled.",
        timestamp: new Date()
      }, ...prev]);
      return;
    }

    if (job.is_auto_deleted || (job.file_path === null && !job.is_deleted_by_user)) {
      setNotifications(prev => [{
        id: `print-blocked-${Date.now()}`,
        type: 'error',
        message: "Removed by privacy policy",
        subMessage: "Files expire automatically 5 minutes after upload.",
        timestamp: new Date()
      }, ...prev]);
      return;
    }

    setActivePrintJob(job);
    setIsDecrypting(true);
    setPrintPreviewUrl(null);

    try {
      const { data: actionAllowed } = await supabase.rpc("check_file_action_allowed", {
        job_uuid: job.id,
        action_type: "print",
      });
      if (actionAllowed === false) {
        setNotifications(prev => [{
          id: `err-${Date.now()}`,
          type: 'error',
          message: "Print unavailable",
          subMessage: "This file has expired or was deleted by the customer.",
          timestamp: new Date()
        }, ...prev]);
        setActivePrintJob(null);
        return;
      }

      const storageRes = await supabase.storage.from("documents").createSignedUrl(job.file_path, 60 * 5);

      if (storageRes.error) {
        if (storageRes.error.message?.includes("Object not found") || (storageRes.error as { status?: number }).status === 404) {
          setPurgedJob(job);
          setActivePrintJob(null);
          return;
        }
        throw storageRes.error;
      }

      if (storageRes.data?.signedUrl) {
        await updateStatus(job.id, "printed");
        setJobs(docs => docs.map(d => d.id === job.id ? { ...d, status: 'printed' } : d));

        const params = {
          documentPath: storageRes.data.signedUrl,
          jobId: job.id,
          shopId: shop?.id || ''
        };

        if (typeof window !== 'undefined' && (window as any).electronAPI?.openStudioWindow) {
          (window as any).electronAPI.openStudioWindow(params);
        } else {
          const queryString = new URLSearchParams(params).toString();
          const w = typeof window !== 'undefined' ? window.screen.availWidth : 1280;
          const h = typeof window !== 'undefined' ? window.screen.availHeight : 900;
          window.open(`/studio?${queryString}`, '_blank', `width=${w},height=${h},top=0,left=0,resizable=yes,scrollbars=yes`);
        }
        setActivePrintJob(null);
        setPrintPreviewUrl(null);
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
    if (isTrialLimitReached) {
      setShowApprovalModal(true);
      return;
    }
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
        message: "Data Deleted Successfully",
        subMessage: `Job ${job.token} data securely wiped.`,
        timestamp: new Date()
      }, ...prev]);
    } catch (error) {
      const e = error as Error;
      console.error("Deletion protocol failed:", error);
      setNotifications(prev => [{
        id: `purge-err-${Date.now()}`,
        type: 'error',
        message: "Delete Failed",
        subMessage: e.message,
        timestamp: new Date()
      }, ...prev]);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = async (job: Job) => {
    if (isTrialLimitReached) {
      setShowApprovalModal(true);
      return;
    }
    // ── SECURITY CHECKS ─────────────────────────────────────────────────────
    if (job.is_deleted_by_user) {
      setNotifications(prev => [{
        id: `download-blocked-${Date.now()}`,
        type: 'error',
        message: "⛔ USER DELETED THIS FILE",
        subMessage: `Customer manually deleted this file. No actions allowed. Database enforced.`,
        timestamp: new Date()
      }, ...prev]);
      return;
    }

    if (job.is_auto_deleted || (job.file_path === null && !job.is_deleted_by_user)) {
      setNotifications(prev => [{
        id: `download-blocked-${Date.now()}`,
        type: 'error',
        message: "🛡️ DELETED BY PRIVACY POLICY",
        subMessage: `File deleted automatically after 5 minutes due to software privacy policy.`,
        timestamp: new Date()
      }, ...prev]);
      return;
    }

    setActiveDownloadId(job.id);

    try {
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
      console.error("Download error:", error);
      setNotifications(prev => [{
        id: `dl-err-${Date.now()}`,
        type: 'error',
        message: "Download failed",
        subMessage: e.message || "Could not download the file.",
        timestamp: new Date()
      }, ...prev]);
    } finally {
      setTimeout(() => setActiveDownloadId(null), 800);
    }
  };

  const downloadQRAsImage = async () => {
    const qrContainer = document.getElementById("admin-qr-container");
    if (!qrContainer) return;
    try {
      if (!html2canvas) return;
      const canvas = await html2canvas(qrContainer as HTMLElement, {
        scale: 4,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${shop?.slug || "shop"}_qr.png`;
      link.click();
    } catch (err) {
      console.error("Error downloading QR:", err);
    }
  };

  const isShopOptionEnabled = (key: string): boolean => {
    const val = shop?.[key as keyof Shop];
    if (key === "require_customer_name" || key === "show_duplex" || key === "accept_preorders") {
      return val === true;
    }
    return val !== false;
  };

  const toggleShopOpen = async () => {
    if (!shop) return;
    const nextOpen = shop.is_open === false;
    setShop({ ...shop, is_open: nextOpen });
    const { error } = await supabase
      .from("shops")
      .update({ is_open: nextOpen })
      .eq("id", shop.id);
    if (error) {
      setShop(prev => prev ? { ...prev, is_open: !nextOpen } : null);
      setNotifications(prev => [{
        id: `open-err-${Date.now()}`,
        type: 'error',
        message: "Status update failed",
        subMessage: error.message,
        timestamp: new Date()
      }, ...prev]);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingSettings(true);

    if (!shop?.shop_location || shop.shop_location.trim().length < 2) {
      setNotifications(prev => [{
        id: `sync-err-${Date.now()}`,
        type: 'error',
        message: "Location required",
        subMessage: "Please enter your shop address before saving.",
        timestamp: new Date()
      }, ...prev]);
      setUpdatingSettings(false);
      return;
    }

    const monoPrice = Math.max(0, Math.min(1000, shop?.price_mono || 0));
    const colorPrice = Math.max(0, Math.min(1000, shop?.price_color || 0));

    let updateData: any = {
      upi_id: shop?.upi_id,
      shop_location: shop?.shop_location || "",
      price_mono: monoPrice,
      price_color: colorPrice,
      is_open: shop?.is_open !== false,
      require_customer_name: isShopOptionEnabled("require_customer_name"),
      show_copies: isShopOptionEnabled("show_copies"),
      show_color_mode: isShopOptionEnabled("show_color_mode"),
      show_duplex: isShopOptionEnabled("show_duplex"),
      generate_token: isShopOptionEnabled("generate_token"),
      accept_preorders: isShopOptionEnabled("accept_preorders"),
      contact_number: shop?.contact_number || ""
    };

    if (shop?.shop_lat !== undefined) updateData.shop_lat = shop.shop_lat;
    if (shop?.shop_lng !== undefined) updateData.shop_lng = shop.shop_lng;

    let { error } = await supabase
      .from("shops")
      .update(updateData)
      .eq("id", shop?.id);

    if (error && error.code === "42703") {
      delete updateData.shop_lat;
      delete updateData.shop_lng;
      const retry = await supabase
        .from("shops")
        .update(updateData)
        .eq("id", shop?.id);
      error = retry.error;
    }

    if (error) {
      setNotifications(prev => [{
        id: `sync-err-${Date.now()}`,
        type: 'error',
        message: "Could not save settings",
        subMessage: error.message,
        timestamp: new Date()
      }, ...prev]);
    } else {
      setShowingSettings(false);
      setConfirmFlushQueue(false);
      setNotifications(prev => [{
        id: `sync-ok-${Date.now()}`,
        type: 'success',
        message: "Settings saved",
        subMessage: "Customer upload preferences updated.",
        timestamp: new Date()
      }, ...prev]);
    }
    setUpdatingSettings(false);
  };

  const handleFlushQueue = async () => {
    if (!shop) return;

    setUpdatingSettings(true);
    try {
      const filePaths = jobs.map(j => j.file_path).filter(Boolean);
      if (filePaths.length > 0) {
        await supabase.storage.from('documents').remove(filePaths);
      }

      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('shop_id', shop.id);

      if (error) throw error;

      setJobs([]);
      setConfirmFlushQueue(false);
      setShowingSettings(false);
      setNotifications(prev => [{
        id: `flush-ok-${Date.now()}`,
        type: 'success',
        message: "Queue cleared",
        subMessage: "All print jobs and uploaded files have been removed.",
        timestamp: new Date()
      }, ...prev]);
    } catch (error) {
      console.error("Flush failure:", error);
      setNotifications(prev => [{
        id: `flush-err-${Date.now()}`,
        type: 'error',
        message: "Could not clear queue",
        subMessage: (error as Error).message,
        timestamp: new Date()
      }, ...prev]);
    } finally {
      setUpdatingSettings(false);
    }
  };

  // ── FEEDBACK MANAGEMENT FUNCTIONS ─────────────────────────────────────────
  
  const fetchCustomFeedbackQuestions = async () => {
    if (!shop) return;
    
    const { data, error } = await supabase
      .from('feedback_questions_custom')
      .select('*')
      .eq('shop_id', shop.id)
      .eq('is_active', true)
      .order('display_order');
    
    if (error) {
      console.error('Error fetching custom questions:', error);
      return;
    }
    
    setCustomFeedbackQuestions(data || []);
  };

  const fetchFeedbackResponses = async () => {
    if (!shop) return;
    
    const { data, error } = await supabase
      .from('feedback_responses')
      .select('*')
      .eq('shop_id', shop.id)
      .order('submitted_at', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error('Error fetching feedback responses:', error);
      return;
    }
    
    setFeedbackResponses(data || []);
  };

  const fetchFeedbackAnalytics = async () => {
    if (!shop) return;
    
    const { data, error } = await supabase
      .from('shop_feedback_analytics')
      .select('*')
      .eq('shop_id', shop.id)
      .single();
    
    if (error && error.code !== 'PGRST116') { // Not found is ok
      console.error('Error fetching feedback analytics:', error);
      return;
    }
    
    setFeedbackAnalytics(data);
  };

  const handleAddCustomQuestion = async () => {
    if (!shop || !newQuestionText.trim()) return;

    setAddingQuestion(true);
    setFeedbackError(null);

    const options = newQuestionOptions.split(',').map(o => o.trim()).filter(Boolean);

    const { error } = await supabase
      .from('feedback_questions_custom')
      .insert({
        shop_id: shop.id,
        question_text: newQuestionText.trim(),
        question_type: 'emoji',
        options: JSON.stringify(options),
        is_active: true,
        display_order: customFeedbackQuestions.length
      });

    if (error) {
      console.error('Error adding question:', error);
      setFeedbackError('Could not add question. Please try again.');
    } else {
      setNewQuestionText("");
      await fetchCustomFeedbackQuestions();
    }

    setAddingQuestion(false);
  };

  const handleDeleteCustomQuestion = async (questionId: string) => {
    setFeedbackError(null);
    const { error } = await supabase
      .from('feedback_questions_custom')
      .update({ is_active: false })
      .eq('id', questionId);

    if (error) {
      console.error('Error deleting question:', error);
      setFeedbackError('Could not delete question. Please try again.');
    } else {
      setConfirmDeleteQuestionId(null);
      await fetchCustomFeedbackQuestions();
    }
  };

  const toggleShopFeedback = async () => {
    if (!shop) return;

    const newValue = !(shop.feedback_enabled !== false);

    const { error } = await supabase
      .from('shops')
      .update({ feedback_enabled: newValue })
      .eq('id', shop.id);

    if (error) {
      console.error('Error toggling feedback:', error);
      setNotifications(prev => [{
        id: `fb-err-${Date.now()}`,
        type: 'error',
        message: "Update failed",
        subMessage: "Could not update feedback setting.",
        timestamp: new Date()
      }, ...prev]);
    } else {
      setShop({ ...shop, feedback_enabled: newValue });
    }
  };

  const toggleCustomFeedback = async () => {
    if (!shop) return;

    const newValue = !shop.custom_feedback_enabled;

    const { error } = await supabase
      .from('shops')
      .update({ custom_feedback_enabled: newValue })
      .eq('id', shop.id);

    if (error) {
      console.error('Error toggling custom feedback:', error);
      setNotifications(prev => [{
        id: `cfb-err-${Date.now()}`,
        type: 'error',
        message: "Update failed",
        subMessage: "Could not update custom questions setting.",
        timestamp: new Date()
      }, ...prev]);
    } else {
      setShop({ ...shop, custom_feedback_enabled: newValue });
      if (newValue) {
        await fetchCustomFeedbackQuestions();
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredJobs = normalizedQuery
    ? jobs.filter(job =>
        job.token.toLowerCase().includes(normalizedQuery) ||
        job.file_name.toLowerCase().includes(normalizedQuery) ||
        (job.customer_name || "").toLowerCase().includes(normalizedQuery) ||
        (job.customer_phone || "").toLowerCase().includes(normalizedQuery)
      )
    : jobs;

  const publicWebUrl = getPublicOrigin();
  const publicDisplayHost = formatDisplayUrl(publicWebUrl) || "xeroxq.app";
  const qrUrl = shop?.slug ? `${publicWebUrl}/${shop.slug}` : "";

  if (loading) {
    const skelCls = isDark ? "bg-white/[0.08]" : "bg-[#E4E4E7]";
    return (
      <div className={cn("min-h-screen transition-colors", isDark ? "bg-[#111113] text-[#EDEDED]" : "bg-[#FAFAFA] text-[#171717]")}>
        <div className={cn("w-full border-b", isDark ? "bg-[#19191B] border-white/[0.08]" : "bg-white border-[#171717]/[0.08]")}>
          <div className="w-full px-5 lg:px-10 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className={cn("w-10 h-10 rounded-lg", skelCls)} />
              <Skeleton className={cn("w-40 h-6", skelCls)} />
            </div>
            <div className="flex gap-2 pr-12 lg:pr-[50px]">
              <Skeleton className={cn("w-20 h-9 rounded-lg", skelCls)} />
              <Skeleton className={cn("w-20 h-9 rounded-lg", skelCls)} />
              <Skeleton className={cn("w-9 h-9 rounded-lg", skelCls)} />
            </div>
          </div>
        </div>

        <div className="w-full px-6 sm:px-10 lg:px-[72px] pt-5 pb-3.5 flex items-center justify-between">
          <Skeleton className={cn("w-36 h-7 rounded-md", skelCls)} />
          <div className="flex gap-2">
            <Skeleton className={cn("w-56 h-9 rounded-lg", skelCls)} />
            <Skeleton className={cn("w-9 h-9 rounded-lg", skelCls)} />
          </div>
        </div>

        <main className="w-full px-6 sm:px-10 lg:px-[72px] mt-1 flex flex-col h-[calc(100vh-180px)]">
          <div className={cn("flex-1 border rounded-xl overflow-hidden flex flex-col", isDark ? "bg-[#19191B] border-white/[0.08]" : "bg-white border-[#171717]/[0.08]")}>
            <div className={cn("divide-y", isDark ? "divide-white/[0.06]" : "divide-[#171717]/[0.06]")}>
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex items-center gap-6 px-6 py-5">
                  <Skeleton className={cn("w-9 h-9 rounded-lg shrink-0", skelCls)} />
                  <div className="flex-1 space-y-2">
                    <Skeleton className={cn("w-[28%] h-4", skelCls)} />
                    <Skeleton className={cn("w-[18%] h-3", skelCls)} />
                  </div>
                  <Skeleton className={cn("w-[16%] h-7 rounded-lg", skelCls)} />
                  <Skeleton className={cn("w-[10%] h-8 rounded-lg", skelCls)} />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // --- STATE 1: SETUP SHOP ---
  if (!shop) {
    const cleanedCustomForDisplay = finalizeSlugInput(shopSlugInput);
    const previewSlug = slugAvailability.resolvedSlug || cleanedCustomForDisplay;
    const hasValidShopName = newShopData.name.trim().length >= 2;
    const setupInputCls = cn(
      "w-full h-11 px-3.5 rounded-lg border text-[14px] outline-none transition-colors",
      isDark
        ? "bg-[#232325] border-white/[0.10] text-[#EDEDED] placeholder:text-[#85858B] focus:border-white/30"
        : "bg-white border-[#171717]/[0.12] text-[#171717] placeholder:text-[#737373] focus:border-[#171717]/40"
    );
    const setupLabelCls = cn("text-[13px] font-medium", isDark ? "text-[#EDEDED]" : "text-[#171717]");

    return (
      <div className={cn("flex w-full min-h-screen overflow-x-hidden relative transition-colors", isDark ? "bg-[#111113] text-[#EDEDED]" : "bg-[#FAFAFA] text-[#171717]")}>
        <div className="w-full lg:w-[580px] min-h-screen flex flex-col justify-between px-6 py-8 lg:px-14 shrink-0 relative z-10 border-r border-transparent lg:border-inherit">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src="/logo_color.png" alt="XeroxQ" className="w-7 h-7 object-contain rounded-md" />
              <span className="text-[15px] font-semibold tracking-tight">XeroxQ</span>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className={cn(
                "h-8 px-2.5 rounded-lg border text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer",
                isDark
                  ? "bg-[#19191B] border-white/[0.08] text-[#A1A1A6] hover:text-[#EDEDED]"
                  : "bg-white border-[#171717]/[0.08] text-[#525252] hover:text-[#171717]"
              )}
              title={isDark ? "Switch to light theme" : "Switch to dark theme"}
            >
              {isDark ? <Sun className="w-3.5 h-3.5" strokeWidth={1.75} /> : <Moon className="w-3.5 h-3.5" strokeWidth={1.75} />}
              <span>{isDark ? "Light" : "Dark"}</span>
            </button>
          </div>

          <form onSubmit={handleCreateShop} className="flex flex-col gap-5 w-full max-w-[400px] mx-auto my-8">
            <div className="flex flex-col gap-1">
              <h1 className="text-[28px] leading-tight font-semibold tracking-tight">
                Set up your shop
              </h1>
              <p className={cn("text-[14px] font-normal", isDark ? "text-[#A1A1A6]" : "text-[#525252]")}>
                Create your print queue link and accept uploads in seconds.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={setupLabelCls} htmlFor="setup-shop-name">Shop name</label>
                <input
                  id="setup-shop-name"
                  type="text"
                  required
                  placeholder="e.g., Campus Copy Center"
                  className={setupInputCls}
                  value={newShopData.name}
                  onChange={(e) => setNewShopData({ ...newShopData, name: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className={cn(setupLabelCls, "flex items-center gap-1.5")} htmlFor="shop-slug-input">
                    <Link2 className="w-3.5 h-3.5 opacity-70" strokeWidth={1.75} />
                    Customer link
                  </label>
                  {isSlugEdited && (
                    <button
                      type="button"
                      onClick={() => setIsSlugEdited(false)}
                      className="text-[12px] font-medium text-[#FB432C] hover:underline cursor-pointer"
                    >
                      Auto-generate
                    </button>
                  )}
                </div>
                <div className={cn(
                  "flex items-center w-full h-11 rounded-lg border transition-colors overflow-hidden",
                  isDark
                    ? "bg-[#232325] border-white/[0.10] focus-within:border-white/30"
                    : "bg-white border-[#171717]/[0.12] focus-within:border-[#171717]/40"
                )}>
                  <span className={cn("pl-3.5 pr-0.5 text-[12px] font-mono select-none shrink-0", isDark ? "text-[#85858B]" : "text-[#737373]")}>
                    {publicDisplayHost}/
                  </span>
                  <input
                    id="shop-slug-input"
                    type="text"
                    required
                    placeholder="shopname"
                    value={shopSlugInput}
                    onChange={(e) => {
                      setIsSlugEdited(true);
                      setShopSlugInput(normalizeSlugTyping(e.target.value));
                    }}
                    onBlur={() => {
                      if (isSlugEdited) {
                        setShopSlugInput((prev) => finalizeSlugInput(prev));
                      }
                    }}
                    className={cn("flex-1 min-w-0 h-full pr-3 bg-transparent border-none outline-none font-mono text-[13px] font-medium", isDark ? "text-[#EDEDED] placeholder:text-[#85858B]" : "text-[#171717] placeholder:text-[#737373]")}
                  />
                </div>
                <div className="min-h-[18px]">
                  {!hasValidShopName && !isSlugEdited ? (
                    <p className={cn("text-[12px]", isDark ? "text-[#85858B]" : "text-[#737373]")}>
                      Your customer upload URL will appear here.
                    </p>
                  ) : slugAvailability.checking ? (
                    <p className={cn("text-[12px]", isDark ? "text-[#85858B]" : "text-[#737373]")}>
                      Checking availability...
                    </p>
                  ) : isSlugEdited && cleanedCustomForDisplay.length < MIN_SHOP_SLUG_LENGTH ? (
                    <p className="text-[12px] text-amber-600">
                      Use at least {MIN_SHOP_SLUG_LENGTH} characters (letters, numbers, hyphens).
                    </p>
                  ) : slugAvailability.isReserved ? (
                    <p className="text-[12px] text-amber-600">
                      Reserved name — will use <span className="font-mono font-medium">{publicDisplayHost}/{previewSlug}</span>
                    </p>
                  ) : slugAvailability.wasTaken ? (
                    <p className="text-[12px] text-amber-600">
                      Already taken — will use <span className="font-mono font-medium">{publicDisplayHost}/{previewSlug}</span>
                    </p>
                  ) : previewSlug ? (
                    <p className={cn("text-[12px] font-medium", isDark ? "text-[#4CC38A]" : "text-[#16A34A]")}>
                      Available: <span className="font-mono">{publicDisplayHost}/{previewSlug}</span>
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className={setupLabelCls} htmlFor="setup-phone">Phone number</label>
                  <input
                    id="setup-phone"
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    className={setupInputCls}
                    value={newShopData.phone}
                    onChange={(e) => setNewShopData({ ...newShopData, phone: e.target.value.replace(/[^0-9+\s-]/g, "") })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={setupLabelCls} htmlFor="setup-upi">UPI ID</label>
                  <input
                    id="setup-upi"
                    type="text"
                    required
                    placeholder="shop@upi"
                    className={cn(setupInputCls, "font-mono")}
                    value={newShopData.upi_id}
                    onChange={(e) => setNewShopData({ ...newShopData, upi_id: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={setupLabelCls}>
                  Shop location <span className="text-[#FB432C]">*</span>
                </label>
                <LocationAutocomplete
                  value={newShopData.shop_location}
                  onChange={(value, lat, lng) => setNewShopData({
                    ...newShopData,
                    shop_location: value,
                    shop_lat: lat ?? null,
                    shop_lng: lng ?? null
                  })}
                  placeholder="e.g., Rajamundry, Andhra Pradesh"
                  required
                  isDark={isDark}
                  className="h-11 rounded-lg text-[14px] font-normal"
                />
                <p className={cn("text-[12px]", isDark ? "text-[#85858B]" : "text-[#737373]")}>
                  Shown to nearby customers looking for a print shop.
                </p>
              </div>
            </div>

            {createShopError && (
              <div className={cn(
                "p-3 border text-[13px] rounded-lg flex items-start gap-2 font-medium",
                isDark
                  ? "bg-[#E5484D]/10 border-[#E5484D]/25 text-[#E5484D]"
                  : "bg-[#DC2626]/[0.06] border-[#DC2626]/20 text-[#DC2626]"
              )}>
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.75} />
                <span>{createShopError}</span>
              </div>
            )}

            <button
              disabled={creatingShop}
              className="w-full h-11 bg-[#FB432C] hover:bg-[#E03923] disabled:opacity-60 text-white rounded-lg text-[14px] font-medium transition-colors cursor-pointer"
            >
              {creatingShop ? "Creating shop..." : "Create shop"}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className={cn("text-[13px] font-medium text-center w-full transition-colors cursor-pointer", isDark ? "text-[#A1A1A6] hover:text-[#EDEDED]" : "text-[#525252] hover:text-[#171717]")}
            >
              Signed in with the wrong account? <span className="underline underline-offset-2">Sign out</span>
            </button>
          </form>

          <p className={cn("text-[12px]", isDark ? "text-[#85858B]" : "text-[#737373]")}>
            Customer files auto-delete after 5 minutes for privacy.
          </p>
        </div>

        <div className={cn("hidden lg:flex flex-1 relative min-h-screen border-l overflow-hidden", isDark ? "border-white/[0.08] bg-[#19191B]" : "border-[#171717]/[0.08] bg-[#F4F4F5]")}>
          <div
            className="absolute inset-0 w-full h-full bg-cover bg-center opacity-95"
            style={{ backgroundImage: "url('/login-image.png')" }}
          />
        </div>
      </div>
    );
  }


  const surfaceCard = isDark ? "bg-[#19191B] border-white/[0.08]" : "bg-white border-[#171717]/[0.08]";
  const surfaceSubtle = isDark ? "bg-[#232325] border-white/[0.08]" : "bg-[#F4F4F5] border-[#171717]/[0.08]";
  const modalCls = isDark
    ? "bg-[#19191B] border border-white/[0.10] text-[#EDEDED] shadow-2xl"
    : "bg-white border border-[#171717]/[0.10] text-[#171717] shadow-xl";
  const inputCls = isDark
    ? "bg-[#232325] border border-white/[0.10] text-[#EDEDED] placeholder:text-[#85858B] focus:border-white/30"
    : "bg-white border border-[#171717]/[0.12] text-[#171717] placeholder:text-[#737373] focus:border-[#171717]/40";
  const btnSecondaryCls = isDark
    ? "bg-[#232325] border border-white/[0.10] text-[#EDEDED] hover:bg-white/[0.08]"
    : "bg-white border border-[#171717]/[0.12] text-[#171717] hover:bg-[#F4F4F5]";
  const btnPrimaryCls = isDark
    ? "bg-[#EDEDED] text-[#111113] hover:bg-white"
    : "bg-[#171717] text-white hover:bg-[#262626]";
  const txtPrimary = isDark ? "text-[#EDEDED]" : "text-[#171717]";
  const txtSecondary = isDark ? "text-[#A1A1A6]" : "text-[#525252]";
  const txtMuted = isDark ? "text-[#85858B]" : "text-[#737373]";
  const dividerCls = isDark ? "border-white/[0.08]" : "border-[#171717]/[0.08]";
  const showColorOption = isShopOptionEnabled("show_color_mode");
  const showDuplexOption = isShopOptionEnabled("show_duplex");
  const showCopiesOption = isShopOptionEnabled("show_copies");
  const allSpecOptionsOff = !showColorOption && !showDuplexOption && !showCopiesOption;

  return (
    <div
      style={{ colorScheme: theme }}
      className={cn(
        "flex flex-col w-full h-screen overflow-hidden relative transition-colors",
        isDark ? "bg-[#111113] text-[#EDEDED]" : "bg-[#FAFAFA] text-[#171717]"
      )}
    >
      {/* XEROX CONNECTKEY PRINT EDITOR */}
      {activePrintJob && printPreviewUrl && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-6 backdrop-blur-[2px]">
          <XeroxQPrintDialog
            documentPath={printPreviewUrl}
            jobId={activePrintJob.id}
            shopId={shop.id}
            onClose={() => { setActivePrintJob(null); setPrintPreviewUrl(null); }}
          />
        </div>
      )}

      {/* FILE PREPARATION LOADER */}
      <AnimatePresence>
        {activePrintJob && isDecrypting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 backdrop-blur-sm",
              isDark ? "bg-[#111113]/92 text-[#EDEDED]" : "bg-[#FAFAFA]/92 text-[#171717]"
            )}
          >
            <div className={cn("w-14 h-14 rounded-2xl border flex items-center justify-center mb-5", surfaceCard)}>
              <RefreshCw className="w-6 h-6 text-[#FB432C] animate-spin" strokeWidth={1.75} />
            </div>
            <p className="text-[16px] font-semibold tracking-tight mb-1">
              Preparing document
            </p>
            <p className={cn("text-[13px] max-w-xs text-center", txtSecondary)}>
              Opening {activePrintJob.file_name} for printing...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LOCATION NOTICE BAR */}
      {!shop?.shop_location && (
        <div className={cn(
          "shrink-0 w-full py-1.5 border-b",
          isDark ? "bg-[#FB432C]/15 border-[#FB432C]/25 text-[#EDEDED]" : "bg-[#FB432C]/[0.08] border-[#FB432C]/20 text-[#171717]"
        )}>
          <div className="w-full px-6 sm:px-10 lg:px-[72px] flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[12px] font-medium">
              <MapPin className="w-3.5 h-3.5 text-[#FB432C] shrink-0" strokeWidth={1.75} />
              <span>Add your shop address so nearby customers can find your store.</span>
            </div>
            <button
              type="button"
              onClick={() => setShowingSettings(true)}
              className="text-[12px] font-medium text-[#FB432C] hover:underline shrink-0 cursor-pointer"
            >
              Add location
            </button>
          </div>
        </div>
      )}

      {/* TOP HEADER */}
      <div className={cn("shrink-0 relative w-full border-b z-30", isDark ? "bg-[#19191B] border-white/[0.08]" : "bg-white border-[#171717]/[0.08]")}>
        <div className="w-full px-5 lg:px-10 py-3.5">
          <div className="flex items-center justify-between gap-3">
            {/* Left: logo + shop name + shop link stacked */}
            <div className="flex items-center gap-3 min-w-0 pl-12 lg:pl-[50px]">
              <div className={cn("w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 p-1 overflow-hidden", surfaceSubtle)}>
                <img src="/logo_color.png" alt="XeroxQ" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col justify-center gap-0.5 min-w-0">
                <h1 className="text-[17px] lg:text-[18px] font-semibold leading-tight tracking-tight truncate">
                  {shop.name}
                </h1>
                {shop?.slug && (
                  <div className="flex items-center gap-1.5 text-[12px] font-mono min-w-0">
                    <a
                      href={qrUrl || `/${shop.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn("truncate max-w-[200px] sm:max-w-[300px] hover:underline leading-none", txtSecondary)}
                      title={`Open ${publicDisplayHost}/${shop.slug}`}
                    >
                      {publicDisplayHost}/{shop.slug}
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        const url = qrUrl || `${window.location.origin}/${shop.slug}`;
                        navigator.clipboard?.writeText(url);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 1800);
                      }}
                      className={cn("p-0.5 rounded transition-colors cursor-pointer shrink-0", txtMuted, isDark ? "hover:text-[#EDEDED] hover:bg-white/[0.08]" : "hover:text-[#171717] hover:bg-black/[0.05]")}
                      title={copiedLink ? "Copied" : "Copy shop link"}
                    >
                      {copiedLink ? <Check className={cn("w-3 h-3", isDark ? "text-[#4CC38A]" : "text-[#16A34A]")} strokeWidth={1.75} /> : <Copy className="w-3 h-3" strokeWidth={1.75} />}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right: controls (keeps Electron titleBarOverlay margin pr-12 lg:pr-[50px]) */}
            <div className="flex items-center gap-2 shrink-0 pr-12 lg:pr-[50px]">
              {/* Sound Alerts */}
              <button
                type="button"
                onClick={isSoundEnabled ? toggleSound : requestNotificationPermission}
                className={cn(
                  "h-9 w-9 lg:w-auto lg:px-3 border rounded-lg flex items-center justify-center lg:gap-1.5 text-[13px] font-medium transition-colors cursor-pointer",
                  isSoundEnabled
                    ? (isDark ? "bg-[#FB432C]/15 border-[#FB432C]/30 text-[#FB432C]" : "bg-[#FB432C]/[0.08] border-[#FB432C]/25 text-[#FB432C]")
                    : btnSecondaryCls
                )}
                title={isSoundEnabled ? "Sound alerts enabled" : "Enable sound alerts"}
              >
                {isSoundEnabled ? <Bell className="w-4 h-4" strokeWidth={1.75} /> : <BellOff className="w-4 h-4" strokeWidth={1.75} />}
                <span className="hidden lg:inline">{isSoundEnabled ? "Alerts on" : "Alerts"}</span>
              </button>

              {/* Theme Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                className={cn("h-9 w-9 lg:w-auto lg:px-3 border rounded-lg flex items-center justify-center lg:gap-1.5 text-[13px] font-medium transition-colors cursor-pointer", btnSecondaryCls)}
                title={isDark ? "Switch to light theme" : "Switch to dark theme"}
              >
                {isDark ? <Sun className="w-4 h-4" strokeWidth={1.75} /> : <Moon className="w-4 h-4" strokeWidth={1.75} />}
                <span className="hidden lg:inline">{isDark ? "Light" : "Dark"}</span>
              </button>

              {/* Settings Dialog */}
              <Dialog
                open={showingSettings}
                onOpenChange={(open) => {
                  setShowingSettings(open);
                  if (!open) setConfirmFlushQueue(false);
                }}
              >
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className={cn("h-9 w-9 lg:w-auto lg:px-3 border rounded-lg flex items-center justify-center lg:gap-1.5 text-[13px] font-medium transition-colors cursor-pointer", btnSecondaryCls)}
                    title="Shop settings"
                  >
                    <Settings className="w-4 h-4" strokeWidth={1.75} />
                    <span className="hidden lg:inline">Settings</span>
                  </button>
                </DialogTrigger>
                <DialogContent className={cn("sm:max-w-2xl rounded-2xl p-0 overflow-hidden", modalCls)}>
                  <div className="flex flex-col h-full max-h-[90vh]">
                    <DialogHeader className={cn("px-6 py-4 border-b text-left", dividerCls)}>
                      <div className="flex items-center gap-3">
                        <div className={cn("w-9 h-9 rounded-lg border flex items-center justify-center shrink-0", surfaceSubtle)}>
                          <Settings className="w-4 h-4" strokeWidth={1.75} />
                        </div>
                        <div>
                          <DialogTitle className="text-[17px] font-semibold tracking-tight leading-snug">
                            Shop settings
                          </DialogTitle>
                          <DialogDescription className={cn("text-[13px]", txtSecondary)}>
                            Manage payment details, upload options, pricing, and feedback.
                          </DialogDescription>
                        </div>
                      </div>
                    </DialogHeader>

                    <form onSubmit={handleUpdateSettings} className="flex-1 overflow-y-auto p-6 space-y-6">
                      {/* Section 1: Shop & Location */}
                      <div className="space-y-3">
                        <h3 className={cn("text-[13px] font-semibold", txtPrimary)}>Shop details</h3>
                        <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border", surfaceSubtle)}>
                          <div className="flex flex-col gap-1.5">
                            <label className={cn("text-[12px] font-medium", txtSecondary)}>UPI ID</label>
                            <input
                              type="text"
                              value={shop?.upi_id || ""}
                              onChange={(e) => setShop({ ...shop!, upi_id: e.target.value })}
                              className={cn("w-full h-10 px-3 font-mono text-[13px] rounded-lg outline-none transition-colors", inputCls)}
                              placeholder="shop@upi"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className={cn("text-[12px] font-medium", txtSecondary)}>Contact phone (for pre-orders)</label>
                            <input
                              type="text"
                              value={shop?.contact_number || ""}
                              onChange={(e) => setShop({ ...shop!, contact_number: e.target.value })}
                              className={cn("w-full h-10 px-3 font-mono text-[13px] rounded-lg outline-none transition-colors", inputCls)}
                              placeholder="+91 XXXXX XXXXX"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5 md:col-span-2">
                            <label className={cn("text-[12px] font-medium", txtSecondary)}>
                              Shop location <span className="text-[#FB432C]">*</span>
                            </label>
                            <LocationAutocomplete
                              value={shop?.shop_location || ""}
                              onChange={(value, lat, lng) => setShop({
                                ...shop!,
                                shop_location: value,
                                shop_lat: lat ?? undefined,
                                shop_lng: lng ?? undefined
                              })}
                              placeholder="e.g., Rajamundry, Andhra Pradesh"
                              required
                              isDark={isDark}
                              className="h-10 rounded-lg text-[13px] font-normal"
                            />

                            <div className="flex items-center justify-between gap-2 mt-1">
                              <span className={cn("text-[12px] tabular-nums", txtMuted)}>
                                Coordinates: {shop?.shop_lat ? `${Number(shop.shop_lat).toFixed(4)}, ${Number(shop.shop_lng).toFixed(4)}` : "Not set"}
                              </span>
                              <button
                                type="button"
                                onClick={getCurrentLocation}
                                disabled={isGettingLocation}
                                className={cn("h-8 px-3 rounded-lg text-[12px] font-medium flex items-center gap-1.5 cursor-pointer transition-colors", btnPrimaryCls)}
                              >
                                <MapPin className="w-3.5 h-3.5" strokeWidth={1.75} />
                                {isGettingLocation ? "Detecting..." : "Use current location"}
                              </button>
                            </div>
                            {locationError && (
                              <p className={cn("text-[12px]", isDark ? "text-[#E5484D]" : "text-[#DC2626]")}>{locationError}</p>
                            )}

                            {shop?.shop_lat && shop?.shop_lng && (
                              <div className={cn("mt-2 h-[120px] rounded-lg overflow-hidden border relative z-0", dividerCls)}>
                                <LocationMap
                                  lat={Number(shop.shop_lat)}
                                  lng={Number(shop.shop_lng)}
                                  height="120px"
                                />
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-1.5 md:col-span-2">
                            <label className={cn("text-[12px] font-medium", txtSecondary)}>Accepting print jobs</label>
                            <button
                              type="button"
                              onClick={() => setShop({ ...shop!, is_open: shop?.is_open === false })}
                              className={cn(
                                "flex items-center justify-between px-3.5 h-10 rounded-lg border transition-colors cursor-pointer",
                                isDark ? "bg-[#19191B] border-white/[0.10]" : "bg-white border-[#171717]/[0.10]"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "w-2 h-2 rounded-full",
                                  shop?.is_open !== false
                                    ? (isDark ? "bg-[#4CC38A]" : "bg-[#16A34A]")
                                    : (isDark ? "bg-[#E5484D]" : "bg-[#DC2626]")
                                )} />
                                <span className="text-[13px] font-medium">
                                  {shop?.is_open !== false ? "Open — customers can send files" : "Closed — uploads paused"}
                                </span>
                              </div>
                              <div className={cn(
                                "w-9 h-5 rounded-full relative transition-colors",
                                shop?.is_open !== false
                                  ? (isDark ? "bg-[#4CC38A]" : "bg-[#16A34A]")
                                  : (isDark ? "bg-white/20" : "bg-[#D4D4D8]")
                              )}>
                                <div className={cn(
                                  "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all",
                                  shop?.is_open !== false ? "left-[18px]" : "left-0.5"
                                )} />
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Customer Upload Options */}
                      <div className="space-y-3">
                        <h3 className={cn("text-[13px] font-semibold", txtPrimary)}>Customer upload options</h3>
                        <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-xl border", surfaceCard)}>
                          {[
                            { label: "Require customer name", sub: "Show name input on upload page", key: "require_customer_name" },
                            { label: "2-digit pickup code", sub: "Verify customer token before print", key: "generate_token" },
                            { label: "Copy selector", sub: "Let customers pick copies", key: "show_copies" },
                            { label: "Color option", sub: "Let customers pick B&W or Color", key: "show_color_mode" },
                            { label: "Double-sided option", sub: "Show 1-sided / 2-sided switch", key: "show_duplex" },
                            { label: "Accept pre-orders", sub: "Allow remote pickup orders", key: "accept_preorders" }
                          ].map((toggle) => {
                            const enabled = isShopOptionEnabled(toggle.key);
                            return (
                              <div key={toggle.key} className={cn("flex items-center justify-between gap-3 p-3 rounded-lg border", surfaceSubtle)}>
                                <div className="flex flex-col">
                                  <span className="text-[13px] font-medium">{toggle.label}</span>
                                  <span className={cn("text-[11px]", txtMuted)}>{toggle.sub}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setShop({ ...shop!, [toggle.key]: !enabled })}
                                  className={cn(
                                    "w-9 h-5 rounded-full relative transition-colors shrink-0 cursor-pointer",
                                    enabled ? "bg-[#FB432C]" : (isDark ? "bg-white/20" : "bg-[#D4D4D8]")
                                  )}
                                  aria-pressed={enabled}
                                >
                                  <div className={cn(
                                    "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all",
                                    enabled ? "left-[18px]" : "left-0.5"
                                  )} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Section 3: Pricing & Queue Reset */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2.5">
                          <h3 className={cn("text-[13px] font-semibold", txtPrimary)}>Per-page pricing</h3>
                          <div className="grid grid-cols-2 gap-2.5">
                            <div className={cn("flex flex-col gap-1 p-3 border rounded-xl", surfaceSubtle)}>
                              <span className={cn("text-[11px] font-medium", txtSecondary)}>B&W page (₹)</span>
                              <div className="flex items-center gap-1.5">
                                <span className={cn("text-[14px] font-medium", txtMuted)}>₹</span>
                                <input
                                  type="number"
                                  min={0}
                                  max={1000}
                                  value={shop?.price_mono || 0}
                                  onChange={(e) => setShop({ ...shop!, price_mono: Number(e.target.value) })}
                                  className="flex-1 bg-transparent border-none text-[16px] font-semibold tabular-nums outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-full"
                                />
                              </div>
                            </div>
                            <div className={cn("flex flex-col gap-1 p-3 border rounded-xl", surfaceSubtle)}>
                              <span className={cn("text-[11px] font-medium", txtSecondary)}>Color page (₹)</span>
                              <div className="flex items-center gap-1.5">
                                <span className={cn("text-[14px] font-medium", txtMuted)}>₹</span>
                                <input
                                  type="number"
                                  min={0}
                                  max={1000}
                                  value={shop?.price_color || 0}
                                  onChange={(e) => setShop({ ...shop!, price_color: Number(e.target.value) })}
                                  className="flex-1 bg-transparent border-none text-[16px] font-semibold tabular-nums outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-full"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          <h3 className={cn("text-[13px] font-semibold", isDark ? "text-[#E5484D]" : "text-[#DC2626]")}>Clear print queue</h3>
                          <div className={cn(
                            "p-3 border rounded-xl flex flex-col justify-between gap-2",
                            isDark ? "bg-[#E5484D]/[0.08] border-[#E5484D]/25" : "bg-[#DC2626]/[0.04] border-[#DC2626]/20"
                          )}>
                            {!confirmFlushQueue ? (
                              <button
                                type="button"
                                onClick={() => setConfirmFlushQueue(true)}
                                disabled={updatingSettings || jobs.length === 0}
                                className="w-full h-9 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-medium text-[13px] rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                                Delete all queue jobs ({jobs.length})
                              </button>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={handleFlushQueue}
                                  disabled={updatingSettings}
                                  className="flex-1 h-9 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-medium text-[12px] rounded-lg cursor-pointer"
                                >
                                  Confirm delete all
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmFlushQueue(false)}
                                  className={cn("h-9 px-3 rounded-lg text-[12px] font-medium cursor-pointer", btnSecondaryCls)}
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                            <p className={cn("text-[11px]", txtMuted)}>
                              Permanently deletes all queued jobs and stored files.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Section 4: Customer Feedback */}
                      <div className="space-y-3">
                        <h3 className={cn("text-[13px] font-semibold", txtPrimary)}>Customer feedback</h3>

                        <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-xl border", surfaceSubtle)}>
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex flex-col">
                              <span className="text-[13px] font-medium">Enable feedback</span>
                              <span className={cn("text-[11px]", txtMuted)}>Ask customers to rate after pickup</span>
                            </div>
                            <button
                              type="button"
                              onClick={toggleShopFeedback}
                              className={cn(
                                "w-9 h-5 rounded-full relative transition-colors shrink-0 cursor-pointer",
                                shop?.feedback_enabled !== false
                                  ? (isDark ? "bg-[#4CC38A]" : "bg-[#16A34A]")
                                  : (isDark ? "bg-white/20" : "bg-[#D4D4D8]")
                              )}
                            >
                              <div className={cn(
                                "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all",
                                shop?.feedback_enabled !== false ? "left-[18px]" : "left-0.5"
                              )} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <div className="flex flex-col">
                              <span className="text-[13px] font-medium">Custom questions</span>
                              <span className={cn("text-[11px]", txtMuted)}>Include your own rating questions</span>
                            </div>
                            <button
                              type="button"
                              onClick={toggleCustomFeedback}
                              disabled={shop?.feedback_enabled === false}
                              className={cn(
                                "w-9 h-5 rounded-full relative transition-colors shrink-0 cursor-pointer",
                                shop?.custom_feedback_enabled
                                  ? "bg-[#FB432C]"
                                  : (isDark ? "bg-white/20" : "bg-[#D4D4D8]"),
                                shop?.feedback_enabled === false && "opacity-40 cursor-not-allowed"
                              )}
                            >
                              <div className={cn(
                                "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all",
                                shop?.custom_feedback_enabled ? "left-[18px]" : "left-0.5"
                              )} />
                            </button>
                          </div>
                        </div>

                        {shop?.custom_feedback_enabled && shop?.feedback_enabled !== false && (
                          <div className={cn("flex items-center justify-between p-3.5 border rounded-xl", surfaceCard)}>
                            <div>
                              <p className="text-[13px] font-medium">Custom questions</p>
                              <p className={cn("text-[12px]", txtMuted)}>{customFeedbackQuestions.length} active question(s)</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setFeedbackError(null);
                                setConfirmDeleteQuestionId(null);
                                setShowFeedbackManager(true);
                                fetchCustomFeedbackQuestions();
                              }}
                              className={cn("h-8 px-3 rounded-lg text-[12px] font-medium transition-colors cursor-pointer", btnPrimaryCls)}
                            >
                              Manage questions
                            </button>
                          </div>
                        )}

                        <div className={cn("flex items-center justify-between p-3.5 border rounded-xl", surfaceCard)}>
                          <div>
                            <p className="text-[13px] font-medium">Feedback responses</p>
                            <p className={cn("text-[12px] tabular-nums", txtMuted)}>{feedbackResponses.length} response(s) collected</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setShowFeedbackResponses(true);
                              fetchFeedbackResponses();
                              fetchFeedbackAnalytics();
                            }}
                            className={cn("h-8 px-3 rounded-lg text-[12px] font-medium border transition-colors cursor-pointer", btnSecondaryCls)}
                          >
                            View responses
                          </button>
                        </div>
                      </div>
                    </form>

                    <DialogFooter className={cn("px-6 py-4 border-t", surfaceSubtle, dividerCls)}>
                      <div className="flex w-full items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className={cn(
                            "h-10 px-4 rounded-lg border text-[13px] font-medium flex items-center gap-2 transition-colors cursor-pointer",
                            isDark
                              ? "border-[#E5484D]/30 text-[#E5484D] hover:bg-[#E5484D]/15"
                              : "border-[#DC2626]/25 text-[#DC2626] hover:bg-[#DC2626]/[0.08]"
                          )}
                        >
                          <LogOut className="w-4 h-4" strokeWidth={1.75} />
                          <span>Log out</span>
                        </button>
                        <div className="flex items-center gap-2.5">
                          <DialogClose asChild>
                            <button
                              type="button"
                              className={cn("h-10 px-5 rounded-lg text-[13px] font-medium border transition-colors cursor-pointer", btnSecondaryCls)}
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
                            className="h-10 px-5 bg-[#FB432C] hover:bg-[#E03923] disabled:opacity-50 text-white font-medium text-[13px] rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            {updatingSettings ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" strokeWidth={1.75} />
                                <span>Saving...</span>
                              </>
                            ) : (
                              <>
                                <span>Save changes</span>
                                <ArrowUpRight className="w-4 h-4" strokeWidth={1.75} />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </DialogFooter>
                  </div>
                </DialogContent>
              </Dialog>

              {/* FEEDBACK MANAGER DIALOG */}
              <Dialog open={showFeedbackManager} onOpenChange={setShowFeedbackManager}>
                <DialogContent className={cn("sm:max-w-[560px] rounded-2xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto", modalCls)}>
                  <DialogHeader className={cn("px-6 py-4 border-b text-left", dividerCls)}>
                    <div className="flex items-center gap-3">
                      <div className={cn("w-9 h-9 rounded-lg border flex items-center justify-center", surfaceSubtle)}>
                        <Star className="w-4 h-4 text-[#FB432C]" strokeWidth={1.75} />
                      </div>
                      <div>
                        <DialogTitle className="text-[17px] font-semibold tracking-tight">Manage custom questions</DialogTitle>
                        <DialogDescription className={cn("text-[13px]", txtSecondary)}>
                          Add short rating questions shown after a customer submits a job.
                        </DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>

                  <div className="p-6 space-y-5">
                    {feedbackError && (
                      <div className={cn("p-3 rounded-lg border text-[13px] font-medium", isDark ? "bg-[#E5484D]/10 border-[#E5484D]/25 text-[#E5484D]" : "bg-[#DC2626]/[0.06] border-[#DC2626]/20 text-[#DC2626]")}>
                        {feedbackError}
                      </div>
                    )}

                    <div className={cn("space-y-3 p-4 rounded-xl border", surfaceSubtle)}>
                      <h4 className="text-[13px] font-semibold">Add question</h4>
                      <input
                        type="text"
                        value={newQuestionText}
                        onChange={(e) => setNewQuestionText(e.target.value)}
                        placeholder="e.g., How was the print quality?"
                        className={cn("w-full h-10 px-3 rounded-lg text-[13px] outline-none", inputCls)}
                      />
                      <input
                        type="text"
                        value={newQuestionOptions}
                        onChange={(e) => setNewQuestionOptions(e.target.value)}
                        placeholder="Comma-separated options (e.g., Poor, Fair, Good, Great)"
                        className={cn("w-full h-10 px-3 rounded-lg text-[13px] outline-none", inputCls)}
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomQuestion}
                        disabled={addingQuestion || !newQuestionText.trim()}
                        className={cn("w-full h-10 font-medium text-[13px] rounded-lg disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer", btnPrimaryCls)}
                      >
                        {addingQuestion ? <RefreshCw className="w-4 h-4 animate-spin" strokeWidth={1.75} /> : <Plus className="w-4 h-4" strokeWidth={1.75} />}
                        Add question
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      <h4 className="text-[13px] font-semibold">Active questions ({customFeedbackQuestions.length})</h4>
                      {customFeedbackQuestions.length === 0 ? (
                        <p className={cn("text-[13px] text-center py-6", txtMuted)}>No custom questions yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {customFeedbackQuestions.map((q, idx) => (
                            <div key={q.id} className={cn("flex items-center justify-between gap-3 p-3 border rounded-xl", surfaceCard)}>
                              <div className="min-w-0">
                                <p className="text-[13px] font-medium truncate">{idx + 1}. {q.question_text}</p>
                                <p className={cn("text-[12px] truncate", txtMuted)}>
                                  {(Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]')).join(', ')}
                                </p>
                              </div>
                              {confirmDeleteQuestionId === q.id ? (
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCustomQuestion(q.id)}
                                    className="h-7 px-2.5 bg-[#DC2626] text-white text-[12px] font-medium rounded-md cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteQuestionId(null)}
                                    className={cn("h-7 px-2.5 text-[12px] font-medium rounded-md border cursor-pointer", btnSecondaryCls)}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteQuestionId(q.id)}
                                  className={cn("p-2 rounded-lg transition-colors cursor-pointer", txtMuted, "hover:text-[#DC2626]")}
                                  title="Delete question"
                                >
                                  <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <DialogFooter className={cn("px-6 py-4 border-t", surfaceSubtle, dividerCls)}>
                    <button
                      type="button"
                      onClick={() => setShowFeedbackManager(false)}
                      className={cn("h-9 px-5 font-medium text-[13px] rounded-lg cursor-pointer", btnPrimaryCls)}
                    >
                      Done
                    </button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* FEEDBACK RESPONSES DIALOG */}
              <Dialog open={showFeedbackResponses} onOpenChange={setShowFeedbackResponses}>
                <DialogContent className={cn("sm:max-w-[720px] rounded-2xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto", modalCls)}>
                  <DialogHeader className={cn("px-6 py-4 border-b text-left", dividerCls)}>
                    <div className="flex items-center gap-3">
                      <div className={cn("w-9 h-9 rounded-lg border flex items-center justify-center", surfaceSubtle)}>
                        <MessageSquare className="w-4 h-4 text-[#FB432C]" strokeWidth={1.75} />
                      </div>
                      <div>
                        <DialogTitle className="text-[17px] font-semibold tracking-tight">Customer feedback</DialogTitle>
                        <DialogDescription className={cn("text-[13px] tabular-nums", txtSecondary)}>
                          {feedbackAnalytics?.total_responses || feedbackResponses.length} responses · Average rating {feedbackAnalytics?.avg_rating || "N/A"}
                        </DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>

                  <div className="p-6 space-y-5">
                    {feedbackAnalytics && (
                      <div className="grid grid-cols-3 gap-3">
                        <div className={cn("p-3.5 rounded-xl border text-center", surfaceSubtle)}>
                          <p className={cn("text-[22px] font-semibold tabular-nums", isDark ? "text-[#4CC38A]" : "text-[#16A34A]")}>
                            {feedbackAnalytics.positive_count || 0}
                          </p>
                          <p className={cn("text-[12px] font-medium", txtSecondary)}>Positive</p>
                        </div>
                        <div className={cn("p-3.5 rounded-xl border text-center", surfaceSubtle)}>
                          <p className="text-[22px] font-semibold tabular-nums">
                            {feedbackAnalytics.total_responses || feedbackResponses.length}
                          </p>
                          <p className={cn("text-[12px] font-medium", txtSecondary)}>Total</p>
                        </div>
                        <div className={cn("p-3.5 rounded-xl border text-center", surfaceSubtle)}>
                          <p className={cn("text-[22px] font-semibold tabular-nums", isDark ? "text-[#E5484D]" : "text-[#DC2626]")}>
                            {feedbackAnalytics.negative_count || 0}
                          </p>
                          <p className={cn("text-[12px] font-medium", txtSecondary)}>Negative</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <h4 className="text-[13px] font-semibold">Recent responses</h4>
                      {feedbackResponses.length === 0 ? (
                        <p className={cn("text-[13px] text-center py-8", txtMuted)}>No feedback responses yet.</p>
                      ) : (
                        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                          {feedbackResponses.map((response) => (
                            <div key={response.id} className={cn("p-4 rounded-xl border", surfaceSubtle)}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[13px] font-semibold">{response.customer_name || "Anonymous"}</span>
                                <span className={cn("text-[12px] tabular-nums", txtMuted)}>
                                  {new Date(response.submitted_at).toLocaleDateString()}
                                </span>
                              </div>
                              {response.overall_rating && (
                                <div className="flex items-center gap-0.5 mb-2">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={cn(
                                        "w-3.5 h-3.5",
                                        i < response.overall_rating ? "text-[#FB432C] fill-[#FB432C]" : txtMuted
                                      )}
                                      strokeWidth={1.75}
                                    />
                                  ))}
                                </div>
                              )}
                              {(response.default_responses || response.custom_responses) && (
                                <div className="mt-2 space-y-1">
                                  {Object.entries({ ...(response.default_responses || {}), ...(response.custom_responses || {}) })
                                    .filter(([key]) => key !== 'overall_rating')
                                    .map(([key, value]) => (
                                      <div key={key} className="flex items-center gap-2 text-[12px]">
                                        <span className={txtMuted}>{key}:</span>
                                        <span className="font-medium">{String(value)}</span>
                                      </div>
                                    ))}
                                </div>
                              )}
                              {response.written_feedback && (
                                <p className={cn("text-[13px] mt-2", txtSecondary)}>"{response.written_feedback}"</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <DialogFooter className={cn("px-6 py-4 border-t", surfaceSubtle, dividerCls)}>
                    <button
                      type="button"
                      onClick={() => setShowFeedbackResponses(false)}
                      className={cn("h-9 px-5 font-medium text-[13px] rounded-lg cursor-pointer", btnPrimaryCls)}
                    >
                      Close
                    </button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* QR Dialog */}
              <Dialog open={showQR} onOpenChange={setShowQR}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className={cn("h-9 w-9 lg:w-auto lg:px-3 border rounded-lg flex items-center justify-center lg:gap-1.5 text-[13px] font-medium transition-colors cursor-pointer", btnSecondaryCls)}
                    title="Customer QR"
                  >
                    <QrCode className="w-4 h-4" strokeWidth={1.75} />
                    <span className="hidden lg:inline">QR code</span>
                  </button>
                </DialogTrigger>
                <DialogContent className={cn("sm:max-w-md rounded-2xl p-6", modalCls)}>
                  <DialogHeader className="text-left mb-2">
                    <div className={cn("w-9 h-9 rounded-lg border flex items-center justify-center mb-3", surfaceSubtle)}>
                      <QrCode className="w-4 h-4" strokeWidth={1.75} />
                    </div>
                    <DialogTitle className="text-[17px] font-semibold tracking-tight">Customer upload QR</DialogTitle>
                    <DialogDescription className={cn("text-[13px]", txtSecondary)}>
                      Customers scan this code or visit the link below to send files to your queue.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col items-center gap-4 mt-2">
                    <div className={cn("p-5 border rounded-xl w-full flex justify-center", surfaceSubtle)}>
                      <div id="admin-qr-container" className="smooth-qr p-3 bg-white rounded-lg border border-[#171717]/[0.08]">
                        <style dangerouslySetInnerHTML={{ __html: `
                          .smooth-qr svg path:nth-of-type(2) {
                            shape-rendering: auto !important;
                            stroke: #000000 !important;
                            stroke-width: 0.22px !important;
                            stroke-linejoin: round !important;
                            stroke-linecap: round !important;
                          }
                        `}} />
                        {qrUrl ? (
                          <QRCodeSVG
                            value={qrUrl}
                            size={196}
                            level="H"
                            includeMargin={false}
                            imageSettings={{
                              src: "/xeroxqlogo.svg",
                              x: undefined,
                              y: undefined,
                              height: 20,
                              width: 60,
                              excavate: true,
                            }}
                          />
                        ) : (
                          <div className="w-[196px] h-[196px] flex items-center justify-center text-[#737373] text-[13px]">
                            Generating...
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="w-full space-y-3">
                      <div className="w-full flex flex-col gap-1">
                        <span className={cn("text-[12px] font-medium", txtSecondary)}>Shop link</span>
                        <div className={cn("px-3.5 py-2.5 rounded-lg text-[12px] font-mono border w-full text-center truncate", surfaceSubtle)}>
                          {qrUrl}
                        </div>
                      </div>

                      <div className="flex gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => window.open(`/admin/poster?name=${encodeURIComponent(shop?.name || "")}&slug=${shop?.slug || ""}&upi=${shop?.upi_id || ""}`, '_blank')}
                          className={cn("flex-1 h-9 rounded-lg text-[13px] font-medium border flex items-center justify-center gap-1.5 cursor-pointer", btnSecondaryCls)}
                        >
                          <Printer className="w-3.5 h-3.5" strokeWidth={1.75} /> Poster
                        </button>
                        <button
                          type="button"
                          onClick={downloadQRAsImage}
                          className={cn("flex-1 h-9 rounded-lg text-[13px] font-medium border flex items-center justify-center gap-1.5 cursor-pointer", btnSecondaryCls)}
                        >
                          <Download className="w-3.5 h-3.5" strokeWidth={1.75} /> Save PNG
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowQR(false)}
                          className={cn("flex-1 h-9 rounded-lg text-[13px] font-medium flex items-center justify-center cursor-pointer", btnPrimaryCls)}
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* SHOPKEEPER TRIAL & APPROVAL BANNER */}
        {shop && !isShopApproved && (
          <div className={cn(
            "w-full py-2 border-t",
            isDark ? "bg-[#FB432C]/15 border-[#FB432C]/25 text-[#EDEDED]" : "bg-[#FB432C] border-[#FB432C] text-white"
          )}>
            <div className="w-full px-6 sm:px-10 lg:px-[72px] flex items-center justify-between gap-4 text-[12px] font-medium">
              <div className="flex items-center gap-2">
                <ShieldCheck className={cn("w-4 h-4 shrink-0", isDark ? "text-[#FB432C]" : "text-white")} strokeWidth={1.75} />
                <span>
                  {isTrialLimitReached
                    ? `Free trial limit reached (${filesProcessedCount}/3 scans used). Printing is locked until admin approval.`
                    : `Free trial active (${filesProcessedCount}/3 scans used). Request admin approval for unlimited printing.`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setViewReadOnlyQueue(false);
                  setShowApprovalModal(true);
                }}
                className={cn(
                  "px-3 py-1 rounded-md text-[12px] font-medium shrink-0 cursor-pointer transition-colors",
                  isDark ? "bg-[#FB432C] text-white hover:bg-[#E03923]" : "bg-white text-[#FB432C] hover:bg-white/90"
                )}
              >
                {isTrialLimitReached ? "View approval" : "Trial details"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SUB HEADER - QUEUE TITLE & SEARCH */}
      <div className="shrink-0 w-full">
        <div className="w-full px-6 sm:px-10 lg:px-[72px] pt-5 pb-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <h2 className="text-[19px] font-semibold tracking-tight">Print queue</h2>
              <span className={cn("px-2.5 py-0.5 rounded-md border text-[12px] font-medium tabular-nums", surfaceSubtle, txtSecondary)}>
                {normalizedQuery ? `${filteredJobs.length} of ${stats.total} total` : `${stats.total} total`}
              </span>
            </div>
            <div className="relative w-full sm:w-[320px] flex gap-2">
              <div className="relative flex-1">
                <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none", txtMuted)} strokeWidth={1.75} />
                <input
                  type="text"
                  placeholder="Search by customer, phone, or file..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape" && searchQuery) {
                      setSearchQuery("");
                    }
                  }}
                  className={cn("w-full h-9 rounded-lg pl-9 text-[13px] outline-none transition-colors", searchQuery ? "pr-8" : "pr-3", inputCls)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className={cn(
                      "absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center transition-colors cursor-pointer",
                      txtMuted,
                      isDark ? "hover:text-[#EDEDED] hover:bg-white/[0.08]" : "hover:text-[#171717] hover:bg-black/[0.06]"
                    )}
                    title="Clear search"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={1.75} />
                  </button>
                )}
              </div>
              <button
                type="button"
                disabled={isRefreshing}
                onClick={async () => {
                  if (!shop) return;
                  setIsRefreshing(true);
                  try {
                    await fetchJobs(shop.id);
                  } finally {
                    setTimeout(() => setIsRefreshing(false), 300);
                  }
                }}
                className={cn("h-9 w-9 flex items-center justify-center rounded-lg border transition-colors cursor-pointer shrink-0 disabled:opacity-60", btnSecondaryCls)}
                title="Refresh queue"
              >
                <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} strokeWidth={1.75} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN BODY - RESPONSIVE QUEUE */}
      <div className="flex-1 w-full px-6 sm:px-10 lg:px-[72px] pb-4 flex flex-col overflow-y-auto scrollbar-thin">

        {/* EMPTY STATE */}
        {filteredJobs.length === 0 && (
          <div className={cn("flex-1 flex flex-col items-center justify-center gap-3 border rounded-xl py-16 px-6", surfaceCard)}>
            <div className={cn("w-12 h-12 rounded-xl border flex items-center justify-center", surfaceSubtle)}>
              {normalizedQuery ? (
                <Search className={cn("w-5 h-5", txtMuted)} strokeWidth={1.75} />
              ) : (
                <Inbox className={cn("w-6 h-6", txtMuted)} strokeWidth={1.75} />
              )}
            </div>
            <div className="text-center space-y-1 max-w-sm">
              <p className="text-[16px] font-semibold tracking-tight">
                {normalizedQuery ? "No matching jobs" : "Queue is empty"}
              </p>
              <p className={cn("text-[13px] leading-relaxed", txtSecondary)}>
                {normalizedQuery
                  ? `No print jobs match "${searchQuery.trim()}".`
                  : "Files sent by customers from your QR link will appear here automatically."}
              </p>
            </div>
            {normalizedQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className={cn("mt-1 h-8 px-3.5 rounded-lg border text-[12px] font-medium transition-colors cursor-pointer", btnSecondaryCls)}
              >
                Clear search
              </button>
            )}
          </div>
        )}

        {/* MOBILE CARDS */}
        {filteredJobs.length > 0 && (
          <div className="flex flex-col gap-3 lg:hidden pb-6 overflow-y-auto scrollbar-thin">
            {filteredJobs.map((job) => {
              const jobAge = currentTime.getTime() - new Date(job.created_at).getTime();
              const isNew = jobAge < 2 * 60 * 1000;
              const isUnavailable = job.is_deleted_by_user || job.is_auto_deleted || job.file_path === null;

              return (
                <div
                  key={job.id}
                  className={cn(
                    "border rounded-xl p-4 flex flex-col gap-3 transition-colors",
                    job.is_deleted_by_user
                      ? (isDark ? "bg-[#E5484D]/[0.06] border-[#E5484D]/25" : "bg-[#DC2626]/[0.03] border-[#DC2626]/20")
                      : surfaceCard
                  )}
                >
                  {/* Row 1: Customer + Status badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-semibold truncate">{job.customer_name || "Guest"}</span>
                        {isNew && (
                          <span className={cn(
                            "px-1.5 py-0.5 rounded-md text-[11px] font-medium",
                            isDark ? "bg-[#4CC38A]/15 text-[#4CC38A]" : "bg-[#16A34A]/10 text-[#16A34A]"
                          )}>
                            New
                          </span>
                        )}
                      </div>
                      {job.customer_phone && (
                        <span className={cn("text-[12px] tabular-nums mt-0.5", txtSecondary)}>{job.customer_phone}</span>
                      )}
                    </div>
                    <div className="shrink-0">
                      {job.is_deleted_by_user ? (
                        <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 border rounded-md text-[11px] font-medium", isDark ? "bg-[#E5484D]/15 border-[#E5484D]/30 text-[#E5484D]" : "bg-[#DC2626]/10 border-[#DC2626]/25 text-[#DC2626]")}>
                          <Trash2 className="w-3 h-3" strokeWidth={1.75} /> Deleted by customer
                        </span>
                      ) : (job.is_auto_deleted || (job.file_path === null && !job.is_deleted_by_user)) ? (
                        <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 border rounded-md text-[11px] font-medium", surfaceSubtle, txtSecondary)}>
                          <Clock className="w-3 h-3" strokeWidth={1.75} /> Expired (5m)
                        </span>
                      ) : job.status === "printed" ? (
                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 border rounded-md text-[11px] font-medium", isDark ? "bg-[#4CC38A]/15 border-[#4CC38A]/30 text-[#4CC38A]" : "bg-[#16A34A]/10 border-[#16A34A]/25 text-[#16A34A]")}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", isDark ? "bg-[#4CC38A]" : "bg-[#16A34A]")} /> Printed
                        </span>
                      ) : (
                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 border rounded-md text-[11px] font-medium", isDark ? "bg-[#4CC38A]/15 border-[#4CC38A]/30 text-[#4CC38A]" : "bg-[#16A34A]/10 border-[#16A34A]/25 text-[#16A34A]")}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", isDark ? "bg-[#4CC38A]" : "bg-[#16A34A]")} /> Ready to print
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Row 2: File info */}
                  <div className={cn("flex items-center gap-3 border rounded-lg px-3 py-2.5", surfaceSubtle)}>
                    <div className={cn("w-9 h-9 border rounded-lg flex items-center justify-center shrink-0 relative", surfaceCard)}>
                      <FileText className="w-4 h-4" strokeWidth={1.75} />
                      <span className="absolute -top-1.5 -right-1.5 bg-[#FB432C] text-[9px] font-semibold text-white px-1 py-0.5 rounded uppercase leading-none">
                        {job.file_name.split('.').pop()?.substring(0, 4) || "FILE"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[13px] truncate">{job.file_name}</p>
                      <p className={cn("text-[12px] tabular-nums", txtMuted)}>
                        Received {new Date(job.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </p>
                    </div>
                  </div>

                  {/* Row 3: Print specs */}
                  <div className="flex flex-col gap-1.5">
                    {(() => {
                      const pages = job.page_count || 1;
                      const fileExt = (job.file_name.split('.').pop()?.substring(0, 4) || "FILE").toUpperCase();
                      const isColorSpec = !showColorOption
                        ? (job.preferences?.detectedColor ?? job.preferences?.color ?? false)
                        : Boolean(job.preferences?.color);
                      if (allSpecOptionsOff) {
                        return (
                          <p className={cn("text-[13px] font-medium tabular-nums", txtSecondary)}>
                            <span className={isColorSpec ? "text-[#FB432C] font-semibold" : txtPrimary}>
                              {isColorSpec ? "Color" : "B&W"}
                            </span>
                            <span className="mx-1.5 opacity-40">·</span>
                            <span className={txtPrimary}>{pages} {pages === 1 ? "page" : "pages"}</span>
                            <span className="mx-1.5 opacity-40">·</span>
                            <span>{fileExt}</span>
                          </p>
                        );
                      }
                      return (
                        <p className={cn("text-[12px] font-medium tabular-nums", txtSecondary)}>
                          <span className={isColorSpec ? "text-[#FB432C] font-semibold" : txtPrimary}>
                            {isColorSpec ? "Color" : "B&W"}
                          </span>
                          <span className="mx-1.5 opacity-40">·</span>
                          {showDuplexOption && (
                            <>
                              <span>{job.preferences?.doubleSided ? "2-sided" : "1-sided"}</span>
                              <span className="mx-1.5 opacity-40">·</span>
                            </>
                          )}
                          {showCopiesOption && (
                            <>
                              <span>{job.preferences?.copies ?? 1} {(job.preferences?.copies ?? 1) === 1 ? "copy" : "copies"}</span>
                              <span className="mx-1.5 opacity-40">·</span>
                            </>
                          )}
                          <span>{pages} {pages === 1 ? "page" : "pages"}</span>
                        </p>
                      );
                    })()}
                    {job.is_preorder && job.customer_phone && (
                      <div className={cn("flex items-center gap-2 px-3 py-1.5 border rounded-lg text-[13px] font-medium tabular-nums", surfaceSubtle)}>
                        <Smartphone className="w-3.5 h-3.5 text-[#FB432C]" strokeWidth={1.75} />
                        <span>{job.customer_phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Row 4: Action buttons */}
                  <div className={cn("flex items-center gap-2 pt-2 border-t", dividerCls)}>
                    {job.status !== "printed" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handlePrint(job)}
                          disabled={isUnavailable}
                          title={job.is_deleted_by_user ? "Deleted by customer" : isUnavailable ? "File expired after 5 minutes" : "Print document"}
                          className={cn("flex-1 h-9 rounded-lg text-[13px] font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed", btnPrimaryCls)}
                        >
                          <Printer className="w-3.5 h-3.5" strokeWidth={1.75} /> Print
                        </button>
                        <button
                          type="button"
                          onClick={() => initiateVerification(job, 'complete')}
                          disabled={isUnavailable}
                          className={cn(
                            "h-9 w-9 border rounded-lg transition-colors flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
                            isDark
                              ? "border-[#4CC38A]/30 bg-[#4CC38A]/10 text-[#4CC38A] hover:bg-[#4CC38A]/20"
                              : "border-[#16A34A]/25 bg-[#16A34A]/[0.06] text-[#16A34A] hover:bg-[#16A34A]/15"
                          )}
                          title={isUnavailable ? "File unavailable" : "Mark completed"}
                        >
                          <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => initiateVerification(job, 'reprint')}
                        disabled={isUnavailable}
                        className={cn(
                          "h-9 px-3 border rounded-lg text-[13px] font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed",
                          isDark
                            ? "bg-[#4CC38A]/15 border-[#4CC38A]/30 text-[#4CC38A] hover:bg-[#4CC38A]/20"
                            : "bg-[#16A34A]/10 border-[#16A34A]/25 text-[#16A34A] hover:bg-[#16A34A]/15"
                        )}
                        title="Reprint"
                      >
                        <Printer className="w-3.5 h-3.5" strokeWidth={1.75} /> Reprint
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDownload(job)}
                      disabled={activeDownloadId === job.id || isUnavailable}
                      className={cn("h-9 flex-1 border rounded-lg text-[13px] font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed", btnSecondaryCls)}
                      title={isUnavailable ? "File unavailable" : "Download"}
                    >
                      {activeDownloadId === job.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" strokeWidth={1.75} /> : <Download className="w-3.5 h-3.5" strokeWidth={1.75} />}
                      {job.status !== "printed" && "Download"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmJob(job)}
                      className={cn(
                        "h-9 w-9 flex items-center justify-center rounded-lg border transition-colors cursor-pointer",
                        isDark
                          ? "border-[#E5484D]/30 bg-[#E5484D]/10 text-[#E5484D] hover:bg-[#E5484D]/20"
                          : "border-[#DC2626]/25 bg-[#DC2626]/[0.06] text-[#DC2626] hover:bg-[#DC2626]/15"
                      )}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                    </button>
                    {job.customer_phone && (
                      <a
                        href={`tel:${job.customer_phone}`}
                        className={cn("h-9 px-3 flex items-center justify-center gap-1.5 rounded-lg border text-[13px] font-medium transition-colors cursor-pointer", btnSecondaryCls)}
                      >
                        <Smartphone className="w-3.5 h-3.5" strokeWidth={1.75} /> Call
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* DESKTOP TABLE */}
        {filteredJobs.length > 0 && (
          <div className={cn("hidden lg:flex flex-1 border rounded-xl flex-col overflow-hidden mb-1", surfaceCard)}>
            <div className="flex-1 min-w-full relative h-full min-h-[300px]">
              <TableVirtuoso
                style={{ height: '100%' }}
                data={filteredJobs}
                components={{
                  Table: ({ style, ...props }) => (
                    <table {...props} style={{ ...style, width: '100%', tableLayout: 'fixed' }} className="w-full border-collapse" />
                  )
                }}
                fixedHeaderContent={() => (
                  <tr className={isDark ? "bg-[#232325]" : "bg-[#F4F4F5]"}>
                    <th className={cn("py-3.5 pl-6 pr-3 text-left text-[13px] font-semibold tracking-tight w-[16%] border-b", txtPrimary, dividerCls)}>Customer Name</th>
                    <th className={cn("py-3.5 px-4 text-left text-[13px] font-semibold tracking-tight w-[32%] border-b", txtPrimary, dividerCls)}>Uploaded Documents</th>
                    <th className={cn("py-3.5 px-4 text-left text-[13px] font-semibold tracking-tight w-[25%] border-b", txtPrimary, dividerCls)}>
                      <span>Print Specs</span>
                      <span className={cn("ml-1.5 text-[11px] font-normal", txtMuted)}>
                        ({allSpecOptionsOff ? "Auto color · pages · file" : "Color · pages · options"})
                      </span>
                    </th>
                    <th className={cn("py-3.5 px-4 text-left text-[13px] font-semibold tracking-tight w-[11%] border-b", txtPrimary, dividerCls)}>Printing</th>
                    <th className={cn("py-3.5 pl-4 pr-6 text-right text-[13px] font-semibold tracking-tight w-[16%] border-b", txtPrimary, dividerCls)}>Print Actions</th>
                  </tr>
                )}
                itemContent={(_index, job) => {
                  const jobAge = currentTime.getTime() - new Date(job.created_at).getTime();
                  const isNew = jobAge < 2 * 60 * 1000;
                  const isUnavailable = job.is_deleted_by_user || job.is_auto_deleted || job.file_path === null;

                  return (
                    <>
                      <td className={cn("py-3.5 pl-6 pr-3 border-b text-left", dividerCls)}>
                        <div className="flex flex-col items-start gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p title={job.customer_name || "Guest"} className="font-semibold text-[14px] truncate max-w-[140px]">
                              {job.customer_name || "Guest"}
                            </p>
                            {isNew && (
                              <span className={cn(
                                "inline-flex items-center px-2 py-0.5 border text-[11px] font-medium rounded-md",
                                isDark ? "bg-[#4CC38A]/15 border-[#4CC38A]/30 text-[#4CC38A]" : "bg-[#16A34A]/10 border-[#16A34A]/25 text-[#16A34A]"
                              )}>
                                New
                              </span>
                            )}
                            {isUnavailable && (
                              <span className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 border text-[11px] font-medium rounded-md",
                                job.is_deleted_by_user
                                  ? (isDark ? "bg-[#E5484D]/15 border-[#E5484D]/30 text-[#E5484D]" : "bg-[#DC2626]/10 border-[#DC2626]/25 text-[#DC2626]")
                                  : cn(surfaceSubtle, txtSecondary)
                              )}>
                                {job.is_deleted_by_user ? "Deleted" : "Expired (5m)"}
                              </span>
                            )}
                          </div>
                          {job.customer_phone && (
                            <p className={cn("text-[12px] tabular-nums", txtMuted)}>
                              {job.customer_phone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className={cn("py-3.5 px-4 border-b", dividerCls)}>
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className={cn("w-10 h-10 border rounded-lg flex items-center justify-center shrink-0 relative", surfaceSubtle)}>
                            <FileText className="w-[18px] h-[18px]" strokeWidth={1.75} />
                            <span className="absolute -top-1.5 -right-1.5 bg-[#FB432C] text-[9px] font-semibold text-white px-1.5 py-0.5 rounded uppercase leading-none">
                              {job.file_name.split('.').pop()?.substring(0, 4) || "FILE"}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0 relative group/filename">
                            <p className="font-medium text-[14px] truncate">{job.file_name}</p>
                            <p className={cn("text-[12px] tabular-nums mt-0.5", txtMuted)}>
                              {new Date(job.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                            </p>
                            <div className="absolute left-0 bottom-full mb-2 hidden group-hover/filename:flex z-50 pointer-events-none">
                              <div className={cn("text-[12px] font-medium px-2.5 py-1.5 rounded-lg border shadow-md whitespace-nowrap max-w-[380px] truncate", modalCls)}>
                                {job.file_name}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={cn("py-3.5 px-4 border-b", dividerCls)}>
                        {(() => {
                          const pages = job.page_count || 1;
                          const fileExt = (job.file_name.split('.').pop()?.substring(0, 4) || "FILE").toUpperCase();
                          const isColorSpec = !showColorOption
                            ? (job.preferences?.detectedColor ?? job.preferences?.color ?? false)
                            : Boolean(job.preferences?.color);
                          if (allSpecOptionsOff) {
                            return (
                              <div className={cn("inline-flex items-center rounded-lg border divide-x text-[13px] font-medium tabular-nums", dividerCls, surfaceSubtle)}>
                                <span className={cn("px-3 py-1.5", dividerCls, isColorSpec ? "text-[#FB432C] font-semibold" : txtPrimary)}>
                                  {isColorSpec ? "Color" : "B&W"}
                                </span>
                                <span className={cn("px-3 py-1.5", dividerCls, txtPrimary)}>
                                  {pages} {pages === 1 ? "page" : "pages"}
                                </span>
                                <span className={cn("px-3 py-1.5", txtSecondary)}>
                                  {fileExt}
                                </span>
                              </div>
                            );
                          }
                          return (
                            <div className={cn("inline-flex items-center rounded-lg border divide-x text-[13px] font-medium tabular-nums", dividerCls, surfaceSubtle)}>
                              <span className={cn("px-3 py-1.5", dividerCls, isColorSpec ? "text-[#FB432C] font-semibold" : txtPrimary)}>
                                {isColorSpec ? "Color" : "B&W"}
                              </span>
                              {showDuplexOption && (
                                <span className={cn("px-3 py-1.5", dividerCls, txtSecondary)}>
                                  {job.preferences?.doubleSided ? "2-sided" : "1-sided"}
                                </span>
                              )}
                              {showCopiesOption && (
                                <span className={cn("px-3 py-1.5", dividerCls, txtSecondary)}>
                                  {job.preferences?.copies ?? 1} {(job.preferences?.copies ?? 1) === 1 ? "copy" : "copies"}
                                </span>
                              )}
                              <span className={cn("px-3 py-1.5", txtSecondary)}>
                                {pages}p
                              </span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className={cn("py-3.5 px-4 text-left border-b", dividerCls)}>
                        {job.status !== "printed" ? (
                          <button
                            type="button"
                            onClick={() => handlePrint(job)}
                            disabled={isUnavailable}
                            title={job.is_deleted_by_user ? "Deleted by customer" : isUnavailable ? "File expired after 5 minutes" : "Print document"}
                            className={cn("h-9 px-4 rounded-lg text-[13px] font-medium transition-colors inline-flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed", btnPrimaryCls)}
                          >
                            <Printer className="w-4 h-4" strokeWidth={1.75} />
                            Print
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => initiateVerification(job, 'reprint')}
                            disabled={isUnavailable}
                            title={job.is_deleted_by_user ? "Deleted by customer" : isUnavailable ? "File expired after 5 minutes" : "Reprint document"}
                            className={cn(
                              "h-9 px-4 rounded-lg border text-[13px] font-medium transition-colors inline-flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
                              isDark ? "bg-[#4CC38A]/10 border-[#4CC38A]/25 text-[#4CC38A] hover:bg-[#4CC38A]/15" : "bg-[#16A34A]/[0.08] border-[#16A34A]/20 text-[#16A34A] hover:bg-[#16A34A]/15"
                            )}
                          >
                            <Printer className="w-4 h-4" strokeWidth={1.75} />
                            Reprint
                          </button>
                        )}
                      </td>
                      <td className={cn("py-3.5 pl-4 pr-6 text-right border-b", dividerCls)}>
                        <div className="flex items-center justify-end gap-1.5">
                          {job.status !== "printed" ? (
                            <button
                              type="button"
                              onClick={() => initiateVerification(job, 'complete')}
                              disabled={isUnavailable}
                              className={cn(
                                "h-8 w-8 border rounded-lg transition-colors flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
                                isDark
                                  ? "border-[#4CC38A]/30 bg-[#4CC38A]/10 text-[#4CC38A] hover:bg-[#4CC38A]/20"
                                  : "border-[#16A34A]/25 bg-[#16A34A]/[0.06] text-[#16A34A] hover:bg-[#16A34A]/15"
                              )}
                              title={isUnavailable ? "File unavailable" : "Mark as printed"}
                            >
                              <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
                            </button>
                          ) : (
                            <span className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 h-8 border rounded-lg text-[12px] font-medium",
                              isDark ? "bg-[#4CC38A]/15 border-[#4CC38A]/30 text-[#4CC38A]" : "bg-[#16A34A]/10 border-[#16A34A]/25 text-[#16A34A]"
                            )}>
                              Done
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDownload(job)}
                            disabled={activeDownloadId === job.id || isUnavailable}
                            className={cn("h-8 px-2.5 border rounded-lg text-[12px] font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed", btnSecondaryCls)}
                            title={isUnavailable ? "File unavailable" : "Download"}
                          >
                            {activeDownloadId === job.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" strokeWidth={1.75} /> : <Download className="w-3.5 h-3.5" strokeWidth={1.75} />}
                            {job.status !== "printed" && "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmJob(job)}
                            className={cn(
                              "h-8 w-8 border rounded-lg flex items-center justify-center transition-colors cursor-pointer",
                              isDark
                                ? "border-[#E5484D]/30 bg-[#E5484D]/10 text-[#E5484D] hover:bg-[#E5484D]/20"
                                : "border-[#DC2626]/25 bg-[#DC2626]/[0.06] text-[#DC2626] hover:bg-[#DC2626]/15"
                            )}
                            title="Delete job"
                          >
                            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                          </button>
                        </div>
                      </td>
                    </>
                  );
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* VERIFICATION CHALLENGE MODAL */}
      <Dialog
        open={!!verifyingJobId}
        onOpenChange={(open) => {
          if (!open) {
            setVerifyingJobId(null);
            setTokenError(null);
          }
        }}
      >
        <DialogContent className={cn("sm:max-w-[400px] p-6 rounded-2xl overflow-hidden", modalCls)}>
          <DialogHeader className="text-left mb-4">
            <div className={cn("w-9 h-9 rounded-lg border flex items-center justify-center mb-3", surfaceSubtle)}>
              <ShieldCheck className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <DialogTitle className="text-[17px] font-semibold tracking-tight">Verify pickup code</DialogTitle>
            <DialogDescription className={cn("text-[13px]", txtSecondary)}>
              Ask the customer for the 2-digit code shown on their upload confirmation.
            </DialogDescription>
          </DialogHeader>

          <div className="w-full space-y-4">
            <input
              type="text"
              maxLength={2}
              placeholder="--"
              autoFocus
              value={tokenChallengeInput}
              onChange={(e) => {
                setTokenChallengeInput(e.target.value.replace(/\D/g, ""));
                if (tokenError) setTokenError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleVerifyComplete()}
              className={cn("w-full h-20 rounded-xl text-center text-[36px] font-semibold tracking-[0.25em] tabular-nums outline-none transition-colors", inputCls)}
            />

            {tokenError && (
              <p className={cn("text-[12px] font-medium", isDark ? "text-[#E5484D]" : "text-[#DC2626]")}>
                {tokenError}
              </p>
            )}

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setVerifyingJobId(null);
                  setTokenChallengeInput("");
                  setTokenError(null);
                }}
                className={cn("flex-1 h-10 font-medium text-[13px] rounded-lg border transition-colors cursor-pointer", btnSecondaryCls)}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyComplete}
                className={cn("flex-1 h-10 font-medium text-[13px] rounded-lg transition-colors cursor-pointer", btnPrimaryCls)}
              >
                Verify
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={!!deleteConfirmJob} onOpenChange={(open) => !open && setDeleteConfirmJob(null)}>
        <DialogContent className={cn("max-w-[400px] p-6 rounded-2xl", modalCls)}>
          <DialogHeader className="text-left mb-4">
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-3", isDark ? "bg-[#E5484D]/15 text-[#E5484D]" : "bg-[#DC2626]/10 text-[#DC2626]")}>
              <Trash2 className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <DialogTitle className="text-[17px] font-semibold tracking-tight">Delete print job</DialogTitle>
            <DialogDescription className={cn("text-[13px]", txtSecondary)}>
              This removes <span className={cn("font-medium", txtPrimary)}>{deleteConfirmJob?.file_name}</span> for{" "}
              <span className={cn("font-medium", txtPrimary)}>{deleteConfirmJob?.customer_name || "Guest"}</span>. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2.5 w-full pt-1">
            <button
              type="button"
              onClick={() => setDeleteConfirmJob(null)}
              className={cn("flex-1 h-10 font-medium text-[13px] rounded-lg border transition-colors cursor-pointer", btnSecondaryCls)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => deleteConfirmJob && handleDeleteJob(deleteConfirmJob)}
              className="flex-1 h-10 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-medium text-[13px] rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {isDeleting ? <RefreshCw className="w-4 h-4 animate-spin" strokeWidth={1.75} /> : "Delete job"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* EXPIRED / PURGED SIGNAL MODAL */}
      <Dialog open={!!purgedJob} onOpenChange={(open) => !open && setPurgedJob(null)}>
        <DialogContent className={cn("max-w-[400px] p-6 rounded-2xl", modalCls)}>
          <DialogHeader className="text-left mb-4">
            <div className={cn("w-9 h-9 rounded-lg border flex items-center justify-center mb-3", surfaceSubtle)}>
              <Clock className="w-4 h-4 text-[#FB432C]" strokeWidth={1.75} />
            </div>
            <DialogTitle className="text-[17px] font-semibold tracking-tight">File no longer available</DialogTitle>
            <DialogDescription className={cn("text-[13px]", txtSecondary)}>
              Files shared over 5 minutes ago are automatically removed from storage for customer privacy.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2.5">
            {purgedJob && (
              <button
                type="button"
                onClick={() => {
                  const target = purgedJob;
                  setPurgedJob(null);
                  handleDeleteJob(target);
                }}
                className={cn("flex-1 h-10 font-medium text-[13px] rounded-lg border transition-colors cursor-pointer", btnSecondaryCls)}
              >
                Remove entry
              </button>
            )}
            <button
              type="button"
              onClick={() => setPurgedJob(null)}
              className={cn("flex-1 h-10 font-medium text-[13px] rounded-lg transition-colors cursor-pointer", btnPrimaryCls)}
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* SHOPKEEPER APPROVAL REQUIRED MODAL SCREEN */}
      <Dialog
        open={showApprovalModal}
        onOpenChange={(open) => {
          if (!open && isTrialLimitReached) {
            setViewReadOnlyQueue(true);
          }
          setShowApprovalModal(open);
        }}
      >
        <DialogContent className={cn("sm:max-w-[460px] p-6 rounded-2xl overflow-hidden", modalCls)}>
          <DialogHeader className="text-left mb-4">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", isDark ? "bg-[#FB432C]/15 text-[#FB432C]" : "bg-[#FB432C]/10 text-[#FB432C]")}>
              <ShieldCheck className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <DialogTitle className="text-[18px] font-semibold tracking-tight">
              Account approval required
            </DialogTitle>
            <DialogDescription className={cn("text-[12px] font-medium px-3 py-2 rounded-lg border mt-2", isDark ? "bg-[#FB432C]/10 border-[#FB432C]/25 text-[#FB432C]" : "bg-[#FB432C]/[0.06] border-[#FB432C]/20 text-[#FB432C]")}>
              Free trial limit reached ({filesProcessedCount}/3 scans used)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <p className={cn("text-[13px] leading-relaxed", txtSecondary)}>
              Your shop is awaiting verification by the platform administrator. Printing and downloading files remain paused until your account is approved.
            </p>

            <div className={cn("p-3.5 border rounded-xl space-y-2 text-[13px]", surfaceSubtle)}>
              <div className="flex items-center justify-between">
                <span className={txtMuted}>Status</span>
                <span className="font-medium text-[#FB432C]">Pending approval</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={txtMuted}>Shop</span>
                <span className="font-medium">{shop?.name || "Your Shop"}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => checkApprovalStatus(false)}
                disabled={isCheckingApproval}
                className="w-full h-10 bg-[#FB432C] hover:bg-[#E03923] text-white font-medium text-[13px] rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <RefreshCw className={cn("w-4 h-4", isCheckingApproval && "animate-spin")} strokeWidth={1.75} />
                <span>{isCheckingApproval ? "Checking status..." : "Check approval status"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewReadOnlyQueue(true);
                  setShowApprovalModal(false);
                }}
                className={cn("w-full h-9 font-medium text-[13px] rounded-lg border transition-colors cursor-pointer", btnSecondaryCls)}
              >
                View queue (read-only)
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* IN-APP NOTIFICATION TOASTS */}
      <div className="fixed bottom-5 right-4 sm:right-6 z-[9999] flex flex-col gap-2 pointer-events-none items-end w-[calc(100vw-32px)] sm:w-auto max-w-[400px]">
        <AnimatePresence mode="popLayout">
          {notifications.map((notif) => (
            <XeroxQNotification
              key={notif.id}
              notification={notif}
              isDark={isDark}
              onClose={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- SUB-COMPONENT: TOAST NOTIFICATION ---
function XeroxQNotification({
  notification,
  isDark,
  onClose
}: {
  notification: Notification;
  isDark: boolean;
  onClose: (id: string) => void;
}) {
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    const timer = setTimeout(() => { onCloseRef.current(notification.id); }, 5000);
    return () => clearTimeout(timer);
  }, [notification.id]);

  const isNewJob = notification.type === "new_job";
  const isError = notification.type === "error";
  const isSuccess = notification.type === "success";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 32, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 32, scale: 0.98, transition: { duration: 0.18 } }}
      className={cn(
        "pointer-events-auto w-full sm:w-[360px] border rounded-xl p-3.5 relative overflow-hidden shadow-lg",
        isDark ? "bg-[#19191B] border-white/[0.12] text-[#EDEDED]" : "bg-white border-[#171717]/[0.10] text-[#171717]"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
          isNewJob
            ? "bg-[#FB432C] text-white"
            : isError
              ? (isDark ? "bg-[#E5484D]/15 text-[#E5484D]" : "bg-[#DC2626]/10 text-[#DC2626]")
              : isSuccess
                ? (isDark ? "bg-[#4CC38A]/15 text-[#4CC38A]" : "bg-[#16A34A]/10 text-[#16A34A]")
                : (isDark ? "bg-[#232325] text-[#A1A1A6]" : "bg-[#F4F4F5] text-[#525252]")
        )}>
          {isNewJob ? (
            <Printer className="w-4 h-4" strokeWidth={1.75} />
          ) : isSuccess ? (
            <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
          ) : isError ? (
            <AlertCircle className="w-4 h-4" strokeWidth={1.75} />
          ) : (
            <Activity className="w-4 h-4" strokeWidth={1.75} />
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col text-left">
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <span className="text-[13px] font-semibold leading-snug break-words">
              {isNewJob ? "New print job" : notification.message}
            </span>
            <span className={cn("text-[11px] tabular-nums shrink-0", isDark ? "text-[#85858B]" : "text-[#737373]")}>
              {notification.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <p className={cn("text-[12px] leading-snug break-words", isDark ? "text-[#A1A1A6]" : "text-[#525252]")}>
            {isNewJob ? notification.message.replace("Incoming Document: ", "") : notification.subMessage}
          </p>
          {isNewJob && notification.subMessage && (
            <p className={cn("text-[11px] break-words mt-1.5 px-2 py-1 rounded-md border", isDark ? "bg-[#232325] border-white/[0.06] text-[#A1A1A6]" : "bg-[#F4F4F5] border-[#171717]/[0.06] text-[#525252]")}>
              {notification.subMessage}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => onClose(notification.id)}
          className={cn(
            "w-6 h-6 flex items-center justify-center rounded-md transition-colors shrink-0 cursor-pointer",
            isDark ? "text-[#85858B] hover:text-[#EDEDED] hover:bg-white/[0.08]" : "text-[#737373] hover:text-[#171717] hover:bg-[#F4F4F5]"
          )}
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" strokeWidth={1.75} />
        </button>
      </div>

      <motion.div
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: 5, ease: "linear" }}
        className={cn(
          "absolute bottom-0 left-0 right-0 h-[2px]",
          isNewJob ? "bg-[#FB432C]" : isError ? "bg-[#DC2626]" : isSuccess ? "bg-[#16A34A]" : (isDark ? "bg-white/40" : "bg-[#171717]")
        )}
      />
    </motion.div>
  );
}
