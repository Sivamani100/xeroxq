"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Hammer, Loader2, AlertTriangle, ShieldCheck } from "lucide-react";

export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMaintenance = async () => {
      // Platform admin should always be able to see the site to turn it off
      if (window.location.pathname.startsWith('/platform-admin') || window.location.pathname === '/login') {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("platform_settings")
          .select("value")
          .eq("key", "maintenance_mode")
          .single();

        if (!error && data) {
          setIsMaintenance(!!data.value);
        }
      } catch (err) {
        console.error("Maintenance Check Error:", err);
      } finally {
        setLoading(false);
      }
    };

    // Initial check
    checkMaintenance();

    // Subscribe to real-time changes for instant lockdown/unlock
    const channel = supabase
      .channel('public:platform_settings')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'platform_settings',
        filter: 'key=eq.maintenance_mode'
      }, (payload) => {
        setIsMaintenance(!!payload.new.value);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) return null;

  return (
    <>
      <AnimatePresence>
        {isMaintenance && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-[#FDFDFD] flex items-center justify-center p-6 text-center"
          >
             {/* Background Pattern */}
             <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none" 
                  style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 0)', backgroundSize: '40px 40px' }} />

             <div className="max-w-md w-full relative z-10">
                <div className="w-24 h-24 bg-black rounded-[32px] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-black/20">
                   <Hammer className="w-10 h-10 text-white animate-bounce" />
                </div>
                
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full mb-6">
                   <AlertTriangle className="w-3 h-3 text-amber-600" />
                   <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Protocol Lockdown</span>
                </div>

                <h1 className="text-4xl font-black text-black uppercase tracking-tighter leading-none mb-6">
                   Site Under <br />Maintenance
                </h1>
                
                <p className="text-gray-500 font-medium leading-relaxed italic mb-10">
                   The site is currently in maintenance mode. Please try again later.
                </p>

                <div className="space-y-4 pt-10 border-t border-gray-100">
                   <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                      <span className="flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Uplink Status</span>
                      <span className="text-black">Syncing Mesh...</span>
                   </div>
                   <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                      <span className="flex items-center gap-2"><ShieldCheck className="w-3 h-3" /> Security Audit</span>
                      <span className="text-emerald-500">Verified</span>
                   </div>
                </div>

                <p className="mt-12 text-[9px] font-bold text-gray-300 uppercase tracking-[0.2em]">
                   Powered by Mercury Protocol v2.4
                </p>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </>
  );
}
