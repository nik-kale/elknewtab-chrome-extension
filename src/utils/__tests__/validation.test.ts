import { describe, it, expect } from 'vitest';
import {
  validateUrl,
  sanitizeHtml,
  validateHexColor,
  validateFileSize,
  validateApiKey,
  validateInterval,
} from '../validation';

describe('validation utilities', () => {
  describe('validateUrl', () => {
    it('should validate valid URLs', () => {
      expect(validateUrl('https://example.com')).toBe('https://example.com/');
      expect(validateUrl('http://test.org')).toBe('http://test.org/');
    });

    it('should add https protocol if missing', () => {
      expect(validateUrl('example.com')).toBe('https://example.com/');
    });

    it('should return null for invalid URLs', () => {
      expect(validateUrl('not a url')).toBeNull();
      expect(validateUrl('')).toBeNull();
    });

    it('should reject non-http(s) protocols', () => {
      expect(validateUrl('javascript:alert(1)')).toBeNull();
      expect(validateUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    });
  });

  describe('sanitizeHtml', () => {
    it('should escape HTML entities', () => {
      expect(sanitizeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert("xss")&lt;/script&gt;'
      );
      expect(sanitizeHtml('<img src=x onerror=alert(1)>')).toBe(
        '&lt;img src=x onerror=alert(1)&gt;'
      );
    });

    it('should handle plain text', () => {
      expect(sanitizeHtml('Hello World')).toBe('Hello World');
    });
  });

  describe('validateHexColor', () => {
    it('should validate valid hex colors', () => {
      expect(validateHexColor('#FFFFFF')).toBe(true);
      expect(validateHexColor('#000000')).toBe(true);
      expect(validateHexColor('#FF5733')).toBe(true);
    });

    it('should reject invalid hex colors', () => {
      expect(validateHexColor('#FFF')).toBe(false); // Short format
      expect(validateHexColor('FFFFFF')).toBe(false); // Missing #
      expect(validateHexColor('#GGGGGG')).toBe(false); // Invalid characters
      expect(validateHexColor('#12345')).toBe(false); // Wrong length
    });
  });

  describe('validateFileSize', () => {
    it('should accept files within size limit', () => {
      const result = validateFileSize(1024 * 1024, 5); // 1MB file, 5MB limit
      expect(result.valid).toBe(true);
    });

    it('should reject files exceeding size limit', () => {
      const result = validateFileSize(10 * 1024 * 1024, 5); // 10MB file, 5MB limit
      expect(result.valid).toBe(false);
      expect(result.message).toContain('5MB');
    });
  });

  describe('validateApiKey', () => {
    it('should validate valid API keys', () => {
      expect(validateApiKey('a'.repeat(32))).toBe(true);
      expect(validateApiKey('abc123_-ABC456DEF789')).toBe(true);
    });

    it('should reject invalid API keys', () => {
      expect(validateApiKey('short')).toBe(false); // Too short
      expect(validateApiKey('a'.repeat(100))).toBe(false); // Too long
      expect(validateApiKey('has spaces in it')).toBe(false); // Invalid chars
      expect(validateApiKey('has@special#chars')).toBe(false); // Invalid chars
    });
  });

  describe('validateInterval', () => {
    it('should accept intervals within range', () => {
      const result = validateInterval(30, 5, 60);
      expect(result.valid).toBe(true);
    });

    it('should reject intervals outside range', () => {
      const resultTooLow = validateInterval(3, 5, 60);
      expect(resultTooLow.valid).toBe(false);
      expect(resultTooLow.message).toContain('5');

      const resultTooHigh = validateInterval(100, 5, 60);
      expect(resultTooHigh.valid).toBe(false);
      expect(resultTooHigh.message).toContain('60');
    });
  });
});
