import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Chrome API
(globalThis as any).chrome = {
  storage: {
    sync: {
      get: vi.fn((_keys, callback) => callback({})),
      set: vi.fn((_items, callback) => callback && callback()),
      remove: vi.fn((_keys, callback) => callback && callback()),
      clear: vi.fn((callback) => callback && callback()),
    },
    local: {
      get: vi.fn((_keys, callback) => callback({})),
      set: vi.fn((_items, callback) => callback && callback()),
      remove: vi.fn((_keys, callback) => callback && callback()),
      clear: vi.fn((callback) => callback && callback()),
      getBytesInUse: vi.fn(() => Promise.resolve(0)),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  runtime: {
    lastError: undefined,
    getURL: vi.fn((path) => `chrome-extension://fake-id/${path}`),
  },
  tabs: {
    create: vi.fn((_props, callback) => callback && callback({ id: 1 })),
  },
} as any;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch
(globalThis as any).fetch = vi.fn();
