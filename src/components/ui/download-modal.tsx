"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Monitor, ShieldCheck, Cpu, CheckCircle2, Sparkles, HardDrive, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DOWNLOAD_BASE_URL = (
  process.env.NEXT_PUBLIC_DESKTOP_DOWNLOAD_BASE_URL || "/downloads"
).replace(/\/$/, "");

export function DownloadModal({ isOpen, onClose }: DownloadModalProps) {
  const [detectedArch, setDetectedArch] = useState<"x64" | "x86" | "unknown">("unknown");

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    const detectFromUserAgent = () => {
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes("win64") || ua.includes("x64") || ua.includes("wow64")) {
        return "x64" as const;
      }
      if (ua.includes("win32") || ua.includes("x86")) {
        return "x86" as const;
      }
      return "x64" as const;
    };

    const navWithHints = navigator as Navigator & {
      userAgentData?: {
        getHighEntropyValues?: (hints: string[]) => Promise<{
          architecture?: string;
          bitness?: string;
        }>;
      };
    };

    if (navWithHints.userAgentData?.getHighEntropyValues) {
      navWithHints.userAgentData
        .getHighEntropyValues(["architecture", "bitness"])
        .then((hints) => {
          if (cancelled) return;
          if (hints.bitness === "64") {
            setDetectedArch("x64");
          } else if (hints.bitness === "32" || hints.architecture === "x86") {
            setDetectedArch("x86");
          } else {
            setDetectedArch(detectFromUserAgent());
          }
        })
        .catch(() => {
          if (!cancelled) setDetectedArch(detectFromUserAgent());
        });
    } else {
      setDetectedArch(detectFromUserAgent());
    }

    return () => {
      cancelled = true;
    };
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
          className="fixed inset-0 bg-black/65 backdrop-blur-sm transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 12 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-[#171717]/[0.10] dark:border-white/[0.10] bg-white dark:bg-[#19191B] text-[#171717] dark:text-[#EDEDED] p-6 shadow-xl sm:p-7 z-10 max-h-[90vh] flex flex-col justify-between"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-lg bg-[#F4F4F5] dark:bg-[#232325] text-[#737373] dark:text-[#85858B] hover:text-[#171717] dark:hover:text-[#EDEDED] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>

          <div className="space-y-5 overflow-y-auto pr-1">
            {/* Header */}
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-[#FB432C]/25 bg-[#FB432C]/[0.08] px-2.5 py-1 text-[11px] font-medium text-[#FB432C]">
                <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
                Windows Desktop Installer
              </span>
              <h2 className="mt-2.5 text-[22px] font-semibold tracking-tight">
                Download XeroxQ Desktop
              </h2>
              <p className="mt-1 text-[13px] text-[#525252] dark:text-[#A1A1A6]">
                Choose the edition that matches your Windows PC or shop print station.
              </p>
            </div>

            {/* Architecture Auto-Detect Banner */}
            <div className="flex items-center justify-between rounded-xl border border-[#16A34A]/25 dark:border-[#4CC38A]/25 bg-[#16A34A]/[0.06] dark:bg-[#4CC38A]/10 p-3.5 text-[#171717] dark:text-[#EDEDED]">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#16A34A] dark:bg-[#4CC38A] text-white dark:text-[#111113]">
                  <Monitor className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-semibold text-[#16A34A] dark:text-[#4CC38A]">Detected system</span>
                    <span className="inline-flex items-center rounded-md bg-[#16A34A]/15 dark:bg-[#4CC38A]/20 px-2 py-0.5 text-[11px] font-medium text-[#16A34A] dark:text-[#4CC38A]">
                      {detectedArch === "x86" ? "32-Bit Windows" : "64-Bit Windows"}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#525252] dark:text-[#A1A1A6]">
                    {detectedArch === "x86"
                      ? "XeroxQ Desktop requires 64-bit Windows 10 or Windows 11."
                      : "Your PC is ready for both the Standard Installer and Portable editions."}
                  </p>
                </div>
              </div>
            </div>

            {/* Download Options Grid — aligned with actual x64 Installer & Portable artifacts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option 1: Windows Installer (NSIS x64) */}
              <div className="relative flex flex-col justify-between rounded-xl border border-[#FB432C] bg-[#F4F4F5]/60 dark:bg-[#232325] p-5 transition-colors">
                <span className="absolute -top-2.5 right-4 rounded-md bg-[#FB432C] px-2.5 py-0.5 text-[11px] font-medium text-white">
                  Recommended
                </span>
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#171717] dark:bg-[#EDEDED] text-white dark:text-[#111113]">
                      <Cpu className="h-4 w-4" strokeWidth={1.75} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[15px]">Windows Installer (x64)</h3>
                      <p className="text-[12px] text-[#737373] dark:text-[#85858B]">Standard Setup (.exe)</p>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-2 text-[12px] text-[#525252] dark:text-[#A1A1A6]">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A] dark:text-[#4CC38A] shrink-0" strokeWidth={1.75} />
                      <span>Optimized for Windows 10 and Windows 11 (64-bit)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A] dark:text-[#4CC38A] shrink-0" strokeWidth={1.75} />
                      <span>Automatic local &amp; USB printer discovery</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A] dark:text-[#4CC38A] shrink-0" strokeWidth={1.75} />
                      <span>Includes Desktop &amp; Start Menu shortcuts</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-5 pt-3 border-t border-[#171717]/[0.08] dark:border-white/[0.08]">
                  <Button
                    asChild
                    className="w-full h-10 rounded-lg bg-[#FB432C] hover:bg-[#E03923] text-white font-medium text-[13px] flex items-center justify-center gap-2"
                  >
                    <a href={`${DOWNLOAD_BASE_URL}/XeroxQ-Setup-x64.exe`} download="XeroxQ-Setup-x64.exe">
                      <Download className="h-4 w-4" strokeWidth={1.75} />
                      <span>Download Installer (.exe)</span>
                    </a>
                  </Button>
                </div>
              </div>

              {/* Option 2: Portable Edition (x64) */}
              <div className="relative flex flex-col justify-between rounded-xl border border-[#171717]/[0.10] dark:border-white/[0.10] bg-white dark:bg-[#19191B] p-5 transition-colors">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#232325] dark:bg-[#EDEDED] text-white dark:text-[#111113]">
                      <HardDrive className="h-4 w-4" strokeWidth={1.75} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-[15px]">Portable Edition (x64)</h3>
                        <span className="rounded-md bg-[#F4F4F5] dark:bg-[#232325] border border-[#171717]/[0.08] dark:border-white/[0.08] px-2 py-0.5 text-[10.5px] font-medium text-[#525252] dark:text-[#A1A1A6]">
                          No install
                        </span>
                      </div>
                      <p className="text-[12px] text-[#737373] dark:text-[#85858B]">Standalone Executable (.exe)</p>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-2 text-[12px] text-[#525252] dark:text-[#A1A1A6]">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A] dark:text-[#4CC38A] shrink-0" strokeWidth={1.75} />
                      <span>Run directly without administrator rights</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A] dark:text-[#4CC38A] shrink-0" strokeWidth={1.75} />
                      <span>Great for USB drives or multi-counter PCs</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A] dark:text-[#4CC38A] shrink-0" strokeWidth={1.75} />
                      <span>Supports USB, network, thermal, and laser printers</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-5 pt-3 border-t border-[#171717]/[0.08] dark:border-white/[0.08]">
                  <Button
                    asChild
                    className="w-full h-10 rounded-lg bg-[#171717] dark:bg-[#EDEDED] hover:bg-[#262626] dark:hover:bg-white text-white dark:text-[#111113] font-medium text-[13px] flex items-center justify-center gap-2"
                  >
                    <a href={`${DOWNLOAD_BASE_URL}/XeroxQ-Portable-x64.exe`} download="XeroxQ-Portable-x64.exe">
                      <Download className="h-4 w-4" strokeWidth={1.75} />
                      <span>Download Portable (.exe)</span>
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            {/* Windows SmartScreen Tip */}
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/[0.08] px-3.5 py-2.5 text-[12px] text-[#525252] dark:text-[#A1A1A6]">
              <Info className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" strokeWidth={1.75} />
              <p className="leading-relaxed">
                If Windows SmartScreen shows <span className="font-semibold text-[#171717] dark:text-[#EDEDED]">&ldquo;Windows protected your PC&rdquo;</span>, click{" "}
                <span className="font-semibold underline">More info</span> and choose{" "}
                <span className="font-semibold text-[#171717] dark:text-[#EDEDED]">&ldquo;Run anyway&rdquo;</span>.
              </p>
            </div>

            {/* Footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#171717]/[0.08] dark:border-white/[0.08] text-[12px] text-[#737373] dark:text-[#85858B]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#16A34A] dark:text-[#4CC38A]" strokeWidth={1.75} />
                <span>Windows 10 &amp; 11 (64-bit) · Installer &amp; Portable (.exe)</span>
              </div>
              <span>Works with all Windows printers</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
