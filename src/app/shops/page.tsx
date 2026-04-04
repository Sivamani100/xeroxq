"use client";

import { motion } from "framer-motion";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { 
  Printer, 
  MapPin, 
  Globe, 
  Search, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Network
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

interface Shop {
  id: string;
  name: string;
  slug: string;
  address: string;
  is_open: boolean;
}

export default function Shops() {
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
    (shop.address?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white selection:bg-brand-primary selection:text-white">
      <SiteHeader />
      
      <main className="pt-32 pb-16">
        {/* Shops Hero */}
        <section className="relative pb-24 text-center">
          <div className="max-w-[1280px] mx-auto px-6 space-y-12 relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="inline-flex items-center gap-2 px-3 py-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded-md shadow-sm mb-6"
            >
              <Network className="w-3.5 h-3.5 text-black" />
              <span className="text-[10px] font-black tracking-[0.2em] text-black uppercase">Verified Node Inventory</span>
            </motion.div>
            
            <div className="space-y-6 max-w-4xl mx-auto">
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-[64px] lg:text-[100px] font-bold text-black tracking-tighter leading-[0.85] uppercase"
              >
                Find A Trusted <br /> Network Node.
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-2xl text-[#64748B] font-medium max-w-2xl mx-auto leading-relaxed"
              >
                Search our global decentralized print mesh. 10,000+ verified shops physicalizing documents securely.
              </motion.p>
            </div>

            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, delay: 0.3 }}
               className="max-w-xl mx-auto relative group"
            >
               <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] group-hover:text-black transition-colors" />
               <input 
                  type="text" 
                  placeholder="Search by shop name, city, or zip code..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-14 pl-12 pr-6 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold placeholder:text-[#94A3B8] focus:border-black/5 focus:shadow-xl transition-all shadow-sm outline-none" 
               />
            </motion.div>
          </div>
        </section>

        {/* Global Shop Grid */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="py-16 border-y border-[#E2E8F0] bg-[#F8FAFC]"
        >
           <div className="max-w-[1280px] mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {loading ? (
                    [...Array(8)].map((_, i) => (
                       <div key={i} className="p-6 bg-white rounded-xl border border-[#E2E8F0] space-y-4">
                          <Skeleton className="w-full h-32 rounded-lg" />
                       </div>
                    ))
                 ) : (
                    filteredShops.map((node, i) => (
                       <motion.div 
                        key={node.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="group bg-white p-6 rounded-xl border border-[#E2E8F0] hover:shadow-xl transition-all cursor-pointer text-left flex flex-col justify-between"
                        onClick={() => router.push(`/${node.slug}`)}
                       >
                         <div className="space-y-6">
                            <div className="flex items-center justify-between">
                               <div className="w-12 h-12 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <Printer className="w-6 h-6 text-black" />
                                </div>
                                <div className="flex flex-col items-end">
                                   <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-1.5">
                                      <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> ACTIVE
                                   </span>
                                </div>
                             </div>

                             <div className="space-y-2">
                                <h3 className="text-xl font-bold text-black tracking-tight group-hover:text-black transition-colors uppercase leading-none">{node.name}</h3>
                                <div className="flex items-start gap-1.5 text-[#64748B] font-medium">
                                   <MapPin className="w-3.5 h-3.5 shrink-0 text-[#94A3B8] mt-0.5" />
                                   <span className="text-[12px] leading-relaxed line-clamp-1 italic">"{node.address || "Global Network Node"}"</span>
                                </div>
                             </div>
                          </div>

                          <div className="pt-6 mt-6 border-t border-[#F1F5F9] flex items-center justify-between">
                             <div className="flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-black/20" />
                                <span className="text-[9px] font-black text-[#94A3B8] uppercase tracking-[0.2em]">MESH ACTIVE</span>
                             </div>
                             <button className="h-8 px-4 bg-black text-white rounded-lg font-black text-[9px] uppercase tracking-widest flex items-center gap-1.5 transition-all active:scale-95 group-hover:bg-black/90 whitespace-nowrap">
                                VIEW NODE
                             </button>
                          </div>
                       </motion.div>
                    ))
                 )}
              </div>
           </div>
        </motion.section>

        {/* Not Found Placeholder */}
        {!loading && filteredShops.length === 0 && (
           <div className="py-20 text-center space-y-6">
              <div className="w-16 h-16 bg-[#F8FAFC] rounded-2xl flex items-center justify-center mx-auto text-[#94A3B8] border border-[#E2E8F0]">
                 <Search className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                 <h2 className="text-2xl font-bold text-black tracking-tight uppercase">Registry Miss</h2>
                 <p className="text-[#64748B] font-medium text-sm uppercase tracking-tight">Try a different city or shop node identifier.</p>
              </div>
              <button onClick={() => setSearchQuery("")} className="h-11 px-8 bg-black text-white rounded-lg font-black text-[10px] uppercase tracking-widest transition-all">
                 Reset Global Search
              </button>
           </div>
        )}

      </main>

      <SiteFooter />
    </div>
  );
}
