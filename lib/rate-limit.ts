/**
 * In-memory rate limiter for API routes.
 * Limits: per identifier (IP or userId) per time window.
 *
 * Production note: On serverless (Vercel) each instance has its own memory,
 * so for strict limits across regions use Redis (e.g. @upstash/ratelimit + Vercel KV).
 */

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetIn: number; // seconds until window reset
}

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

// Cleanup old entries every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanup(): void {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, CLEANUP_INTERVAL_MS);
}

/**
 * Check and consume one request from the rate limit.
 * @param key - Unique key (e.g. IP or userId)
 * @param limit - Max requests per window
 * @param windowSeconds - Window length in seconds
 */
export function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): RateLimitResult {
  ensureCleanup();
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  let entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    entry = { count: 1, resetAt: now + windowMs };
    store.set(key, entry);
    return { success: true, remaining: limit - 1, resetIn: windowSeconds };
  }

  entry.count += 1;
  const remaining = Math.max(0, limit - entry.count);
  const success = entry.count <= limit;

  return {
    success,
    remaining,
    resetIn: Math.ceil((entry.resetAt - now) / 1000),
  };
}

/**
 * Get client identifier from request (IP). Prefer x-forwarded-for / x-real-ip for proxies.
 */
export function getClientIdentifier(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : headers.get('x-real-ip') ?? 'unknown';
  return ip;
}
