/**
 * UX Enhancement utilities
 */

/**
 * Recent colors tracking
 */
const MAX_RECENT_COLORS = 10;
const RECENT_COLORS_KEY = 'recent_colors';

export async function addRecentColor(color: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get([RECENT_COLORS_KEY], (result) => {
      const recentColors: string[] = result[RECENT_COLORS_KEY] || [];

      // Remove if already exists
      const filtered = recentColors.filter((c) => c !== color);

      // Add to beginning
      filtered.unshift(color);

      // Keep only MAX_RECENT_COLORS
      const updated = filtered.slice(0, MAX_RECENT_COLORS);

      chrome.storage.local.set({ [RECENT_COLORS_KEY]: updated }, () => resolve());
    });
  });
}

export async function getRecentColors(): Promise<string[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get([RECENT_COLORS_KEY], (result) => {
      resolve(result[RECENT_COLORS_KEY] || []);
    });
  });
}

/**
 * Time format options
 */
export type TimeFormat = '12h' | '24h';

export function formatTime(date: Date, format: TimeFormat): string {
  if (format === '24h') {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Custom greeting messages
 */
export interface CustomGreeting {
  timeRange: { start: number; end: number };
  message: string;
}

const DEFAULT_GREETINGS: CustomGreeting[] = [
  { timeRange: { start: 0, end: 5 }, message: 'Burning the midnight oil?' },
  { timeRange: { start: 5, end: 12 }, message: 'Good morning' },
  { timeRange: { start: 12, end: 17 }, message: 'Good afternoon' },
  { timeRange: { start: 17, end: 22 }, message: 'Good evening' },
  { timeRange: { start: 22, end: 24 }, message: 'Good night' }
];

export function getGreetingMessage(hour: number, customGreetings?: CustomGreeting[]): string {
  const greetings = customGreetings || DEFAULT_GREETINGS;

  const match = greetings.find(
    (g) => hour >= g.timeRange.start && hour < g.timeRange.end
  );

  return match?.message || 'Hello';
}

/**
 * Settings search/filter
 */
export interface SettingItem {
  id: string;
  name: string;
  category: string;
  keywords: string[];
}

export function searchSettings(query: string, settings: SettingItem[]): SettingItem[] {
  const lowerQuery = query.toLowerCase();

  return settings.filter((setting) => {
    return (
      setting.name.toLowerCase().includes(lowerQuery) ||
      setting.category.toLowerCase().includes(lowerQuery) ||
      setting.keywords.some((keyword) => keyword.toLowerCase().includes(lowerQuery))
    );
  });
}

/**
 * Undo/Redo manager
 */
export class UndoRedoManager<T> {
  private history: T[] = [];
  private currentIndex: number = -1;
  private maxHistory: number;

  constructor(maxHistory: number = 50) {
    this.maxHistory = maxHistory;
  }

  push(state: T): void {
    // Remove any states after current index
    this.history = this.history.slice(0, this.currentIndex + 1);

    // Add new state
    this.history.push(state);

    // Limit history size
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }
  }

  undo(): T | null {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.history[this.currentIndex];
    }
    return null;
  }

  redo(): T | null {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      return this.history[this.currentIndex];
    }
    return null;
  }

  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }
}

/**
 * Gradient editor with preview
 */
export interface GradientStop {
  color: string;
  position: number; // 0-100
}

export interface GradientConfig {
  type: 'linear' | 'radial';
  direction?: string; // for linear
  stops: GradientStop[];
}

export function generateGradientCSS(config: GradientConfig): string {
  const stops = config.stops
    .sort((a, b) => a.position - b.position)
    .map((stop) => `${stop.color} ${stop.position}%`)
    .join(', ');

  if (config.type === 'radial') {
    return `radial-gradient(circle, ${stops})`;
  }

  return `linear-gradient(${config.direction || 'to right'}, ${stops})`;
}

/**
 * Background from URL
 */
