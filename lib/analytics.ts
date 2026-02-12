import fs from 'fs';
import path from 'path';

export interface DownloadRecord {
  id: string;
  timestamp: number;
  format: string; // 'mp3' | '360p' | '480p' | '720p' | '1080p'
  quality: string;
  videoId?: string;
  userId?: string;
  country?: string;
}

export interface UserSession {
  id: string;
  userId: string;
  startTime: number;
  endTime?: number;
  duration?: number; // in seconds
  pageViews: number;
  country?: string;
  userAgent?: string;
  pages: Array<{
    path: string;
    timestamp: number;
  }>;
}

export interface UserVisit {
  id: string;
  userId: string;
  timestamp: number;
  country?: string;
  userAgent?: string;
  referrer?: string;
}

export interface AnalyticsData {
  downloads: DownloadRecord[];
  sessions: UserSession[];
  visits: UserVisit[];
}

const DATA_FILE = path.join(process.cwd(), 'data', 'analytics.json');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Load analytics data
export function loadAnalytics(): AnalyticsData {
  ensureDataDir();
  
  if (!fs.existsSync(DATA_FILE)) {
    return {
      downloads: [],
      sessions: [],
      visits: [],
    };
  }

  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('[Analytics] Error loading data:', error);
    return {
      downloads: [],
      sessions: [],
      visits: [],
    };
  }
}

// Save analytics data
export function saveAnalytics(data: AnalyticsData): void {
  ensureDataDir();
  
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('[Analytics] Error saving data:', error);
  }
}

// Generate unique user ID (based on fingerprint)
export function generateUserId(ip?: string, userAgent?: string): string {
  // Simple hash-based ID generation
  const str = `${ip || 'unknown'}-${userAgent || 'unknown'}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `user_${Math.abs(hash).toString(36)}`;
}

// Record a download
export function recordDownload(
  format: string,
  quality: string,
  videoId?: string,
  userId?: string,
  country?: string
): void {
  const data = loadAnalytics();
  
  const record: DownloadRecord = {
    id: `dl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    format,
    quality,
    videoId,
    userId,
    country,
  };

  data.downloads.push(record);
  saveAnalytics(data);
}

