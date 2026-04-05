"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Printer, ShieldCheck, Zap, Scissors } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { QRCodeSVG } from "qrcode.react";

function PosterContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") || "XeroxQ Shop";
  const slug = searchParams.get("slug") || "";
  const upi = searchParams.get("upi") || "";

  const qrUrl = typeof window !== "undefined" ? `${window.location.origin}/${slug}` : "";
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(qrUrl)}&color=0-0-0&bgcolor=255-255-255&margin=0`;

  return (
    <div className="min-h-screen bg-gray-100 p-0 sm:p-12 flex justify-center items-start print:p-0 print:m-0 print:bg-white selection:bg-black selection:text-white">
      {/* Strict A4 Print Formatting */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0 !important;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
          }
          /* Ensure header/footer are visible in print */
          header, footer {
            display: flex !important;
          }
          .fixed {
            display: none !important;
          }
        }
      `}</style>

      {/* Action Bar (Hidden on Print) */}
      <div className="fixed top-8 right-8 z-50 print:hidden flex gap-4">
        <button 
          onClick={() => window.print()}
          className="h-14 px-8 bg-black text-white rounded-2xl font-black text-[15px] flex items-center gap-3 shadow-2xl hover:scale-105 active:scale-95 transition-all"
        >
          <Printer className="w-6 h-6" /> Print Poster
        </button>
      </div>

      {/* A4 Page Container - Precisely Calibrated */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-[210mm] min-h-[297mm] h-[297mm] bg-white shadow-[0_0_100px_rgba(0,0,0,0.1)] print:shadow-none pt-[10mm] px-[10mm] pb-[16mm] flex flex-col relative overflow-hidden box-border"
      >
        {/* Decorative Background Elements */}
        {/* SVG Plus Pattern Mesh */}
        <div className="absolute inset-0 z-0 opacity-[0.03]"
             style={{ 
               backgroundImage: `radial-gradient(circle at 2px 2px, black 1px, transparent 0)`,
               backgroundSize: '24px 24px' 
             }} 
        />

        {/* Amorphous Blobs */}
        <div className="absolute -top-[10%] -right-[10%] w-[300px] h-[300px] bg-black/[0.02] rounded-full blur-[80px]" />
        <div className="absolute top-[20%] -left-[5%] w-[250px] h-[250px] bg-black/[0.015] rounded-full blur-[60px]" />
        <div className="absolute -bottom-[5%] right-[20%] w-[400px] h-[400px] bg-black/[0.02] rounded-full blur-[100px]" />
        
        {/* Security Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 opacity-[0.02] pointer-events-none">
           <ShieldCheck className="w-[500px] h-[500px] text-black" />
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <span className="text-[40px] font-black tracking-[0.5em] text-black uppercase leading-none">SECURE</span>
              <span className="text-[40px] font-black tracking-[0.5em] text-black uppercase leading-none">MESH</span>
           </div>
        </div>

        {/* Corner Viewfinders */}
        <div className="absolute top-[5mm] left-[5mm] w-8 h-8 border-t border-l border-black/10" />
        <div className="absolute top-[5mm] right-[5mm] w-8 h-8 border-t border-r border-black/10" />
        <div className="absolute bottom-[5mm] left-[5mm] w-8 h-8 border-b border-l border-black/10" />
        <div className="absolute bottom-[5mm] right-[5mm] w-8 h-8 border-b border-r border-black/10" />

        {/* Top Header */}
        <header className="flex justify-between items-start mb-8 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center shadow-2xl shadow-black/20">
              <Printer className="w-8 h-8 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-[28px] font-black tracking-tighter text-black leading-none mb-1">{name}</h1>
              <span className="text-[10px] font-black tracking-[0.3em] uppercase text-black/40">xerox shop</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-black/20 mb-2">Version: v2024.04</span>
            <div className="h-[1px] w-10 bg-black/10" />
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 flex flex-col items-center justify-center text-center relative z-10 py-4">
          <div className="mb-6">
            <h2 className="text-[54px] font-black tracking-tight text-black leading-[0.9] mb-4">
              Scan to<br />
              <span className="text-black/30">Securely Print</span>
            </h2>
            <p className="text-[16px] font-bold text-black/60 max-w-[400px] mx-auto leading-relaxed">
              Upload your documents instantly from any device. No cables, no logins, total privacy.
            </p>
          </div>

          {/* QR Frame - Optimized Size */}
          <div className="relative p-8 bg-white border-[3px] border-black rounded-[42px] shadow-2xl mb-8 group">
             {/* Corner Accents */}
             <div className="absolute -top-3 -left-3 w-10 h-10 border-t-[6px] border-l-[6px] border-black rounded-tl-xl" />
             <div className="absolute -top-3 -right-3 w-10 h-10 border-t-[6px] border-r-[6px] border-black rounded-tr-xl" />
             <div className="absolute -bottom-3 -left-3 w-10 h-10 border-b-[6px] border-l-[6px] border-black rounded-bl-xl" />
             <div className="absolute -bottom-3 -right-3 w-10 h-10 border-b-[6px] border-r-[6px] border-black rounded-br-xl" />
             
              <div className="bg-white p-2 rounded-[24px] flex items-center justify-center">
                 {qrUrl ? (
                   <div className="relative">
                     <QRCodeSVG 
                       value={qrUrl} 
                       size={320}
                       level="H"
                       includeMargin={false}
                       className="w-[280px] h-[280px] sm:w-[320px] sm:h-[320px]"
                     />
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl flex items-center justify-center border-[4px] border-black px-3 py-1.5 shadow-xl">
                       <span className="text-[18px] sm:text-[22px] font-black tracking-tighter text-black leading-none">XeroxQ</span>
                     </div>
                   </div>
                 ) : (
                   <div className="w-[320px] h-[320px] flex items-center justify-center text-slate-400">
                     Generating...
                   </div>
                 )}
              </div>
             
             <div className="mt-6 flex flex-col items-center">
                <span className="text-[12px] font-black tracking-[0.2em] uppercase text-black/30 mb-2">Shop Link</span>
                <code className="text-[16px] font-mono font-black text-black bg-black/5 px-5 py-2.5 rounded-xl">{qrUrl.replace('http://', '').replace('https://', '')}</code>
             </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col items-center">
              <h3 className="text-[36px] font-black tracking-tight text-black">{name}</h3>
            </div>
            
            {upi && (
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-black tracking-[0.2em] uppercase text-black/20">Digital Payments Accepted</span>
                <span className="text-[13px] font-mono font-bold text-black/60">{upi}</span>
              </div>
            )}
          </div>
        </main>

        {/* Footer Policy - Restored and Pinned Bottom */}
        <footer className="mt-4 pt-6 border-t-2 border-black/5 flex justify-between items-end relative z-10">
          <div className="flex flex-col gap-2">
             <div className="flex items-center gap-2">
               <ShieldCheck className="w-4 h-4 text-black" />
               <span className="text-[11px] font-bold text-black">Files are auto-deleted from memory.</span>
             </div>
             <div className="flex items-center gap-2">
               <Zap className="w-4 h-4 text-black" />
               <span className="text-[11px] font-bold text-black">Instant upload to shop queue.</span>
             </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black text-black/20 uppercase tracking-widest leading-none mb-1">Powered by</p>
            <p className="text-[16px] font-black text-black tracking-tighter">XeroxQ.Arkio.in</p>
          </div>
        </footer>

        {/* Cut line decor */}
        <div className="absolute top-[80mm] -left-8 right-0 border-t border-dashed border-black/[0.06] print:hidden z-20">
           <div className="absolute left-12 -top-3 bg-white px-3 flex items-center gap-2">
             <Scissors className="w-4 h-4 text-black/40" />
             <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Fold line</span>
           </div>
        </div>
      </motion.div>
    </div>
  );
}

