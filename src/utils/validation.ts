/**
 * Input validation and sanitization utilities
 */

/**
 * Validate and sanitize URL
 */
export function validateUrl(url: string): string | null {
  try {
    const trimmed = url.trim();

    // Add protocol if missing
    const withProtocol = trimmed.match(/^https?:\/\//)
      ? trimmed
      : `https://${trimmed}`;

    const urlObj = new URL(withProtocol);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return null;
    }

    return urlObj.href;
  } catch {
    return null;
  }
}

/**
 * Sanitize HTML to prevent XSS
 */
export function sanitizeHtml(html: string): string {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Validate hex color
 */
export function validateHexColor(color: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(color);
}

/**
 * Validate file size
 */
export function validateFileSize(
  size: number,
  maxSizeMB: number
): { valid: boolean; message?: string } {
  const maxBytes = maxSizeMB * 1024 * 1024;

  if (size > maxBytes) {
    return {
      valid: false,
      message: `File size exceeds ${maxSizeMB}MB limit`
    };
  }

  return { valid: true };
}

/**
 * Validate file type
 */
export function validateFileType(
  file: File,
  allowedTypes: string[]
): { valid: boolean; message?: string } {
  const fileType = file.type;
  const isAllowed = allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      return fileType.startsWith(type.replace('/*', '/'));
    }
    return fileType === type;
  });

  if (!isAllowed) {
    return {
      valid: false,
      message: `File type ${fileType} is not allowed`
    };
  }

  return { valid: true };
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9._-]/gi, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255);
}

/**
 * Validate API key format
 */
export function validateApiKey(key: string): boolean {
  // Basic validation: must be alphanumeric, 20-64 characters
  return /^[a-zA-Z0-9_-]{20,64}$/.test(key.trim());
}

/**
 * Validate time interval
 */
export function validateInterval(
  interval: number,
  min: number,
  max: number
): { valid: boolean; message?: string } {
  if (interval < min || interval > max) {
    return {
      valid: false,
      message: `Interval must be between ${min} and ${max}`
    };
  }

  return { valid: true };
}
