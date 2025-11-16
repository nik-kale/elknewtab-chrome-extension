/**
 * Performance optimization utilities
 */

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(later, wait) as unknown as number;
  };
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Lazy load image
 */
export function lazyLoadImage(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Batch DOM updates
 */
export function batchDOMUpdates(updates: Array<() => void>): void {
  requestAnimationFrame(() => {
    updates.forEach(update => update());
  });
}

/**
 * Memoize function results
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func(...args);
    cache.set(key, result);

    return result;
  }) as T;
}

/**
 * Check if code is running in production
 */
export function isProduction(): boolean {
  return import.meta.env?.MODE === 'production';
}

/**
 * Measure performance
 */
export function measurePerformance(name: string, fn: () => void): number {
  const start = performance.now();
  fn();
  const end = performance.now();
  const duration = end - start;

  if (!isProduction()) {
    console.log(`⏱️  ${name}: ${duration.toFixed(2)}ms`);
  }

  return duration;
}

/**
 * Chunk array for processing
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];

  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }

  return chunks;
}

/**
 * Process array in chunks with delay
 */
export async function processInChunks<T, R>(
  items: T[],
  processor: (item: T) => R | Promise<R>,
  chunkSize: number = 10,
  delayMs: number = 10
): Promise<R[]> {
  const results: R[] = [];
  const chunks = chunkArray(items, chunkSize);

  for (const chunk of chunks) {
    const chunkResults = await Promise.all(chunk.map(processor));
    results.push(...chunkResults);

    // Allow browser to breathe
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