function PosterSkeleton() {
  return (
    <div className="min-h-screen bg-gray-100 p-0 sm:p-12 flex justify-center items-start">
      <div className="w-[210mm] min-h-[297mm] h-[297mm] bg-white shadow-xl pt-[10mm] px-[10mm] pb-[16mm] flex flex-col relative overflow-hidden box-border">
         <header className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
               <Skeleton className="w-14 h-14 rounded-2xl" />
               <div className="flex flex-col gap-2">
                  <Skeleton className="w-48 h-8" />
                  <Skeleton className="w-32 h-3" />
               </div>
            </div>
            <Skeleton className="w-24 h-4" />
         </header>

         <main className="flex-1 flex flex-col items-center justify-center space-y-12">
            <div className="space-y-4 flex flex-col items-center">
               <Skeleton className="w-[300px] h-14" />
               <Skeleton className="w-[200px] h-14" />
               <Skeleton className="w-[400px] h-6" />
            </div>

            <div className="p-8 border-[3px] border-black/5 rounded-[42px] bg-white">
               <Skeleton className="w-[320px] h-[320px] rounded-[24px]" />
               <div className="mt-8 flex flex-col items-center gap-3">
                  <Skeleton className="w-32 h-3" />
                  <Skeleton className="w-64 h-10 rounded-xl" />
               </div>
            </div>

            <div className="space-y-4 flex flex-col items-center">
               <Skeleton className="w-64 h-10" />
               <Skeleton className="w-40 h-4" />
            </div>
         </main>

         <footer className="mt-4 pt-6 border-t-2 border-black/5 flex justify-between items-end">
            <div className="space-y-3">
               <Skeleton className="w-48 h-4" />
               <Skeleton className="w-40 h-4" />
            </div>
            <div className="flex flex-col items-end gap-2">
               <Skeleton className="w-20 h-2" />
               <Skeleton className="w-32 h-6" />
            </div>
         </footer>
      </div>
    </div>
  );
}

export default function PosterPage() {
  return (
    <Suspense fallback={<PosterSkeleton />}>
      <PosterContent />
    </Suspense>
  );
}
