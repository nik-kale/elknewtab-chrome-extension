/**
 * Accessibility utilities
 */

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  // Add visually hidden styles
  announcement.style.cssText = `
    position: absolute;
    left: -10000px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  `;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Trap focus within an element (for modals/dialogs)
 */
export function trapFocus(element: HTMLElement): () => void {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        lastFocusable?.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        firstFocusable?.focus();
        e.preventDefault();
      }
    }
  };

  element.addEventListener('keydown', handleTabKey);

  // Focus first element
  firstFocusable?.focus();

  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
}

/**
 * Check if element has sufficient color contrast
 */
export function checkColorContrast(
  foreground: string,
  background: string,
  largeText: boolean = false
): { passes: boolean; ratio: number } {
  const getLuminance = (color: string): number => {
    // Convert hex to RGB
    const rgb = parseInt(color.substring(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;

    // Calculate relative luminance
    const rsRGB = r / 255;
    const gsRGB = g / 255;
    const bsRGB = b / 255;

    const rLin = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const gLin = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const bLin = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);

  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

  // WCAG AA: 4.5:1 for normal text, 3:1 for large text
  const requiredRatio = largeText ? 3 : 4.5;

  return {
    passes: ratio >= requiredRatio,
    ratio: Math.round(ratio * 100) / 100
  };
}

/**
 * Get accessible label for element
 */
export function getAccessibleLabel(element: HTMLElement): string {
  return (
    element.getAttribute('aria-label') ||
    element.getAttribute('aria-labelledby') ||
    element.textContent ||
    element.getAttribute('title') ||
    element.getAttribute('placeholder') ||
    ''
  ).trim();
}

/**
 * Ensure element has accessible name
 */
export function ensureAccessibleName(element: HTMLElement, fallbackLabel: string): void {
  if (!getAccessibleLabel(element)) {
    element.setAttribute('aria-label', fallbackLabel);
  }
}
