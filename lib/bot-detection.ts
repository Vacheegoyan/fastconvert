/**
 * Bot and scraper User-Agent patterns to block from heavy API usage (download/prepare).
 * Allows real browsers and common crawlers that only need HTML (we can allow them on pages, block on API).
 */

const BLOCKED_PATTERNS = [
  // Generic bots and scrapers
  /bot/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
  /curl/i,
  /wget/i,
  /python-requests/i,
  /python-urllib/i,
  /java\//i,
  /go-http-client/i,
  /php\//i,
  /ruby\//i,
  /perl/i,
  /httpclient/i,
  /axios/i,
  /node-fetch/i,
  /postman/i,
  /insomnia/i,
  // Headless / automation
  /headlesschrome/i,
  /phantomjs/i,
  /selenium/i,
  /puppeteer/i,
  /playwright/i,
  // Known bad bots (optional: allow Googlebot etc. for SEO; we block only on /api)
  /semrushbot/i,
  /ahrefsbot/i,
  /mj12bot/i,
  /dotbot/i,
  /petalbot/i,
];

/** Empty or missing User-Agent is suspicious for API requests */
const REQUIRE_USER_AGENT = true;

/**
 * Returns true if the request looks like a bot/scraper and should be blocked from download API.
 */
export function isLikelyBot(userAgent: string | null): boolean {
  if (!userAgent || !userAgent.trim()) {
    return REQUIRE_USER_AGENT;
  }
  const ua = userAgent.trim();
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(ua));
}

/**
 * Returns true if User-Agent looks like a real browser (allow these).
 */
export function looksLikeBrowser(userAgent: string | null): boolean {
  if (!userAgent || !userAgent.trim()) return false;
  const ua = userAgent.toLowerCase();
  // Common browser identifiers
  return (
    ua.includes('mozilla') &&
    (ua.includes('chrome') || ua.includes('firefox') || ua.includes('safari') || ua.includes('edg') || ua.includes('opera'))
  );
}