export async function loadBackgroundFromUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw new Error('Failed to load image from URL');
  }
}

/**
 * Video background controls
 */
export interface VideoControls {
  playing: boolean;
  muted: boolean;
  playbackRate: number;
}

export function applyVideoControls(videoElement: HTMLVideoElement, controls: VideoControls): void {
  if (controls.playing) {
    videoElement.play().catch(() => {});
  } else {
    videoElement.pause();
  }

  videoElement.muted = controls.muted;
  videoElement.playbackRate = controls.playbackRate;
}

/**
 * Custom widget positioning
 */
export type Position = 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface WidgetPosition {
  widgetId: string;
  position: Position;
}

export function getPositionStyle(position: Position): React.CSSProperties {
  const positions: Record<Position, React.CSSProperties> = {
    'top-left': { top: '20px', left: '20px', position: 'fixed' },
    'top-center': { top: '20px', left: '50%', transform: 'translateX(-50%)', position: 'fixed' },
    'top-right': { top: '20px', right: '20px', position: 'fixed' },
    'center-left': { top: '50%', left: '20px', transform: 'translateY(-50%)', position: 'fixed' },
    'center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', position: 'fixed' },
    'center-right': { top: '50%', right: '20px', transform: 'translateY(-50%)', position: 'fixed' },
    'bottom-left': { bottom: '20px', left: '20px', position: 'fixed' },
    'bottom-center': { bottom: '20px', left: '50%', transform: 'translateX(-50%)', position: 'fixed' },
    'bottom-right': { bottom: '20px', right: '20px', position: 'fixed' }
  };

  return positions[position];
}

/**
 * Quote categories
 */
export type QuoteCategory = 'motivational' | 'wisdom' | 'humor' | 'life' | 'success' | 'all';

export interface CategorizedQuote {
  text: string;
  author: string;
  category: QuoteCategory;
}

export function filterQuotesByCategory(quotes: CategorizedQuote[], category: QuoteCategory): CategorizedQuote[] {
  if (category === 'all') {
    return quotes;
  }

  return quotes.filter((quote) => quote.category === category);
}

/**
 * Auto backup reminders
 */
export async function shouldShowBackupReminder(daysSinceLastBackup: number = 30): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['last_backup_date', 'backup_reminder_dismissed'], (result) => {
      const lastBackup = result.last_backup_date || 0;
      const dismissed = result.backup_reminder_dismissed || 0;

      const now = Date.now();
      const daysSince = (now - lastBackup) / (1000 * 60 * 60 * 24);
      const daysSinceDismissed = (now - dismissed) / (1000 * 60 * 60 * 24);

      // Show reminder if 30+ days since last backup and 7+ days since last dismissal
      resolve(daysSince >= daysSinceLastBackup && daysSinceDismissed >= 7);
    });
  });
}

export async function markBackupComplete(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ last_backup_date: Date.now() }, () => resolve());
  });
}

export async function dismissBackupReminder(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ backup_reminder_dismissed: Date.now() }, () => resolve());
  });
}

/**
 * Custom CSS injection
 */
export function injectCustomCSS(css: string): () => void {
  const styleElement = document.createElement('style');
  styleElement.id = 'custom-user-css';
  styleElement.textContent = css;
  document.head.appendChild(styleElement);

  return () => {
    const element = document.getElementById('custom-user-css');
    if (element) {
      element.remove();
    }
  };
}

/**
 * Quick link icons (not just emojis)
 */
export interface QuickLinkIcon {
  type: 'emoji' | 'favicon' | 'custom';
  value: string; // emoji character, favicon URL, or custom icon URL
}

export function renderQuickLinkIcon(icon: QuickLinkIcon): string {
  if (icon.type === 'emoji') {
    return icon.value;
  }

  if (icon.type === 'favicon' || icon.type === 'custom') {
    return `<img src="${icon.value}" alt="" style="width: 24px; height: 24px; object-fit: contain;" />`;
  }

  return '🔗'; // fallback
}