// Record a user visit
export function recordVisit(
  userId: string,
  country?: string,
  userAgent?: string,
  referrer?: string
): void {
  const data = loadAnalytics();
  
  const visit: UserVisit = {
    id: `visit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    timestamp: Date.now(),
    country,
    userAgent,
    referrer,
  };

  data.visits.push(visit);
  saveAnalytics(data);
}

// Start a new session
export function startSession(
  userId: string,
  country?: string,
  userAgent?: string
): string {
  const data = loadAnalytics();
  
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const session: UserSession = {
    id: sessionId,
    userId,
    startTime: Date.now(),
    pageViews: 1,
    country,
    userAgent,
    pages: [],
  };

  data.sessions.push(session);
  saveAnalytics(data);
  
  return sessionId;
}

// Update session with page view
export function recordPageView(
  sessionId: string,
  pagePath: string
): void {
  const data = loadAnalytics();
  const session = data.sessions.find(s => s.id === sessionId);
  
  if (session) {
    session.pageViews++;
    session.pages.push({
      path: pagePath,
      timestamp: Date.now(),
    });
    saveAnalytics(data);
  }
}

// End a session
export function endSession(sessionId: string): void {
  const data = loadAnalytics();
  const session = data.sessions.find(s => s.id === sessionId);
  
  if (session && !session.endTime) {
    session.endTime = Date.now();
    session.duration = Math.floor((session.endTime - session.startTime) / 1000);
    saveAnalytics(data);
  }
}

// Get statistics
export function getStatistics(period: 'day' | 'week' | 'month' | 'year' = 'day') {
  const data = loadAnalytics();
  const now = Date.now();
  
  let periodStart: number;
  switch (period) {
    case 'day':
      periodStart = now - 24 * 60 * 60 * 1000;
      break;
    case 'week':
      periodStart = now - 7 * 24 * 60 * 60 * 1000;
      break;
    case 'month':
      periodStart = now - 30 * 24 * 60 * 60 * 1000;
      break;
    case 'year':
      periodStart = now - 365 * 24 * 60 * 60 * 1000;
      break;
  }

  // Filter data by period
  const downloads = data.downloads.filter(d => d.timestamp >= periodStart);
  const sessions = data.sessions.filter(s => s.startTime >= periodStart);
  const visits = data.visits.filter(v => v.timestamp >= periodStart);

  // Downloads by format
  const downloadsByFormat: Record<string, number> = {};
  downloads.forEach(d => {
    downloadsByFormat[d.format] = (downloadsByFormat[d.format] || 0) + 1;
  });

  // Downloads by quality
  const downloadsByQuality: Record<string, number> = {};
  downloads.forEach(d => {
    downloadsByQuality[d.quality] = (downloadsByQuality[d.quality] || 0) + 1;
  });

  // Unique users
  const uniqueUsers = new Set([
    ...downloads.map(d => d.userId).filter(Boolean),
    ...sessions.map(s => s.userId),
    ...visits.map(v => v.userId),
  ]).size;

  // Sessions statistics
  const completedSessions = sessions.filter(s => s.endTime && s.duration);
  const avgSessionDuration = completedSessions.length > 0
    ? completedSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / completedSessions.length
    : 0;
  
  const avgPageViews = sessions.length > 0
    ? sessions.reduce((sum, s) => sum + s.pageViews, 0) / sessions.length
    : 0;

  // Users by country
  const usersByCountry: Record<string, number> = {};
  [...sessions, ...visits].forEach(item => {
    if (item.country) {
      usersByCountry[item.country] = (usersByCountry[item.country] || 0) + 1;
    }
  });

  // Daily breakdown for charts
  const dailyDownloads: Record<string, number> = {};
  downloads.forEach(d => {
    const date = new Date(d.timestamp).toISOString().split('T')[0];
    dailyDownloads[date] = (dailyDownloads[date] || 0) + 1;
  });

  const dailyUsers: Record<string, number> = {};
  [...sessions, ...visits].forEach(item => {
    const date = new Date(item.startTime || item.timestamp).toISOString().split('T')[0];
    if (!dailyUsers[date]) {
      dailyUsers[date] = new Set().size;
    }
  });
  // Recalculate with proper Set
  const dailyUsersSet: Record<string, Set<string>> = {};
  [...sessions, ...visits].forEach(item => {
    const date = new Date(item.startTime || item.timestamp).toISOString().split('T')[0];
    if (!dailyUsersSet[date]) {
      dailyUsersSet[date] = new Set();
    }
    dailyUsersSet[date].add(item.userId);
  });
  const dailyUsersCount: Record<string, number> = {};
  Object.keys(dailyUsersSet).forEach(date => {
    dailyUsersCount[date] = dailyUsersSet[date].size;
  });

  // Monthly breakdown for year view
  const monthlyDownloads: Record<string, number> = {};
  const monthlyUsers: Record<string, Set<string>> = {};
  const monthlySessions: Record<string, number> = {};
  
  downloads.forEach(d => {
    const date = new Date(d.timestamp);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyDownloads[monthKey] = (monthlyDownloads[monthKey] || 0) + 1;
  });

  [...sessions, ...visits].forEach(item => {
    const date = new Date(item.startTime || item.timestamp);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyUsers[monthKey]) {
      monthlyUsers[monthKey] = new Set();
    }
    monthlyUsers[monthKey].add(item.userId);
  });

  sessions.forEach(s => {
    const date = new Date(s.startTime);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlySessions[monthKey] = (monthlySessions[monthKey] || 0) + 1;
  });

  const monthlyUsersCount: Record<string, number> = {};
  Object.keys(monthlyUsers).forEach(month => {
    monthlyUsersCount[month] = monthlyUsers[month].size;
  });

  return {
    period,
    totalDownloads: downloads.length,
    totalUsers: uniqueUsers,
    totalSessions: sessions.length,
    downloadsByFormat,
    downloadsByQuality,
    avgSessionDuration: Math.round(avgSessionDuration),
    avgPageViews: Math.round(avgPageViews * 10) / 10,
    usersByCountry,
    dailyDownloads,
    dailyUsers: dailyUsersCount,
    monthlyDownloads,
    monthlyUsers: monthlyUsersCount,
    monthlySessions,
    completedSessions: completedSessions.length,
  };
}
