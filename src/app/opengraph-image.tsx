import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "XeroxQ — Find a Xerox Shop Near You. Print Documents Online, Securely.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Dynamic Open Graph image for XeroxQ.
 * Rendered at /opengraph-image (used as og:image for root page by Next.js).
 * Edge Runtime — renders instantly with no cold start.
 */
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#ffffff",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background accent */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(251,67,44,0.12) 0%, rgba(255,255,255,0) 70%)",
          }}
        />
        {/* Grid dot pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(circle, #e2e8f0 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            opacity: 0.5,
          }}
        />

        {/* Top: Logo + badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", zIndex: 1 }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              background: "#FB432C",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ color: "#ffffff", fontSize: "22px", fontWeight: "900", letterSpacing: "-1px" }}>
              XQ
            </div>
          </div>
          <span style={{ fontSize: "22px", fontWeight: "800", color: "#000000", letterSpacing: "-0.5px" }}>
            XeroxQ
          </span>
          <div
            style={{
              marginLeft: "8px",
              padding: "4px 12px",
              borderRadius: "999px",
              background: "rgba(251,67,44,0.08)",
              border: "1px solid rgba(251,67,44,0.2)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "11px", fontWeight: "800", color: "#FB432C", textTransform: "uppercase", letterSpacing: "0.15em" }}>
              100% Free
            </span>
          </div>
        </div>

        {/* Center: Main headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", zIndex: 1, maxWidth: "800px" }}>
          <div
            style={{
              fontSize: "64px",
              fontWeight: "900",
              color: "#000000",
              lineHeight: "1.0",
              letterSpacing: "-2px",
            }}
          >
            Find a Xerox Shop{" "}
            <span style={{ color: "#FB432C" }}>Near You.</span>
          </div>
          <div style={{ fontSize: "22px", fontWeight: "500", color: "#64748B", lineHeight: "1.5", maxWidth: "620px" }}>
            Upload your document. We find the nearest print shop. Prints &amp; vanishes.{" "}
            <span style={{ color: "#000", fontWeight: "700" }}>No WhatsApp.</span>
          </div>
        </div>

        {/* Bottom: Feature pills */}
        <div style={{ display: "flex", gap: "12px", zIndex: 1 }}>
          {[
            "🔒 AES-256 Encrypted",
            "🖨️ A4 / PDF / DOCX",
            "⚡ Zero Data Stored",
            "📍 Xerox Shops India",
          ].map((label) => (
            <div
              key={label}
              style={{
                padding: "10px 20px",
                borderRadius: "999px",
                border: "1.5px solid #e2e8f0",
                background: "#f8fafc",
                fontSize: "14px",
                fontWeight: "700",
                color: "#1e293b",
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Brand accent bar */}
        <div
          style={{
            position: "absolute",
            right: "0",
            top: "0",
            bottom: "0",
            width: "8px",
            background: "linear-gradient(180deg, #FB432C 0%, #FF591E 100%)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
