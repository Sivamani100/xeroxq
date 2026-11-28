/**
 * XeroxQ — Shop URL Slug Utilities
 *
 * Generates clean, human-readable shop slugs (`ourdomain/shopname`):
 * 1. Auto mode from shop name:
 *    - Primary: compact lowercase alphanumeric (`"Sai Xerox"` -> `"saixerox"`).
 *    - 1st duplicate (for multi-word names): hyphenated (`"sai-xerox"`).
 *    - Further duplicates: append an extra letter (`"saixeroxa"`, `"saixeroxb"`, ...).
 * 2. Custom slug mode (user-edited):
 *    - Primary: sanitized custom slug (`"my-shop"`).
 *    - Duplicates: append an extra letter (`"my-shopa"`, `"my-shopb"`, ...).
 */

export const MAX_SHOP_SLUG_LENGTH = 50;
export const MIN_SHOP_SLUG_LENGTH = 2;
const BASE_SLUG_MAX_LENGTH = 42;

/**
 * Top-level routes & root static filenames in `src/app/` and `public/`
 * that must never be claimed as a shop slug (since shops live at `/{slug}`).
 */
export const RESERVED_SHOP_SLUGS = new Set<string>([
  "about",
  "admin",
  "api",
  "apple-icon",
  "auth",
  "blog",
  "blog-sitemap",
  "careers",
  "case-studies",
  "community",
  "cookies",
  "data",
  "demo-request",
  "desktop-tester",
  "docs",
  "enterprise",
  "favicon",
  "for-shops",
  "help-center",
  "how-it-works",
  "icon",
  "integrations",
  "licenses",
  "login",
  "maintenance",
  "manifest",
  "maps",
  "news",
  "opengraph-image",
  "papers",
  "partners",
  "platform-admin",
  "privacy",
  "quality",
  "register",
  "robots",
  "s",
  "security",
  "shops",
  "sitemap",
  "status",
  "studio",
  "support",
  "terms",
  "upload",
  "use-cases",
  "vision",
  "_next",
]);

export function isReservedShopSlug(slug: string): boolean {
  const normalized = slug.trim().toLowerCase();
  return RESERVED_SHOP_SLUGS.has(normalized);
}

/**
 * Sanitizes live input while typing in the Shop Link field.
 * Preserves a single trailing hyphen while the user is mid-edit.
 */
export function normalizeSlugTyping(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+/, "")
    .slice(0, MAX_SHOP_SLUG_LENGTH);
}

/**
 * Finalizes a user-edited slug for validation/submission (strips edge hyphens).
 */
export function finalizeSlugInput(raw: string): string {
  return normalizeSlugTyping(raw)
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SHOP_SLUG_LENGTH);
}

export function extractShopWords(shopName: string): string[] {
  const words = shopName
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return words.length > 0 ? words : ["shop"];
}

export function generateBaseShopSlugs(shopName: string): {
  compact: string;
  hyphenated: string;
} {
  const words = extractShopWords(shopName);
  let compact = words.join("").slice(0, BASE_SLUG_MAX_LENGTH);
  if (compact.length < MIN_SHOP_SLUG_LENGTH) {
    compact = `${compact}shop`.slice(0, BASE_SLUG_MAX_LENGTH);
  }

  let hyphenated = words.join("-").slice(0, BASE_SLUG_MAX_LENGTH).replace(/-+$/g, "");
  if (hyphenated.length < MIN_SHOP_SLUG_LENGTH) {
    hyphenated = compact;
  }

  return { compact, hyphenated };
}

function appendLetterVariants(base: string, count = 26): string[] {
  const trimmedBase = base.slice(0, MAX_SHOP_SLUG_LENGTH - 2);
  const variants: string[] = [];
  const letters = "abcdefghijklmnopqrstuvwxyz";

  for (let i = 0; i < Math.min(count, 26); i++) {
    variants.push(`${trimmedBase}${letters[i]}`);
  }
  return variants;
}

function appendTwoLetterVariants(base: string): string[] {
  const trimmedBase = base.slice(0, MAX_SHOP_SLUG_LENGTH - 2);
  const variants: string[] = [];
  const letters = "abcdefghijklmnopqrstuvwxyz";

  for (let i = 0; i < letters.length; i++) {
    for (let j = 0; j < letters.length; j++) {
      variants.push(`${trimmedBase}${letters[i]}${letters[j]}`);
    }
  }
  return variants;
}

export interface BuildSlugCandidatesOptions {
  shopName: string;
  preferredSlug?: string | null;
  isCustomSlug?: boolean;
}

/**
 * Returns an ordered list of valid, non-reserved slug candidates.
 */
