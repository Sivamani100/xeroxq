"use client";

import { motion } from "framer-motion";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { 
  Printer, 
  MapPin, 
  Search, 
  Navigation,
  Compass,
  ArrowRight,
  ShieldCheck,
  X
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

// Dynamically import the Leaflet map component to prevent SSR evaluation errors
const AllShopsMap = dynamic(
  () => import("@/components/maps/AllShopsMap"),
  { ssr: false }
);

interface Shop {
  id: string;
  name: string;
  slug: string;
  shop_location?: string;
  shop_lat?: number;
  shop_lng?: number;
  is_open?: boolean;
}

export default function MapsPage() {
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Map positioning state
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 16.5062, // Default to Vijayawada/Andhra Pradesh region center
    lng: 80.6480
  });
  const [mapZoom, setMapZoom] = useState(8);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchShops() {
      try {
        const { data, error } = await supabase
          .from('shops')
          .select('id, name, slug, shop_location, shop_lat, shop_lng, is_open')
          .order('name');
        
        if (data) {
          // Filter to shops that have coordinates
          const validShops = data.filter(s => s.shop_lat && s.shop_lng);
          setShops(validShops);
          
          // If we have valid shops, set center to the first one
          if (validShops.length > 0 && validShops[0].shop_lat && validShops[0].shop_lng) {
            setMapCenter({
              lat: Number(validShops[0].shop_lat),
              lng: Number(validShops[0].shop_lng)
            });
            setMapZoom(13);
          }
        }
      } catch (err) {
        console.error("Failed to fetch shops:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchShops();
  }, []);

  const handleLocateUser = () => {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMapCenter({ lat: latitude, lng: longitude });
        setMapZoom(14);
        setIsLocating(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        setLocationError("Could not access your location. Please check your browser permissions.");
        setIsLocating(false);
      }
    );
  };

  const handleFocusShop = (shop: Shop) => {
    if (shop.shop_lat && shop.shop_lng) {
      setMapCenter({
        lat: Number(shop.shop_lat),
        lng: Number(shop.shop_lng)
      });
      setMapZoom(16);

      // Scroll smoothly to map container on mobile
      const mapElem = document.getElementById("shops-leaflet-map");
      if (mapElem) {
        mapElem.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const filteredShops = shops.filter(shop =>
    shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (shop.shop_location?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#111113] text-[#171717] dark:text-[#EDEDED] selection:bg-[#FB432C] selection:text-white flex flex-col font-sans">
      <SiteHeader />

      <main className="flex-1 pt-28 pb-16">
        <div className="max-w-[1280px] mx-auto px-6">

          {/* Header block */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 h-7 rounded-full bg-[#F4F4F5] dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] mb-3">
                <Compass className="w-3.5 h-3.5 text-[#FB432C]" />
                <span className="text-[11px] font-semibold text-[#525252] dark:text-[#A1A1A6]">Interactive Finder</span>
              </div>
              <h1 className="text-[32px] md:text-[42px] font-semibold tracking-tight text-[#171717] dark:text-[#EDEDED] leading-tight">
                XeroxQ Network Map
              </h1>
            </div>

            <button
              onClick={handleLocateUser}
              disabled={isLocating}
              className="inline-flex items-center justify-center gap-2 h-11 px-5 bg-[#FB432C] hover:bg-[#E03923] text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50 shrink-0"
            >
              <Navigation className="w-4 h-4" />
              {isLocating ? "Locating..." : "Find Nodes Near Me"}
            </button>
          </div>

          {locationError && (
            <div className="mb-6 rounded-xl border border-[#DC2626]/20 dark:border-[#E5484D]/25 bg-[#DC2626]/10 dark:bg-[#E5484D]/15 px-4 py-2.5 text-xs font-medium text-[#DC2626] dark:text-[#E5484D]">
              {locationError}
            </div>
          )}

          {/* Search bar */}
          <div className="relative group max-w-xl mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373] dark:text-[#85858B] group-focus-within:text-[#FB432C] transition-colors" />
            <input
              type="text"
              placeholder="Search active print nodes by shop name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-11 pr-10 bg-white dark:bg-[#19191B] border border-[#171717]/[0.10] dark:border-white/[0.10] rounded-xl text-[14px] font-medium text-[#171717] dark:text-[#EDEDED] placeholder:text-[#737373] dark:placeholder:text-[#85858B] focus:border-[#FB432C] transition-colors outline-none"
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

          {/* Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Sidebar List */}
            <div className="lg:col-span-1 flex flex-col max-h-[600px] overflow-y-auto pr-1 space-y-3">
              <h2 className="text-[11px] font-semibold text-[#737373] dark:text-[#85858B] uppercase tracking-wider mb-1 pl-1">
                Active Nodes ({filteredShops.length})
              </h2>

              {loading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="p-5 border border-[#171717]/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#19191B] rounded-2xl space-y-3">
                    <Skeleton className="w-10 h-10 rounded-xl" />
                    <Skeleton className="w-2/3 h-5" />
                    <Skeleton className="w-full h-4" />
                  </div>
                ))
              ) : filteredShops.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-[#171717]/[0.12] dark:border-white/[0.12] bg-white dark:bg-[#19191B] rounded-2xl">
                  <p className="text-sm font-semibold text-[#525252] dark:text-[#A1A1A6] mb-1.5">No active map nodes found</p>
                  <p className="text-xs text-[#737373] dark:text-[#85858B]">Try searching for other keywords or clear the search.</p>
                </div>
              ) : (
                filteredShops.map((node) => (
                  <div
                    key={node.id}
                    onClick={() => handleFocusShop(node)}
                    className="p-5 border border-[#171717]/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#19191B] rounded-[16px] transition-colors hover:border-[#FB432C]/40 group cursor-pointer text-left flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F4F4F5] dark:bg-[#232325] text-[#171717] dark:text-[#EDEDED] group-hover:bg-[#FB432C] group-hover:text-white transition-colors">
                          <Printer className="h-5 w-5" />
                        </div>
                        <div className="px-2.5 py-1 bg-[#F4F4F5] dark:bg-[#232325] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-full flex items-center gap-1.5">
                          <span className={cn("w-1.5 h-1.5 rounded-full", node.is_open ? "bg-[#16A34A] dark:bg-[#4CC38A]" : "bg-[#DC2626] dark:bg-[#E5484D]")} />
                          <span className="text-[10px] font-semibold text-[#171717] dark:text-[#EDEDED]">
                            {node.is_open ? "Open" : "Closed"}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-base font-semibold tracking-tight text-[#171717] dark:text-[#EDEDED] group-hover:text-[#FB432C] transition-colors mb-1">
                        {node.name}
                      </h3>
                      <p className="text-xs text-[#525252] dark:text-[#A1A1A6] mb-4 flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#737373] dark:text-[#85858B]" />
                        {node.shop_location || "Verified print node location"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-2 pt-3 border-t border-[#171717]/[0.08] dark:border-white/[0.08]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/${node.slug}`);
                        }}
                        className="flex-1 h-9 bg-[#FB432C] hover:bg-[#E03923] text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" /> Direct Print
                      </button>
                      <button
                        onClick={() => handleFocusShop(node)}
                        className="px-3 h-9 border border-[#171717]/[0.10] dark:border-white/[0.10] bg-[#F4F4F5] dark:bg-[#232325] text-[#171717] dark:text-[#EDEDED] hover:bg-[#E4E4E7] dark:hover:bg-[#2C2C2E] rounded-xl transition-colors text-xs font-semibold flex items-center justify-center shrink-0 cursor-pointer"
                        title="Locate on Map"
                      >
                        Show <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Map Container */}
            <div id="shops-leaflet-map" className="lg:col-span-2 relative z-0">
              {loading ? (
                <Skeleton className="w-full h-[500px] rounded-2xl" />
              ) : (
                <AllShopsMap
                  shops={filteredShops}
                  centerLat={mapCenter.lat}
                  centerLng={mapCenter.lng}
                  zoom={mapZoom}
                  height="500px"
                />
              )}
            </div>
          </div>

        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
