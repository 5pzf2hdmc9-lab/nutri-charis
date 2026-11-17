/** In-memory rate limiter for Vercel Node serverless (best-effort per instance). */
const buckets = new Map();

function checkRateLimit(key, maxAttempts, windowMs) {
  const safeMax = Math.max(1, maxAttempts);
  const safeWindow = Math.max(1000, windowMs);
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + safeWindow };
  }

  if (bucket.count >= safeMax) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
    };
  }

  bucket.count += 1;
  buckets.set(key, bucket);

  return {
    allowed: true,
    remaining: Math.max(0, safeMax - bucket.count),
    retryAfterSec: 0
  };
}

module.exports = { checkRateLimit };