export function buildSlugCandidates({
  shopName,
  preferredSlug,
  isCustomSlug = false,
}: BuildSlugCandidatesOptions): string[] {
  const ordered: string[] = [];
  const seen = new Set<string>();

  const pushCandidate = (candidate: string) => {
    const clean = finalizeSlugInput(candidate);
    if (clean.length < MIN_SHOP_SLUG_LENGTH) return;
    if (isReservedShopSlug(clean)) return;
    if (seen.has(clean)) return;
    seen.add(clean);
    ordered.push(clean);
  };

  if (isCustomSlug && preferredSlug) {
    const cleanCustom = finalizeSlugInput(preferredSlug);
    if (cleanCustom.length >= MIN_SHOP_SLUG_LENGTH) {
      pushCandidate(cleanCustom);
      for (const variant of appendLetterVariants(cleanCustom)) {
        pushCandidate(variant);
      }
      for (const variant of appendTwoLetterVariants(cleanCustom)) {
        pushCandidate(variant);
      }
      return ordered;
    }
  }

  const { compact, hyphenated } = generateBaseShopSlugs(shopName);

  // 1. Compact first (`xeroxq.arkio.in/saixerox`)
  pushCandidate(compact);

  // 2. Hyphenated on duplicate if multi-word (`xeroxq.arkio.in/sai-xerox`)
  if (hyphenated !== compact) {
    pushCandidate(hyphenated);
  }

  // 3. Single extra letter appended directly (`saixeroxa`, `saixeroxb`, ...)
  for (const variant of appendLetterVariants(compact)) {
    pushCandidate(variant);
  }

  // 4. Extra letter on hyphenated form if distinct (`sai-xeroxa`, ...)
  if (hyphenated !== compact) {
    for (const variant of appendLetterVariants(hyphenated)) {
      pushCandidate(variant);
    }
  }

  // 5. Two-letter fallback (`saixeroxaa`, `saixeroxab`, ...)
  for (const variant of appendTwoLetterVariants(compact)) {
    pushCandidate(variant);
  }

  return ordered;
}

/**
 * Resolves the first available slug from candidates using batched lookups.
 */
export async function resolveAvailableSlug(
  candidates: string[],
  fetchTakenSlugs: (batch: string[]) => Promise<Set<string>>,
  excludedSlugs?: Set<string>
): Promise<string> {
  const BATCH_SIZE = 30;
  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates
      .slice(i, i + BATCH_SIZE)
      .filter((c) => !excludedSlugs?.has(c));

    if (batch.length === 0) continue;

    const taken = await fetchTakenSlugs(batch);
    const available = batch.find((c) => !taken.has(c));
    if (available) return available;
  }

  // Extremely unlikely fallback (>700 shops with identical name)
  return `${candidates[0]?.slice(0, 40) || "shop"}${Math.random().toString(36).slice(2, 6)}`;
}

export interface SlugLookupClient {
  from: (table: "shops") => {
    select: (columns: "slug") => {
      in: (column: "slug", values: string[]) => PromiseLike<{
        data: { slug: string }[] | null;
        error: { message: string } | null;
      }>;
    };
  };
}

export async function fetchTakenShopSlugs(
  client: SlugLookupClient,
  batch: string[]
): Promise<Set<string>> {
  const { data, error } = await client
    .from("shops")
    .select("slug")
    .in("slug", batch);

  if (error) {
    console.warn("[shop-slug] Slug lookup warning:", error.message);
    return new Set();
  }

  return new Set((data || []).map((row) => row.slug.toLowerCase()));
}

export interface SlugInsertError {
  code?: string;
  message?: string;
  details?: string;
}

/**
 * Resolves the first free slug from `candidates` and retries insertion if a
 * concurrent request claims that slug between lookup and insert (`23505`).
 */
export async function insertWithUniqueSlug<T>(
  candidates: string[],
  client: SlugLookupClient,
  attemptInsert: (slug: string) => Promise<{ data: T | null; error: SlugInsertError | null }>,
  maxAttempts = 5
): Promise<{ data: T | null; error: SlugInsertError | null }> {
  const excludedSlugs = new Set<string>();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const finalSlug = await resolveAvailableSlug(
      candidates,
      (batch) => fetchTakenShopSlugs(client, batch),
      excludedSlugs
    );

    const { data, error } = await attemptInsert(finalSlug);
    if (!error) {
      return { data, error: null };
    }

    const isSlugConflict =
      error.code === "23505" &&
      (`${error.message || ""} ${error.details || ""}`.toLowerCase().includes("slug"));

    if (isSlugConflict) {
      excludedSlugs.add(finalSlug);
      continue;
    }

    return { data: null, error };
  }

  return {
    data: null,
    error: { message: "Could not allocate a unique shop link. Please try a different link." },
  };
}

