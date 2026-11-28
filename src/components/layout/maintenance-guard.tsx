"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { isMaintenanceEnabled } from "@/lib/maintenance";
import { motion, AnimatePresence } from "framer-motion";
import { Hammer, Loader2, AlertTriangle, ShieldCheck, Eye } from "lucide-react";

export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);

  useEffect(() => {
    const checkMaintenance = async () => {
      const pathname = window.location.pathname;
      
      // Check if user is on admin route
      const adminRoutes = ['/platform-admin', '/admin', '/login'];
      const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
      setIsAdminMode(isAdminRoute);

      // Don't show maintenance overlay on admin routes
      if (isAdminRoute) {
        return;
      }

      try {
        const { data, error } = await supabase
          .from("platform_settings")
          .select("value")
          .eq("key", "maintenance_mode")
          .maybeSingle();

        if (!error && data) {
          setIsMaintenance(isMaintenanceEnabled(data.value));
        }
      } catch (err) {
        console.error("Maintenance Check Error:", err);
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
        const newMaintenanceState = isMaintenanceEnabled(payload.new?.value);
        setIsMaintenance(newMaintenanceState);
        
        // If maintenance is turned off and we're on maintenance page, redirect home
        if (!newMaintenanceState && window.location.pathname === '/maintenance') {
          window.location.href = '/';
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <>
      <AnimatePresence>
        {isMaintenance && !isAdminMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-[#FAFAFA] dark:bg-[#111113] text-[#171717] dark:text-[#EDEDED] flex items-center justify-center p-6 text-center"
          >
            <div className="max-w-md w-full rounded-[20px] bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] p-8 relative z-10">
              <div className="w-16 h-16 bg-[#F4F4F5] dark:bg-[#232325] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Hammer className="w-7 h-7 text-[#FB432C]" />
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/15 border border-amber-500/25 rounded-full mb-5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-300" />
                <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">Maintenance</span>
              </div>

              <h1 className="text-3xl font-semibold text-[#171717] dark:text-[#EDEDED] tracking-tight leading-tight mb-3">
                Site Under Maintenance
              </h1>

              <p className="text-sm text-[#525252] dark:text-[#A1A1A6] leading-relaxed mb-7">
                The site is currently in maintenance mode. Please check back shortly.
              </p>

              <div className="space-y-3 pt-6 border-t border-[#171717]/[0.08] dark:border-white/[0.08] text-xs">
                <div className="flex items-center justify-between font-medium text-[#737373] dark:text-[#85858B]">
                  <span className="flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Status</span>
                  <span className="text-[#171717] dark:text-[#EDEDED] font-semibold">Updating...</span>
                </div>
                <div className="flex items-center justify-between font-medium text-[#737373] dark:text-[#85858B]">
                  <span className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5" /> Security</span>
                  <span className="text-[#16A34A] dark:text-[#4CC38A] font-semibold">Verified</span>
                </div>
                <div className="flex items-center justify-between font-medium text-[#737373] dark:text-[#85858B]">
                  <span className="flex items-center gap-2"><Eye className="w-3.5 h-3.5" /> Admin Access</span>
                  <span className="text-[#FB432C] font-semibold">Active</span>
                </div>
              </div>

              <button
                onClick={() => window.location.href = '/admin'}
                className="w-full bg-[#FB432C] hover:bg-[#E03923] text-white rounded-xl py-3 font-semibold text-xs transition-colors mt-6 cursor-pointer"
              >
                Admin Portal Access
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </>
  );
}
