import type { NextFunction, Request, RequestHandler, Response } from "express";
import { AppError } from "../errors.js";

export type RateLimiter = {
  check(
    key: string,
    limit: number,
  ): { allowed: boolean; retryAfterSeconds: number };
};

export function createMemoryRateLimiter(windowMs = 60_000): RateLimiter {
  const buckets = new Map<string, { count: number; resetAt: number }>();
  return {
    check(key, limit) {
      const now = Date.now();
      const bucket = buckets.get(key);
      if (!bucket || bucket.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, retryAfterSeconds: Math.ceil(windowMs / 1000) };
      }
      bucket.count += 1;
      return {
        allowed: bucket.count <= limit,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((bucket.resetAt - now) / 1000),
        ),
      };
    },
  };
}

export function rateLimit(
  limiter: RateLimiter,
  name: string,
  limit: number,
): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = limiter.check(`${name}:${req.ip}`, limit);
    if (!result.allowed) {
      const error = new AppError("Too many requests. Try again later.", 429);
      error.details = { retryAfterSeconds: result.retryAfterSeconds };
      next(error);
      return;
    }
    next();
  };
}
