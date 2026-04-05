"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Printer, 
  X, 
  Search, 
  Globe, 
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";

interface Shop {
  id: string;
  name: string;
  slug: string;
  is_open: boolean;
  address?: string;
}

export function SiteHeader() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showShopList, setShowShopList] = useState(false);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (showShopList) {
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
    }
  }, [showShopList]);

  const filteredShops = shops.filter(shop => 
    shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (shop.address?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <motion.nav 
        initial={false}
        animate={{
          width: isScrolled ? "65%" : "85%",
          y: isScrolled ? 16 : 32,
          borderRadius: "9999px",
          paddingLeft: isScrolled ? "24px" : "36px",
          paddingRight: isScrolled ? "24px" : "36px",
          height: isScrolled ? "64px" : "80px",
          backgroundColor: isScrolled ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.6)",
        }}
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 35,
          mass: 1
        }}
        className={cn(
          "fixed left-1/2 -translate-x-1/2 z-[1000] border backdrop-blur-2xl transition-shadow flex items-center justify-center",
          isScrolled 
            ? "border-[#E2E8F0] shadow-[0_30px_60px_rgba(0,0,0,0.12)]" 
            : "border-white/40 shadow-xl"
        )}
        style={{ maxWidth: "1280px" }}
      >
        <div className="w-full flex items-center justify-between">
          <div 
            className="flex items-center group cursor-pointer" 
            onClick={() => router.push('/')}
          >
            <img 
              src="/xeroxqlogo.svg" 
              alt="XeroxQ" 
              className="h-8 md:h-10 w-auto transition-transform group-hover:scale-105"
            />
          </div>

          <div className="hidden lg:flex items-center gap-10">
             {[
               { name: "How it Works", href: "/how-it-works" },
               { name: "Enterprise", href: "/enterprise" },
               { name: "Community", href: "/community" },
               { name: "Blog", href: "/blog" }
             ].map((item) => (
              <button 
                key={item.name} 
                onClick={() => router.push(item.href)}
                className="text-[11px] font-bold text-[#64748B] hover:text-black uppercase tracking-[0.2em] transition-colors"
              >
                {item.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/login')}
              className="hidden sm:flex text-sm font-bold text-black border-b-2 border-transparent hover:border-black rounded-none h-auto px-0 pb-1 hover:bg-transparent"
            >
              Sign In
            </Button>
            <Button 
              onClick={() => setShowShopList(true)}
              className="bg-black hover:bg-black/90 text-white font-bold text-sm rounded-lg h-10 px-6 shadow-xl shadow-black/10 tracking-tight transition-all active:scale-95"
            >
              Find Shop
            </Button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {showShopList && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border border-white/20"
            >
              <div className="p-10">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-3xl font-bold text-black tracking-tight mb-2">Find a Shop</h3>
                    <p className="text-[#64748B] font-medium">Search our global print network.</p>
                  </div>
                  <button 
                    onClick={() => setShowShopList(false)}
                    className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-black hover:text-white transition-all rounded-xl group"
                  >
                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                  </button>
                </div>

                <div className="relative mb-8">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                  <input 
                    type="text" 
                    placeholder="Search by shop name or location..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#F1F5F9] border-2 border-transparent rounded-xl h-14 pl-14 pr-6 text-black font-bold placeholder:text-[#94A3B8] focus:bg-white focus:border-black/5 focus:outline-none transition-all shadow-sm"
                  />
                </div>

                <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="space-y-4">
                    {loading ? (
                      [...Array(3)].map((_, i) => (
                        <div key={i} className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-4">
                           <Skeleton className="w-full h-16 rounded-lg" />
                        </div>
                      ))
                    ) : (
                      filteredShops.map((node) => (
                        <div 
                          key={node.id}
                          className="group p-5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white hover:shadow-xl transition-all cursor-pointer"
                          onClick={() => {
                            router.push(`/${node.slug}`);
                            setShowShopList(false);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                              <div className="w-12 h-12 bg-white rounded-xl border border-[#E2E8F0] flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Printer className="w-5 h-5 text-black" />
                              </div>
                              <div>
                                <div className="font-bold text-black text-lg tracking-tight">{node.name}</div>
                                <div className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                   <Globe className="w-3 h-3" /> {node.address || "Worldwide Network"}
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-[#94A3B8] group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
