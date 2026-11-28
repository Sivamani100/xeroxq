"use client";

import { use, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  MessageSquare,
  ShieldCheck,
  Store,
  UploadCloud,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { generateToken, cn } from "@/lib/utils";
import { ThemeToggle } from "@/lib/theme";
import { generateWhatsAppLink } from "@/lib/whatsapp";

interface Shop {
  id: string;
  name: string;
  slug: string;
  is_open?: boolean;
  is_active?: boolean;
  contact_number?: string;
}

const SPRING = { type: "spring" as const, stiffness: 380, damping: 30 };

export default function FastPairPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchShop() {
      const { data, error } = await supabase
        .from("shops")
        .select("id, name, slug, is_open, is_active, contact_number")
        .eq("slug", slug)
        .single();

      if (!error && data && data.is_active !== false) {
        setShop(data as Shop);
      }
      setLoading(false);
    }
    fetchShop();
  }, [slug]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAFAFA] dark:bg-[#111113] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 rounded-full border-2 border-[#FB432C] border-t-transparent animate-spin" />
          <p className="text-xs text-[#737373] dark:text-[#85858B] font-semibold">
            Connecting to shop…
          </p>
        </div>
      </main>
    );
  }

  if (!shop) {
    return (
      <main className="min-h-screen bg-[#FAFAFA] dark:bg-[#111113] text-[#171717] dark:text-[#EDEDED] flex items-center justify-center p-6 relative">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <ThemeToggle compact />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING}
          className="bg-white dark:bg-[#19191B] p-8 border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-[20px] max-w-sm w-full flex flex-col items-center text-center"
        >
          <div className="w-14 h-14 bg-[#DC2626]/10 dark:bg-[#E5484D]/15 rounded-2xl flex items-center justify-center mb-5 border border-[#DC2626]/20 dark:border-[#E5484D]/25">
            <Store className="w-7 h-7 text-[#DC2626] dark:text-[#E5484D]" />
          </div>
          <h1 className="text-xl font-semibold text-[#171717] dark:text-[#EDEDED] tracking-tight mb-2">
            Shop Unavailable
          </h1>
          <p className="text-sm text-[#525252] dark:text-[#A1A1A6] mb-7 leading-relaxed">
            This shop does not exist or is currently inactive.
          </p>
          <Link
            href="/upload"
            className="w-full h-12 rounded-xl bg-[#FB432C] hover:bg-[#E03923] font-semibold text-sm text-white flex items-center justify-center gap-2 transition-colors"
          >
            Find Another Shop
          </Link>
        </motion.div>
      </main>
    );
  }

  const isOpen = shop.is_open !== false;
  const whatsappUrl = generateWhatsAppLink(shop.slug, shop.contact_number);

  return (
    <main className="min-h-screen bg-[#FAFAFA] dark:bg-[#111113] text-[#171717] dark:text-[#EDEDED] flex items-center justify-center p-4 sm:p-6 relative">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle compact />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={SPRING}
        className="bg-white dark:bg-[#19191B] p-7 sm:p-9 border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-[20px] max-w-[420px] w-full flex flex-col items-center text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-[#F4F4F5] dark:bg-[#232325] border border-[#171717]/[0.08] dark:border-white/[0.08] flex items-center justify-center mb-5 p-3">
          <img
            src="/logo_color.png"
            alt="XeroxQ"
            className="w-full h-full object-contain"
          />
        </div>

        <h1 className="text-2xl font-semibold text-[#171717] dark:text-[#EDEDED] tracking-tight mb-1.5">
          {shop.name}
        </h1>

        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-6",
            isOpen
              ? "bg-[#16A34A]/10 dark:bg-[#4CC38A]/15 text-[#16A34A] dark:text-[#4CC38A]"
              : "bg-[#DC2626]/10 dark:bg-[#E5484D]/15 text-[#DC2626] dark:text-[#E5484D]"
          )}
        >
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              isOpen ? "bg-[#16A34A] dark:bg-[#4CC38A]" : "bg-[#DC2626] dark:bg-[#E5484D]"
            )}
          />
          {isOpen ? "Open for Printing" : "Currently Closed"}
        </span>

        <div className="w-full space-y-2.5 mb-6 text-left">
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#F4F4F5] dark:bg-[#232325] border border-[#171717]/[0.06] dark:border-white/[0.08]">
            <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#19191B] flex items-center justify-center shrink-0">
              <UploadCloud className="w-4 h-4 text-[#FB432C]" />
            </div>
            <div>
              <div className="font-semibold text-[#171717] dark:text-[#EDEDED] text-sm">
                Quick Upload
              </div>
              <p className="text-[#525252] dark:text-[#A1A1A6] text-xs">
                Send PDFs, Word docs or photos and get your pickup number right away.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#F4F4F5] dark:bg-[#232325] border border-[#171717]/[0.06] dark:border-white/[0.08]">
            <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#19191B] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-[#16A34A] dark:text-[#4CC38A]" />
            </div>
            <div>
              <div className="font-semibold text-[#171717] dark:text-[#EDEDED] text-sm">
                Private by Default
              </div>
              <p className="text-[#525252] dark:text-[#A1A1A6] text-xs">
                Files are automatically deleted after 5 minutes for your safety.
              </p>
            </div>
          </div>
        </div>

        <div className="w-full space-y-2.5">
          <Link
            href={`/${shop.slug}`}
            className={cn(
              "w-full h-12 rounded-xl bg-[#FB432C] hover:bg-[#E03923] font-semibold text-white text-sm flex items-center justify-center gap-2 transition-colors",
              !isOpen && "opacity-70"
            )}
          >
            <UploadCloud className="w-4 h-4" strokeWidth={2} />
            {isOpen ? "Upload Files Now" : "View Shop Portal"}
            <ArrowRight className="w-4 h-4" />
          </Link>

          {whatsappUrl && isOpen && (
            <a
              href={whatsappUrl}
              className="w-full h-11 rounded-xl bg-[#F4F4F5] dark:bg-[#232325] hover:bg-[#E4E4E7] dark:hover:bg-[#2C2C2E] text-[#171717] dark:text-[#EDEDED] font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-[#16A34A] dark:text-[#4CC38A]" />
              Send via WhatsApp Instead
            </a>
          )}
        </div>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-[#737373] dark:text-[#85858B] font-medium border-t border-[#171717]/[0.08] dark:border-white/[0.08] w-full pt-4">
          <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A] dark:text-[#4CC38A]" />
          Official XeroxQ Shop Portal
        </div>
      </motion.div>
    </main>
  );
}
