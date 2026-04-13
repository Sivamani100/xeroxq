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
      <main className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-[14px] text-slate-500 font-bold animate-pulse tracking-tight">Identifying Shop...</p>
        </div>
      </main>
    );
  }

  if (!shop) {
    return (
      <main className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-10 border border-black/5 shadow-2xl rounded-[16px] max-w-[400px] w-full flex flex-col items-center text-center"
        >
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6 border border-red-100">
            <Store className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-[24px] font-black text-black tracking-tight mb-2">Shop Offline</h1>
          <p className="text-[14px] font-medium text-slate-500 mb-8 leading-relaxed">
            This shop does not exist or is no longer active.
          </p>
          <Button 
            onClick={() => window.location.href = "/"} 
            className="w-full h-12 bg-black text-white hover:bg-black/90 font-bold rounded-[8px] transition-all"
          >
            Go Back Home
          </Button>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-10 border border-black/5 shadow-2xl rounded-[16px] max-w-[420px] w-full flex flex-col items-center text-center"
      >
        <div className="w-20 h-20 bg-blue-50/50 rounded-full flex items-center justify-center mb-6 border border-blue-100/50 relative">
          <Printer className="w-10 h-10 text-blue-600" />
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            <MessageSquare className="w-3 h-3 text-white" />
          </div>
        </div>
        
        <h1 className="text-[28px] font-black text-black tracking-tight mb-1 leading-tight">
          XeroxQ Connect
        </h1>
        <p className="text-[14px] font-medium text-slate-500 mb-8 leading-relaxed">
          Pairing with <span className="font-bold text-black">{shop.name}</span>
        </p>

        <div className="w-full space-y-3 mb-8">
          <div className="flex items-center gap-4 text-left p-4 rounded-[12px] bg-[#FDFDFD] border border-black/5 shadow-sm">
            <div className="w-10 h-10 rounded-[8px] bg-green-50 flex items-center justify-center shrink-0 border border-green-100">
              <MessageSquare className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="font-bold text-black text-[14px]">Direct WhatsApp Print</div>
              <p className="text-slate-500 text-[12px] leading-snug mt-0.5">Send documents seamlessly.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-left p-4 rounded-[12px] bg-[#FDFDFD] border border-black/5 shadow-sm">
            <div className="w-10 h-10 rounded-[8px] bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
              <ShieldCheck className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <div className="font-bold text-black text-[14px]">Private & Secure</div>
              <p className="text-slate-500 text-[12px] leading-snug mt-0.5">End-to-end encrypted transfer.</p>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleConnect}
          className="w-full h-14 bg-black text-white hover:bg-black/90 font-bold rounded-[8px] transition-all flex items-center justify-center gap-2 group shadow-md"
        >
          <Zap className="w-4 h-4 fill-white" />
          Connect via WhatsApp
        </Button>
        
        <div className="mt-8 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-extrabold uppercase tracking-[0.15em] border-t border-black/5 w-full pt-6">
          <ShieldCheck className="w-3.5 h-3.5" />
          Official XeroxQ Portal
        </div>
      </motion.div>
    </main>
  );
}
