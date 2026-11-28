"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUp,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  FileCheck2,
  FilePlus2,
  FileText,
  GraduationCap,
  Loader2,
  MessageSquare,
  Printer,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import type { DocumentInspection } from "@/lib/papers/ooxml";
import { getPublicOrigin } from "@/lib/site-url";
import { ThemeToggle } from "@/lib/theme";
import cn from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage = "upload" | "workspace";

interface ChatMessage {
  id: string;
  role: "ai" | "user";
  text: string;
  planBullets?: string[];
}

interface BuiltArtifact {
  url: string;
  filename: string;
  summary: string;
  sections: string[];
  originalWordCount: number;
  newWordCount: number;
  modelUsed?: string;
}

const SPRING = { type: "spring" as const, stiffness: 360, damping: 30 };

const STARTER_PROMPTS = [
  "Create a complete project report from my file",
  "Match my professor's template & fill all blanks",
  "Fix grammar and make writing sound professional",
  "Add Abstract, Conclusion & References sections",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolvePapersApiUrl(path: string): string {
  if (typeof window !== "undefined") {
    const { protocol } = window.location;
    if (protocol === "http:" || protocol === "https:") {
      return path;
    }
  }
  return `${getPublicOrigin()}${path}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function isWordFilename(name: string): boolean {
  const lower = name.trim().toLowerCase();
  return lower.endsWith(".docx") || lower.endsWith(".doc");
}

function decodeBase64Utf8Meta(encoded: string | null): Partial<BuiltArtifact> | null {
  if (!encoded) return null;
  try {
    const bin = atob(encoded);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    const jsonStr = new TextDecoder("utf-8").decode(bytes);
    return JSON.parse(jsonStr) as Partial<BuiltArtifact>;
  } catch {
    return null;
  }
}

function buildOpeningGreeting(
  doc: DocumentInspection,
  tpl: DocumentInspection | null
): ChatMessage {
  const parts: string[] = [];

  parts.push(
    `I've read **${doc.fileName}** (${doc.wordCount.toLocaleString()} words, around ${doc.estimatedPages} ${doc.estimatedPages === 1 ? "page" : "pages"}).`
  );

  if (doc.headings.length > 0) {
    const sample = doc.headings
      .slice(0, 4)
      .map((h) => h.text)
      .join(", ");
    const more = doc.headings.length > 4 ? ` (+${doc.headings.length - 4} more)` : "";
    parts.push(`Sections detected: ${sample}${more}.`);
  }

  if (tpl) {
    parts.push(
      `Your professor's official template (**${tpl.fileName}**) is also attached — I'll follow its layout, cover page, and sections.`
    );
    if (tpl.placeholders.length > 0) {
      parts.push(
        `I noticed blanks to fill in the template (like ${tpl.placeholders
          .slice(0, 3)
          .join(", ")}). Share those details below along with anything else you want me to write or improve!`
      );
    } else {
      parts.push(
        `Tell me what you'd like me to write, expand, or polish, and when we're ready I'll create your finished Word document.`
      );
    }
  } else {
    parts.push(
      `If your professor or college gave you an **official project template** (.docx or .doc), attach it above first so I match the exact layout they expect.`
    );
    parts.push(
      `Otherwise, just tell me everything you want me to do — fix writing, add missing chapters, expand sections, or organize the whole paper — and I'll build it cleanly for you.`
    );
  }

  return {
    id: `ai-open-${Date.now()}`,
    role: "ai",
    text: parts.join("\n\n"),
  };
}

