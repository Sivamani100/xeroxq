"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  ShieldCheck, 
  FileText, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  UploadCloud, 
  CheckCircle2, 
  X, 
  Lock, 
  Search,
  ChevronRight,
  File as FileIcon,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (file: File) => void;
}

interface MockFileItem {
  id: string;
  name: string;
  type: string; // "pdf" | "docx" | "jpg" | "png" | "xlsx"
  category: "document" | "image";
  sizeLabel: string;
  sizeBytes: number;
  pages: number;
  isSample: boolean;
}

export function FileSelector({ isOpen, onClose, onFileSelect }: FileSelectorProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "document" | "image" | "uploaded">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [customFiles, setCustomFiles] = useState<MockFileItem[]>([]);
  const [realFilesMap, setRealFilesMap] = useState<Record<string, File>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check permission on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPermission = localStorage.getItem("xeroxq_file_permission");
      setHasPermission(savedPermission === "granted");
    }
  }, [isOpen]);

  // Generate a mock-valid File object for sample templates so page count detection succeeds
  const generateSampleFile = (item: MockFileItem): File => {
    if (item.type === "pdf") {
      const padding = "A".repeat(Math.max(0, item.sizeBytes - 200));
      const pdfString = `%PDF-1.4\n%âãÏÓ\n1 0 obj\n<< /Type /Pages /Count ${item.pages} >>\nendobj\n${padding}`;
      const blob = new Blob([pdfString], { type: "application/pdf" });
      return new File([blob], item.name, { type: "application/pdf" });
    } else if (item.type === "docx") {
      const pageBreaks = "<w:lastRenderedPageBreak/>".repeat(item.pages - 1);
      const padding = "B".repeat(Math.max(0, item.sizeBytes - pageBreaks.length - 100));
      const docxString = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document>\n${pageBreaks}\n${padding}\n</w:document>`;
      const blob = new Blob([docxString], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      return new File([blob], item.name, { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    } else {
      // Images & others (1 page default)
      const mime = item.type === "png" ? "image/png" : "image/jpeg";
      const buffer = new ArrayBuffer(item.sizeBytes);
      const blob = new Blob([buffer], { type: mime });
      return new File([blob], item.name, { type: mime });
    }
  };

  // Base list of sample template files
  const sampleFiles: MockFileItem[] = [
    {
      id: "sample-resume",
      name: "Resume_Template.pdf",
      type: "pdf",
      category: "document",
      sizeLabel: "1.2 MB",
      sizeBytes: 1200000,
      pages: 2,
      isSample: true,
    },
    {
      id: "sample-proposal",
      name: "Project_Proposal.docx",
      type: "docx",
      category: "document",
      sizeLabel: "850 KB",
      sizeBytes: 850000,
      pages: 3,
      isSample: true,
    },
    {
      id: "sample-id",
      name: "Government_ID_Card.jpg",
      type: "jpg",
      category: "image",
      sizeLabel: "1.5 MB",
      sizeBytes: 1500000,
      pages: 1,
      isSample: true,
    },
    {
      id: "sample-invoice",
      name: "Tax_Invoice_2026.pdf",
      type: "pdf",
      category: "document",
      sizeLabel: "420 KB",
      sizeBytes: 420000,
      pages: 1,
      isSample: true,
    },
    {
      id: "sample-receipt",
      name: "Receipt_Scan.png",
      type: "png",
      category: "image",
      sizeLabel: "650 KB",
      sizeBytes: 650000,
      pages: 1,
      isSample: true,
    },
    {
      id: "sample-flyer",
      name: "Company_Flyer.pdf",
      type: "pdf",
      category: "document",
      sizeLabel: "2.1 MB",
      sizeBytes: 2100000,
      pages: 4,
      isSample: true,
    }
  ];

  const allFiles = [...customFiles, ...sampleFiles];

  // Filtered files list based on search and active tab
  const filteredFiles = allFiles.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (activeTab === "all") return true;
    if (activeTab === "uploaded") return !file.isSample;
    return file.category === activeTab;
  });

  const getSelectedFileObject = (): File | null => {
    if (!selectedFileId) return null;
    
    // Check custom files first
    const custom = customFiles.find((f) => f.id === selectedFileId);
    if (custom) {
      return realFilesMap[custom.id] || null;
    }
    
    // Check sample files
    const sample = sampleFiles.find((f) => f.id === selectedFileId);
    if (sample) {
      return generateSampleFile(sample);
    }
    
    return null;
  };

  const handleGrantPermission = () => {
    localStorage.setItem("xeroxq_file_permission", "granted");
    setHasPermission(true);
  };

  const handleDenyPermission = () => {
    onClose();
  };

  const handleSelectFile = (id: string) => {
    setSelectedFileId(id);
  };

  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    const fileId = `uploaded-${Date.now()}`;
    const ext = rawFile.name.split(".").pop()?.toLowerCase() || "";
    const isImg = ["png", "jpg", "jpeg", "webp"].includes(ext);

    // Simple size formatter
    let sizeLabel = "";
    if (rawFile.size > 1024 * 1024) {
      sizeLabel = `${(rawFile.size / (1024 * 1024)).toFixed(1)} MB`;
    } else {
      sizeLabel = `${Math.round(rawFile.size / 1024)} KB`;
    }

    const newMockItem: MockFileItem = {
      id: fileId,
      name: rawFile.name,
      type: ext,
      category: isImg ? "image" : "document",
      sizeLabel,
      sizeBytes: rawFile.size,
      pages: isImg ? 1 : 1, // Will be parsed by parent component's Page count detector
      isSample: false
    };

    setCustomFiles((prev) => [newMockItem, ...prev]);
    setRealFilesMap((prev) => ({ ...prev, [fileId]: rawFile }));
    setSelectedFileId(fileId);
    setActiveTab("uploaded");

    // Reset input value
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleConfirm = () => {
    const selected = getSelectedFileObject();
    if (selected) {
      onFileSelect(selected);
      onClose();
    }
  };

  // Helper icons helper
  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="w-8 h-8 text-rose-500" />;
      case "docx":
      case "doc":
        return <FileText className="w-8 h-8 text-blue-500" />;
      case "xlsx":
      case "xls":
        return <FileSpreadsheet className="w-8 h-8 text-emerald-500" />;
      case "png":
      case "jpg":
      case "jpeg":
      case "webp":
        return <ImageIcon className="w-8 h-8 text-amber-500" />;
      default:
        return <FileIcon className="w-8 h-8 text-slate-500" />;
    }
  };

  const currentSelection = allFiles.find((f) => f.id === selectedFileId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-w-[95vw] bg-white border-black/5 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] rounded-3xl p-0 overflow-hidden border-none text-black">
        <AnimatePresence mode="wait">
          {hasPermission === false && (
            <motion.div
              key="permission-step"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="p-8 flex flex-col items-center text-center relative"
            >
              {/* Nice Background Decorative Circles */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-black/5 rounded-full blur-3xl -z-10" />
              <div className="absolute -bottom-10 right-10 w-32 h-32 bg-indigo-50 rounded-full blur-2xl -z-10" />
              
              <div className="w-20 h-20 bg-[#F4F4F5] border border-black/5 rounded-3xl flex items-center justify-center mb-6 relative overflow-hidden group">
                <motion.div 
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="z-10"
                >
                  <Lock className="w-9 h-9 text-black" />
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-tr from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <h2 className="text-[26px] font-black text-black tracking-tight leading-none mb-3">
                File Permission Required
              </h2>
              <p className="text-[14px] font-medium text-[#71717A] max-w-[420px] leading-relaxed mb-8">
                Mercury Print needs access to your local folder and photos to allow document selection. Your files remain completely secure.
              </p>

              <div className="w-full max-w-[400px] border border-black/5 bg-[#F9F9FB] rounded-2xl p-4 flex items-start gap-3 text-left mb-8">
                <ShieldCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[12px] font-black text-black uppercase tracking-wider">Privacy Guaranteed</h4>
                  <p className="text-[11px] font-medium text-[#71717A] mt-0.5">
                    We strictly upload the selected document only when you confirm. No background files or library indexing is ever performed.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-[400px]">
                <Button
                  onClick={handleGrantPermission}
                  className="h-13 bg-black hover:bg-black/90 text-white font-black text-[14px] uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-black/10 flex-1 relative overflow-hidden group cursor-pointer"
                >
                  <span className="relative z-10">Allow Access</span>
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDenyPermission}
                  className="h-13 border-2 border-black/5 bg-white text-black hover:bg-[#F4F4F5] font-black text-[14px] uppercase tracking-wider rounded-xl transition-all flex-1 cursor-pointer"
                >
                  Not Now
                </Button>
              </div>
            </motion.div>
          )}

          {hasPermission === true && (
            <motion.div
              key="explorer-step"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-[650px] max-h-[85vh] relative"
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-black/5 flex items-center justify-between">
                <div>
                  <h3 className="text-[20px] font-black tracking-tight text-black">Mercury File Selector</h3>
                  <p className="text-[11px] font-bold text-[#71717A] uppercase tracking-wider mt-0.5">Choose template or upload device documents</p>
                </div>
                <button 
                  onClick={onClose}
                  className="w-8 h-8 rounded-full border border-black/5 flex items-center justify-center text-[#71717A] hover:text-black hover:bg-[#F4F4F5] transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Sub-Header Actions (Search + Tabs) */}
              <div className="px-6 py-4 bg-[#FAFAFA] flex flex-col md:flex-row md:items-center gap-3 justify-between border-b border-black/5">
                {/* Custom Search bar */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 pl-9 pr-4 text-[13px] font-semibold text-black bg-white border border-black/5 rounded-xl outline-none focus:border-black/20 focus:shadow-md transition-all"
                  />
                </div>

                {/* Tabs */}
                <div className="flex bg-[#E4E4E7]/40 p-1 rounded-xl gap-0.5 self-start md:self-auto overflow-x-auto max-w-full">
                  {(
                    [
                      { id: "all", label: "All Files" },
                      { id: "document", label: "Docs" },
                      { id: "image", label: "Images" },
                      { id: "uploaded", label: "Uploaded" },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all whitespace-nowrap cursor-pointer",
                        activeTab === tab.id
                          ? "bg-white text-black shadow-sm"
                          : "text-[#71717A] hover:text-black"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid content */}
              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleCustomFileUpload}
                  className="hidden"
                  accept=".pdf,.docx,.doc,.xlsx,.xls,.jpg,.jpeg,.png,.webp"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Upload New file Trigger */}
                  <motion.div
                    whileHover={{ scale: 0.985 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="h-[125px] border-2 border-dashed border-black/10 hover:border-black/30 bg-[#FAFAFA]/50 hover:bg-[#FAFAFA] rounded-2xl flex flex-col items-center justify-center p-4 cursor-pointer text-center group transition-all"
                  >
                    <div className="w-10 h-10 bg-white border border-black/5 rounded-xl flex items-center justify-center shadow-md mb-2 group-hover:-translate-y-1 transition-transform">
                      <UploadCloud className="w-5 h-5 text-black" />
                    </div>
                    <span className="text-[12px] font-black uppercase tracking-wider text-black">Upload from Device</span>
                    <span className="text-[9px] font-semibold text-[#A1A1AA] uppercase mt-1">PDF, Image, Word up to 25MB</span>
                  </motion.div>

                  {/* Preloaded & Uploaded Files */}
                  {filteredFiles.map((file) => {
                    const isSelected = selectedFileId === file.id;
                    return (
                      <motion.div
                        key={file.id}
                        layout
                        whileHover={{ scale: 0.985 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleSelectFile(file.id)}
                        className={cn(
                          "h-[125px] border-2 rounded-2xl p-4 flex flex-col justify-between relative cursor-pointer overflow-hidden transition-all bg-white",
                          isSelected
                            ? "border-black shadow-[0_12px_24px_rgba(0,0,0,0.06)]"
                            : "border-black/5 hover:border-black/10"
                        )}
                      >
                        {/* Selected Indicator */}
                        {isSelected && (
                          <div className="absolute top-3 right-3 text-black">
                            <CheckCircle2 className="w-5 h-5 fill-black text-white" />
                          </div>
                        )}

                        {/* Top layout */}
                        <div className="flex gap-3">
                          <div className="w-11 h-11 bg-[#F9F9FB] rounded-xl flex items-center justify-center border border-black/5 shrink-0">
                            {getFileIcon(file.type)}
                          </div>
                          <div className="min-w-0 pr-6">
                            <h4 className="text-[12px] font-black text-black truncate leading-tight mt-0.5">
                              {file.name}
                            </h4>
                            <span className="text-[9px] font-bold text-[#A1A1AA] uppercase tracking-wider block mt-0.5">
                              {file.isSample ? "Template" : "User Upload"}
                            </span>
                          </div>
                        </div>

                        {/* Bottom layout */}
                        <div className="flex justify-between items-center mt-auto">
                          <div className="flex gap-1.5 items-center">
                            <span className="text-[9px] font-black uppercase tracking-widest text-[#71717A] bg-[#FAFAFA] border border-black/5 px-2 py-0.5 rounded-[4px]">
                              {file.type}
                            </span>
                            {file.category === "document" && (
                              <span className="text-[9px] font-black text-[#71717A] uppercase bg-black/5 px-1.5 py-0.5 rounded-[4px]">
                                {file.pages} {file.pages > 1 ? "Pages" : "Page"}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-[#71717A] tabular-nums">
                            {file.sizeLabel}
                          </span>
                        </div>

                        {/* Subtle bottom line colors for categories */}
                        <div className={cn(
                          "absolute bottom-0 left-0 right-0 h-1",
                          file.category === "image" ? "bg-amber-400" : "bg-blue-400"
                        )} />
                      </motion.div>
                    );
                  })}
                </div>

                {filteredFiles.length === 0 && (
                  <div className="h-[250px] flex flex-col items-center justify-center text-center p-6">
                    <AlertCircle className="w-8 h-8 text-[#A1A1AA] mb-3" />
                    <h4 className="text-[14px] font-black text-black uppercase tracking-wider">No matching files</h4>
                    <p className="text-[11px] font-medium text-[#71717A] mt-1 max-w-[220px]">
                      Try typing a different name or upload a document using the button above.
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Drawer Preview & Actions */}
              <div className="p-6 border-t border-black/5 bg-[#FAFAFA] flex flex-col gap-4">
                {currentSelection ? (
                  <div className="flex items-center justify-between bg-white border border-black/5 p-4 rounded-xl shadow-sm animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-[#FAFAFA] border border-black/5 rounded-lg flex items-center justify-center shrink-0">
                        {getFileIcon(currentSelection.type)}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[13px] font-black text-black truncate block leading-tight">{currentSelection.name}</span>
                        <span className="text-[10px] font-bold text-[#71717A] uppercase tracking-wider mt-0.5 block">
                          Ready to Print • {currentSelection.sizeLabel} • {currentSelection.category === "document" ? `${currentSelection.pages} Pages` : "1 Page"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setSelectedFileId(null)}
                        className="h-9 w-9 p-0 border border-black/5 bg-white text-[#71717A] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="h-16 flex items-center justify-center border border-dashed border-black/10 rounded-xl bg-white p-4">
                    <span className="text-[12px] font-bold text-[#71717A]">No document selected. Choose a file to proceed.</span>
                  </div>
                )}

                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="h-12 px-6 border-2 border-black/5 bg-white text-black hover:bg-[#F4F4F5] font-black text-[12px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    disabled={!selectedFileId}
                    className="h-12 px-8 bg-black hover:bg-black/90 disabled:bg-[#E4E4E7] disabled:text-[#A1A1AA] text-white font-black text-[12px] uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-black/10 cursor-pointer"
                  >
                    Confirm Selection
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
