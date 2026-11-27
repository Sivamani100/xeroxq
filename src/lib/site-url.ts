const DEFAULT_PUBLIC_ORIGIN = "https://xeroxq.arkio.in";

/**
 * Strips any trailing slashes from an origin string.
 */
function normalizeOrigin(raw: string): string {
  return raw.trim().replace(/\/+$/, "");
}

/**
 * Resolves the public HTTP/HTTPS origin dynamically:
 * - On any web origin (`localhost`, preview deployment, custom domain), uses `window.location.origin`.
 * - In packaged Electron (`app://local`), falls back to `NEXT_PUBLIC_SITE_URL` so printed QR codes
 *   point to the reachable web portal instead of `app://`.
 */
export function getPublicOrigin(): string {
  if (typeof window !== "undefined") {
    const { protocol, origin } = window.location;
    if (protocol === "http:" || protocol === "https:") {
      return normalizeOrigin(origin);
    }
  }

  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured && /^https?:\/\//i.test(configured.trim())) {
    return normalizeOrigin(configured);
  }

  return DEFAULT_PUBLIC_ORIGIN;
}

/**
 * Builds the canonical customer portal URL (`origin/slug`) for QR codes and sharing.
 */
export function buildShopPortalUrl(slug: string, explicitOrigin?: string): string {
  const cleanSlug = slug.trim().replace(/^\/+/, "");
  const base = explicitOrigin ? normalizeOrigin(explicitOrigin) : getPublicOrigin();
  return cleanSlug ? `${base}/${cleanSlug}` : base;
}

/**
 * Removes URL scheme for clean display (`localhost:3000/shop` or `domain.com/shop`).
 */
export function formatDisplayUrl(url: string): string {
  return url.replace(/^https?:\/\//i, "");
}

/**
 * Allows only `http:` and `https:` URLs in user-facing anchor tags (blocks `javascript:`, `data:`, etc.).
 */
export function sanitizeExternalHttpUrl(rawUrl?: string | null): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  try {
    const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(normalized);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}
