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
          <span className="rounded-full bg-[#F4F4F5] dark:bg-[#232325] px-2.5 py-0.5 text-xs font-medium text-[#737373] dark:text-[#85858B]">
            Removed
          </span>
        );
      case "printed":
        return (
          <span className="rounded-full bg-[#16A34A]/10 dark:bg-[#4CC38A]/15 px-2.5 py-0.5 text-xs font-semibold text-[#16A34A] dark:text-[#4CC38A]">
            Printed
          </span>
        );
      case "active":
        return (
          <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300 tabular-nums">
            Waiting · {formatCountdown(secs)} left
          </span>
        );
      case "expired":
        return (
          <span className="rounded-full bg-[#DC2626]/10 dark:bg-[#E5484D]/15 px-2.5 py-0.5 text-xs font-medium text-[#DC2626] dark:text-[#E5484D]">
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
      className="relative rounded-2xl bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] shadow-[0_1px_2px_rgba(17,17,19,0.04)] p-4"
    >
      {/* Remove button */}
      <button
        type="button"
        aria-label="Remove batch"
        onClick={onRemove}
        className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#F4F4F5] dark:bg-[#232325] text-[#737373] dark:text-[#85858B] transition-colors hover:bg-[#DC2626]/10 hover:text-[#DC2626] dark:hover:bg-[#E5484D]/15 dark:hover:text-[#E5484D]"
      >
        <X className="h-3.5 w-3.5" strokeWidth={2} />
      </button>

      <div className="pr-7">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <p className="text-sm font-semibold text-[#171717] dark:text-[#EDEDED] truncate">
            {batch.shopName}
          </p>
          {badgeContent()}
        </div>
        <p className="text-xs text-[#737373] dark:text-[#85858B] mb-2.5">
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
              className="flex items-center gap-2 text-xs text-[#525252] dark:text-[#A1A1A6]"
            >
              <FileText className="h-3 w-3 shrink-0" strokeWidth={2} />
              <span className="truncate">{f.fileName}</span>
              {f.token && (
                <span className="shrink-0 rounded-md bg-[#F4F4F5] dark:bg-[#232325] px-1.5 py-0.5 font-mono font-semibold text-[#171717] dark:text-[#EDEDED] text-[10px]">
                  #{f.token}
                </span>
              )}
            </div>
          ))}
          {batch.files.length > 3 && (
            <p className="text-xs text-[#737373] dark:text-[#85858B] pl-5">
              +{batch.files.length - 3} more
            </p>
          )}
        </div>

        {/* Resume / Open Shop action */}
        {canResume && (
          <button
            type="button"
            onClick={onResume}
            className="mt-3 inline-flex items-center gap-1 rounded-full bg-[#FB432C]/10 px-3 py-1 text-xs font-semibold text-[#FB432C] transition-colors hover:bg-[#FB432C]/20"
          >
            View Pickup Code
            <ArrowRight className="h-3 w-3" />
          </button>
        )}

        {!isCurrentShop && batch.shopSlug && (
          <Link
            href={`/${batch.shopSlug}`}
            onClick={onNavigate}
            className="mt-3 inline-flex items-center gap-1 rounded-full bg-[#F4F4F5] dark:bg-[#232325] px-3 py-1 text-xs font-semibold text-[#171717] dark:text-[#EDEDED] transition-colors hover:bg-[#E4E4E7] dark:hover:bg-[#2C2C2E]"
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
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F4F4F5] dark:bg-[#232325]">
        <FileText className="h-7 w-7 text-[#737373] dark:text-[#85858B]" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-medium text-[#737373] dark:text-[#85858B]">Nothing printed here yet</p>
    </div>
  );
}

// ─── Shared Tabs Body ─────────────────────────────────────────────────────────

function HistoryTabsBody({
  shopBatches,
  otherBatches,
  onRemove,
  onResumeBatch,
  onClose,
}: {
  shopBatches: StoredBatch[];
  otherBatches: StoredBatch[];
  onRemove: (batchId: string) => void;
  onResumeBatch?: (batch: StoredBatch) => void;
  onClose: () => void;
}) {
  return (
    <Tabs defaultValue="this-shop" className="w-full">
      <TabsList className="mb-4 w-full rounded-2xl bg-[#F4F4F5] dark:bg-[#19191B] border border-[#171717]/[0.06] dark:border-white/[0.08] p-1">
        <TabsTrigger
          value="this-shop"
          className="flex-1 rounded-xl text-xs font-semibold text-[#525252] dark:text-[#A1A1A6] data-[state=active]:bg-white dark:data-[state=active]:bg-[#232325] data-[state=active]:text-[#171717] dark:data-[state=active]:text-[#EDEDED]"
        >
          At This Shop
          {shopBatches.length > 0 && (
            <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FB432C]/15 px-1 text-[10px] font-bold text-[#FB432C]">
              {shopBatches.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger
          value="all-shops"
          className="flex-1 rounded-xl text-xs font-semibold text-[#525252] dark:text-[#A1A1A6] data-[state=active]:bg-white dark:data-[state=active]:bg-[#232325] data-[state=active]:text-[#171717] dark:data-[state=active]:text-[#EDEDED]"
        >
          Other Shops
          {otherBatches.length > 0 && (
            <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#171717]/[0.08] dark:bg-white/[0.10] px-1 text-[10px] font-bold text-[#525252] dark:text-[#A1A1A6]">
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
                  onRemove={() => onRemove(b.batchId)}
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
                  onRemove={() => onRemove(b.batchId)}
                  onNavigate={onClose}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </TabsContent>
    </Tabs>
  );
}

// ─── Inline History Panel (preserves persistent bottom nav bar) ───────────────

export function HistoryPanel({
  currentShopId,
  onResumeBatch,
  onClose,
}: {
  currentShopId: string;
  onResumeBatch?: (batch: StoredBatch) => void;
  onClose: () => void;
}) {
  const [shopBatches, setShopBatches] = useState<StoredBatch[]>([]);
  const [otherBatches, setOtherBatches] = useState<StoredBatch[]>([]);

  const reload = () => {
    loadHistory();
    setShopBatches(getBatchesForShop(currentShopId));
    setOtherBatches(getOtherShopBatches(currentShopId));
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentShopId]);

  const handleRemove = (batchId: string) => {
    removeBatch(batchId);
    reload();
  };

  return (
    <motion.div
      key="history-panel"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
      className="flex-1 w-full min-w-0 flex flex-col gap-4"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[20px] sm:text-[22px] font-bold tracking-[-0.025em] text-[#171717] dark:text-[#EDEDED]">
          Your Recent Prints
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close history"
          className="w-8 h-8 rounded-full bg-[#F4F4F5] dark:bg-[#232325] text-[#525252] dark:text-[#A1A1A6] hover:text-[#171717] dark:hover:text-[#EDEDED] flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      <HistoryTabsBody
        shopBatches={shopBatches}
        otherBatches={otherBatches}
        onRemove={handleRemove}
        onResumeBatch={onResumeBatch}
        onClose={onClose}
      />
    </motion.div>
  );
}

// ─── Main component (Sheet drawer wrapper) ────────────────────────────────────

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
        className="flex w-full flex-col bg-[#FAFAFA] dark:bg-[#111113] border-l border-[#171717]/[0.08] dark:border-white/[0.08] p-0 sm:max-w-sm"
      >
        <SheetHeader className="border-b border-[#171717]/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#19191B] px-5 py-4">
          <SheetTitle className="text-base font-semibold text-[#171717] dark:text-[#EDEDED]">
            Your Recent Prints
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 pb-8 pt-4">
          <HistoryTabsBody
            shopBatches={shopBatches}
            otherBatches={otherBatches}
            onRemove={handleRemove}
            onResumeBatch={onResumeBatch}
            onClose={onClose}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
