/**
 * Simple in-memory rate limiter for Next.js API routes.
 * Note: In serverless environments, this is instance-local. 
 * For distributed rate limiting, use Redis (e.g., Upstash).
 */

interface RateLimitRecord {
  count: number;
  lastReset: number;
}

const cache = new Map<string, RateLimitRecord>();

// Cleanup interval to avoid memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of cache.entries()) {
      // Clear records older than 10 minutes
      if (now - record.lastReset > 600000) {
        cache.delete(key);
      }
    }
  }, 300000); // Every 5 minutes
}

export function isRateLimited(identifier: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = cache.get(identifier);

  if (!record || (now - record.lastReset) > windowMs) {
    cache.set(identifier, { count: 1, lastReset: now });
    return false;
  }

  if (record.count >= limit) {
    return true;
  }

  record.count++;
  return false;
}

export function getRateLimitHeaders(identifier: string, limit: number, windowMs: number) {
  const record = cache.get(identifier);
  const remaining = record ? Math.max(0, limit - record.count) : limit;
  const reset = record ? new Date(record.lastReset + windowMs).toISOString() : new Date(Date.now() + windowMs).toISOString();

  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': reset,
  };
}
