/**
 * XeroxQ — Sliding Window Rate Limiter
 * In-memory, no external dependencies. Works on Vercel Edge and Node.js runtimes.
 * 
 * Usage:
 *   const limiter = rateLimit({ windowMs: 60_000, max: 20 });
 *   const { success } = await limiter.check(ip);
 *   if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 */

interface RateLimitStore {
  [key: string]: number[];
}

interface RateLimitConfig {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum requests allowed within the window */
  max: number;
}

// Module-level store (persists across requests in the same serverless instance)
const store: RateLimitStore = {};

// Cleanup old entries every 5 minutes to prevent memory bloat
setInterval(() => {
  const now = Date.now();
  for (const key in store) {
    store[key] = store[key].filter((timestamp) => now - timestamp < 300_000);
    if (store[key].length === 0) delete store[key];
  }
}, 5 * 60 * 1000);

export function rateLimit(config: RateLimitConfig) {
  const { windowMs, max } = config;

  return {
    check(identifier: string): { success: boolean; remaining: number; resetAt: number } {
      const now = Date.now();
      const windowStart = now - windowMs;

      if (!store[identifier]) {
        store[identifier] = [];
      }

      // Evict timestamps outside the window
      store[identifier] = store[identifier].filter((ts) => ts > windowStart);

      const count = store[identifier].length;
      const remaining = Math.max(0, max - count - 1);
      const resetAt = store[identifier][0] ? store[identifier][0] + windowMs : now + windowMs;

      if (count >= max) {
        return { success: false, remaining: 0, resetAt };
      }

      store[identifier].push(now);
      return { success: true, remaining, resetAt };
    },
  };
}

/**
 * Extracts the real IP from a Next.js request, handling proxies and Vercel's CDN.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "127.0.0.1";
}
