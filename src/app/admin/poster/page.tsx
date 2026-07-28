"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { Printer, ShieldCheck, Zap, Scissors, Download, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { QRCodeSVG } from "qrcode.react";

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
  const [rawPath, setRawPath] = useState<string>("");
  const publicWebUrl = "https://xeroxq.arkio.in";
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
      alert("Failed to download poster as PNG. Please try printing to PDF instead.");
    } finally {
      setIsDownloadingPNG(false);
    }
  };

  const handleDownloadPDF = async () => {
    const posterElement = document.getElementById("poster-container");
    if (!posterElement) return;

    setIsDownloadingPDF(true);
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
      alert("Failed to download poster as PDF. Please try printing instead.");
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-0 sm:p-12 flex justify-center items-start print:p-0 print:m-0 print:bg-white selection:bg-black selection:text-white">
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
          /* Ensure header/footer are visible in print */
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
      <div className="fixed top-8 right-8 z-50 print:hidden flex gap-4 bg-white/80 backdrop-blur-md p-3 rounded-2xl border border-gray-200/50 shadow-2xl">
        <button 
          onClick={handleDownloadPNG}
          disabled={isDownloadingPNG}
          className="h-11 px-5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 disabled:opacity-75 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md hover:scale-102 active:scale-98 transition-all cursor-pointer"
        >
          {isDownloadingPNG ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Download PNG
        </button>
      </div>

      {/* A4 Page Container - Precisely Calibrated */}
      <motion.div 
        id="poster-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-[794px] h-[1123px] max-w-full print:w-[210mm] print:h-[297mm] print:min-h-[297mm] print:shadow-none flex flex-col relative overflow-hidden box-border pt-[12mm] px-[12mm] pb-[30px] bg-white shadow-[0_0_80px_rgba(0,0,0,0.06)] text-black"
      >
        {/* Decorative Background Elements */}
        {/* SVG Plus Pattern Mesh */}
        <div className="absolute inset-0 z-0 opacity-[0.03]"
             style={{ 
               backgroundImage: `radial-gradient(circle at 2px 2px, black 1px, transparent 0)`,
               backgroundSize: '24px 24px'
             }} 
        />

        {/* Subtle Decorative Blobs */}
        <div className="absolute -top-[10%] -right-[10%] w-[300px] h-[300px] bg-black/[0.01] rounded-full blur-[80px]" />
        <div className="absolute top-[20%] -left-[5%] w-[250px] h-[250px] bg-black/[0.008] rounded-full blur-[60px]" />
        <div className="absolute -bottom-[5%] right-[20%] w-[400px] h-[400px] bg-black/[0.01] rounded-full blur-[100px]" />
        
        {/* Security Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 opacity-[0.015] pointer-events-none">
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
            <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-black/20">
              <Printer className="w-8 h-8" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-[28px] font-black tracking-tighter leading-none mb-1 text-black">{name}</h1>
              <span className="text-[10px] font-black tracking-[0.3em] uppercase text-black/40">xerox shop</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-black/20 mb-2">Version: v2024.04</span>
            <div className="h-[1px] w-10 bg-black/10" />
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 flex flex-col items-center justify-center text-center relative z-10 py-2">
          <div className="mb-6">
            <h2 className="text-[54px] font-black tracking-tight leading-[0.9] mb-4 text-black">
              Scan to<br />
              <span className="text-black/30">Securely Print</span>
            </h2>
            <p className="text-[16px] font-bold max-w-[400px] mx-auto leading-relaxed text-black/60">
              Upload your documents instantly from any device. No cables, no logins, total privacy.
            </p>
          </div>

          {/* QR Frame - Clean, borderless and optimized layout */}
          <div className="relative p-4 bg-white mb-2 group flex flex-col items-center">
              <div className="bg-white p-2 flex items-center justify-center">
                 {rawPath ? (
                   <SmoothQRCode rawPath={rawPath} />
                 ) : (
                   <div className="w-[420px] h-[420px] sm:w-[460px] sm:h-[460px] flex items-center justify-center text-slate-400">
                     Generating...
                   </div>
                 )}
              </div>
             
             <div className="mt-6 flex flex-col items-center">
                <span className="text-[11px] font-black tracking-[0.25em] uppercase text-black/40 mb-2">Shop Link</span>
                <div className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full shadow-lg shadow-black/10">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <code className="text-[16px] font-mono font-black tracking-tight">{qrUrl.replace('http://', '').replace('https://', '')}</code>
                </div>
             </div>
          </div>

          <div className="space-y-2 mb-1">
            <div className="flex flex-col items-center">
              <h3 className="text-[36px] font-black tracking-tight text-black">{name}</h3>
            </div>
          </div>
        </main>

        {/* Footer Policy - Restored and Pinned Bottom */}
        <footer className="mt-auto pt-6 border-t-2 border-black/5 flex justify-between items-end relative z-10">
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
            <p className="text-[9px] font-black uppercase tracking-widest leading-none mb-1 text-black/20">Powered by</p>
            <p className="text-[16px] font-black tracking-tighter text-black">XeroxQ.Arkio.in</p>
          </div>
        </footer>
      </motion.div>
    </div>
  );
}

function PosterSkeleton() {
  return (
    <div className="min-h-screen bg-gray-100 p-0 sm:p-12 flex justify-center items-start">
      <div className="w-[794px] h-[1123px] max-w-full bg-white shadow-xl pt-[10mm] px-[10mm] pb-[30px] flex flex-col relative overflow-hidden box-border">
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

         <main className="flex-1 flex flex-col items-center justify-center space-y-6">
            <div className="space-y-4 flex flex-col items-center">
               <Skeleton className="w-[300px] h-14" />
               <Skeleton className="w-[200px] h-14" />
               <Skeleton className="w-[400px] h-6" />
            </div>

            <div className="p-4 bg-white flex flex-col items-center">
               <Skeleton className="w-[420px] h-[420px] rounded-[24px]" />
               <div className="mt-8 flex flex-col items-center gap-3">
                  <Skeleton className="w-32 h-3" />
                  <Skeleton className="w-64 h-10 rounded-full" />
               </div>
            </div>

            <div className="space-y-4 flex flex-col items-center">
               <Skeleton className="w-64 h-10" />
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
