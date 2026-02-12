import { NextRequest, NextResponse } from 'next/server';
import {
  recordVisit,
  startSession,
  recordPageView,
  endSession,
  generateUserId,
} from '@/lib/analytics';

// Get client IP address
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  return forwarded?.split(',')[0] || realIP || 'unknown';
}

// Get country from headers (if using a service like Cloudflare)
function getCountry(request: NextRequest): string | undefined {
  return request.headers.get('cf-ipcountry') || 
         request.headers.get('x-vercel-ip-country') ||
         undefined;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sessionId, pagePath, userId } = body;

    const ip = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || undefined;
    const country = getCountry(request);
    const referrer = request.headers.get('referer') || undefined;

    const finalUserId = userId || generateUserId(ip, userAgent);

    switch (action) {
      case 'visit':
        recordVisit(finalUserId, country, userAgent, referrer);
        return NextResponse.json({ success: true, userId: finalUserId });

      case 'start_session':
        const newSessionId = startSession(finalUserId, country, userAgent);
        return NextResponse.json({ success: true, sessionId: newSessionId, userId: finalUserId });

      case 'page_view':
        if (sessionId && pagePath) {
          recordPageView(sessionId, pagePath);
        }
        return NextResponse.json({ success: true });

      case 'end_session':
        if (sessionId) {
          endSession(sessionId);
        }
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Track API] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Tracking failed' },
      { status: 500 }
    );
  }
}
