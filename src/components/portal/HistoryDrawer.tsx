"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, FileText, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getBatchesForShop,
  getOtherShopBatches,
  loadHistory,
  removeBatch,
  type StoredBatch,
} from "@/lib/customer-storage";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  currentShopId: string;
  onResumeBatch?: (batch: StoredBatch) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function getRemainingSeconds(expiresAt: string): number {
  try {
    return Math.max(
      0,
      Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)
    );
  } catch {
    return 0;
  }
}

function formatCountdown(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

type BatchBadgeStatus = "expired-deleted" | "printed" | "active" | "expired";

function getBatchStatus(batch: StoredBatch): BatchBadgeStatus {
  const allGone = batch.files.every(
    (f) => f.isDeleted || f.deletionReason === "policy"
  );
  if (allGone) return "expired-deleted";
  if (batch.files.some((f) => f.status === "printed")) return "printed";
  const secs = getRemainingSeconds(batch.expiresAt);
  if (secs > 0) return "active";
  return "expired";
}

// ─── Batch card ───────────────────────────────────────────────────────────────

function BatchCard({
  batch,
  isCurrentShop,
  onRemove,
  onResume,
  onNavigate,
}: {
  batch: StoredBatch;
  isCurrentShop: boolean;
  onRemove: () => void;
  onResume?: () => void;
  onNavigate?: () => void;
}) {
  const status = getBatchStatus(batch);
  const [secs, setSecs] = useState(() => getRemainingSeconds(batch.expiresAt));

  useEffect(() => {
    if (status !== "active") return;
    const id = setInterval(() => {
      setSecs(getRemainingSeconds(batch.expiresAt));
    }, 1000);
    return () => clearInterval(id);
  }, [status, batch.expiresAt]);

  const canResume =
    isCurrentShop &&
    Boolean(onResume) &&
    (status === "active" || status === "printed") &&
    batch.files.some((f) => Boolean(f.jobId));

  const badgeContent = () => {
    switch (status) {
      case "expired-deleted":
        return (
          <span className="rounded-full bg-black/[0.07] px-2.5 py-0.5 text-xs font-medium text-black/50">
            Removed
          </span>
        );
      case "printed":
        return (
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
            Printed ✓
          </span>
        );
      case "active":
        return (
          <span className="rounded-full bg-amber-400/15 px-2.5 py-0.5 text-xs font-semibold text-amber-700 tabular-nums">
            Waiting · {formatCountdown(secs)} left
          </span>
        );
      case "expired":
        return (
          <span className="rounded-full bg-red-100/60 px-2.5 py-0.5 text-xs font-medium text-red-500">
            Timed Out
          </span>
        );
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 24, scale: 0.96 }}
      transition={{ duration: 0.25 }}
      className="relative rounded-2xl bg-white/75 backdrop-blur-2xl border border-black/[0.06] shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-4"
    >
      {/* Remove button */}
      <button
        type="button"
        aria-label="Remove batch"
        onClick={onRemove}
        className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-black/[0.05] text-black/40 transition-colors hover:bg-red-100 hover:text-red-500"
      >
        <X className="h-3.5 w-3.5" strokeWidth={2.5} />
      </button>

      <div className="pr-7">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <p className="text-sm font-semibold text-[#1A1A2E] truncate">
            {batch.shopName}
          </p>
          {badgeContent()}
        </div>
        <p className="text-xs text-black/40 mb-2.5">
          {formatDate(batch.createdAt)} ·{" "}
          {batch.files.length === 1
            ? "1 file"
            : `${batch.files.length} files`}
        </p>

        {/* File mini list */}
        <div className="space-y-1">
          {batch.files.slice(0, 3).map((f, idx) => (
            <div
              key={f.jobId || `${batch.batchId}-${idx}`}
              className="flex items-center gap-2 text-xs text-black/60"
            >
              <FileText className="h-3 w-3 shrink-0" strokeWidth={2} />
              <span className="truncate">{f.fileName}</span>
              {f.token && (
                <span className="shrink-0 rounded-md bg-black/[0.06] px-1.5 py-0.5 font-mono font-semibold text-black/70 text-[10px]">
                  #{f.token}
                </span>
              )}
            </div>
          ))}
          {batch.files.length > 3 && (
            <p className="text-xs text-black/40 pl-5">
              +{batch.files.length - 3} more
            </p>
          )}
        </div>

        {/* Resume / Open Shop action */}
        {canResume && (
          <button
            type="button"
            onClick={onResume}
            className="mt-3 inline-flex items-center gap-1 rounded-full bg-[#3568FF]/10 px-3 py-1 text-xs font-semibold text-[#3568FF] transition-colors hover:bg-[#3568FF]/20"
          >
            View Pickup Code
            <ArrowRight className="h-3 w-3" />
          </button>
        )}

        {!isCurrentShop && batch.shopSlug && (
          <Link
            href={`/${batch.shopSlug}`}
            onClick={onNavigate}
            className="mt-3 inline-flex items-center gap-1 rounded-full bg-black/[0.06] px-3 py-1 text-xs font-semibold text-[#1A1A2E] transition-colors hover:bg-black/10"
          >
            Open Shop
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </motion.div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black/[0.05]">
        <FileText className="h-7 w-7 text-black/30" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-medium text-black/40">Nothing printed here yet</p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function HistoryDrawer({
  open,
  onClose,
  currentShopId,
  onResumeBatch,
}: Props) {
  const [shopBatches, setShopBatches] = useState<StoredBatch[]>([]);
  const [otherBatches, setOtherBatches] = useState<StoredBatch[]>([]);

  const reload = () => {
    loadHistory();
    setShopBatches(getBatchesForShop(currentShopId));
    setOtherBatches(getOtherShopBatches(currentShopId));
  };

  useEffect(() => {
    if (open) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentShopId]);

  const handleRemove = (batchId: string) => {
    removeBatch(batchId);
    reload();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col bg-gradient-to-br from-white/95 to-white/80 backdrop-blur-3xl border-l border-black/[0.06] p-0 sm:max-w-sm"
      >
        <SheetHeader className="border-b border-black/[0.06] px-5 py-4">
          <SheetTitle className="text-base font-bold text-[#1A1A2E]">
            Your Recent Prints
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 pb-8 pt-4">
          <Tabs defaultValue="this-shop">
            <TabsList className="mb-4 w-full rounded-2xl bg-black/[0.05] p-1">
              <TabsTrigger
                value="this-shop"
                className="flex-1 rounded-xl text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                At This Shop
                {shopBatches.length > 0 && (
                  <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#3568FF]/15 px-1 text-[10px] font-bold text-[#3568FF]">
                    {shopBatches.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="all-shops"
                className="flex-1 rounded-xl text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Other Shops
                {otherBatches.length > 0 && (
                  <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-black/[0.08] px-1 text-[10px] font-bold text-black/50">
                    {otherBatches.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="this-shop">
              <AnimatePresence mode="popLayout" initial={false}>
                {shopBatches.length === 0 ? (
                  <EmptyState key="empty-shop" />
                ) : (
                  <div className="space-y-3" key="list-shop">
                    {shopBatches.map((b) => (
                      <BatchCard
                        key={b.batchId}
                        batch={b}
                        isCurrentShop
                        onRemove={() => handleRemove(b.batchId)}
                        onResume={
                          onResumeBatch
                            ? () => {
                                onResumeBatch(b);
                                onClose();
                              }
                            : undefined
                        }
                      />
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </TabsContent>

            <TabsContent value="all-shops">
              <AnimatePresence mode="popLayout" initial={false}>
                {otherBatches.length === 0 ? (
                  <EmptyState key="empty-all" />
                ) : (
                  <div className="space-y-3" key="list-all">
                    {otherBatches.map((b) => (
                      <BatchCard
                        key={b.batchId}
                        batch={b}
                        isCurrentShop={false}
                        onRemove={() => handleRemove(b.batchId)}
                        onNavigate={onClose}
                      />
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
