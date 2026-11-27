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
import { generateWhatsAppLink } from "@/lib/whatsapp";
import cn from "@/lib/utils";

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
      <main className="min-h-screen bg-[#F2F2F7] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 rounded-full border-2 border-[#FB432C] border-t-transparent animate-spin" />
          <p className="text-xs text-[#6B7280] font-semibold">
            Connecting to shop…
          </p>
        </div>
      </main>
    );
  }

  if (!shop) {
    return (
      <main className="min-h-screen bg-[#F2F2F7] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING}
          className="bg-white p-8 border border-black/[0.06] shadow-[0_12px_36px_rgba(0,0,0,0.06)] rounded-[28px] max-w-sm w-full flex flex-col items-center text-center"
        >
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-5 border border-red-100">
            <Store className="w-7 h-7 text-red-500" />
          </div>
          <h1 className="text-xl font-extrabold text-[#111827] tracking-tight mb-2">
            Shop Unavailable
          </h1>
          <p className="text-sm text-[#6B7280] mb-7 leading-relaxed">
            This shop does not exist or is currently inactive.
          </p>
          <Link
            href="/upload"
            className="w-full h-12 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(251,67,44,0.28)]"
            style={{
              background: "linear-gradient(135deg, #FB432C 0%, #FF591E 100%)",
            }}
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
    <main className="min-h-screen bg-[#F2F2F7] flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={SPRING}
        className="bg-white p-7 sm:p-9 border border-black/[0.06] shadow-[0_12px_40px_rgba(0,0,0,0.06)] rounded-[28px] max-w-[420px] w-full flex flex-col items-center text-center"
      >
        <div className="w-16 h-16 rounded-[20px] bg-white border border-black/[0.07] shadow-[0_4px_14px_rgba(0,0,0,0.07)] flex items-center justify-center mb-5 p-3">
          <img
            src="/logo_color.png"
            alt="XeroxQ"
            className="w-full h-full object-contain"
          />
        </div>

        <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight mb-1.5">
          {shop.name}
        </h1>

        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-6",
            isOpen ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
          )}
        >
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              isOpen ? "bg-[#34C759]" : "bg-[#FF3B30]"
            )}
          />
          {isOpen ? "Open for Printing" : "Currently Closed"}
        </span>

        <div className="w-full space-y-2.5 mb-6 text-left">
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#F7F7FA] border border-black/[0.04]">
            <div className="w-9 h-9 rounded-xl bg-white shadow-2xs flex items-center justify-center shrink-0">
              <UploadCloud className="w-4 h-4 text-[#FB432C]" />
            </div>
            <div>
              <div className="font-semibold text-[#111827] text-sm">
                Quick Upload
              </div>
              <p className="text-[#6B7280] text-xs">
                Send PDFs, Word docs or photos and get your pickup number right away.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#F7F7FA] border border-black/[0.04]">
            <div className="w-9 h-9 rounded-xl bg-white shadow-2xs flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-[#34C759]" />
            </div>
            <div>
              <div className="font-semibold text-[#111827] text-sm">
                Private by Default
              </div>
              <p className="text-[#6B7280] text-xs">
                Files are automatically deleted after 5 minutes for your safety.
              </p>
            </div>
          </div>
        </div>

        <div className="w-full space-y-2.5">
          <Link
            href={`/${shop.slug}`}
            className={cn(
              "w-full h-13 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-opacity",
              isOpen
                ? "shadow-[0_6px_20px_rgba(251,67,44,0.28)] hover:opacity-95"
                : "opacity-60"
            )}
            style={{
              background: "linear-gradient(135deg, #FB432C 0%, #FF591E 100%)",
            }}
          >
            <UploadCloud className="w-4 h-4" strokeWidth={2.4} />
            {isOpen ? "Upload Files Now" : "View Shop Portal"}
            <ArrowRight className="w-4 h-4" />
          </Link>

          {whatsappUrl && isOpen && (
            <a
              href={whatsappUrl}
              className="w-full h-12 rounded-2xl bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#111827] font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-[#34C759]" />
              Send via WhatsApp Instead
            </a>
          )}
        </div>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-[#6B7280] font-medium border-t border-black/[0.06] w-full pt-4">
          <ShieldCheck className="w-3.5 h-3.5 text-[#34C759]" />
          Official XeroxQ Shop Portal
        </div>
      </motion.div>
    </main>
  );
}
