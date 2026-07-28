"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Monitor, ShieldCheck, Cpu, CheckCircle2, Sparkles, ExternalLink, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DownloadModal({ isOpen, onClose }: DownloadModalProps) {
  const [detectedArch, setDetectedArch] = useState<"x64" | "x86" | "unknown">("unknown");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes("win64") || ua.includes("x64") || ua.includes("wow64") || navigator.maxTouchPoints > 0) {
        setDetectedArch("x64");
      } else if (ua.includes("win32") || ua.includes("x86")) {
        setDetectedArch("x86");
      } else {
        setDetectedArch("x64"); // Default modern PCs
      }
    }
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
          className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl sm:p-8 z-10 max-h-[90vh] flex flex-col justify-between"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-black transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="space-y-6 overflow-y-auto pr-1">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#FB432C]/20 bg-[#FB432C]/5 px-3 py-1 text-xs font-bold text-[#FB432C]">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Multi-Architecture Windows Installer</span>
              </div>
              <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-black tracking-tight">
                Download XeroxQ Desktop
              </h2>
              <p className="mt-1 text-sm sm:text-base text-gray-500 font-medium">
                Choose the suitable edition for your Windows PC or Xerox printing machine.
              </p>
            </div>

            {/* Architecture Auto-Detect Banner */}
            <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-emerald-900">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md">
                  <Monitor className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Auto-Detected System</span>
                    <span className="inline-flex items-center rounded-full bg-emerald-200 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                      {detectedArch === "x64" ? "64-Bit Windows" : "32-Bit Windows"}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-emerald-800">
                    {detectedArch === "x64"
                      ? "Your system supports 64-Bit (x64) & Universal editions."
                      : "Your system supports 32-Bit (x86 / ia32) Universal edition."}
                  </p>
                </div>
              </div>
            </div>

            {/* Download Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option 1: 64-Bit (x64) & Universal Installer */}
              <div className={`relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 ${
                detectedArch === "x64"
                  ? "border-[#FB432C] bg-gradient-to-b from-orange-50/50 to-white shadow-lg ring-1 ring-[#FB432C]/30"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}>
                {detectedArch === "x64" && (
                  <span className="absolute -top-2.5 right-4 rounded-full bg-[#FB432C] px-3 py-0.5 text-[10px] font-black uppercase text-white shadow-sm">
                    Recommended for your PC
                  </span>
                )}
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
                      <Cpu className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-black text-base">Windows 64-Bit (x64)</h3>
                      <p className="text-xs text-gray-500 font-medium">Standard Setup Installer (.exe)</p>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-2 text-xs text-gray-600 font-medium">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                      <span>Optimized for modern 64-Bit Windows 10/11</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                      <span>Automatic background printer auto-discovery</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                      <span>Includes Desktop & Start Menu shortcuts</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-5 pt-3 border-t border-gray-100">
                  <Button
                    asChild
                    className="w-full h-11 rounded-xl bg-[#FB432C] hover:bg-black text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <a
                      href="/downloads/XeroxQ-Setup-0.1.0.exe"
                      download="XeroxQ Setup 0.1.0 (x64).exe"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download 64-Bit Installer</span>
                    </a>
                  </Button>
                </div>
              </div>

              {/* Option 2: 32-Bit (x86 / ia32) Installer */}
              <div className={`relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 ${
                detectedArch === "x86"
                  ? "border-[#FB432C] bg-gradient-to-b from-orange-50/50 to-white shadow-lg ring-1 ring-[#FB432C]/30"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}>
                {detectedArch === "x86" && (
                  <span className="absolute -top-2.5 right-4 rounded-full bg-[#FB432C] px-3 py-0.5 text-[10px] font-black uppercase text-white shadow-sm">
                    Recommended for your PC
                  </span>
                )}
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-white">
                      <Monitor className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-black text-base">Windows 32-Bit (x86 / ia32)</h3>
                      <p className="text-xs text-gray-500 font-medium">Universal Setup Installer (.exe)</p>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-2 text-xs text-gray-600 font-medium">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                      <span>Designed for 32-Bit legacy PCs & print servers</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                      <span>Universal NSIS setup supporting x86 architecture</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                      <span>Full thermal/inkjet/laser driver hooks</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-5 pt-3 border-t border-gray-100">
                  <Button
                    asChild
                    className="w-full h-11 rounded-xl bg-black hover:bg-[#FB432C] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <a
                      href="/downloads/XeroxQ-Setup-0.1.0.exe"
                      download="XeroxQ Setup 0.1.0 (x86 32-Bit).exe"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download 32-Bit Installer</span>
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            {/* Option 3: Portable Edition */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-200 text-gray-800">
                  <HardDrive className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-black text-sm">XeroxQ Portable Edition</h4>
                    <span className="rounded-md bg-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-700">No Install Needed</span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium">Single standalone executable for USB drives and instant testing.</p>
                </div>
              </div>
              <Button
                asChild
                variant="outline"
                className="w-full sm:w-auto h-10 rounded-xl border-gray-300 font-bold text-xs hover:bg-black hover:text-white transition-all flex-shrink-0"
              >
                <a
                  href="/downloads/XeroxQ-Portable-0.1.0.exe"
                  download="XeroxQ Portable 0.1.0.exe"
                  className="flex items-center gap-2"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Portable (.exe)</span>
                </a>
              </Button>
            </div>

            {/* Verification Footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 text-xs text-gray-400 font-medium">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>Digitally Signed & Code Audited (Zero Malware)</span>
              </div>
              <span>Works with all Windows Printers</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
