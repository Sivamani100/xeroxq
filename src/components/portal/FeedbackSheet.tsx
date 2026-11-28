"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Star, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
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

interface RawFeedbackRow {
  question_id: string;
  question_text: string;
  question_type: string;
  options: string[] | string | null;
  is_required: boolean;
  display_order: number;
  source: "default" | "custom";
}

interface FeedbackQuestion {
  state_key: string;
  question_id: string;
  question_text: string;
  question_type: string;
  options: string[];
  is_required: boolean;
  display_order: number;
  source: "default" | "custom";
}

interface Props {
  open: boolean;
  shop: Shop;
  jobId: string;
  token: string;
  customerName?: string;
  customerPhone?: string;
  onClose: () => void;
  onSubmitted: () => void;
}

type ResponseMap = Record<string, string | number | string[]>;

// ─── Star rating widget ───────────────────────────────────────────────────────

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1.5" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hovered || value);
        return (
          <motion.button
            key={star}
            type="button"
            aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            whileTap={{ scale: 0.85 }}
            animate={{ scale: filled ? 1.1 : 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="outline-none"
          >
            <Star
              className={cn(
                "h-8 w-8 transition-colors",
                filled
                  ? "fill-amber-400 stroke-amber-400"
                  : "fill-transparent stroke-[#171717]/20 dark:stroke-white/25"
              )}
              strokeWidth={1.5}
            />
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseOptions(raw: RawFeedbackRow["options"]): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

// ─── Main component ───────────────────────────────────────────────────────────

export function FeedbackSheet({
  open,
  shop,
  jobId,
  customerName,
  customerPhone,
  onClose,
  onSubmitted,
}: Props) {
  const [questions, setQuestions] = useState<FeedbackQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [responses, setResponses] = useState<ResponseMap>({});
  const [writtenFeedback, setWrittenFeedback] = useState("");
  const [fallbackRating, setFallbackRating] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Load questions when opened ─────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setResponses({});
      setWrittenFeedback("");
      setFallbackRating(0);
      setErrors({});
      setSubmitError(null);

      try {
        const { data, error } = await supabase.rpc("get_feedback_questions", {
          p_shop_id: shop.id,
        });
        if (cancelled) return;

        if (error) {
          setQuestions([]);
        } else {
          const parsed = ((data as RawFeedbackRow[]) ?? [])
            .map((q) => ({
              state_key: `${q.source}-${q.question_id}`,
              question_id: q.question_id,
              question_text: q.question_text,
              question_type: q.question_type,
              options: parseOptions(q.options),
              is_required: Boolean(q.is_required),
              display_order: q.display_order ?? 0,
              source: q.source,
            }))
            .sort((a, b) => a.display_order - b.display_order);
          setQuestions(parsed);
        }
      } catch {
        if (!cancelled) setQuestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [open, shop.id]);

  // ── Validation ─────────────────────────────────────────────────────────────
  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (questions.length === 0) {
      if (fallbackRating === 0) {
        newErrors.fallback_rating = "Please select a star rating.";
      }
    } else {
      for (const q of questions) {
        if (!q.is_required) continue;
        const val = responses[q.state_key];
        const missing =
          val === undefined ||
          val === "" ||
          val === 0 ||
          (Array.isArray(val) && val.length === 0);
        if (missing) {
          newErrors[q.state_key] = "Please answer this question.";
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ── Submit via validated submit_feedback RPC ───────────────────────────────
  async function handleSubmit() {
    if (!validate()) return;
    if (!jobId) {
      setSubmitError("Please share feedback right after your print finishes.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const defaultResponses: Record<string, string> = {};
      const customResponses: Record<string, string> = {};

      if (questions.length === 0) {
        defaultResponses.overall_rating = String(fallbackRating);
      } else {
        for (const q of questions) {
          const rawVal = responses[q.state_key];
          const strVal = Array.isArray(rawVal)
            ? rawVal.join(", ")
            : rawVal !== undefined
            ? String(rawVal)
            : "";

          if (q.source === "custom") {
            customResponses[q.question_id] = strVal;
          } else {
            defaultResponses[q.question_id] = strVal;
          }
        }
      }

      const { data, error } = await supabase.rpc("submit_feedback", {
        p_job_id: jobId,
        p_shop_id: shop.id,
        p_customer_name: customerName?.trim() || "Guest",
        p_customer_phone: customerPhone?.trim() || "",
        p_default_responses: defaultResponses,
        p_custom_responses: customResponses,
        p_written_feedback: writtenFeedback.trim(),
      });

      if (error) {
        setSubmitError(error.message || "Submission failed. Please try again.");
        return;
      }

      const result = Array.isArray(data) ? data[0] : data;
      if (result && result.success === false) {
        setSubmitError(result.message || "Could not submit feedback.");
        return;
      }

      onSubmitted();
      onClose();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Submission failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ── Response helpers ───────────────────────────────────────────────────────
  function setResponse(stateKey: string, value: ResponseMap[string]) {
    setResponses((prev) => ({ ...prev, [stateKey]: value }));
    if (errors[stateKey]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[stateKey];
        return next;
      });
    }
  }

  // ── Render question ────────────────────────────────────────────────────────
  function renderQuestion(q: FeedbackQuestion) {
    const val = responses[q.state_key];
    const err = errors[q.state_key];

    let control: React.ReactNode;

    switch (q.question_type) {
      case "rating":
        control = (
          <StarRating
            value={Number(val) || 0}
            onChange={(v) => setResponse(q.state_key, v)}
          />
        );
        break;

      case "emoji":
      case "choice":
        control = (
          <div className="flex flex-wrap gap-2">
            {q.options.map((opt) => {
              const isSelected = val === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setResponse(q.state_key, opt)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all active:scale-95",
                    isSelected
                      ? "border-[#FB432C]/40 bg-[#FB432C]/15 text-[#FB432C]"
                      : "border-[#171717]/[0.10] dark:border-white/[0.10] bg-[#F4F4F5] dark:bg-[#232325] text-[#525252] dark:text-[#A1A1A6] hover:border-[#171717]/20 dark:hover:border-white/20 hover:text-[#171717] dark:hover:text-[#EDEDED]"
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        );
        break;

      case "multiple_choice":
        control = (
          <div className="flex flex-wrap gap-2">
            {q.options.map((opt) => {
              const selectedArr = Array.isArray(val) ? (val as string[]) : [];
              const isSelected = selectedArr.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    const next = isSelected
                      ? selectedArr.filter((o) => o !== opt)
                      : [...selectedArr, opt];
                    setResponse(q.state_key, next);
                  }}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all active:scale-95",
                    isSelected
                      ? "border-[#FB432C]/40 bg-[#FB432C]/15 text-[#FB432C]"
                      : "border-[#171717]/[0.10] dark:border-white/[0.10] bg-[#F4F4F5] dark:bg-[#232325] text-[#525252] dark:text-[#A1A1A6] hover:border-[#171717]/20 dark:hover:border-white/20 hover:text-[#171717] dark:hover:text-[#EDEDED]"
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        );
        break;

      case "text":
      default:
        control = (
          <Textarea
            value={(val as string) || ""}
            onChange={(e) => setResponse(q.state_key, e.target.value)}
            placeholder="Write your answer…"
            rows={2}
            className="resize-none rounded-xl border-[#171717]/[0.10] dark:border-white/[0.10] bg-[#F4F4F5] dark:bg-[#232325] text-[#171717] dark:text-[#EDEDED] text-sm placeholder:text-[#737373] dark:placeholder:text-[#85858B] focus:border-[#FB432C] focus:ring-1 focus:ring-[#FB432C]/30"
          />
        );
    }

    return (
      <div key={q.state_key} className="space-y-2">
        <label className="block text-sm font-semibold text-[#171717] dark:text-[#EDEDED]">
          {q.question_text}
          {q.is_required && (
            <span className="ml-1 text-[#DC2626] dark:text-[#E5484D]" aria-hidden>
              *
            </span>
          )}
        </label>
        {control}
        <AnimatePresence>
          {err && (
            <motion.p
              key="err"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-xs font-medium text-[#DC2626] dark:text-[#E5484D]"
            >
              {err}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[90dvh] w-full flex-col gap-0 overflow-hidden rounded-[20px] border border-[#171717]/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#19191B] text-[#171717] dark:text-[#EDEDED] p-0 shadow-[0_24px_64px_rgba(0,0,0,0.24)] sm:max-w-lg">
        {/* Header */}
        <DialogHeader className="flex-row items-center justify-between border-b border-[#171717]/[0.08] dark:border-white/[0.08] px-6 py-4">
          <DialogTitle className="text-base font-semibold text-[#171717] dark:text-[#EDEDED]">
            {shop.custom_feedback_title || "Share Your Feedback"}
          </DialogTitle>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close feedback"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F4F4F5] dark:bg-[#232325] text-[#525252] dark:text-[#A1A1A6] transition-colors hover:bg-[#E4E4E7] dark:hover:bg-[#2C2C2E] hover:text-[#171717] dark:hover:text-[#EDEDED]"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[#FB432C]" />
            </div>
          ) : (
            <div className="space-y-5">
              {questions.length === 0 ? (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[#171717] dark:text-[#EDEDED]">
                    How was your printing experience?
                    <span className="ml-1 text-[#DC2626] dark:text-[#E5484D]" aria-hidden>
                      *
                    </span>
                  </label>
                  <StarRating
                    value={fallbackRating}
                    onChange={(v) => {
                      setFallbackRating(v);
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.fallback_rating;
                        return next;
                      });
                    }}
                  />
                  {errors.fallback_rating && (
                    <p className="text-xs font-medium text-[#DC2626] dark:text-[#E5484D]">
                      {errors.fallback_rating}
                    </p>
                  )}
                </div>
              ) : (
                questions.map(renderQuestion)
              )}

              {/* Optional written feedback */}
              <div className="space-y-2 pt-2 border-t border-[#171717]/[0.08] dark:border-white/[0.08]">
                <label className="block text-sm font-semibold text-[#171717] dark:text-[#EDEDED]">
                  Additional Comments{" "}
                  <span className="text-xs font-normal text-[#737373] dark:text-[#85858B]">
                    (Optional)
                  </span>
                </label>
                <Textarea
                  value={writtenFeedback}
                  onChange={(e) => setWrittenFeedback(e.target.value)}
                  placeholder="Share anything that stood out or can be improved…"
                  rows={2}
                  className="resize-none rounded-xl border-[#171717]/[0.10] dark:border-white/[0.10] bg-[#F4F4F5] dark:bg-[#232325] text-[#171717] dark:text-[#EDEDED] text-sm placeholder:text-[#737373] dark:placeholder:text-[#85858B] focus:border-[#FB432C] focus:ring-1 focus:ring-[#FB432C]/30"
                />
              </div>
            </div>
          )}

          {/* Global error */}
          <AnimatePresence>
            {submitError && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 rounded-xl bg-[#DC2626]/10 dark:bg-[#E5484D]/15 px-4 py-2.5 text-sm font-medium text-[#DC2626] dark:text-[#E5484D]"
              >
                {submitError}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="border-t border-[#171717]/[0.08] dark:border-white/[0.08] px-6 py-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#FB432C] hover:bg-[#E03923] px-5 py-3 text-sm font-semibold text-white transition-colors disabled:opacity-60"
          >
            {submitting && (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
            )}
            {submitting ? "Submitting…" : "Submit Feedback"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
