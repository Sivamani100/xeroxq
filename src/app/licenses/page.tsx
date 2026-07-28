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
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-sans selection:bg-[#FB432C] selection:text-white overflow-x-hidden">
      <SiteHeader />

      <main className="flex-1 pt-32 pb-24">
        {/* Hero Section */}
        <section className="relative pt-12 pb-16 text-center border-b border-gray-100">
          <div
            className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
            style={{ backgroundImage: "radial-gradient(#000 1.5px, transparent 0)", backgroundSize: "40px 40px" }}
          />

          <div className="max-w-[1280px] mx-auto px-6 relative z-10 flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl"
            >
              <div className="inline-flex items-center gap-2 px-4 h-8 rounded-full bg-black/5 border border-black/5 mb-6">
                <FileCode2 className="w-3.5 h-3.5 text-black" />
                <span className="text-[10px] font-bold text-black uppercase tracking-[0.2em]">
                  Legal & Open Source Compliance
                </span>
              </div>

              <h1 className="text-[40px] md:text-[60px] font-extrabold tracking-tighter text-black leading-[0.95] mb-6 uppercase">
                Software Licenses & Attributions
              </h1>

              <p className="text-base md:text-lg text-gray-500 font-medium leading-relaxed max-w-2xl mx-auto mb-8">
                XeroxQ is engineered with full transparency. Below is the comprehensive audit disclosure of all 
                third-party open-source packages, libraries, and frameworks powering our web, desktop, and mobile nodes.
              </p>

              {/* Status Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50/80 rounded-2xl border border-gray-200/80 max-w-3xl mx-auto">
                <div className="p-3 text-center">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                    AUDITED PACKAGES
                  </span>
                  <span className="text-xl font-extrabold text-black">{licensesData.totalDependencies}</span>
                </div>
                <div className="p-3 text-center border-l border-gray-200">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                    COPYLEFT RISK
                  </span>
                  <span className="text-xl font-extrabold text-emerald-600">0% (Permissive)</span>
                </div>
                <div className="p-3 text-center border-l border-gray-200">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                    LAST AUDIT
                  </span>
                  <span className="text-sm font-extrabold text-black uppercase">{licensesData.lastAudited}</span>
                </div>
                <div className="p-3 text-center border-l border-gray-200">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                    COMPLIANCE STATUS
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> VERIFIED
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Filter Controls & Search */}
        <section className="py-8 bg-white border-b border-gray-100 sticky top-16 z-30 shadow-sm backdrop-blur-md bg-white/90">
          <div className="max-w-[1280px] mx-auto px-6 space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Search Bar */}
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search dependencies, authors, or licenses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                <button
                  onClick={handleDownloadJSON}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" /> Export JSON
                </button>
                <a
                  href="/api/licenses"
                  target="_blank"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 border border-gray-200 text-black rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors"
                >
                  <Terminal className="w-3.5 h-3.5" /> API Response
                </a>
              </div>
            </div>

            {/* Tabs: Ecosystem */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-2 flex items-center gap-1 shrink-0">
                <Layers className="w-3.5 h-3.5" /> Ecosystem:
              </span>
              {ecosystems.map((eco) => (
                <button
                  key={eco}
                  onClick={() => setSelectedEcosystem(eco)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    selectedEcosystem === eco
                      ? "bg-black text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {eco}
                </button>
              ))}
            </div>

            {/* License Type Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-2 flex items-center gap-1 shrink-0">
                <Filter className="w-3.5 h-3.5" /> License Type:
              </span>
              {licenseTypes.map((lic) => (
                <button
                  key={lic}
                  onClick={() => setSelectedLicenseType(lic)}
                  className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider transition-all whitespace-nowrap ${
                    selectedLicenseType === lic
                      ? "bg-[#FB432C] text-white shadow-sm"
                      : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100"
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
            <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-300">
              <Code2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-black mb-1">No matching dependencies found</h3>
              <p className="text-sm text-gray-500">Try adjusting your search query or clear filters.</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedEcosystem("All");
                  setSelectedLicenseType("All");
                }}
                className="mt-4 px-4 py-2 bg-black text-white text-xs font-bold rounded-xl uppercase tracking-wider"
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
                  className="p-6 bg-white rounded-2xl border border-gray-200 hover:border-black/30 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2.5 py-1 bg-gray-100 rounded-md">
                        {item.ecosystem}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md ${
                          item.license === "MIT"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : item.license === "Apache-2.0"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-purple-50 text-purple-700 border border-purple-200"
                        }`}
                      >
                        {item.license}
                      </span>
                    </div>

                    {/* Name & Version */}
                    <div className="flex items-baseline gap-2 mb-2">
                      <h3 className="text-lg font-extrabold text-black group-hover:text-[#FB432C] transition-colors">
                        {item.name}
                      </h3>
                      <span className="text-xs font-bold text-gray-400 font-mono">v{item.version}</span>
                    </div>

                    {/* Description & Author */}
                    <p className="text-xs text-gray-600 font-medium leading-relaxed mb-4 line-clamp-2">
                      {item.description}
                    </p>
                    <div className="text-[11px] font-semibold text-gray-400 mb-6">
                      Author: <span className="text-gray-700">{item.author}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                    <button
                      onClick={() => setActiveModalItem(item)}
                      className="text-xs font-extrabold text-black hover:text-[#FB432C] transition-colors flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#FB432C]" /> View License Text
                    </button>

                    {item.homepage && (
                      <a
                        href={item.homepage}
                        target="_blank"
                        rel="noreferrer"
                        className="text-gray-400 hover:text-black transition-colors"
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
          <div className="p-8 bg-zinc-950 text-white rounded-3xl border border-zinc-800 relative overflow-hidden">
            <div className="relative z-10 max-w-3xl space-y-4">
              <div className="flex items-center gap-2 text-[#FB432C] text-xs font-extrabold uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4" /> Legal Attribution Notice
              </div>
              <h3 className="text-xl font-bold tracking-tight">Zero-Knowledge & Sublicensing Policy</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-medium">
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
                className="bg-white w-full max-w-3xl rounded-3xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
              >
                {/* Modal Header */}
                <div className="p-6 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-extrabold text-black">{activeModalItem.name}</h3>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 bg-black text-white rounded-md">
                        v{activeModalItem.version}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">License: {activeModalItem.license} ({activeModalItem.ecosystem})</p>
                  </div>
                  <button
                    onClick={() => setActiveModalItem(null)}
                    className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-black transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body - License Text */}
                <div className="p-6 overflow-y-auto flex-1 font-mono text-xs text-gray-800 bg-zinc-950/95 leading-relaxed selection:bg-[#FB432C] selection:text-white">
                  <pre className="whitespace-pre-wrap font-mono text-zinc-300 leading-relaxed">
                    {activeModalItem.licenseText}
                  </pre>
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-white border-t border-gray-200 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">Copyright: {activeModalItem.author}</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleCopyModalText(activeModalItem.licenseText)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors"
                    >
                      {copiedModalText ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied Text
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
