"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  MessageSquarePlus,
  ShieldCheck,
  Smartphone,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import cn from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Shop {
  id: string;
  name: string;
  slug: string;
  upi_id?: string;
  price_mono?: number;
  price_color?: number;
  is_open?: boolean;
  require_customer_name?: boolean;
  show_copies?: boolean;
  show_color_mode?: boolean;
  show_duplex?: boolean;
  generate_token?: boolean;
  accept_preorders?: boolean;
  contact_number?: string;
  feedback_enabled?: boolean;
  custom_feedback_enabled?: boolean;
  custom_feedback_title?: string;
  total_files_processed?: number;
  approval_status?: string;
  is_active?: boolean;
}

interface Props {
  shop: Shop;
  batchTokens: { token: string; fileName: string; jobId: string }[];
  jobStatus: string;
  isDeleted: boolean;
  deletionReason: "user" | "policy" | null;
  isDeleting: boolean;
  mode: "shop" | "home";
  estimatedTotal: number;
  expiresAt?: string | null;
  customerName?: string;
  feedbackSubmitted: boolean;
  onDelete: () => void;
  onUploadAnother: () => void;
  onOpenFeedback: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TIMER_INIT = 300; // 5 minutes

function computeRemainingSeconds(expiresAt?: string | null): number {
  if (!expiresAt) return TIMER_INIT;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (Number.isNaN(ms)) return TIMER_INIT;
  return Math.max(0, Math.floor(ms / 1000));
}

function formatCountdown(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function StatusPill({ status }: { status: string }) {
  if (status === "printed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#16A34A]/10 dark:bg-[#4CC38A]/15 px-3 py-1 text-xs font-semibold text-[#16A34A] dark:text-[#4CC38A] border border-[#16A34A]/20 dark:border-[#4CC38A]/25">
        <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
        Printed
      </span>
    );
  }
  if (status === "ready") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#16A34A]/10 dark:bg-[#4CC38A]/15 px-3 py-1 text-xs font-semibold text-[#16A34A] dark:text-[#4CC38A] border border-[#16A34A]/20 dark:border-[#4CC38A]/25">
        <span className="inline-flex h-2 w-2 rounded-full bg-[#16A34A] dark:bg-[#4CC38A]" />
        Ready to Collect
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F4F4F5] dark:bg-[#232325] px-3 py-1 text-xs font-semibold text-[#171717] dark:text-[#EDEDED]">
      <Clock className="h-3 w-3 text-[#FB432C]" strokeWidth={2} />
      Sent to Shop
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ActiveTicketView({
  shop,
  batchTokens,
  jobStatus,
  isDeleted,
  deletionReason,
  isDeleting,
  mode,
  estimatedTotal,
  expiresAt,
  customerName,
  feedbackSubmitted,
  onDelete,
  onUploadAnother,
  onOpenFeedback,
}: Props) {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    computeRemainingSeconds(expiresAt)
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const prevStatusRef = useRef(jobStatus);

  useEffect(() => {
    setSecondsLeft(computeRemainingSeconds(expiresAt));
  }, [expiresAt]);

  useEffect(() => {
    if (isDeleted || jobStatus === "printed") return;
    const id = setInterval(() => {
      setSecondsLeft((s) =>
        expiresAt ? computeRemainingSeconds(expiresAt) : Math.max(0, s - 1)
      );
    }, 1000);
    return () => clearInterval(id);
  }, [isDeleted, jobStatus, expiresAt]);

  useEffect(() => {
    if (prevStatusRef.current !== "printed" && jobStatus === "printed") {
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } catch {}
      try {
        navigator.vibrate([200, 100, 200]);
      } catch {}
    }
    prevStatusRef.current = jobStatus;
  }, [jobStatus]);

  const isSingle = batchTokens.length === 1;
  const isPrinted = jobStatus === "printed";
  const timedOut = secondsLeft === 0;
  const showTokens = shop.generate_token !== false;
  const pctLeft = Math.min(100, Math.max(0, (secondsLeft / TIMER_INIT) * 100));

  const cleanName = (customerName || "").trim();
  const hasRealName = cleanName.length > 0 && cleanName.toLowerCase() !== "guest";

  const upiUri = shop.upi_id
    ? `upi://pay?pa=${encodeURIComponent(shop.upi_id)}&pn=${encodeURIComponent(
        shop.name
      )}&am=${Math.max(0, estimatedTotal).toFixed(2)}&cu=INR&tn=${encodeURIComponent(
        `XeroxQ ${batchTokens[0]?.token ?? ""}`.trim()
      )}`
    : "";

  const handleCopyUpi = () => {
    if (!shop.upi_id) return;
    navigator.clipboard?.writeText(shop.upi_id).catch(() => {});
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // Clear natural instruction matching whether customer entered a real name & whether pickup code is enabled
  const counterInstruction = (() => {
    if (isSingle) {
      if (showTokens) {
        if (mode === "home") {
          return hasRealName
            ? `Show this code (or tell your name, ${cleanName}) when you come to collect.`
            : "Show this code (or tell your file name above) when you come to collect.";
        }
        return hasRealName
          ? `Tell code ${batchTokens[0]?.token} (or your name, ${cleanName}) at the ${shop.name} counter.`
          : `Show this code at the ${shop.name} counter to collect your print.`;
      }
      return hasRealName
        ? `Sent to ${shop.name}! Tell your name (${cleanName}) at the counter.`
        : `Sent to ${shop.name}! Tell the file name above at the counter to collect your print.`;
    }
    if (showTokens) {
      return hasRealName
        ? `Show these pickup numbers (or tell your name, ${cleanName}) at ${shop.name}.`
        : `Show these pickup numbers at the ${shop.name} counter to collect your prints.`;
    }
    return hasRealName
      ? `Sent to ${shop.name}! Tell your name (${cleanName}) at the counter.`
      : `Sent to ${shop.name}! Tell the file names above at the counter to collect your prints.`;
  })();

  // ── Deleted state ──────────────────────────────────────────────────────────
  if (isDeleted) {
    return (
      <motion.div
        key="deleted-card"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full min-w-0 rounded-[20px] bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] shadow-[0_1px_2px_rgba(17,17,19,0.04)] p-6 sm:p-8 text-center"
      >
        <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-[#F4F4F5] dark:bg-[#232325] flex items-center justify-center">
          {deletionReason === "policy" ? (
            <ShieldCheck className="w-7 h-7 text-[#16A34A] dark:text-[#4CC38A]" />
          ) : (
            <Trash2 className="w-7 h-7 text-[#737373] dark:text-[#85858B]" />
          )}
        </div>
        <h3 className="text-lg font-semibold text-[#171717] dark:text-[#EDEDED] mb-1.5">
          {deletionReason === "policy"
            ? "File removed after 5 minutes"
            : "File deleted"}
        </h3>
        <p className="text-sm text-[#525252] dark:text-[#A1A1A6] mb-6 leading-relaxed">
          {deletionReason === "policy"
            ? "For your privacy, unprinted files are automatically deleted after 5 minutes."
            : "You cancelled printing and removed your file. It is completely gone now."}
        </p>
        <button
          type="button"
          onClick={onUploadAnother}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#FB432C] hover:bg-[#E03923] px-6 h-12 text-sm font-semibold text-white transition-colors"
        >
          <UploadCloud className="h-4 w-4" strokeWidth={2} />
          Print Another File
        </button>
      </motion.div>
    );
  }

  // ── Printed state ──────────────────────────────────────────────────────────
  if (isPrinted) {
    return (
      <motion.div
        key="printed-card"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full min-w-0 rounded-[20px] bg-white dark:bg-[#19191B] border border-[#16A34A]/30 dark:border-[#4CC38A]/30 shadow-[0_1px_2px_rgba(17,17,19,0.04)] p-6 sm:p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-[#16A34A]/10 dark:bg-[#4CC38A]/15 border border-[#16A34A]/20 dark:border-[#4CC38A]/25 flex items-center justify-center"
        >
          <CheckCircle2 className="w-8 h-8 text-[#16A34A] dark:text-[#4CC38A]" strokeWidth={2} />
        </motion.div>
        <h3 className="text-xl font-semibold text-[#171717] dark:text-[#EDEDED] mb-1">
          Your Print is Ready!
        </h3>
        <p className="text-sm text-[#525252] dark:text-[#A1A1A6] mb-6">
          Collect your pages from{" "}
          <span className="font-semibold text-[#171717] dark:text-[#EDEDED]">{shop.name}</span>.
        </p>

        <div className="flex flex-col gap-2.5">
          {shop.feedback_enabled !== false && (
            <div>
              {feedbackSubmitted ? (
                <p className="text-sm font-semibold text-[#16A34A] dark:text-[#4CC38A] py-2">
                  Thank you for your feedback!
                </p>
              ) : (
                <button
                  type="button"
                  onClick={onOpenFeedback}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#171717]/[0.08] dark:border-white/[0.10] bg-[#F4F4F5] dark:bg-[#232325] hover:bg-[#E4E4E7] dark:hover:bg-[#2C2C2E] px-5 h-12 text-sm font-semibold text-[#171717] dark:text-[#EDEDED] transition-colors"
                >
                  <MessageSquarePlus className="h-4 w-4 text-[#FB432C]" strokeWidth={2} />
                  Rate Your Experience
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={onUploadAnother}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#FB432C] hover:bg-[#E03923] px-5 h-12 text-sm font-semibold text-white transition-colors"
          >
            <UploadCloud className="h-4 w-4" strokeWidth={2} />
            Print Another File
          </button>
        </div>
      </motion.div>
    );
  }

  // ── Active Wallet / Boarding Pass Ticket ───────────────────────────────────
  return (
    <motion.div
      key="ticket-card"
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="w-full min-w-0 rounded-[20px] bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] shadow-[0_1px_2px_rgba(17,17,19,0.04)] overflow-hidden"
    >
      {/* Top Header Strip */}
      <div className="p-4 sm:p-6 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <StatusPill status={jobStatus} />
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] sm:text-[11.5px] font-semibold tabular-nums",
              timedOut
                ? "bg-[#F4F4F5] dark:bg-[#232325] text-[#737373] dark:text-[#85858B]"
                : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25"
            )}
          >
            {timedOut ? "Removing file…" : `Deletes in ${formatCountdown(secondsLeft)}`}
          </span>
        </div>

        {/* Smooth 5-minute countdown bar */}
        <div className="h-1 w-full rounded-full bg-[#F4F4F5] dark:bg-[#232325] overflow-hidden mb-4 sm:mb-5">
          <div
            className="h-full rounded-full bg-[#FB432C] transition-all duration-1000 ease-linear"
            style={{ width: `${pctLeft}%` }}
          />
        </div>

        {/* Hero Pickup Code Pass */}
        {isSingle ? (
          <div className="w-full min-w-0 rounded-[16px] bg-[#F4F4F5] dark:bg-[#232325] border border-[#171717]/[0.06] dark:border-white/[0.07] px-4 py-5 sm:px-5 sm:py-6 text-center overflow-hidden">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#737373] dark:text-[#85858B] mb-1.5">
              {showTokens ? "Your Pickup Number" : "File Sent to Shop"}
            </p>
            {showTokens ? (
              <div
                className="font-bold leading-none text-[#FB432C] select-all tracking-tight tabular-nums"
                style={{ fontSize: "clamp(48px,13vw,76px)" }}
              >
                {batchTokens[0]?.token ?? "—"}
              </div>
            ) : (
              <div className="my-2 inline-flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-[#16A34A]/10 dark:bg-[#4CC38A]/15 text-[#16A34A] dark:text-[#4CC38A] border border-[#16A34A]/20 dark:border-[#4CC38A]/25">
                <CheckCircle2 className="h-8 w-8 sm:h-9 sm:w-9" strokeWidth={2} />
              </div>
            )}
            <p className="mt-3 text-[13.5px] font-semibold text-[#171717] dark:text-[#EDEDED] [overflow-wrap:anywhere] max-w-full px-1">
              {batchTokens[0]?.fileName}
            </p>
            <p className="mt-1.5 text-[12.5px] text-[#525252] dark:text-[#A1A1A6] leading-snug max-w-xs mx-auto">
              {counterInstruction}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#737373] dark:text-[#85858B] mb-2">
              {showTokens
                ? `Your Pickup Numbers (${batchTokens.length} files)`
                : `Sent Files (${batchTokens.length})`}
            </p>
            {batchTokens.map((t) => (
              <div
                key={t.jobId}
                className="flex items-center gap-3 rounded-2xl bg-[#F4F4F5] dark:bg-[#232325] border border-[#171717]/[0.06] dark:border-white/[0.07] px-3.5 py-2.5"
              >
                {showTokens ? (
                  <span className="shrink-0 rounded-xl bg-[#FB432C] px-3 py-1 text-sm font-bold text-white tabular-nums">
                    {t.token}
                  </span>
                ) : (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-[#16A34A] dark:text-[#4CC38A]" />
                )}
                <span className="truncate text-[13px] text-[#171717] dark:text-[#EDEDED] font-medium min-w-0">
                  {t.fileName}
                </span>
              </div>
            ))}
            <p className="pt-1.5 text-[12px] text-[#525252] dark:text-[#A1A1A6]">
              {counterInstruction}
            </p>
          </div>
        )}
      </div>

      {/* Wallet Perforated Notches Divider */}
      <div className="relative flex items-center justify-between">
        <span className="w-3.5 h-7 rounded-r-full bg-[#FAFAFA] dark:bg-[#111113] border-r border-y border-[#171717]/[0.08] dark:border-white/[0.08] -ml-px" />
        <div className="flex-1 border-t border-dashed border-[#171717]/[0.12] dark:border-white/[0.12] mx-2" />
        <span className="w-3.5 h-7 rounded-l-full bg-[#FAFAFA] dark:bg-[#111113] border-l border-y border-[#171717]/[0.08] dark:border-white/[0.08] -mr-px" />
      </div>

      {/* Order Ahead UPI Section */}
      {mode === "home" && (
        <div className="mx-5 sm:mx-6 mt-4 rounded-2xl bg-[#F4F4F5] dark:bg-[#232325] border border-[#171717]/[0.06] dark:border-white/[0.07] p-4 space-y-3">
          {shop.upi_id ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="shrink-0 self-center sm:self-start rounded-2xl bg-white p-2 border border-[#171717]/[0.08]">
                  <QRCodeSVG
                    value={upiUri}
                    size={104}
                    bgColor="#ffffff"
                    fgColor="#111827"
                    level="M"
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <Smartphone className="h-4 w-4 text-[#FB432C] shrink-0" />
                    <span className="text-sm font-semibold text-[#171717] dark:text-[#EDEDED] tabular-nums">
                      Pay by UPI · ₹{Math.max(0, estimatedTotal).toFixed(2)}
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-xl bg-white dark:bg-[#19191B] px-2.5 py-1 border border-[#171717]/[0.08] dark:border-white/[0.08] max-w-full">
                    <span className="text-xs font-mono text-[#525252] dark:text-[#A1A1A6] truncate">
                      {shop.upi_id}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="text-xs font-semibold text-[#FB432C] hover:opacity-80 shrink-0 inline-flex items-center gap-1"
                    >
                      {copiedUpi ? (
                        <>
                          <Check className="h-3 w-3" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" /> Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <a
                href={upiUri}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#FB432C] hover:bg-[#E03923] px-4 py-2.5 text-sm font-semibold text-white transition-colors"
              >
                <Smartphone className="h-4 w-4" strokeWidth={2} />
                Pay with UPI App
              </a>
            </>
          ) : null}

          <p className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/25 rounded-xl px-3 py-1.5 font-medium">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            Waiting for shop to check your payment
          </p>

          {shop.contact_number && (
            <p className="text-xs text-[#525252] dark:text-[#A1A1A6]">
              Call shop:{" "}
              <a
                href={`tel:${shop.contact_number}`}
                className="font-semibold text-[#171717] dark:text-[#EDEDED] underline underline-offset-2"
              >
                {shop.contact_number}
              </a>
            </p>
          )}
        </div>
      )}

      {/* Bottom Footer Actions */}
      <div className="p-5 sm:p-6 pt-4 space-y-2">
        <AnimatePresence mode="wait">
          {confirmDelete ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl border border-[#DC2626]/20 dark:border-[#E5484D]/25 bg-[#DC2626]/10 dark:bg-[#E5484D]/15 p-3.5">
                <p className="text-[13px] font-semibold text-[#DC2626] dark:text-[#E5484D] mb-2.5">
                  Stop printing and remove this file now?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 rounded-xl border border-[#171717]/[0.10] dark:border-white/[0.10] bg-white dark:bg-[#19191B] py-2 text-xs font-semibold text-[#171717] dark:text-[#EDEDED] hover:bg-[#F4F4F5] dark:hover:bg-[#232325]"
                  >
                    Keep File
                  </button>
                  <button
                    type="button"
                    onClick={onDelete}
                    disabled={isDeleting}
                    className="flex-1 rounded-xl bg-[#DC2626] dark:bg-[#E5484D] py-2 text-xs font-semibold text-white hover:opacity-95 disabled:opacity-60"
                  >
                    {isDeleting ? "Removing…" : "Yes, Delete"}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="delete-btn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#DC2626]/25 dark:border-[#E5484D]/25 py-2.5 text-[13px] font-semibold text-[#DC2626] dark:text-[#E5484D] transition-colors hover:bg-[#DC2626]/10 dark:hover:bg-[#E5484D]/15"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
              Cancel &amp; Delete File
            </motion.button>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={onUploadAnother}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-[12.5px] font-semibold text-[#525252] dark:text-[#A1A1A6] transition-colors hover:bg-[#F4F4F5] dark:hover:bg-[#232325] hover:text-[#171717] dark:hover:text-[#EDEDED]"
        >
          <UploadCloud className="h-3.5 w-3.5" strokeWidth={2} />
          Print Another File
        </button>
      </div>
    </motion.div>
  );
}
