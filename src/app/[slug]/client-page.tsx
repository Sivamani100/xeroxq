"use client";

import { useState, useEffect, use, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Sparkles, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { generateToken, cn } from "@/lib/utils";
import { CONFIG } from "@/lib/config";
import { ImageCropper } from "@/components/editing/image-cropper";

import {
  createStagedFile,
  detectPageCount,
  revokeStagedFileUrl,
  validateFile,
  isOfficeFile,
  calculateCost,
  type StagedFile,
} from "@/lib/file-utils";

import {
  addBatch,
  updateBatch,
  loadHistory,
  createBatchId,
  loadPreferences,
  savePreferences,
  type StoredBatch,
} from "@/lib/customer-storage";

import {
  PortalHeader,
  ModeSegmentedBar,
  PortalDropzone,
  StagedFileList,
  PrintPreferencesDeck,
  ProcessingPipelineCard,
  ActiveTicketView,
  HistoryDrawer,
  FeedbackSheet,
} from "@/components/portal";

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

type ProcessingStep =
  | "validating"
  | "converting"
  | "uploading"
  | "registering"
  | "done";

const SPRING = { type: "spring" as const, stiffness: 380, damping: 30 };

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ShopCustomerPortal({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  // ── Core state ───────────────────────────────────────────────────────────
  const [shop, setShop] = useState<Shop | null>(null);
  const [notFound, setNotFound] = useState(false);

  // ── File staging ─────────────────────────────────────────────────────────
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);

  // ── Preferences / mode ───────────────────────────────────────────────────
  const [mode, setMode] = useState<"shop" | "home">("shop");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [color, setColor] = useState(false);
  const [copies, setCopies] = useState(1);
  const [doubleSided, setDoubleSided] = useState(false);

  // ── Upload / processing state ─────────────────────────────────────────────
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState<ProcessingStep>("validating");
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    percent: number;
    fileName: string;
  } | null>(null);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // ── Post-upload / ticket state ────────────────────────────────────────────
  const [batchTokens, setBatchTokens] = useState<
    { token: string; fileName: string; jobId: string }[]
  >([]);
  const [jobStatus, setJobStatus] = useState<string>("pending");
  const [isDeleted, setIsDeleted] = useState(false);
  const [deletionReason, setDeletionReason] = useState<
    "user" | "policy" | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [estimatedTotal, setEstimatedTotal] = useState(0);
  const [activeExpiresAt, setActiveExpiresAt] = useState<string | null>(null);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);

  // ── History / feedback ────────────────────────────────────────────────────
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // ── Office conversion choice modal ────────────────────────────────────────
  const [showDocxChoice, setShowDocxChoice] = useState(false);

  // ── Image crop ────────────────────────────────────────────────────────────
  const [cropTarget, setCropTarget] = useState<{
    id: string;
    dataUrl: string;
  } | null>(null);

  // ─── Load shop + init session ─────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        const { data: sess } = await supabase.auth.getSession();
        if (!sess.session) {
          await supabase.auth.signInAnonymously();
        }
      } catch {
        /* ignore — upload will re-try */
      }

      const { data, error } = await supabase
        .from("shops")
        .select(
          "id, name, slug, upi_id, price_mono, price_color, is_open, is_active, require_customer_name, show_copies, show_color_mode, show_duplex, generate_token, accept_preorders, contact_number, feedback_enabled, custom_feedback_enabled, custom_feedback_title, total_files_processed, approval_status"
        )
        .eq("slug", slug)
        .single();

      if (error) {
        if (error.code !== "PGRST116") {
          console.error("Shop fetch error:", error.message);
        }
        setNotFound(true);
        return;
      }
      if (!data || data.is_active === false) {
        setNotFound(true);
        return;
      }
      setShop(data as Shop);
    }
    init();

    const batches = loadHistory();
    setHistoryCount(batches.length);

    const prefs = loadPreferences();
    if (prefs.displayName) setCustomerName(prefs.displayName);
    if (prefs.defaultColor) setColor(prefs.defaultColor);
    if (prefs.defaultDoubleSided) setDoubleSided(prefs.defaultDoubleSided);
    if (prefs.defaultCopies > 1) setCopies(prefs.defaultCopies);
    savePreferences({ lastShopSlug: slug });
  }, [slug]);

  // ─── Live job status subscription ─────────────────────────────────────────
  useEffect(() => {
    if (!shop || batchTokens.length === 0) return;

    const activeJobIds = batchTokens.map((b) => b.jobId).filter(Boolean);
    if (activeJobIds.length === 0) return;

    const fetchStatus = async () => {
      const { data: rows, error } = await supabase
        .from("jobs")
        .select(
          "id, status, is_deleted_by_user, is_auto_deleted, file_path, expires_at, created_at"
        )
        .in("id", activeJobIds);

      if (error) return;

      if (!rows || rows.length === 0) {
        setDeletionReason("policy");
        setIsDeleted(true);
        return;
      }

      const nowMs = Date.now();
      const allUserDel = rows.every((r) => r.is_deleted_by_user);
      const allPolicyDel = rows.every((r) => {
        const expMs = r.expires_at
          ? new Date(r.expires_at).getTime()
          : new Date(r.created_at).getTime() + 5 * 60_000;
        return (
          r.is_auto_deleted ||
          (r.file_path === null && !r.is_deleted_by_user) ||
          nowMs >= expMs
        );
      });

      if (allUserDel) {
        setDeletionReason("user");
        setIsDeleted(true);
      } else if (allPolicyDel) {
        setDeletionReason("policy");
        setIsDeleted(true);
      } else {
        const active =
          rows.find((r) => !r.is_deleted_by_user && !r.is_auto_deleted) ||
          rows[0];
        setJobStatus(active.status);
        if (active.expires_at) {
          setActiveExpiresAt(active.expires_at);
        }
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);

    const channel = supabase
      .channel(`jobs-${shop.id}-${activeJobIds[0]}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "jobs",
          filter: `shop_id=eq.${shop.id}`,
        },
        (payload) => {
          const row = payload.new as {
            id?: string;
            status?: string;
            is_deleted_by_user?: boolean;
            is_auto_deleted?: boolean;
            file_path?: string | null;
          };
          if (!row.id || !activeJobIds.includes(row.id)) return;

          if (row.is_deleted_by_user) {
            setDeletionReason("user");
            setIsDeleted(true);
          } else if (row.is_auto_deleted || row.file_path === null) {
            setDeletionReason("policy");
            setIsDeleted(true);
          }

          const newStatus = row.status || "pending";
          setJobStatus(newStatus);

          if (currentBatchId) {
            updateBatch(currentBatchId, {
              files: batchTokens.map((bt) => ({
                jobId: bt.jobId,
                token: bt.token,
                fileName: bt.fileName,
                pageCount: 1,
                color,
                copies,
                doubleSided,
                status: newStatus,
                isDeleted: Boolean(
                  row.is_deleted_by_user || row.is_auto_deleted
                ),
                deletionReason: row.is_deleted_by_user
                  ? "user"
                  : row.is_auto_deleted
                  ? "policy"
                  : null,
              })),
            });
          }

          if (newStatus === "printed") {
            playDing();
            if (typeof navigator !== "undefined" && navigator.vibrate) {
              navigator.vibrate([200, 100, 200]);
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "jobs",
          filter: `shop_id=eq.${shop.id}`,
        },
        (payload) => {
          const old = payload.old as { id?: string };
          if (old.id && activeJobIds.includes(old.id)) {
            setDeletionReason("policy");
            setIsDeleted(true);
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [shop, batchTokens, currentBatchId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function playDing() {
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
    } catch {
      /* audio context unavailable */
    }
  }

  // ─── Derived shop status flags ────────────────────────────────────────────

  const isShopClosed = shop?.is_open === false;
  const isTrialExhausted =
    Boolean(shop) &&
    shop?.approval_status !== "approved" &&
    (shop?.total_files_processed ?? 0) >= 3;
  const dropDisabled = Boolean(isProcessing || isShopClosed || isTrialExhausted);
  const disabledReason = isShopClosed
    ? "closed"
    : isTrialExhausted
    ? "trial"
    : isProcessing
    ? "busy"
    : null;

  // ─── File staging handlers ────────────────────────────────────────────────

  const addFiles = useCallback(async (rawFiles: File[]) => {
    setDropError(null);
    setUploadError(null);
    const toStage: StagedFile[] = [];
    const errors: string[] = [];

    for (const f of rawFiles) {
      const { valid, error } = validateFile(f);
      if (!valid) {
        errors.push(error ?? `"${f.name}" rejected`);
        continue;
      }
      toStage.push(createStagedFile(f));
    }

    if (errors.length > 0) {
      setDropError(errors.join(" · "));
    }

    if (toStage.length === 0) return;

    setStagedFiles((prev) => {
      const next = [...prev, ...toStage];
      for (const sf of toStage) {
        detectPageCount(sf.file)
          .then((count) => {
            setStagedFiles((cur) =>
              cur.map((x) =>
                x.id === sf.id
                  ? { ...x, pageCount: count, pageCountStatus: "ready" }
                  : x
              )
            );
          })
          .catch(() => {
            setStagedFiles((cur) =>
              cur.map((x) =>
                x.id === sf.id ? { ...x, pageCountStatus: "error" } : x
              )
            );
          });
      }
      return next;
    });
  }, []);

  const removeFile = useCallback((id: string) => {
    setUploadError(null);
    setStagedFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) revokeStagedFileUrl(target);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (dropDisabled) return;
      const dropped = Array.from(e.dataTransfer.files || []);
      if (dropped.length > 0) addFiles(dropped);
    },
    [addFiles, dropDisabled]
  );

  // ─── Crop ─────────────────────────────────────────────────────────────────

  const handleCropRequest = useCallback((id: string, dataUrl: string) => {
    setCropTarget({ id, dataUrl });
  }, []);

  const handleCropComplete = useCallback(
    async (croppedDataUrl: string) => {
      if (!cropTarget) return;
      try {
        const res = await fetch(croppedDataUrl);
        const blob = await res.blob();
        setStagedFiles((prev) => {
          const original = prev.find((f) => f.id === cropTarget.id);
          if (!original) return prev;
          const newFile = new File([blob], original.file.name, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          const newSf = createStagedFile(newFile);
          revokeStagedFileUrl(original);
          return prev.map((f) =>
            f.id === cropTarget.id
              ? {
                  ...newSf,
                  id: cropTarget.id,
                  pageCount: 1,
                  pageCountStatus: "ready" as const,
                }
              : f
          );
        });
      } catch {
        /* ignore */
      } finally {
        setCropTarget(null);
      }
    },
    [cropTarget]
  );

  // ─── Computed values ──────────────────────────────────────────────────────

  const totalPages = stagedFiles.reduce(
    (sum, f) => sum + (f.pageCountStatus === "ready" ? f.pageCount : 1),
    0
  );
  const isPricingLoading = stagedFiles.some(
    (f) => f.pageCountStatus === "detecting"
  );
  const hasOffice = stagedFiles.some((f) => isOfficeFile(f.file));

  // ─── Upload orchestration ─────────────────────────────────────────────────

  const handleUpload = useCallback(
    async (forceFileType?: "raw" | "pdf") => {
      if (stagedFiles.length === 0 || !shop) return;

      if (shop.is_active === false) {
        setUploadError("This shop is not taking prints right now.");
        return;
      }
      if (shop.is_open === false) {
        setUploadError(`${shop.name} is closed right now. Please try again when they open.`);
        return;
      }
      if (
        shop.approval_status !== "approved" &&
        (shop.total_files_processed || 0) + stagedFiles.length > 3
      ) {
        setUploadError(
          `${shop.name} can only accept 3 free test prints until verification completes.`
        );
        return;
      }
      if (shop.require_customer_name && !customerName.trim()) {
        setUploadError("Please type your name first so the shop knows which print is yours.");
        return;
      }
      if (mode === "home") {
        const cleanDigits = customerPhone.replace(/\D/g, "");
        if (cleanDigits.length < 10) {
          setUploadError(
            "Please enter your 10-digit mobile number so the shop can let you know when it's ready."
          );
          return;
        }
      }

      if (hasOffice && !forceFileType) {
        setShowDocxChoice(true);
        return;
      }

      setUploadError(null);
      setConversionError(null);
      setIsProcessing(true);
      setCurrentStep("validating");

      let ownerUid: string | null = null;
      try {
        const { data: sess } = await supabase.auth.getSession();
        ownerUid = sess.session?.user?.id ?? null;
        if (!ownerUid) {
          const { data: anon } = await supabase.auth.signInAnonymously();
          ownerUid = anon.user?.id ?? null;
        }
      } catch {
        /* continue */
      }

      let completedCount = 0;
      let hitConversionError = false;
      const batchResults: { token: string; fileName: string; jobId: string }[] =
        [];
      const expiresAtIso = new Date(Date.now() + 5 * 60_000).toISOString();

      const uploadSingleFile = async (
        sf: StagedFile,
        index: number
      ): Promise<void> => {
        let finalFile: File | Blob = sf.file;
        let finalFileName = sf.file.name;

        if (forceFileType === "pdf" && isOfficeFile(sf.file)) {
          setIsConverting(true);
          setCurrentStep("converting");
          try {
            const form = new FormData();
            form.append("file", sf.file as Blob);
            const resp = await fetch("/api/agent", {
              method: "POST",
              body: form,
            });
            if (!resp.ok) {
              throw new Error(
                `Could not convert ${sf.file.name} (${resp.status}).`
              );
            }
            const blob = await resp.blob();
            finalFileName = `${sf.file.name.replace(/\.[^/.]+$/, "")}.pdf`;
            finalFile = new File([blob], finalFileName, {
              type: "application/pdf",
              lastModified: Date.now(),
            });
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            hitConversionError = true;
            setConversionError(msg);
            throw err;
          }
        }

        setCurrentStep("uploading");
        setIsConverting(false);
        setIsUploading(true);

        const finalExt = finalFileName.split(".").pop()?.toLowerCase() ?? "bin";
        const uid = crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const storagePath = `${shop.id}/${ownerUid ?? "guest"}/${uid}.${finalExt}`;

        const mimeByExt: Record<string, string> = {
          pdf: "application/pdf",
          png: "image/png",
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          webp: "image/webp",
        };
        const contentType =
          mimeByExt[finalExt] || sf.file.type || "application/octet-stream";

        const [pageCount, uploadResult] = await Promise.all([
          detectPageCount(finalFile),
          supabase.storage
            .from("documents")
            .upload(storagePath, finalFile as Blob, {
              contentType,
              upsert: false,
            }),
        ]);

        if (uploadResult.error) {
          throw new Error(
            `Couldn't send "${sf.file.name}". Please check your internet and try again.`
          );
        }

        completedCount++;
        setUploadProgress({
          current: completedCount,
          total: stagedFiles.length,
          percent: Math.round((completedCount / stagedFiles.length) * 100),
          fileName: finalFileName,
        });

        setCurrentStep("registering");

        let dbData: { id: string } | null = null;
        let dbErr: { code?: string; message?: string } | null = null;
        let retries = 3;
        let jobToken = "";

        while (retries > 0) {
          jobToken = generateToken();
          const { data, error } = await supabase
            .from("jobs")
            .insert({
              token: jobToken,
              customer_name: customerName.trim() || "Guest",
              file_path: storagePath,
              file_name: finalFileName,
              preferences: { color, copies, doubleSided },
              page_count: pageCount,
              is_preorder: mode === "home",
              is_paid: false,
              customer_phone: customerPhone.trim(),
              shop_id: shop.id,
              expires_at: expiresAtIso,
            })
            .select("id")
            .single();

          if (!error) {
            dbData = data;
            dbErr = null;
            break;
          }
          dbErr = error;
          if (
            error.code === "23505" &&
            error.message?.includes("jobs_shop_token_unique")
          ) {
            retries--;
            continue;
          }
          break;
        }

        if (dbErr || !dbData) {
          supabase.storage
            .from("documents")
            .remove([storagePath])
            .catch(() => {});
          throw new Error(
            `Couldn't add "${sf.file.name}" to the shop list. Please try again.`
          );
        }

        batchResults[index] = {
          token: jobToken,
          fileName: finalFileName,
          jobId: dbData.id,
        };
      };

      try {
        await Promise.all(
          stagedFiles.map((sf, i) => uploadSingleFile(sf, i))
        );

        const validBatch = batchResults.filter(Boolean);
        if (validBatch.length === 0) throw new Error("No files were uploaded.");

        setCurrentStep("done");

        const batchId = createBatchId();
        const cost = calculateCost(
          totalPages,
          copies,
          color,
          doubleSided,
          shop.price_mono ?? CONFIG.BILLING.DEFAULT_MONO_PRICE,
          shop.price_color ?? CONFIG.BILLING.DEFAULT_COLOR_PRICE
        );
        setEstimatedTotal(cost);
        setActiveExpiresAt(expiresAtIso);
        setCurrentBatchId(batchId);

        const batch: StoredBatch = {
          batchId,
          shopId: shop.id,
          shopSlug: shop.slug,
          shopName: shop.name,
          createdAt: new Date().toISOString(),
          expiresAt: expiresAtIso,
          locationMode: mode,
          isPaid: false,
          estimatedTotal: cost,
          feedbackSubmitted: false,
          files: validBatch.map((bt, idx) => ({
            jobId: bt.jobId,
            token: bt.token,
            fileName: bt.fileName,
            pageCount: stagedFiles[idx]?.pageCount ?? 1,
            color,
            copies,
            doubleSided,
            status: "pending",
            isDeleted: false,
            deletionReason: null,
          })),
        };
        addBatch(batch);
        setHistoryCount(loadHistory().length);

        if (shop.approval_status !== "approved") {
          setShop((prev) =>
            prev
              ? {
                  ...prev,
                  total_files_processed:
                    (prev.total_files_processed ?? 0) + validBatch.length,
                }
              : prev
          );
        }

        savePreferences({
          displayName: customerName.trim(),
          defaultColor: color,
          defaultDoubleSided: doubleSided,
          defaultCopies: copies,
          lastShopSlug: slug,
        });

        setBatchTokens(validBatch);
        setJobStatus("pending");
        setIsDeleted(false);
        setDeletionReason(null);
        setFeedbackSubmitted(false);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (!hitConversionError) {
          setUploadError(msg);
        }
      } finally {
        setIsProcessing(false);
        setIsConverting(false);
        setIsUploading(false);
        setUploadProgress(null);
      }
    },
    [
      stagedFiles,
      shop,
      hasOffice,
      customerName,
      customerPhone,
      color,
      copies,
      doubleSided,
      mode,
      totalPages,
      slug,
    ]
  );

  const handleRetryConvert = useCallback(() => {
    setConversionError(null);
    handleUpload("pdf");
  }, [handleUpload]);

  const handleSendRawInstead = useCallback(() => {
    setConversionError(null);
    handleUpload("raw");
  }, [handleUpload]);

  const handleCancelProcessing = useCallback(() => {
    setConversionError(null);
    setIsProcessing(false);
    setIsConverting(false);
    setIsUploading(false);
    setCurrentStep("validating");
  }, []);

  // ─── Delete handler ───────────────────────────────────────────────────────

  const handleDelete = useCallback(async () => {
    if (batchTokens.length === 0 || !shop) return;
    setIsDeleting(true);
    try {
      const jobIds = batchTokens.map((b) => b.jobId).filter(Boolean);

      const { data: jobs } = await supabase
        .from("jobs")
        .select("id, file_path, is_deleted_by_user")
        .in("id", jobIds);

      if (!jobs || jobs.length === 0) {
        setDeletionReason("policy");
        setIsDeleted(true);
        return;
      }

      const paths = jobs
        .map((j) => j.file_path)
        .filter((p): p is string => Boolean(p));
      if (paths.length > 0) {
        await supabase.storage.from("documents").remove(paths);
      }

      const idsToUpdate = jobs.map((j) => j.id);
      const { error } = await supabase
        .from("jobs")
        .update({
          is_deleted_by_user: true,
          file_path: null,
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .in("id", idsToUpdate);

      if (error) throw error;

      if (currentBatchId) {
        updateBatch(currentBatchId, {
          files: batchTokens.map((bt) => ({
            jobId: bt.jobId,
            token: bt.token,
            fileName: bt.fileName,
            pageCount: 1,
            color,
            copies,
            doubleSided,
            status: "deleted",
            isDeleted: true,
            deletionReason: "user",
          })),
        });
      }

      setDeletionReason("user");
      setIsDeleted(true);
    } catch (err) {
      console.error("Delete error:", err);
      setUploadError("Couldn't remove the file right now. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }, [batchTokens, shop, currentBatchId, color, copies, doubleSided]);

  // ─── Resume active batch from history ─────────────────────────────────────

  const handleResumeBatch = useCallback((batch: StoredBatch) => {
    setBatchTokens(
      batch.files
        .filter((f) => Boolean(f.jobId))
        .map((f) => ({
          token: f.token,
          fileName: f.fileName,
          jobId: f.jobId,
        }))
    );
    setMode(batch.locationMode);
    setEstimatedTotal(batch.estimatedTotal ?? 0);
    setActiveExpiresAt(batch.expiresAt);
    setCurrentBatchId(batch.batchId);
    setFeedbackSubmitted(Boolean(batch.feedbackSubmitted));
    const latestStatus = batch.files[0]?.status || "pending";
    setJobStatus(latestStatus);
    const allDeleted = batch.files.every((f) => f.isDeleted);
    setIsDeleted(allDeleted);
    setDeletionReason(batch.files[0]?.deletionReason ?? null);
    setUploadError(null);
    setConversionError(null);
  }, []);

  // ─── Reset ────────────────────────────────────────────────────────────────

  const resetPortal = useCallback(() => {
    stagedFiles.forEach(revokeStagedFileUrl);
    setStagedFiles([]);
    setBatchTokens([]);
    setJobStatus("pending");
    setIsDeleted(false);
    setDeletionReason(null);
    setUploadError(null);
    setConversionError(null);
    setCurrentStep("validating");
    setActiveExpiresAt(null);
    setCurrentBatchId(null);
    setFeedbackSubmitted(false);
    setHistoryCount(loadHistory().length);
  }, [stagedFiles]);

  // ─── Derived: show sections ───────────────────────────────────────────────

  const showProcessing = isProcessing || Boolean(conversionError);
  const showTicket = batchTokens.length > 0 && !showProcessing;
  const showUploadForm = !showTicket && !showProcessing;
  const activeStepNumber = showTicket ? 3 : stagedFiles.length > 0 ? 2 : 1;

  // ─── Loading / 404 ────────────────────────────────────────────────────────

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING}
          className="text-center max-w-sm rounded-[28px] bg-white border border-black/[0.06] shadow-[0_12px_36px_rgba(0,0,0,0.06)] p-8"
        >
          <div className="mx-auto mb-4 w-12 h-12 rounded-2xl bg-[#F2F2F7] p-2 flex items-center justify-center">
            <img
              src="/logo_color.png"
              alt="XeroxQ"
              className="w-full h-full object-contain opacity-60"
            />
          </div>
          <h2 className="text-xl font-bold text-[#111827] mb-2">
            Shop not found
          </h2>
          <p className="text-sm text-[#6B7280] leading-relaxed">
            The shop link{" "}
            <code className="bg-[#F2F2F7] px-1.5 py-0.5 rounded-md text-xs text-[#111827]">
              /{slug}
            </code>{" "}
            is inactive or doesn&apos;t exist.
          </p>
        </motion.div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
          className="w-7 h-7 rounded-full border-2 border-[#FB432C] border-t-transparent"
        />
      </div>
    );
  }

  // ─── Main render ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col">
      {/* Sticky Apple Translucent Toolbar */}
      <PortalHeader
        shop={shop}
        historyCount={historyCount}
        onHistoryOpen={() => setHistoryOpen(true)}
      />

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-xl mx-auto px-4 pt-6 pb-12 flex flex-col gap-4">
        {/* Clear Guided Prompt + 3-Step Strip */}
        {showUploadForm && (
          <div className="px-1 space-y-2.5">
            <div>
              <h2 className="text-[24px] sm:text-[26px] font-extrabold tracking-[-0.025em] text-[#111827] leading-tight">
                {stagedFiles.length > 0
                  ? `${stagedFiles.length} ${stagedFiles.length === 1 ? "file" : "files"} ready`
                  : "What would you like to print?"}
              </h2>
              <p className="text-[13.5px] text-[#6B7280] mt-0.5 leading-snug">
                {stagedFiles.length > 0
                  ? "Choose Black & White or Color below, then tap Send."
                  : `Pick your files or photos below to print at ${shop.name}.`}
              </p>
            </div>

            {/* Clean 3-step indicator */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { num: 1, label: "Pick Files" },
                { num: 2, label: "Print Options" },
                { num: 3, label: "Pickup Code" },
              ].map((step) => {
                const current = activeStepNumber === step.num;
                const done = activeStepNumber > step.num;
                return (
                  <span
                    key={step.num}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors",
                      current
                        ? "bg-[#111827] text-white"
                        : done
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                        : "bg-black/[0.04] text-[#6B7280]"
                    )}
                  >
                    <span
                      className={cn(
                        "w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center",
                        current
                          ? "bg-white/20 text-white"
                          : done
                          ? "bg-emerald-500 text-white"
                          : "bg-black/[0.08] text-[#6B7280]"
                      )}
                    >
                      {done ? "✓" : step.num}
                    </span>
                    {step.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Service mode toggle — visible when pre-orders enabled */}
        {shop.accept_preorders && (
          <ModeSegmentedBar
            mode={mode}
            onChange={(m) => {
              setMode(m);
              setUploadError(null);
            }}
            show={showUploadForm}
          />
        )}

        {/* Upload form */}
        <AnimatePresence mode="wait">
          {showUploadForm && (
            <motion.div
              key="upload-form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={SPRING}
              className="flex flex-col gap-4"
            >
              {/* Dropzone */}
              <PortalDropzone
                files={stagedFiles}
                isDragging={isDragging}
                disabled={dropDisabled}
                disabledReason={disabledReason}
                onFilesAdded={addFiles}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                error={dropError}
              />

              {/* Staged file list */}
              <AnimatePresence>
                {stagedFiles.length > 0 && (
                  <motion.div
                    key="staged-list"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={SPRING}
                  >
                    <StagedFileList
                      files={stagedFiles}
                      onRemove={removeFile}
                      onCropRequest={handleCropRequest}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* iOS Settings Grouped Preferences */}
              <AnimatePresence>
                {stagedFiles.length > 0 && (
                  <motion.div
                    key="prefs"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={SPRING}
                  >
                    <PrintPreferencesDeck
                      shop={shop}
                      mode={mode}
                      customerName={customerName}
                      customerPhone={customerPhone}
                      color={color}
                      copies={copies}
                      doubleSided={doubleSided}
                      totalPages={totalPages}
                      fileCount={stagedFiles.length}
                      isPricingLoading={isPricingLoading}
                      onNameChange={(v) => {
                        setCustomerName(v);
                        if (uploadError) setUploadError(null);
                      }}
                      onPhoneChange={(v) => {
                        setCustomerPhone(v);
                        if (uploadError) setUploadError(null);
                      }}
                      onColorChange={setColor}
                      onCopiesChange={setCopies}
                      onDoubleSidedChange={setDoubleSided}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Upload error */}
              <AnimatePresence>
                {uploadError && (
                  <motion.div
                    key="upload-err"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700"
                  >
                    {uploadError}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Send CTA Button */}
              <AnimatePresence>
                {stagedFiles.length > 0 && !isShopClosed && !isTrialExhausted && (
                  <motion.div
                    key="send-btn"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={SPRING}
                  >
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleUpload()}
                      disabled={isProcessing}
                      className="w-full h-[54px] rounded-[18px] font-bold text-white text-[15px] flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(251,67,44,0.28),inset_0_1px_0_rgba(255,255,255,0.25)] transition-opacity hover:opacity-95 disabled:opacity-60"
                      style={{
                        background:
                          "linear-gradient(135deg, #FB432C 0%, #FF591E 100%)",
                      }}
                    >
                      <Upload className="h-4 w-4" strokeWidth={2.4} />
                      <span>
                        Send to Print · {totalPages}{" "}
                        {totalPages === 1 ? "page" : "pages"}
                      </span>
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Processing pipeline */}
        <AnimatePresence>
          {showProcessing && (
            <ProcessingPipelineCard
              visible={showProcessing}
              isConverting={isConverting}
              isUploading={isUploading}
              progress={uploadProgress}
              currentStep={currentStep}
              conversionError={conversionError}
              onRetryConvert={handleRetryConvert}
              onSendRawInstead={handleSendRawInstead}
              onCancel={handleCancelProcessing}
            />
          )}
        </AnimatePresence>

        {/* Active Wallet Ticket */}
        <AnimatePresence>
          {showTicket && (
            <ActiveTicketView
              shop={shop}
              batchTokens={batchTokens}
              jobStatus={jobStatus}
              isDeleted={isDeleted}
              deletionReason={deletionReason}
              isDeleting={isDeleting}
              mode={mode}
              estimatedTotal={estimatedTotal}
              expiresAt={activeExpiresAt}
              customerName={customerName}
              feedbackSubmitted={feedbackSubmitted}
              onDelete={handleDelete}
              onUploadAnother={resetPortal}
              onOpenFeedback={() => setFeedbackOpen(true)}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Subtle Apple Privacy Footer */}
      <footer className="pb-6 px-4 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/80 border border-black/[0.05] px-3.5 py-1.5 text-[11px] font-medium text-[#6B7280] shadow-2xs">
          <ShieldCheck className="h-3.5 w-3.5 text-[#34C759]" />
          <span>Files automatically delete after 5 minutes</span>
        </div>
      </footer>

      {/* Office conversion choice modal */}
      <AnimatePresence>
        {showDocxChoice && (
          <>
            <motion.div
              key="docx-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/35 backdrop-blur-xs"
              onClick={() => setShowDocxChoice(false)}
            />
            <motion.div
              key="docx-modal"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.97 }}
              transition={SPRING}
              className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-lg p-4"
            >
              <div className="rounded-[28px] bg-white border border-black/[0.06] shadow-[0_20px_60px_rgba(0,0,0,0.18)] p-6">
                <h3 className="text-base font-bold text-[#111827] mb-1">
                  Make document print-ready?
                </h3>
                <p className="text-sm text-[#6B7280] mb-5 leading-relaxed">
                  Converting to PDF keeps fonts and pages from shifting when
                  printed.
                </p>
                <div className="flex flex-col gap-2.5">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowDocxChoice(false);
                      handleUpload("pdf");
                    }}
                    className="w-full h-12 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(251,67,44,0.28)]"
                    style={{
                      background:
                        "linear-gradient(135deg, #FB432C 0%, #FF591E 100%)",
                    }}
                  >
                    <Sparkles className="h-4 w-4" />
                    Prepare &amp; Send
                  </motion.button>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowDocxChoice(false);
                      handleUpload("raw");
                    }}
                    className="w-full h-12 rounded-2xl font-semibold text-[#111827] text-sm bg-[#F2F2F7] hover:bg-[#E5E5EA] transition-colors"
                  >
                    Send Original File
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Image Cropper overlay */}
      <AnimatePresence>
        {cropTarget && (
          <ImageCropper
            image={cropTarget.dataUrl}
            onCropComplete={handleCropComplete}
            onCancel={() => setCropTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* History Drawer */}
      <HistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        currentShopId={shop.id}
        onResumeBatch={handleResumeBatch}
      />

      {/* Feedback Sheet */}
      <AnimatePresence>
        {feedbackOpen && batchTokens.length > 0 && (
          <FeedbackSheet
            open={feedbackOpen}
            shop={shop}
            jobId={batchTokens[0].jobId}
            token={batchTokens[0].token}
            customerName={customerName}
            customerPhone={customerPhone}
            onClose={() => setFeedbackOpen(false)}
            onSubmitted={() => {
              setFeedbackSubmitted(true);
              setFeedbackOpen(false);
              if (currentBatchId) {
                updateBatch(currentBatchId, { feedbackSubmitted: true });
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
