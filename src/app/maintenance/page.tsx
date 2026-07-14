"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Hammer, AlertTriangle, ShieldCheck } from "lucide-react";

export default function MaintenancePage() {
  const [estimatedTime, setEstimatedTime] = useState("15 minutes");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    // Simulate countdown updates
    const interval = setInterval(() => {
      setEstimatedTime(prev => {
        const minutes = parseInt(prev);
        if (minutes > 5) return `${minutes - 1} minutes`;
        if (minutes > 1) return `${minutes - 1} minutes`;
        return "1 minute";
      });
    }, 60000); // Update every minute

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 0)', backgroundSize: '40px 40px' }} />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full relative z-10 text-center"
      >
        {/* Icon */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-24 h-24 bg-black rounded-[32px] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-black/20"
        >
          <Hammer className="w-10 h-10 text-white" />
        </motion.div>
        
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full mb-6">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Protocol Lockdown</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-black text-black uppercase tracking-tighter leading-none mb-6">
          Site Under <br />Maintenance
        </h1>
        
        {/* Description */}
        <p className="text-gray-500 font-medium leading-relaxed italic mb-8">
          We're performing critical system updates to enhance your experience. 
          Our team is working diligently to complete this as quickly as possible.
        </p>

        {/* Estimated Time */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Estimated Time
            </span>
            <span className="text-black font-bold">{estimatedTime}</span>
          </div>
          <div className="text-[9px] text-gray-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>

        {/* Status Indicators */}
        <div className="space-y-4 mb-10">
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            <span>System Status</span>
            <span className="text-amber-500">Updating...</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            <span>Security Protocol</span>
            <span className="text-emerald-500">Active</span>
          </div>
        </div>

        {/* Action Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.location.reload()}
          className="w-full bg-black text-white rounded-2xl py-4 font-bold text-[11px] uppercase tracking-widest hover:bg-gray-800 transition-colors mb-6"
        >
          Check Status Now
        </motion.button>

        {/* Support Info */}
        <div className="border-t border-gray-100 pt-6">
          <p className="text-[9px] text-gray-400 mb-2">
            Need immediate assistance?
          </p>
          <a 
            href="mailto:support@xeroxq.com" 
            className="text-[10px] font-bold text-black underline hover:no-underline"
          >
            Contact Support Team
          </a>
        </div>

        {/* Footer */}
        <p className="mt-12 text-[9px] font-bold text-gray-300 uppercase tracking-[0.2em]">
          Powered by Mercury Protocol v2.4
        </p>
      </motion.div>
    </div>
  );
}
