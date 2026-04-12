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
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-medium animate-pulse text-sm">Identifying Shop...</p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6 font-sans">
        <Card className="max-w-md w-full bg-slate-900/50 border-slate-800 p-8 text-center backdrop-blur-xl">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Store className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Shop Not Found</h1>
          <p className="text-slate-400 mb-8 leading-relaxed">The shop code you scanned doesn't seem to exist in the XeroxQ network.</p>
          <Button asChild variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800">
            <a href="/">Go to Homepage</a>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#040711] text-white flex flex-col font-sans overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-[500px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute top-1/2 -left-1/4 w-[600px] h-[600px] bg-indigo-600/10 blur-[140px] rounded-full animate-pulse delay-700" />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full max-w-lg mx-auto">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 w-full"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
            <Zap className="w-3.5 h-3.5 fill-blue-400" /> Fast Pair Active
          </div>
          
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 bg-blue-500 rounded-3xl blur-[20px] opacity-20 animate-pulse" />
            <div className="relative w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center shadow-xl border border-white/10 overflow-hidden">
              <Printer className="w-12 h-12 text-white drop-shadow-md" />
              <div className="absolute bottom-0 right-0 p-1.5 bg-green-500 rounded-tl-xl">
                 <MessageSquare className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
            XeroxQ <span className="text-blue-500">Connect</span>
          </h1>
          <p className="text-slate-400 text-lg font-medium italic">Pairing with your local shop</p>
        </motion.div>

        {/* Pairing Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full"
        >
          <Card className="bg-white/5 border-white/10 backdrop-blur-2xl p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            {/* Ambient Shine */}
            <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[15deg] transition-all duration-1000 group-hover:translate-x-[200%]" />

            <div className="relative z-10 text-center">
              <div className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-2 opacity-60">You are at</div>
              <h2 className="text-3xl font-black text-white mb-8 tracking-tight drop-shadow-sm">
                {shop.name}
              </h2>

              <div className="space-y-4 mb-10">
                <div className="flex items-start gap-4 text-left p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0 border border-green-500/20">
                    <MessageSquare className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-200">One-Tap Connect</div>
                    <p className="text-slate-400 text-xs leading-relaxed">Automatically pairs your WhatsApp session to this shop for instant printing.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 text-left p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                    <ShieldCheck className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-200">Secure & Direct</div>
                    <p className="text-slate-400 text-xs leading-relaxed">Files are encrypted and sent directly to the shopkeeper's secure queue.</p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleConnect}
                className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-lg font-black shadow-xl shadow-blue-900/40 transition-all active:scale-95 group flex items-center justify-center gap-3 border-t border-white/20"
              >
                Connect on WhatsApp
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <p className="mt-6 text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">
                Verified XeroxQ Local Partner
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Support Section */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-slate-500 text-sm font-medium"
        >
          Having trouble? <a href="/help" className="text-blue-500 hover:underline">Chat with Support</a>
        </motion.p>
      </main>

      <SiteFooter />
    </div>
  );
}
