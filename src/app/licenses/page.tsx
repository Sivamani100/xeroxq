"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import {
  ShieldCheck,
  Search,
  FileCode2,
  ExternalLink,
  Copy,
  Check,
  Download,
  Terminal,
  Filter,
  X,
  Sparkles,
  Layers,
  Code2,
  CheckCircle2,
} from "lucide-react";
import licensesData from "../../../public/licenses.json";

export default function LicensesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEcosystem, setSelectedEcosystem] = useState("All");
  const [selectedLicenseType, setSelectedLicenseType] = useState("All");
  const [activeModalItem, setActiveModalItem] = useState<(typeof licensesData.licenses)[0] | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedModalText, setCopiedModalText] = useState(false);

  const ecosystems = ["All", "Web Core", "UI & Motion", "Desktop System", "Mobile App", "Backend & Data"];
  const licenseTypes = ["All", "MIT", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "ISC"];

  const filteredLicenses = useMemo(() => {
    return licensesData.licenses.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesEcosystem =
        selectedEcosystem === "All" || item.ecosystem.toLowerCase() === selectedEcosystem.toLowerCase();

      const matchesLicense =
        selectedLicenseType === "All" || item.license.toLowerCase() === selectedLicenseType.toLowerCase();

      return matchesSearch && matchesEcosystem && matchesLicense;
    });
  }, [searchQuery, selectedEcosystem, selectedLicenseType]);

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyModalText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedModalText(true);
    setTimeout(() => setCopiedModalText(false), 2000);
  };

  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(licensesData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "xeroxq_third_party_licenses.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#111113] text-[#171717] dark:text-[#EDEDED] flex flex-col font-sans selection:bg-[#FB432C] selection:text-white overflow-x-hidden">
      <SiteHeader />

      <main className="flex-1 pt-32 pb-24">
        {/* Hero Section */}
        <section className="relative pt-12 pb-16 text-center border-b border-[#171717]/[0.08] dark:border-white/[0.08]">
          <div
            className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05] text-[#171717] dark:text-white pointer-events-none"
            style={{ backgroundImage: "radial-gradient(currentColor 1.5px, transparent 0)", backgroundSize: "40px 40px" }}
          />

          <div className="max-w-[1280px] mx-auto px-6 relative z-10 flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl"
            >
              <div className="inline-flex items-center gap-2 px-4 h-8 rounded-full bg-[#F4F4F5] dark:bg-[#232325] border border-[#171717]/[0.10] dark:border-white/[0.10] mb-6">
                <FileCode2 className="w-3.5 h-3.5 text-[#171717] dark:text-[#EDEDED]" />
                <span className="text-[10px] font-bold text-[#171717] dark:text-[#EDEDED] uppercase tracking-[0.2em]">
                  Legal & Open Source Compliance
                </span>
              </div>

              <h1 className="text-[40px] md:text-[60px] font-extrabold tracking-tighter text-[#171717] dark:text-[#EDEDED] leading-[0.95] mb-6 uppercase">
                Software Licenses & Attributions
              </h1>

              <p className="text-base md:text-lg text-[#525252] dark:text-[#A1A1A6] font-medium leading-relaxed max-w-2xl mx-auto mb-8">
                XeroxQ is engineered with full transparency. Below is the comprehensive audit disclosure of all 
                third-party open-source packages, libraries, and frameworks powering our web, desktop, and mobile nodes.
              </p>

              {/* Status Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-[#F4F4F5]/80 dark:bg-[#19191B] rounded-2xl border border-[#171717]/[0.08] dark:border-white/[0.08] max-w-3xl mx-auto">
                <div className="p-3 text-center">
                  <span className="text-[10px] font-black text-[#737373] dark:text-[#85858B] uppercase tracking-widest block mb-1">
                    AUDITED PACKAGES
                  </span>
                  <span className="text-xl font-extrabold text-[#171717] dark:text-[#EDEDED]">{licensesData.totalDependencies}</span>
                </div>
                <div className="p-3 text-center border-l border-[#171717]/[0.08] dark:border-white/[0.08]">
                  <span className="text-[10px] font-black text-[#737373] dark:text-[#85858B] uppercase tracking-widest block mb-1">
                    COPYLEFT RISK
                  </span>
                  <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">0% (Permissive)</span>
                </div>
                <div className="p-3 text-center border-l border-[#171717]/[0.08] dark:border-white/[0.08]">
                  <span className="text-[10px] font-black text-[#737373] dark:text-[#85858B] uppercase tracking-widest block mb-1">
                    LAST AUDIT
                  </span>
                  <span className="text-sm font-extrabold text-[#171717] dark:text-[#EDEDED] uppercase">{licensesData.lastAudited}</span>
                </div>
                <div className="p-3 text-center border-l border-[#171717]/[0.08] dark:border-white/[0.08]">
                  <span className="text-[10px] font-black text-[#737373] dark:text-[#85858B] uppercase tracking-widest block mb-1">
                    COMPLIANCE STATUS
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-200/80 dark:border-emerald-500/25 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> VERIFIED
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Filter Controls & Search */}
        <section className="py-8 bg-white/90 dark:bg-[#111113]/90 border-b border-[#171717]/[0.08] dark:border-white/[0.08] sticky top-16 z-30 shadow-sm backdrop-blur-md">
          <div className="max-w-[1280px] mx-auto px-6 space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Search Bar */}
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373] dark:text-[#85858B]" />
                <input
                  type="text"
                  placeholder="Search dependencies, authors, or licenses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-10 py-2.5 bg-[#F4F4F5] dark:bg-[#232325] text-[#171717] dark:text-[#EDEDED] placeholder:text-[#737373] dark:placeholder:text-[#85858B] border border-[#171717]/[0.12] dark:border-white/[0.12] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#171717] dark:focus:ring-white/30 focus:bg-white dark:focus:bg-[#19191B] transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] dark:text-[#85858B] hover:text-[#171717] dark:hover:text-[#EDEDED]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                <button
                  onClick={handleDownloadJSON}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#171717] dark:bg-[#EDEDED] text-white dark:text-[#111113] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#2E2E32] dark:hover:bg-white transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" /> Export JSON
                </button>
                <a
                  href="/api/licenses"
                  target="_blank"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#F4F4F5] dark:bg-[#232325] border border-[#171717]/[0.10] dark:border-white/[0.10] text-[#171717] dark:text-[#EDEDED] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#E4E4E7] dark:hover:bg-[#2E2E32] transition-colors"
                >
                  <Terminal className="w-3.5 h-3.5" /> API Response
                </a>
              </div>
            </div>

            {/* Tabs: Ecosystem */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <span className="text-xs font-bold text-[#737373] dark:text-[#85858B] uppercase tracking-widest mr-2 flex items-center gap-1 shrink-0">
                <Layers className="w-3.5 h-3.5" /> Ecosystem:
              </span>
              {ecosystems.map((eco) => (
                <button
                  key={eco}
                  onClick={() => setSelectedEcosystem(eco)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    selectedEcosystem === eco
                      ? "bg-[#171717] dark:bg-[#EDEDED] text-white dark:text-[#111113] shadow-sm"
                      : "bg-[#F4F4F5] dark:bg-[#232325] text-[#525252] dark:text-[#A1A1A6] hover:bg-[#E4E4E7] dark:hover:bg-[#2E2E32]"
                  }`}
                >
                  {eco}
                </button>
              ))}
            </div>

            {/* License Type Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs font-bold text-[#737373] dark:text-[#85858B] uppercase tracking-widest mr-2 flex items-center gap-1 shrink-0">
                <Filter className="w-3.5 h-3.5" /> License Type:
              </span>
              {licenseTypes.map((lic) => (
                <button
                  key={lic}
                  onClick={() => setSelectedLicenseType(lic)}
                  className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider transition-all whitespace-nowrap ${
                    selectedLicenseType === lic
                      ? "bg-[#FB432C] hover:bg-[#E03923] text-white shadow-sm"
                      : "bg-[#F4F4F5] dark:bg-[#232325] text-[#525252] dark:text-[#A1A1A6] border border-[#171717]/[0.10] dark:border-white/[0.10] hover:bg-[#E4E4E7] dark:hover:bg-[#2E2E32]"
                  }`}
                >
                  {lic}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* License Cards Grid */}
        <section className="py-12 max-w-[1280px] mx-auto px-6">
          {filteredLicenses.length === 0 ? (
            <div className="text-center py-20 bg-[#F4F4F5] dark:bg-[#19191B] rounded-3xl border border-dashed border-[#171717]/[0.15] dark:border-white/[0.15]">
              <Code2 className="w-12 h-12 text-[#737373]/40 dark:text-[#85858B]/40 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-[#171717] dark:text-[#EDEDED] mb-1">No matching dependencies found</h3>
              <p className="text-sm text-[#525252] dark:text-[#A1A1A6]">Try adjusting your search query or clear filters.</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedEcosystem("All");
                  setSelectedLicenseType("All");
                }}
                className="mt-4 px-4 py-2 bg-[#171717] dark:bg-[#EDEDED] text-white dark:text-[#111113] hover:bg-[#FB432C] dark:hover:bg-[#FB432C] dark:hover:text-white text-xs font-bold rounded-xl uppercase tracking-wider transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLicenses.map((item) => (
                <motion.div
                  key={item.name}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="p-6 bg-white dark:bg-[#19191B] rounded-2xl border border-[#171717]/[0.08] dark:border-white/[0.08] hover:border-[#171717]/25 dark:hover:border-white/25 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-black text-[#737373] dark:text-[#A1A1A6] uppercase tracking-widest px-2.5 py-1 bg-[#F4F4F5] dark:bg-[#232325] border border-[#171717]/[0.06] dark:border-white/[0.06] rounded-md">
                        {item.ecosystem}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                          item.license === "MIT"
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                            : item.license === "Apache-2.0"
                            ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20"
                            : "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20"
                        }`}
                      >
                        {item.license}
                      </span>
                    </div>

                    {/* Name & Version */}
                    <div className="flex items-baseline gap-2 mb-2">
                      <h3 className="text-lg font-extrabold text-[#171717] dark:text-[#EDEDED] group-hover:text-[#FB432C] transition-colors">
                        {item.name}
                      </h3>
                      <span className="text-xs font-bold text-[#737373] dark:text-[#85858B] font-mono">v{item.version}</span>
                    </div>

                    {/* Description & Author */}
                    <p className="text-xs text-[#525252] dark:text-[#A1A1A6] font-medium leading-relaxed mb-4 line-clamp-2">
                      {item.description}
                    </p>
                    <div className="text-[11px] font-semibold text-[#737373] dark:text-[#85858B] mb-6">
                      Author: <span className="text-[#171717] dark:text-[#EDEDED]">{item.author}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-[#171717]/[0.06] dark:border-white/[0.06] flex items-center justify-between gap-3">
                    <button
                      onClick={() => setActiveModalItem(item)}
                      className="text-xs font-extrabold text-[#171717] dark:text-[#EDEDED] hover:text-[#FB432C] dark:hover:text-[#FB432C] transition-colors flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#FB432C]" /> View License Text
                    </button>

                    {item.homepage && (
                      <a
                        href={item.homepage}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#737373] dark:text-[#85858B] hover:text-[#171717] dark:hover:text-[#EDEDED] transition-colors"
                        title="Official Homepage"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Corporate Disclosure Banner */}
        <section className="mt-16 max-w-[1280px] mx-auto px-6">
          <div className="p-8 bg-[#171717] dark:bg-[#19191B] text-white rounded-3xl border border-white/[0.08] relative overflow-hidden">
            <div className="relative z-10 max-w-3xl space-y-4">
              <div className="flex items-center gap-2 text-[#FB432C] text-xs font-extrabold uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4" /> Legal Attribution Notice
              </div>
              <h3 className="text-xl font-bold tracking-tight">Zero-Knowledge & Sublicensing Policy</h3>
              <p className="text-xs text-[#A1A1A6] leading-relaxed font-medium">
                All third-party trademarks, product names, software packages, and brand logos mentioned on this 
                portal remain the property of their respective owners. XeroxQ redistributes permissive open-source 
                components strictly in accordance with their respective MIT, Apache 2.0, BSD, and ISC license terms.
              </p>
            </div>
          </div>
        </section>

        {/* Modal for Full License Text */}
        <AnimatePresence>
          {activeModalItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white dark:bg-[#19191B] w-full max-w-3xl rounded-3xl border border-[#171717]/[0.08] dark:border-white/[0.08] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
              >
                {/* Modal Header */}
                <div className="p-6 bg-[#F4F4F5] dark:bg-[#232325] border-b border-[#171717]/[0.08] dark:border-white/[0.08] flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-extrabold text-[#171717] dark:text-[#EDEDED]">{activeModalItem.name}</h3>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 bg-[#171717] dark:bg-[#111113] border border-white/[0.10] text-white rounded-md">
                        v{activeModalItem.version}
                      </span>
                    </div>
                    <p className="text-xs text-[#525252] dark:text-[#A1A1A6] font-medium">License: {activeModalItem.license} ({activeModalItem.ecosystem})</p>
                  </div>
                  <button
                    onClick={() => setActiveModalItem(null)}
                    className="w-9 h-9 rounded-full bg-white dark:bg-[#19191B] border border-[#171717]/[0.10] dark:border-white/[0.10] flex items-center justify-center text-[#737373] dark:text-[#A1A1A6] hover:text-[#171717] dark:hover:text-[#EDEDED] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body - License Text */}
                <div className="p-6 overflow-y-auto flex-1 font-mono text-xs bg-[#171717] dark:bg-[#111113] leading-relaxed selection:bg-[#FB432C] selection:text-white">
                  <pre className="whitespace-pre-wrap font-mono text-[#D4D4D8] leading-relaxed">
                    {activeModalItem.licenseText}
                  </pre>
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-white dark:bg-[#19191B] border-t border-[#171717]/[0.08] dark:border-white/[0.08] flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#525252] dark:text-[#A1A1A6]">Copyright: {activeModalItem.author}</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleCopyModalText(activeModalItem.licenseText)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#171717] dark:bg-[#EDEDED] text-white dark:text-[#111113] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#2E2E32] dark:hover:bg-white transition-colors"
                    >
                      {copiedModalText ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" /> Copied Text
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy License
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <SiteFooter />
    </div>
  );
}
