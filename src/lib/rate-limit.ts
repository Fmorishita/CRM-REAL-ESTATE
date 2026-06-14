import "server-only";

import { headers } from "next/headers";

/**
 * Basic in-memory fixed-window rate limiter. Suitable for abuse mitigation on
 * public surfaces in a single instance; for multi-instance production, back this
 * with Upstash/Redis (the interface stays the same).
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Best-effort client identifier from proxy headers for rate-limit keys. */
export async function clientKey(prefix: string): Promise<string> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  return `${prefix}:${ip}`;
}

// Control chars except tab (0x09) and newline (0x0A); built from a string so no
// literal control characters appear in source.
const CONTROL_CHARS = new RegExp("[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F]", "g");

/** Strips control characters (keeping tab and newline) from free text. */
export function sanitizeText(input: string): string {
  return input.replace(CONTROL_CHARS, "").trim();
}
