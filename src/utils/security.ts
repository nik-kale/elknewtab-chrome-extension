/**
 * Security utilities for encryption, sanitization, and CSP
 */

/**
 * Simple encryption for API keys (XOR-based obfuscation)
 * Note: This is obfuscation, not true encryption. For production,
 * consider using Web Crypto API or server-side key management
 */
const ENCRYPTION_KEY = 'elk-newtab-2024-secure-key';

export function encryptApiKey(apiKey: string): string {
  if (!apiKey) return '';

  const encrypted = Array.from(apiKey)
    .map((char, i) => {
      const keyChar = ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      return String.fromCharCode(char.charCodeAt(0) ^ keyChar);
    })
    .join('');

  return btoa(encrypted); // Base64 encode
}

export function decryptApiKey(encryptedKey: string): string {
  if (!encryptedKey) return '';

  try {
    const decoded = atob(encryptedKey); // Base64 decode
    const decrypted = Array.from(decoded)
      .map((char, i) => {
        const keyChar = ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
        return String.fromCharCode(char.charCodeAt(0) ^ keyChar);
      })
      .join('');

    return decrypted;
  } catch {
    return '';
  }
}

/**
 * Validate and sanitize file uploads
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
  sanitizedName?: string;
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
const MAX_FILENAME_LENGTH = 255;

export function validateFileUpload(file: File, type: 'image' | 'video'): FileValidationResult {
  const allowedTypes = type === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_VIDEO_TYPES;

  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`
    };
  }

  // Check file size
  const maxSize = type === 'image' ? 10 * 1024 * 1024 : 50 * 1024 * 1024; // 10MB for images, 50MB for videos
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Max size: ${maxSize / 1024 / 1024}MB`
    };
  }

  // Sanitize filename
  const sanitizedName = file.name
    .substring(0, MAX_FILENAME_LENGTH)
    .replace(/[^a-zA-Z0-9.-]/g, '_');

  return {
    valid: true,
    sanitizedName
  };
}

/**
 * Rate limiting for API calls (per endpoint)
 */
interface RateLimitState {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitState>();

export function checkRateLimit(endpoint: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const state = rateLimitStore.get(endpoint);

  if (!state || now > state.resetTime) {
    rateLimitStore.set(endpoint, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (state.count >= maxRequests) {
    return false;
  }

  state.count++;
  return true;
}

/**
 * Content Security Policy helpers
 */
export function sanitizeInlineStyle(style: string): string {
  // Remove potentially dangerous CSS
  const dangerous = ['expression', 'javascript:', 'vbscript:', 'data:', 'import'];
  let sanitized = style;

  dangerous.forEach(keyword => {
    sanitized = sanitized.replace(new RegExp(keyword, 'gi'), '');
  });

  return sanitized;
}

/**
 * Validate external URLs for CORS and security
 */
export function validateExternalUrl(url: string): { valid: boolean; error?: string } {
  try {
    const urlObj = new URL(url);

    // Only allow HTTPS (except localhost for development)
    if (urlObj.protocol !== 'https:' && !urlObj.hostname.includes('localhost')) {
      return { valid: false, error: 'Only HTTPS URLs are allowed' };
    }

    // Block known malicious TLDs
    const blockedTLDs = ['.tk', '.ml', '.ga', '.cf', '.gq'];
    if (blockedTLDs.some(tld => urlObj.hostname.endsWith(tld))) {
      return { valid: false, error: 'Blocked domain' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Input length validation
 */
export function validateInputLength(input: string, maxLength: number, fieldName: string): { valid: boolean; error?: string } {
  if (input.length > maxLength) {
    return {
      valid: false,
      error: `${fieldName} must be less than ${maxLength} characters`
    };
  }
  return { valid: true };
}

/**
 * Prevent prototype pollution
 */
export function safeObjectMerge<T extends Record<string, any>>(target: T, source: Record<string, any>): T {
  const result: Record<string, any> = { ...target };

  for (const key in source) {
    // Skip prototype properties
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(source, key)) {
      result[key] = source[key];
    }
  }

  return result as T;
}

/**
 * Sanitize data before storage
 */
export function sanitizeStorageData(data: any): any {
  if (typeof data === 'string') {
    // Remove potential script tags
    return data.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeStorageData(item));
  }

  if (data && typeof data === 'object') {
    const sanitized: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key) &&
          key !== '__proto__' &&
          key !== 'constructor' &&
          key !== 'prototype') {
        sanitized[key] = sanitizeStorageData(data[key]);
      }
    }
    return sanitized;
  }

  return data;
}