/** Renders simple inline **bold** segments safely in React without dangerouslySetInnerHTML. */
function RichInlineText({ text }: { text: string }) {
  const segments = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {segments.map((part, idx) =>
        idx % 2 === 1 ? (
          <strong key={idx} className="font-semibold">
            {part}
          </strong>
        ) : (
          <React.Fragment key={idx}>{part}</React.Fragment>
        )
      )}
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PapersClient() {
  const [stage, setStage] = useState<Stage>("upload");

  // Files & parsed summaries
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [mainInspection, setMainInspection] = useState<DocumentInspection | null>(null);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [templateInspection, setTemplateInspection] =
    useState<DocumentInspection | null>(null);

  // Loading & error states
  const [isInspectingMain, setIsInspectingMain] = useState(false);
  const [isInspectingTemplate, setIsInspectingTemplate] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [aiConfigured, setAiConfigured] = useState<boolean>(true);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [readyToBuild, setReadyToBuild] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Build state
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildPhase, setBuildPhase] = useState(0);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [builtArtifact, setBuiltArtifact] = useState<BuiltArtifact | null>(null);
  const [showOutlinePreview, setShowOutlinePreview] = useState(false);

  const mainInputRef = useRef<HTMLInputElement>(null);
  const templateInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isChatLoading, builtArtifact]);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 130)}px`;
  }, [inputText]);

  // Clean up object URLs on unmount or replacement
  useEffect(() => {
    return () => {
      if (builtArtifact?.url) URL.revokeObjectURL(builtArtifact.url);
    };
  }, [builtArtifact]);

  // ── Inspect & attach main document ──────────────────────────────────────────
  const inspectAndAttachMain = useCallback(
    async (file: File) => {
      setUploadError(null);
      if (!isWordFilename(file.name)) {
        setUploadError(
          "Only Word documents (.docx or .doc) work here so we can read and edit your paper cleanly."
        );
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        setUploadError("Your document is too large (maximum allowed size is 25 MB).");
        return;
      }

      setIsInspectingMain(true);
      try {
        const fd = new FormData();
        fd.append("file", file);

        const res = await fetch(resolvePapersApiUrl("/api/papers/inspect"), {
          method: "POST",
          body: fd,
        });
        const data = await res.json();
        if (!res.ok || !data?.document) {
          throw new Error(
            data?.error || "We couldn't read this Word file. Please check it and try again."
          );
        }

        const docMeta = data.document as DocumentInspection;
        setMainFile(file);
        setMainInspection(docMeta);
        setAiConfigured(Boolean(data.aiConfigured));
        setBuiltArtifact(null);
        setBuildError(null);
        setChatError(null);
        setReadyToBuild(Boolean(templateInspection));
        setMessages([buildOpeningGreeting(docMeta, templateInspection)]);
        setStage("workspace");
      } catch (err) {
        setUploadError(
          err instanceof Error
            ? err.message
            : "Something went wrong while opening your document."
        );
      } finally {
        setIsInspectingMain(false);
      }
    },
    [templateInspection]
  );

  // ── Inspect & attach optional professor's template ──────────────────────────
  const inspectAndAttachTemplate = useCallback(
    async (file: File) => {
      setTemplateError(null);
      if (!isWordFilename(file.name)) {
        setTemplateError("Your professor's template must be a Word file (.docx or .doc).");
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        setTemplateError("Template file is too large (max 25 MB).");
        return;
      }

      setIsInspectingTemplate(true);
      try {
        const fd = new FormData();
        fd.append("template", file);

        const res = await fetch(resolvePapersApiUrl("/api/papers/inspect"), {
          method: "POST",
          body: fd,
        });
        const data = await res.json();
        if (!res.ok || !data?.template) {
          throw new Error(data?.error || "Could not read that template file.");
        }

        const tplMeta = data.template as DocumentInspection;
        setTemplateFile(file);
        setTemplateInspection(tplMeta);
        setAiConfigured(Boolean(data.aiConfigured));
        setReadyToBuild(true);

        if (stage === "workspace") {
          const blanksNote =
            tplMeta.placeholders.length > 0
              ? `\n\nI also spotted blanks in it (${tplMeta.placeholders
                  .slice(0, 4)
                  .join(", ")}). Let me know the details to put in those blanks!`
              : "";

          setMessages((prev) => [
            ...prev,
            {
              id: `ai-tpl-${Date.now()}`,
              role: "ai",
              text: `Professor's template added — **${tplMeta.fileName}** (${tplMeta.headings.length} sections detected). I'll follow its layout, margins, and formatting automatically.${blanksNote}`,
            },
          ]);
        }
      } catch (err) {
        setTemplateError(
          err instanceof Error ? err.message : "Could not attach template."
        );
      } finally {
        setIsInspectingTemplate(false);
      }
    },
    [stage]
  );

  const handleRemoveTemplate = useCallback(() => {
    setTemplateFile(null);
    setTemplateInspection(null);
    setTemplateError(null);
  }, []);

  // ── Send conversational message to OpenRouter AI ────────────────────────────
  const sendChatMessage = useCallback(
    async (overrideText?: string) => {
      const text = (overrideText ?? inputText).trim();
      if (!text || !mainInspection || isChatLoading || isBuilding) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        text,
      };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      if (!overrideText) setInputText("");
      setChatError(null);
      setIsChatLoading(true);
      setReadyToBuild(true);

      try {
        const res = await fetch(resolvePapersApiUrl("/api/papers/chat"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            document: mainInspection,
            template: templateInspection,
            messages: updatedMessages.map((m) => ({ role: m.role, text: m.text })),
            hasBuiltBefore: Boolean(builtArtifact),
          }),
        });

        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.reply) {
          if (data?.code === "AI_NOT_CONFIGURED") setAiConfigured(false);
          throw new Error(
            data?.error || "Couldn't get an AI reply right now. Try again in a moment."
          );
        }

        const aiReply: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: "ai",
          text: data.reply,
          planBullets: Array.isArray(data.planBullets) ? data.planBullets : undefined,
        };
        setMessages((prev) => [...prev, aiReply]);
        setReadyToBuild(true);
      } catch (err) {
        const errMsg =
          err instanceof Error
            ? err.message
            : "Something went wrong sending your message.";
        setChatError(errMsg);
      } finally {
        setIsChatLoading(false);
      }
    },
    [
      inputText,
      mainInspection,
      templateInspection,
      messages,
      isChatLoading,
      isBuilding,
      builtArtifact,
    ]
  );

  // ── Trigger full Word document creation / rebuild ──────────────────────────
  const handleBuildDocument = useCallback(async () => {
    if (!mainFile || isBuilding) return;

    const userNotes = messages
      .filter((m) => m.role === "user")
      .map((m) => m.text.trim())
      .filter(Boolean);

    // Build combined instructions including any latest typed draft if unsent
    const unsentDraft = inputText.trim();
    if (unsentDraft) {
      userNotes.push(unsentDraft);
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: "user", text: unsentDraft },
      ]);
      setInputText("");
    }

    const instructions =
      userNotes.length > 0
        ? userNotes.join("\n\n")
        : templateFile
        ? "Follow the professor's official template cleanly, fill any blanks using details from my document, polish all writing, and complete missing standard sections."
        : "Improve grammar, clarity, structure, and expand weak parts into a complete, well-formatted Word document.";

    setBuildError(null);
    setChatError(null);
    setIsBuilding(true);
    setBuildPhase(0);

    // Step indicator timers purely for smooth progress transparency while request runs
    const t1 = setTimeout(() => setBuildPhase(1), 900);
    const t2 = setTimeout(() => setBuildPhase(2), 2600);
    const t3 = setTimeout(() => setBuildPhase(3), 6500);

    try {
      const fd = new FormData();
      fd.append("file", mainFile);
      fd.append("instructions", instructions);
      if (templateFile) fd.append("template", templateFile);

      const res = await fetch(resolvePapersApiUrl("/api/papers/process"), {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        if (errData?.code === "AI_NOT_CONFIGURED") setAiConfigured(false);
        throw new Error(
          errData?.error ||
            "Could not finish creating your document right now. Please try again."
        );
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const parsedMeta = decodeBase64Utf8Meta(res.headers.get("x-papers-meta"));
      const fallbackName = mainFile.name.replace(/\.(docx|doc)$/i, "") + "_Ready.docx";

      const artifact: BuiltArtifact = {
        url,
        filename: parsedMeta?.filename || res.headers.get("x-filename") || fallbackName,
        summary:
          parsedMeta?.summary ||
          "Your document has been updated, expanded, and cleanly formatted.",
        sections: Array.isArray(parsedMeta?.sections) ? parsedMeta.sections : [],
        originalWordCount:
          typeof parsedMeta?.originalWordCount === "number"
            ? parsedMeta.originalWordCount
            : mainInspection?.wordCount ?? 0,
        newWordCount:
          typeof parsedMeta?.newWordCount === "number" ? parsedMeta.newWordCount : 0,
        modelUsed: parsedMeta?.modelUsed,
      };

      setBuiltArtifact((prev) => {
        if (prev?.url) URL.revokeObjectURL(prev.url);
        return artifact;
      });
      setShowOutlinePreview(false);

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-done-${Date.now()}`,
          role: "ai",
          text: `Your new document (**${artifact.filename}**) is ready to download above! Want any tweaks — shorter abstract, different title, or more detail in any chapter? Just reply here and rebuild anytime.`,
        },
      ]);
    } catch (err) {
      setBuildError(
        err instanceof Error
          ? err.message
          : "Something went wrong while building your document."
      );
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setIsBuilding(false);
    }
  }, [mainFile, templateFile, messages, inputText, isBuilding, mainInspection]);

  const handleResetAll = useCallback(() => {
    setStage("upload");
    setMainFile(null);
    setMainInspection(null);
    setTemplateFile(null);
    setTemplateInspection(null);
    setMessages([]);
    setInputText("");
    setUploadError(null);
    setTemplateError(null);
    setChatError(null);
    setBuildError(null);
    setReadyToBuild(false);
    setBuiltArtifact((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return null;
    });
  }, []);

  const hasUserMessages = messages.some((m) => m.role === "user");

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-dvh bg-[#FAFAFA] dark:bg-[#111113] text-[#171717] dark:text-[#EDEDED] flex flex-col">
      {/* ── Sticky Toolbar Header ── */}
      <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-[#19191B]/90 backdrop-blur-2xl border-b border-[#171717]/[0.08] dark:border-white/[0.08]">
        <div className="max-w-2xl mx-auto px-4 h-[62px] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="shrink-0 w-10 h-10 rounded-[12px] bg-[#F4F4F5] dark:bg-[#232325] p-1.5 border border-[#171717]/[0.08] dark:border-white/[0.08] flex items-center justify-center"
              aria-label="XeroxQ Home"
            >
              <img
                src="/logo_color.png"
                alt="XeroxQ"
                className="w-full h-full object-contain select-none"
              />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-[15px] text-[#171717] dark:text-[#EDEDED] leading-tight truncate">
                  XeroxQ Papers
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FB432C]/10 text-[#FB432C] border border-[#FB432C]/20">
                  Word Studio
                </span>
              </div>
              <p className="text-[11px] font-medium text-[#737373] dark:text-[#85858B] leading-none mt-1 truncate">
                {stage === "upload"
                  ? "Upgrade drafts & match professor templates"
                  : mainFile?.name || "Editing workspace"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle compact showLabel={false} />
            {stage === "workspace" && (
              <button
                type="button"
                onClick={handleResetAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F4F4F5] dark:bg-[#232325] hover:bg-[#E4E4E7] dark:hover:bg-[#2C2C2E] text-[#171717] dark:text-[#EDEDED] text-xs font-semibold transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#737373] dark:text-[#85858B]" />
                <span>Start Over</span>
              </button>
            )}
            <Link
              href="/upload"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FB432C] hover:bg-[#E03923] text-white text-xs font-semibold transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print at Shop</span>
              <span className="sm:hidden">Print</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Content Container ── */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 sm:py-8">
        {/* Missing API Key Setup Notice */}
        {!aiConfigured && (
          <div className="mb-5 rounded-[16px] bg-amber-500/15 border border-amber-500/25 p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-300 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
              <p className="font-semibold">Free AI Key Setup Required</p>
              <p className="mt-0.5 opacity-90">
                Add your free OpenRouter API key (from{" "}
                <span className="font-semibold">openrouter.ai/keys</span>) to{" "}
                <code className="px-1.5 py-0.5 rounded bg-amber-500/20 font-mono text-[11px]">
                  OPENROUTER_API_KEY
                </code>{" "}
                in <code className="font-mono text-[11px]">.env.local</code> and restart the
                server to enable AI writing and chat.
              </p>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {stage === "upload" ? (
            <motion.div
              key="stage-upload"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={SPRING}
              className="space-y-4"
            >
              {/* Clean Headline */}
              <div className="text-center px-2 pb-1">
                <h2 className="text-2xl sm:text-[28px] font-semibold text-[#171717] dark:text-[#EDEDED] tracking-tight leading-tight">
                  Turn your rough draft into a finished paper
                </h2>
                <p className="text-sm sm:text-[15px] text-[#525252] dark:text-[#A1A1A6] mt-2 leading-relaxed max-w-lg mx-auto">
                  Upload your Word file below, chat with us about everything you need, and
                  download a clean, complete document ready to submit or print.
                </p>
              </div>

              {/* Card 1: Primary Word Document Upload */}
              <div
                onClick={() => !isInspectingMain && mainInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const dropped = e.dataTransfer.files?.[0];
                  if (dropped) inspectAndAttachMain(dropped);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (!isInspectingMain) mainInputRef.current?.click();
                  }
                }}
                className={cn(
                  "rounded-[20px] bg-white dark:bg-[#19191B] border transition-colors duration-200 cursor-pointer select-none",
                  "p-7 sm:p-9 text-center",
                  isDragging
                    ? "border-[#FB432C] bg-[#FB432C]/5"
                    : uploadError
                    ? "border-[#DC2626] dark:border-[#E5484D]"
                    : "border-[#171717]/[0.08] dark:border-white/[0.08] hover:border-[#FB432C]/50"
                )}
              >
                {/* Clean Fanned Document Icon Composition */}
                <div className="relative w-24 h-20 mx-auto mb-4 flex items-center justify-center">
                  <div className="absolute -translate-x-5 -rotate-12 w-12 h-14 rounded-xl bg-[#F4F4F5] dark:bg-[#232325] border border-[#171717]/[0.08] dark:border-white/[0.08] flex items-center justify-center">
                    <FileText className="w-5 h-5 text-[#737373] dark:text-[#85858B]" />
                  </div>
                  <div className="absolute translate-x-5 rotate-12 w-12 h-14 rounded-xl bg-[#FB432C]/10 border border-[#FB432C]/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-[#FB432C]" />
                  </div>
                  <div className="relative z-10 w-14 h-16 rounded-2xl bg-white dark:bg-[#19191B] border border-[#171717]/[0.10] dark:border-white/[0.12] flex flex-col items-center justify-center gap-1">
                    {isInspectingMain ? (
                      <Loader2 className="w-6 h-6 text-[#FB432C] animate-spin" />
                    ) : (
                      <Upload className="w-6 h-6 text-[#FB432C]" strokeWidth={2} />
                    )}
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-[#FB432C]">
                      DOCX / DOC
                    </span>
                  </div>
                </div>

                <h3 className="text-[17px] font-semibold text-[#171717] dark:text-[#EDEDED]">
                  {isInspectingMain
                    ? "Reading your document…"
                    : "Drop your project or assignment here"}
                </h3>
                <p className="text-xs sm:text-sm text-[#525252] dark:text-[#A1A1A6] mt-1">
                  Word files only (<span className="font-semibold text-[#171717] dark:text-[#EDEDED]">.docx</span>{" "}
                  or <span className="font-semibold text-[#171717] dark:text-[#EDEDED]">.doc</span>) · Up to 25 MB
                </p>

                <div className="mt-5 flex justify-center">
                  <span className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#FB432C] hover:bg-[#E03923] text-sm font-semibold text-white transition-colors">
                    <FilePlus2 className="w-4 h-4" />
                    <span>Pick Word Document</span>
                  </span>
                </div>
              </div>

              {uploadError && (
                <div className="rounded-[14px] bg-[#DC2626]/10 dark:bg-[#E5484D]/15 border border-[#DC2626]/20 dark:border-[#E5484D]/25 px-4 py-3 flex items-start gap-2.5 text-xs sm:text-sm text-[#DC2626] dark:text-[#E5484D] font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Card 2: Optional Professor Official Template (Attach First or Later) */}
              <div className="rounded-[16px] bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 border",
                        templateInspection
                          ? "bg-[#16A34A]/10 dark:bg-[#4CC38A]/15 text-[#16A34A] dark:text-[#4CC38A] border-[#16A34A]/20 dark:border-[#4CC38A]/25"
                          : "bg-[#F4F4F5] dark:bg-[#232325] text-[#FB432C] border-[#171717]/[0.06] dark:border-white/[0.08]"
                      )}
                    >
                      {isInspectingTemplate ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : templateInspection ? (
                        <FileCheck2 className="w-5 h-5" />
                      ) : (
                        <GraduationCap className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-[#171717] dark:text-[#EDEDED]">
                          Have an official template from your professor?
                        </p>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F4F4F5] dark:bg-[#232325] text-[#737373] dark:text-[#85858B]">
                          Optional
                        </span>
                      </div>
                      {templateInspection ? (
                        <p className="text-xs text-[#16A34A] dark:text-[#4CC38A] font-medium mt-1 truncate">
                          Attached: {templateInspection.fileName} (
                          {templateInspection.headings.length} sections)
                        </p>
                      ) : (
                        <p className="text-xs text-[#525252] dark:text-[#A1A1A6] mt-1 leading-relaxed">
                          Send their official project format file first if you have one — we&apos;ll
                          keep its cover page, borders, headers, and exact structure.
                        </p>
                      )}
                    </div>
                  </div>

                  {templateInspection ? (
                    <button
                      type="button"
                      onClick={handleRemoveTemplate}
                      className="shrink-0 p-2 rounded-full hover:bg-[#F4F4F5] dark:hover:bg-[#232325] text-[#737373] dark:text-[#85858B] hover:text-[#DC2626] dark:hover:text-[#E5484D] transition-colors"
                      aria-label="Remove template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => templateInputRef.current?.click()}
                      disabled={isInspectingTemplate}
                      className="shrink-0 px-3.5 py-2 rounded-full bg-[#F4F4F5] dark:bg-[#232325] hover:bg-[#E4E4E7] dark:hover:bg-[#2C2C2E] text-[#171717] dark:text-[#EDEDED] text-xs font-semibold transition-colors"
                    >
                      + Attach
                    </button>
                  )}
                </div>

                {templateError && (
                  <p className="mt-2.5 text-xs text-[#DC2626] dark:text-[#E5484D] font-medium">{templateError}</p>
                )}
              </div>

              {/* Card 3: Grouped Feature Summary */}
              <div className="rounded-[16px] bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] overflow-hidden divide-y divide-[#171717]/[0.06] dark:divide-white/[0.06]">
                {[
                  {
                    icon: MessageSquare,
                    color: "text-[#007AFF] dark:text-[#60A5FA] bg-[#007AFF]/10 dark:bg-[#60A5FA]/15",
                    title: "Chat what you want",
                    desc: "Ask us to fix grammar, expand sections, fill cover details, or write whole missing chapters.",
                  },
                  {
                    icon: BookOpen,
                    color: "text-[#FB432C] bg-[#FB432C]/10",
                    title: "Keeps your real formatting",
                    desc: "Preserves your photos, tables, page borders, headers, and fonts instead of wrecking your layout.",
                  },
                  {
                    icon: CheckCircle2,
                    color: "text-[#16A34A] dark:text-[#4CC38A] bg-[#16A34A]/10 dark:bg-[#4CC38A]/15",
                    title: "Ready to submit or print",
                    desc: "Download your updated .docx right away and tweak anything in chat until it feels perfect.",
                  },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="flex items-start gap-3.5 px-4 py-3.5">
                      <div
                        className={cn(
                          "w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 mt-0.5",
                          item.color
                        )}
                      >
                        <Icon className="w-4 h-4" strokeWidth={2} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#171717] dark:text-[#EDEDED]">{item.title}</p>
                        <p className="text-xs text-[#525252] dark:text-[#A1A1A6] mt-0.5 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="stage-workspace"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={SPRING}
              className="space-y-3.5"
            >
              {/* ── 1. Compact Attached Files Strip ── */}
              <div className="rounded-[16px] bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] divide-y divide-[#171717]/[0.06] dark:divide-white/[0.06]">
                {/* Main file */}
                {mainFile && mainInspection && (
                  <div className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-[10px] bg-[#FB432C]/10 text-[#FB432C] flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#171717] dark:text-[#EDEDED] truncate">
                          {mainFile.name}
                        </p>
                        <p className="text-[11px] text-[#737373] dark:text-[#85858B] mt-0.5">
                          {formatBytes(mainFile.size)} · {mainInspection.wordCount.toLocaleString()}{" "}
                          words · ~{mainInspection.estimatedPages}{" "}
                          {mainInspection.estimatedPages === 1 ? "page" : "pages"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => mainInputRef.current?.click()}
                      disabled={isBuilding || isInspectingMain}
                      className="shrink-0 text-xs font-semibold text-[#FB432C] hover:underline px-2 py-1 disabled:opacity-40"
                    >
                      {isInspectingMain ? "Loading…" : "Replace"}
                    </button>
                  </div>
                )}

                {/* Professor's official template slot */}
                <div className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0",
                        templateInspection
                          ? "bg-[#16A34A]/10 dark:bg-[#4CC38A]/15 text-[#16A34A] dark:text-[#4CC38A]"
                          : "bg-[#F4F4F5] dark:bg-[#232325] text-[#737373] dark:text-[#85858B]"
                      )}
                    >
                      {isInspectingTemplate ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <GraduationCap className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      {templateInspection ? (
                        <>
                          <p className="text-sm font-semibold text-[#171717] dark:text-[#EDEDED] truncate">
                            Template: {templateInspection.fileName}
                          </p>
                          <p className="text-[11px] text-[#16A34A] dark:text-[#4CC38A] font-medium mt-0.5">
                            Format &amp; cover styles active · {templateInspection.headings.length}{" "}
                            sections
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-xs sm:text-sm font-semibold text-[#171717] dark:text-[#EDEDED]">
                            Professor&apos;s official template{" "}
                            <span className="font-normal text-[#737373] dark:text-[#85858B]">(optional)</span>
                          </p>
                          <p className="text-[11px] text-[#525252] dark:text-[#A1A1A6] mt-0.5">
                            Add their template so we match the college layout
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {templateInspection ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => templateInputRef.current?.click()}
                        disabled={isBuilding || isInspectingTemplate}
                        className="text-xs font-semibold text-[#FB432C] hover:underline px-2 py-1"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveTemplate}
                        disabled={isBuilding}
                        className="p-1.5 rounded-full hover:bg-[#F4F4F5] dark:hover:bg-[#232325] text-[#737373] dark:text-[#85858B] hover:text-[#DC2626] dark:hover:text-[#E5484D]"
                        aria-label="Remove template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => templateInputRef.current?.click()}
                      disabled={isBuilding || isInspectingTemplate}
                      className="shrink-0 px-3 py-1.5 rounded-full bg-[#F4F4F5] dark:bg-[#232325] hover:bg-[#E4E4E7] dark:hover:bg-[#2C2C2E] text-[#171717] dark:text-[#EDEDED] text-xs font-semibold transition-colors"
                    >
                      + Attach Template
                    </button>
                  )}
                </div>
              </div>

              {templateError && (
                <div className="rounded-[14px] bg-[#DC2626]/10 dark:bg-[#E5484D]/15 border border-[#DC2626]/20 dark:border-[#E5484D]/25 px-3.5 py-2.5 text-xs text-[#DC2626] dark:text-[#E5484D] font-medium">
                  {templateError}
                </div>
              )}

              {/* ── 2. Ready Download & Preview Card (when generated) ── */}
              <AnimatePresence>
                {builtArtifact && !isBuilding && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={SPRING}
                    className="rounded-[16px] bg-white dark:bg-[#19191B] border border-[#16A34A]/30 dark:border-[#4CC38A]/30 p-5 space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-[12px] bg-[#16A34A]/10 dark:bg-[#4CC38A]/15 text-[#16A34A] dark:text-[#4CC38A] flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-5 h-5" strokeWidth={2} />
                        </div>
                        <div>
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#16A34A] dark:text-[#4CC38A]">
                            Ready to Submit
                          </span>
                          <h3 className="text-base font-semibold text-[#171717] dark:text-[#EDEDED] leading-snug">
                            {builtArtifact.filename}
                          </h3>
                          <p className="text-xs text-[#525252] dark:text-[#A1A1A6] mt-1 leading-relaxed">
                            {builtArtifact.summary}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Word & section metrics */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded-full bg-[#F4F4F5] dark:bg-[#232325] font-semibold text-[#171717] dark:text-[#EDEDED]">
                        {builtArtifact.originalWordCount.toLocaleString()} →{" "}
                        {builtArtifact.newWordCount.toLocaleString()} words
                      </span>
                      {builtArtifact.sections.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowOutlinePreview((v) => !v)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FB432C]/10 text-[#FB432C] font-semibold hover:bg-[#FB432C]/20 transition-colors"
                        >
                          <span>{builtArtifact.sections.length} sections</span>
                          {showOutlinePreview ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>

                    {showOutlinePreview && builtArtifact.sections.length > 0 && (
                      <div className="rounded-[12px] bg-[#F4F4F5] dark:bg-[#232325] border border-[#171717]/[0.06] dark:border-white/[0.08] p-3 space-y-1.5">
                        <p className="text-[11px] font-semibold text-[#737373] dark:text-[#85858B] uppercase tracking-wider">
                          Sections in your document
                        </p>
                        <ul className="space-y-1">
                          {builtArtifact.sections.map((sec, idx) => (
                            <li
                              key={idx}
                              className="text-xs text-[#171717] dark:text-[#EDEDED] font-medium flex items-center gap-2"
                            >
                              <Check className="w-3 h-3 text-[#16A34A] dark:text-[#4CC38A] shrink-0" />
                              <span className="truncate">{sec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <a
                        href={builtArtifact.url}
                        download={builtArtifact.filename}
                        className="flex-1 h-11 rounded-[12px] bg-[#FB432C] hover:bg-[#E03923] font-semibold text-white text-sm flex items-center justify-center gap-2 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Word Document (.docx)</span>
                      </a>
                      <Link
                        href="/shops"
                        className="h-11 px-4 rounded-[12px] bg-[#F4F4F5] dark:bg-[#232325] hover:bg-[#E4E4E7] dark:hover:bg-[#2C2C2E] text-[#171717] dark:text-[#EDEDED] font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Printer className="w-4 h-4 text-[#737373] dark:text-[#85858B]" />
                        <span>Find Print Shop</span>
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── 3. Building Progress Card ── */}
              <AnimatePresence>
                {isBuilding && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={SPRING}
                    className="rounded-[16px] bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] p-5 space-y-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-[12px] bg-[#FB432C]/10 text-[#FB432C] flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-[#171717] dark:text-[#EDEDED]">
                          Creating your Word document…
                        </h3>
                        <p className="text-xs text-[#525252] dark:text-[#A1A1A6]">
                          Usually takes 15–35 seconds depending on paper length
                        </p>
                      </div>
                    </div>

                    <div className="rounded-[12px] bg-[#F4F4F5] dark:bg-[#232325] border border-[#171717]/[0.06] dark:border-white/[0.06] divide-y divide-[#171717]/[0.06] dark:divide-white/[0.06]">
                      {[
                        "Reading every section & formatting style",
                        "Planning improvements & template layout",
                        "Writing & refining your chapters",
                        "Packaging clean Word document (.docx)",
                      ].map((label, idx) => {
                        const done = idx < buildPhase;
                        const active = idx === buildPhase;
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-3 px-3.5 py-2.5 text-xs sm:text-sm"
                          >
                            <div
                              className={cn(
                                "w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors",
                                done
                                  ? "bg-[#16A34A] dark:bg-[#4CC38A] text-white dark:text-[#111113]"
                                  : active
                                  ? "bg-[#FB432C] text-white"
                                  : "bg-[#E4E4E7] dark:bg-[#2C2C2E] text-[#737373] dark:text-[#85858B]"
                              )}
                            >
                              {done ? (
                                <Check className="w-3 h-3" strokeWidth={3} />
                              ) : active ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              )}
                            </div>
                            <span
                              className={cn(
                                "font-medium transition-colors",
                                done || active ? "text-[#171717] dark:text-[#EDEDED]" : "text-[#737373] dark:text-[#85858B]"
                              )}
                            >
                              {label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── 4. Conversational Message Thread ── */}
              <div className="rounded-[16px] bg-white dark:bg-[#19191B] border border-[#171717]/[0.08] dark:border-white/[0.08] overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-[#171717]/[0.06] dark:border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#FB432C]" />
                    <span className="text-xs font-semibold text-[#171717] dark:text-[#EDEDED]">
                      Chat with Papers AI
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-[#737373] dark:text-[#85858B]">
                    Describe everything you want first, then create
                  </span>
                </div>

                {/* Messages */}
                <div className="p-4 space-y-3.5 max-h-[390px] overflow-y-auto scrollbar-thin">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex flex-col",
                        msg.role === "ai" ? "items-start" : "items-end"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[88%] px-4 py-3 text-[13.5px] sm:text-sm leading-relaxed whitespace-pre-wrap",
                          msg.role === "ai"
                            ? "bg-[#F4F4F5] dark:bg-[#232325] text-[#171717] dark:text-[#EDEDED] rounded-[6px_16px_16px_16px]"
                            : "bg-[#FB432C] text-white rounded-[16px_6px_16px_16px]"
                        )}
                      >
                        <RichInlineText text={msg.text} />

                        {msg.planBullets && msg.planBullets.length > 0 && (
                          <ul className="mt-2.5 pt-2.5 border-t border-[#171717]/[0.08] dark:border-white/[0.10] space-y-1 text-xs text-[#525252] dark:text-[#A1A1A6]">
                            {msg.planBullets.map((b, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <Check className="w-3.5 h-3.5 text-[#16A34A] dark:text-[#4CC38A] shrink-0 mt-0.5" />
                                <span>{b}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))}

                  {isChatLoading && (
                    <div className="flex items-start">
                      <div className="bg-[#F4F4F5] dark:bg-[#232325] text-[#525252] dark:text-[#A1A1A6] rounded-[6px_16px_16px_16px] px-4 py-2.5 text-xs font-medium inline-flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FB432C]" />
                        <span>Thinking…</span>
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Quick starter chips (before first user message) */}
                {!hasUserMessages && !isBuilding && (
                  <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                    {STARTER_PROMPTS.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => sendChatMessage(chip)}
                        disabled={isChatLoading}
                        className="text-left text-[11.5px] font-medium px-3 py-1.5 rounded-full bg-[#F4F4F5] dark:bg-[#232325] hover:bg-[#E4E4E7] dark:hover:bg-[#2C2C2E] text-[#171717] dark:text-[#EDEDED] transition-colors disabled:opacity-50"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}

                {/* Errors inside chat */}
                {(chatError || buildError) && (
                  <div className="mx-4 mb-3 rounded-[12px] bg-[#DC2626]/10 dark:bg-[#E5484D]/15 border border-[#DC2626]/20 dark:border-[#E5484D]/25 px-3.5 py-2.5 text-xs text-[#DC2626] dark:text-[#E5484D] font-medium flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{buildError || chatError}</span>
                  </div>
                )}

                {/* Composer + Create Document Action Bar */}
                <div className="p-3 bg-[#F4F4F5]/70 dark:bg-[#141416] border-t border-[#171717]/[0.06] dark:border-white/[0.06] space-y-2.5">
                  <div className="rounded-[14px] bg-white dark:bg-[#19191B] border border-[#171717]/[0.10] dark:border-white/[0.10] focus-within:border-[#FB432C] px-3.5 py-2 flex items-end gap-2 transition-colors">
                    <textarea
                      ref={textareaRef}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendChatMessage();
                        }
                      }}
                      disabled={isBuilding}
                      placeholder={
                        builtArtifact
                          ? "Want changes? Ask to revise any section…"
                          : "Tell me everything you want improved, added, or filled in…"
                      }
                      rows={1}
                      className="flex-1 bg-transparent outline-none resize-none text-sm text-[#171717] dark:text-[#EDEDED] placeholder:text-[#737373] dark:placeholder:text-[#85858B] leading-relaxed py-1 max-h-[130px]"
                    />
                    <button
                      type="button"
                      onClick={() => sendChatMessage()}
                      disabled={!inputText.trim() || isChatLoading || isBuilding}
                      aria-label="Send message"
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors",
                        inputText.trim() && !isChatLoading && !isBuilding
                          ? "bg-[#FB432C] text-white hover:bg-[#E03923]"
                          : "bg-[#E4E4E7] dark:bg-[#232325] text-[#737373] dark:text-[#85858B] cursor-default"
                      )}
                    >
                      <ArrowUp className="w-4 h-4" strokeWidth={2} />
                    </button>
                  </div>

                  {/* Primary "Create Full Document" button */}
                  {(hasUserMessages || readyToBuild || inputText.trim().length > 0) && (
                    <button
                      type="button"
                      onClick={handleBuildDocument}
                      disabled={isBuilding || isChatLoading}
                      className="w-full h-11 rounded-[12px] bg-[#FB432C] hover:bg-[#E03923] font-semibold text-white text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {isBuilding ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Building Word Document…</span>
                        </>
                      ) : builtArtifact ? (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          <span>Rebuild Updated Word Document</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Create Full Word Document</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Hidden File Inputs (.docx / .doc only) */}
      <input
        ref={mainInputRef}
        type="file"
        accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
        className="hidden"
        onChange={(e) => {
          const picked = e.target.files?.[0];
          if (picked) inspectAndAttachMain(picked);
          e.target.value = "";
        }}
      />
      <input
        ref={templateInputRef}
        type="file"
        accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
        className="hidden"
        onChange={(e) => {
          const picked = e.target.files?.[0];
          if (picked) inspectAndAttachTemplate(picked);
          e.target.value = "";
        }}
      />
    </div>
  );
}
