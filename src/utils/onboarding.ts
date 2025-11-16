/**
 * Onboarding and first-run experience
 */

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component?: string;
  optional?: boolean;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Elk New Tab!',
    description: 'Customize your new tab experience with beautiful backgrounds, widgets, and more.'
  },
  {
    id: 'background',
    title: 'Choose Your Background',
    description: 'Select from images, videos, gradients, or browse Unsplash for stunning photos.'
  },
  {
    id: 'widgets',
    title: 'Configure Widgets',
    description: 'Add weather, quick links, quotes, and customize your workspace.'
  },
  {
    id: 'search',
    title: 'Select Search Engine',
    description: 'Choose your preferred search engine: Google, DuckDuckGo, Bing, and more.'
  },
  {
    id: 'shortcuts',
    title: 'Learn Keyboard Shortcuts',
    description: 'Boost productivity with shortcuts: Ctrl+K for search, Ctrl+, for settings.'
  },
  {
    id: 'apis',
    title: 'Optional: Add API Keys',
    description: 'Add OpenWeatherMap and Unsplash API keys for enhanced features.',
    optional: true
  },
  {
    id: 'complete',
    title: "You're All Set!",
    description: 'Enjoy your personalized new tab experience. Access settings anytime with the gear icon.'
  }
];

/**
 * Check if user has completed onboarding
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['onboarding_completed'], (result) => {
      resolve(result.onboarding_completed === true);
    });
  });
}

/**
 * Mark onboarding as complete
 */
export async function completeOnboarding(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({
      onboarding_completed: true,
      onboarding_completed_date: new Date().toISOString()
    }, resolve);
  });
}

/**
 * Reset onboarding (for testing or re-showing)
 */
export async function resetOnboarding(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove(['onboarding_completed', 'onboarding_completed_date'], resolve);
  });
}

/**
 * Get onboarding progress
 */
export async function getOnboardingProgress(): Promise<{
  currentStep: number;
  completedSteps: string[];
}> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['onboarding_progress'], (result) => {
      resolve(result.onboarding_progress || {
        currentStep: 0,
        completedSteps: []
      });
    });
  });
}

/**
 * Save onboarding progress
 */
export async function saveOnboardingProgress(
  currentStep: number,
  completedSteps: string[]
): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({
      onboarding_progress: {
        currentStep,
        completedSteps
      }
    }, resolve);
  });
}

/**
 * Check if this is first run
 */
export async function isFirstRun(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['first_run_complete'], (result) => {
      resolve(!result.first_run_complete);
    });
  });
}

/**
 * Mark first run as complete
 */
export async function completeFirstRun(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({
      first_run_complete: true,
      first_run_date: new Date().toISOString()
    }, resolve);
  });
}
