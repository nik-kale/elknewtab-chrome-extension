/**
 * API rate limiting utility
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitState {
  requests: number[];
  blocked: boolean;
}

class RateLimiter {
  private limits: Map<string, RateLimitState> = new Map();

  /**
   * Check if request is allowed
   */
  canMakeRequest(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const state = this.limits.get(key) || { requests: [], blocked: false };

    // Remove old requests outside the window
    state.requests = state.requests.filter(time => now - time < config.windowMs);

    // Check if we're at the limit
    if (state.requests.length >= config.maxRequests) {
      state.blocked = true;
      this.limits.set(key, state);
      return false;
    }

    // Add this request
    state.requests.push(now);
    state.blocked = false;
    this.limits.set(key, state);

    return true;
  }

  /**
   * Get time until next request is allowed
   */
  getTimeUntilReset(key: string, config: RateLimitConfig): number {
    const state = this.limits.get(key);
    if (!state || state.requests.length === 0) {
      return 0;
    }

    const oldestRequest = Math.min(...state.requests);
    const resetTime = oldestRequest + config.windowMs;
    const now = Date.now();

    return Math.max(0, resetTime - now);
  }

  /**
   * Check if currently blocked
   */
  isBlocked(key: string): boolean {
    const state = this.limits.get(key);
    return state?.blocked || false;
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Get remaining requests
   */
  getRemainingRequests(key: string, config: RateLimitConfig): number {
    const state = this.limits.get(key);
    if (!state) {
      return config.maxRequests;
    }

    const now = Date.now();
    const recentRequests = state.requests.filter(time => now - time < config.windowMs);

    return Math.max(0, config.maxRequests - recentRequests.length);
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Rate limit configurations for APIs
 */
export const RATE_LIMITS = {
  WEATHER: {
    maxRequests: 60,
    windowMs: 60 * 1000 // 60 requests per minute
  },
  UNSPLASH: {
    maxRequests: 50,
    windowMs: 60 * 60 * 1000 // 50 requests per hour
  },
  FAVICON: {
    maxRequests: 100,
    windowMs: 60 * 1000 // 100 requests per minute
  }
};

/**
 * Wrapper for rate-limited API calls
 */
export async function rateLimitedFetch<T>(
  key: string,
  config: RateLimitConfig,
  fetchFn: () => Promise<T>
): Promise<T> {
  if (!rateLimiter.canMakeRequest(key, config)) {
    const waitTime = rateLimiter.getTimeUntilReset(key, config);
    const waitSeconds = Math.ceil(waitTime / 1000);

    throw new Error(
      `Rate limit exceeded. Please wait ${waitSeconds} seconds before trying again.`
    );
  }

  return await fetchFn();
}

/**
 * Get rate limit status for UI display
 */
export function getRateLimitStatus(key: string, config: RateLimitConfig) {
  return {
    blocked: rateLimiter.isBlocked(key),
    remaining: rateLimiter.getRemainingRequests(key, config),
    max: config.maxRequests,
    resetIn: rateLimiter.getTimeUntilReset(key, config)
  };
}
