"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { Printer, ShieldCheck, Zap, Scissors, Download, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { QRCodeSVG } from "qrcode.react";
import { getPublicOrigin, formatDisplayUrl } from "@/lib/site-url";
import { ThemeToggle } from "@/lib/theme";

// Helper to parse the SVG path of standard QRCodeSVG into a matrix
function parsePathToMatrix(d: string, numCells: number): boolean[][] {
  const matrix = Array(numCells).fill(null).map(() => Array(numCells).fill(false));
  const regex = /M(\d+(?:\.\d+)?)[\s,](\d+(?:\.\d+)?)\s*h(\d+(?:\.\d+)?)/gi;
  let match;
  while ((match = regex.exec(d)) !== null) {
    const x = Math.round(parseFloat(match[1]));
    const y = Math.round(parseFloat(match[2]));
    const w = Math.round(parseFloat(match[3]));
    for (let i = 0; i < w; i++) {
      if (x + i < numCells && y < numCells) {
        matrix[y][x + i] = true;
      }
    }
  }
  return matrix;
}

// Helper to build horizontal runs back to standard SVG rect commands
function generateSVGPath(modules: boolean[][]): string {
  const ops: string[] = [];
  modules.forEach(function(row, y) {
    let start: number | null = null;
    row.forEach(function(cell, x) {
      if (!cell && start !== null) {
        ops.push(`M${start} ${y}h${x - start}v1H${start}z`);
        start = null;
        return;
      }
      if (x === row.length - 1) {
        if (!cell) return;
        if (start === null) {
          ops.push(`M${x},${y} h1v1H${x}z`);
        } else {
          ops.push(`M${start},${y} h${x + 1 - start}v1H${start}z`);
        }
        return;
      }
      if (cell && start === null) {
        start = x;
      }
    });
  });
  return ops.join("");
}

interface SmoothQRCodeProps {
  rawPath: string;
}

