"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { CONFIG } from "@/lib/config";
import { buildShopPortalUrl, formatDisplayUrl, sanitizeExternalHttpUrl } from "@/lib/site-url";
import { isMaintenanceEnabled } from "@/lib/maintenance";
import {
  UserPlus,
  FileEdit,
  Settings,
  ShieldCheck as ShieldCheckIcon,
  Globe as GlobeIcon,
  MapPin,
  AtSign,
  Briefcase,
  LayoutDashboard,
  Store,
  FileText,
  TrendingUp,
  IndianRupee,
  RefreshCw,
  LogOut,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  Check,
  Eye,
  Ban,
  ChevronUp,
  ChevronDown,
  Loader2,
  Crown,
  Activity,
  Users,
  Zap,
  AlertTriangle,
  Search,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  Printer,
  Star,
  Plus,
  Trash2,
  HardDrive,
  X
} from "lucide-react";
import { ThemeToggle } from "@/lib/theme";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShopStats {
  id: string;
  name: string;
  slug: string;
  upi_id: string | null;
  is_open: boolean;
  price_mono: number | null;
  price_color: number | null;
  created_at: string;
  total_files_processed: number;
  totalJobs: number; // Persistent total
  pendingJobs: number; // Current live queue
  completedJobs: number; // Current live queue
  revenueGenerated: number; // in ₹
  platformFee: number;      // what CEO charges the shop
  feeStatus: "paid" | "due";
  approval_status?: "pending" | "approved" | "rejected";
}

interface PlatformStats {
  totalShops: number;
  activeShops: number;
  totalFiles: number;
  totalPlatformRevenue: number;
  pendingDues: number;
  shops: ShopStats[];
}

type SortKey = "name" | "totalJobs" | "platformFee" | "created_at";
type SortDir = "asc" | "desc";
type TabType = "overview" | "shops" | "billing" | "storage_logs" | "leads" | "content" | "hr" | "security" | "partners" | "settings" | "feedback";

const PLATFORM_FEE_PER_FILE = CONFIG.BILLING.PLATFORM_FEE_PER_FILE;

