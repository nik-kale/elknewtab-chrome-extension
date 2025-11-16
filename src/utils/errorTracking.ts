/**
 * Error tracking and reporting utilities
 */

interface ErrorReport {
  message: string;
  stack?: string;
  timestamp: number;
  userAgent: string;
  url: string;
  additionalInfo?: Record<string, any>;
}

const MAX_ERROR_REPORTS = 50;

/**
 * Track an error
 */
export async function trackError(
  error: Error,
  additionalInfo?: Record<string, any>
): Promise<void> {
  const report: ErrorReport = {
    message: error.message,
    stack: error.stack,
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    additionalInfo
  };

  // Get existing reports
  const reports = await getErrorReports();

  // Add new report
  reports.push(report);

  // Keep only recent reports
  const recentReports = reports.slice(-MAX_ERROR_REPORTS);

  // Save to storage
  await new Promise<void>((resolve) => {
    chrome.storage.local.set({ error_reports: recentReports }, resolve);
  });

  // Log to console in development
  if (import.meta.env?.DEV) {
    console.error('Error tracked:', report);
  }
}

/**
 * Get error reports
 */
export async function getErrorReports(): Promise<ErrorReport[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['error_reports'], (result) => {
      resolve(result.error_reports || []);
    });
  });
}

/**
 * Clear error reports
 */
export async function clearErrorReports(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove(['error_reports'], resolve);
  });
}

/**
 * Export error reports as JSON
 */
export async function exportErrorReports(): Promise<void> {
  const reports = await getErrorReports();

  const blob = new Blob([JSON.stringify(reports, null, 2)], {
    type: 'application/json'
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `elk-error-reports-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Get error statistics
 */
export async function getErrorStatistics(): Promise<{
  totalErrors: number;
  recentErrors: number;
  topErrors: Array<{ message: string; count: number }>;
}> {
  const reports = await getErrorReports();

  // Count by message
  const errorCounts: Record<string, number> = {};
  reports.forEach(report => {
    errorCounts[report.message] = (errorCounts[report.message] || 0) + 1;
  });

  // Get top errors
  const topErrors = Object.entries(errorCounts)
    .map(([message, count]) => ({ message, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Count recent errors (last hour)
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  const recentErrors = reports.filter(r => r.timestamp > oneHourAgo).length;

  return {
    totalErrors: reports.length,
    recentErrors,
    topErrors
  };
}

/**
 * Setup global error handler
 */
export function setupGlobalErrorHandler(): void {
  window.addEventListener('error', (event) => {
    trackError(event.error || new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    trackError(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      { type: 'unhandledRejection' }
    );
  });
}
