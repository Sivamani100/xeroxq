"use client";

import { motion } from "framer-motion";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { 
  Printer, 
  MapPin, 
  Search, 
  ShieldCheck,
  ArrowRight
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
  address: string;
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
    (shop.address?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FDFDFD] selection:bg-[#FB432C] selection:text-white flex flex-col font-sans">
      <SiteHeader />
      
      <main className="flex-1 pt-32 pb-0">
        {/* Shops Hero - Styled identically to the landing page */}
        <section className="relative pt-12 pb-16 text-center overflow-hidden">
          {/* Subtle background element */}
          <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 0)', backgroundSize: '40px 40px' }} />
          
          <div className="max-w-[1280px] mx-auto px-6 relative z-10">
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
              }}
              initial="hidden"
              animate="visible"
              className="mx-auto mb-16 max-w-2xl text-center"
            >
              {/* Landing Page style badge */}
              <div className="inline-flex items-center gap-2.5 px-4 h-8 rounded-full bg-black/5 border border-black/5 mb-8 mx-auto">
                <div className="w-2 h-2 rounded-full bg-black animate-pulse" />
                <span className="text-[10px] font-bold text-black uppercase tracking-[0.2em] leading-none">Global Network</span>
              </div>
              
              <h2 className="text-[40px] md:text-[54px] font-extrabold tracking-tighter text-black leading-none mb-6">
                Find A XeroxQ Partner Shop
              </h2>
              <p className="text-lg font-medium text-gray-500 leading-relaxed italic max-w-2xl mx-auto mb-12">
                Search our verified network of print nodes across Andhra Pradesh. Print securely without ever saving the shop owner's number.
              </p>

              {/* Premium Pill Search Bar */}
              <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.8, delay: 0.3 }}
                 className="relative group mx-auto max-w-xl"
              >
                 <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-[#FB432C] transition-colors" />
                 <input 
                    type="text" 
                    placeholder="Search by shop name, city, or zip code..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-16 pl-14 pr-6 bg-white border border-gray-200 rounded-full text-[15px] font-bold text-black placeholder:text-gray-400 focus:border-[#FB432C]/30 focus:ring-4 focus:ring-[#FB432C]/10 transition-all shadow-lg shadow-black/5 outline-none" 
                 />
              </motion.div>
            </motion.div>

            {/* Global Shop Grid */}
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3 mb-24">
               {loading ? (
                  [...Array(6)].map((_, i) => (
                     <div key={i} className="relative rounded-2xl border bg-white p-6 lg:p-8 space-y-4">
                        <Skeleton className="w-14 h-14 rounded-2xl mb-6" />
                        <Skeleton className="w-3/4 h-6 mb-3" />
                        <Skeleton className="w-full h-12" />
                     </div>
                  ))
               ) : (
                  filteredShops.map((node, i) => (
                     <motion.div
                        key={node.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ delay: i * 0.1, duration: 0.8, type: 'spring', bounce: 0.3 }}
                        onClick={() => router.push(`/${node.slug}`)}
                        className={cn(
                          "relative flex flex-col justify-between overflow-hidden rounded-[32px] border border-black/5 bg-white transition-all duration-500 ease-in-out group text-left cursor-pointer",
                          "hover:-translate-y-2 hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.12)] hover:border-black/10"
                        )}
                     >
                        <div className="absolute inset-0 bg-gradient-to-br from-[#FB432C]/0 via-transparent to-[#FB432C]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        
                        <div className="p-8 pb-6 flex-1 relative z-10">
                          <div className="flex justify-between items-start mb-10">
                            <div className="relative">
                               <div className="absolute inset-0 bg-[#FB432C] blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
                               <div className="relative flex h-16 w-16 items-center justify-center rounded-[20px] bg-black text-white shadow-xl shadow-black/20 group-hover:bg-[#FB432C] group-hover:-rotate-3 transition-all duration-500 border border-black/5">
                                 <Printer className="h-7 w-7" />
                               </div>
                            </div>
                            <div className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] shadow-sm rounded-full flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                              <span className="text-[10px] font-black text-black uppercase tracking-widest">Active Node</span>
                            </div>
                          </div>
                          
                          <h3 className="mb-3 text-2xl font-black tracking-tighter uppercase leading-none group-hover:text-[#FB432C] transition-colors duration-300 line-clamp-1">{node.name}</h3>
                          
                          <div className="flex items-start gap-2.5 text-[#64748B] mb-2">
                             <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-black/20 group-hover:text-[#FB432C]/60 transition-colors" />
                             <p className="text-sm font-medium leading-relaxed italic line-clamp-2">{node.address || "Verified XeroxQ Partner Location in Andhra Pradesh."}</p>
                          </div>
                        </div>
                        
                        <div className="relative z-10 p-5 mx-3 mb-3 bg-[#F8FAFC] group-hover:bg-black rounded-[24px] border border-black/5 flex items-center justify-between transition-colors duration-500 mt-2">
                           <div className="flex items-center gap-3">
                             <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white group-hover:bg-white/10 shadow-sm transition-colors duration-500 border border-black/5">
                               <ShieldCheck className="h-4 w-4 text-black group-hover:text-white transition-colors duration-500" />
                             </div>
                             <span className="text-[11px] font-black text-black uppercase tracking-[0.15em] group-hover:text-white transition-colors duration-500">Connect to Print</span>
                           </div>
                           <div className="w-10 h-10 rounded-full flex items-center justify-center">
                              <ArrowRight className="w-5 h-5 text-black group-hover:text-white group-hover:translate-x-1 transition-all duration-500" />
                           </div>
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
                  <div className="inline-flex items-center gap-2 px-6 py-4 bg-gray-50 border border-gray-200 rounded-full mb-6">
                    <Search className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-bold text-gray-600">No shops found for "{searchQuery}"</span>
                  </div>
                  <div>
                    <button 
                      onClick={() => setSearchQuery("")} 
                      className="text-sm font-bold text-[#FB432C] hover:text-black hover:underline transition-colors uppercase tracking-widest"
                    >
                      Reset Search
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