const formatBytes = (bytes: number, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

// ─── CEO Dashboard ────────────────────────────────────────────────────────────

export default function PlatformAdminDashboard() {
  const router = useRouter();

  const [authChecked, setAuthChecked]   = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [ceoEmail, setCeoEmail]         = useState("");

  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  
  // Platform Data
  const [platform, setPlatform]       = useState<PlatformStats | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [newsletter, setNewsletter]   = useState<any[]>([]);
  const [blogs, setBlogs]             = useState<any[]>([]);
  const [partners, setPartners]       = useState<any[]>([]);
  const [careers, setCareers]         = useState<any[]>([]);
  const [news, setNews]               = useState<any[]>([]);
  const [security, setSecurity]       = useState<any[]>([]);
  const [settings, setSettings]       = useState<any[]>([]);

  // Storage Analytics & Logs State
  const [storageAnalytics, setStorageAnalytics] = useState<{
    current_files: number;
    current_bytes: number;
    peak_bytes: number;
    peak_time: string;
    peak_files: number;
    total_jobs: number;
    active_jobs_with_files: number;
    user_deleted_jobs: number;
    auto_deleted_jobs: number;
  } | null>(null);
  const [storageLogs, setStorageLogs] = useState<any[]>([]);
  const [isPurgingStorage, setIsPurgingStorage] = useState(false);
  
  // Feedback management state
  const [defaultQuestions, setDefaultQuestions] = useState<any[]>([]);
  const [feedbackGlobalEnabled, setFeedbackGlobalEnabled] = useState(true);
  const [newDefaultQuestion, setNewDefaultQuestion] = useState("");
  const [newDefaultOptions, setNewDefaultOptions] = useState("😠,😐,🙂,😍");
  const [allFeedbackResponses, setAllFeedbackResponses] = useState<any[]>([]);
  const [selectedFeedbackShop, setSelectedFeedbackShop] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [approvalFilter, setApprovalFilter] = useState<"all" | "pending" | "approved">("all");
  const [sortKey, setSortKey]         = useState<SortKey>("totalJobs");
  const [sortDir, setSortDir]         = useState<SortDir>("desc");
  const [activeTab, setActiveTab]     = useState<TabType>("overview");
  
  const [selectedShop, setSelectedShop]   = useState<ShopStats | null>(null);
  const [actionShopId, setActionShopId]   = useState<string | null>(null);

  const [isAddingBlog, setIsAddingBlog]   = useState(false);
  const [isAddingNews, setIsAddingNews]   = useState(false);
  const [statusNotice, setStatusNotice]   = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [confirmModal, setConfirmModal]   = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmText: string;
    onConfirm: () => Promise<void>;
  }>({
    open: false,
    title: "",
    description: "",
    confirmText: "Yes, Proceed",
    onConfirm: async () => {},
  });

  useEffect(() => {
    if (!statusNotice) return;
    const t = setTimeout(() => setStatusNotice(null), 5000);
    return () => clearTimeout(t);
  }, [statusNotice]);

  // ── Auth check ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const ceoEmailEnv = process.env.NEXT_PUBLIC_CEO_EMAIL?.trim().toLowerCase();

      if (!user) {
        router.replace("/login?redirect=/platform-admin");
        return;
      }

      const role = user.app_metadata?.role;
      const isAdminClaim = role === "platform_admin" || role === "ceo";
      const matchesCeoEmail = Boolean(ceoEmailEnv && user.email?.trim().toLowerCase() === ceoEmailEnv);

      if (!isAdminClaim && !matchesCeoEmail) {
        setAuthChecked(true);
        setIsAuthorized(false);
        setCeoEmail(user.email ?? "");
        return;
      }

      setCeoEmail(user.email ?? "");
      setIsAuthorized(true);
      setAuthChecked(true);
    };

    checkAuth();
  }, [router]);

  // ── Data fetching (via server API to bypass RLS) ───────────────────────
  const fetchData = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("No active session");

      const res = await fetch("/api/platform-admin/stats", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `API error ${res.status}`);
      }

      const data = await res.json();
      const rawShops = data.shops || [];

      const shopStats: ShopStats[] = rawShops.map((s: any) => {
        const rev = s.total_files_processed * (data.config?.platformFee || 0.5);
        return {
          ...s,
          totalJobs: s.total_files_processed,
          pendingJobs: s.pending_jobs,
          revenueGenerated: rev,
          platformFee: rev,
          feeStatus: "due"
        };
      });

      const totalFiles = shopStats.reduce((sum, s) => sum + s.totalJobs, 0);
      const totalRev = totalFiles * (data.config?.platformFee || 0.5);
      const activeShops = shopStats.filter(s => s.is_open).length;

      setPlatform({
        totalShops: shopStats.length,
        activeShops,
        totalFiles,
        totalPlatformRevenue: totalRev,
        pendingDues: totalRev * 0.2,
        shops: shopStats
      });

      setSelectedShop(prev => {
        if (!prev) return null;
        const fresh = shopStats.find(s => s.id === prev.id);
        return fresh || prev;
      });

      setSubmissions(data.submissions || []);
      setNewsletter(data.newsletter || []);
      setBlogs(data.blogs || []);
      setPartners(data.partners || []);
      setCareers(data.careers || []);
      setNews(data.news || []);
      setSecurity(data.security || []);
      setSettings(data.settings || []);
      if (data.storageAnalytics) setStorageAnalytics(data.storageAnalytics);
      if (data.storageLogs) setStorageLogs(data.storageLogs);

      console.log("[CEO Dashboard] Data Sync:", {
        shops: shopStats.length,
        submissions: (data.submissions || []).length,
        partners: (data.partners || []).length,
        partnersData: data.partners
      });

    } catch (err) {
      console.error("[CEO Dashboard] fetch failed:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (!isAuthorized) return;
    fetchData();

    // 1. Auto-refresh polling every 4 seconds for CEO dashboard
    const interval = setInterval(() => {
      fetchData();
    }, 4000);

    // 2. Realtime listener for shops table changes
    const channel = supabase
      .channel("platform-admin-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shops" },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [isAuthorized, fetchData]);

  const handleAction = async (table: string, id: string, action: 'delete' | 'approve' | 'toggle') => {
    let title = "System Confirmation";
    let desc = `Are you sure you want to perform ${action} on this record?`;
    let confirmText = "Yes, Proceed";
    
    // Determine specific action for API
    let apiAction = action as string;
    if (table === 'platform_settings' && id === 'maintenance_mode') apiAction = 'toggle_maintenance';
    if (action === ('review_poc' as any)) {
      title = "Update Security Report Status?";
      desc = "Advance this bug bounty report status (Reported -> Reviewed -> Resolved)?";
      confirmText = "Update Status";
    }

    if (table === 'platform_settings' && id === 'maintenance_mode') {
      const isCurrentlyActive = isMaintenanceEnabled(settings.find(s => s.key === id)?.value);
      title = isCurrentlyActive ? "Disable Maintenance?" : "Enable Maintenance Mode?";
      desc = isCurrentlyActive 
        ? "The site will go LIVE immediately for all customers. Are you sure?"
        : "The site will be LOCKED DOWN for all customers. Only you will have access. Proceed?";
      confirmText = isCurrentlyActive ? "Take Site Live" : "Activate Lockdown";
    }

    setConfirmModal({
      open: true,
      title,
      description: desc,
      confirmText,
      onConfirm: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const res = await fetch("/api/platform-admin/stats", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                Authorization: `Bearer ${session?.access_token}` 
            },
            body: JSON.stringify({ action: apiAction, table, id })
          });
          
          if (!res.ok) throw new Error("Action failed");

          await fetchData();
          setConfirmModal(prev => ({ ...prev, open: false }));
        } catch (err) {
          setStatusNotice({ type: "error", text: "Action failed. Check console for details." });
        }
      }
    });
  };

  const handleToggleShop = async (shop: ShopStats) => {
    setActionShopId(shop.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/platform-admin/stats", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}` 
        },
        body: JSON.stringify({ action: 'toggle_shop', table: 'shops', id: shop.id })
      });
      
      if (!res.ok) throw new Error("Toggle failed");
      await fetchData();
    } catch (err) {
      console.error("[Platform Admin] Toggle shop failed:", err);
    } finally {
      setActionShopId(null);
    }
  };

  const handleApproveShop = async (shopId: string) => {
    setActionShopId(shopId);

    // 1. Immediate optimistic UI update on platform state
    setPlatform(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        shops: prev.shops.map(s => s.id === shopId ? { ...s, approval_status: "approved" } : s)
      };
    });

    // 2. Immediate optimistic update on selectedShop modal
    setSelectedShop(prev => prev && prev.id === shopId ? { ...prev, approval_status: "approved" } : prev);

    // 3. Auto-switch filter to "all" if currently on "pending" so the shop remains visible in table
    if (approvalFilter === "pending") {
      setApprovalFilter("all");
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("No active session");

      const res = await fetch("/api/platform-admin/stats", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}` 
        },
        body: JSON.stringify({ action: 'approve_shop', table: 'shops', id: shopId })
      });
      
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to approve shop");
      }
      await fetchData();
    } catch (err: any) {
      console.error("[Platform Admin] Approve shop notice:", err);
      setStatusNotice({ type: "error", text: err?.message || "Failed to approve shop" });
      await fetchData();
    } finally {
      setActionShopId(null);
    }
  };

  const handleRejectShop = async (shopId: string) => {
    setActionShopId(shopId);

    // 1. Immediate optimistic UI update on platform state
    setPlatform(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        shops: prev.shops.map(s => s.id === shopId ? { ...s, approval_status: "rejected" } : s)
      };
    });

    // 2. Immediate optimistic update on selectedShop modal
    setSelectedShop(prev => prev && prev.id === shopId ? { ...prev, approval_status: "rejected" } : prev);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("No active session");

      const res = await fetch("/api/platform-admin/stats", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}` 
        },
        body: JSON.stringify({ action: 'reject_shop', table: 'shops', id: shopId })
      });
      
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to reject shop");
      }
      await fetchData();
    } catch (err: any) {
      console.error("[Platform Admin] Reject shop notice:", err);
      setStatusNotice({ type: "error", text: err?.message || "Failed to reject shop" });
      await fetchData();
    } finally {
      setActionShopId(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  // ── Feedback Management Functions ───────────────────────────────────────────
  
  const fetchDefaultQuestions = async () => {
    const { data, error } = await supabase
      .from('feedback_questions_default')
      .select('*')
      .eq('is_active', true)
      .order('display_order');
    
    if (!error && data) {
      setDefaultQuestions(data);
    }
  };

  const fetchFeedbackGlobalSetting = async () => {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'global_feedback_enabled')
      .single();
    
    if (!error && data) {
      setFeedbackGlobalEnabled(data.value?.enabled !== false);
    }
  };

  const fetchAllFeedbackResponses = async () => {
    const { data, error } = await supabase
      .from('feedback_responses')
      .select('*, shops(name)')
      .order('submitted_at', { ascending: false })
      .limit(100);
    
    if (!error && data) {
      setAllFeedbackResponses(data);
    }
  };

  const handleToggleGlobalFeedback = async () => {
    const newValue = !feedbackGlobalEnabled;
    
    const { error } = await supabase
      .from('platform_settings')
      .upsert({
        key: 'global_feedback_enabled',
        value: { enabled: newValue },
        description: 'Global toggle for feedback system across all shops',
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error toggling global feedback:', error);
      setStatusNotice({ type: "error", text: "Failed to update setting" });
    } else {
      setFeedbackGlobalEnabled(newValue);
    }
  };

  const handleAddDefaultQuestion = async () => {
    if (!newDefaultQuestion.trim()) return;
    
    const options = newDefaultOptions.split(',').map(o => o.trim()).filter(Boolean);
    
    const { error } = await supabase
      .from('feedback_questions_default')
      .insert({
        question_text: newDefaultQuestion.trim(),
        question_type: 'emoji',
        options: JSON.stringify(options),
        is_active: true,
        display_order: defaultQuestions.length,
        category: 'general'
      });
    
    if (error) {
      console.error('Error adding question:', error);
      setStatusNotice({ type: "error", text: "Failed to add question" });
    } else {
      setNewDefaultQuestion("");
      await fetchDefaultQuestions();
    }
  };

  const handleDeleteDefaultQuestion = (id: string) => {
    setConfirmModal({
      open: true,
      title: "Delete default question?",
      description: "This will deactivate the question across shops using default feedback templates.",
      confirmText: "Yes, Delete",
      onConfirm: async () => {
        const { error } = await supabase
          .from('feedback_questions_default')
          .update({ is_active: false })
          .eq('id', id);

        if (error) {
          setStatusNotice({ type: "error", text: "Failed to delete question" });
        } else {
          await fetchDefaultQuestions();
        }
        setConfirmModal(prev => ({ ...prev, open: false }));
      },
    });
  };

  // Load feedback data when tab is active
  useEffect(() => {
    if (activeTab === 'feedback' && isAuthorized) {
      fetchDefaultQuestions();
      fetchFeedbackGlobalSetting();
      fetchAllFeedbackResponses();
    }
  }, [activeTab, isAuthorized]);

  // ── Sorting & filtering ─────────────────────────────────────────────────────
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const pendingShopsCount = (platform?.shops || []).filter((s: any) => s.approval_status === "pending").length;

  const filteredShops = (platform?.shops || [])
    .filter((s: any) => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.slug.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesApproval = approvalFilter === "all" ? true : approvalFilter === "pending" ? (s.approval_status === "pending" || !s.approval_status) : s.approval_status === "approved";
      return matchesSearch && matchesApproval;
    })
    .sort((a: any, b: any) => {
      const mul = sortDir === "asc" ? 1 : -1;
      if (sortKey === "name") return a.name.localeCompare(b.name) * mul;
      if (sortKey === "totalJobs") return (a.totalJobs - b.totalJobs) * mul;
      if (sortKey === "platformFee") return (a.platformFee - b.platformFee) * mul;
      if (sortKey === "created_at") return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * mul;
      return 0;
    });

  // ── Not authorized ─────────────────────────────────────────────────────────
  if (authChecked && !isAuthorized) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#111113] text-[#171717] dark:text-[#EDEDED] flex items-center justify-center relative">
        <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-30">
          <ThemeToggle compact />
        </div>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-2xl p-10 text-center max-w-md mx-4"
        >
          <div className="w-16 h-16 rounded-full bg-[#DC2626]/10 dark:bg-[#E5484D]/15 border border-[#DC2626]/20 dark:border-[#E5484D]/25 flex items-center justify-center mx-auto mb-5">
            <ShieldAlert className="w-8 h-8 text-[#DC2626] dark:text-[#E5484D]" />
          </div>
          <h1 className="text-2xl font-semibold text-[#171717] dark:text-[#EDEDED] mb-2 tracking-tight">Access Denied</h1>
          <p className="text-[#525252] dark:text-[#A1A1A6] text-sm mb-6">
            This area is restricted to authorized XeroxQ executives only.<br />
            You are signed in as <span className="text-[#171717] dark:text-[#EDEDED] font-semibold">{ceoEmail}</span>
          </p>
          <button
            onClick={() => router.replace("/")}
            className="px-6 py-2.5 bg-[#DC2626] dark:bg-[#E5484D] hover:opacity-90 text-white rounded-xl font-semibold text-sm transition-opacity cursor-pointer"
          >
            Return to Home
          </button>
        </motion.div>
      </div>
    );
  }

  if (!authChecked || (isAuthorized && loading)) {
    return (
       <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#111113] text-[#171717] dark:text-[#EDEDED]">
          {/* Skeleton Header */}
          <div className="w-full bg-white dark:bg-[#19191B] border-b border-[#171717]/[0.08] dark:border-white/[0.08] h-[76px]">
             <div className="w-full px-6 lg:px-[100px] py-4 flex items-center justify-between h-full">
                <div className="flex items-center gap-3">
                   <div className="w-[40px] h-[40px] rounded-xl bg-[#F4F4F5] dark:bg-[#232325] animate-pulse" />
                   <div className="flex flex-col gap-2">
                      <div className="w-[140px] h-[20px] bg-[#F4F4F5] dark:bg-[#232325] animate-pulse rounded" />
                      <div className="w-[90px] h-[12px] bg-[#F4F4F5] dark:bg-[#232325] animate-pulse rounded" />
                   </div>
                </div>
             </div>
          </div>

          <div className="flex flex-col items-center justify-center h-[calc(100vh-76px)] gap-4">
             <div className="w-12 h-12 rounded-xl bg-[#FB432C] flex items-center justify-center">
                 <Loader2 className="w-6 h-6 text-white animate-spin" />
             </div>
             <p className="text-sm font-semibold text-[#737373] dark:text-[#85858B] uppercase tracking-wider">Loading Command Center...</p>
             {/* Content Tab Modals */}
        <Dialog open={isAddingBlog} onOpenChange={setIsAddingBlog}>
          <DialogContent className="sm:max-w-[600px] bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-2xl p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-xl font-semibold tracking-tight text-[#171717] dark:text-[#EDEDED]">Publish New Article</DialogTitle>
              <DialogDescription className="text-[13px] text-[#525252] dark:text-[#A1A1A6]">
                Draft a new article for the XeroxQ blog.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              try {
                const { error } = await supabase.from("blogs").insert({
                  title: formData.get("title"),
                  category: formData.get("category"),
                  excerpt: formData.get("excerpt"),
                  content: formData.get("content"),
                  author: "Sivamani",
                  status: "published",
                  slug: (formData.get("title") as string).toLowerCase().replace(/ /g, '-')
                });
                if (error) throw error;
                setIsAddingBlog(false);
                fetchData();
              } catch (err) {
                setStatusNotice({ type: "error", text: "Publish failed." });
              }
            }} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-[#171717] dark:text-[#EDEDED]">Article Title</Label>
                  <Input name="title" required placeholder="The Future of Printing..." className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-[#171717] dark:text-[#EDEDED]">Category</Label>
                  <select name="category" className="w-full h-11 bg-white dark:bg-[#232325] border border-[#171717]/[0.12] dark:border-white/[0.12] text-[#171717] dark:text-[#EDEDED] rounded-xl px-4 text-sm outline-none" required>
                    <option value="Network">Network</option>
                    <option value="Security">Security</option>
                    <option value="Innovation">Innovation</option>
                    <option value="Culture">Culture</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-[#171717] dark:text-[#EDEDED]">Excerpt (Short Summary)</Label>
                <Input name="excerpt" required placeholder="A brief hook for the reader..." className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-[#171717] dark:text-[#EDEDED]">Full Article Content (Markdown)</Label>
                <Textarea name="content" required placeholder="Write your article here..." className="min-h-[200px] rounded-xl" />
              </div>
              <button
                type="submit"
                className="w-full h-12 bg-[#FB432C] hover:bg-[#E03923] text-white font-semibold text-sm rounded-xl transition-colors"
              >
                Publish Live
              </button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isAddingNews} onOpenChange={setIsAddingNews}>
          <DialogContent className="sm:max-w-[500px] bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-2xl p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-xl font-semibold tracking-tight text-[#171717] dark:text-[#EDEDED]">Push Platform Update</DialogTitle>
              <DialogDescription className="text-[13px] text-[#525252] dark:text-[#A1A1A6]">
                Broadcast a quick update or notice to the XeroxQ network.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              try {
                const { error } = await supabase.from("platform_news").insert({
                  title: formData.get("title"),
                  category: formData.get("category"),
                  content: formData.get("content")
                });
                if (error) throw error;
                setIsAddingNews(false);
                fetchData();
              } catch (err) {
                setStatusNotice({ type: "error", text: "News push failed." });
              }
            }} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-[#171717] dark:text-[#EDEDED]">Headline</Label>
                <Input name="title" required placeholder="System Maintenance..." className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-[#171717] dark:text-[#EDEDED]">Category</Label>
                <select name="category" className="w-full h-11 bg-white dark:bg-[#232325] border border-[#171717]/[0.12] dark:border-white/[0.12] text-[#171717] dark:text-[#EDEDED] rounded-xl px-4 text-sm outline-none" required>
                  <option value="Update">Update</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Alert">Alert</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-[#171717] dark:text-[#EDEDED]">Brief Content</Label>
                <Textarea name="content" required placeholder="What's happening?" className="min-h-[100px] rounded-xl" />
              </div>
              <button
                type="submit"
                className="w-full h-12 bg-[#FB432C] hover:bg-[#E03923] text-white font-semibold text-sm rounded-xl transition-colors"
              >
                Push News
              </button>
            </form>
          </DialogContent>
        </Dialog>
          </div>
       </div>
    );
  }

  const fmt = (n: number) => `₹${n.toFixed(2)}`;

  // ─── UI ──────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#111113] text-[#171717] dark:text-[#EDEDED]">
      {statusNotice && (
        <div
          role="alert"
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border text-xs font-semibold shadow-lg ${
            statusNotice.type === "error"
              ? "bg-[#FEF2F2] dark:bg-[#2A1517] border-[#DC2626]/20 dark:border-[#E5484D]/25 text-[#DC2626] dark:text-[#E5484D]"
              : "bg-[#ECFDF5] dark:bg-[#102A1E] border-[#16A34A]/20 dark:border-[#4CC38A]/25 text-[#16A34A] dark:text-[#4CC38A]"
          }`}
        >
          <span>{statusNotice.text}</span>
          <button
            type="button"
            onClick={() => setStatusNotice(null)}
            aria-label="Dismiss notification"
            className="opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {/* TOP HEADER - IDENTITY, ACTIONS */}
      <div className="shrink-0 relative w-full bg-white dark:bg-[#19191B] border-b border-[#171717]/[0.08] dark:border-white/[0.08] z-30">
         <div className="w-full px-6 lg:px-[100px] py-[18px] lg:py-5">
            <div className="flex items-center justify-between gap-3">
               {/* Left: logo + portal name */}
               <div className="flex items-center gap-2 lg:gap-4 shrink-0">
                 <div className="w-8 h-8 lg:w-9 lg:h-9 bg-[#FB432C] rounded-lg flex items-center justify-center shrink-0">
                   <Crown className="text-white w-4 h-4" />
                 </div>
                 <div className="flex flex-col">
                   <h1 className="text-[16px] lg:text-[18px] font-semibold text-[#171717] dark:text-[#EDEDED] leading-none tracking-tight whitespace-nowrap">CEO Portal</h1>
                   <p className="text-[10px] font-semibold text-[#737373] dark:text-[#85858B] tracking-wider uppercase leading-none mt-1.5">Master Command Center</p>
                 </div>
               </div>

               {/* Right: action buttons — shifted left to prevent overlap with Windows window controls */}
               <div className="flex items-center gap-2 shrink-0 pr-32 lg:pr-[140px]">
                  <span className="hidden sm:block text-[11px] font-semibold text-[#737373] dark:text-[#85858B] mr-2">{ceoEmail}</span>

                  <ThemeToggle compact showLabel={false} />

                  <button
                    onClick={() => { setRefreshing(true); fetchData(); }}
                    disabled={refreshing}
                    className="h-8 w-8 lg:h-[36px] lg:w-[36px] border border-[#171717]/[0.10] dark:border-white/[0.10] bg-white dark:bg-[#232325] text-[#171717] dark:text-[#EDEDED] hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2E] transition-colors rounded-lg flex items-center justify-center"
                    title="Refresh Data"
                  >
                    <RefreshCw className={`w-4 h-4 lg:w-[14px] lg:h-[14px] text-[#525252] dark:text-[#A1A1A6] ${refreshing ? "animate-spin" : ""}`} />
                  </button>

                  {/* Separator */}
                  <div className="h-6 w-[1px] bg-[#171717]/[0.08] dark:bg-white/[0.08] mx-0.5" />

                  {/* Logout — icon only */}
                  <button
                    onClick={handleLogout}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-[#DC2626] dark:text-[#E5484D] hover:bg-[#DC2626]/10 dark:hover:bg-[#E5484D]/15 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
               </div>
            </div>
         </div>
      </div>

      <main className="w-full px-6 lg:px-[100px] py-6 space-y-6">

        {/* TABS */}
        <div className="flex items-center gap-2 border-b border-[#171717]/[0.08] dark:border-white/[0.08] pb-0 overflow-x-auto no-scrollbar">
          {([
            { id: "overview", label: "Overview", icon: LayoutDashboard },
            { id: "shops", label: "Shops", icon: Store },
            { id: "leads", label: "Leads", icon: UserPlus },
            { id: "partners", label: "Partners", icon: Users },
            { id: "hr", label: "HR", icon: Briefcase },
            { id: "content", label: "Content", icon: FileEdit },
            { id: "security", label: "Security", icon: ShieldAlert },
            { id: "billing", label: "Billing", icon: IndianRupee },
            { id: "storage_logs", label: "Storage & Logs", icon: HardDrive },
            { id: "feedback", label: "Feedback", icon: Star },
            { id: "settings", label: "Settings", icon: Settings },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-4 py-2.5 text-[13.5px] font-semibold tracking-tight transition-colors border-b-2 -mb-px flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? "text-[#171717] dark:text-[#EDEDED] border-[#FB432C]"
                  : "text-[#737373] dark:text-[#85858B] border-transparent hover:text-[#171717] dark:hover:text-[#EDEDED]"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* KPI CARDS */}
        {platform && activeTab === "overview" && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              {
                label: "Total Shops",
                value: platform.totalShops.toString(),
                sub: `${platform.activeShops} active`,
                icon: Store,
                bg: "bg-[#007AFF]/10 dark:bg-[#60A5FA]/15",
                color: "text-[#007AFF] dark:text-[#60A5FA]",
              },
              {
                label: "Active Shops",
                value: platform.activeShops.toString(),
                sub: `${platform.totalShops - platform.activeShops} offline`,
                icon: Activity,
                bg: "bg-[#16A34A]/10 dark:bg-[#4CC38A]/15",
                color: "text-[#16A34A] dark:text-[#4CC38A]",
              },
              {
                label: "Total Files",
                value: platform.totalFiles.toLocaleString("en-IN"),
                sub: "All time uploads",
                icon: FileText,
                bg: "bg-[#FB432C]/10",
                color: "text-[#FB432C]",
              },
              {
                label: "Platform Revenue",
                value: fmt(platform.totalPlatformRevenue),
                sub: "@ ₹0.50 / file",
                icon: IndianRupee,
                bg: "bg-purple-500/10 dark:bg-purple-400/15",
                color: "text-purple-600 dark:text-purple-300",
              },
              {
                label: "Dues Pending",
                value: fmt(platform.pendingDues),
                sub: "To be collected",
                icon: AlertTriangle,
                bg: "bg-[#DC2626]/10 dark:bg-[#E5484D]/15",
                color: "text-[#DC2626] dark:text-[#E5484D]",
              },
            ].map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-xl p-5 flex flex-col gap-3"
              >
                <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                   <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <div>
                   <p className="text-[24px] font-semibold tracking-tight text-[#171717] dark:text-[#EDEDED] leading-none mb-1 tabular-nums">{card.value}</p>
                   <p className="text-[12px] font-semibold text-[#525252] dark:text-[#A1A1A6] tracking-tight">{card.label}</p>
                   <p className="text-[11px] font-medium text-[#737373] dark:text-[#85858B] mt-0.5">{card.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── LEADS TAB ───────────────────────────────────────────────────────── */}
        {activeTab === "leads" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Shop Submissions */}
              <div className="bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-xl overflow-hidden">
                <div className="p-5 border-b border-[#171717]/[0.08] dark:border-white/[0.08] flex items-center justify-between bg-[#F4F4F5]/60 dark:bg-[#232325]/60">
                  <h3 className="text-[13px] font-semibold uppercase tracking-wider flex items-center gap-2 text-[#171717] dark:text-[#EDEDED]">
                    <UserPlus className="w-4 h-4" /> Shop Registrations
                  </h3>
                  <span className="text-[11px] font-semibold bg-[#171717] dark:bg-[#EDEDED] text-white dark:text-[#111113] px-2.5 py-0.5 rounded-full">{submissions.length}</span>
                </div>
                <div className="divide-y divide-[#171717]/[0.06] dark:divide-white/[0.06]">
                  {submissions.map((sub) => (
                    <div key={sub.id} className="p-4 hover:bg-[#F4F4F5]/50 dark:hover:bg-[#232325]/50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-[14px] font-semibold text-[#171717] dark:text-[#EDEDED]">{sub.shop_name}</p>
                          <p className="text-[12px] font-medium text-[#525252] dark:text-[#A1A1A6]">{sub.owner_email}</p>
                        </div>
                        <button onClick={() => handleAction('contact_submissions', sub.id, 'delete')} className="text-[#DC2626] dark:text-[#E5484D] hover:opacity-75 transition-opacity">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[12px] text-[#525252] dark:text-[#A1A1A6] bg-[#F4F4F5] dark:bg-[#232325] p-2.5 rounded-lg mt-2">&quot;{sub.message}&quot;</p>
                      <p className="text-[10px] text-[#737373] dark:text-[#85858B] mt-2 font-semibold uppercase">{new Date(sub.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Newsletter */}
              <div className="bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-xl overflow-hidden">
                <div className="p-5 border-b border-[#171717]/[0.08] dark:border-white/[0.08] flex items-center justify-between bg-[#F4F4F5]/60 dark:bg-[#232325]/60">
                  <h3 className="text-[13px] font-semibold uppercase tracking-wider flex items-center gap-2 text-[#171717] dark:text-[#EDEDED]">
                    <AtSign className="w-4 h-4" /> Newsletter Subs
                  </h3>
                  <span className="text-[11px] font-semibold bg-[#16A34A] dark:bg-[#4CC38A] text-white dark:text-[#111113] px-2.5 py-0.5 rounded-full">{newsletter.length}</span>
                </div>
                <div className="divide-y divide-[#171717]/[0.06] dark:divide-white/[0.06] max-h-[500px] overflow-y-auto">
                  {newsletter.map((sub) => (
                    <div key={sub.id} className="p-4 flex items-center justify-between hover:bg-[#F4F4F5]/50 dark:hover:bg-[#232325]/50 transition-colors">
                      <p className="text-[13px] font-semibold text-[#171717] dark:text-[#EDEDED]">{sub.email}</p>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] text-[#737373] dark:text-[#85858B] font-semibold uppercase">{new Date(sub.created_at).toLocaleDateString()}</span>
                        <button onClick={() => handleAction('newsletter_subs', sub.id, 'delete')} className="text-[#DC2626] dark:text-[#E5484D] hover:opacity-75">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── CONTENT TAB ────────────────────────────────────────────────────── */}
        {activeTab === "content" && (
          <div className="space-y-6">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Blogs Management */}
                <div className="bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-xl overflow-hidden">
                   <div className="p-5 border-b border-[#171717]/[0.08] dark:border-white/[0.08] flex items-center justify-between bg-[#F4F4F5]/60 dark:bg-[#232325]/60">
                      <h3 className="text-[13px] font-semibold uppercase tracking-wider flex items-center gap-2 text-[#171717] dark:text-[#EDEDED]">
                         <FileEdit className="w-4 h-4" /> Blog Articles
                      </h3>
                      <button onClick={() => setIsAddingBlog(true)} className="text-[11px] font-semibold bg-[#FB432C] hover:bg-[#E03923] text-white px-3 py-1 rounded-lg transition-colors">New Post</button>
                   </div>
                   <div className="divide-y divide-[#171717]/[0.06] dark:divide-white/[0.06]">
                      {blogs.map(blog => (
                        <div key={blog.id} className="p-5 hover:bg-[#F4F4F5]/50 dark:hover:bg-[#232325]/50 transition-colors">
                           <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1">
                                 <span className="text-[10px] font-semibold text-[#16A34A] dark:text-[#4CC38A] uppercase tracking-wider">{blog.category}</span>
                                 <h4 className="text-[14px] font-semibold text-[#171717] dark:text-[#EDEDED] leading-tight">{blog.title}</h4>
                                 <p className="text-[12px] text-[#525252] dark:text-[#A1A1A6] line-clamp-2">{blog.excerpt}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                 <button className="p-2 hover:bg-[#F4F4F5] dark:hover:bg-[#232325] text-[#525252] dark:text-[#A1A1A6] rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
                                 <button onClick={() => handleAction('blogs', blog.id, 'delete')} className="p-2 hover:bg-[#DC2626]/10 dark:hover:bg-[#E5484D]/15 text-[#DC2626] dark:text-[#E5484D] rounded-lg transition-colors"><XCircle className="w-4 h-4" /></button>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                {/* News Management */}
                <div className="bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-xl overflow-hidden">
                   <div className="p-5 border-b border-[#171717]/[0.08] dark:border-white/[0.08] flex items-center justify-between bg-[#F4F4F5]/60 dark:bg-[#232325]/60">
                      <h3 className="text-[13px] font-semibold uppercase tracking-wider flex items-center gap-2 text-[#171717] dark:text-[#EDEDED]">
                         <GlobeIcon className="w-4 h-4" /> Platform News
                      </h3>
                      <button onClick={() => setIsAddingNews(true)} className="text-[11px] font-semibold bg-[#FB432C] hover:bg-[#E03923] text-white px-3 py-1 rounded-lg transition-colors">Push Update</button>
                   </div>
                   <div className="divide-y divide-[#171717]/[0.06] dark:divide-white/[0.06]">
                      {news.map(item => (
                        <div key={item.id} className="p-5 flex items-center justify-between hover:bg-[#F4F4F5]/50 dark:hover:bg-[#232325]/50 transition-colors">
                           <div className="space-y-0.5">
                              <p className="text-[13.5px] font-semibold text-[#171717] dark:text-[#EDEDED]">{item.title}</p>
                              <div className="flex items-center gap-3">
                                 <span className="text-[10px] font-medium text-[#737373] dark:text-[#85858B] uppercase tracking-wider">{new Date(item.published_at).toLocaleDateString()}</span>
                                 <span className="w-1 h-1 rounded-full bg-[#737373]/40" />
                                 <span className="text-[10px] font-semibold text-[#FB432C] uppercase tracking-wider">{item.category}</span>
                              </div>
                           </div>
                           <button onClick={() => handleAction('platform_news', item.id, 'delete')} className="text-[#DC2626] dark:text-[#E5484D] hover:opacity-75 transition-opacity">
                             <XCircle className="w-4 h-4" />
                           </button>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* ── HR TAB ─────────────────────────────────────────────────────────── */}
        {activeTab === "hr" && (
           <div className="bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-xl overflow-hidden">
              <div className="p-6 border-b border-[#171717]/[0.08] dark:border-white/[0.08] flex items-center justify-between">
                 <div>
                    <h3 className="text-[16px] font-semibold tracking-tight flex items-center gap-2 text-[#171717] dark:text-[#EDEDED]">
                       <Briefcase className="w-5 h-5" /> Talent Acquisition
                    </h3>
                    <p className="text-[11px] font-medium text-[#737373] dark:text-[#85858B] uppercase tracking-wider mt-1">Reviewing candidates for the XeroxQ mesh</p>
                 </div>
                 <div className="bg-[#171717] dark:bg-[#EDEDED] text-white dark:text-[#111113] px-4 py-1.5 rounded-full text-[11px] font-semibold">
                    {careers.length} ACTIVE APPLICATIONS
                 </div>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-[#F4F4F5] dark:bg-[#232325] border-b border-[#171717]/[0.08] dark:border-white/[0.08]">
                          <th className="p-4 text-[10px] font-semibold uppercase tracking-wider text-[#737373] dark:text-[#85858B]">Candidate</th>
                          <th className="p-4 text-[10px] font-semibold uppercase tracking-wider text-[#737373] dark:text-[#85858B]">Contact</th>
                          <th className="p-4 text-[10px] font-semibold uppercase tracking-wider text-[#737373] dark:text-[#85858B]">Position</th>
                          <th className="p-4 text-[10px] font-semibold uppercase tracking-wider text-[#737373] dark:text-[#85858B]">LinkedIn / Portfolio</th>
                          <th className="p-4 text-[10px] font-semibold uppercase tracking-wider text-[#737373] dark:text-[#85858B] text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-[#171717]/[0.06] dark:divide-white/[0.06]">
                       {careers.map(app => {
                          const profileUrl = sanitizeExternalHttpUrl(app.portfolio_url || app.resume_url || app.linkedin_url);
                          return (
                          <tr key={app.id} className="hover:bg-[#F4F4F5]/50 dark:hover:bg-[#232325]/50 transition-colors">
                             <td className="p-4">
                                <p className="text-[14px] font-semibold text-[#171717] dark:text-[#EDEDED]">{app.full_name}</p>
                                <p className="text-[11px] text-[#737373] dark:text-[#85858B]">Applied {new Date(app.created_at).toLocaleDateString()}</p>
                             </td>
                             <td className="p-4">
                                <p className="text-[13px] font-medium text-[#171717] dark:text-[#EDEDED]">{app.email}</p>
                                {app.whatsapp && <p className="text-[12px] text-[#737373] dark:text-[#85858B]">{app.whatsapp}</p>}
                             </td>
                             <td className="p-4">
                                <span className="px-3 py-1 bg-[#FB432C]/10 text-[#FB432C] rounded-lg text-[11px] font-semibold border border-[#FB432C]/20">
                                   {app.job_id || app.position || "Developer"}
                                </span>
                             </td>
                             <td className="p-4">
                                {profileUrl ? (
                                   <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="text-[#FB432C] hover:underline flex items-center gap-1.5 text-[12px] font-semibold">
                                      <ExternalLink className="w-3 h-3" /> Profile
                                   </a>
                                ) : (
                                   <span className="text-[12px] text-[#737373] dark:text-[#85858B]">Not Provided</span>
                                )}
                             </td>
                             <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                   <button
                                     onClick={() => handleAction('job_applications', app.id, 'approve')}
                                     disabled={app.status === 'approved'}
                                     className="h-8 px-4 bg-[#16A34A] dark:bg-[#4CC38A] text-white dark:text-[#111113] text-[11px] font-semibold rounded-lg disabled:opacity-50 transition-opacity"
                                   >
                                     {app.status === 'approved' ? 'Confirmed' : 'Confirm'}
                                   </button>
                                   <button onClick={() => handleAction('job_applications', app.id, 'delete')} className="p-2 text-[#DC2626] dark:text-[#E5484D] hover:bg-[#DC2626]/10 dark:hover:bg-[#E5484D]/15 rounded-lg transition-colors"><XCircle className="w-4 h-4" /></button>
                                </div>
                             </td>
                          </tr>
                       );})}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {/* ── PARTNERS TAB ───────────────────────────────────────────────────── */}
        {activeTab === "partners" && (
           <div className="bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-xl overflow-hidden min-h-[400px] flex flex-col">
              <div className="p-6 border-b border-[#171717]/[0.08] dark:border-white/[0.08] flex items-center justify-between bg-[#F4F4F5]/60 dark:bg-[#232325]/60">
                 <h3 className="text-[16px] font-semibold tracking-tight flex items-center gap-2 text-[#171717] dark:text-[#EDEDED]">
                    <Users className="w-5 h-5" /> Partnership Ecosystem
                 </h3>
                 <span className="text-[11px] font-semibold text-[#16A34A] dark:text-[#4CC38A] bg-[#16A34A]/10 dark:bg-[#4CC38A]/15 px-3 py-1 rounded-full border border-[#16A34A]/20 dark:border-[#4CC38A]/25">
                    {partners.filter(p => p.status === 'pending').length} PENDING REVIEW
                 </span>
              </div>

              {partners.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#F4F4F5] dark:bg-[#232325] border border-[#171717]/[0.08] dark:border-white/[0.08] flex items-center justify-center mb-4 mx-auto">
                    <Users className="w-8 h-8 text-[#737373] dark:text-[#85858B]" />
                  </div>
                  <h4 className="text-[14px] font-semibold text-[#171717] dark:text-[#EDEDED]">No Partnership Applications</h4>
                  <p className="text-xs text-[#737373] dark:text-[#85858B] mt-1 text-center">When developers or owners apply, they will appear here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 divide-x divide-y divide-[#171717]/[0.06] dark:divide-white/[0.06]">
                   {partners.map(p => (
                      <div key={p.id} className="p-6 space-y-4 hover:bg-[#F4F4F5]/50 dark:hover:bg-[#232325]/50 transition-colors relative group">
                         <div className="flex justify-between items-start">
                            <div className={cn("px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider", p.status === 'approved' ? 'bg-[#16A34A]/10 dark:bg-[#4CC38A]/15 text-[#16A34A] dark:text-[#4CC38A]' : 'bg-amber-500/15 text-amber-700 dark:text-amber-300')}>
                               {p.status || 'pending'}
                            </div>
                            <button onClick={() => handleAction('partners', p.id, 'delete')} className="text-[#DC2626] dark:text-[#E5484D] hover:opacity-75 transition-opacity">
                               <XCircle className="w-4 h-4" />
                            </button>
                         </div>
                         <div className="space-y-1">
                            <h4 className="text-[16px] font-semibold text-[#171717] dark:text-[#EDEDED] leading-none">{p.name}</h4>
                            <p className="text-[12px] font-medium text-[#525252] dark:text-[#A1A1A6] flex items-center gap-1.5"><AtSign className="w-3 h-3" /> {p.email}</p>
                         </div>
                         <div className="bg-[#F4F4F5] dark:bg-[#232325] p-4 rounded-xl border border-[#171717]/[0.06] dark:border-white/[0.06]">
                            <p className="text-[12px] text-[#525252] dark:text-[#A1A1A6] leading-relaxed line-clamp-3">&quot;{p.bio || "No biography provided."}&quot;</p>
                         </div>
                         {p.status === 'pending' && (
                            <button onClick={() => handleAction('partners', p.id, 'approve')} className="w-full h-10 bg-[#FB432C] hover:bg-[#E03923] text-white text-xs font-semibold rounded-xl transition-colors">
                               Onboard as {p.type || 'Partner'}
                            </button>
                         )}
                      </div>
                   ))}
                </div>
              )}
           </div>
        )}

        {/* ── SECURITY TAB ───────────────────────────────────────────────────── */}
        {activeTab === "security" && (
           <div className="space-y-6">
              <div className="bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-xl overflow-hidden">
                 <div className="p-6 border-b border-[#171717]/[0.08] dark:border-white/[0.08] flex items-center justify-between bg-[#DC2626]/5 dark:bg-[#E5484D]/10">
                    <h3 className="text-[16px] font-semibold tracking-tight flex items-center gap-2 text-[#DC2626] dark:text-[#E5484D]">
                       <ShieldAlert className="w-5 h-5" /> Bug Bounty Registry
                    </h3>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-[#DC2626] dark:bg-[#E5484D]" />
                       <span className="text-[11px] font-semibold text-[#DC2626] dark:text-[#E5484D] uppercase tracking-wider">Live Monitoring</span>
                    </div>
                 </div>
                 <div className="divide-y divide-[#171717]/[0.06] dark:divide-white/[0.06]">
                    {security.map(report => (
                       <div key={report.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-[#F4F4F5]/50 dark:hover:bg-[#232325]/50 transition-colors">
                          <div className="space-y-3 max-w-2xl">
                             <div className="flex items-center gap-3">
                                <span className={cn("px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider", report.severity === 'critical' ? 'bg-[#DC2626] text-white' : report.severity === 'high' ? 'bg-amber-500 text-white' : 'bg-[#F4F4F5] dark:bg-[#232325] text-[#525252] dark:text-[#A1A1A6]')}>
                                   {report.severity}
                                </span>
                                <h4 className="text-[15px] font-semibold text-[#171717] dark:text-[#EDEDED]">{report.type || report.vulnerability_type || "Security"} Disclosed</h4>
                             </div>
                             <p className="text-[12.5px] text-[#525252] dark:text-[#A1A1A6] leading-relaxed">&quot;{report.description}&quot;</p>
                             <div className="flex items-center gap-4 text-[11px] font-medium text-[#737373] dark:text-[#85858B]">
                                <span className="flex items-center gap-1.5"><AtSign className="w-3 h-3" /> {report.email || report.reporter_email}</span>
                                <span>•</span>
                                <span>{new Date(report.created_at).toLocaleString()}</span>
                                <span>•</span>
                                <span className="uppercase">{report.status || "reported"}</span>
                             </div>
                          </div>
                          <div className="flex items-center gap-2">
                             <button onClick={() => handleAction('security_reports', report.id, 'review_poc' as any)} className="h-10 px-5 bg-[#FB432C] hover:bg-[#E03923] text-white text-xs font-semibold rounded-xl transition-colors">
                               {report.status === 'reviewed' ? 'Mark Resolved' : report.status === 'resolved' ? 'Resolved' : 'Review PoC'}
                             </button>
                             <button onClick={() => handleAction('security_reports', report.id, 'delete')} className="p-2 text-[#DC2626] dark:text-[#E5484D] hover:bg-[#DC2626]/10 dark:hover:bg-[#E5484D]/15 rounded-lg transition-colors"><XCircle className="w-4 h-4" /></button>
                          </div>
                       </div>
                    ))}
                    {security.length === 0 && (
                      <div className="p-12 text-center text-[#737373] dark:text-[#85858B] font-medium">No vulnerabilities reported yet. Secure mesh is intact.</div>
                    )}
                 </div>
              </div>
           </div>
        )}

        {/* ── FEEDBACK TAB ───────────────────────────────────────────────────── */}
        {activeTab === "feedback" && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Global Feedback Toggle */}
            <div className="bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-xl overflow-hidden">
              <div className="p-6 border-b border-[#171717]/[0.08] dark:border-white/[0.08]">
                <h3 className="text-[16px] font-semibold tracking-tight flex items-center gap-2 text-[#171717] dark:text-[#EDEDED]">
                  <Star className="w-5 h-5 text-[#FB432C]" /> Global Feedback Control
                </h3>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[14px] font-semibold text-[#171717] dark:text-[#EDEDED]">Feedback System</p>
                    <p className="text-[12px] text-[#525252] dark:text-[#A1A1A6]">Enable/disable feedback collection across all shops</p>
                  </div>
                  <button
                    onClick={handleToggleGlobalFeedback}
                    className={cn(
                      "w-14 h-7 rounded-full relative transition-colors duration-200",
                      feedbackGlobalEnabled ? "bg-[#16A34A] dark:bg-[#4CC38A]" : "bg-[#E4E4E7] dark:bg-[#232325]"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-200 shadow-xs",
                      feedbackGlobalEnabled ? "right-1" : "left-1"
                    )} />
                  </button>
                </div>
                <p className={cn(
                  "mt-4 text-[12px] font-semibold uppercase tracking-wider",
                  feedbackGlobalEnabled ? "text-[#16A34A] dark:text-[#4CC38A]" : "text-[#DC2626] dark:text-[#E5484D]"
                )}>
                  {feedbackGlobalEnabled ? "✓ Feedback System Active" : "✗ Feedback System Disabled Globally"}
                </p>
              </div>
            </div>

            {/* Default Questions Management */}
            <div className="bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-xl overflow-hidden">
              <div className="p-6 border-b border-[#171717]/[0.08] dark:border-white/[0.08]">
                <h3 className="text-[16px] font-semibold tracking-tight text-[#171717] dark:text-[#EDEDED]">Default Feedback Questions</h3>
                <p className="text-[12px] text-[#525252] dark:text-[#A1A1A6] mt-1">These questions appear for all customers across all shops</p>
              </div>

              {/* Add New Question */}
              <div className="p-6 bg-[#F4F4F5]/60 dark:bg-[#232325]/60 border-b border-[#171717]/[0.08] dark:border-white/[0.08]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    value={newDefaultQuestion}
                    onChange={(e) => setNewDefaultQuestion(e.target.value)}
                    placeholder="Enter question text..."
                    className="w-full h-11 px-4 bg-white dark:bg-[#19191B] border border-[#171717]/[0.10] dark:border-white/[0.10] text-[#171717] dark:text-[#EDEDED] placeholder:text-[#737373] dark:placeholder:text-[#85858B] rounded-lg text-[14px] outline-none focus:border-[#FB432C]"
                  />
                  <input
                    type="text"
                    value={newDefaultOptions}
                    onChange={(e) => setNewDefaultOptions(e.target.value)}
                    placeholder="Options: Poor,Fair,Good,Great"
                    className="w-full h-11 px-4 bg-white dark:bg-[#19191B] border border-[#171717]/[0.10] dark:border-white/[0.10] text-[#171717] dark:text-[#EDEDED] placeholder:text-[#737373] dark:placeholder:text-[#85858B] rounded-lg text-[14px] outline-none focus:border-[#FB432C]"
                  />
                </div>
                <button
                  onClick={handleAddDefaultQuestion}
                  disabled={!newDefaultQuestion.trim()}
                  className="w-full h-11 bg-[#FB432C] hover:bg-[#E03923] text-white font-semibold text-sm rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Default Question
                </button>
              </div>

              {/* Existing Questions */}
              <div className="p-6">
                {defaultQuestions.length === 0 ? (
                  <p className="text-center text-[#737373] dark:text-[#85858B] py-8">No default questions configured</p>
                ) : (
                  <div className="space-y-3">
                    {defaultQuestions.map((q, idx) => (
                      <div key={q.id} className="flex items-center justify-between p-4 bg-[#F4F4F5] dark:bg-[#232325] rounded-lg">
                        <div>
                          <p className="font-semibold text-[#171717] dark:text-[#EDEDED]">{idx + 1}. {q.question_text}</p>
                          <p className="text-[12px] text-[#525252] dark:text-[#A1A1A6]">
                            {(Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]')).join(', ')}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteDefaultQuestion(q.id)}
                          className="p-2 text-[#DC2626] dark:text-[#E5484D] hover:bg-[#DC2626]/10 dark:hover:bg-[#E5484D]/15 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* All Feedback Responses */}
            <div className="bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-xl overflow-hidden">
              <div className="p-6 border-b border-[#171717]/[0.08] dark:border-white/[0.08]">
                <h3 className="text-[16px] font-semibold tracking-tight text-[#171717] dark:text-[#EDEDED]">Recent Feedback Responses</h3>
                <p className="text-[12px] text-[#525252] dark:text-[#A1A1A6] mt-1">Latest {allFeedbackResponses.length} responses from all shops</p>
              </div>
              <div className="p-6">
                {allFeedbackResponses.length === 0 ? (
                  <p className="text-center text-[#737373] dark:text-[#85858B] py-8">No feedback responses yet</p>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto">
                    {allFeedbackResponses.map((response) => (
                      <div key={response.id} className="p-4 bg-[#F4F4F5] dark:bg-[#232325] rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-[#171717] dark:text-[#EDEDED]">{response.shops?.name || 'Unknown Shop'}</span>
                          <span className="text-[12px] text-[#737373] dark:text-[#85858B]">
                            {new Date(response.submitted_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-[13px] text-[#525252] dark:text-[#A1A1A6]">{response.customer_name || 'Anonymous'}</p>
                        {response.overall_rating && (
                          <div className="flex items-center gap-1 mt-2">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={i < response.overall_rating ? 'text-amber-400' : 'text-[#737373]/40'}>★</span>
                            ))}
                          </div>
                        )}
                        {(response.default_responses || response.custom_responses) && (
                          <div className="mt-3 space-y-1">
                            {Object.entries({...(response.default_responses || {}), ...(response.custom_responses || {})})
                              .filter(([key]) => key !== 'overall_rating')
                              .map(([key, value]) => (
                                <div key={key} className="flex items-center gap-2 text-[12px]">
                                  <span className="text-[#737373] dark:text-[#85858B]">{key}:</span>
                                  <span className="font-medium text-[#171717] dark:text-[#EDEDED]">{String(value)}</span>
                                </div>
                              ))
                            }
                          </div>
                        )}
                        {response.written_feedback && (
                          <p className="mt-2 text-[13px] text-[#525252] dark:text-[#A1A1A6]">&quot;{response.written_feedback}&quot;</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── SETTINGS TAB ───────────────────────────────────────────────────── */}
        {activeTab === "settings" && (
           <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-xl overflow-hidden">
                 <div className="p-6 border-b border-[#171717]/[0.08] dark:border-white/[0.08]">
                    <h3 className="text-[16px] font-semibold tracking-tight flex items-center gap-2 text-[#171717] dark:text-[#EDEDED]">
                       <Settings className="w-5 h-5" /> Global Platform Settings
                    </h3>
                 </div>
                 <div className="divide-y divide-[#171717]/[0.06] dark:divide-white/[0.06]">
                    <div className="p-7 flex items-center justify-between hover:bg-[#F4F4F5]/50 dark:hover:bg-[#232325]/50 transition-colors">
                       <div className="space-y-1">
                          <div className="flex items-center gap-2">
                             <div className={cn("w-2 h-2 rounded-full", !!settings.find(s => s.key === 'maintenance_mode')?.value ? "bg-[#DC2626] dark:bg-[#E5484D]" : "bg-[#16A34A] dark:bg-[#4CC38A]")} />
                             <p className="text-[14px] font-semibold text-[#171717] dark:text-[#EDEDED]">Global Maintenance Protocol</p>
                          </div>
                          <p className="text-[12px] text-[#525252] dark:text-[#A1A1A6]">When active, all customer routes are locked. Only Admin Portal remains live.</p>
                       </div>

                       <div className="flex items-center gap-4">
                          <span className={cn("text-[10.5px] font-semibold uppercase tracking-wider", !!settings.find(s => s.key === 'maintenance_mode')?.value ? "text-[#DC2626] dark:text-[#E5484D]" : "text-[#737373] dark:text-[#85858B]")}>
                             { !!settings.find(s => s.key === 'maintenance_mode')?.value ? "LOCKDOWN ACTIVE" : "SYSTEM LIVE" }
                          </span>

                          {/* Custom Toggle Switch */}
                          <button
                            onClick={() => handleAction('platform_settings', 'maintenance_mode', 'toggle')}
                            className={cn(
                               "w-14 h-7 rounded-full relative transition-colors duration-200",
                               !!settings.find(s => s.key === 'maintenance_mode')?.value ? "bg-[#DC2626] dark:bg-[#E5484D]" : "bg-[#E4E4E7] dark:bg-[#232325]"
                            )}
                          >
                             <motion.div
                               animate={{ x: !!settings.find(s => s.key === 'maintenance_mode')?.value ? 28 : 4 }}
                               className="absolute top-1 w-5 h-5 bg-white rounded-full flex items-center justify-center"
                             >
                                <div className={cn("w-1.5 h-1.5 rounded-full", !!settings.find(s => s.key === 'maintenance_mode')?.value ? "bg-[#DC2626]" : "bg-[#737373]")} />
                             </motion.div>
                          </button>
                       </div>
                    </div>

                    <div className="p-6 flex items-center justify-between">
                       <div className="space-y-1">
                          <p className="text-[14px] font-semibold text-[#171717] dark:text-[#EDEDED]">Platform Fee (@ ₹0.50)</p>
                          <p className="text-[12px] text-[#525252] dark:text-[#A1A1A6]">Adjust the global transaction fee for each physicalized file.</p>
                       </div>
                       <div className="flex items-center gap-3">
                          <Input className="w-24 h-10 text-right font-semibold" defaultValue="0.50" />
                          <button className="h-10 px-4 bg-[#FB432C] hover:bg-[#E03923] text-white text-xs font-semibold rounded-xl transition-colors">Update</button>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* ── OVERVIEW TAB ───────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Top shops by volume */}
              <div className="bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-xl p-6">
                <h2 className="font-semibold text-[#171717] dark:text-[#EDEDED] text-[16px] mb-6 flex items-center gap-2 tracking-tight">
                  <TrendingUp className="w-5 h-5 text-[#FB432C]" />
                  Top Shops by Volume
                </h2>
                <div className="space-y-4">
                  {[...(platform?.shops || [])].sort((a, b) => b.totalJobs - a.totalJobs).slice(0, 6).map((shop) => (
                    <div key={shop.id} className="group">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[12px] font-semibold text-[#171717] dark:text-[#EDEDED] truncate max-w-[160px]">{shop.name}</span>
                        <span className="text-[12px] font-semibold text-[#171717] dark:text-[#EDEDED]">{shop.totalJobs} <span className="text-[10px] text-[#737373] dark:text-[#85858B]">Files</span></span>
                      </div>
                      <div className="h-1.5 bg-[#F4F4F5] dark:bg-[#232325] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${platform?.shops[0]?.totalJobs ? (shop.totalJobs / platform.shops[0].totalJobs) * 100 : 0}%` }}
                          className="h-full bg-[#171717] dark:bg-[#EDEDED] group-hover:bg-[#FB432C] transition-colors"
                        />
                      </div>
                    </div>
                  ))}
                  {(platform?.shops || []).length === 0 && (
                    <p className="text-[#737373] dark:text-[#85858B] text-sm text-center py-8">No shops registered yet.</p>
                  )}
                </div>
              </div>

              {/* Shop status summary */}
              <div className="bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-xl p-6">
                <h2 className="font-semibold text-[#171717] dark:text-[#EDEDED] text-[16px] mb-6 flex items-center gap-2 tracking-tight">
                  <Users className="w-5 h-5 text-[#FB432C]" />
                  Network Health
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-[#16A34A]/10 dark:bg-[#4CC38A]/15 border border-[#16A34A]/20 dark:border-[#4CC38A]/25 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#16A34A] dark:bg-[#4CC38A]" />
                      <span className="text-[13px] font-semibold text-[#16A34A] dark:text-[#4CC38A]">Online Shops</span>
                    </div>
                    <span className="text-[18px] font-semibold text-[#16A34A] dark:text-[#4CC38A] tabular-nums">{platform?.activeShops}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[#F4F4F5] dark:bg-[#232325] border border-[#171717]/[0.06] dark:border-white/[0.08] rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#737373] dark:bg-[#85858B]" />
                      <span className="text-[13px] font-semibold text-[#525252] dark:text-[#A1A1A6]">Offline Shops</span>
                    </div>
                    <span className="text-[18px] font-semibold text-[#171717] dark:text-[#EDEDED] tabular-nums">{(platform?.totalShops ?? 0) - (platform?.activeShops ?? 0)}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[#F4F4F5] dark:bg-[#232325] border border-[#171717]/[0.06] dark:border-white/[0.08] rounded-xl">
                    <div className="flex items-center gap-3">
                      <Zap className="w-4 h-4 text-[#FB432C]" />
                      <span className="text-[13px] font-semibold text-[#171717] dark:text-[#EDEDED]">Avg. Files / Shop</span>
                    </div>
                    <p className="text-[14px] font-semibold text-[#171717] dark:text-[#EDEDED] tabular-nums">
                      {platform?.shops?.length ? Math.round((platform?.totalFiles ?? 0) / platform.shops.length) : 0}
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[#F4F4F5] dark:bg-[#232325] border border-[#171717]/[0.06] dark:border-white/[0.08] rounded-xl">
                    <div className="flex items-center gap-3">
                      <IndianRupee className="w-4 h-4 text-purple-600 dark:text-purple-300" />
                      <span className="text-[13px] font-semibold text-[#171717] dark:text-[#EDEDED]">Avg. Due / Shop</span>
                    </div>
                    <p className="text-[14px] font-semibold text-[#171717] dark:text-[#EDEDED] tabular-nums">
                      {platform?.shops?.length ? fmt((platform?.pendingDues ?? 0) / platform.shops.length) : "₹0.00"}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── SHOPS TAB ──────────────────────────────────────────────────────── */}
          {activeTab === "shops" && (
            <motion.div
              key="shops"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-[#19191B] p-4 border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-xl">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  {[
                    { id: "all", label: "All Shops", count: platform?.shops?.length || 0 },
                    { id: "pending", label: "Pending Approval", count: pendingShopsCount, isAlert: pendingShopsCount > 0 },
                    { id: "approved", label: "Approved Shops", count: (platform?.shops?.length || 0) - pendingShopsCount },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setApprovalFilter(filter.id as any)}
                      className={cn(
                        "px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap",
                        approvalFilter === filter.id
                          ? "bg-[#171717] dark:bg-[#EDEDED] text-white dark:text-[#111113]"
                          : "bg-[#F4F4F5] dark:bg-[#232325] text-[#525252] dark:text-[#A1A1A6] hover:bg-[#E4E4E7] dark:hover:bg-[#2C2C2E] border border-[#171717]/[0.06] dark:border-white/[0.06]"
                      )}
                    >
                      <span>{filter.label}</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-semibold",
                        approvalFilter === filter.id
                          ? "bg-white/20 dark:bg-black/15 text-white dark:text-[#111113]"
                          : filter.isAlert
                          ? "bg-amber-500 text-white"
                          : "bg-[#E4E4E7] dark:bg-[#2C2C2E] text-[#171717] dark:text-[#EDEDED]"
                      )}>
                        {filter.count}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-[280px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-[#737373] dark:text-[#85858B]" />
                  <input
                    type="text"
                    placeholder="Search shops..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="auth-input w-full h-[38px] pl-9 pr-8 text-[12.5px]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      aria-label="Clear search"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded text-[#737373] dark:text-[#85858B] hover:text-[#171717] dark:hover:text-[#EDEDED]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Table */}
              <div className="bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  {/* Header */}
                  <div className="grid grid-cols-[2fr_1fr_1fr_1.4fr_1fr_160px] gap-4 px-6 py-3 border-b border-[#171717]/[0.08] dark:border-white/[0.08] bg-[#F4F4F5] dark:bg-[#232325] min-w-[850px] w-full">
                    {[
                      { key: "name" as SortKey, label: "Shop" },
                      { key: "totalJobs" as SortKey, label: "Total Files" },
                      { key: "created_at" as SortKey, label: "Joined" },
                      { key: null, label: "Approval Status" },
                      { key: null, label: "Live Queue" },
                      { key: null, label: "Actions" },
                    ].map((col) => (
                      <button
                        key={col.label}
                        onClick={() => col.key && toggleSort(col.key)}
                        className={`text-left text-[10.5px] font-semibold uppercase tracking-wider flex items-center gap-1 ${col.key ? "text-[#737373] dark:text-[#85858B] hover:text-[#171717] dark:hover:text-[#EDEDED] transition-colors" : "text-[#737373] dark:text-[#85858B] cursor-default"}`}
                      >
                        {col.label}
                        {col.key && sortKey === col.key && (
                          sortDir === "asc" ? <ChevronUp className="w-3 h-3 text-[#171717] dark:text-[#EDEDED]" /> : <ChevronDown className="w-3 h-3 text-[#171717] dark:text-[#EDEDED]" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Rows */}
                  <div className="divide-y divide-[#171717]/[0.06] dark:divide-white/[0.06] max-h-[520px] overflow-y-auto min-w-[850px] w-full">
                    {filteredShops.map((shop, i) => (
                      <motion.div
                        key={shop.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: Math.min(i * 0.02, 0.25) }}
                        className="grid grid-cols-[2fr_1fr_1fr_1.4fr_1fr_160px] gap-4 px-6 py-[14px] hover:bg-[#F4F4F5]/60 dark:hover:bg-[#232325]/60 transition-colors items-center"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-[14px] text-[#171717] dark:text-[#EDEDED] tracking-tight truncate">{shop.name}</p>
                          <a
                            href={`/${shop.slug}`}
                            target="_blank"
                            className="text-[11px] font-medium text-[#737373] dark:text-[#85858B] hover:text-[#FB432C] transition-colors flex items-center gap-1 mt-0.5"
                          >
                            /{shop.slug}
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        </div>

                        <div>
                          <p className="font-semibold text-[16px] text-[#171717] dark:text-[#EDEDED] tabular-nums">{shop.totalJobs}</p>
                          <p className="text-[10px] font-medium text-[#737373] dark:text-[#85858B] uppercase tracking-wider">all uploads</p>
                        </div>

                        <div>
                          <p className="text-[12px] text-[#525252] dark:text-[#A1A1A6] font-medium">
                            {new Date(shop.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                          </p>
                        </div>

                        <div>
                          {shop.approval_status === "approved" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#16A34A]/10 dark:bg-[#4CC38A]/15 text-[#16A34A] dark:text-[#4CC38A] border border-[#16A34A]/20 dark:border-[#4CC38A]/25 text-[10.5px] font-semibold uppercase tracking-wider">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Unlimited
                            </span>
                          ) : shop.approval_status === "rejected" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#DC2626]/10 dark:bg-[#E5484D]/15 text-[#DC2626] dark:text-[#E5484D] border border-[#DC2626]/20 dark:border-[#E5484D]/25 text-[10.5px] font-semibold uppercase tracking-wider">
                              <XCircle className="w-3.5 h-3.5" />
                              Rejected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25 text-[10.5px] font-semibold uppercase tracking-wider">
                              <Clock className="w-3.5 h-3.5" />
                              Trial ({shop.total_files_processed || 0}/3 scans)
                            </span>
                          )}
                        </div>

                        <div>
                          <span className={`text-[10.5px] font-semibold px-2.5 py-1 rounded-md uppercase tracking-wider ${shop.pendingJobs > 0 ? "bg-[#FB432C]/10 text-[#FB432C] border border-[#FB432C]/20" : "bg-[#F4F4F5] dark:bg-[#232325] text-[#737373] dark:text-[#85858B] border border-[#171717]/[0.06] dark:border-white/[0.08]"}`}>
                            {shop.pendingJobs} live
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Approve Button */}
                          {shop.approval_status !== "approved" && (
                            <button
                              onClick={() => handleApproveShop(shop.id)}
                              disabled={actionShopId === shop.id}
                              className="h-[34px] px-2.5 bg-[#16A34A] dark:bg-[#4CC38A] hover:opacity-90 text-white dark:text-[#111113] rounded-lg flex items-center gap-1 text-[10.5px] font-semibold transition-opacity disabled:opacity-50"
                              title="Approve Shop for Unlimited Scans"
                            >
                              {actionShopId === shop.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <>
                                  <Check className="w-3.5 h-3.5" /> Approve
                                </>
                              )}
                            </button>
                          )}

                          {/* Reject / Revoke Button */}
                          {shop.approval_status === "approved" && (
                            <button
                              onClick={() => handleRejectShop(shop.id)}
                              disabled={actionShopId === shop.id}
                              className="h-[34px] px-2 bg-[#F4F4F5] dark:bg-[#232325] hover:bg-[#DC2626]/10 hover:text-[#DC2626] dark:hover:bg-[#E5484D]/15 dark:hover:text-[#E5484D] text-[#737373] dark:text-[#85858B] rounded-lg flex items-center justify-center border border-[#171717]/[0.08] dark:border-white/[0.08] transition-colors disabled:opacity-50"
                              title="Revoke Approval / Reject"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* View Details */}
                          <button
                            onClick={() => setSelectedShop(shop)}
                            className="h-[34px] w-[34px] rounded-lg bg-white dark:bg-[#19191B] hover:bg-[#F4F4F5] dark:hover:bg-[#232325] border border-[#171717]/[0.10] dark:border-white/[0.10] flex items-center justify-center transition-colors"
                            title="View Shop Details"
                          >
                            <Eye className="w-[14px] h-[14px] text-[#737373] dark:text-[#85858B]" />
                          </button>

                          {/* Open / Close Toggle */}
                          <button
                            onClick={() => handleToggleShop(shop)}
                            disabled={actionShopId === shop.id}
                            className={`h-[34px] w-[34px] rounded-lg flex items-center justify-center transition-colors border disabled:opacity-40 disabled:cursor-not-allowed ${
                              shop.is_open
                                ? "bg-[#16A34A]/10 dark:bg-[#4CC38A]/15 border-[#16A34A]/20 dark:border-[#4CC38A]/25"
                                : "bg-[#F4F4F5] dark:bg-[#232325] border-[#171717]/[0.08] dark:border-white/[0.08]"
                            }`}
                            title={shop.is_open ? "Close this shop" : "Open this shop"}
                          >
                            {actionShopId === shop.id ? (
                              <Loader2 className="w-[15px] h-[15px] text-[#737373] animate-spin" />
                            ) : shop.is_open ? (
                              <ToggleRight className="w-[20px] h-[20px] text-[#16A34A] dark:text-[#4CC38A]" />
                            ) : (
                              <ToggleLeft className="w-[20px] h-[20px] text-[#737373] dark:text-[#85858B]" />
                            )}
                          </button>
                        </div>
                      </motion.div>
                    ))}

                    {filteredShops.length === 0 && (
                      <div className="py-16 text-center text-[#737373] dark:text-[#85858B] text-[13px] font-semibold min-w-[700px] w-full">
                        No shops match your search.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── BILLING TAB ────────────────────────────────────────────────────── */}
          {activeTab === "billing" && (
            <motion.div
              key="billing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Billing policy card */}
              <div className="bg-purple-500/10 dark:bg-purple-400/10 border border-purple-500/20 dark:border-purple-400/25 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#19191B] border border-purple-500/20 dark:border-purple-400/25 flex items-center justify-center shrink-0">
                  <Printer className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[#171717] dark:text-[#EDEDED] text-[16px] tracking-tight">Per-Print Ledger Model</h3>
                  <p className="text-[#525252] dark:text-[#A1A1A6] text-[13px] mt-1 leading-relaxed max-w-3xl">
                    XeroxQ charges a platform fee of <strong className="text-purple-700 dark:text-purple-300">₹0.50 per file</strong> pushed through the network. This is calculated using an immutable counter that permanently counts every uploaded file.
                  </p>
                </div>
              </div>

              {/* Billing table */}
              <div className="bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-[2fr_1fr_1.5fr_0.8fr_1.2fr] gap-4 px-6 py-3 border-b border-[#171717]/[0.08] dark:border-white/[0.08] bg-[#F4F4F5] dark:bg-[#232325] min-w-[650px] w-full">
                    {["Shop", "Total Uploads", "Est. Shop Revenue", "Status", "Platform Fee Due"].map((h) => (
                      <span key={h} className="text-[10.5px] font-semibold uppercase tracking-wider text-[#737373] dark:text-[#85858B]">{h}</span>
                    ))}
                  </div>

                  <div className="divide-y divide-[#171717]/[0.06] dark:divide-white/[0.06] max-h-[520px] overflow-y-auto min-w-[650px] w-full">
                    {[...(platform?.shops || [])].sort((a, b) => b.platformFee - a.platformFee).map((shop, i) => (
                      <motion.div
                        key={shop.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: Math.min(i * 0.02, 0.25) }}
                        className="grid grid-cols-[2fr_1fr_1.5fr_0.8fr_1.2fr] gap-4 px-6 py-[14px] items-center hover:bg-[#F4F4F5]/60 dark:hover:bg-[#232325]/60 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-[14px] text-[#171717] dark:text-[#EDEDED] tracking-tight truncate">{shop.name}</p>
                          <p className="text-[11px] font-medium text-[#737373] dark:text-[#85858B]">/{shop.slug}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-[16px] text-[#171717] dark:text-[#EDEDED] tabular-nums">{shop.totalJobs}</p>
                          <p className="text-[10px] font-medium text-[#737373] dark:text-[#85858B] uppercase tracking-wider">all statuses</p>
                        </div>
                        <p className="font-semibold text-[14px] text-[#16A34A] dark:text-[#4CC38A] tabular-nums">{fmt(shop.revenueGenerated)}</p>
                        <div>
                          <span className={`text-[10.5px] font-semibold px-2 py-1 rounded uppercase tracking-wider ${
                            shop.feeStatus === "due"
                              ? "bg-[#DC2626]/10 dark:bg-[#E5484D]/15 text-[#DC2626] dark:text-[#E5484D] border border-[#DC2626]/20 dark:border-[#E5484D]/25"
                              : "bg-[#16A34A]/10 dark:bg-[#4CC38A]/15 text-[#16A34A] dark:text-[#4CC38A] border border-[#16A34A]/20 dark:border-[#4CC38A]/25"
                          }`}>
                            {shop.feeStatus}
                          </span>
                        </div>
                        <p className="font-semibold text-[16px] text-[#FB432C] tabular-nums">{fmt(shop.platformFee)}</p>
                      </motion.div>
                    ))}

                    {(platform?.shops || []).length === 0 && (
                      <div className="py-16 text-center text-[#737373] dark:text-[#85858B] text-[13px] font-semibold">
                        No shop data available.
                      </div>
                    )}
                  </div>

                  {/* Totals row */}
                  <div className="grid grid-cols-[2fr_1fr_1.5fr_0.8fr_1.2fr] gap-4 px-6 py-[16px] border-t border-[#171717]/[0.10] dark:border-white/[0.10] bg-[#F4F4F5] dark:bg-[#232325] min-w-[650px] w-full">
                    <span className="text-[13px] font-semibold tracking-tight text-[#171717] dark:text-[#EDEDED] uppercase">Platform Total</span>
                    <span className="text-[16px] font-semibold text-[#171717] dark:text-[#EDEDED] tabular-nums">{platform?.totalFiles.toLocaleString("en-IN") ?? "0"}</span>
                    <span className="text-[15px] font-semibold text-[#16A34A] dark:text-[#4CC38A] tabular-nums">
                      {platform?.shops?.length ? fmt(platform.shops.reduce((s, sh) => s + sh.revenueGenerated, 0)) : "₹0.00"}
                    </span>
                    <span />
                    <span className="text-[18px] font-semibold text-[#FB432C] tabular-nums">{fmt(platform?.totalPlatformRevenue ?? 0)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STORAGE & LOGS TAB ────────────────────────────────────────────────── */}
          {activeTab === "storage_logs" && (
            <motion.div
              key="storage_logs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* HEADER BAR & MANUAL PURGE TRIGGER */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#19191B] p-6 rounded-2xl border border-[#171717]/[0.08] dark:border-white/[0.08]">
                <div>
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-5 h-5 text-[#171717] dark:text-[#EDEDED]" />
                    <h2 className="text-lg font-semibold tracking-tight text-[#171717] dark:text-[#EDEDED]">Live Storage &amp; Bucket Logs</h2>
                  </div>
                  <p className="text-[12.5px] text-[#525252] dark:text-[#A1A1A6] mt-1">
                    Monitor Supabase cloud storage bucket usage, database capacity, peak usage records, and automated 5-minute privacy purge logs.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={async () => {
                      setIsPurgingStorage(true);
                      try {
                        const { data: { session } } = await supabase.auth.getSession();
                        const res = await fetch("/api/platform-admin/stats", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${session?.access_token}`
                          },
                          body: JSON.stringify({ action: "purge_storage_now" })
                        });
                        if (res.ok) {
                          await fetchData();
                        }
                      } finally {
                        setIsPurgingStorage(false);
                      }
                    }}
                    disabled={isPurgingStorage}
                    className="h-10 px-4 bg-[#DC2626] dark:bg-[#E5484D] hover:opacity-90 text-white font-semibold text-xs rounded-xl transition-opacity flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <Trash2 className={`w-4 h-4 ${isPurgingStorage ? "animate-spin" : ""}`} />
                    <span>{isPurgingStorage ? "Purging..." : "Force Delete Storage Now"}</span>
                  </button>
                </div>
              </div>

              {/* METRICS CARDS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* 1. Current Storage Bucket Usage */}
                <div className="bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10.5px] font-semibold uppercase tracking-wider text-[#737373] dark:text-[#85858B]">Bucket Storage Used</span>
                      <div className="w-8 h-8 rounded-xl bg-[#007AFF]/10 dark:bg-[#60A5FA]/15 flex items-center justify-center">
                        <HardDrive className="w-4 h-4 text-[#007AFF] dark:text-[#60A5FA]" />
                      </div>
                    </div>
                    <p className="text-3xl font-semibold text-[#171717] dark:text-[#EDEDED] tracking-tight leading-none mb-2 tabular-nums">
                      {formatBytes(storageAnalytics?.current_bytes || 0)}
                    </p>
                    <p className="text-[12px] font-medium text-[#525252] dark:text-[#A1A1A6]">
                      {storageAnalytics?.current_files || 0} active files in &apos;documents&apos; bucket
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-[#171717]/[0.06] dark:border-white/[0.06]">
                    <div className="flex justify-between text-[10.5px] font-medium text-[#737373] dark:text-[#85858B] mb-1">
                      <span>Capacity (1GB Free Tier)</span>
                      <span>{(((storageAnalytics?.current_bytes || 0) / (1024 * 1024 * 1024)) * 100).toFixed(2)}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#F4F4F5] dark:bg-[#232325] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#FB432C] rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(1, (((storageAnalytics?.current_bytes || 0) / (1024 * 1024 * 1024)) * 100)))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Peak Storage Usage Record */}
                <div className="bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10.5px] font-semibold uppercase tracking-wider text-[#737373] dark:text-[#85858B]">Highest Recorded Usage</span>
                      <div className="w-8 h-8 rounded-xl bg-[#FB432C]/10 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-[#FB432C]" />
                      </div>
                    </div>
                    <p className="text-3xl font-semibold text-[#171717] dark:text-[#EDEDED] tracking-tight leading-none mb-2 tabular-nums">
                      {formatBytes(storageAnalytics?.peak_bytes || 0)}
                    </p>
                    <p className="text-[11.5px] text-[#525252] dark:text-[#A1A1A6] leading-snug">
                      {storageAnalytics?.peak_time ? (
                        <>Peak on <span className="font-semibold text-[#171717] dark:text-[#EDEDED]">{new Date(storageAnalytics.peak_time).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span> at <span className="font-semibold text-[#171717] dark:text-[#EDEDED]">{new Date(storageAnalytics.peak_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span></>
                      ) : "No peak recorded yet"}
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-[#171717]/[0.06] dark:border-white/[0.06] flex items-center justify-between text-[11px]">
                    <span className="font-medium text-[#737373] dark:text-[#85858B]">Files at Peak:</span>
                    <span className="font-semibold text-[#171717] dark:text-[#EDEDED]">{storageAnalytics?.peak_files || 0} Files</span>
                  </div>
                </div>

                {/* 3. Auto-Purged Files Count */}
                <div className="bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10.5px] font-semibold uppercase tracking-wider text-[#737373] dark:text-[#85858B]">5-Min Privacy Deleted</span>
                      <div className="w-8 h-8 rounded-xl bg-purple-500/10 dark:bg-purple-400/15 flex items-center justify-center">
                        <ShieldAlert className="w-4 h-4 text-purple-600 dark:text-purple-300" />
                      </div>
                    </div>
                    <p className="text-3xl font-semibold text-purple-600 dark:text-purple-300 tracking-tight leading-none mb-2 tabular-nums">
                      {storageAnalytics?.auto_deleted_jobs || 0}
                    </p>
                    <p className="text-[11.5px] text-[#525252] dark:text-[#A1A1A6]">
                      Files auto-deleted after 5 minutes per software privacy policy
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-[#171717]/[0.06] dark:border-white/[0.06] flex items-center justify-between text-[11px]">
                    <span className="font-medium text-[#737373] dark:text-[#85858B]">System Janitor:</span>
                    <span className="font-semibold text-[#16A34A] dark:text-[#4CC38A] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#16A34A] dark:bg-[#4CC38A]" /> Active (pg_cron)
                    </span>
                  </div>
                </div>

                {/* 4. User Deleted Files Count */}
                <div className="bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10.5px] font-semibold uppercase tracking-wider text-[#737373] dark:text-[#85858B]">Manually Deleted</span>
                      <div className="w-8 h-8 rounded-xl bg-[#DC2626]/10 dark:bg-[#E5484D]/15 flex items-center justify-center">
                        <Trash2 className="w-4 h-4 text-[#DC2626] dark:text-[#E5484D]" />
                      </div>
                    </div>
                    <p className="text-3xl font-semibold text-[#DC2626] dark:text-[#E5484D] tracking-tight leading-none mb-2 tabular-nums">
                      {storageAnalytics?.user_deleted_jobs || 0}
                    </p>
                    <p className="text-[11.5px] text-[#525252] dark:text-[#A1A1A6]">
                      Files manually deleted by customers from status screen
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-[#171717]/[0.06] dark:border-white/[0.06] flex items-center justify-between text-[11px]">
                    <span className="font-medium text-[#737373] dark:text-[#85858B]">Total Job Records:</span>
                    <span className="font-semibold text-[#171717] dark:text-[#EDEDED]">{storageAnalytics?.total_jobs || 0} Records</span>
                  </div>
                </div>
              </div>

              {/* RECENT STORAGE PURGE LOGS TABLE */}
              <div className="bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-2xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#171717]/[0.08] dark:border-white/[0.08]">
                  <div>
                    <h3 className="text-base font-semibold text-[#171717] dark:text-[#EDEDED]">Recent Storage Activity &amp; Deletion Logs</h3>
                    <p className="text-[12px] text-[#525252] dark:text-[#A1A1A6]">Real-time database records and file storage status across all print queues</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-[#737373] dark:text-[#85858B]">Total Log Entries: {storageLogs.length}</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#171717]/[0.08] dark:border-white/[0.08] text-[10.5px] font-semibold text-[#737373] dark:text-[#85858B] uppercase tracking-wider">
                        <th className="py-3 px-4">Token / ID</th>
                        <th className="py-3 px-4">Customer Name</th>
                        <th className="py-3 px-4">File Name</th>
                        <th className="py-3 px-4">Upload Timestamp</th>
                        <th className="py-3 px-4">Storage State</th>
                        <th className="py-3 px-4 text-right">Deletion Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#171717]/[0.06] dark:divide-white/[0.06] text-[13px]">
                      {storageLogs.map((log) => {
                        const isUserDeleted = log.is_deleted_by_user;
                        const isAutoDeleted = log.is_auto_deleted || (log.file_path === null && !log.is_deleted_by_user);
                        const isActiveFile = log.file_path !== null && !isUserDeleted && !isAutoDeleted;

                        return (
                          <tr key={log.id} className="hover:bg-[#F4F4F5]/50 dark:hover:bg-[#232325]/50 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-semibold text-[#171717] dark:text-[#EDEDED]">
                              #{log.token || log.id.slice(0, 6)}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-[#171717] dark:text-[#EDEDED]">
                              {log.customer_name || 'Guest'}
                            </td>
                            <td className="py-3.5 px-4 font-medium text-[#525252] dark:text-[#A1A1A6] max-w-[220px] truncate" title={log.file_name}>
                              {log.file_name}
                            </td>
                            <td className="py-3.5 px-4 text-[12px] text-[#737373] dark:text-[#85858B]">
                              {new Date(log.created_at).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit"
                              })}
                            </td>
                            <td className="py-3.5 px-4">
                              {isActiveFile ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#16A34A]/10 dark:bg-[#4CC38A]/15 text-[#16A34A] dark:text-[#4CC38A]">
                                  Active in Storage
                                </span>
                              ) : isUserDeleted ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#DC2626]/10 dark:bg-[#E5484D]/15 text-[#DC2626] dark:text-[#E5484D]">
                                  <Trash2 className="w-3 h-3" /> Deleted
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-500/10 dark:bg-purple-400/15 text-purple-600 dark:text-purple-300">
                                  <ShieldAlert className="w-3 h-3" /> Deleted (5-Min)
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right text-[12px] font-semibold">
                              {isActiveFile ? (
                                <span className="text-[#16A34A] dark:text-[#4CC38A]">Available in Bucket</span>
                              ) : isUserDeleted ? (
                                <span className="text-[#DC2626] dark:text-[#E5484D]">Customer Manual Delete</span>
                              ) : (
                                <span className="text-purple-600 dark:text-purple-300">5-Min Software Privacy Policy</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── SHOP DETAIL MODAL ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedShop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedShop(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#19191B] border border-[#171717]/[0.10] dark:border-white/[0.10] rounded-2xl p-8 max-w-lg w-full shadow-2xl"
            >
              <div className="flex items-start justify-between mb-6 border-b border-[#171717]/[0.08] dark:border-white/[0.08] pb-4">
                <div>
                  <h2 className="text-[20px] font-semibold tracking-tight text-[#171717] dark:text-[#EDEDED]">{selectedShop.name}</h2>
                  <a href={`/${selectedShop.slug}`} target="_blank" rel="noopener noreferrer" className="text-[12px] font-semibold text-[#FB432C] hover:underline flex items-center gap-1 mt-1">
                    {formatDisplayUrl(buildShopPortalUrl(selectedShop.slug))}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <button onClick={() => setSelectedShop(null)} className="w-[34px] h-[34px] rounded-lg bg-[#F4F4F5] dark:bg-[#232325] border border-[#171717]/[0.08] dark:border-white/[0.08] text-[#171717] dark:text-[#EDEDED] flex items-center justify-center">
                  <XCircle className="w-[18px] h-[18px]" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { label: "Lifetime Files", value: selectedShop.totalJobs.toString(), color: "text-[#171717] dark:text-[#EDEDED]" },
                  { label: "Live Queue", value: selectedShop.pendingJobs.toString(), color: "text-[#FB432C]" },
                  { label: "Platform Fee", value: fmt(selectedShop.platformFee), color: "text-[#FB432C]" },
                  { label: "Est. Shop Revenue", value: fmt(selectedShop.revenueGenerated), color: "text-[#16A34A] dark:text-[#4CC38A]" },
                  { label: "UPI ID", value: selectedShop.upi_id ?? "Not Linked", color: "text-[#171717] dark:text-[#EDEDED]" },
                  { label: "Current Status", value: selectedShop.is_open ? "OPEN" : "CLOSED", color: selectedShop.is_open ? "text-[#16A34A] dark:text-[#4CC38A]" : "text-[#737373] dark:text-[#85858B]" },
                ].map((item) => (
                  <div key={item.label} className="bg-[#F4F4F5] dark:bg-[#232325] border border-[#171717]/[0.06] dark:border-white/[0.08] rounded-xl p-4 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#737373] dark:text-[#85858B] mb-1.5">{item.label}</p>
                    <p className={`text-[17px] font-semibold ${item.color} truncate leading-none tabular-nums`}>{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <div className="flex gap-3">
                  {selectedShop.approval_status !== "approved" ? (
                    <button
                      onClick={() => handleApproveShop(selectedShop.id)}
                      disabled={actionShopId === selectedShop.id}
                      className="flex-1 h-[40px] rounded-xl text-xs font-semibold bg-[#16A34A] dark:bg-[#4CC38A] hover:opacity-90 text-white dark:text-[#111113] transition-opacity flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {actionShopId === selectedShop.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Approve Shop for Unlimited Scans</>}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRejectShop(selectedShop.id)}
                      disabled={actionShopId === selectedShop.id}
                      className="flex-1 h-[40px] rounded-xl text-xs font-semibold bg-amber-500/15 border border-amber-500/25 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {actionShopId === selectedShop.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4" /> Revoke Unlimited Approval</>}
                    </button>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => { handleToggleShop(selectedShop); setSelectedShop(null); }}
                    className={`flex-1 h-[40px] rounded-xl text-xs font-semibold border transition-colors flex items-center justify-center gap-2 ${
                      selectedShop.is_open
                        ? "bg-[#DC2626]/10 dark:bg-[#E5484D]/15 border-[#DC2626]/20 dark:border-[#E5484D]/25 text-[#DC2626] dark:text-[#E5484D]"
                        : "bg-[#16A34A]/10 dark:bg-[#4CC38A]/15 border-[#16A34A]/20 dark:border-[#4CC38A]/25 text-[#16A34A] dark:text-[#4CC38A]"
                    }`}
                  >
                    {selectedShop.is_open ? <><Ban className="w-4 h-4" /> Close Shop Down</> : <><CheckCircle2 className="w-4 h-4" /> Reopen Shop</>}
                  </button>
                  <a
                    href={`/${selectedShop.slug}`}
                    target="_blank"
                    className="flex-1 h-[40px] rounded-xl text-xs font-semibold bg-[#F4F4F5] dark:bg-[#232325] border border-[#171717]/[0.10] dark:border-white/[0.10] text-[#171717] dark:text-[#EDEDED] hover:bg-[#E4E4E7] dark:hover:bg-[#2C2C2E] transition-colors flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" /> Go to Shop
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CUSTOM CONFIRMATION MODAL ─────────────────────────────────────────── */}
      <Dialog open={confirmModal.open} onOpenChange={(o) => setConfirmModal(p => ({ ...p, open: o }))}>
        <DialogContent className="sm:max-w-[400px] bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-2xl p-8">
          <DialogHeader className="mb-6">
            <div className="w-12 h-12 rounded-full bg-[#DC2626]/10 dark:bg-[#E5484D]/15 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-[#DC2626] dark:text-[#E5484D]" />
            </div>
            <DialogTitle className="text-xl font-semibold tracking-tight text-[#171717] dark:text-[#EDEDED]">{confirmModal.title}</DialogTitle>
            <DialogDescription className="text-[14px] text-[#525252] dark:text-[#A1A1A6] mt-2">
              {confirmModal.description}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmModal(p => ({ ...p, open: false }))}
              className="flex-1 h-11 bg-[#F4F4F5] dark:bg-[#232325] hover:bg-[#E4E4E7] dark:hover:bg-[#2C2C2E] text-[#171717] dark:text-[#EDEDED] font-semibold text-xs rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmModal.onConfirm}
              className="flex-1 h-11 bg-[#DC2626] dark:bg-[#E5484D] hover:opacity-90 text-white font-semibold text-xs rounded-xl transition-opacity"
            >
              {confirmModal.confirmText}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
