"use client";

import { motion } from "framer-motion";
import { ArrowRight, History, MapPin, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { loadHistory, loadPreferences, type StoredBatch } from "@/lib/customer-storage";
import { formatDisplayUrl, getPublicOrigin } from "@/lib/site-url";
import { finalizeSlugInput, normalizeSlugTyping } from "@/lib/shop-slug";
import { ThemeToggle } from "@/lib/theme";
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
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#111113] text-[#171717] dark:text-[#EDEDED] flex flex-col items-center justify-center p-4 sm:p-6 relative">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle compact />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={SPRING}
        className="w-full max-w-md rounded-[20px] bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] shadow-[0_1px_2px_rgba(17,17,19,0.04)] p-7 sm:p-9"
      >
        {/* XeroxQ App Icon */}
        <div className="w-14 h-14 rounded-2xl bg-[#F4F4F5] dark:bg-[#232325] border border-[#171717]/[0.08] dark:border-white/[0.08] flex items-center justify-center mx-auto mb-5 p-2.5">
          <img
            src="/logo_color.png"
            alt="XeroxQ"
            className="w-full h-full object-contain"
          />
        </div>

        <div className="text-center mb-7">
          <h1 className="text-2xl font-semibold text-[#171717] dark:text-[#EDEDED] tracking-tight mb-1.5">
            Connect to Print Shop
          </h1>
          <p className="text-sm text-[#525252] dark:text-[#A1A1A6] leading-relaxed">
            Enter your print shop&apos;s short link to upload documents and get a
            pickup code right away.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div
            className={cn(
              "flex items-center rounded-[14px] h-[50px] overflow-hidden",
              "bg-[#F4F4F5] dark:bg-[#232325] border transition-colors duration-150",
              error
                ? "border-[#DC2626] dark:border-[#E5484D]"
                : "border-[#171717]/[0.10] dark:border-white/[0.10] focus-within:bg-white dark:focus-within:bg-[#19191B] focus-within:border-[#FB432C]"
            )}
          >
            <span className="px-3 text-xs font-medium text-[#737373] dark:text-[#85858B] whitespace-nowrap shrink-0 border-r border-[#171717]/[0.08] dark:border-white/[0.08] bg-[#171717]/[0.02] dark:bg-white/[0.03] h-full flex items-center max-w-[160px] truncate">
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
              className="flex-1 min-w-0 bg-transparent outline-none text-sm font-medium text-[#171717] dark:text-[#EDEDED] px-3 h-full placeholder:text-[#737373] dark:placeholder:text-[#85858B]"
            />
          </div>

          {error && (
            <p className="text-xs font-medium text-[#DC2626] dark:text-[#E5484D] px-1">{error}</p>
          )}

          <motion.button
            type="submit"
            whileTap={{ scale: 0.98 }}
            className="w-full h-[50px] rounded-[14px] bg-[#FB432C] hover:bg-[#E03923] font-semibold text-white text-sm flex items-center justify-center gap-2 transition-colors"
          >
            Go to Shop
            <ArrowRight className="w-4 h-4" strokeWidth={2} />
          </motion.button>
        </form>

        {recentShops.length > 0 && (
          <div className="mt-6 pt-5 border-t border-[#171717]/[0.08] dark:border-white/[0.08]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#737373] dark:text-[#85858B] mb-2.5 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              Recent Shops
            </p>
            <div className="flex flex-wrap gap-2">
              {recentShops.map((rs) => (
                <Link
                  key={rs.slug}
                  href={`/${rs.slug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F4F4F5] dark:bg-[#232325] hover:bg-[#E4E4E7] dark:hover:bg-[#2C2C2E] text-xs font-semibold text-[#171717] dark:text-[#EDEDED] transition-colors"
                >
                  {rs.name}
                  <ArrowRight className="w-3 h-3 opacity-60" />
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 pt-5 border-t border-[#171717]/[0.08] dark:border-white/[0.08] flex items-center justify-between gap-2 text-xs text-[#525252] dark:text-[#A1A1A6]">
          <Link
            href="/shops"
            className="inline-flex items-center gap-1 font-semibold text-[#FB432C] hover:underline"
          >
            <MapPin className="w-3.5 h-3.5" />
            Find Nearby Shops
          </Link>
          <span className="inline-flex items-center gap-1 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A] dark:text-[#4CC38A]" />
            Deletes after 5m
          </span>
        </div>
      </motion.div>
    </div>
  );
}