function SmoothQRCode({ rawPath }: SmoothQRCodeProps) {
  if (!rawPath) return null;

  // 1. Calculate numCells
  let maxCoord = 0;
  const coordRegex = /M(\d+(?:\.\d+)?)[\s,](\d+(?:\.\d+)?)/gi;
  let match;
  while ((match = coordRegex.exec(rawPath)) !== null) {
    const x = parseFloat(match[1]);
    const y = parseFloat(match[2]);
    maxCoord = Math.max(maxCoord, x, y);
  }
  const numCells = Math.round(maxCoord) + 1;

  // 2. Parse raw path to matrix
  const matrix = parsePathToMatrix(rawPath, numCells);

  // 3. Define finder pattern ranges (7x7 blocks at corners)
  const isFinder = (x: number, y: number) => {
    if (x >= 0 && x < 7 && y >= 0 && y < 7) return true; // Top-Left
    if (x >= numCells - 7 && x < numCells && y >= 0 && y < 7) return true; // Top-Right
    if (x >= 0 && x < 7 && y >= numCells - 7 && y < numCells) return true; // Bottom-Left
    return false;
  };

  // 4. Create body matrix (matrix with finders removed)
  const bodyMatrix = matrix.map((row, y) =>
    row.map((cell, x) => (isFinder(x, y) ? false : cell))
  );

  // 5. Generate body path
  const bodyPath = generateSVGPath(bodyMatrix);

  // 6. Calculate logo size and position in terms of modules matching standard QR calculations
  const scale = numCells / 360;
  const logoW = 90 * scale;
  const logoH = 30 * scale;
  const logoX = numCells / 2 - logoW / 2;
  const logoY = numCells / 2 - logoH / 2;

  return (
    <svg
      viewBox={`0 0 ${numCells} ${numCells}`}
      className="w-[420px] h-[420px] sm:w-[460px] sm:h-[460px] select-none"
    >
      {/* White background block */}
      <rect x={0} y={0} width={numCells} height={numCells} fill="#ffffff" />

      {/* Body Modules (Smoothed via CSS stroke) */}
      <path
        d={bodyPath}
        fill="#000000"
        className="qr-body-path"
      />

      {/* Finder Pattern: Top-Left */}
      <g fill="#000000">
        <rect x={0} y={0} width={7} height={7} rx={1.6} ry={1.6} />
        <rect x={1} y={1} width={5} height={5} rx={0.9} ry={0.9} fill="#ffffff" />
        <rect x={2} y={2} width={3} height={3} rx={0.4} ry={0.4} />
      </g>

      {/* Finder Pattern: Top-Right */}
      <g fill="#000000">
        <rect x={numCells - 7} y={0} width={7} height={7} rx={1.6} ry={1.6} />
        <rect x={numCells - 6} y={1} width={5} height={5} rx={0.9} ry={0.9} fill="#ffffff" />
        <rect x={numCells - 5} y={2} width={3} height={3} rx={0.4} ry={0.4} />
      </g>

      {/* Finder Pattern: Bottom-Left */}
      <g fill="#000000">
        <rect x={0} y={numCells - 7} width={7} height={7} rx={1.6} ry={1.6} />
        <rect x={1} y={numCells - 6} width={5} height={5} rx={0.9} ry={0.9} fill="#ffffff" />
        <rect x={2} y={numCells - 5} width={3} height={3} rx={0.4} ry={0.4} />
      </g>

      {/* White buffer card to clear QR modules around the stroke, creating a clean white gap */}
      <rect
        x={logoX - 1.3}
        y={logoY - 1.3}
        width={logoW + 2.6}
        height={logoH + 2.6}
        rx={1.5}
        ry={1.5}
        fill="#ffffff"
      />

      {/* Rounded white card container with a crisp black stroke outline behind the logo */}
      <rect
        x={logoX - 1.0}
        y={logoY - 1.0}
        width={logoW + 2.0}
        height={logoH + 2.0}
        rx={1.2}
        ry={1.2}
        fill="#ffffff"
        stroke="#000000"
        strokeWidth={0.2}
      />

      {/* XeroxQ Vector Logo in the middle (100% native SVG paths, avoids html2canvas export issues) */}
      <g transform={`translate(${logoX}, ${logoY}) scale(${logoW / 1548}, ${logoH / 512})`}>
        <path d="M400.062 171.625H223.109C214.096 171.625 205.452 175.205 199.079 181.579C192.705 187.952 189.125 196.596 189.125 205.609V298.188C189.125 306.89 192.582 315.236 198.736 321.389C204.889 327.543 213.235 331 221.938 331H226.625V354.25C226.625 360.516 229.114 366.525 233.545 370.955C237.975 375.386 243.984 377.875 250.25 377.875H371.75C378.016 377.875 384.025 375.386 388.455 370.955C392.886 366.525 395.375 360.516 395.375 354.25V331H400.062C408.765 331 417.111 327.543 423.264 321.389C429.418 315.236 432.875 306.89 432.875 298.188V204.438C432.875 195.735 429.418 187.389 423.264 181.236C417.111 175.082 408.765 171.625 400.062 171.625ZM376.625 354.25C376.62 355.542 376.105 356.779 375.192 357.692C374.279 358.605 373.042 359.12 371.75 359.125H250.25C248.958 359.12 247.721 358.605 246.808 357.692C245.895 356.779 245.38 355.542 245.375 354.25V260.875C245.38 259.583 245.895 258.346 246.808 257.433C247.721 256.52 248.958 256.005 250.25 256H371.75C373.042 256.005 374.279 256.52 375.192 257.433C376.105 258.346 376.62 259.583 376.625 260.875V354.25ZM391.859 227.828C388.991 228.059 386.121 227.404 383.637 225.952C381.153 224.5 379.174 222.321 377.967 219.709C376.76 217.097 376.384 214.177 376.888 211.344C377.393 208.512 378.754 205.902 380.789 203.867C382.824 201.832 385.434 200.471 388.266 199.966C391.099 199.462 394.019 199.838 396.631 201.045C399.243 202.252 401.422 204.231 402.874 206.715C404.326 209.199 404.981 212.069 404.75 214.937C404.482 218.267 403.038 221.393 400.676 223.755C398.314 226.116 395.189 227.561 391.859 227.828ZM362.562 134.125H259.438C251.551 134.137 243.931 136.984 237.97 142.147C232.008 147.311 228.102 154.446 226.965 162.25H395.035C393.898 154.446 389.992 147.311 384.03 142.147C378.069 136.984 370.449 134.125 362.562 134.125Z" fill="#000000"/>
        <path d="M611.662 174.364L644.661 230.134H645.939L679.098 174.364H718.169L668.232 256.182L719.288 338H679.498L645.939 282.15H644.661L611.103 338H571.472L622.688 256.182L572.431 174.364H611.662ZM788.981 340.397C776.357 340.397 765.491 337.84 756.382 332.727C747.326 327.56 740.348 320.262 735.448 310.834C730.547 301.352 728.097 290.14 728.097 277.196C728.097 264.571 730.547 253.492 735.448 243.957C740.348 234.422 747.247 226.991 756.142 221.665C765.091 216.338 775.585 213.675 787.623 213.675C795.72 213.675 803.257 214.98 810.235 217.59C817.266 220.147 823.392 224.009 828.612 229.175C833.885 234.342 837.987 240.841 840.917 248.671C843.846 256.448 845.311 265.557 845.311 275.997V285.346H741.68V264.252H813.271C813.271 259.351 812.206 255.01 810.075 251.228C807.944 247.446 804.988 244.49 801.206 242.359C797.477 240.175 793.136 239.083 788.182 239.083C783.015 239.083 778.434 240.282 774.439 242.679C770.498 245.022 767.408 248.192 765.171 252.187C762.934 256.129 761.788 260.523 761.735 265.37V285.425C761.735 291.498 762.854 296.745 765.091 301.166C767.381 305.587 770.604 308.996 774.759 311.393C778.914 313.79 783.841 314.989 789.541 314.989C793.323 314.989 796.785 314.456 799.928 313.391C803.07 312.325 805.76 310.727 807.998 308.597C810.235 306.466 811.939 303.856 813.111 300.766L844.592 302.844C842.994 310.408 839.718 317.013 834.764 322.659C829.864 328.252 823.525 332.62 815.748 335.763C808.024 338.852 799.102 340.397 788.981 340.397ZM867.524 338V215.273H900.522V236.686H901.801C904.038 229.069 907.793 223.316 913.067 219.428C918.34 215.486 924.413 213.515 931.284 213.515C932.989 213.515 934.826 213.621 936.797 213.835C938.768 214.048 940.499 214.341 941.991 214.713V244.916C940.393 244.436 938.182 244.01 935.359 243.637C932.536 243.265 929.953 243.078 927.609 243.078C922.602 243.078 918.127 244.17 914.185 246.354C910.297 248.485 907.207 251.468 904.917 255.303C902.68 259.138 901.561 263.559 901.561 268.566V338H867.524ZM1009.33 340.397C996.916 340.397 986.183 337.76 977.127 332.487C968.125 327.16 961.174 319.756 956.273 310.275C951.373 300.74 948.922 289.687 948.922 277.116C948.922 264.438 951.373 253.359 956.273 243.877C961.174 234.342 968.125 226.938 977.127 221.665C986.183 216.338 996.916 213.675 1009.33 213.675C1021.74 213.675 1032.44 216.338 1041.45 221.665C1050.5 226.938 1057.48 234.342 1062.38 243.877C1067.28 253.359 1069.73 264.438 1069.73 277.116C1069.73 289.687 1067.28 300.74 1062.38 310.275C1057.48 319.756 1050.5 327.16 1041.45 332.487C1032.44 337.76 1021.74 340.397 1009.33 340.397ZM1009.49 314.03C1015.13 314.03 1019.85 312.432 1023.63 309.236C1027.41 305.987 1030.26 301.565 1032.18 295.972C1034.15 290.379 1035.13 284.014 1035.13 276.876C1035.13 269.738 1034.15 263.373 1032.18 257.78C1030.26 252.187 1027.41 247.766 1023.63 244.516C1019.85 241.267 1015.13 239.642 1009.49 239.642C1003.79 239.642 998.993 241.267 995.105 244.516C991.27 247.766 988.366 252.187 986.396 257.78C984.478 263.373 983.519 269.738 983.519 276.876C983.519 284.014 984.478 290.379 986.396 295.972C988.366 301.565 991.27 305.987 995.105 309.236C998.993 312.432 1003.79 314.03 1009.49 314.03ZM1115.91 215.273L1138.45 258.179L1161.54 215.273H1196.45L1160.9 276.636L1197.41 338H1162.66L1138.45 295.573L1114.64 338H1079.48L1115.91 276.636L1080.76 215.273H1115.91ZM1279.07 281.111H1308.47L1323.26 300.127L1337.8 317.066L1365.2 351.423H1332.92L1314.07 328.252L1304.4 314.509L1279.07 281.111ZM1367.68 256.182C1367.68 274.026 1364.3 289.207 1357.53 301.725C1350.82 314.243 1341.66 323.804 1330.05 330.409C1318.49 336.961 1305.49 340.237 1291.06 340.237C1276.51 340.237 1263.46 336.935 1251.91 330.33C1240.35 323.724 1231.21 314.163 1224.5 301.645C1217.79 289.127 1214.43 273.973 1214.43 256.182C1214.43 238.337 1217.79 223.156 1224.5 210.638C1231.21 198.121 1240.35 188.586 1251.91 182.034C1263.46 175.429 1276.51 172.126 1291.06 172.126C1305.49 172.126 1318.49 175.429 1330.05 182.034C1341.66 188.586 1350.82 198.121 1357.53 210.638C1364.3 223.156 1367.68 238.337 1367.68 256.182ZM1332.6 256.182C1332.6 244.623 1330.87 234.875 1327.41 226.938C1324 219.001 1319.18 212.982 1312.95 208.881C1306.72 204.779 1299.42 202.728 1291.06 202.728C1282.69 202.728 1275.4 204.779 1269.16 208.881C1262.93 212.982 1258.08 219.001 1254.62 226.938C1251.21 234.875 1249.51 244.623 1249.51 256.182C1249.51 267.741 1251.21 277.489 1254.62 285.425C1258.08 293.362 1262.93 299.381 1269.16 303.483C1275.4 307.585 1282.69 309.635 1291.06 309.635C1299.42 309.635 1306.72 307.585 1312.95 303.483C1319.18 299.381 1324 293.362 1327.41 285.425C1330.87 277.489 1332.6 267.741 1332.6 256.182Z" fill="#000000" />
      </g>
    </svg>
  );
}

function PosterContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") || "XeroxQ Shop";
  const slug = searchParams.get("slug") || "";
  const upi = searchParams.get("upi") || "";

  const [isDownloadingPNG, setIsDownloadingPNG] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [rawPath, setRawPath] = useState<string>("");
  const publicWebUrl = getPublicOrigin();
  const qrUrl = slug ? `${publicWebUrl}/${slug}` : "";

  useEffect(() => {
    // Read raw path from hidden QR code on mount/load
    const hiddenPath = document.querySelector("#hidden-qr-code path:nth-of-type(2)");
    if (hiddenPath) {
      setRawPath(hiddenPath.getAttribute("d") || "");
    }
  }, [qrUrl]);

  const handleDownloadPNG = async () => {
    const posterElement = document.getElementById("poster-container");
    if (!posterElement) return;

    setIsDownloadingPNG(true);
    setDownloadError(null);
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const canvas = await html2canvas(posterElement, {
        scale: 3, // High resolution (3x)
        useCORS: true,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794,
        windowHeight: 1123,
      });

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `Poster_${name.replace(/\s+/g, "_")}.png`;
      link.click();
    } catch (error) {
      console.error("Error generating PNG:", error);
      setDownloadError("Could not export PNG. Try printing directly instead.");
    } finally {
      setIsDownloadingPNG(false);
    }
  };

  const handleDownloadPDF = async () => {
    const posterElement = document.getElementById("poster-container");
    if (!posterElement) return;

    setIsDownloadingPDF(true);
    setDownloadError(null);
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const canvas = await html2canvas(posterElement, {
        scale: 2.5, // High resolution (2.5x)
        useCORS: true,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794,
        windowHeight: 1123,
      });

      const imgData = canvas.toDataURL("image/png", 1.0);
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF("p", "mm", "a4");
      
      // A4 Dimensions: 210mm x 297mm
      pdf.addImage(imgData, "PNG", 0, 0, 210, 297);
      pdf.save(`Poster_${name.replace(/\s+/g, "_")}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setDownloadError("Could not export PDF. Try printing directly instead.");
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#111113] p-0 sm:p-10 flex justify-center items-start print:p-0 print:m-0 print:bg-white selection:bg-[#171717] selection:text-white">
      {/* Strict A4 Print Formatting and Smooth QR Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
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
          header, footer {
            display: flex !important;
          }
          .fixed {
            display: none !important;
          }
        }
        
        /* Smooth QR Code Styling: round corners of body modules */
        .qr-body-path {
          shape-rendering: auto !important;
          stroke: #000000 !important;
          stroke-width: 0.22px !important;
          stroke-linejoin: round !important;
          stroke-linecap: round !important;
        }
      `}} />

      {/* Hidden standard QR Code to generate raw paths */}
      <div style={{ display: "none", visibility: "hidden" }}>
        {qrUrl && (
          <QRCodeSVG 
            id="hidden-qr-code"
            value={qrUrl} 
            size={360}
            level="H"
            includeMargin={false}
            imageSettings={{
              src: "/xeroxqlogo.svg",
              x: undefined,
              y: undefined,
              height: 30,
              width: 90,
              excavate: true,
            }}
          />
        )}
      </div>

      {/* Action Bar (Hidden on Print) */}
      <div className="fixed top-6 right-6 z-50 print:hidden flex flex-col items-end gap-2">
        <div className="flex items-center gap-2 bg-white dark:bg-[#19191B] p-1.5 rounded-xl border border-[#171717]/[0.08] dark:border-white/[0.08] shadow-sm">
          <ThemeToggle compact />
          <button
            type="button"
            onClick={() => window.print()}
            className="h-9 px-3.5 bg-[#F4F4F5] dark:bg-[#232325] hover:bg-[#E4E4E7] dark:hover:bg-[#2C2C30] text-[#171717] dark:text-[#EDEDED] rounded-lg font-medium text-[13px] flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" strokeWidth={1.75} />
            Print A4
          </button>
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isDownloadingPDF}
            className="h-9 px-3.5 bg-[#F4F4F5] dark:bg-[#232325] hover:bg-[#E4E4E7] dark:hover:bg-[#2C2C30] disabled:opacity-60 text-[#171717] dark:text-[#EDEDED] rounded-lg font-medium text-[13px] flex items-center gap-2 transition-colors cursor-pointer"
          >
            {isDownloadingPDF ? (
              <RefreshCw className="w-4 h-4 animate-spin" strokeWidth={1.75} />
            ) : (
              <Download className="w-4 h-4" strokeWidth={1.75} />
            )}
            PDF
          </button>
          <button
            type="button"
            onClick={handleDownloadPNG}
            disabled={isDownloadingPNG}
            className="h-9 px-4 bg-[#171717] dark:bg-[#EDEDED] hover:bg-[#262626] dark:hover:bg-white disabled:opacity-60 text-white dark:text-[#111113] rounded-lg font-medium text-[13px] flex items-center gap-2 transition-colors cursor-pointer"
          >
            {isDownloadingPNG ? (
              <RefreshCw className="w-4 h-4 animate-spin" strokeWidth={1.75} />
            ) : (
              <Download className="w-4 h-4" strokeWidth={1.75} />
            )}
            Download PNG
          </button>
        </div>
        {downloadError && (
          <p className="text-[12px] font-medium text-[#DC2626] dark:text-[#E5484D] bg-white dark:bg-[#19191B] px-3 py-1.5 rounded-lg border border-[#DC2626]/20 dark:border-[#E5484D]/25 shadow-sm">
            {downloadError}
          </p>
        )}
      </div>

      {/* A4 Page Container - Precisely Calibrated */}
      <motion.div
        id="poster-container"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="w-[794px] h-[1123px] max-w-full print:w-[210mm] print:h-[297mm] print:min-h-[297mm] print:shadow-none print:border-0 flex flex-col relative overflow-hidden box-border pt-[14mm] px-[14mm] pb-[12mm] bg-white border border-[#171717]/[0.08] text-[#171717]"
      >
        {/* Top Header */}
        <header className="flex justify-between items-center pb-6 border-b border-[#171717]/[0.08]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-[#171717] text-white rounded-xl flex items-center justify-center">
              <Printer className="w-6 h-6" strokeWidth={1.75} />
            </div>
            <div className="flex flex-col">
              <h1 className="text-[24px] font-semibold tracking-tight leading-tight text-[#171717]">
                {name}
              </h1>
              <span className="text-[13px] font-medium text-[#737373]">
                Instant print station
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F4F4F5] border border-[#171717]/[0.08]">
            <span className="w-2 h-2 rounded-full bg-[#FB432C]" />
            <span className="text-[12px] font-medium text-[#171717]">
              No app needed
            </span>
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 flex flex-col items-center justify-center text-center py-4">
          <div className="mb-6">
            <h2 className="text-[48px] font-semibold tracking-tight leading-[1.05] mb-3 text-[#171717]">
              Scan to print
            </h2>
            <p className="text-[16px] font-normal max-w-[420px] mx-auto leading-relaxed text-[#525252]">
              Send PDFs, photos, and documents straight from your phone camera. No cables, no login, no waiting.
            </p>
          </div>

          {/* QR Frame */}
          <div className="p-6 bg-white rounded-2xl border border-[#171717]/[0.10] flex flex-col items-center">
            <div className="bg-white p-1 flex items-center justify-center">
              {rawPath ? (
                <SmoothQRCode rawPath={rawPath} />
              ) : (
                <div className="w-[420px] h-[420px] sm:w-[460px] sm:h-[460px] flex items-center justify-center text-[#737373] text-[14px]">
                  Generating QR code...
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-col items-center">
              <span className="text-[12px] font-medium text-[#737373] mb-1.5">
                Direct upload link
              </span>
              <div className="flex items-center gap-2.5 px-5 py-2.5 bg-[#171717] text-white rounded-lg">
                <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                <code className="text-[15px] font-mono font-medium tracking-tight">
                  {qrUrl.replace("http://", "").replace("https://", "")}
                </code>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-[22px] font-semibold tracking-tight text-[#171717]">
              {name}
            </p>
          </div>
        </main>

        {/* Footer Policy */}
        <footer className="mt-auto pt-5 border-t border-[#171717]/[0.08] flex justify-between items-end">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-[#525252]">
              <ShieldCheck className="w-4 h-4 text-[#171717]" strokeWidth={1.75} />
              <span className="text-[12px] font-medium">
                Files are automatically deleted after printing.
              </span>
            </div>
            <div className="flex items-center gap-2 text-[#525252]">
              <Zap className="w-4 h-4 text-[#171717]" strokeWidth={1.75} />
              <span className="text-[12px] font-medium">
                Instant upload straight to the counter queue.
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-medium text-[#737373] mb-0.5">
              Powered by
            </p>
            <p className="text-[15px] font-semibold tracking-tight text-[#171717]">
              {formatDisplayUrl(publicWebUrl) || "XeroxQ"}
            </p>
          </div>
        </footer>
      </motion.div>
    </div>
  );
}

function PosterSkeleton() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#111113] p-0 sm:p-10 flex justify-center items-start">
      <div className="w-[794px] h-[1123px] max-w-full bg-white border border-[#171717]/[0.08] pt-[14mm] px-[14mm] pb-[12mm] flex flex-col box-border">
        <header className="flex justify-between items-center pb-6 border-b border-[#171717]/[0.08]">
          <div className="flex items-center gap-3.5">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <div className="flex flex-col gap-2">
              <Skeleton className="w-44 h-6" />
              <Skeleton className="w-28 h-3.5" />
            </div>
          </div>
          <Skeleton className="w-28 h-8 rounded-lg" />
        </header>

        <main className="flex-1 flex flex-col items-center justify-center space-y-6">
          <div className="space-y-3 flex flex-col items-center">
            <Skeleton className="w-64 h-12" />
            <Skeleton className="w-96 h-5" />
          </div>

          <div className="p-6 rounded-2xl border border-[#171717]/[0.08] flex flex-col items-center">
            <Skeleton className="w-[420px] h-[420px] rounded-xl" />
            <div className="mt-5 flex flex-col items-center gap-2">
              <Skeleton className="w-28 h-3" />
              <Skeleton className="w-64 h-10 rounded-lg" />
            </div>
          </div>

          <Skeleton className="w-48 h-7" />
        </main>

        <footer className="mt-4 pt-5 border-t border-[#171717]/[0.08] flex justify-between items-end">
          <div className="space-y-2">
            <Skeleton className="w-52 h-4" />
            <Skeleton className="w-44 h-4" />
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Skeleton className="w-16 h-3" />
            <Skeleton className="w-28 h-5" />
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
