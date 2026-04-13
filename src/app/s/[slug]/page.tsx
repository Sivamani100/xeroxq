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
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin shadow-xl" />
          <p className="text-slate-500 font-medium animate-pulse text-sm">Identifying Shop...</p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6 font-sans">
        <Card className="max-w-md w-full bg-white border-black/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 text-center rounded-3xl">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Store className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-black mb-2">Shop Not Found</h1>
          <p className="text-slate-500 mb-8 leading-relaxed font-medium">The shop code you scanned doesn't seem to exist in the XeroxQ network.</p>
          <Button asChild variant="outline" className="w-full h-12 border-black/[0.08] text-black font-bold hover:bg-black/5 rounded-xl">
            <a href="/">Go to Homepage</a>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-black flex flex-col font-sans overflow-hidden">
      {/* Dynamic Background Elements - Light Theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-[500px] h-[500px] bg-blue-50 blur-[120px] rounded-full" />
        <div className="absolute top-1/2 -left-1/4 w-[600px] h-[600px] bg-indigo-50/50 blur-[140px] rounded-full" />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full max-w-lg mx-auto">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 w-full"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[11px] font-black uppercase tracking-[0.1em] mb-6 shadow-sm">
             <Zap className="w-3.5 h-3.5 fill-blue-600" /> Fast Pair Active
          </div>
          
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 bg-blue-500 rounded-3xl blur-[20px] opacity-10 animate-pulse" />
            <div className="relative w-full h-full bg-white rounded-3xl flex items-center justify-center shadow-xl shadow-black/5 border border-black/5 overflow-hidden">
              <Printer className="w-12 h-12 text-blue-600 drop-shadow-sm" />
              <div className="absolute bottom-[-1px] right-[-1px] p-2 bg-green-500 rounded-tl-2xl shadow-lg border border-green-400">
                 <MessageSquare className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2 text-black">
            XeroxQ <span className="text-blue-600">Connect</span>
          </h1>
          <p className="text-slate-500 text-lg font-medium">Pairing with your local shop</p>
        </motion.div>

        {/* Pairing Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full"
        >
          <Card className="bg-white border text-black border-black/[0.08] p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] relative overflow-hidden group">
            <div className="relative z-10 text-center">
              <div className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-3">You are connecting to</div>
              <h2 className="text-3xl sm:text-4xl font-black text-black mb-8 tracking-tight drop-shadow-sm">
                {shop.name}
              </h2>

              <div className="space-y-4 mb-10">
                <div className="flex items-start gap-4 text-left p-5 rounded-2xl bg-[#FDFDFD] border border-black/[0.06] shadow-sm">
                  <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center shrink-0 border border-green-100/50 shadow-inner">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="mt-0.5">
                    <div className="font-bold text-black text-[15px] mb-0.5">Instant WhatsApp Print</div>
                    <p className="text-slate-500 text-sm leading-relaxed font-medium">Quickly send documents directly from WhatsApp to this shop's printing queue.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 text-left p-5 rounded-2xl bg-[#FDFDFD] border border-black/[0.06] shadow-sm">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100/50 shadow-inner">
                    <ShieldCheck className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="mt-0.5">
                    <div className="font-bold text-black text-[15px] mb-0.5">Secure & Private</div>
                    <p className="text-slate-500 text-sm leading-relaxed font-medium">Files are encrypted end-to-end and deleted right after printing.</p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleConnect}
                className="w-full h-16 bg-[#25D366] hover:bg-[#20BE5C] text-white rounded-2xl text-[17px] font-black shadow-xl shadow-[#25D366]/20 transition-all active:scale-[0.98] group flex items-center justify-center gap-3"
              >
                Connect on WhatsApp
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform stroke-[3px]" />
              </Button>
              
              <div className="mt-8 flex items-center justify-center gap-2 text-[10px] text-slate-400 font-extrabold uppercase tracking-[0.2em]">
                <ShieldCheck className="w-3 h-3" />
                Verified XeroxQ Partner
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Support Section */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-slate-500 text-sm font-semibold text-center"
        >
          Having trouble? <a href="/help" className="text-blue-600 hover:text-blue-700 underline underline-offset-4 decoration-blue-600/30 font-bold transition-colors">Contact Support</a>
        </motion.p>
      </main>
    </div>
  );
}
