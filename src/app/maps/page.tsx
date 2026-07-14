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
  ShieldCheck
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
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
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
        alert("Could not access your location. Please check your browser permissions.");
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
    <div className="min-h-screen bg-[#FDFDFD] selection:bg-[#FB432C] selection:text-white flex flex-col font-sans">
      <SiteHeader />
      
      <main className="flex-1 pt-32 pb-16">
        <div className="max-w-[1280px] mx-auto px-6">
          
          {/* Header block */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-2.5 px-4 h-8 rounded-full bg-black/5 border border-black/5 mb-4">
                <Compass className="w-4 h-4 text-black animate-spin-slow" />
                <span className="text-[10px] font-bold text-black uppercase tracking-[0.2em] leading-none">Interactive Finder</span>
              </div>
              <h2 className="text-[36px] md:text-[46px] font-extrabold tracking-tighter text-black leading-none">
                XeroxQ Network Map
              </h2>
            </div>
            
            <button
              onClick={handleLocateUser}
              disabled={isLocating}
              className="inline-flex items-center justify-center gap-2 h-12 px-6 bg-black hover:bg-black/90 text-white rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer shadow-lg hover:shadow-black/10 transition-all active:scale-[0.98] disabled:opacity-50 shrink-0"
            >
              <Navigation className={cn("w-4 h-4", isLocating && "animate-pulse")} />
              {isLocating ? "Locating..." : "Find Nodes Near Me"}
            </button>
          </div>

          {/* Search bar */}
          <div className="relative group max-w-xl mb-10">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-[#FB432C] transition-colors" />
            <input 
              type="text" 
              placeholder="Search active print nodes by shop name or location..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-12 pr-6 bg-white border border-gray-200 rounded-2xl text-[14px] font-bold text-black placeholder:text-gray-400 focus:border-[#FB432C]/30 focus:ring-4 focus:ring-[#FB432C]/10 transition-all outline-none shadow-sm" 
            />
          </div>

          {/* Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Sidebar List */}
            <div className="lg:col-span-1 flex flex-col max-h-[600px] overflow-y-auto pr-2 space-y-4">
              <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-1">
                Active Nodes ({filteredShops.length})
              </h3>
              
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="p-5 border border-black/5 bg-white rounded-2xl space-y-3">
                    <Skeleton className="w-10 h-10 rounded-xl" />
                    <Skeleton className="w-2/3 h-5" />
                    <Skeleton className="w-full h-4" />
                  </div>
                ))
              ) : filteredShops.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-gray-200 bg-gray-50/50 rounded-2xl">
                  <p className="text-sm font-bold text-gray-500 mb-2">No active map nodes found</p>
                  <p className="text-xs text-gray-400">Try searching for other keywords or clear the search.</p>
                </div>
              ) : (
                filteredShops.map((node) => (
                  <div
                    key={node.id}
                    onClick={() => handleFocusShop(node)}
                    className="p-5 border border-black/5 bg-white rounded-[20px] transition-all hover:shadow-[0_12px_24px_rgba(0,0,0,0.04)] hover:border-black/10 group cursor-pointer text-left flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white group-hover:bg-[#FB432C] transition-colors duration-300">
                          <Printer className="h-5 w-5" />
                        </div>
                        <div className="px-2.5 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-full flex items-center gap-1.5">
                          <span className={cn("w-1.5 h-1.5 rounded-full", node.is_open ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
                          <span className="text-[8px] font-black text-black uppercase tracking-widest">
                            {node.is_open ? "Open" : "Closed"}
                          </span>
                        </div>
                      </div>
                      
                      <h4 className="text-lg font-black tracking-tight uppercase group-hover:text-[#FB432C] transition-colors duration-300 mb-1">
                        {node.name}
                      </h4>
                      <p className="text-xs font-semibold text-gray-400 italic mb-4 flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400" />
                        {node.shop_location || "Verified print node location"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-2 pt-4 border-t border-gray-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/${node.slug}`);
                        }}
                        className="flex-1 h-10 bg-black text-white hover:bg-black/90 font-bold text-[11px] rounded-xl transition-all uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" /> Direct Print
                      </button>
                      <button
                        onClick={() => handleFocusShop(node)}
                        className="px-3 h-10 border border-gray-200 text-black hover:bg-gray-50 rounded-xl transition-all text-[11px] font-bold uppercase tracking-wider flex items-center justify-center shrink-0 cursor-pointer"
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
