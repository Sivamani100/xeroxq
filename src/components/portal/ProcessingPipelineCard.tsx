"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Loader2,
  RefreshCw,
  SendHorizontal,
  XCircle,
} from "lucide-react";
import cn from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type StepKey = "validating" | "converting" | "uploading" | "registering" | "done";

interface Props {
  visible: boolean;
  isConverting: boolean;
  isUploading: boolean;
  progress: {
    current: number;
    total: number;
    percent: number;
    fileName: string;
  } | null;
  currentStep: StepKey;
  conversionError: string | null;
  onRetryConvert: () => void;
  onSendRawInstead: () => void;
  onCancel?: () => void;
}

// ─── Step definitions ─────────────────────────────────────────────────────────

interface StepDef {
  key: StepKey;
  label: (progress: Props["progress"]) => string;
  /** Only show when converting is true */
  onlyWhenConverting?: boolean;
}

const STEPS: StepDef[] = [
  {
    key: "validating",
    label: () => "Checking your files",
  },
  {
    key: "converting",
    label: () => "Preparing your document for printing",
    onlyWhenConverting: true,
  },
  {
    key: "uploading",
    label: (p) =>
      p
        ? `Sending ${p.current} of ${p.total} — ${p.fileName}`
        : "Sending to shop",
  },
  {
    key: "registering",
    label: () => "Getting your pickup number",
  },
];

const STEP_ORDER: StepKey[] = [
  "validating",
  "converting",
  "uploading",
  "registering",
  "done",
];

function getStepStatus(
  stepKey: StepKey,
  currentStep: StepKey
): "pending" | "active" | "done" {
  const stepIdx = STEP_ORDER.indexOf(stepKey);
  const curIdx = STEP_ORDER.indexOf(currentStep);
  if (curIdx > stepIdx) return "done";
  if (curIdx === stepIdx) return "active";
  return "pending";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepIndicator({ status }: { status: "pending" | "active" | "done" }) {
  if (status === "done") {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#16A34A]/15 dark:bg-[#4CC38A]/15">
        <CheckCircle2 className="h-4 w-4 text-[#16A34A] dark:text-[#4CC38A]" strokeWidth={2} />
      </span>
    );
  }
  if (status === "active") {
    return (
      <span className="flex h-5 w-5 items-center justify-center">
        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#FB432C]" />
      </span>
    );
  }
  return (
    <span className="flex h-5 w-5 items-center justify-center">
      <span className="inline-flex h-2 w-2 rounded-full bg-[#171717]/20 dark:bg-white/20" />
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProcessingPipelineCard({
  visible,
  isConverting,
  isUploading,
  progress,
  currentStep,
  conversionError,
  onRetryConvert,
  onSendRawInstead,
  onCancel,
}: Props) {
  const isActive = currentStep !== "done" && !conversionError;

  const visibleSteps = STEPS.filter(
    (s) => !s.onlyWhenConverting || isConverting
  );

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="pipeline-card"
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.97 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className={cn(
            "relative overflow-hidden rounded-[20px] bg-white dark:bg-[#19191B]",
            "border border-[#171717]/[0.08] dark:border-white/[0.08] shadow-[0_1px_2px_rgba(17,17,19,0.04)]",
            isActive && "border-t-2 border-t-[#FB432C]"
          )}
        >
          <div className="relative z-10 p-6 sm:p-8">
            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
              {conversionError ? (
                <XCircle
                  className="h-5 w-5 text-[#DC2626] dark:text-[#E5484D]"
                  strokeWidth={2}
                />
              ) : isActive ? (
                <Loader2
                  className="h-5 w-5 animate-spin text-[#FB432C]"
                  strokeWidth={2}
                />
              ) : (
                <CheckCircle2
                  className="h-5 w-5 text-[#16A34A] dark:text-[#4CC38A]"
                  strokeWidth={2}
                />
              )}
              <h3 className="text-base font-semibold text-[#171717] dark:text-[#EDEDED]">
                {conversionError
                  ? "Couldn't prepare this file"
                  : isActive
                  ? "Sending to the shop…"
                  : "All done!"}
              </h3>
            </div>

            {/* Steps list */}
            <ol className="flex flex-col gap-3">
              {visibleSteps.map((step) => {
                const status = getStepStatus(step.key, currentStep);
                return (
                  <li key={step.key} className="flex items-center gap-3">
                    <StepIndicator status={status} />
                    <span
                      className={cn(
                        "text-sm transition-colors",
                        status === "active" &&
                          "font-semibold text-[#171717] dark:text-[#EDEDED]",
                        status === "done" &&
                          "font-medium text-[#737373] dark:text-[#85858B] line-through decoration-[#171717]/25 dark:decoration-white/25",
                        status === "pending" && "text-[#737373] dark:text-[#85858B]"
                      )}
                    >
                      {step.label(progress)}
                    </span>
                  </li>
                );
              })}
            </ol>

            {/* Progress bar (shown when uploading) */}
            <AnimatePresence>
              {isUploading && progress && (
                <motion.div
                  key="progress-bar"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="mt-5">
                    <div className="mb-1.5 flex justify-between text-xs font-medium text-[#525252] dark:text-[#A1A1A6]">
                      <span>Sending files</span>
                      <span className="tabular-nums">{Math.round(progress.percent)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#F4F4F5] dark:bg-[#232325]">
                      <motion.div
                        className="h-full rounded-full bg-[#FB432C]"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress.percent}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Conversion error */}
            <AnimatePresence>
              {conversionError && (
                <motion.div
                  key="conv-error"
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className="mt-5 overflow-hidden rounded-2xl border border-[#DC2626]/20 dark:border-[#E5484D]/25 bg-[#DC2626]/10 dark:bg-[#E5484D]/15 p-4"
                >
                  <div className="flex items-start gap-2.5">
                    <XCircle
                      className="mt-0.5 h-4 w-4 shrink-0 text-[#DC2626] dark:text-[#E5484D]"
                      strokeWidth={2}
                    />
                    <p className="text-sm text-[#DC2626] dark:text-[#E5484D]">
                      <span className="font-semibold">Couldn&apos;t prepare file: </span>
                      {conversionError}
                    </p>
                  </div>

                  <div className="mt-3.5 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={onRetryConvert}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#FB432C] hover:bg-[#E03923] px-4 py-2 text-sm font-semibold text-white transition-colors active:opacity-80"
                    >
                      <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
                      Try Again
                    </button>

                    <button
                      type="button"
                      onClick={onSendRawInstead}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#171717]/[0.10] dark:border-white/[0.10] bg-white dark:bg-[#232325] px-4 py-2 text-sm font-medium text-[#171717] dark:text-[#EDEDED] transition-colors hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2E] active:scale-[0.98]"
                    >
                      <SendHorizontal className="h-3.5 w-3.5" strokeWidth={2} />
                      Send Original File
                    </button>

                    {onCancel && (
                      <button
                        type="button"
                        onClick={onCancel}
                        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-[#525252] dark:text-[#A1A1A6] transition-colors hover:text-[#171717] dark:hover:text-[#EDEDED]"
                      >
                        Go Back
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
