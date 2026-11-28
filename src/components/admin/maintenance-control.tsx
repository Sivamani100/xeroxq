"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle, Power, Loader2, Globe, Lock, Unlock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { isMaintenanceEnabled } from "@/lib/maintenance";

export function MaintenanceControl() {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [statusNotice, setStatusNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const fetchMaintenanceStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('platform_settings')
          .select('value')
          .eq('key', 'maintenance_mode')
          .maybeSingle();

        if (!error && data) {
          setIsMaintenance(isMaintenanceEnabled(data.value));
        }
      } catch (error) {
        console.error('Error fetching maintenance status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMaintenanceStatus();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('public:platform_settings')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'platform_settings',
        filter: 'key=eq.maintenance_mode'
      }, (payload) => {
        setIsMaintenance(isMaintenanceEnabled(payload.new?.value));
        setLastUpdate(new Date());
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const toggleMaintenance = async () => {
    setToggling(true);
    setStatusNotice(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Authentication required to change maintenance mode');
      }

      const response = await fetch('/api/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          maintenance_mode: !isMaintenance,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to toggle maintenance mode');
      }

      setIsMaintenance(data.maintenance_mode);
      setLastUpdate(new Date());

      setStatusNotice({
        type: 'success',
        text: data.maintenance_mode
          ? 'Maintenance mode activated — customer routes are now locked.'
          : 'Maintenance mode deactivated — customer routes are now accessible.',
      });
    } catch (error) {
      console.error('Error toggling maintenance mode:', error);
      setStatusNotice({
        type: 'error',
        text: 'Failed to toggle maintenance mode: ' + (error as Error).message,
      });
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-xl p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[#737373] dark:text-[#85858B]" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] rounded-xl p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isMaintenance ? 'bg-[#DC2626]/10 dark:bg-[#E5484D]/15' : 'bg-[#16A34A]/10 dark:bg-[#4CC38A]/15'
          }`}>
            {isMaintenance ? (
              <Lock className="w-5 h-5 text-[#DC2626] dark:text-[#E5484D]" />
            ) : (
              <Unlock className="w-5 h-5 text-[#16A34A] dark:text-[#4CC38A]" />
            )}
          </div>
          <div>
            <h3 className="text-[16px] font-semibold text-[#171717] dark:text-[#EDEDED]">Global Maintenance Protocol</h3>
            <p className="text-[11px] text-[#737373] dark:text-[#85858B] uppercase tracking-wider">
              System Lockdown Control
            </p>
          </div>
        </div>

        <div className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
          isMaintenance
            ? 'bg-[#DC2626]/10 dark:bg-[#E5484D]/15 text-[#DC2626] dark:text-[#E5484D]'
            : 'bg-[#16A34A]/10 dark:bg-[#4CC38A]/15 text-[#16A34A] dark:text-[#4CC38A]'
        }`}>
          {isMaintenance ? 'LOCKED' : 'OPEN'}
        </div>
      </div>

      {/* Status Description */}
      <div className={`p-4 rounded-xl mb-6 ${
        isMaintenance
          ? 'bg-[#DC2626]/10 dark:bg-[#E5484D]/15 border border-[#DC2626]/20 dark:border-[#E5484D]/25'
          : 'bg-[#16A34A]/10 dark:bg-[#4CC38A]/15 border border-[#16A34A]/20 dark:border-[#4CC38A]/25'
      }`}>
        <div className="flex items-start gap-3">
          {isMaintenance ? (
            <AlertTriangle className="w-5 h-5 text-[#DC2626] dark:text-[#E5484D] mt-0.5 flex-shrink-0" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-[#16A34A] dark:text-[#4CC38A] mt-0.5 flex-shrink-0" />
          )}
          <div>
            <p className={`text-[13px] font-medium leading-relaxed ${
              isMaintenance ? 'text-[#DC2626] dark:text-[#E5484D]' : 'text-[#16A34A] dark:text-[#4CC38A]'
            }`}>
              {isMaintenance
                ? 'All customer routes are currently locked. Only admin access remains active.'
                : 'All customer routes are accessible. System is operating normally.'
              }
            </p>
            <p className="text-[11px] text-[#737373] dark:text-[#85858B] mt-2">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {statusNotice && (
        <div
          className={`mb-5 rounded-xl border px-3.5 py-2.5 text-xs font-medium ${
            statusNotice.type === 'error'
              ? 'border-[#DC2626]/20 dark:border-[#E5484D]/25 bg-[#DC2626]/10 dark:bg-[#E5484D]/15 text-[#DC2626] dark:text-[#E5484D]'
              : 'border-[#16A34A]/20 dark:border-[#4CC38A]/25 bg-[#16A34A]/10 dark:bg-[#4CC38A]/15 text-[#16A34A] dark:text-[#4CC38A]'
          }`}
        >
          {statusNotice.text}
        </div>
      )}

      {/* Route Status */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#F4F4F5] dark:bg-[#232325] rounded-xl p-4 border border-[#171717]/[0.06] dark:border-white/[0.08]">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-[#737373] dark:text-[#85858B]" />
            <span className="text-[11px] font-semibold text-[#737373] dark:text-[#85858B] uppercase tracking-wider">
              Customer Routes
            </span>
          </div>
          <div className={`text-[14px] font-semibold ${
            isMaintenance ? 'text-[#DC2626] dark:text-[#E5484D]' : 'text-[#16A34A] dark:text-[#4CC38A]'
          }`}>
            {isMaintenance ? 'LOCKED' : 'OPEN'}
          </div>
        </div>

        <div className="bg-[#F4F4F5] dark:bg-[#232325] rounded-xl p-4 border border-[#171717]/[0.06] dark:border-white/[0.08]">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-[#737373] dark:text-[#85858B]" />
            <span className="text-[11px] font-semibold text-[#737373] dark:text-[#85858B] uppercase tracking-wider">
              Admin Portal
            </span>
          </div>
          <div className="text-[14px] font-semibold text-[#16A34A] dark:text-[#4CC38A]">
            ALWAYS OPEN
          </div>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={toggleMaintenance}
        disabled={toggling}
        className={`w-full h-[46px] rounded-xl font-semibold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
          isMaintenance
            ? 'bg-[#16A34A] hover:bg-[#15803D] text-white'
            : 'bg-[#DC2626] hover:bg-[#B91C1C] text-white'
        } ${toggling ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {toggling ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Power className="w-4 h-4" />
            {isMaintenance ? 'DEACTIVATE MAINTENANCE' : 'ACTIVATE MAINTENANCE'}
          </>
        )}
      </button>

      {/* Warning Message */}
      {isMaintenance && (
        <div className="mt-4 p-3 bg-amber-500/15 border border-amber-500/25 rounded-xl">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-300 flex-shrink-0" />
            <p className="text-[11.5px] text-amber-700 dark:text-amber-200 leading-relaxed">
              Customer traffic is blocked. Remember to deactivate maintenance when ready.
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
