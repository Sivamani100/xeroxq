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
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15">
        <CheckCircle2 className="h-4 w-4 text-emerald-500" strokeWidth={2.5} />
      </span>
    );
  }
  if (status === "active") {
    return (
      <span className="relative flex h-5 w-5 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#3568FF] opacity-30" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-[#3568FF]" />
      </span>
    );
  }
  return (
    <span className="flex h-5 w-5 items-center justify-center">
      <span className="inline-flex h-2.5 w-2.5 rounded-full bg-black/20" />
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
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          className={cn(
            "relative overflow-hidden rounded-[28px] bg-white/75 backdrop-blur-2xl",
            "border border-black/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.08)]",
            isActive && "border-t-2 border-t-[#3568FF]"
          )}
        >
          {/* Blue shimmer top highlight */}
          {isActive && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-10"
              style={{
                background:
                  "radial-gradient(ellipse 60% 40% at 50% 0%, #3568FF 0%, transparent 100%)",
              }}
            />
          )}

          <div className="relative z-10 p-6 sm:p-8">
            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
              {conversionError ? (
                <XCircle
                  className="h-5 w-5 text-red-500"
                  strokeWidth={2.5}
                />
              ) : isActive ? (
                <Loader2
                  className="h-5 w-5 animate-spin text-[#3568FF]"
                  strokeWidth={2.5}
                />
              ) : (
                <CheckCircle2
                  className="h-5 w-5 text-emerald-500"
                  strokeWidth={2.5}
                />
              )}
              <h3 className="text-base font-semibold text-black">
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
                          "font-semibold text-black",
                        status === "done" &&
                          "font-medium text-black/60 line-through decoration-black/30",
                        status === "pending" && "text-black/40"
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
                    <div className="mb-1.5 flex justify-between text-xs font-medium text-black/50">
                      <span>Sending files</span>
                      <span>{Math.round(progress.percent)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-black/[0.06]">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          background:
                            "linear-gradient(90deg, #3568FF 0%, #6B93FF 100%)",
                        }}
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
                  className="mt-5 overflow-hidden rounded-2xl border border-red-500/20 bg-red-50/60 p-4 backdrop-blur"
                >
                  <div className="flex items-start gap-2.5">
                    <XCircle
                      className="mt-0.5 h-4 w-4 shrink-0 text-red-500"
                      strokeWidth={2}
                    />
                    <p className="text-sm text-red-700">
                      <span className="font-semibold">Couldn&apos;t prepare file: </span>
                      {conversionError}
                    </p>
                  </div>

                  <div className="mt-3.5 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={onRetryConvert}
                      className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(251,67,44,0.35)] transition-opacity hover:opacity-90 active:opacity-80"
                      style={{
                        background:
                          "linear-gradient(135deg,#FB432C 0%,#FF591E 100%)",
                      }}
                    >
                      <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.5} />
                      Try Again
                    </button>

                    <button
                      type="button"
                      onClick={onSendRawInstead}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white/60 px-4 py-2 text-sm font-medium text-black/70 backdrop-blur transition-colors hover:bg-white/90 hover:text-black active:scale-[0.98]"
                    >
                      <SendHorizontal className="h-3.5 w-3.5" strokeWidth={2} />
                      Send Original File
                    </button>

                    {onCancel && (
                      <button
                        type="button"
                        onClick={onCancel}
                        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-black/50 transition-colors hover:text-black"
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
