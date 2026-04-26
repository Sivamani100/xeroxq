"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { CONFIG } from "@/lib/config";
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
  Printer
} from "lucide-react";

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
type TabType = "overview" | "shops" | "billing" | "leads" | "content" | "hr" | "security" | "partners" | "settings";

const PLATFORM_FEE_PER_FILE = CONFIG.BILLING.PLATFORM_FEE_PER_FILE;

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

  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey]         = useState<SortKey>("totalJobs");
  const [sortDir, setSortDir]         = useState<SortDir>("desc");
  const [activeTab, setActiveTab]     = useState<TabType>("overview");
  
  const [selectedShop, setSelectedShop]   = useState<ShopStats | null>(null);
  const [actionShopId, setActionShopId]   = useState<string | null>(null);

  const [isAddingBlog, setIsAddingBlog]   = useState(false);
  const [isAddingNews, setIsAddingNews]   = useState(false);
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

  // ── Auth check ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const ceoEmailEnv = process.env.NEXT_PUBLIC_CEO_EMAIL;

      if (!user) {
        router.replace("/login?redirect=/platform-admin");
        return;
      }

      if (ceoEmailEnv && user.email !== ceoEmailEnv) {
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

      setSubmissions(data.submissions || []);
      setNewsletter(data.newsletter || []);
      setBlogs(data.blogs || []);
      setPartners(data.partners || []);
      setCareers(data.careers || []);
      setNews(data.news || []);
      setSecurity(data.security || []);
      setSettings(data.settings || []);

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
    if (isAuthorized) fetchData();
  }, [isAuthorized, fetchData]);

  const handleAction = async (table: string, id: string, action: 'delete' | 'approve' | 'toggle') => {
    let title = "System Confirmation";
    let desc = `Are you sure you want to perform ${action} on this record?`;
    let confirmText = "Yes, Proceed";
    
    // Determine specific action for API
    let apiAction = action as string;
    if (table === 'platform_settings' && id === 'maintenance_mode') apiAction = 'toggle_maintenance';

    if (table === 'platform_settings' && id === 'maintenance_mode') {
      const isCurrentlyActive = !!settings.find(s => s.key === id)?.value;
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
          alert("Action failed. Check console for details.");
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  // ── Sorting & filtering ─────────────────────────────────────────────────────
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const filteredShops = (platform?.shops || [])
    .filter((s: any) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.slug.toLowerCase().includes(searchQuery.toLowerCase())
    )
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
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white border border-[#E2E8F0] shadow-sm rounded-[5.57px] p-12 text-center max-w-md mx-4"
        >
          <div className="w-20 h-20 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-black mb-3 tracking-tight">Access Denied</h1>
          <p className="text-auth-slate-50 text-sm mb-6">
            This area is restricted to authorized XeroxQ executives only.<br />
            You are signed in as <span className="text-black font-bold">{ceoEmail}</span>
          </p>
          <button
            onClick={() => router.replace("/")}
            className="px-6 py-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-[5.57px] font-bold transition-all"
          >
            Return to Home
          </button>
        </motion.div>
      </div>
    );
  }

  if (!authChecked || (isAuthorized && loading)) {
    return (
       <div className="min-h-screen bg-[#F8FAFC]">
          {/* Skeleton Header */}
          <div className="w-full bg-white border-b border-[#E2E8F0] h-[81px]">
             <div className="max-w-[1440px] mx-auto px-6 py-4 lg:px-[82px] flex items-center justify-between h-full">
                <div className="flex items-center gap-3">
                   <div className="w-[40px] h-[40px] rounded-[5.57px] bg-[#E2E8F0] animate-pulse" />
                   <div className="flex flex-col gap-2">
                      <div className="w-[140px] h-[20px] bg-[#E2E8F0] animate-pulse rounded" />
                      <div className="w-[90px] h-[12px] bg-[#E2E8F0] animate-pulse rounded" />
                   </div>
                </div>
             </div>
          </div>
          
          <div className="flex flex-col items-center justify-center h-[calc(100vh-81px)] gap-4">
             <div className="w-12 h-12 rounded-[5.57px] bg-black flex items-center justify-center">
                 <Loader2 className="w-6 h-6 text-white animate-spin" />
             </div>
             <p className="text-sm font-bold text-auth-slate-50 uppercase tracking-widest">Loading Command Center...</p>
             {/* Content Tab Modals */}
        <Dialog open={isAddingBlog} onOpenChange={setIsAddingBlog}>
          <DialogContent className="sm:max-w-[600px] bg-white rounded-3xl p-8 border-none shadow-2xl">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Publish New Article</DialogTitle>
              <DialogDescription className="text-[13px] font-medium text-gray-500 italic">
                Draft a new thought leadership piece for the XeroxQ blog.
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
                alert("Publish failed.");
              }
            }} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-black">Article Title</Label>
                  <Input name="title" required placeholder="The Future of Printing..." className="h-12 bg-gray-50 border-gray-100 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-black">Category</Label>
                  <select name="category" className="w-full h-12 bg-gray-50 border-gray-100 rounded-xl px-4 text-sm outline-none" required>
                    <option value="Network">Network</option>
                    <option value="Security">Security</option>
                    <option value="Innovation">Innovation</option>
                    <option value="Culture">Culture</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-black">Excerpt (Short Summary)</Label>
                <Input name="excerpt" required placeholder="A brief hook for the reader..." className="h-12 bg-gray-50 border-gray-100 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-black">Full Article Content (Markdown)</Label>
                <Textarea name="content" required placeholder="Write your masterpiece here..." className="min-h-[200px] bg-gray-50 border-gray-100 rounded-xl" />
              </div>
              <button 
                type="submit" 
                className="w-full h-14 bg-black hover:bg-[#FB432C] text-white font-black text-[12px] uppercase tracking-widest rounded-xl shadow-lg transition-all"
              >
                Publish Live
              </button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isAddingNews} onOpenChange={setIsAddingNews}>
          <DialogContent className="sm:max-w-[500px] bg-white rounded-3xl p-8 border-none shadow-2xl">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Push Platform Update</DialogTitle>
              <DialogDescription className="text-[13px] font-medium text-gray-500 italic">
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
                alert("News push failed.");
              }
            }} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-black">Headline</Label>
                <Input name="title" required placeholder="System Maintenance..." className="h-12 bg-gray-50 border-gray-100 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-black">Category</Label>
                <select name="category" className="w-full h-12 bg-gray-50 border-gray-100 rounded-xl px-4 text-sm outline-none" required>
                  <option value="Update">Update</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Alert">Alert</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-black">Brief Content</Label>
                <Textarea name="content" required placeholder="What's happening?" className="min-h-[100px] bg-gray-50 border-gray-100 rounded-xl" />
              </div>
              <button 
                type="submit" 
                className="w-full h-14 bg-black hover:bg-blue-600 text-white font-black text-[12px] uppercase tracking-widest rounded-xl shadow-lg transition-all"
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
    <div className="min-h-screen bg-[#F8FAFC] text-black">
      {/* TOP HEADER - IDENTITY, ACTIONS */}
      <div className="shrink-0 relative w-full bg-white border-b border-[#E2E8F0] z-30">
         <div className="max-w-[1440px] mx-auto px-4 py-[22px] lg:py-6 lg:px-[82px]">
            <div className="flex items-center justify-between gap-3">
               {/* Left: logo + shop name */}
               <div className="flex items-center gap-2 lg:gap-4 shrink-0">
                 <div className="w-8 h-8 lg:w-9 lg:h-9 bg-black rounded-lg lg:rounded-[5.57px] flex items-center justify-center shrink-0 shadow-md shadow-black/20">
                   <Crown className="text-white w-4 h-4" />
                 </div>
                 <div className="flex flex-col">
                   <h1 className="text-[16px] lg:text-[18px] font-bold text-black leading-none tracking-tight whitespace-nowrap">CEO Portal</h1>
                   <p className="text-[9px] lg:text-[10px] font-bold text-[#7E8B9E] tracking-[0.12em] uppercase leading-none mt-1.5">Master Command Center</p>
                 </div>
               </div>

               {/* Right: action buttons */}
               <div className="flex items-center gap-2 shrink-0">
                  <span className="hidden sm:block text-[11px] font-bold text-auth-slate-50 mr-2">{ceoEmail}</span>
                  
                  <button
                    onClick={() => { setRefreshing(true); fetchData(); }}
                    disabled={refreshing}
                    className="h-8 w-8 lg:h-[36px] lg:w-[36px] border border-[#E2E8F0] bg-white text-black hover:bg-[#F8FAFC] transition-colors rounded-lg lg:rounded-[5.57px] flex items-center justify-center shadow-sm"
                    title="Refresh Data"
                  >
                    <RefreshCw className={`w-4 h-4 lg:w-[14px] lg:h-[14px] text-auth-slate-50 ${refreshing ? "animate-spin" : ""}`} />
                  </button>

                  {/* Separator */}
                  <div className="h-6 w-[1px] bg-[#E2E8F0] mx-0.5" />

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="h-8 w-8 lg:h-[36px] lg:w-auto lg:px-2 flex items-center justify-center lg:gap-2 rounded-lg lg:rounded-[5.57px] text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors font-bold text-[12px]"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4 lg:w-[14px] lg:h-[14px]" />
                    <span className="hidden lg:inline">Logout</span>
                  </button>
               </div>
            </div>
         </div>
      </div>

      <main className="max-w-[1440px] mx-auto px-6 py-6 lg:px-[82px] space-y-6">

        {/* TABS */}
        <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-0 overflow-x-auto no-scrollbar">
          {([
            { id: "overview", label: "Overview", icon: LayoutDashboard },
            { id: "shops", label: "Shops", icon: Store },
            { id: "leads", label: "Leads", icon: UserPlus },
            { id: "partners", label: "Partners", icon: Users },
            { id: "hr", label: "HR", icon: Briefcase },
            { id: "content", label: "Content", icon: FileEdit },
            { id: "security", label: "Security", icon: ShieldAlert },
            { id: "billing", label: "Billing", icon: IndianRupee },
            { id: "settings", label: "Settings", icon: Settings },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-4 py-2.5 text-[14px] font-bold capitalize tracking-tight transition-all border-b-2 -mb-px flex items-center gap-2 ${
                activeTab === tab.id
                  ? "text-black border-black"
                  : "text-[#7E8B9E] border-transparent hover:text-black"
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
                bg: "bg-blue-50",
                color: "text-blue-600",
                border: "border-blue-100",
              },
              {
                label: "Active Shops",
                value: platform.activeShops.toString(),
                sub: `${platform.totalShops - platform.activeShops} offline`,
                icon: Activity,
                bg: "bg-emerald-50",
                color: "text-emerald-600",
                border: "border-emerald-100",
              },
              {
                label: "Total Files",
                value: platform.totalFiles.toLocaleString("en-IN"),
                sub: "All time uploads",
                icon: FileText,
                bg: "bg-orange-50",
                color: "text-orange-600",
                border: "border-orange-100",
              },
              {
                label: "Platform Revenue",
                value: fmt(platform.totalPlatformRevenue),
                sub: "@ ₹0.50 / file",
                icon: IndianRupee,
                bg: "bg-purple-50",
                color: "text-purple-600",
                border: "border-purple-100",
              },
              {
                label: "Dues Pending",
                value: fmt(platform.pendingDues),
                sub: "To be collected",
                icon: AlertTriangle,
                bg: "bg-red-50",
                color: "text-red-600",
                border: "border-red-100",
              },
            ].map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-white border border-[#E2E8F0] shadow-sm rounded-[5.57px] p-5 flex flex-col gap-3`}
              >
                <div className={`w-10 h-10 rounded-[5.57px] ${card.bg} border ${card.border} flex items-center justify-center`}>
                   <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <div>
                   <p className="text-[24px] font-black tracking-tight text-black leading-none mb-1">{card.value}</p>
                   <p className="text-[12px] font-bold text-auth-slate-90 tracking-tight">{card.label}</p>
                   <p className="text-[10px] font-medium text-auth-slate-50 tracking-wides mt-0.5">{card.sub}</p>
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
              <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-gray-50/50">
                  <h3 className="text-[13px] font-black uppercase tracking-widest flex items-center gap-2">
                    <UserPlus className="w-4 h-4" /> Shop Registrations
                  </h3>
                  <span className="text-[10px] font-bold bg-black text-white px-2 py-0.5 rounded-full">{submissions.length}</span>
                </div>
                <div className="divide-y divide-[#E2E8F0]">
                  {submissions.map((sub) => (
                    <div key={sub.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-[14px] font-bold text-black">{sub.shop_name}</p>
                          <p className="text-[12px] font-medium text-gray-500">{sub.owner_email}</p>
                        </div>
                        <button onClick={() => handleAction('contact_submissions', sub.id, 'delete')} className="text-red-400 hover:text-red-600 transition-colors">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-600 bg-gray-100 p-2 rounded-lg italic mt-2">"{sub.message}"</p>
                      <p className="text-[9px] text-gray-400 mt-2 font-bold uppercase">{new Date(sub.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Newsletter */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-gray-50/50">
                  <h3 className="text-[13px] font-black uppercase tracking-widest flex items-center gap-2">
                    <AtSign className="w-4 h-4" /> Newsletter Subs
                  </h3>
                  <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">{newsletter.length}</span>
                </div>
                <div className="divide-y divide-[#E2E8F0] max-h-[500px] overflow-y-auto">
                  {newsletter.map((sub) => (
                    <div key={sub.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <p className="text-[13px] font-bold text-black">{sub.email}</p>
                      <div className="flex items-center gap-4">
                        <span className="text-[9px] text-gray-400 font-bold uppercase">{new Date(sub.created_at).toLocaleDateString()}</span>
                        <button onClick={() => handleAction('newsletter_subs', sub.id, 'delete')} className="text-red-400 hover:text-red-600">
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
                <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
                   <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-gray-50/50">
                      <h3 className="text-[13px] font-black uppercase tracking-widest flex items-center gap-2">
                         <FileEdit className="w-4 h-4" /> Blog Articles
                      </h3>
                      <button onClick={() => setIsAddingBlog(true)} className="text-[10px] font-black bg-black text-white px-3 py-1 rounded-lg uppercase tracking-tighter hover:bg-[#FB432C] transition-all">New Post</button>
                   </div>
                   <div className="divide-y divide-[#E2E8F0]">
                      {blogs.map(blog => (
                        <div key={blog.id} className="p-5 hover:bg-gray-50 group transition-all">
                           <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1">
                                 <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{blog.category}</span>
                                 <h4 className="text-[14px] font-black text-black leading-tight">{blog.title}</h4>
                                 <p className="text-[11px] text-gray-500 line-clamp-2">{blog.excerpt}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                 <button className="p-2 hover:bg-blue-50 text-blue-500 rounded-lg transition-all"><Eye className="w-4 h-4" /></button>
                                 <button onClick={() => handleAction('blogs', blog.id, 'delete')} className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-all"><XCircle className="w-4 h-4" /></button>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                {/* News Management */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
                   <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-gray-50/50">
                      <h3 className="text-[13px] font-black uppercase tracking-widest flex items-center gap-2">
                         <GlobeIcon className="w-4 h-4" /> Platform News
                      </h3>
                      <button onClick={() => setIsAddingNews(true)} className="text-[10px] font-black bg-black text-white px-3 py-1 rounded-lg uppercase tracking-tighter hover:bg-blue-600 transition-all">Push Update</button>
                   </div>
                   <div className="divide-y divide-[#E2E8F0]">
                      {news.map(item => (
                        <div key={item.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-all">
                           <div className="space-y-0.5">
                              <p className="text-[13px] font-black text-black">{item.title}</p>
                              <div className="flex items-center gap-3">
                                 <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{new Date(item.published_at).toLocaleDateString()}</span>
                                 <span className="w-1 h-1 rounded-full bg-gray-300" />
                                 <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{item.category}</span>
                              </div>
                           </div>
                           <button onClick={() => handleAction('platform_news', item.id, 'delete')} className="text-red-400 hover:text-red-600 transition-colors">
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
           <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between">
                 <div>
                    <h3 className="text-[16px] font-black uppercase tracking-tighter flex items-center gap-2">
                       <Briefcase className="w-5 h-5" /> Talent Acquisition
                    </h3>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Reviewing candidates for the XeroxQ mesh</p>
                 </div>
                 <div className="bg-black text-white px-4 py-1.5 rounded-full text-[12px] font-black">
                    {careers.length} ACTIVE APPLICATIONS
                 </div>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-gray-50 border-b border-[#E2E8F0]">
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Candidate</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Contact</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Position</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500">LinkedIn / Portfolio</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                       {careers.map(app => (
                          <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                             <td className="p-4">
                                <p className="text-[14px] font-black text-black">{app.full_name}</p>
                                <p className="text-[11px] text-gray-500 italic">"Applied {new Date(app.created_at).toLocaleDateString()}"</p>
                             </td>
                             <td className="p-4">
                                <p className="text-[13px] font-bold text-black">{app.email}</p>
                                <p className="text-[12px] text-gray-400">{app.whatsapp}</p>
                             </td>
                             <td className="p-4">
                                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100">
                                   {app.position || "Developer"}
                                </span>
                             </td>
                             <td className="p-4">
                                <a href={app.linkedin_url} target="_blank" className="text-blue-500 hover:underline flex items-center gap-1.5 text-[12px] font-bold">
                                   <ExternalLink className="w-3 h-3" /> Profile
                                </a>
                             </td>
                             <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                   <button className="h-8 px-4 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-600 transition-all">Confirm</button>
                                   <button onClick={() => handleAction('job_applications', app.id, 'delete')} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"><XCircle className="w-4 h-4" /></button>
                                </div>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {/* ── PARTNERS TAB ───────────────────────────────────────────────────── */}
        {activeTab === "partners" && (
           <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm min-h-[400px] flex flex-col">
              <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between bg-gray-50/50">
                 <h3 className="text-[16px] font-black uppercase tracking-tighter flex items-center gap-2">
                    <Users className="w-5 h-5" /> Partnership Ecosystem
                 </h3>
                 <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-100">
                    {partners.filter(p => p.status === 'pending').length} PENDING REVIEW
                 </span>
              </div>
              
              {partners.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-gray-50/30">
                  <div className="w-16 h-16 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center mb-4 mx-auto">
                    <Users className="w-8 h-8 text-gray-300" />
                  </div>
                  <h4 className="text-[14px] font-black text-black uppercase tracking-tight">No Partnership Applications</h4>
                  <p className="text-[11px] font-medium text-gray-400 mt-1 uppercase tracking-widest text-center">When developers or owners apply, they will appear here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 divide-x divide-y divide-[#E2E8F0]">
                   {partners.map(p => (
                      <div key={p.id} className="p-6 space-y-4 hover:bg-gray-50 transition-all relative group">
                         <div className="flex justify-between items-start">
                            <div className={cn("px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-[0.2em]", p.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600')}>
                               {p.status || 'pending'}
                            </div>
                            <button onClick={() => handleAction('partners', p.id, 'delete')} className="text-red-400 hover:text-red-600 transition-colors">
                               <XCircle className="w-4 h-4" />
                            </button>
                         </div>
                         <div className="space-y-1">
                            <h4 className="text-[16px] font-black text-black leading-none">{p.name}</h4>
                            <p className="text-[12px] font-bold text-gray-500 flex items-center gap-1.5"><AtSign className="w-3 h-3" /> {p.email}</p>
                         </div>
                         <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <p className="text-[11px] text-gray-600 italic leading-relaxed line-clamp-3">"{p.bio || "No biography provided."}"</p>
                         </div>
                         {p.status === 'pending' && (
                            <button onClick={() => handleAction('partners', p.id, 'approve')} className="w-full h-10 bg-black text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-[#FB432C] transition-all">
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
              <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
                 <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between bg-red-50/30">
                    <h3 className="text-[16px] font-black uppercase tracking-tighter flex items-center gap-2 text-red-600">
                       <ShieldAlert className="w-5 h-5" /> Bug Bounty Registry
                    </h3>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                       <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Live Monitoring</span>
                    </div>
                 </div>
                 <div className="divide-y divide-[#E2E8F0]">
                    {security.map(report => (
                       <div key={report.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-gray-50 transition-all">
                          <div className="space-y-3 max-w-2xl">
                             <div className="flex items-center gap-3">
                                <span className={cn("px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest", report.severity === 'critical' ? 'bg-red-600 text-white' : report.severity === 'high' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600')}>
                                   {report.severity}
                                </span>
                                <h4 className="text-[15px] font-black text-black uppercase tracking-tighter">{report.vulnerability_type} Disclosed</h4>
                             </div>
                             <p className="text-[12px] text-gray-500 leading-relaxed font-medium italic">"{report.description}"</p>
                             <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                <span className="flex items-center gap-1.5"><AtSign className="w-3 h-3" /> {report.reporter_email}</span>
                                <span>•</span>
                                <span>{new Date(report.created_at).toLocaleString()}</span>
                             </div>
                          </div>
                          <div className="flex items-center gap-2">
                             <button className="h-10 px-6 bg-black text-white text-[11px] font-black uppercase tracking-widest rounded-xl">Review PoC</button>
                             <button onClick={() => handleAction('security_reports', report.id, 'delete')} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"><XCircle className="w-4 h-4" /></button>
                          </div>
                       </div>
                    ))}
                    {security.length === 0 && (
                      <div className="p-12 text-center text-gray-400 font-bold italic uppercase tracking-widest">No vulnerabilities reported yet. Secure Mesh is intact.</div>
                    )}
                 </div>
              </div>
           </div>
        )}

        {/* ── SETTINGS TAB ───────────────────────────────────────────────────── */}
        {activeTab === "settings" && (
           <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
                 <div className="p-6 border-b border-[#E2E8F0]">
                    <h3 className="text-[16px] font-black uppercase tracking-tighter flex items-center gap-2">
                       <Settings className="w-5 h-5" /> Global Platform Settings
                    </h3>
                 </div>
                 <div className="divide-y divide-[#E2E8F0]">
                    <div className="p-8 flex items-center justify-between hover:bg-gray-50 transition-all group">
                       <div className="space-y-1">
                          <div className="flex items-center gap-2">
                             <div className={cn("w-2 h-2 rounded-full", !!settings.find(s => s.key === 'maintenance_mode')?.value ? "bg-red-500 animate-pulse" : "bg-emerald-500")} />
                             <p className="text-[14px] font-black text-black uppercase tracking-tighter">Global Maintenance Protocol</p>
                          </div>
                          <p className="text-[11px] font-medium text-gray-500 italic">When active, all customer routes are locked. Only Admin Portal remains live.</p>
                       </div>
                       
                       <div className="flex items-center gap-4">
                          <span className={cn("text-[10px] font-black uppercase tracking-[0.2em]", !!settings.find(s => s.key === 'maintenance_mode')?.value ? "text-red-600" : "text-gray-400")}>
                             { !!settings.find(s => s.key === 'maintenance_mode')?.value ? "LOCKDOWN ACTIVE" : "SYSTEM LIVE" }
                          </span>
                          
                          {/* Custom Toggle Switch */}
                          <button 
                            onClick={() => handleAction('platform_settings', 'maintenance_mode', 'toggle')}
                            className={cn(
                               "w-16 h-8 rounded-full relative transition-all duration-300 shadow-inner",
                               !!settings.find(s => s.key === 'maintenance_mode')?.value ? "bg-red-600" : "bg-gray-200"
                            )}
                          >
                             <motion.div 
                               animate={{ x: !!settings.find(s => s.key === 'maintenance_mode')?.value ? 32 : 4 }}
                               className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center"
                             >
                                <div className={cn("w-1.5 h-1.5 rounded-full", !!settings.find(s => s.key === 'maintenance_mode')?.value ? "bg-red-500" : "bg-gray-300")} />
                             </motion.div>
                          </button>
                       </div>
                    </div>
                    
                    <div className="p-6 flex items-center justify-between">
                       <div className="space-y-1">
                          <p className="text-[14px] font-black text-black uppercase tracking-tighter">Platform Fee (@ ₹0.50)</p>
                          <p className="text-[11px] font-medium text-gray-500 italic">Adjust the global transaction fee for each physicalized file.</p>
                       </div>
                       <div className="flex items-center gap-3">
                          <Input className="w-24 h-10 text-right font-black" defaultValue="0.50" />
                          <button className="h-10 px-4 bg-black text-white text-[11px] font-black uppercase tracking-widest rounded-xl">Update</button>
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
              <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-[5.57px] p-6">
                <h2 className="font-bold text-black text-[16px] mb-6 flex items-center gap-2 tracking-tight">
                  <TrendingUp className="w-5 h-5 text-[#FF591E]" />
                  Top Shops by Volume
                </h2>
                <div className="space-y-4">
                  {[...(platform?.shops || [])].sort((a, b) => b.totalJobs - a.totalJobs).slice(0, 6).map((shop, i) => (
                    <div key={shop.id} className="group">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-black uppercase tracking-tight text-black truncate max-w-[120px]">{shop.name}</span>
                        <span className="text-[11px] font-black text-black">{shop.totalJobs} <span className="text-[9px] text-[#7E8B9E] font-bold">Files</span></span>
                      </div>
                      <div className="h-1 bg-gray-50 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${platform?.shops[0]?.totalJobs ? (shop.totalJobs / platform.shops[0].totalJobs) * 100 : 0}%` }}
                          className="h-full bg-black group-hover:bg-[#FB432C] transition-colors"
                        />
                      </div>
                    </div>
                  ))}
                  {(platform?.shops || []).length === 0 && (
                    <p className="text-[#7E8B9E] text-sm text-center py-8">No shops registered yet.</p>
                  )}
                </div>
              </div>

              {/* Shop status summary */}
              <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-[5.57px] p-6">
                <h2 className="font-bold text-black text-[16px] mb-6 flex items-center gap-2 tracking-tight">
                  <Users className="w-5 h-5 text-blue-500" />
                  Network Health
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-100 rounded-[5.57px]">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[13px] font-bold text-green-800">Online Shops</span>
                    </div>
                    <span className="text-[18px] font-black text-green-700">{platform?.activeShops}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 border border-[#E2E8F0] rounded-[5.57px]">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-slate-400" />
                      <span className="text-[13px] font-bold text-slate-700">Offline Shops</span>
                    </div>
                    <span className="text-[18px] font-black text-slate-600">{(platform?.totalShops ?? 0) - (platform?.activeShops ?? 0)}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-[5.57px]">
                    <div className="flex items-center gap-3">
                      <Zap className="w-[14px] h-[14px] text-blue-600" />
                      <span className="text-[13px] font-bold text-blue-800">Avg. Files / Shop</span>
                    </div>
                    <p className="text-[14px] font-black text-black leading-none mb-1">
                      {platform?.shops?.length ? Math.round((platform?.totalFiles ?? 0) / platform.shops.length) : 0}
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-purple-50 border border-purple-100 rounded-[5.57px]">
                    <div className="flex items-center gap-3">
                      <IndianRupee className="w-[14px] h-[14px] text-purple-600" />
                      <span className="text-[13px] font-bold text-purple-800">Avg. Due / Shop</span>
                    </div>
                    <p className="text-[14px] font-black text-black leading-none mb-1">
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
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative w-full lg:w-[320px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-auth-slate-50" />
                  <input
                    type="text"
                    placeholder="Search shops by name or slug..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="auth-input w-full h-[36px] bg-white pl-9 text-[12px]"
                  />
                </div>
                <p className="text-[11px] font-bold text-auth-slate-50 uppercase tracking-widest">
                  {filteredShops.length} of {platform?.shops?.length || 0} shops
                </p>
              </div>

              {/* Table — horizontally scrollable on small screens */}
              <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-[5.57px] overflow-hidden">
                <div className="overflow-x-auto">
                  {/* Header */}
                  <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_110px] gap-4 px-6 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC] min-w-[700px] w-full">
                    {[
                      { key: "name" as SortKey, label: "Shop" },
                      { key: "totalJobs" as SortKey, label: "Total Files" },
                      { key: "created_at" as SortKey, label: "Joined" },
                      { key: null, label: "Pending" },
                      { key: null, label: "Status" },
                      { key: null, label: "Actions" },
                    ].map((col) => (
                      <button
                        key={col.label}
                        onClick={() => col.key && toggleSort(col.key)}
                        className={`text-left text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${col.key ? "text-[#7E8B9E] hover:text-black transition-colors" : "text-[#7E8B9E] cursor-default"}`}
                      >
                        {col.label}
                        {col.key && sortKey === col.key && (
                          sortDir === "asc" ? <ChevronUp className="w-3 h-3 text-black" /> : <ChevronDown className="w-3 h-3 text-black" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Rows — vertical scroll when many shops */}
                  <div className="divide-y divide-[#E2E8F0] max-h-[520px] overflow-y-auto min-w-[700px] w-full">
                    {filteredShops.map((shop, i) => (
                      <motion.div
                        key={shop.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: Math.min(i * 0.03, 0.3) }}
                        className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_110px] gap-4 px-6 py-[14px] hover:bg-[#F8FAFC] transition-colors items-center"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-[14px] text-black tracking-tight truncate">{shop.name}</p>
                          <a
                            href={`/${shop.slug}`}
                            target="_blank"
                            className="text-[11px] font-bold text-auth-slate-50 hover:text-[#FF591E] transition-colors flex items-center gap-1 mt-0.5"
                          >
                            /{shop.slug}
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        </div>

                        <div>
                          <p className="font-black text-[18px] text-black">{shop.totalJobs}</p>
                          <p className="text-[9px] font-bold text-auth-slate-50 uppercase tracking-wider">all uploads</p>
                        </div>

                        <div>
                          <p className="text-[12px] text-auth-slate-90 font-bold">
                            {new Date(shop.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                          </p>
                        </div>

                        <div>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-[4px] uppercase tracking-wider ${shop.pendingJobs > 0 ? "bg-orange-50 text-orange-600 border border-orange-100" : "bg-slate-50 text-slate-500 border border-slate-200"}`}>
                            {shop.pendingJobs} live
                          </span>
                        </div>

                        <div>
                           <div className={cn(
                              "inline-flex items-center gap-1.5 px-2 py-1 rounded-[4px] border",
                              shop.is_open
                                ? "bg-green-50 border-green-100"
                                : "bg-slate-50 border-slate-200"
                           )}>
                              <div className={cn("w-1.5 h-1.5 rounded-full", shop.is_open ? "bg-green-500 animate-pulse" : "bg-slate-400")} />
                              <span className={cn("text-[10px] font-bold uppercase tracking-wider", shop.is_open ? "text-green-700" : "text-slate-600")}>
                                {shop.is_open ? "Open" : "Closed"}
                              </span>
                           </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* View Details — indigo accent on hover */}
                          <motion.button
                            onClick={() => setSelectedShop(shop)}
                            whileHover={{ scale: 1.12, y: -2, boxShadow: "0 4px 12px rgba(99,102,241,0.18)" }}
                            whileTap={{ scale: 0.90 }}
                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                            className="h-[34px] w-[34px] rounded-[9px] bg-white hover:bg-indigo-50 border border-[#E2E8F0] hover:border-indigo-200 flex items-center justify-center shadow-sm group transition-colors"
                            title="View Shop Details"
                          >
                            <Eye className="w-[15px] h-[15px] text-[#94A3B8] group-hover:text-indigo-500 transition-colors duration-150" />
                          </motion.button>

                          {/* Open / Close Toggle — green when open (hover shows red), gray when closed (hover shows green) */}
                          <motion.button
                            onClick={() => handleToggleShop(shop)}
                            disabled={actionShopId === shop.id}
                            whileHover={actionShopId !== shop.id ? {
                              scale: 1.12,
                              y: -2,
                              boxShadow: shop.is_open
                                ? "0 4px 12px rgba(239,68,68,0.2)"
                                : "0 4px 12px rgba(34,197,94,0.2)",
                            } : {}}
                            whileTap={actionShopId !== shop.id ? { scale: 0.90 } : {}}
                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                            className={`h-[34px] w-[34px] rounded-[9px] flex items-center justify-center shadow-sm transition-colors border disabled:opacity-40 disabled:cursor-not-allowed group ${
                              shop.is_open
                                ? "bg-emerald-50 border-emerald-200 hover:bg-red-50 hover:border-red-200"
                                : "bg-slate-50 border-slate-200 hover:bg-emerald-50 hover:border-emerald-200"
                            }`}
                            title={shop.is_open ? "Close this shop" : "Open this shop"}
                          >
                            {actionShopId === shop.id ? (
                              <Loader2 className="w-[15px] h-[15px] text-slate-400 animate-spin" />
                            ) : shop.is_open ? (
                              <ToggleRight className="w-[20px] h-[20px] text-emerald-500 group-hover:text-red-400 transition-colors duration-150" />
                            ) : (
                              <ToggleLeft className="w-[20px] h-[20px] text-slate-400 group-hover:text-emerald-500 transition-colors duration-150" />
                            )}
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}

                    {filteredShops.length === 0 && (
                      <div className="py-16 text-center text-[#7E8B9E] text-[13px] font-bold min-w-[700px] w-full">
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
              <div className="bg-purple-50 border border-purple-100 rounded-[5.57px] p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="w-12 h-12 rounded-[5.57px] bg-white border border-purple-100 flex items-center justify-center shrink-0 shadow-sm">
                  <Printer className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-black text-[16px] tracking-tight">Per-Print Ledger Model</h3>
                  <p className="text-auth-slate-90 text-[13px] mt-1 leading-relaxed max-w-3xl">
                    XeroxQ charges a platform fee of <strong className="text-purple-700">₹0.50 per file</strong> pushed through the network. This is calculated using an immutable counter that permanently counts every uploaded file, even if it is later deleted, ensuring full revenue synchronization.
                  </p>
                </div>
              </div>

              {/* Billing table — horizontally + vertically scrollable */}
              <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-[5.57px] overflow-hidden">
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-[2fr_1fr_1.5fr_0.8fr_1.2fr] gap-4 px-6 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC] min-w-[650px] w-full">
                    {["Shop", "Total Uploads", "Est. Shop Revenue", "Status", "Platform Fee Due"].map((h) => (
                      <span key={h} className="text-[10px] font-bold uppercase tracking-widest text-[#7E8B9E]">{h}</span>
                    ))}
                  </div>

                  <div className="divide-y divide-[#E2E8F0] max-h-[520px] overflow-y-auto min-w-[650px] w-full">
                    {[...(platform?.shops || [])].sort((a, b) => b.platformFee - a.platformFee).map((shop, i) => (
                      <motion.div
                        key={shop.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: Math.min(i * 0.03, 0.3) }}
                        className="grid grid-cols-[2fr_1fr_1.5fr_0.8fr_1.2fr] gap-4 px-6 py-[14px] items-center hover:bg-[#F8FAFC] transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-[14px] text-black tracking-tight truncate">{shop.name}</p>
                          <p className="text-[11px] font-bold text-auth-slate-50">/{shop.slug}</p>
                        </div>
                        <div>
                          <p className="font-black text-[18px] text-black">{shop.totalJobs}</p>
                          <p className="text-[9px] font-bold text-auth-slate-50 uppercase tracking-wider">all statuses</p>
                        </div>
                        <p className="font-black text-[14px] text-green-600">{fmt(shop.revenueGenerated)}</p>
                        <div>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-[4px] uppercase tracking-wider ${
                            shop.feeStatus === "due"
                              ? "bg-red-50 text-red-600 border border-red-100"
                              : "bg-green-50 text-green-600 border border-green-100"
                          }`}>
                            {shop.feeStatus}
                          </span>
                        </div>
                        <p className="font-black text-[18px] text-[#FF591E]">{fmt(shop.platformFee)}</p>
                      </motion.div>
                    ))}

                    {(platform?.shops || []).length === 0 && (
                      <div className="py-16 text-center text-[#7E8B9E] text-[13px] font-bold">
                        No shop data available.
                      </div>
                    )}
                  </div>

                  {/* Totals row — pinned outside scroll area */}
                  <div className="grid grid-cols-[2fr_1fr_1.5fr_0.8fr_1.2fr] gap-4 px-6 py-[18px] border-t-2 border-[#E2E8F0] bg-slate-50 min-w-[650px] w-full">
                    <span className="text-[14px] font-black tracking-tight text-black uppercase">Platform Total</span>
                    <span className="text-[18px] font-black text-black">{platform?.totalFiles.toLocaleString("en-IN") ?? "0"}</span>
                    <span className="text-[15px] font-black text-green-700">
                      {platform?.shops?.length ? fmt(platform.shops.reduce((s, sh) => s + sh.revenueGenerated, 0)) : "₹0.00"}
                    </span>
                    <span />
                    <span className="text-[20px] font-black text-[#FF591E]">{fmt(platform?.totalPlatformRevenue ?? 0)}</span>
                  </div>
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
              className="bg-white border border-[#E2E8F0] rounded-[16px] p-8 max-w-lg w-full shadow-2xl"
            >
              <div className="flex items-start justify-between mb-6 border-b border-[#E2E8F0] pb-4">
                <div>
                  <h2 className="text-[20px] font-black tracking-tight text-black">{selectedShop.name}</h2>
                  <a href={`/${selectedShop.slug}`} target="_blank" className="text-[12px] font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 mt-1">
                    xeroxq.arkio.in/{selectedShop.slug}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <button onClick={() => setSelectedShop(null)} className="w-[36px] h-[36px] rounded-[5.57px] bg-white border border-[#E2E8F0] text-black hover:bg-[#F8FAFC] flex items-center justify-center shadow-sm">
                  <XCircle className="w-[18px] h-[18px]" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { label: "Lifetime Files", value: selectedShop.totalJobs.toString(), color: "text-black" },
                  { label: "Live Queue", value: selectedShop.pendingJobs.toString(), color: "text-orange-600" },
                  { label: "Platform Fee", value: fmt(selectedShop.platformFee), color: "text-[#FF591E]" },
                  { label: "Est. Shop Revenue", value: fmt(selectedShop.revenueGenerated), color: "text-green-600" },
                  { label: "UPI ID", value: selectedShop.upi_id ?? "Not Linked", color: "text-auth-slate-90" },
                  { label: "Current Status", value: selectedShop.is_open ? "OPEN" : "CLOSED", color: selectedShop.is_open ? "text-green-600" : "text-slate-500" },
                ].map((item) => (
                  <div key={item.label} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[5.57px] p-4 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#7E8B9E] mb-1.5">{item.label}</p>
                    <p className={`text-[18px] font-black ${item.color} truncate leading-none`}>{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { handleToggleShop(selectedShop); setSelectedShop(null); }}
                  className={`flex-1 h-[40px] rounded-[5.57px] text-[12px] font-bold border transition-all flex items-center justify-center gap-2 shadow-sm ${
                    selectedShop.is_open
                      ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                      : "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                  }`}
                >
                  {selectedShop.is_open ? <><Ban className="w-4 h-4" /> Close Shop Down</> : <><CheckCircle2 className="w-4 h-4" /> Reopen Shop</>}
                </button>
                <a
                  href={`/${selectedShop.slug}`}
                  target="_blank"
                  className="flex-1 h-[40px] rounded-[5.57px] text-[12px] font-bold bg-white border border-[#E2E8F0] text-black hover:bg-[#F8FAFC] transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <ExternalLink className="w-4 h-4" /> Go to Shop
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* ── CUSTOM CONFIRMATION MODAL ─────────────────────────────────────────── */}
      <Dialog open={confirmModal.open} onOpenChange={(o) => setConfirmModal(p => ({ ...p, open: o }))}>
        <DialogContent className="sm:max-w-[400px] bg-white rounded-3xl p-8 border-none shadow-2xl">
          <DialogHeader className="mb-6">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <DialogTitle className="text-xl font-black uppercase tracking-tighter text-black">{confirmModal.title}</DialogTitle>
            <DialogDescription className="text-[14px] font-medium text-gray-500 italic mt-2">
              {confirmModal.description}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <button 
              onClick={() => setConfirmModal(p => ({ ...p, open: false }))}
              className="flex-1 h-12 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black text-[11px] uppercase tracking-widest rounded-xl transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={confirmModal.onConfirm}
              className="flex-1 h-12 bg-black hover:bg-red-600 text-white font-black text-[11px] uppercase tracking-widest rounded-xl shadow-lg transition-all"
            >
              {confirmModal.confirmText}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
