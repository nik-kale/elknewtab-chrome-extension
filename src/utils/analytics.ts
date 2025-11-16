/**
 * Analytics and telemetry foundation
 * Privacy-focused, local-only analytics
 */

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
}

interface AnalyticsStorage {
  events: AnalyticsEvent[];
  sessions: number;
  firstUsed: number;
  lastUsed: number;
}

const STORAGE_KEY = 'elk_analytics';
const MAX_EVENTS = 100;

/**
 * Get analytics data from storage
 */
async function getAnalytics(): Promise<AnalyticsStorage> {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      resolve(result[STORAGE_KEY] || {
        events: [],
        sessions: 0,
        firstUsed: Date.now(),
        lastUsed: Date.now()
      });
    });
  });
}

/**
 * Save analytics data to storage
 */
async function saveAnalytics(data: AnalyticsStorage): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: data }, () => resolve());
  });
}

/**
 * Track an event (privacy-focused, local only)
 */
export async function trackEvent(
  name: string,
  properties?: Record<string, any>
): Promise<void> {
  const analytics = await getAnalytics();

  const event: AnalyticsEvent = {
    name,
    properties,
    timestamp: Date.now()
  };

  analytics.events.push(event);
  analytics.lastUsed = Date.now();

  // Keep only recent events
  if (analytics.events.length > MAX_EVENTS) {
    analytics.events = analytics.events.slice(-MAX_EVENTS);
  }

  await saveAnalytics(analytics);
}

/**
 * Track session start
 */
export async function trackSession(): Promise<void> {
  const analytics = await getAnalytics();
  analytics.sessions += 1;
  analytics.lastUsed = Date.now();
  await saveAnalytics(analytics);

  await trackEvent('session_start');
}

/**
 * Get usage statistics
 */
export async function getUsageStats(): Promise<{
  totalSessions: number;
  daysSinceFirstUse: number;
  recentEvents: AnalyticsEvent[];
  mostUsedFeatures: Array<{ name: string; count: number }>;
}> {
  const analytics = await getAnalytics();

  const daysSinceFirstUse = Math.floor(
    (Date.now() - analytics.firstUsed) / (1000 * 60 * 60 * 24)
  );

  // Count event frequencies
  const eventCounts = analytics.events.reduce((acc, event) => {
    acc[event.name] = (acc[event.name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostUsedFeatures = Object.entries(eventCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalSessions: analytics.sessions,
    daysSinceFirstUse,
    recentEvents: analytics.events.slice(-10),
    mostUsedFeatures
  };
}

/**
 * Clear all analytics data
 */
export async function clearAnalytics(): Promise<void> {
  await chrome.storage.local.remove([STORAGE_KEY]);
}

/**
 * Export analytics data
 */
export async function exportAnalytics(): Promise<AnalyticsStorage> {
  return await getAnalytics();
}
