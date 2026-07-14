"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle, Power, Loader2, Globe, Lock, Unlock } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function MaintenanceControl() {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const fetchMaintenanceStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('platform_settings')
          .select('value')
          .eq('key', 'maintenance_mode')
          .single();

        if (!error && data) {
          setIsMaintenance(!!data.value);
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
        setIsMaintenance(!!payload.new.value);
        setLastUpdate(new Date());
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const toggleMaintenance = async () => {
    setToggling(true);
    
    try {
      const adminKey = process.env.NEXT_PUBLIC_ADMIN_MAINTENANCE_KEY || 'xeroxq-admin-2024';
      
      const response = await fetch('/api/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maintenance_mode: !isMaintenance,
          admin_key: adminKey
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to toggle maintenance mode');
      }

      setIsMaintenance(data.maintenance_mode);
      setLastUpdate(new Date());

      // Show success notification
      if (data.maintenance_mode) {
        alert('🔒 Maintenance mode activated - All customer routes are now locked');
      } else {
        alert('🔓 Maintenance mode deactivated - Customer routes are now accessible');
      }

    } catch (error) {
      console.error('Error toggling maintenance mode:', error);
      alert('Failed to toggle maintenance mode: ' + (error as Error).message);
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-[5.57px] p-6 shadow-sm">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-[#E2E8F0] rounded-[5.57px] p-6 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isMaintenance ? 'bg-red-50' : 'bg-emerald-50'
          }`}>
            {isMaintenance ? (
              <Lock className="w-5 h-5 text-red-500" />
            ) : (
              <Unlock className="w-5 h-5 text-emerald-500" />
            )}
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-black">Global Maintenance Protocol</h3>
            <p className="text-[11px] text-gray-500 uppercase tracking-widest">
              System Lockdown Control
            </p>
          </div>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
          isMaintenance 
            ? 'bg-red-100 text-red-600' 
            : 'bg-emerald-100 text-emerald-600'
        }`}>
          {isMaintenance ? 'LOCKED' : 'OPEN'}
        </div>
      </div>

      {/* Status Description */}
      <div className={`p-4 rounded-xl mb-6 ${
        isMaintenance ? 'bg-red-50 border border-red-100' : 'bg-emerald-50 border border-emerald-100'
      }`}>
        <div className="flex items-start gap-3">
          {isMaintenance ? (
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
          )}
          <div>
            <p className={`text-[13px] font-medium leading-relaxed ${
              isMaintenance ? 'text-red-700' : 'text-emerald-700'
            }`}>
              {isMaintenance 
                ? 'All customer routes are currently locked. Only admin access remains active.'
                : 'All customer routes are accessible. System is operating normally.'
              }
            </p>
            <p className="text-[11px] text-gray-500 mt-2">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Route Status */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-gray-400" />
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Customer Routes
            </span>
          </div>
          <div className={`text-[14px] font-bold ${
            isMaintenance ? 'text-red-500' : 'text-emerald-500'
          }`}>
            {isMaintenance ? 'LOCKED' : 'OPEN'}
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-gray-400" />
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Admin Portal
            </span>
          </div>
          <div className="text-[14px] font-bold text-emerald-500">
            ALWAYS OPEN
          </div>
        </div>
      </div>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={toggleMaintenance}
        disabled={toggling}
        className={`w-full h-[48px] rounded-xl font-bold text-[12px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
          isMaintenance
            ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
            : 'bg-red-500 hover:bg-red-600 text-white'
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
      </motion.button>

      {/* Warning Message */}
      {isMaintenance && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-[11px] text-amber-700 leading-relaxed">
              Customer traffic is blocked. Remember to deactivate maintenance when ready.
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
