"use client";

import { motion } from "framer-motion";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { 
  Printer, 
  MapPin, 
  Search, 
  ShieldCheck,
  ArrowRight,
  X
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Shop {
  id: string;
  name: string;
  slug: string;
  address?: string;
  shop_location?: string;
  is_open: boolean;
}

export default function ShopsPage() {
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchShops() {
      try {
        const { data } = await supabase
          .from('shops')
          .select('*')
          .order('name');
        if (data) setShops(data);
      } catch (err) {
        console.error("Failed to fetch shops:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchShops();
  }, []);

  const filteredShops = shops.filter(shop => 
    shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (shop.shop_location?.toLowerCase() || shop.address?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#111113] text-[#171717] dark:text-[#EDEDED] selection:bg-[#FB432C] selection:text-white flex flex-col font-sans">
      <SiteHeader />

      <main className="flex-1 pt-28 pb-0">
        <section className="relative pt-10 pb-16 text-center">
          <div className="max-w-[1280px] mx-auto px-6 relative z-10">
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.45 } }
              }}
              initial="hidden"
              animate="visible"
              className="mx-auto mb-12 max-w-2xl text-center"
            >
              <div className="inline-flex items-center gap-2 px-3.5 h-7 rounded-full bg-[#F4F4F5] dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] mb-6 mx-auto">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FB432C]" />
                <span className="text-[11px] font-semibold text-[#525252] dark:text-[#A1A1A6] tracking-wide">Global Network</span>
              </div>

              <h1 className="text-[36px] md:text-[48px] font-semibold tracking-tight text-[#171717] dark:text-[#EDEDED] leading-tight mb-4">
                Find a XeroxQ Partner Shop
              </h1>
              <p className="text-base font-normal text-[#525252] dark:text-[#A1A1A6] leading-relaxed max-w-xl mx-auto mb-8">
                Search our verified print shops across Andhra Pradesh. Print privately without saving phone numbers.
              </p>

              {/* Search Bar */}
              <div className="relative group mx-auto max-w-xl">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373] dark:text-[#85858B] group-focus-within:text-[#FB432C] transition-colors" />
                <input
                  type="text"
                  placeholder="Search by shop name, city, or zip code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 pl-12 pr-10 bg-white dark:bg-[#19191B] border border-[#171717]/[0.10] dark:border-white/[0.10] rounded-xl text-[14px] font-medium text-[#171717] dark:text-[#EDEDED] placeholder:text-[#737373] dark:placeholder:text-[#85858B] focus:border-[#FB432C] transition-colors outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-[#737373] dark:text-[#85858B] hover:text-[#171717] dark:hover:text-[#EDEDED] hover:bg-[#F4F4F5] dark:hover:bg-[#232325]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>

            {/* Global Shop Grid */}
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mb-20">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <div key={i} className="rounded-2xl border border-[#171717]/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#19191B] p-6 space-y-4">
                    <Skeleton className="w-12 h-12 rounded-xl mb-4" />
                    <Skeleton className="w-3/4 h-5 mb-2" />
                    <Skeleton className="w-full h-10" />
                  </div>
                ))
              ) : (
                filteredShops.map((node, i) => (
                  <motion.div
                    key={node.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ delay: i * 0.04, duration: 0.4 }}
                    onClick={() => router.push(`/${node.slug}`)}
                    className={cn(
                      "flex flex-col justify-between rounded-[20px] border border-[#171717]/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#19191B] transition-all duration-200 group text-left cursor-pointer",
                      "hover:-translate-y-1 hover:border-[#FB432C]/40"
                    )}
                  >
                    <div className="p-6 pb-5 flex-1">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F4F4F5] dark:bg-[#232325] text-[#171717] dark:text-[#EDEDED] group-hover:bg-[#FB432C] group-hover:text-white transition-colors">
                          <Printer className="h-5 w-5" />
                        </div>
                        <div className="px-2.5 py-1 bg-[#F4F4F5] dark:bg-[#232325] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-full flex items-center gap-1.5">
                          <span className={cn("w-2 h-2 rounded-full", node.is_open ? "bg-[#16A34A] dark:bg-[#4CC38A]" : "bg-[#DC2626] dark:bg-[#E5484D]")} />
                          <span className="text-[11px] font-semibold text-[#171717] dark:text-[#EDEDED]">
                            {node.is_open ? "Open" : "Closed"}
                          </span>
                        </div>
                      </div>

                      <h2 className="mb-2 text-lg font-semibold tracking-tight text-[#171717] dark:text-[#EDEDED] group-hover:text-[#FB432C] transition-colors line-clamp-1">
                        {node.name}
                      </h2>

                      <div className="flex items-start gap-2 text-[#525252] dark:text-[#A1A1A6]">
                        <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-[#737373] dark:text-[#85858B]" />
                        <p className="text-sm leading-relaxed line-clamp-2">
                          {node.shop_location || node.address || "Verified XeroxQ partner shop in Andhra Pradesh."}
                        </p>
                      </div>
                    </div>

                    <div className="px-4 py-3 mx-3 mb-3 bg-[#F4F4F5] dark:bg-[#232325] group-hover:bg-[#FB432C] rounded-xl flex items-center justify-between transition-colors">
                      <div className="flex items-center gap-2.5">
                        <ShieldCheck className="h-4 w-4 text-[#16A34A] dark:text-[#4CC38A] group-hover:text-white transition-colors" />
                        <span className="text-xs font-semibold text-[#171717] dark:text-[#EDEDED] group-hover:text-white transition-colors">
                          Connect to Print
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#525252] dark:text-[#A1A1A6] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Not Found Placeholder */}
            {!loading && filteredShops.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 text-center"
              >
                <div className="inline-flex items-center gap-2 px-5 py-3 bg-[#F4F4F5] dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-full mb-5">
                  <Search className="w-4 h-4 text-[#737373] dark:text-[#85858B]" />
                  <span className="text-sm font-medium text-[#525252] dark:text-[#A1A1A6]">
                    No shops found for &quot;{searchQuery}&quot;
                  </span>
                </div>
                <div>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-sm font-semibold text-[#FB432C] hover:underline transition-colors"
                  >
                    Reset search
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
