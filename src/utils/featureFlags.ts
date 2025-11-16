/**
 * Feature flags system for gradual rollout and A/B testing
 */

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string;
  rolloutPercentage?: number;
}

export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  UNSPLASH_INTEGRATION: {
    key: 'unsplash_integration',
    enabled: true,
    description: 'Enable Unsplash image browser'
  },
  WEATHER_WIDGET: {
    key: 'weather_widget',
    enabled: true,
    description: 'Enable real weather API integration'
  },
  KEYBOARD_SHORTCUTS: {
    key: 'keyboard_shortcuts',
    enabled: true,
    description: 'Enable keyboard shortcuts'
  },
  DARK_MODE: {
    key: 'dark_mode',
    enabled: true,
    description: 'Enable dark mode theme'
  },
  ANALYTICS: {
    key: 'analytics',
    enabled: true,
    description: 'Enable privacy-focused analytics'
  },
  IMPORT_EXPORT: {
    key: 'import_export',
    enabled: true,
    description: 'Enable settings import/export'
  },
  SCHEDULED_BACKGROUNDS: {
    key: 'scheduled_backgrounds',
    enabled: false,
    description: 'Enable scheduled background changes (experimental)'
  },
  AI_QUOTE_GENERATION: {
    key: 'ai_quote_generation',
    enabled: false,
    description: 'AI-generated inspirational quotes (experimental)',
    rolloutPercentage: 10
  }
};

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(featureKey: string): boolean {
  const flag = FEATURE_FLAGS[featureKey];

  if (!flag) {
    console.warn(`Unknown feature flag: ${featureKey}`);
    return false;
  }

  // If there's a rollout percentage, check if user is in the rollout
  if (flag.rolloutPercentage !== undefined) {
    const userHash = getUserHash();
    const inRollout = (userHash % 100) < flag.rolloutPercentage;
    return flag.enabled && inRollout;
  }

  return flag.enabled;
}

/**
 * Get user hash for consistent rollout (based on installation ID)
 */
function getUserHash(): number {
  const installId = localStorage.getItem('install_id') || createInstallId();
  let hash = 0;

  for (let i = 0; i < installId.length; i++) {
    const char = installId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash);
}

/**
 * Create installation ID
 */
function createInstallId(): string {
  const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
  localStorage.setItem('install_id', id);
  return id;
}

/**
 * Get all enabled features
 */
export function getEnabledFeatures(): string[] {
  return Object.keys(FEATURE_FLAGS).filter(isFeatureEnabled);
}

/**
 * Override feature flag (for testing)
 */
export function setFeatureOverride(featureKey: string, enabled: boolean): void {
  const overrides = JSON.parse(localStorage.getItem('feature_overrides') || '{}');
  overrides[featureKey] = enabled;
  localStorage.setItem('feature_overrides', JSON.stringify(overrides));
}

/**
 * Get feature override
 */
export function getFeatureOverride(featureKey: string): boolean | null {
  const overrides = JSON.parse(localStorage.getItem('feature_overrides') || '{}');
  return overrides[featureKey] ?? null;
}

/**
 * Clear all feature overrides
 */
export function clearFeatureOverrides(): void {
  localStorage.removeItem('feature_overrides');
}
