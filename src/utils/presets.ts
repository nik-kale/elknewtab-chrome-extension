/**
 * Default configurations and presets
 */

export interface PresetConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  settings: Record<string, any>;
}

export const PRESET_CONFIGS: PresetConfig[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean and simple - just the essentials',
    icon: '✨',
    settings: {
      backgroundType: 'color',
      backgroundColor: '#1a1a1a',
      showWeather: false,
      showQuote: false,
      showQuickLinks: true,
      showSearchBar: true,
      showTime: true,
      showDate: true,
      showGreeting: false,
      darkMode: true
    }
  },
  {
    id: 'productivity',
    name: 'Productivity',
    description: 'Optimized for getting things done',
    icon: '⚡',
    settings: {
      backgroundType: 'gradient',
      gradientColors: ['#2c3e50', '#3498db'],
      gradientDirection: 'to right',
      showWeather: true,
      showQuote: true,
      showQuickLinks: true,
      showSearchBar: true,
      showTime: true,
      showDate: true,
      showGreeting: true,
      searchEngine: 'google'
    }
  },
  {
    id: 'aesthetic',
    name: 'Aesthetic',
    description: 'Beautiful and inspiring',
    icon: '🎨',
    settings: {
      backgroundType: 'image',
      showWeather: true,
      showQuote: true,
      showQuickLinks: true,
      showSearchBar: true,
      showTime: true,
      showDate: true,
      showGreeting: true,
      quoteChangeInterval: 3600
    }
  },
  {
    id: 'focus',
    name: 'Focus Mode',
    description: 'Minimize distractions',
    icon: '🎯',
    settings: {
      backgroundType: 'color',
      backgroundColor: '#f5f5f5',
      showWeather: false,
      showQuote: false,
      showQuickLinks: false,
      showSearchBar: true,
      showTime: true,
      showDate: false,
      showGreeting: false,
      darkMode: false
    }
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'All features enabled',
    icon: '📊',
    settings: {
      backgroundType: 'gradient',
      gradientColors: ['#667eea', '#764ba2'],
      gradientDirection: 'to bottom right',
      showWeather: true,
      showQuote: true,
      showQuickLinks: true,
      showSearchBar: true,
      showTime: true,
      showDate: true,
      showGreeting: true,
      cyclingEnabled: true,
      cyclingInterval: 300
    }
  }
];

/**
 * Apply a preset configuration
 */
export async function applyPreset(presetId: string): Promise<boolean> {
  const preset = PRESET_CONFIGS.find(p => p.id === presetId);

  if (!preset) {
    return false;
  }

  return new Promise((resolve) => {
    chrome.storage.sync.set(preset.settings, () => {
      resolve(true);
    });
  });
}

/**
 * Get default settings
 */
export function getDefaultSettings(): Record<string, any> {
  return {
    backgroundType: 'gradient',
    backgroundColor: '#f5f5f5',
    backgroundImage: null,
    backgroundVideo: null,
    gradientColors: ['#3498db', '#9b59b6'],
    gradientDirection: 'to right',

    showSearchBar: true,
    showWeather: true,
    showTime: true,
    showDate: true,
    showGreeting: true,
    showQuickLinks: true,
    showQuote: true,

    searchEngine: 'google',
    weatherApiKey: '',
    unsplashApiKey: '',

    darkMode: false,
    keyboardShortcutsEnabled: true,

    cyclingEnabled: false,
    cyclingInterval: 30,
    cyclingMode: 'sequential',

    quoteChangeInterval: 86400,

    quickLinks: [
      { id: '1', name: 'Gmail', url: 'https://mail.google.com', icon: '📧' },
      { id: '2', name: 'Drive', url: 'https://drive.google.com', icon: '📁' },
      { id: '3', name: 'Calendar', url: 'https://calendar.google.com', icon: '📅' },
      { id: '4', name: 'YouTube', url: 'https://youtube.com', icon: '📺' }
    ],

    backgrounds: [],

    randomSettings: {
      type: 'solid',
      gradientType: 'linear',
      gradientDirection: 'to right'
    }
  };
}

/**
 * Create a custom preset from current settings
 */
export async function createCustomPreset(name: string, description: string): Promise<PresetConfig> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(null, (settings) => {
      const preset: PresetConfig = {
        id: `custom_${Date.now()}`,
        name,
        description,
        icon: '⭐',
        settings
      };

      // Save to custom presets
      chrome.storage.local.get(['custom_presets'], (result) => {
        const customPresets = result.custom_presets || [];
        customPresets.push(preset);

        chrome.storage.local.set({ custom_presets: customPresets }, () => {
          resolve(preset);
        });
      });
    });
  });
}

/**
 * Get custom presets
 */
export async function getCustomPresets(): Promise<PresetConfig[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['custom_presets'], (result) => {
      resolve(result.custom_presets || []);
    });
  });
}
