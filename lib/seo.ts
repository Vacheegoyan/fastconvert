/**
 * SEO configuration and helpers.
 * Used for canonical URLs, sitemap, and metadata base.
 */

export const SITE_URL =
  (typeof process.env.NEXT_PUBLIC_SITE_URL === 'string' &&
    process.env.NEXT_PUBLIC_SITE_URL.trim()) ||
  'https://example.com';

/** Public indexable routes (no trailing slash). */
export const PUBLIC_ROUTES = [
  '/',
  '/mp3',
  '/mp4',
  '/poster',
  '/shorts',
  '/4k',
  '/privacy',
  '/terms',
] as const;

/** Returns full canonical URL for a path (no trailing slash). */
export function canonicalUrl(path: string): string {
  const base = SITE_URL.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  const normalized = p === '/' ? '' : p.replace(/\/$/, '');
  return `${base}${normalized}`;
}
