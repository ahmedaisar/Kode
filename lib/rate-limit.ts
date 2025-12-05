/**
 * Simple in-memory rate limiter
 * For production, consider using Redis or a more robust solution
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const limits = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export function rateLimit(
  identifier: string,
  config: RateLimitConfig = { maxRequests: 50, windowMs: 60000 } // 50 requests per minute by default
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = limits.get(identifier);

  if (!entry || entry.resetAt < now) {
    // Create new entry or reset expired one
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    limits.set(identifier, newEntry);
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: newEntry.resetAt,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  // Increment count
  entry.count++;
  limits.set(identifier, entry);

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

// Clean up expired entries periodically (only in Node.js environment)
if (typeof window === 'undefined') {
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of limits.entries()) {
      if (entry.resetAt < now) {
        limits.delete(key);
      }
    }
  }, 60000); // Clean up every minute
  
  // Unref to allow process to exit (Node.js only)
  cleanupInterval.unref?.();
}
