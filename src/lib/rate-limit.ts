/**
 * XeroxQ — Bounded Sliding Window Rate Limiter
 * Note: In multi-instance serverless deployments, replace with Redis/Upstash for global coordination.
 */

interface RateLimitConfig {
  windowMs: number;
  max: number;
}

const MAX_TRACKED_KEYS = 5000;
const store = new Map<string, number[]>();

// Periodically evict stale keys without clearing active buckets
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of store.entries()) {
    const fresh = timestamps.filter((ts) => now - ts < 300_000);
    if (fresh.length === 0) {
      store.delete(key);
    } else {
      store.set(key, fresh);
    }
  }
}, 5 * 60 * 1000);

if (typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
  cleanupTimer.unref();
}

export function rateLimit(config: RateLimitConfig) {
  const { windowMs, max } = config;

  return {
    check(identifier: string): { success: boolean; remaining: number; resetAt: number } {
      const now = Date.now();
      const windowStart = now - windowMs;
      const existing = store.get(identifier) || [];
      const active = existing.filter((ts) => ts > windowStart);

      if (active.length >= max) {
        // Refresh insertion order cleanly and reject
        store.delete(identifier);
        store.set(identifier, active);
        return {
          success: false,
          remaining: 0,
          resetAt: active[0] + windowMs,
        };
      }

      active.push(now);

      // Evict oldest single key if bounded capacity is exceeded (never clear whole map)
      if (!store.has(identifier) && store.size >= MAX_TRACKED_KEYS) {
        const oldestKey = store.keys().next().value;
        if (oldestKey !== undefined) {
          store.delete(oldestKey);
        }
      }

      store.delete(identifier);
      store.set(identifier, active);

      return {
        success: true,
        remaining: Math.max(0, max - active.length),
        resetAt: active[0] + windowMs,
      };
    },
  };
}

/**
 * Extracts client IP preferring trusted proxy headers over raw spoofable chains.
 */
export function getClientIp(req: Request): string {
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const vercelIp = req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  if (vercelIp) return vercelIp;

  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;

  return "unknown-ip";
}
