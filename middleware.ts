import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isLikelyBot } from '@/lib/bot-detection';

/**
 * Security headers for all responses.
 * Bot blocking for /api/download and /api/* routes that cost resources.
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // ——— Security headers ———
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  // ——— Block bots on expensive API routes ———
  const pathname = request.nextUrl.pathname;
  const isApiRoute = pathname.startsWith('/api/');
  const isDownloadOrPrepare =
    pathname === '/api/download' ||
    pathname.startsWith('/api/download') ||
    pathname === '/api/search';

  if (isApiRoute && isDownloadOrPrepare) {
    const userAgent = request.headers.get('user-agent') ?? '';
    if (isLikelyBot(userAgent)) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, etc.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
