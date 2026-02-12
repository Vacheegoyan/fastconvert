'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

let userId: string | null = null;
let sessionId: string | null = null;

// Generate or retrieve user ID
function getUserId(): string {
  if (userId) return userId;
  
  // Try to get from localStorage
  const stored = localStorage.getItem('analytics_user_id');
  if (stored) {
    userId = stored;
    return userId;
  }
  
  // Generate new ID
  userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('analytics_user_id', userId);
  return userId;
}

// Track visit
async function trackVisit() {
  try {
    const response = await fetch('/api/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'visit',
        userId: getUserId(),
      }),
    });
    
    const data = await response.json();
    if (data.userId) {
      userId = data.userId;
      localStorage.setItem('analytics_user_id', userId);
    }
  } catch (error) {
    // Silently fail - don't interrupt user experience
    console.error('[Analytics] Visit tracking error:', error);
  }
}

// Start session
async function startSession(): Promise<string | null> {
  try {
    const response = await fetch('/api/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'start_session',
        userId: getUserId(),
      }),
    });
    
    const data = await response.json();
    if (data.sessionId) {
      sessionId = data.sessionId;
      return sessionId;
    }
  } catch (error) {
    console.error('[Analytics] Session start error:', error);
  }
  return null;
}

// Track page view
async function trackPageView(path: string) {
  if (!sessionId) return;
  
  try {
    await fetch('/api/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'page_view',
        sessionId,
        pagePath: path,
      }),
    });
  } catch (error) {
    console.error('[Analytics] Page view tracking error:', error);
  }
}

// End session
async function endSession() {
  if (!sessionId) return;
  
  try {
    await fetch('/api/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'end_session',
        sessionId,
      }),
    });
    sessionId = null;
  } catch (error) {
    console.error('[Analytics] Session end error:', error);
  }
}

export function useAnalytics() {
  const pathname = usePathname();
  const hasTrackedVisit = useRef(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Track initial visit
    if (!hasTrackedVisit.current) {
      trackVisit();
      hasTrackedVisit.current = true;
    }

    // Start session
    if (!currentSessionId) {
      startSession().then(id => {
        if (id) {
          sessionId = id;
          setCurrentSessionId(id);
        }
      });
    }

    // Track page view
    if (currentSessionId && pathname) {
      trackPageView(pathname);
    }

    // End session on page unload
    const handleBeforeUnload = () => {
      if (currentSessionId) {
        endSession();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [pathname, currentSessionId]);

  // End session when component unmounts (if user navigates away)
  useEffect(() => {
    return () => {
      // Use a small delay to allow navigation to complete
      setTimeout(() => {
        if (document.visibilityState === 'hidden' && currentSessionId) {
          endSession();
        }
      }, 1000);
    };
  }, [currentSessionId]);
}
