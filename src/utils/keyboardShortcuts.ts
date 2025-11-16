/**
 * Keyboard shortcuts manager
 */

type ShortcutHandler = (event: KeyboardEvent) => void;

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: ShortcutHandler;
  description: string;
}

class KeyboardShortcutsManager {
  private shortcuts: Map<string, Shortcut> = new Map();
  private enabled: boolean = true;

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  /**
   * Register a keyboard shortcut
   */
  register(shortcut: Shortcut): void {
    const key = this.getShortcutKey(shortcut);
    this.shortcuts.set(key, shortcut);
  }

  /**
   * Unregister a keyboard shortcut
   */
  unregister(key: string): void {
    this.shortcuts.delete(key);
  }

  /**
   * Start listening for keyboard shortcuts
   */
  start(): void {
    this.enabled = true;
    document.addEventListener('keydown', this.handleKeyDown);
  }

  /**
   * Stop listening for keyboard shortcuts
   */
  stop(): void {
    this.enabled = false;
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  /**
   * Handle keydown event
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.enabled) return;

    // Don't trigger shortcuts when typing in input fields
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    const key = this.getEventKey(event);
    const shortcut = this.shortcuts.get(key);

    if (shortcut) {
      event.preventDefault();
      shortcut.handler(event);
    }
  }

  /**
   * Generate unique key for shortcut
   */
  private getShortcutKey(shortcut: Shortcut): string {
    const parts: string[] = [];

    if (shortcut.ctrl) parts.push('ctrl');
    if (shortcut.shift) parts.push('shift');
    if (shortcut.alt) parts.push('alt');
    parts.push(shortcut.key.toLowerCase());

    return parts.join('+');
  }

  /**
   * Get key from keyboard event
   */
  private getEventKey(event: KeyboardEvent): string {
    const parts: string[] = [];

    if (event.ctrlKey || event.metaKey) parts.push('ctrl');
    if (event.shiftKey) parts.push('shift');
    if (event.altKey) parts.push('alt');
    parts.push(event.key.toLowerCase());

    return parts.join('+');
  }

  /**
   * Get all registered shortcuts
   */
  getAllShortcuts(): Shortcut[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * Clear all shortcuts
   */
  clearAll(): void {
    this.shortcuts.clear();
  }
}

// Create singleton instance
export const shortcutsManager = new KeyboardShortcutsManager();

/**
 * Register default shortcuts for the app
 */
export function registerDefaultShortcuts(handlers: {
  toggleSettings?: () => void;
  focusSearch?: () => void;
  nextQuote?: () => void;
  randomBackground?: () => void;
  openQuickLink?: (index: number) => void;
}): void {
  // Toggle settings panel (Ctrl+,)
  if (handlers.toggleSettings) {
    shortcutsManager.register({
      key: ',',
      ctrl: true,
      handler: handlers.toggleSettings,
      description: 'Toggle settings panel'
    });
  }

  // Focus search bar (Ctrl+K or /)
  if (handlers.focusSearch) {
    shortcutsManager.register({
      key: 'k',
      ctrl: true,
      handler: handlers.focusSearch,
      description: 'Focus search bar'
    });

    shortcutsManager.register({
      key: '/',
      handler: handlers.focusSearch,
      description: 'Focus search bar'
    });
  }

  // Next quote (Ctrl+Q)
  if (handlers.nextQuote) {
    shortcutsManager.register({
      key: 'q',
      ctrl: true,
      handler: handlers.nextQuote,
      description: 'Show next quote'
    });
  }

  // Random background (Ctrl+R)
  if (handlers.randomBackground) {
    shortcutsManager.register({
      key: 'r',
      ctrl: true,
      handler: handlers.randomBackground,
      description: 'Generate random background'
    });
  }

  // Quick links (Ctrl+1 through Ctrl+8)
  if (handlers.openQuickLink) {
    for (let i = 1; i <= 8; i++) {
      shortcutsManager.register({
        key: i.toString(),
        ctrl: true,
        handler: () => handlers.openQuickLink!(i - 1),
        description: `Open quick link ${i}`
      });
    }
  }

  // Start listening
  shortcutsManager.start();
}

/**
 * Cleanup shortcuts on unmount
 */
export function cleanupShortcuts(): void {
  shortcutsManager.stop();
  shortcutsManager.clearAll();
}
