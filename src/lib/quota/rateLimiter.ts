/**
 * Simple sliding-window rate limiter.
 * In a serverless environment, this resets per cold start — which is acceptable
 * as a safety net against hammering. It won't persist across function invocations
 * but still protects against rapid-fire requests within a single warm instance.
 *
 * For production scale, replace with Upstash Ratelimit.
 */
const windowMs = 60_000; // 1 minute
const maxRequests = 60;  // 60 requests per minute per IP

const ipWindows = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const window = ipWindows.get(ip);

  if (!window || now > window.resetAt) {
    ipWindows.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  window.count++;

  if (window.count > maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: maxRequests - window.count };
}

// Note: In Vercel serverless, this Map resets on cold starts. This rate limiter
// is a best-effort safety net against burst hammering within a single warm instance.
// For production scale, replace with Upstash Ratelimit (already have @upstash/qstash).
// Do NOT add setInterval for cleanup — it causes issues in serverless environments.
