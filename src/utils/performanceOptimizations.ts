/**
 * Advanced performance optimizations
 */

/**
 * Lazy load images with Intersection Observer
 */
export function setupLazyLoading(selector: string = 'img[data-src]'): () => void {
  if (!('IntersectionObserver' in window)) {
    // Fallback for older browsers
    document.querySelectorAll(selector).forEach((img) => {
      const element = img as HTMLImageElement;
      if (element.dataset.src) {
        element.src = element.dataset.src;
      }
    });
    return () => {};
  }

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      }
    });
  });

  document.querySelectorAll(selector).forEach((img) => {
    imageObserver.observe(img);
  });

  return () => imageObserver.disconnect();
}

/**
 * Preconnect to external domains
 */
export function preconnectToDomains(domains: string[]): void {
  domains.forEach((domain) => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

/**
 * Prefetch likely navigation targets
 */
export function prefetchUrls(urls: string[]): void {
  urls.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Request Idle Callback wrapper with fallback
 */
export function runWhenIdle(callback: () => void, timeout: number = 2000): void {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback, { timeout });
  } else {
    setTimeout(callback, 100);
  }
}

/**
 * Virtual scrolling for large lists
 */
export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function calculateVisibleRange(
  scrollTop: number,
  totalItems: number,
  options: VirtualScrollOptions
): { start: number; end: number } {
  const { itemHeight, containerHeight, overscan = 3 } = options;

  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleItems = Math.ceil(containerHeight / itemHeight);
  const end = Math.min(totalItems, start + visibleItems + overscan * 2);

  return { start, end };
}

/**
 * Batch DOM updates
 */
export function batchDOMUpdates(updates: Array<() => void>): void {
  requestAnimationFrame(() => {
    updates.forEach((update) => update());
  });
}

/**
 * Compress data for storage
 */
export function compressData(data: any): string {
  const jsonString = JSON.stringify(data);

  // Simple run-length encoding for repeated patterns
  let compressed = '';
  let count = 1;
  let current = jsonString[0];

  for (let i = 1; i < jsonString.length; i++) {
    if (jsonString[i] === current && count < 9) {
      count++;
    } else {
      compressed += count > 1 ? `${count}${current}` : current;
      current = jsonString[i];
      count = 1;
    }
  }
  compressed += count > 1 ? `${count}${current}` : current;

  return compressed;
}

/**
 * Decompress data from storage
 */
export function decompressData(compressed: string): any {
  let decompressed = '';
  let i = 0;

  while (i < compressed.length) {
    if (/\d/.test(compressed[i])) {
      const count = parseInt(compressed[i], 10);
      decompressed += compressed[i + 1].repeat(count);
      i += 2;
    } else {
      decompressed += compressed[i];
      i++;
    }
  }

  try {
    return JSON.parse(decompressed);
  } catch {
    return null;
  }
}

/**
 * Optimize image data URLs
 */
export async function optimizeDataUrl(dataUrl: string, quality: number = 0.8): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Detect slow network connection
 */
export function isSlowConnection(): boolean {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

  if (!connection) {
    return false;
  }

  const slowTypes = ['slow-2g', '2g'];
  return slowTypes.includes(connection.effectiveType) || connection.saveData;
}

/**
 * Service Worker cache management
 */
export async function clearOldCaches(currentCacheName: string): Promise<void> {
  if (!('caches' in window)) return;

  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames
      .filter((name) => name !== currentCacheName)
      .map((name) => caches.delete(name))
  );
}

/**
 * Performance monitoring
 */
export interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstPaint?: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
}

export function getPerformanceMetrics(): PerformanceMetrics {
  const metrics: PerformanceMetrics = {
    loadTime: 0,
    domContentLoaded: 0
  };

  if (window.performance && window.performance.timing) {
    const timing = window.performance.timing;
    metrics.loadTime = timing.loadEventEnd - timing.navigationStart;
    metrics.domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
  }

  // Get Paint Timing API metrics
  if (window.performance && window.performance.getEntriesByType) {
    const paintEntries = window.performance.getEntriesByType('paint');
    paintEntries.forEach((entry: any) => {
      if (entry.name === 'first-paint') {
        metrics.firstPaint = entry.startTime;
      } else if (entry.name === 'first-contentful-paint') {
        metrics.firstContentfulPaint = entry.startTime;
      }
    });

    // LCP
    const lcpEntries = window.performance.getEntriesByType('largest-contentful-paint');
    if (lcpEntries.length > 0) {
      const lastEntry = lcpEntries[lcpEntries.length - 1] as any;
      metrics.largestContentfulPaint = lastEntry.startTime;
    }
  }

  return metrics;
}

/**
 * Memory usage tracking
 */
export function getMemoryUsage(): { used: number; total: number; percentage: number } | null {
  const performance = window.performance as any;

  if (performance.memory) {
    return {
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize,
      percentage: (performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize) * 100
    };
  }

  return null;
}
