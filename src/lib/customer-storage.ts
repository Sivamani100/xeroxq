const HISTORY_KEY = "xeroxq.portal.history.v2";
const LEGACY_KEY = "xeroxq_history";
const PREFS_KEY = "xeroxq.portal.preferences.v1";
const MAX_BATCHES = 20;
const BATCH_TTL_MS = 24 * 60 * 60 * 1000;

let migrated = false;

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface StoredFile {
  jobId: string;
  token: string;
  fileName: string;
  pageCount: number;
  color: boolean;
  copies: number;
  doubleSided: boolean;
  status: string;
  isDeleted: boolean;
  deletionReason: "user" | "policy" | null;
}

export interface StoredBatch {
  batchId: string;
  shopId: string;
  shopSlug: string;
  shopName: string;
  createdAt: string;
  expiresAt: string;
  locationMode: "shop" | "home";
  isPaid: boolean;
  estimatedTotal: number;
  feedbackSubmitted: boolean;
  files: StoredFile[];
}

export interface CustomerPreferences {
  displayName: string;
  defaultColor: boolean;
  defaultDoubleSided: boolean;
  defaultCopies: number;
  lastShopSlug: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function createBatchId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // fall through
  }
  // Math.random fallback
  return "batch-" +
    Math.random().toString(36).slice(2, 10) +
    "-" +
    Math.random().toString(36).slice(2, 10) +
    "-" +
    Date.now().toString(36);
}

// ─── History ─────────────────────────────────────────────────────────────────

export function loadHistory(): StoredBatch[] {
  if (typeof window === "undefined") return [];
  try {
    migrateLegacyHistory();
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as StoredBatch[];
  } catch {
    return [];
  }
}

export function saveHistory(batches: StoredBatch[]): void {
  if (typeof window === "undefined") return;
  try {
    const now = Date.now();
    const pruned = batches
      .filter((b) => {
        try {
          return now - new Date(b.createdAt).getTime() < BATCH_TTL_MS;
        } catch {
          return false;
        }
      })
      .slice(0, MAX_BATCHES);
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(pruned));
  } catch {
    // ignore storage errors
  }
}

export function addBatch(batch: StoredBatch): void {
  if (typeof window === "undefined") return;
  try {
    const history = loadHistory();
    saveHistory([batch, ...history]);
  } catch {
    // ignore
  }
}

export function updateBatch(batchId: string, updates: Partial<StoredBatch>): void {
  if (typeof window === "undefined") return;
  try {
    const history = loadHistory();
    const updated = history.map((b) =>
      b.batchId === batchId ? { ...b, ...updates } : b
    );
    saveHistory(updated);
  } catch {
    // ignore
  }
}

export function removeBatch(batchId: string): void {
  if (typeof window === "undefined") return;
  try {
    const history = loadHistory();
    saveHistory(history.filter((b) => b.batchId !== batchId));
  } catch {
    // ignore
  }
}

export function getBatchesForShop(shopId: string): StoredBatch[] {
  try {
    return loadHistory().filter((b) => b.shopId === shopId);
  } catch {
    return [];
  }
}

export function getOtherShopBatches(shopId: string): StoredBatch[] {
  try {
    return loadHistory().filter((b) => b.shopId !== shopId);
  } catch {
    return [];
  }
}

export function migrateLegacyHistory(): void {
  if (migrated) return;
  migrated = true;

  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY);
    if (!raw) return;

    const legacy = JSON.parse(raw);
    if (!Array.isArray(legacy) || legacy.length === 0) {
      window.localStorage.removeItem(LEGACY_KEY);
      return;
    }

    const converted: StoredBatch[] = legacy.map(
      (item: { token?: string; shopName?: string; date?: string; fileName?: string }) => {
        const shopName = item.shopName ?? "Unknown Shop";
        const date = item.date ?? new Date().toISOString();
        const expiresAt = new Date(
          new Date(date).getTime() + 5 * 60_000
        ).toISOString();

        return {
          batchId: createBatchId(),
          shopId: "legacy",
          shopSlug: shopName.toLowerCase().replace(/\s+/g, "-"),
          shopName,
          createdAt: date,
          expiresAt,
          locationMode: "shop",
          isPaid: false,
          estimatedTotal: 0,
          feedbackSubmitted: false,
          files: [
            {
              jobId: "",
              token: item.token ?? "",
              fileName: item.fileName ?? "unknown",
              pageCount: 1,
              color: false,
              copies: 1,
              doubleSided: false,
              status: "pending",
              isDeleted: false,
              deletionReason: null,
            },
          ],
        } satisfies StoredBatch;
      }
    );

    // Merge with any existing new-format history
    const existing: StoredBatch[] = (() => {
      try {
        const ex = window.localStorage.getItem(HISTORY_KEY);
        if (!ex) return [];
        const p = JSON.parse(ex);
        return Array.isArray(p) ? p : [];
      } catch {
        return [];
      }
    })();

    window.localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify([...converted, ...existing].slice(0, MAX_BATCHES))
    );
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    // ignore migration errors — better to lose legacy than to crash
  }
}

// ─── Preferences ─────────────────────────────────────────────────────────────

const DEFAULT_PREFERENCES: CustomerPreferences = {
  displayName: "",
  defaultColor: false,
  defaultDoubleSided: false,
  defaultCopies: 1,
  lastShopSlug: "",
};

export function loadPreferences(): CustomerPreferences {
  if (typeof window === "undefined") return { ...DEFAULT_PREFERENCES };
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    const parsed = JSON.parse(raw) as Partial<CustomerPreferences>;
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function savePreferences(prefs: Partial<CustomerPreferences>): void {
  if (typeof window === "undefined") return;
  try {
    const current = loadPreferences();
    const merged: CustomerPreferences = { ...current, ...prefs };
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(merged));
  } catch {
    // ignore
  }
}
