/**
 * Custom React hooks for all utilities
 */

import { useState, useEffect, useCallback } from 'react';
import { getCachedWeatherData, WeatherData } from '../utils/weatherAPI';
import { getUsageStats } from '../utils/analytics';
import { getErrorStatistics } from '../utils/errorTracking';
import { getStorageInfo } from '../utils/settingsManager';

/**
 * Hook for weather data with automatic refresh
 */
export function useWeather(apiKey?: string, refreshInterval = 30 * 60 * 1000) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    if (!apiKey) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getCachedWeatherData(apiKey);
      setWeather(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather');
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchWeather, refreshInterval]);

  return { weather, loading, error, refresh: fetchWeather };
}

/**
 * Hook for storage quota monitoring
 */
export function useStorageQuota() {
  const [quota, setQuota] = useState({ syncUsed: 0, syncQuota: 0, localUsed: 0, localQuota: 0 });
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    const checkQuota = async () => {
      const info = await getStorageInfo();
      setQuota(info);

      const syncPercentage = (info.syncUsed / info.syncQuota) * 100;
      const localPercentage = (info.localUsed / info.localQuota) * 100;

      if (syncPercentage > 90) {
        setWarning(`Sync storage is ${syncPercentage.toFixed(0)}% full! Consider cleaning up old data.`);
      } else if (localPercentage > 90) {
        setWarning(`Local storage is ${localPercentage.toFixed(0)}% full! Consider removing old backgrounds.`);
      } else {
        setWarning(null);
      }
    };

    checkQuota();
    const interval = setInterval(checkQuota, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  return { quota, warning };
}

/**
 * Hook for analytics data
 */
export function useAnalytics() {
  const [stats, setStats] = useState<{
    totalSessions: number;
    daysSinceFirstUse: number;
    recentEvents: any[];
    mostUsedFeatures: any[];
  }>({
    totalSessions: 0,
    daysSinceFirstUse: 0,
    recentEvents: [],
    mostUsedFeatures: []
  });

  useEffect(() => {
    const loadStats = async () => {
      const data = await getUsageStats();
      setStats(data);
    };

    loadStats();
  }, []);

  return stats;
}

/**
 * Hook for error tracking
 */
export function useErrorStats() {
  const [errorStats, setErrorStats] = useState<{
    totalErrors: number;
    recentErrors: number;
    topErrors: any[];
  }>({
    totalErrors: 0,
    recentErrors: 0,
    topErrors: []
  });

  useEffect(() => {
    const loadStats = async () => {
      const stats = await getErrorStatistics();
      setErrorStats(stats);
    };

    loadStats();
    const interval = setInterval(loadStats, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  return errorStats;
}

/**
 * Hook for syncing state with Chrome storage
 */
export function useChromeStorage<T>(
  key: string,
  initialValue: T,
  storage: 'sync' | 'local' = 'sync'
): [T, (value: T) => void, boolean] {
  const [value, setValue] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storageArea = storage === 'sync' ? chrome.storage.sync : chrome.storage.local;

    storageArea.get([key], (result) => {
      if (result[key] !== undefined) {
        setValue(result[key]);
      }
      setLoading(false);
    });

    const listener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === storage && changes[key]) {
        setValue(changes[key].newValue);
      }
    };

    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, [key, storage]);

  const updateValue = useCallback((newValue: T) => {
    const storageArea = storage === 'sync' ? chrome.storage.sync : chrome.storage.local;
    storageArea.set({ [key]: newValue });
    setValue(newValue);
  }, [key, storage]);

  return [value, updateValue, loading];
}

/**
 * Hook for debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for local storage with sync
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  };

  return [storedValue, setValue];
}
