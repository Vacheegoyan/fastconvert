'use client';

import { useAnalytics } from '@/hooks/use-analytics';

export default function AnalyticsProvider() {
  useAnalytics();
  return null;
}
