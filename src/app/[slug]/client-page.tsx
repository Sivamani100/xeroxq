"use client";

import { useState, useEffect, use, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Check, History, Loader2, Lock, Shield, ShieldCheck, Sparkles, Upload, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { generateToken, cn } from "@/lib/utils";
import { CONFIG } from "@/lib/config";
import { ImageCropper } from "@/components/editing/image-cropper";
import { ThemeToggle } from "@/lib/theme";

import {
  createStagedFile,
  detectPageCount,
  detectDocumentColorMode,
  isImageFile,
  revokeStagedFileUrl,
  validateFile,
  isOfficeFile,
  calculateCost,
  type StagedFile,
} from "@/lib/file-utils";
import { autoCropImageFile, combineImagesToA4Pdf, dataUrlToBlob } from "@/lib/image-auto-crop";

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
  ActiveTicketView,
  HistoryPanel,
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

const SPRING = { type: "spring" as const, stiffness: 380, damping: 30 };

const ACCEPT_DOCS_ATTR = [
  ".pdf",
  ".docx",
  ".doc",
  ".pptx",
  ".ppt",
  ".xlsx",
  ".xls",
  ".csv",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "image/*",
].join(",");

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
  const docInputRef = useRef<HTMLInputElement>(null);
  const ownerUidRef = useRef<string | null>(null);

  // ── Preferences / mode ───────────────────────────────────────────────────
  const [mode, setMode] = useState<"shop" | "home">("shop");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [color, setColor] = useState(false);
  const hasManuallyToggledColorRef = useRef(false);
  const [copies, setCopies] = useState(1);
  const [doubleSided, setDoubleSided] = useState(false);

  // ── Upload state ─────────────────────────────────────────────────────────
  const [isProcessing, setIsProcessing] = useState(false);
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

  // ── Image crop & batch ID merge ────────────────────────────────────────────
  const [cropTarget, setCropTarget] = useState<{
    id: string;
    dataUrl: string;
    presetHint?: "id_card" | "a4" | "free";
    fileName?: string;
  } | null>(null);
  const [isCombiningImages, setIsCombiningImages] = useState(false);

  // ─── Load shop + init session ─────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        const { data: sess } = await supabase.auth.getSession();
        ownerUidRef.current = sess.session?.user?.id ?? null;
        if (!sess.session) {
          const { data: anon } = await supabase.auth.signInAnonymously();
          ownerUidRef.current = anon.user?.id ?? null;
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
        if (isImageFile(sf.file)) {
          // Run automatic Aadhaar/ID/document edge crop + B&W/Color detection
          autoCropImageFile(sf.file)
            .then(async ({ croppedFile, analysis }) => {
              const targetFile =
                analysis.wasAutoCropped && croppedFile !== sf.file
                  ? croppedFile
                  : sf.file;
              const colorMode = await detectDocumentColorMode(targetFile).catch(() => null);
              setStagedFiles((cur) =>
                cur.map((x) => {
                  if (x.id !== sf.id) return x;
                  if (analysis.wasAutoCropped && croppedFile !== sf.file) {
                    if (x.previewUrl) URL.revokeObjectURL(x.previewUrl);
                    return {
                      ...x,
                      file: croppedFile,
                      previewUrl: URL.createObjectURL(croppedFile),
                      originalFile: x.originalFile ?? sf.file,
                      autoCropped: true,
                      presetHint: analysis.suggestedPreset,
                      detectedColor: colorMode === null ? undefined : colorMode === "color",
                      pageCount: 1,
                      pageCountStatus: "ready",
                    };
                  }
                  return {
                    ...x,
                    presetHint: analysis.suggestedPreset,
                    detectedColor: colorMode === null ? undefined : colorMode === "color",
                    pageCount: 1,
                    pageCountStatus: "ready",
                  };
                })
              );
            })
            .catch(() => {
              setStagedFiles((cur) =>
                cur.map((x) =>
                  x.id === sf.id ? { ...x, pageCount: 1, pageCountStatus: "ready" } : x
                )
              );
            });
        } else {
          Promise.all([
            detectPageCount(sf.file),
            detectDocumentColorMode(sf.file).catch(() => null),
          ])
            .then(([count, colorMode]) => {
              setStagedFiles((cur) =>
                cur.map((x) =>
                  x.id === sf.id
                    ? {
                        ...x,
                        pageCount: count,
                        detectedColor: colorMode === null ? undefined : colorMode === "color",
                        pageCountStatus: "ready",
                      }
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
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (stagedFiles.length === 0) {
      hasManuallyToggledColorRef.current = false;
      return;
    }
    if (hasManuallyToggledColorRef.current) return;
    const known = stagedFiles.filter((f) => f.detectedColor !== undefined);
    if (known.length === 0) return;
    setColor(known.some((f) => f.detectedColor === true));
  }, [stagedFiles]);

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

  // ─── Crop & Batch ID Merge ────────────────────────────────────────────────

  const handleCropRequest = useCallback(
    (
      id: string,
      dataUrl: string,
      presetHint?: "id_card" | "a4" | "free",
      fileName?: string
    ) => {
      setCropTarget({ id, dataUrl, presetHint, fileName });
    },
    []
  );

  const handleCropComplete = useCallback(
    async (croppedDataUrl: string) => {
      if (!cropTarget) return;
      try {
        const blob = dataUrlToBlob(croppedDataUrl);
        const targetId = cropTarget.id;
        let updatedFile: File | null = null;
        setStagedFiles((prev) => {
          const original = prev.find((f) => f.id === targetId);
          if (!original) return prev;
          const baseName = original.file.name.replace(/\.[^/.]+$/, "");
          const newFile = new File([blob], `${baseName}.jpg`, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          updatedFile = newFile;
          if (original.previewUrl) URL.revokeObjectURL(original.previewUrl);
          return prev.map((f) =>
            f.id === targetId
              ? {
                  ...f,
                  file: newFile,
                  previewUrl: URL.createObjectURL(newFile),
                  originalFile: f.originalFile ?? original.file,
                  autoCropped: true,
                  pageCount: 1,
                  pageCountStatus: "ready" as const,
                }
              : f
          );
        });
        if (updatedFile) {
          detectDocumentColorMode(updatedFile)
            .then((colorMode) => {
              if (colorMode === null) return;
              setStagedFiles((cur) =>
                cur.map((x) =>
                  x.id === targetId ? { ...x, detectedColor: colorMode === "color" } : x
                )
              );
            })
            .catch(() => {});
        }
      } catch {
        /* ignore */
      } finally {
        setCropTarget(null);
      }
    },
    [cropTarget]
  );

  const handleCombineImages = useCallback(
    async (layout: "id_two_up" | "one_per_page") => {
      const imageItems = stagedFiles.filter((f) => isImageFile(f.file));
      if (imageItems.length < 2 || isCombiningImages) return;

      setIsCombiningImages(true);
      setDropError(null);
      try {
        const pdfFile = await combineImagesToA4Pdf(
          imageItems.map((i) => i.file),
          layout
        );
        const pdfStaged = createStagedFile(pdfFile);
        const [pages, colorMode] = await Promise.all([
          detectPageCount(pdfFile).catch(() =>
            layout === "id_two_up"
              ? Math.ceil(imageItems.length / 2)
              : imageItems.length
          ),
          detectDocumentColorMode(pdfFile).catch(() => null),
        ]);
        pdfStaged.pageCount = pages;
        pdfStaged.detectedColor = colorMode === null ? undefined : colorMode === "color";
        pdfStaged.pageCountStatus = "ready";

        setStagedFiles((prev) => {
          const nonImages = prev.filter((f) => !isImageFile(f.file));
          prev.filter((f) => isImageFile(f.file)).forEach(revokeStagedFileUrl);
          return [...nonImages, pdfStaged];
        });
      } catch (err) {
        setDropError(
          err instanceof Error
            ? err.message
            : "Could not combine photos into PDF. Try again."
        );
      } finally {
        setIsCombiningImages(false);
      }
    },
    [stagedFiles, isCombiningImages]
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

      let ownerUid: string | null = ownerUidRef.current;
      if (!ownerUid) {
        try {
          const { data: sess } = await supabase.auth.getSession();
          ownerUid = sess.session?.user?.id ?? null;
          if (!ownerUid) {
            const { data: anon } = await supabase.auth.signInAnonymously();
            ownerUid = anon.user?.id ?? null;
          }
          ownerUidRef.current = ownerUid;
        } catch {
          /* continue */
        }
      }

      let hitConversionError = false;
      const batchResults: {
        token: string;
        fileName: string;
        jobId: string;
        pageCount: number;
      }[] = [];
      const expiresAtIso = new Date(Date.now() + 5 * 60_000).toISOString();

      const uploadSingleFile = async (
        sf: StagedFile,
        index: number
      ): Promise<void> => {
        let finalFile: File | Blob = sf.file;
        let finalFileName = sf.file.name;

        if (forceFileType === "pdf" && isOfficeFile(sf.file)) {
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

        const isSameReadyFile =
          finalFile === sf.file && sf.pageCountStatus === "ready";
        const [pageCount, detectedMode, uploadResult] = await Promise.all([
          isSameReadyFile
            ? Promise.resolve(sf.pageCount)
            : detectPageCount(finalFile),
          finalFile === sf.file && sf.detectedColor !== undefined
            ? Promise.resolve(sf.detectedColor ? ("color" as const) : ("bw" as const))
            : detectDocumentColorMode(finalFile).catch(() => null),
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

        let dbData: { id: string } | null = null;
        let dbErr: { code?: string; message?: string } | null = null;
        let retries = 3;
        let jobToken = "";

        const detectedIsColor = detectedMode === null ? undefined : detectedMode === "color";
        const effectiveColor =
          shop.show_color_mode !== false
            ? color
            : detectedIsColor ?? color;

        while (retries > 0) {
          jobToken = generateToken();
          const { data, error } = await supabase
            .from("jobs")
            .insert({
              token: jobToken,
              customer_name: shop.require_customer_name
                ? customerName.trim() || "Guest"
                : "Guest",
              file_path: storagePath,
              file_name: finalFileName,
              preferences: {
                color: effectiveColor,
                copies,
                doubleSided,
                ...(detectedIsColor !== undefined ? { detectedColor: detectedIsColor } : {}),
              },
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
          pageCount,
        };
      };

      try {
        await Promise.all(
          stagedFiles.map((sf, i) => uploadSingleFile(sf, i))
        );

        const validBatch = batchResults.filter(Boolean);
        if (validBatch.length === 0) throw new Error("No files were uploaded.");

        const resolvedTotalPages =
          validBatch.reduce((sum, item) => sum + item.pageCount, 0) ||
          totalPages;
        const batchId = createBatchId();
        const cost = calculateCost(
          resolvedTotalPages,
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
          files: validBatch.map((bt) => ({
            jobId: bt.jobId,
            token: bt.token,
            fileName: bt.fileName,
            pageCount: bt.pageCount,
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

        setBatchTokens(
          validBatch.map(({ token, fileName, jobId }) => ({
            token,
            fileName,
            jobId,
          }))
        );
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
    setActiveExpiresAt(null);
    setCurrentBatchId(null);
    setFeedbackSubmitted(false);
    setHistoryCount(loadHistory().length);
  }, [stagedFiles]);

  // ─── Derived: show sections ───────────────────────────────────────────────

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const picked = Array.from(e.target.files ?? []);
      if (picked.length > 0) addFiles(picked);
      e.target.value = "";
    },
    [addFiles]
  );

  const openDocsPicker = useCallback(() => {
    if (!dropDisabled) docInputRef.current?.click();
  }, [dropDisabled]);

  const showTicket = batchTokens.length > 0;
  const showUploadForm = !showTicket;
  const activeStepNumber = showTicket ? 3 : stagedFiles.length > 0 ? 2 : 1;

  // ─── Loading / 404 ────────────────────────────────────────────────────────

  if (notFound) {
    return (
      <div className="min-h-[100dvh] w-full overflow-x-clip bg-[#FAFAFA] dark:bg-[#111113] text-[#171717] dark:text-[#EDEDED] flex items-center justify-center p-4 sm:p-6 relative">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <ThemeToggle compact />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING}
          className="text-center w-full max-w-sm rounded-[20px] bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] shadow-[0_1px_2px_rgba(17,17,19,0.04)] p-6 sm:p-8"
        >
          <div className="mx-auto mb-4 w-12 h-12 rounded-2xl bg-[#F4F4F5] dark:bg-[#232325] p-2 flex items-center justify-center">
            <img
              src="/logo_color.png"
              alt="XeroxQ"
              className="w-full h-full object-contain opacity-70"
            />
          </div>
          <h2 className="text-xl font-semibold text-[#171717] dark:text-[#EDEDED] mb-2">
            Shop not found
          </h2>
          <p className="text-sm text-[#525252] dark:text-[#A1A1A6] leading-relaxed [overflow-wrap:anywhere]">
            The shop link{" "}
            <code className="bg-[#F4F4F5] dark:bg-[#232325] px-1.5 py-0.5 rounded-md text-xs text-[#171717] dark:text-[#EDEDED]">
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
      <div className="min-h-[100dvh] w-full overflow-x-clip bg-[#FAFAFA] dark:bg-[#111113] flex items-center justify-center">
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
    <div className="min-h-[100dvh] w-full overflow-x-clip bg-[#FAFAFA] dark:bg-[#111113] text-[#171717] dark:text-[#EDEDED] flex flex-col">
      {/* Sticky Translucent Toolbar */}
      <PortalHeader
        shop={shop}
        historyCount={historyCount}
        onHistoryOpen={() => setHistoryOpen((v) => !v)}
      />

      {/* Shared Hidden File Picker (PDF, Word, PowerPoint, Excel, Images) */}
      <input
        ref={docInputRef}
        type="file"
        accept={ACCEPT_DOCS_ATTR}
        multiple
        className="sr-only"
        onChange={handleFileInputChange}
        tabIndex={-1}
      />

      {/* Main Content Container */}
      <main
        className={cn(
          "flex-1 w-full max-w-lg sm:max-w-xl mx-auto px-3 sm:px-4 pt-3.5 sm:pt-5 flex flex-col gap-3.5 sm:gap-4 min-w-0",
          !historyOpen && stagedFiles.length > 0 && showUploadForm
            ? "pb-[calc(9.5rem+env(safe-area-inset-bottom))]"
            : "pb-[calc(4.85rem+env(safe-area-inset-bottom))]"
        )}
      >
        {historyOpen ? (
          <HistoryPanel
            currentShopId={shop.id}
            onResumeBatch={handleResumeBatch}
            onClose={() => setHistoryOpen(false)}
          />
        ) : (
          <>
            {/* Top Hero + Organized 3-Step Strip */}
            {showUploadForm && (
              <div className="space-y-3.5 sm:space-y-4 shrink-0">
                {stagedFiles.length === 0 ? (
                  <div className="flex items-center justify-between gap-2.5 sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-[22px] min-[360px]:text-[25px] sm:text-[28px] font-bold tracking-[-0.03em] text-[#171717] dark:text-[#EDEDED] leading-[1.12]">
                        Send documents
                        <br />
                        to{" "}
                        <span className="relative inline-block text-[#FB432C]">
                          print
                          <svg
                            viewBox="0 0 92 10"
                            fill="none"
                            aria-hidden="true"
                            className="absolute -bottom-1 left-0 w-full h-2.5 text-[#FB432C]"
                          >
                            <path
                              d="M2 7.5C26 2.5 64 1.5 90 6.5"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                            />
                          </svg>
                        </span>
                      </h2>
                      <p className="text-[12px] sm:text-[13px] text-[#525252] dark:text-[#A1A1A6] mt-1.5 sm:mt-2 leading-relaxed max-w-[260px]">
                        Upload your files, choose print options, and pick them up at{" "}
                        {shop.name}.
                      </p>
                    </div>

                    {/* Clean Coral Printer Illustration matching home UI */}
                    <div
                      className="shrink-0 w-[84px] h-[72px] min-[375px]:w-[98px] min-[375px]:h-[84px] sm:w-[116px] sm:h-[98px] flex items-center justify-center relative select-none"
                      aria-hidden="true"
                    >
                      <svg viewBox="0 0 130 110" fill="none" className="w-full h-full">
                        <ellipse cx="68" cy="56" rx="52" ry="44" fill="#FB432C" fillOpacity="0.09" />
                        <rect x="42" y="12" width="46" height="36" rx="6" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1.5" transform="rotate(-6 42 12)" />
                        <line x1="50" y1="22" x2="76" y2="19" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" />
                        <line x1="51" y1="29" x2="72" y2="27" stroke="#E5E7EB" strokeWidth="2.5" strokeLinecap="round" />
                        <rect x="24" y="42" width="82" height="40" rx="11" fill="#FB432C" />
                        <rect x="24" y="54" width="82" height="28" rx="10" fill="#E03923" />
                        <circle cx="91" cy="51" r="2.8" fill="#FFFFFF" fillOpacity="0.9" />
                        <rect x="34" y="49" width="22" height="4" rx="2" fill="#FFFFFF" fillOpacity="0.28" />
                        <rect x="38" y="66" width="54" height="5" rx="2.5" fill="#7F1D1D" fillOpacity="0.55" />
                        <path d="M44 69H86L92 96H38L44 69Z" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1.5" />
                        <line x1="50" y1="77" x2="80" y2="77" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" />
                        <line x1="48" y1="84" x2="76" y2="84" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" />
                        <line x1="100" y1="22" x2="105" y2="14" stroke="#FB432C" strokeWidth="2.5" strokeLinecap="round" />
                        <line x1="109" y1="29" x2="117" y2="25" stroke="#FB432C" strokeWidth="2.5" strokeLinecap="round" />
                        <line x1="110" y1="38" x2="118" y2="39" stroke="#FB432C" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-[22px] min-[360px]:text-[25px] sm:text-[28px] font-bold tracking-[-0.03em] text-[#171717] dark:text-[#EDEDED] leading-[1.15]">
                      {stagedFiles.length}{" "}
                      {stagedFiles.length === 1 ? "file" : "files"} ready to{" "}
                      <span className="text-[#FB432C]">print</span>
                    </h2>
                    <p className="text-[12.5px] sm:text-[13px] text-[#525252] dark:text-[#A1A1A6] mt-1">
                      Review your files and print options, then tap Send to Print below.
                    </p>
                  </div>
                )}

                {/* Organized Step-by-Step Indicator */}
                <div className="relative grid grid-cols-3 gap-1.5 sm:gap-2.5 items-center">
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-px bg-[#171717]/[0.10] dark:bg-white/[0.10]"
                  />
                  {[
                    { num: 1, label: "Pick File" },
                    { num: 2, label: "Print Options" },
                    { num: 3, label: "Pickup Code" },
                  ].map((step) => {
                    const current = activeStepNumber === step.num;
                    const done = activeStepNumber > step.num;
                    return (
                      <span
                        key={step.num}
                        className={cn(
                          "relative z-10 inline-flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-1.5 rounded-full text-[10.5px] sm:text-[11.5px] font-semibold transition-colors min-w-0",
                          current
                            ? "bg-[#FB432C] text-white shadow-xs"
                            : done
                            ? "bg-[#ECFDF5] dark:bg-[#102A1E] text-[#16A34A] dark:text-[#4CC38A] border border-[#16A34A]/25 dark:border-[#4CC38A]/30"
                            : "bg-white dark:bg-[#19191B] text-[#525252] dark:text-[#A1A1A6] border border-[#171717]/[0.08] dark:border-white/[0.08]"
                        )}
                      >
                        <span
                          className={cn(
                            "w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0",
                            current
                              ? "bg-white text-[#FB432C]"
                              : done
                              ? "bg-[#16A34A] dark:bg-[#4CC38A] text-white dark:text-[#111113]"
                              : "bg-[#F4F4F5] dark:bg-[#232325] text-[#525252] dark:text-[#A1A1A6]"
                          )}
                        >
                          {done ? <Check className="w-2.5 h-2.5" strokeWidth={3} /> : step.num}
                        </span>
                        <span className="truncate">{step.label}</span>
                      </span>
                    );
                  })}
                </div>

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
              </div>
            )}

            {/* Upload Middle Stage */}
            <AnimatePresence mode="wait">
              {showUploadForm && (
                <motion.div
                  key="upload-form"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={SPRING}
                  className="flex-1 w-full min-w-0 flex flex-col gap-3.5 sm:gap-4"
                >
                  {stagedFiles.length === 0 ? (
                    <>
                      {/* Dashed Upload Box grows seamlessly to fill height on any phone */}
                      <PortalDropzone
                        files={stagedFiles}
                        isDragging={isDragging}
                        disabled={dropDisabled}
                        disabledReason={disabledReason}
                        onFilesAdded={addFiles}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onOpenDocsPicker={openDocsPicker}
                        error={dropError}
                      />

                      {/* 3 Trust Mini-Cards matching home design */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-2.5 shrink-0">
                        {[
                          { icon: Zap, title: "Fast Printing", sub: "In minutes" },
                          { icon: Shield, title: "Secure Files", sub: "Auto delete" },
                          { icon: Lock, title: "Private", sub: "Only you see" },
                        ].map((item) => (
                          <div
                            key={item.title}
                            className="rounded-2xl bg-[#FFF5F4] dark:bg-[#19191B] border border-[#FB432C]/15 dark:border-white/[0.08] px-2 sm:px-2.5 py-2.5 sm:py-3 flex flex-col items-center justify-center text-center min-w-0"
                          >
                            <item.icon className="w-4 h-4 text-[#FB432C] mb-1.5 shrink-0" strokeWidth={1.85} />
                            <span className="text-[11px] sm:text-[11.5px] font-bold text-[#171717] dark:text-[#EDEDED] leading-tight">
                              {item.title}
                            </span>
                            <span className="text-[9.5px] min-[375px]:text-[10px] sm:text-[10.5px] text-[#737373] dark:text-[#85858B] mt-0.5 leading-tight whitespace-nowrap">
                              {item.sub}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Soft Green Auto-Delete Banner */}
                      <div className="w-full rounded-xl bg-[#ECFDF5] dark:bg-[#102A1E] border border-[#16A34A]/20 dark:border-[#4CC38A]/25 px-3 sm:px-3.5 py-2.5 flex items-center justify-center gap-2 text-center text-[11.5px] sm:text-[12px] font-medium text-[#16A34A] dark:text-[#4CC38A] shrink-0">
                        <ShieldCheck className="h-4 w-4 shrink-0" strokeWidth={2} />
                        <span>Files are automatically deleted after 5 minutes.</span>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Staged file list (spacious) */}
                      <StagedFileList
                        files={stagedFiles}
                        onRemove={removeFile}
                        onCropRequest={handleCropRequest}
                        onCombineImages={handleCombineImages}
                        isCombining={isCombiningImages}
                      />

                      {/* Add more files strip */}
                      <PortalDropzone
                        files={stagedFiles}
                        isDragging={isDragging}
                        disabled={dropDisabled}
                        disabledReason={disabledReason}
                        onFilesAdded={addFiles}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onOpenDocsPicker={openDocsPicker}
                        error={dropError}
                      />

                      {/* Settings Grouped Preferences */}
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
                        onColorChange={(v) => {
                          hasManuallyToggledColorRef.current = true;
                          setColor(v);
                        }}
                        onCopiesChange={setCopies}
                        onDoubleSidedChange={setDoubleSided}
                      />

                      {/* Office conversion error recovery */}
                      <AnimatePresence>
                        {conversionError && (
                          <motion.div
                            key="conv-err"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            transition={{ duration: 0.2 }}
                            className="rounded-2xl border border-[#DC2626]/20 dark:border-[#E5484D]/25 bg-[#DC2626]/10 dark:bg-[#E5484D]/15 p-3.5 sm:p-4 space-y-2.5"
                          >
                            <div className="flex items-start gap-2.5 text-[13px] font-medium text-[#DC2626] dark:text-[#E5484D]">
                              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                              <span className="[overflow-wrap:anywhere]">{conversionError}</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={handleRetryConvert}
                                disabled={isProcessing}
                                className="h-9 rounded-xl bg-[#FB432C] hover:bg-[#E03923] text-white text-[12.5px] font-semibold transition-colors cursor-pointer disabled:opacity-60"
                              >
                                Retry PDF Convert
                              </button>
                              <button
                                type="button"
                                onClick={handleSendRawInstead}
                                disabled={isProcessing}
                                className="h-9 rounded-xl bg-white dark:bg-[#19191B] border border-[#171717]/[0.12] dark:border-white/[0.12] text-[#171717] dark:text-[#EDEDED] text-[12.5px] font-semibold transition-colors cursor-pointer disabled:opacity-60"
                              >
                                Send Original File
                              </button>
                            </div>
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
                            className="rounded-2xl border border-[#DC2626]/20 dark:border-[#E5484D]/25 bg-[#DC2626]/10 dark:bg-[#E5484D]/15 px-4 py-3 text-[13px] font-medium text-[#DC2626] dark:text-[#E5484D] [overflow-wrap:anywhere]"
                          >
                            {uploadError}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Active Ticket Result */}
            {showTicket && (
              <div className="flex-1 w-full min-w-0 flex flex-col gap-3.5 pt-1 pb-2">
                <AnimatePresence>
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
                </AnimatePresence>

                <div className="w-full rounded-xl bg-[#ECFDF5] dark:bg-[#102A1E] border border-[#16A34A]/20 dark:border-[#4CC38A]/25 px-3 sm:px-3.5 py-2.5 flex items-center justify-center gap-2 text-center text-[11.5px] sm:text-[12px] font-medium text-[#16A34A] dark:text-[#4CC38A]">
                  <ShieldCheck className="h-4 w-4 shrink-0" strokeWidth={2} />
                  <span>Files are automatically deleted after 5 minutes.</span>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Pinned Bottom Action Bar on Staged Options Stage (NO Upload/History tabs here) */}
      {!historyOpen && stagedFiles.length > 0 && showUploadForm && (
        <div className="fixed bottom-0 inset-x-0 z-40 w-full bg-white/95 dark:bg-[#19191B]/95 backdrop-blur-xl border-t border-[#171717]/[0.08] dark:border-white/[0.08]">
          <div className="max-w-lg sm:max-w-xl mx-auto px-3 sm:px-4 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex flex-col gap-2">
            <div className="flex items-center justify-center gap-1.5 text-center text-[11px] sm:text-[11.5px] font-medium text-[#16A34A] dark:text-[#4CC38A]">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              <span>Files are automatically deleted after 5 minutes.</span>
            </div>

            {!isShopClosed && !isTrialExhausted && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.985 }}
                onClick={() => handleUpload()}
                disabled={isProcessing}
                className="w-full h-12 rounded-full bg-[#FB432C] hover:bg-[#E03923] font-semibold text-white text-[15px] flex items-center justify-center gap-2 shadow-sm shadow-[#FB432C]/25 transition-colors disabled:opacity-75 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />
                    <span>Sending to print...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" strokeWidth={2.25} />
                    <span>
                      Send to Print · {totalPages}{" "}
                      {totalPages === 1 ? "page" : "pages"}
                    </span>
                  </>
                )}
              </motion.button>
            )}
          </div>
        </div>
      )}

      {/* Pinned Fixed Bottom Tab Navigation Bar on Home, History & Ticket Views */}
      {(historyOpen || stagedFiles.length === 0 || showTicket) && (
        <nav
          aria-label="Portal navigation"
          className="fixed bottom-0 inset-x-0 z-40 w-full bg-white/95 dark:bg-[#19191B]/95 backdrop-blur-xl border-t border-[#171717]/[0.08] dark:border-white/[0.08]"
        >
          <div className="max-w-lg sm:max-w-xl mx-auto px-3 sm:px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setHistoryOpen(false)}
              className="flex flex-col items-center justify-center gap-0.5 py-1 cursor-pointer group"
            >
              <span
                className={cn(
                  "px-5 py-1 rounded-full transition-colors",
                  !historyOpen
                    ? "bg-[#FB432C]/12 dark:bg-[#FB432C]/20 text-[#FB432C]"
                    : "text-[#737373] dark:text-[#85858B] group-hover:text-[#171717] dark:group-hover:text-[#EDEDED]"
                )}
              >
                <Upload className="w-4 h-4" strokeWidth={2.25} />
              </span>
              <span
                className={cn(
                  "text-[11px] font-semibold",
                  !historyOpen
                    ? "text-[#FB432C]"
                    : "text-[#737373] dark:text-[#85858B]"
                )}
              >
                Upload
              </span>
            </button>

            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="flex flex-col items-center justify-center gap-0.5 py-1 cursor-pointer group"
            >
              <span
                className={cn(
                  "relative px-5 py-1 rounded-full transition-colors",
                  historyOpen
                    ? "bg-[#FB432C]/12 dark:bg-[#FB432C]/20 text-[#FB432C]"
                    : "text-[#737373] dark:text-[#85858B] group-hover:text-[#171717] dark:group-hover:text-[#EDEDED]"
                )}
              >
                <History className="w-4 h-4" strokeWidth={2} />
                {historyCount > 0 && (
                  <span className="absolute top-0.5 right-3 min-w-[15px] h-[15px] px-1 rounded-full bg-[#171717] dark:bg-[#EDEDED] text-white dark:text-[#111113] text-[9px] font-bold flex items-center justify-center tabular-nums">
                    {historyCount > 99 ? "99+" : historyCount}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "text-[11px] font-semibold",
                  historyOpen
                    ? "text-[#FB432C]"
                    : "text-[#737373] dark:text-[#85858B]"
                )}
              >
                History
              </span>
            </button>
          </div>
        </nav>
      )}

      {/* Office conversion choice modal */}
      <AnimatePresence>
        {showDocxChoice && (
          <>
            <motion.div
              key="docx-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs"
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
              <div className="rounded-[24px] bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.22)] p-6">
                <h3 className="text-base font-semibold text-[#171717] dark:text-[#EDEDED] mb-1">
                  Make document print-ready?
                </h3>
                <p className="text-sm text-[#525252] dark:text-[#A1A1A6] mb-5 leading-relaxed">
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
                    className="w-full h-12 rounded-xl bg-[#FB432C] hover:bg-[#E03923] font-semibold text-white text-sm flex items-center justify-center gap-2 transition-colors"
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
                    className="w-full h-12 rounded-xl font-semibold text-[#171717] dark:text-[#EDEDED] text-sm bg-[#F4F4F5] dark:bg-[#232325] hover:bg-[#E4E4E7] dark:hover:bg-[#2C2C2E] transition-colors"
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
            initialPreset={cropTarget.presetHint}
            fileName={cropTarget.fileName}
            onCropComplete={handleCropComplete}
            onCancel={() => setCropTarget(null)}
          />
        )}
      </AnimatePresence>

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
