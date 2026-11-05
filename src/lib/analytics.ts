import { getFeedbackStats } from './supabase';

export interface AnalyticsMetrics {
  totalViews: number;
  uniqueVisitors: number;
  avgEngagementSeconds: number;
  googleFeedbackCount: number;
  guestFeedbackCount: number;
  deviceBreakdown: { device: string; count: number; percentage: number }[];
  browserBreakdown: { browser: string; count: number; percentage: number }[];
  countryBreakdown: { country: string; code: string; visitors: number }[];
  topSections: { section: string; views: number }[];
  topProjects: { name: string; clicks: number }[];
  viewsOverTime: { date: string; views: number; visitors: number }[];
}

export interface AnalyticsResult {
  configured: boolean;
  metrics: AnalyticsMetrics | null;
  error?: string;
  source?: 'umami' | 'none';
}

/**
 * Fetch real analytics from Umami v2 REST API using server-side credentials.
 * If credentials are not configured or the API is unreachable, returns configured: false
 * with an informative error. Never fabricates, mocks, or estimates numbers.
 */
export async function fetchRealAnalytics(
  range: '7d' | '30d' | '90d' | 'all'
): Promise<AnalyticsResult> {
  const websiteId = process.env.UMAMI_WEBSITE_ID || process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  const apiKey = process.env.UMAMI_API_KEY || process.env.UMAMI_AUTH_TOKEN;
  const rawHost = process.env.UMAMI_HOST_URL || process.env.NEXT_PUBLIC_UMAMI_HOST_URL || 'https://cloud.umami.is';
  const host = rawHost.replace(/\/+$/, '');

  if (!websiteId || !apiKey) {
    return {
      configured: false,
      metrics: null,
      error: 'Umami credentials not configured. Please set UMAMI_WEBSITE_ID and UMAMI_API_KEY in your server environment variables.',
      source: 'none',
    };
  }

  const now = Date.now();
  const windowDays = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
  const startAt = now - windowDays * 24 * 60 * 60 * 1000;
  const endAt = now;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'x-umami-api-key': apiKey,
  };
  if (apiKey.startsWith('ey')) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    const fetchApi = async (endpoint: string) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      try {
        const res = await fetch(`${host}/api/websites/${websiteId}/${endpoint}`, {
          headers,
          signal: controller.signal,
          cache: 'no-store',
        });
        clearTimeout(timeout);
        if (!res.ok) return null;
        return await res.json();
      } catch {
        clearTimeout(timeout);
        return null;
      }
    };

    const [statsData, devicesData, browsersData, countriesData, urlsData, pageviewsData, feedbackCounts] =
      await Promise.all([
        fetchApi(`stats?startAt=${startAt}&endAt=${endAt}`),
        fetchApi(`metrics?startAt=${startAt}&endAt=${endAt}&type=device`),
        fetchApi(`metrics?startAt=${startAt}&endAt=${endAt}&type=browser`),
        fetchApi(`metrics?startAt=${startAt}&endAt=${endAt}&type=country`),
        fetchApi(`metrics?startAt=${startAt}&endAt=${endAt}&type=url`),
        fetchApi(`pageviews?startAt=${startAt}&endAt=${endAt}&unit=day`),
        getFeedbackStats(),
      ]);

    if (!statsData) {
      return {
        configured: false,
        metrics: null,
        error: 'Unable to communicate with Umami Analytics API. Please verify host and credentials.',
        source: 'none',
      };
    }

    const totalViews = statsData.pageviews?.value ?? statsData.pageviews ?? 0;
    const uniqueVisitors = statsData.visitors?.value ?? statsData.visitors ?? 0;
    const totalTime = statsData.totaltime?.value ?? statsData.totaltime ?? 0;
    const avgEngagementSeconds = uniqueVisitors > 0 ? Math.round(totalTime / uniqueVisitors) : 0;

    // Calculate real device breakdown
    const rawDevices: { x: string; y: number }[] = Array.isArray(devicesData) ? devicesData : [];
    const totalDeviceCount = rawDevices.reduce((acc, d) => acc + (d.y || 0), 0) || 1;
    const deviceBreakdown = rawDevices.map((d) => ({
      device: d.x || 'Unknown',
      count: d.y || 0,
      percentage: Math.round(((d.y || 0) / totalDeviceCount) * 100),
    }));

    // Calculate real browser breakdown
    const rawBrowsers: { x: string; y: number }[] = Array.isArray(browsersData) ? browsersData : [];
    const totalBrowserCount = rawBrowsers.reduce((acc, b) => acc + (b.y || 0), 0) || 1;
    const browserBreakdown = rawBrowsers.map((b) => ({
      browser: b.x || 'Unknown',
      count: b.y || 0,
      percentage: Math.round(((b.y || 0) / totalBrowserCount) * 100),
    }));

    // Calculate real country breakdown
    const rawCountries: { x: string; y: number }[] = Array.isArray(countriesData) ? countriesData : [];
    const countryBreakdown = rawCountries.slice(0, 10).map((c) => ({
      country: c.x || 'Global',
      code: (c.x || 'GL').toUpperCase().slice(0, 2),
      visitors: c.y || 0,
    }));

    // Calculate real top sections / URLs
    const rawUrls: { x: string; y: number }[] = Array.isArray(urlsData) ? urlsData : [];
    const topSections = rawUrls.slice(0, 8).map((u) => ({
      section: u.x || '/',
      views: u.y || 0,
    }));

    // Daily pageviews / visitors over time
    const rawViewsOverTime = Array.isArray(pageviewsData?.pageviews)
      ? pageviewsData.pageviews.map((item: { x: string; y: number }, idx: number) => ({
          date: item.x ? item.x.slice(5) : `Day ${idx + 1}`,
          views: item.y || 0,
          visitors: Array.isArray(pageviewsData?.sessions) ? pageviewsData.sessions[idx]?.y || 0 : 0,
        }))
      : [];

    return {
      configured: true,
      source: 'umami',
      metrics: {
        totalViews,
        uniqueVisitors,
        avgEngagementSeconds,
        googleFeedbackCount: feedbackCounts.googleCount,
        guestFeedbackCount: feedbackCounts.guestCount,
        deviceBreakdown,
        browserBreakdown,
        countryBreakdown,
        topSections,
        topProjects: [],
        viewsOverTime: rawViewsOverTime,
      },
    };
  } catch (err) {
    console.error('Umami analytics fetch error:', err);
    return {
      configured: false,
      metrics: null,
      error: 'An unexpected error occurred while fetching Umami analytics.',
      source: 'none',
    };
  }
}

/**
 * Client-side event tracking helper for Umami
 */
export function trackEvent(name: string, data?: Record<string, string | number | boolean>): void {
  if (typeof window === 'undefined') return;

  const umami = (window as unknown as { umami?: { track: (name: string, data?: Record<string, unknown>) => void } }).umami;
  if (umami && typeof umami.track === 'function') {
    umami.track(name, data);
  }
}
