"use client";

import { use, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Printer, ArrowRight, ShieldCheck, Zap, Store } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { generateWhatsAppLink } from "@/lib/whatsapp";
import { SiteFooter } from "@/components/layout/site-footer";

interface Shop {
  id: string;
  name: string;
  slug: string;
  is_open?: boolean;
}

export default function FastPairPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchShop() {
      const { data, error } = await supabase
        .from("shops")
        .select("id, name, slug, is_open")
        .eq("slug", slug)
        .single();
      
      if (!error && data) {
        setShop(data);
      }
      setLoading(false);
    }
    fetchShop();
  }, [slug]);

  const handleConnect = () => {
    if (!shop) return;
    const link = generateWhatsAppLink(shop.slug);
    window.location.href = link;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex flex-col items-center">
        {/* Skeleton App Bar */}
        <div className="sticky top-0 z-50 w-full flex justify-center px-4 sm:px-6 py-4 bg-[#FDFDFD]/80 backdrop-blur-md">
           <div className="w-full max-w-[800px] bg-white border border-black/5 rounded-[16px] px-6 py-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                 <Skeleton className="w-11 h-11 rounded-[10px]" />
                 <div className="flex flex-col gap-2">
                    <Skeleton className="w-32 h-5" />
                    <Skeleton className="w-20 h-3" />
                 </div>
              </div>
           </div>
        </div>

        {/* Skeleton Main Work Area */}
        <div className="w-full max-w-[480px] px-4 sm:px-6 py-12 space-y-12 flex-1 flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin shadow-xl mb-4" />
          <p className="text-slate-500 font-medium animate-pulse text-sm">Identifying Shop...</p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6 font-sans">
        <Card className="max-w-md w-full bg-white border-black/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 text-center rounded-[32px]">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Store className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-black mb-2">Shop Not Found</h1>
          <p className="text-slate-500 mb-8 leading-relaxed font-medium">The shop code you scanned doesn't seem to exist in the XeroxQ network.</p>
          <Button asChild variant="outline" className="w-full h-14 border-black/10 text-black font-bold hover:bg-black/5 rounded-2xl">
            <a href="/">Go to Homepage</a>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFDFD]">
      <main className="flex-1 flex flex-col items-center overflow-x-hidden px-4 sm:px-6 pb-12 font-sans selection:bg-black selection:text-white">
        
        {/* App Bar / Command Strip */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-50 w-full flex justify-center mb-0 py-2 bg-[#FDFDFD]/80 backdrop-blur-md"
        >
          <div className="w-full max-w-[800px] bg-white/80 backdrop-blur-xl border border-black/5 rounded-[16px] px-6 py-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-black rounded-[10px] flex items-center justify-center shadow-lg transform -rotate-3 transition-transform hover:rotate-0">
                 <Printer className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                 <h1 className="text-[20px] font-black text-black leading-none tracking-tight mb-1">{shop.name}</h1>
                 <div className="flex items-center gap-2">
                   <div className={cn("w-1.5 h-1.5 rounded-full", shop.is_open !== false ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-500")} />
                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em]">
                      Shop Status: {shop.is_open !== false ? "Open" : "Closed"}
                   </span>
                 </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex px-3 py-1.5 rounded-[8px] bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-[0.1em]">
                 Fast Pair
              </div>
            </div>
          </div>
        </motion.div>

        <div className="w-full max-w-[480px] flex-1 flex flex-col justify-center py-12 relative z-10">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="relative w-28 h-28 mx-auto mb-6">
              <div className="absolute inset-0 bg-blue-500 rounded-[32px] blur-[20px] opacity-[0.15] animate-pulse" />
              <div className="relative w-full h-full bg-white rounded-[32px] flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-black/5">
                <Printer className="w-14 h-14 text-black drop-shadow-sm" />
                <div className="absolute -bottom-2 -right-2 p-3 bg-[#25D366] rounded-2xl shadow-lg border-4 border-white">
                   <MessageSquare className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <h2 className="text-3xl font-black tracking-tight mb-2 text-black">
              Connect to <span className="text-[#25D366]">WhatsApp</span>
            </h2>
            <p className="text-slate-500 text-[15px] font-medium max-w-sm mx-auto">
              Send your documents directly from WhatsApp to {shop.name}'s secure queue.
            </p>
          </motion.div>

          {/* Pairing Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white border text-black border-black/5 p-8 rounded-[32px] shadow-sm relative overflow-hidden group">
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-4 text-left p-5 rounded-2xl bg-[#F9F9F9] border border-black/[0.04]">
                  <div className="w-12 h-12 rounded-[14px] bg-white flex items-center justify-center shrink-0 border border-black/[0.04] shadow-sm">
                    <Zap className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="mt-0.5">
                    <div className="font-bold text-black text-[15px] mb-0.5">Instant Printing</div>
                    <p className="text-slate-500 text-[13px] leading-relaxed font-medium">Message files to the bot and they immediately appear on the shop's screen.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 text-left p-5 rounded-2xl bg-[#F9F9F9] border border-black/[0.04]">
                  <div className="w-12 h-12 rounded-[14px] bg-white flex items-center justify-center shrink-0 border border-black/[0.04] shadow-sm">
                    <ShieldCheck className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="mt-0.5">
                    <div className="font-bold text-black text-[15px] mb-0.5">Total Privacy</div>
                    <p className="text-slate-500 text-[13px] leading-relaxed font-medium">Your files remain encrypted and vanish automatically once printed.</p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleConnect}
                className="w-full h-14 bg-black hover:bg-black/90 text-white rounded-2xl text-[16px] font-black shadow-xl shadow-black/10 transition-all active:scale-[0.98] group flex items-center justify-center gap-3"
              >
                Launch WhatsApp
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform stroke-[3px]" />
              </Button>
            </Card>
          </motion.div>

        </div>
      </main>
    </div>
  );
}
