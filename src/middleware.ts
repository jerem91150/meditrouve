import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rate limiting storage (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute
const RATE_LIMIT_AUTH_MAX = 10; // 10 auth attempts per minute

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 60 * 1000);

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  return forwarded?.split(",")[0]?.trim() || realIP || "unknown";
}

function checkRateLimit(key: string, maxRequests: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count };
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIP(request);

  // Skip rate limiting for static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Determine rate limit based on endpoint
  let maxRequests = RATE_LIMIT_MAX_REQUESTS;
  let rateLimitKey = `${ip}:general`;

  // Stricter limits for auth endpoints
  if (pathname.includes("/auth") || pathname.includes("/login") || pathname.includes("/register")) {
    maxRequests = RATE_LIMIT_AUTH_MAX;
    rateLimitKey = `${ip}:auth`;
  }

  // Check rate limit
  const { allowed, remaining } = checkRateLimit(rateLimitKey, maxRequests);

  if (!allowed) {
    return new NextResponse(
      JSON.stringify({
        error: "Trop de requêtes. Veuillez réessayer dans quelques instants.",
        code: "RATE_LIMIT_EXCEEDED",
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "60",
          "X-RateLimit-Limit": maxRequests.toString(),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  // Create response with security headers
  const response = NextResponse.next();

  // Security headers
  const headers = response.headers;

  // Content Security Policy
  headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.openstreetmap.org https://nominatim.openstreetmap.org https://maps.googleapis.com https://firebaseinstallations.googleapis.com https://fcmregistrations.googleapis.com",
      "frame-src 'self' https://maps.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; ")
  );

  // Strict Transport Security (HSTS)
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");

  // Prevent MIME type sniffing
  headers.set("X-Content-Type-Options", "nosniff");

  // Prevent clickjacking
  headers.set("X-Frame-Options", "DENY");

  // XSS Protection (legacy, but still useful)
  headers.set("X-XSS-Protection", "1; mode=block");

  // Referrer Policy
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions Policy
  headers.set(
    "Permissions-Policy",
    "camera=(self), microphone=(), geolocation=(self), payment=()"
  );

  // Rate limit headers
  headers.set("X-RateLimit-Limit", maxRequests.toString());
  headers.set("X-RateLimit-Remaining", remaining.toString());

  // Remove sensitive headers
  headers.delete("X-Powered-By");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
