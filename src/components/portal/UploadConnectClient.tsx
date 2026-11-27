"use client";

import { motion } from "framer-motion";
import { ArrowRight, History, MapPin, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { loadHistory, loadPreferences, type StoredBatch } from "@/lib/customer-storage";
import { formatDisplayUrl, getPublicOrigin } from "@/lib/site-url";
import { finalizeSlugInput, normalizeSlugTyping } from "@/lib/shop-slug";
import cn from "@/lib/utils";

const SPRING = { type: "spring" as const, stiffness: 380, damping: 30 };

export function UploadConnectClient() {
  const router = useRouter();
  const [slugInput, setSlugInput] = useState("");
  const [originDisplay, setOriginDisplay] = useState("yourdomain.com");
  const [error, setError] = useState<string | null>(null);
  const [recentShops, setRecentShops] = useState<{ slug: string; name: string }[]>([]);

  useEffect(() => {
    setOriginDisplay(formatDisplayUrl(getPublicOrigin()));
    const prefs = loadPreferences();
    if (prefs.lastShopSlug) {
      setSlugInput(prefs.lastShopSlug);
    }
    const batches: StoredBatch[] = loadHistory();
    const seen = new Set<string>();
    const unique: { slug: string; name: string }[] = [];
    for (const b of batches) {
      if (b.shopSlug && !seen.has(b.shopSlug) && b.shopSlug !== "legacy") {
        seen.add(b.shopSlug);
        unique.push({ slug: b.shopSlug, name: b.shopName });
        if (unique.length >= 3) break;
      }
    }
    setRecentShops(unique);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = finalizeSlugInput(slugInput);
    if (!cleaned || cleaned.length < 2) {
      setError("Please enter a valid shop name or short link (min 2 letters).");
      return;
    }
    setError(null);
    router.push(`/${cleaned}`);
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={SPRING}
        className="w-full max-w-md rounded-[28px] bg-white border border-black/[0.06] shadow-[0_12px_40px_rgba(0,0,0,0.06)] p-7 sm:p-9"
      >
        {/* Real XeroxQ App Icon */}
        <div className="w-14 h-14 rounded-[18px] bg-white border border-black/[0.07] shadow-[0_4px_14px_rgba(0,0,0,0.07)] flex items-center justify-center mx-auto mb-5 p-2.5">
          <img
            src="/logo_color.png"
            alt="XeroxQ"
            className="w-full h-full object-contain"
          />
        </div>

        <div className="text-center mb-7">
          <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight mb-1.5">
            Connect to Print Shop
          </h1>
          <p className="text-sm text-[#6B7280] leading-relaxed">
            Enter your print shop&apos;s short link to upload documents and get a
            pickup code right away.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div
            className={cn(
              "flex items-center rounded-[16px] h-[52px] overflow-hidden",
              "bg-[#F7F7FA] border transition-all duration-150",
              error
                ? "border-red-400 shadow-[0_0_0_3px_rgba(239,68,68,0.10)]"
                : "border-black/[0.08] focus-within:bg-white focus-within:border-[#3568FF]/50 focus-within:shadow-[0_0_0_3px_rgba(53,104,255,0.10)]"
            )}
          >
            <span className="px-3 text-xs font-medium text-[#6B7280] whitespace-nowrap shrink-0 border-r border-black/[0.07] bg-black/[0.02] h-full flex items-center max-w-[160px] truncate">
              {originDisplay}/
            </span>
            <input
              type="text"
              value={slugInput}
              onChange={(e) => {
                setSlugInput(normalizeSlugTyping(e.target.value));
                if (error) setError(null);
              }}
              placeholder="shopname"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              className="flex-1 min-w-0 bg-transparent outline-none text-sm font-semibold text-[#111827] px-3 h-full placeholder:text-[#9CA3AF]"
            />
          </div>

          {error && (
            <p className="text-xs font-medium text-red-600 px-1">{error}</p>
          )}

          <motion.button
            type="submit"
            whileTap={{ scale: 0.98 }}
            className="w-full h-[52px] rounded-[16px] font-bold text-white text-sm flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(251,67,44,0.28)] transition-opacity hover:opacity-95"
            style={{
              background: "linear-gradient(135deg, #FB432C 0%, #FF591E 100%)",
            }}
          >
            Go to Shop
            <ArrowRight className="w-4 h-4" strokeWidth={2.4} />
          </motion.button>
        </form>

        {recentShops.length > 0 && (
          <div className="mt-6 pt-5 border-t border-black/[0.06]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] mb-2.5 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              Recent Shops
            </p>
            <div className="flex flex-wrap gap-2">
              {recentShops.map((rs) => (
                <Link
                  key={rs.slug}
                  href={`/${rs.slug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F2F2F7] hover:bg-[#E5E5EA] text-xs font-semibold text-[#111827] transition-colors"
                >
                  {rs.name}
                  <ArrowRight className="w-3 h-3 opacity-60" />
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 pt-5 border-t border-black/[0.06] flex items-center justify-between gap-2 text-xs text-[#6B7280]">
          <Link
            href="/shops"
            className="inline-flex items-center gap-1 font-semibold text-[#3568FF] hover:underline"
          >
            <MapPin className="w-3.5 h-3.5" />
            Find Nearby Shops
          </Link>
          <span className="inline-flex items-center gap-1 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#34C759]" />
            Deletes after 5m
          </span>
        </div>
      </motion.div>
    </div>
  );
}
