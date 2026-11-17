type Bucket = { count: number; resetAt: number };

const memoryBuckets = new Map<string, Bucket>();

function readStorage(key: string): Bucket | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(`rl:${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Bucket;
    if (!parsed || typeof parsed.count !== 'number' || typeof parsed.resetAt !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStorage(key: string, bucket: Bucket): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(`rl:${key}`, JSON.stringify(bucket));
  } catch {
    /* quota / private mode */
  }
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
};

/**
 * Sliding fixed-window rate limiter (client + serverless compatible).
 * OWASP: brute-force protection for login / signup / AI endpoints.
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): RateLimitResult {
  const safeMax = Math.max(1, maxAttempts);
  const safeWindow = Math.max(1000, windowMs);
  const now = Date.now();
  const stored = readStorage(key) || memoryBuckets.get(key);
  let bucket: Bucket =
    stored && stored.resetAt > now
      ? stored
      : { count: 0, resetAt: now + safeWindow };

  if (bucket.count >= safeMax) {
    const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return { allowed: false, remaining: 0, retryAfterSec };
  }

  bucket = { ...bucket, count: bucket.count + 1 };
  memoryBuckets.set(key, bucket);
  writeStorage(key, bucket);

  return {
    allowed: true,
    remaining: Math.max(0, safeMax - bucket.count),
    retryAfterSec: 0
  };
}

export function resetRateLimit(key: string): void {
  memoryBuckets.delete(key);
  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.removeItem(`rl:${key}`);
    } catch {
      /* ignore */
    }
  }
}

/** Fingerprint helper for auth forms (email + coarse IP placeholder). */
export function authRateKey(action: 'login' | 'signup' | 'forgot', email: string): string {
  const normalized = String(email || '').trim().toLowerCase().slice(0, 120);
  return `auth:${action}:${normalized || 'unknown'}`;
}
