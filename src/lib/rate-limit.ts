import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Prisma-based rate limiting, compatible with serverless (Vercel).
 * Uses raw SQL for compatibility before prisma generate.
 */
export async function rateLimit(
  request: NextRequest,
  options: { key?: string; maxRequests?: number; windowMs?: number } = {}
): Promise<RateLimitResult> {
  const { maxRequests = 10, windowMs = 60_000 } = options;

  const ip = request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";

  const rateLimitKey = options.key ? `${options.key}:${ip}` : `global:${ip}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowMs);

  try {
    // Try using the RateLimit model
    const existing = await (prisma as any).rateLimit.findUnique({ where: { key: rateLimitKey } });

    if (existing && existing.expiresAt > now) {
      if (existing.count >= maxRequests) {
        return { success: false, remaining: 0, resetAt: existing.expiresAt };
      }
      const updated = await (prisma as any).rateLimit.update({
        where: { key: rateLimitKey },
        data: { count: { increment: 1 } },
      });
      return { success: true, remaining: maxRequests - updated.count, resetAt: updated.expiresAt };
    } else {
      const record = await (prisma as any).rateLimit.upsert({
        where: { key: rateLimitKey },
        create: { key: rateLimitKey, count: 1, windowStart: now, expiresAt },
        update: { count: 1, windowStart: now, expiresAt },
      });
      return { success: true, remaining: maxRequests - record.count, resetAt: record.expiresAt };
    }
  } catch (error) {
    console.error("[RATE_LIMIT_ERROR]", error instanceof Error ? error.message : error);
    return { success: true, remaining: maxRequests, resetAt: expiresAt };
  }
}
