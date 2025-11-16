import React, { useState, useEffect, useRef } from 'react'
import './App.css'
import { RandomColorOptions } from './components/RandomColorGenerator'
import { toast } from './utils/notifications'
import { useWeather, useStorageQuota } from './hooks/index'
import { registerDefaultShortcuts } from './utils/keyboardShortcuts'
import { SEARCH_ENGINES, performSearch } from './utils/searchEngines'
import { exportSettings, importSettings, resetSettings } from './utils/settingsManager'
import { compressImage } from './utils/imageCompression'
import UnsplashBrowser from './components/UnsplashBrowser'
import ConfirmDialog from './components/ConfirmDialog'
import { checkForUpdates, showUpdateNotification } from './utils/updates'
import { PRESET_CONFIGS, applyPreset } from './utils/presets'
import { hasCompletedOnboarding, completeOnboarding } from './utils/onboarding'
import { needsMigration, migrateData } from './utils/migration'
import { trackEvent } from './utils/analytics'
import { trackError } from './utils/errorTracking'
import { validateUrl, sanitizeHtml } from './utils/validation'
import { fetchFavicon } from './utils/faviconFetcher'
import { encryptApiKey, decryptApiKey, validateInputLength } from './utils/security'
import { preconnectToDomains, runWhenIdle, isSlowConnection, getPerformanceMetrics } from './utils/performanceOptimizations'
import { getRecentColors, shouldShowBackupReminder } from './utils/uxEnhancements'
import './styles/darkMode.css'

// Add Chrome API type declarations to suppress TypeScript errors
declare namespace chrome {
  export namespace storage {
    export interface StorageChange {
      oldValue?: any;
      newValue?: any;
    }

    export interface StorageArea {
      get(keys: string | string[] | Object | null, callback: (items: { [key: string]: any }) => void): void;
      set(items: Object, callback?: () => void): void;
      remove(keys: string | string[], callback?: () => void): void;
      clear(callback?: () => void): void;
    }

    export const sync: StorageArea;
    export const local: StorageArea;
    export const onChanged: {
      addListener(callback: (changes: { [key: string]: StorageChange }, areaName: string) => void): void;
      removeListener(callback: (changes: { [key: string]: StorageChange }, areaName: string) => void): void;
    };
  }

  export namespace runtime {
    export const lastError: {
      message?: string;
    } | undefined;
  }
}

function App() {
  // Background settings
  const [backgroundType, setBackgroundType] = useState<'color' | 'image' | 'gradient' | 'video' | 'random'>('gradient')
  const [backgroundColor, setBackgroundColor] = useState<string>('#f5f5f5')
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null)
  const [backgroundVideo, setBackgroundVideo] = useState<string | null>(null)
  const [gradientColors, setGradientColors] = useState<string[]>(['#3498db', '#9b59b6'])
  const [gradientDirection, setGradientDirection] = useState<string>('to right')

  // Random background settings
  const [randomSettings, setRandomSettings] = useState<RandomColorOptions>({
    type: 'solid',
    gradientType: 'linear',
    gradientDirection: 'to right'
  })

  // Background cycling settings
  const [cyclingEnabled, setCyclingEnabled] = useState<boolean>(false)
  const [cyclingInterval, setCyclingInterval] = useState<number>(30) // 30 seconds
  const [cyclingMode, setCyclingMode] = useState<'sequential' | 'random'>('sequential')
  const [backgrounds, setBackgrounds] = useState<Array<{id: string, url: string, type: string}>>([])
  const [currentBackgroundIndex, setCurrentBackgroundIndex] = useState<number>(0)

  // Settings panel visibility
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false)
  const [isPopup, setIsPopup] = useState<boolean>(false)
  const [isDragging, setIsDragging] = useState<boolean>(false)

  // New features state
  const [weatherApiKey, setWeatherApiKey] = useState<string>('')
  const [searchEngine, setSearchEngine] = useState<string>('google')
  const [darkMode, setDarkMode] = useState<boolean>(false)
  const [showUnsplashBrowser, setShowUnsplashBrowser] = useState<boolean>(false)
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false)
  const [keyboardShortcutsEnabled, setKeyboardShortcutsEnabled] = useState<boolean>(true)
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false)
  // Time format will be added in future update: const [timeFormat, setTimeFormat]
  const [, setRecentColors] = useState<string[]>([])
  const [, setShowBackupReminder] = useState<boolean>(false)
  // Video controls: const [videoControls, setVideoControls]
  // Custom greeting: const [customGreeting, setCustomGreeting]

  // Time and date state
  const [currentTime, setCurrentTime] = useState(new Date())
  const [greeting, setGreeting] = useState('')

  // Use real weather hook instead of fake data
  const { weather, loading: weatherLoading, error: weatherError } = useWeather(weatherApiKey)

  // Storage quota monitoring
  const { quota, warning: storageWarning } = useStorageQuota()

  // UI visibility toggles
  const [showSearchBar, setShowSearchBar] = useState<boolean>(true)
  const [showWeather, setShowWeather] = useState<boolean>(true)
  const [showTime, setShowTime] = useState<boolean>(true)
  const [showDate, setShowDate] = useState<boolean>(true)
  const [showGreeting, setShowGreeting] = useState<boolean>(true)
  const [showQuickLinks, setShowQuickLinks] = useState<boolean>(true)
  const [showQuote, setShowQuote] = useState<boolean>(true)

  // Custom quick links
  const [quickLinks, setQuickLinks] = useState<Array<{id: string, name: string, url: string, icon: string}>>([
    { id: '1', name: 'Gmail', url: 'https://mail.google.com', icon: '📧' },
    { id: '2', name: 'Drive', url: 'https://drive.google.com', icon: '📁' },
    { id: '3', name: 'Calendar', url: 'https://calendar.google.com', icon: '📅' },
    { id: '4', name: 'YouTube', url: 'https://youtube.com', icon: '📺' }
  ])

  // Quotes collection
  const [quotes, setQuotes] = useState<Array<{text: string, author: string}>>([
    { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
    { text: 'Innovation distinguishes between a leader and a follower.', author: 'Steve Jobs' },
    { text: 'Stay hungry, stay foolish.', author: 'Steve Jobs' },
    { text: 'Your time is limited, so don\'t waste it living someone else\'s life.', author: 'Steve Jobs' },
    { text: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt' },
    { text: 'Life is what happens when you\'re busy making other plans.', author: 'John Lennon' },
    { text: 'The best way to predict the future is to create it.', author: 'Peter Drucker' },
    { text: 'The journey of a thousand miles begins with one step.', author: 'Lao Tzu' },
    { text: 'You miss 100% of the shots you don\'t take.', author: 'Wayne Gretzky' },
    { text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius' },
    { text: 'Success is not final, failure is not fatal: It is the courage to continue that counts.', author: 'Winston Churchill' },
    { text: 'Believe you can and you\'re halfway there.', author: 'Theodore Roosevelt' },
    { text: 'The only limit to our realization of tomorrow is our doubts of today.', author: 'Franklin D. Roosevelt' },
    { text: 'In the middle of difficulty lies opportunity.', author: 'Albert Einstein' },
    { text: 'If you want to lift yourself up, lift up someone else.', author: 'Booker T. Washington' },
    { text: 'The purpose of our lives is to be happy.', author: 'Dalai Lama' },
    { text: 'You only live once, but if you do it right, once is enough.', author: 'Mae West' },
    { text: 'Don\'t count the days, make the days count.', author: 'Muhammad Ali' },
    { text: 'The best revenge is massive success.', author: 'Frank Sinatra' },
    { text: 'The way to get started is to quit talking and begin doing.', author: 'Walt Disney' },
    { text: 'If life were predictable it would cease to be life, and be without flavor.', author: 'Eleanor Roosevelt' },
    { text: 'If you look at what you have in life, you\'ll always have more.', author: 'Oprah Winfrey' },
    { text: 'If you set your goals ridiculously high and it\'s a failure, you will fail above everyone else\'s success.', author: 'James Cameron' },
    { text: 'Life is what we make it, always has been, always will be.', author: 'Grandma Moses' },
    { text: 'The question isn\'t who is going to let me; it\'s who is going to stop me.', author: 'Ayn Rand' },
    { text: 'Spread love everywhere you go. Let no one ever come to you without leaving happier.', author: 'Mother Teresa' },
    { text: 'Do not go where the path may lead, go instead where there is no path and leave a trail.', author: 'Ralph Waldo Emerson' },
    { text: 'Always remember that you are absolutely unique. Just like everyone else.', author: 'Margaret Mead' },
    { text: 'Don\'t judge each day by the harvest you reap but by the seeds that you plant.', author: 'Robert Louis Stevenson' },
    { text: 'Tell me and I forget. Teach me and I remember. Involve me and I learn.', author: 'Benjamin Franklin' },
    { text: 'The best and most beautiful things in the world cannot be seen or even touched - they must be felt with the heart.', author: 'Helen Keller' },
    { text: 'It is during our darkest moments that we must focus to see the light.', author: 'Aristotle' },
    { text: 'Whoever is happy will make others happy too.', author: 'Anne Frank' },
    { text: 'You will face many defeats in life, but never let yourself be defeated.', author: 'Maya Angelou' },
    { text: 'The greatest glory in living lies not in never falling, but in rising every time we fall.', author: 'Nelson Mandela' },
    { text: 'Never let the fear of striking out keep you from playing the game.', author: 'Babe Ruth' },
    { text: 'Life is either a daring adventure or nothing at all.', author: 'Helen Keller' },
    { text: 'Many of life\'s failures are people who did not realize how close they were to success when they gave up.', author: 'Thomas A. Edison' },
    { text: 'You have brains in your head. You have feet in your shoes. You can steer yourself any direction you choose.', author: 'Dr. Seuss' },
    { text: 'Keep smiling, because life is a beautiful thing and there\'s so much to smile about.', author: 'Marilyn Monroe' },
    { text: 'In three words I can sum up everything I\'ve learned about life: it goes on.', author: 'Robert Frost' },
    { text: 'Love the life you live. Live the life you love.', author: 'Bob Marley' },
    { text: 'The mind is everything. What you think you become.', author: 'Buddha' },
    { text: 'Everything you\'ve ever wanted is on the other side of fear.', author: 'George Addair' },
    { text: 'Live in the sunshine, swim the sea, drink the wild air.', author: 'Ralph Waldo Emerson' },
    { text: 'The most difficult thing is the decision to act, the rest is merely tenacity.', author: 'Amelia Earhart' },
    { text: 'Twenty years from now you will be more disappointed by the things that you didn\'t do than by the ones you did do.', author: 'Mark Twain' },
    { text: 'Great minds discuss ideas; average minds discuss events; small minds discuss people.', author: 'Eleanor Roosevelt' },
    { text: 'A successful man is one who can lay a firm foundation with the bricks others have thrown at him.', author: 'David Brinkley' },
    { text: 'Those who dare to fail miserably can achieve greatly.', author: 'John F. Kennedy' }
  ])
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState<number>(0)
  const [quoteChangeInterval, setQuoteChangeInterval] = useState<number>(86400) // 24 hours in seconds

  // Add useRef for the settings panel
  const settingsPanelRef = useRef<HTMLDivElement>(null);
  const settingsToggleRef = useRef<HTMLButtonElement>(null);

  // Add a constant for storage keys to avoid typos
  const STORAGE_KEYS = {
    BACKGROUND_TYPE: 'backgroundType',
    BACKGROUND_COLOR: 'backgroundColor',
    BACKGROUND_IMAGE: 'backgroundImage',
    BACKGROUND_VIDEO: 'backgroundVideo',
    GRADIENT_COLORS: 'gradientColors',
    GRADIENT_DIRECTION: 'gradientDirection',
    RANDOM_SETTINGS: 'randomSettings',
    BACKGROUNDS: 'backgrounds',
    CYCLING_ENABLED: 'cyclingEnabled',
    CYCLING_INTERVAL: 'cyclingInterval',
    CYCLING_MODE: 'cyclingMode',
    CURRENT_BACKGROUND_INDEX: 'currentBackgroundIndex',
    SHOW_SEARCH_BAR: 'showSearchBar',
    SHOW_WEATHER: 'showWeather',
    SHOW_TIME: 'showTime',
    SHOW_DATE: 'showDate',
    SHOW_GREETING: 'showGreeting',
    SHOW_QUICK_LINKS: 'showQuickLinks',
    SHOW_QUOTE: 'showQuote',
    QUICK_LINKS: 'quickLinks',
    QUOTES: 'quotes',
    CURRENT_QUOTE_INDEX: 'currentQuoteIndex',
    QUOTE_CHANGE_INTERVAL: 'quoteChangeInterval',
    WEATHER_API_KEY: 'weatherApiKey',
    SEARCH_ENGINE: 'searchEngine',
    DARK_MODE: 'darkMode',
    KEYBOARD_SHORTCUTS_ENABLED: 'keyboardShortcutsEnabled',
    // TIME_FORMAT: 'timeFormat',
    // VIDEO_CONTROLS: 'videoControls',
    // CUSTOM_GREETING: 'customGreeting'
  };

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isSettingsOpen &&
        settingsPanelRef.current &&
        settingsToggleRef.current &&
        !settingsPanelRef.current.contains(event.target as Node) &&
        !settingsToggleRef.current.contains(event.target as Node)
      ) {
        setIsSettingsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSettingsOpen]);

  // Register keyboard shortcuts
  useEffect(() => {
    if (keyboardShortcutsEnabled) {
      const cleanup = registerDefaultShortcuts({
        toggleSettings: () => setIsSettingsOpen(prev => !prev),
        focusSearch: () => {
          const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
          searchInput?.focus();
        },
        nextQuote: () => {
          setCurrentQuoteIndex(prev => (prev + 1) % quotes.length);
        },
        randomBackground: () => {
          setBackgroundType('random');
        }
      });
      return cleanup;
    }
  }, [keyboardShortcutsEnabled, quotes.length]);

  // Check for updates on mount
  useEffect(() => {
    const checkUpdates = async () => {
      const updateInfo = await checkForUpdates();
      if (updateInfo && updateInfo.isUpdate) {
        showUpdateNotification(updateInfo);
      }
    };
    checkUpdates();
  }, []);

  // Apply dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  }, [darkMode]);

  // Show storage warning toasts
  useEffect(() => {
    if (storageWarning) {
      toast.error(storageWarning);
    }
  }, [storageWarning]);

  // Global error handler for analytics and error tracking
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      trackError(event.error || new Error(event.message), {
        type: 'unhandled_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    };

    const handlePromiseRejection = (event: PromiseRejectionEvent) => {
      trackError(new Error(String(event.reason)), {
        type: 'unhandled_promise_rejection'
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handlePromiseRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handlePromiseRejection);
    };
  }, []);

  // Check for migration and onboarding on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        // Preconnect to external domains for better performance
        preconnectToDomains([
          'https://api.openweathermap.org',
          'https://api.unsplash.com',
          'https://www.google.com',
          'https://favicons.githubusercontent.com'
        ]);

        // Check if migration is needed
        if (await needsMigration()) {
          const result = await migrateData();
          if (result.success) {
            toast.success('Migration completed successfully!');
            trackEvent('migration_completed', { success: true });
          }
        }

        // Check if onboarding should be shown
        if (!(await hasCompletedOnboarding())) {
          setShowOnboarding(true);
        }

        // Load recent colors
        const colors = await getRecentColors();
        setRecentColors(colors);

        // Check for backup reminder (low priority, run when idle)
        runWhenIdle(async () => {
          const shouldShow = await shouldShowBackupReminder();
          if (shouldShow) {
            setShowBackupReminder(true);
          }
        });

        // Track session start with performance metrics
        const metrics = getPerformanceMetrics();
        trackEvent('session_start', {
          loadTime: metrics.loadTime,
          isSlowConnection: isSlowConnection()
        });
      } catch (error) {
        trackError(error as Error, { context: 'initialization' });
      }
    };

    initialize();
  }, []);

  // Track page visibility for analytics
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        trackEvent('tab_hidden', {});
      } else {
        trackEvent('tab_visible', {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Load settings from Chrome storage on initial mount
  useEffect(() => {
    console.log('Loading settings from Chrome storage');

    // Detect if this is being loaded as a popup or a new tab
    const detectPopup = () => {
      // Check if this is being loaded as a popup by checking URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const isPopupParam = urlParams.get('popup');

      // Also check window dimensions as a fallback
      const dimensionCheck = window.innerWidth < 500 && window.innerHeight < 700;

      // Check if this is being opened from the extension action button
      const isActionPopup = window.location.pathname.includes('popup.html');

      // Set popup mode if any condition is true
      if (isPopupParam === 'true' || dimensionCheck || isActionPopup) {
        console.log('Running in popup mode');
        setIsPopup(true);
      } else {
        console.log('Running in new tab mode');
        setIsPopup(false);
      }
    };

    detectPopup();

    // First load small settings from sync storage
    chrome.storage.sync.get([
      STORAGE_KEYS.BACKGROUND_TYPE,
      STORAGE_KEYS.BACKGROUND_COLOR,
      STORAGE_KEYS.GRADIENT_COLORS,
      STORAGE_KEYS.GRADIENT_DIRECTION,
      STORAGE_KEYS.RANDOM_SETTINGS,
      STORAGE_KEYS.CYCLING_ENABLED,
      STORAGE_KEYS.CYCLING_INTERVAL,
      STORAGE_KEYS.CYCLING_MODE,
      STORAGE_KEYS.CURRENT_BACKGROUND_INDEX,
      STORAGE_KEYS.SHOW_SEARCH_BAR,
      STORAGE_KEYS.SHOW_WEATHER,
      STORAGE_KEYS.SHOW_TIME,
      STORAGE_KEYS.SHOW_DATE,
      STORAGE_KEYS.SHOW_GREETING,
      STORAGE_KEYS.SHOW_QUICK_LINKS,
      STORAGE_KEYS.SHOW_QUOTE,
      STORAGE_KEYS.QUICK_LINKS,
      STORAGE_KEYS.QUOTES,
      STORAGE_KEYS.CURRENT_QUOTE_INDEX,
      STORAGE_KEYS.QUOTE_CHANGE_INTERVAL,
      STORAGE_KEYS.WEATHER_API_KEY,
      STORAGE_KEYS.SEARCH_ENGINE,
      STORAGE_KEYS.DARK_MODE,
      STORAGE_KEYS.KEYBOARD_SHORTCUTS_ENABLED,
      // STORAGE_KEYS.TIME_FORMAT,
      // STORAGE_KEYS.VIDEO_CONTROLS,
      // STORAGE_KEYS.CUSTOM_GREETING
    ], (result) => {
      console.log('Loaded settings from sync storage:', result);

      // Apply loaded settings to state, with gradient as the default fallback
      if (result.backgroundType) {
        setBackgroundType(result.backgroundType);
      } else {
        // If no background type is set, use gradient as default
        setBackgroundType('gradient');
        // Save this default to storage
        chrome.storage.sync.set({
          backgroundType: 'gradient',
          gradientColors: ['#3498db', '#9b59b6'],
          gradientDirection: 'to right'
        });
      }

      if (result.backgroundColor) setBackgroundColor(result.backgroundColor);
      if (result.gradientColors) setGradientColors(result.gradientColors);
      if (result.gradientDirection) setGradientDirection(result.gradientDirection);
      if (result.randomSettings) setRandomSettings(result.randomSettings);
      if (result.cyclingEnabled !== undefined) setCyclingEnabled(result.cyclingEnabled);
      if (result.cyclingInterval) setCyclingInterval(result.cyclingInterval);
      if (result.cyclingMode) setCyclingMode(result.cyclingMode);
      if (result.currentBackgroundIndex !== undefined) setCurrentBackgroundIndex(result.currentBackgroundIndex);

      // Load UI visibility settings
      if (result.showSearchBar !== undefined) setShowSearchBar(result.showSearchBar);
      if (result.showWeather !== undefined) setShowWeather(result.showWeather);
      if (result.showTime !== undefined) setShowTime(result.showTime);
      if (result.showDate !== undefined) setShowDate(result.showDate);
      if (result.showGreeting !== undefined) setShowGreeting(result.showGreeting);
      if (result.showQuickLinks !== undefined) setShowQuickLinks(result.showQuickLinks);
      if (result.showQuote !== undefined) setShowQuote(result.showQuote);

      // Load quick links and quotes
      if (result.quickLinks) setQuickLinks(result.quickLinks);
      if (result.quotes) setQuotes(result.quotes);
      if (result.currentQuoteIndex !== undefined) setCurrentQuoteIndex(result.currentQuoteIndex);
      if (result.quoteChangeInterval) setQuoteChangeInterval(result.quoteChangeInterval);

      // Load new feature settings
      if (result.weatherApiKey) {
        // Decrypt API key
        const decrypted = decryptApiKey(result.weatherApiKey);
        setWeatherApiKey(decrypted);
      }
      if (result.searchEngine) setSearchEngine(result.searchEngine);
      if (result.darkMode !== undefined) setDarkMode(result.darkMode);
      if (result.keyboardShortcutsEnabled !== undefined) setKeyboardShortcutsEnabled(result.keyboardShortcutsEnabled);
      // if (result.timeFormat) setTimeFormat(result.timeFormat);
      // if (result.videoControls) setVideoControls(result.videoControls);
      // if (result.customGreeting) setCustomGreeting(result.customGreeting);

      // Then load media files from local storage (larger data)
      chrome.storage.local.get([
        STORAGE_KEYS.BACKGROUND_IMAGE,
        STORAGE_KEYS.BACKGROUND_VIDEO,
        STORAGE_KEYS.BACKGROUNDS
      ], (localResult) => {
        console.log('Loaded media from local storage:', localResult);

        if (localResult.backgroundImage) setBackgroundImage(localResult.backgroundImage);
        if (localResult.backgroundVideo) setBackgroundVideo(localResult.backgroundVideo);
        if (localResult.backgrounds) {
          const loadedBackgrounds = localResult.backgrounds;
          setBackgrounds(loadedBackgrounds);

          // If not a popup and cycling is enabled and we have multiple backgrounds,
          // advance to the next background when opening a new tab
          if (!isPopup &&
              result.cyclingEnabled &&
              loadedBackgrounds.length > 1 &&
              result.currentBackgroundIndex !== undefined) {

            // Calculate next index based on cycling mode
            let nextIndex = 0;
            if (result.cyclingMode === 'random') {
              // Get random background index, different from current
              do {
                nextIndex = Math.floor(Math.random() * loadedBackgrounds.length);
              } while (nextIndex === result.currentBackgroundIndex && loadedBackgrounds.length > 1);
            } else {
              // Sequential mode
              nextIndex = (result.currentBackgroundIndex + 1) % loadedBackgrounds.length;
            }

            // Update the current background index
            setCurrentBackgroundIndex(nextIndex);

            // Apply the background
            const nextBackground = loadedBackgrounds[nextIndex];
            if (nextBackground) {
              setBackgroundType(nextBackground.type);

              if (nextBackground.type === 'image') {
                setBackgroundImage(nextBackground.url);
              } else if (nextBackground.type === 'video') {
                setBackgroundVideo(nextBackground.url);
              }

              // Save the new index to storage
              chrome.storage.sync.set({ [STORAGE_KEYS.CURRENT_BACKGROUND_INDEX]: nextIndex });
            }
          }
        }
      });
    });
  }, []);

  // Add cycling effect
  useEffect(() => {
    if (!cyclingEnabled || backgrounds.length <= 1) return;

    console.log('Setting up background cycling:', {
      cyclingEnabled,
      cyclingInterval,
      cyclingMode,
      backgroundsCount: backgrounds.length,
      currentBackgroundType: backgroundType
    });

    const interval = setInterval(() => {
      // Only cycle backgrounds if the current background type is set to image or video
      // This ensures we don't override a manual selection of gradient or solid color
      if (backgroundType !== 'image' && backgroundType !== 'video') {
        console.log('Skipping background cycling as current type is:', backgroundType);
        return;
      }

      let nextIndex = 0;

      if (cyclingMode === 'random') {
        // Get random background index, different from current
        let randomIndex;
        do {
          randomIndex = Math.floor(Math.random() * backgrounds.length);
        } while (randomIndex === currentBackgroundIndex && backgrounds.length > 1);

        nextIndex = randomIndex;
      } else {
        // Sequential mode
        nextIndex = (currentBackgroundIndex + 1) % backgrounds.length;
      }

      console.log(`Cycling to next background: ${nextIndex}`);

      // Update the current background index
      updateSetting('currentBackgroundIndex', nextIndex, setCurrentBackgroundIndex);

      // Apply the background
      const nextBackground = backgrounds[nextIndex];
      if (nextBackground) {
        updateSetting('backgroundType', nextBackground.type, setBackgroundType);

        if (nextBackground.type === 'image') {
          updateSetting('backgroundImage', nextBackground.url, setBackgroundImage);
        } else if (nextBackground.type === 'video') {
          updateSetting('backgroundVideo', nextBackground.url, setBackgroundVideo);
        }
      }
    }, cyclingInterval * 1000);

    return () => clearInterval(interval);
  }, [cyclingEnabled, cyclingInterval, cyclingMode, backgrounds, currentBackgroundIndex, backgroundType]);

  // Save settings to Chrome storage
  const saveSetting = (key: string, value: any) => {
    console.log(`Saving setting: ${key}`, value);

    // Determine if this is media content that should go in local storage
    const isMediaContent = key === STORAGE_KEYS.BACKGROUND_IMAGE ||
                          key === STORAGE_KEYS.BACKGROUND_VIDEO ||
                          key === STORAGE_KEYS.BACKGROUNDS;

    const storageArea = isMediaContent ? chrome.storage.local : chrome.storage.sync;

    const setting = { [key]: value };
    storageArea.set(setting, () => {
      if (chrome.runtime.lastError) {
        console.error(`Error saving setting ${key}:`, chrome.runtime.lastError);
      } else {
        console.log(`Successfully saved setting: ${key}`, value);

        // Broadcast the change to other tabs
        localStorage.setItem('lastUpdate', JSON.stringify({
          key,
          value,
          timestamp: Date.now(),
          isMediaContent
        }));
      }
    });
  };

  // Enhanced updateSettings function with better storage handling
  const updateSettings = (settings: Record<string, any>) => {
    console.log('Updating multiple settings:', settings);

    // Separate settings into media and non-media
    const mediaSettings: Record<string, any> = {};
    const nonMediaSettings: Record<string, any> = {};

    // Update all state values first
    Object.entries(settings).forEach(([key, value]) => {
      switch (key) {
        case STORAGE_KEYS.BACKGROUND_TYPE:
          setBackgroundType(value);
          nonMediaSettings[key] = value;
          break;
        case STORAGE_KEYS.BACKGROUND_COLOR:
          setBackgroundColor(value);
          nonMediaSettings[key] = value;
          break;
        case STORAGE_KEYS.BACKGROUND_IMAGE:
          setBackgroundImage(value);
          mediaSettings[key] = value;
          break;
        case STORAGE_KEYS.BACKGROUND_VIDEO:
          setBackgroundVideo(value);
          mediaSettings[key] = value;
          break;
        case STORAGE_KEYS.GRADIENT_COLORS:
          setGradientColors(value);
          nonMediaSettings[key] = value;
          break;
        case STORAGE_KEYS.GRADIENT_DIRECTION:
          setGradientDirection(value);
          nonMediaSettings[key] = value;
          break;
        case STORAGE_KEYS.RANDOM_SETTINGS:
          setRandomSettings(value);
          nonMediaSettings[key] = value;
          break;
        case STORAGE_KEYS.BACKGROUNDS:
          setBackgrounds(value);
          mediaSettings[key] = value;
          break;
        case STORAGE_KEYS.CYCLING_ENABLED:
          setCyclingEnabled(value);
          nonMediaSettings[key] = value;
          break;
        case STORAGE_KEYS.CYCLING_INTERVAL:
          setCyclingInterval(value);
          nonMediaSettings[key] = value;
          break;
        case STORAGE_KEYS.CYCLING_MODE:
          setCyclingMode(value);
          nonMediaSettings[key] = value;
          break;
        case STORAGE_KEYS.CURRENT_BACKGROUND_INDEX:
          setCurrentBackgroundIndex(value);
          nonMediaSettings[key] = value;
          break;
        case STORAGE_KEYS.SHOW_SEARCH_BAR:
          setShowSearchBar(value);
          nonMediaSettings[key] = value;
          break;
        case STORAGE_KEYS.SHOW_WEATHER:
          setShowWeather(value);
          nonMediaSettings[key] = value;
          break;
        case STORAGE_KEYS.SHOW_TIME:
          setShowTime(value);
          nonMediaSettings[key] = value;
          break;
        case STORAGE_KEYS.SHOW_DATE:
          setShowDate(value);
          nonMediaSettings[key] = value;
          break;
        case STORAGE_KEYS.SHOW_GREETING:
          setShowGreeting(value);
          nonMediaSettings[key] = value;
          break;
        case STORAGE_KEYS.SHOW_QUICK_LINKS:
          setShowQuickLinks(value);
          nonMediaSettings[key] = value;
          break;
        case STORAGE_KEYS.SHOW_QUOTE:
          setShowQuote(value);
          nonMediaSettings[key] = value;
          break;
        case STORAGE_KEYS.QUICK_LINKS:
          setQuickLinks(value);
          nonMediaSettings[key] = value;
          break;
        case STORAGE_KEYS.QUOTES:
          setQuotes(value);
          nonMediaSettings[key] = value;
          break;
        case STORAGE_KEYS.CURRENT_QUOTE_INDEX:
          setCurrentQuoteIndex(value);
          nonMediaSettings[key] = value;
          break;
        case STORAGE_KEYS.QUOTE_CHANGE_INTERVAL:
          setQuoteChangeInterval(value);
          nonMediaSettings[key] = value;
          break;
        case STORAGE_KEYS.WEATHER_API_KEY:
          setWeatherApiKey(value);
          nonMediaSettings[key] = value;
          break;
        case STORAGE_KEYS.SEARCH_ENGINE:
          setSearchEngine(value);
          nonMediaSettings[key] = value;
          break;
        case STORAGE_KEYS.DARK_MODE:
          setDarkMode(value);
          nonMediaSettings[key] = value;
          break;
        case STORAGE_KEYS.KEYBOARD_SHORTCUTS_ENABLED:
          setKeyboardShortcutsEnabled(value);
          nonMediaSettings[key] = value;
          break;
        // Future features (will be uncommented when UI is added):
        // case STORAGE_KEYS.TIME_FORMAT, VIDEO_CONTROLS, CUSTOM_GREETING
      }
    });

    // Save non-media settings to sync storage
    if (Object.keys(nonMediaSettings).length > 0) {
      chrome.storage.sync.set(nonMediaSettings, () => {
        if (chrome.runtime.lastError) {
          console.error('Error saving non-media settings:', chrome.runtime.lastError);
        } else {
          console.log('Successfully saved non-media settings:', nonMediaSettings);

          // Broadcast changes to other tabs
          Object.entries(nonMediaSettings).forEach(([key, value]) => {
            localStorage.setItem('lastUpdate', JSON.stringify({
              key,
              value,
              timestamp: Date.now(),
              isMediaContent: false
            }));
          });
        }
      });
    }

    // Save media settings to local storage
    if (Object.keys(mediaSettings).length > 0) {
      chrome.storage.local.set(mediaSettings, () => {
        if (chrome.runtime.lastError) {
          console.error('Error saving media settings:', chrome.runtime.lastError);
        } else {
          console.log('Successfully saved media settings:', mediaSettings);

          // Broadcast changes to other tabs
          Object.entries(mediaSettings).forEach(([key, value]) => {
            localStorage.setItem('lastUpdate', JSON.stringify({
              key,
              value,
              timestamp: Date.now(),
              isMediaContent: true
            }));
          });
        }
      });
    }
  };

  // Add the updateSetting function back
  const updateSetting = (key: string, value: any, stateSetter: (value: any) => void) => {
    stateSetter(value);
    saveSetting(key, value);
  };

  // Fix the handleBackgroundTypeChange function
  const handleBackgroundTypeChange = (type: string) => {
    updateSettings({ backgroundType: type });
  };

  // Update gradient settings
  const handleGradientColorChange = (index: number, color: string) => {
    const newGradientColors = [...gradientColors];
    newGradientColors[index] = color;
    updateSettings({
      gradientColors: newGradientColors,
      backgroundType: 'gradient'
    });
  };

  // Fix the handleGradientDirectionChange function
  const handleGradientDirectionChange = (direction: string) => {
    updateSettings({
      gradientDirection: direction,
      backgroundType: 'gradient'
    });
  };

  // Fix the handleCyclingIntervalChange function
  const handleCyclingIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const interval = Number(e.target.value);
    updateSettings({ cyclingInterval: interval });
  };

  // Fix the handleCyclingEnabledChange function
  const handleCyclingEnabledChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = e.target.checked;
    updateSettings({ cyclingEnabled: enabled });
  };

  // Add a color picker to the popup UI for solid color and gradient options
  const renderColorPicker = () => {
    return (
      <div className="color-picker-container">
        <h3>Select Color</h3>
        <input
          type="color"
          value={backgroundColor}
          onChange={handleColorChange}
          className="color-picker"
        />
        <div className="color-preview" style={{ backgroundColor }}></div>
        <span className="color-value">{backgroundColor}</span>
      </div>
    );
  };

  // Add gradient controls to the popup UI
  const renderGradientControls = () => {
    return (
      <div className="gradient-controls">
        <h4>Gradient Colors</h4>
        <div className="gradient-colors">
          {gradientColors.map((color, index) => (
            <div key={index} className="gradient-color-container">
              <input
                type="color"
                value={color}
                onChange={(e) => handleGradientColorChange(index, e.target.value)}
                className="gradient-color-picker"
              />
              <div
                className="color-preview"
                style={{ backgroundColor: color }}
              ></div>
              <span className="color-value">{color}</span>
            </div>
          ))}
          {gradientColors.length < 3 && (
            <button
              className="add-color-button"
              onClick={() => {
                const newColors = [...gradientColors, generateRandomHexColor()];
                updateSettings({
                  gradientColors: newColors,
                  backgroundType: 'gradient'
                });
              }}
            >
              + Add Color
            </button>
          )}
        </div>

        {gradientColors.length > 2 && (
          <button
            className="remove-color-button"
            onClick={() => {
              const newColors = [...gradientColors];
              newColors.pop();
              updateSettings({
                gradientColors: newColors,
                backgroundType: 'gradient'
              });
            }}
            style={{marginBottom: '10px'}}
          >
            - Remove Color
          </button>
        )}

        <h4>Gradient Direction</h4>
        <div className="gradient-directions">
          <button
            className={`gradient-direction ${gradientDirection === 'to right' ? 'active' : ''}`}
            onClick={() => handleGradientDirectionChange('to right')}
          >
            Horizontal →
          </button>
          <button
            className={`gradient-direction ${gradientDirection === 'to bottom' ? 'active' : ''}`}
            onClick={() => handleGradientDirectionChange('to bottom')}
          >
            Vertical ↓
          </button>
          <button
            className={`gradient-direction ${gradientDirection === 'to bottom left' ? 'active' : ''}`}
            onClick={() => handleGradientDirectionChange('to bottom left')}
          >
            Diagonal ↙
          </button>
          <button
            className={`gradient-direction ${gradientDirection === 'to bottom right' ? 'active' : ''}`}
            onClick={() => handleGradientDirectionChange('to bottom right')}
          >
            Diagonal ↘
          </button>
        </div>

        <h4>Preset Gradients</h4>
        <div className="preset-gradients">
          <button
            className="preset-button"
            style={{background: 'linear-gradient(to right, #4e54c8, #8f94fb)'}}
            onClick={() => updateSettings({
              gradientColors: ['#4e54c8', '#8f94fb'],
              gradientDirection: 'to right'
            })}
          ></button>
          <button
            className="preset-button"
            style={{background: 'linear-gradient(to right, #11998e, #38ef7d)'}}
            onClick={() => updateSettings({
              gradientColors: ['#11998e', '#38ef7d'],
              gradientDirection: 'to right'
            })}
          ></button>
          <button
            className="preset-button"
            style={{background: 'linear-gradient(to right, #f12711, #f5af19)'}}
            onClick={() => updateSettings({
              gradientColors: ['#f12711', '#f5af19'],
              gradientDirection: 'to right'
            })}
          ></button>
          <button
            className="preset-button"
            style={{background: 'linear-gradient(to right, #ff416c, #ff4b2b)'}}
            onClick={() => updateSettings({
              gradientColors: ['#ff416c', '#ff4b2b'],
              gradientDirection: 'to right'
            })}
          ></button>
          <button
            className="preset-button"
            style={{background: 'linear-gradient(to right, #8e2de2, #4a00e0)'}}
            onClick={() => updateSettings({
              gradientColors: ['#8e2de2', '#4a00e0'],
              gradientDirection: 'to right'
            })}
          ></button>
          <button
            className="preset-button"
            style={{background: 'linear-gradient(to right, #f953c6, #b91d73)'}}
            onClick={() => updateSettings({
              gradientColors: ['#f953c6', '#b91d73'],
              gradientDirection: 'to right'
            })}
          ></button>
        </div>

        <div
          className="gradient-preview"
          style={{
            background: `linear-gradient(${gradientDirection}, ${gradientColors.join(', ')})`
          }}
        ></div>
      </div>
    );
  };

  // Update the renderPopupUI function to include the new controls
  const renderPopupUI = () => {
    return (
      <div className="popup-container">
        <h1>Elk New Tab Settings</h1>

        {/* Background Type Selection */}
        <div className="setting-group">
          <h2>Background Type</h2>
          <div className="background-options">
            <button
              className={`background-option ${backgroundType === 'color' ? 'active' : ''}`}
              onClick={() => handleBackgroundTypeChange('color')}
            >
              Solid Color
            </button>
            <button
              className={`background-option ${backgroundType === 'image' ? 'active' : ''}`}
              onClick={() => handleBackgroundTypeChange('image')}
            >
              Image
            </button>
            <button
              className={`background-option ${backgroundType === 'gradient' ? 'active' : ''}`}
              onClick={() => handleBackgroundTypeChange('gradient')}
            >
              Gradient
            </button>
            <button
              className={`background-option ${backgroundType === 'video' ? 'active' : ''}`}
              onClick={() => handleBackgroundTypeChange('video')}
            >
              Video
            </button>
            <button
              className={`background-option ${backgroundType === 'random' ? 'active' : ''}`}
              onClick={() => handleBackgroundTypeChange('random')}
            >
              Random
            </button>
          </div>
        </div>

        {/* Background Color Picker - Show when color type is selected */}
        {backgroundType === 'color' && (
          <div className="setting-group">
            <h2>Background Color</h2>
            {renderColorPicker()}
          </div>
        )}

        {/* Gradient Controls - Show when gradient type is selected */}
        {backgroundType === 'gradient' && (
          <div className="setting-group">
            <h2>Gradient Settings</h2>
            {renderGradientControls()}
          </div>
        )}

        {/* Custom Background Upload */}
        {(backgroundType === 'image' || backgroundType === 'video') && (
          <div className="setting-group">
            <h3>Custom Background</h3>
            {renderCustomBackgroundUpload()}
          </div>
        )}

        {/* Background Cycling Settings */}
        {(backgroundType === 'image' || backgroundType === 'video') && backgrounds.length > 1 && (
          <div className="setting-group">
            <h3>Background Cycling</h3>
            <div className="setting-row">
              <label>
                <input
                  type="checkbox"
                  checked={cyclingEnabled}
                  onChange={(e) => handleCyclingEnabledChange(e)}
                />
                Enable background cycling
              </label>
            </div>
            {cyclingEnabled && (
              <>
                <div className="setting-row">
                  <label>
                    Cycling Interval (seconds):
                    <input
                      type="number"
                      min="5"
                      max="3600"
                      value={cyclingInterval}
                      onChange={(e) => handleCyclingIntervalChange(e)}
                    />
                  </label>
                </div>
                <div className="setting-row">
                  <label>
                    <input
                      type="radio"
                      name="cyclingMode"
                      value="sequential"
                      checked={cyclingMode === 'sequential'}
                      onChange={() => updateSettings({ cyclingMode: 'sequential' })}
                    />
                    Sequential
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="cyclingMode"
                      value="random"
                      checked={cyclingMode === 'random'}
                      onChange={() => updateSettings({ cyclingMode: 'random' })}
                    />
                    Random
                  </label>
                </div>
              </>
            )}
          </div>
        )}

        {/* UI Element Visibility Settings */}
        <div className="setting-group">
          <h2>UI Element Visibility</h2>
          <div className="setting-row">
            <label>
              <input
                type="checkbox"
                checked={showSearchBar}
                onChange={(e) => updateSettings({ showSearchBar: e.target.checked })}
              />
              Show Search Bar
            </label>
          </div>
          <div className="setting-row">
            <label>
              <input
                type="checkbox"
                checked={showWeather}
                onChange={(e) => updateSettings({ showWeather: e.target.checked })}
              />
              Show Weather Widget
            </label>
          </div>
          <div className="setting-row">
            <label>
              <input
                type="checkbox"
                checked={showTime}
                onChange={(e) => updateSettings({ showTime: e.target.checked })}
              />
              Show Time
            </label>
          </div>
          <div className="setting-row">
            <label>
              <input
                type="checkbox"
                checked={showDate}
                onChange={(e) => updateSettings({ showDate: e.target.checked })}
              />
              Show Date
            </label>
          </div>
          <div className="setting-row">
            <label>
              <input
                type="checkbox"
                checked={showGreeting}
                onChange={(e) => updateSettings({ showGreeting: e.target.checked })}
              />
              Show Greeting
            </label>
          </div>
          <div className="setting-row">
            <label>
              <input
                type="checkbox"
                checked={showQuickLinks}
                onChange={(e) => updateSettings({ showQuickLinks: e.target.checked })}
              />
              Show Quick Links
            </label>
          </div>
          <div className="setting-row">
            <label>
              <input
                type="checkbox"
                checked={showQuote}
                onChange={(e) => updateSettings({ showQuote: e.target.checked })}
              />
              Show Quote
            </label>
          </div>
        </div>

        {/* Quick Links Customization */}
        <div className="setting-group">
          <h2>Customize Quick Links</h2>
          <div className="quick-links-editor">
            {quickLinks.map((link, index) => (
              <div key={link.id} className="quick-link-edit-row">
                <input
                  type="text"
                  placeholder="Icon (emoji)"
                  value={link.icon}
                  onChange={(e) => {
                    const newLinks = [...quickLinks];
                    newLinks[index] = { ...newLinks[index], icon: e.target.value };
                    updateSettings({ quickLinks: newLinks });
                  }}
                  className="icon-input"
                  maxLength={2}
                />
                <input
                  type="text"
                  placeholder="Name"
                  value={link.name}
                  onChange={(e) => {
                    const newLinks = [...quickLinks];
                    newLinks[index] = { ...newLinks[index], name: e.target.value };
                    updateSettings({ quickLinks: newLinks });
                  }}
                  className="name-input"
                />
                <input
                  type="url"
                  placeholder="URL"
                  value={link.url}
                  onChange={(e) => {
                    const newLinks = [...quickLinks];
                    newLinks[index] = { ...newLinks[index], url: e.target.value };
                    updateSettings({ quickLinks: newLinks });
                  }}
                  className="url-input"
                />
                <button
                  onClick={() => {
                    const newLinks = quickLinks.filter((_, i) => i !== index);
                    updateSettings({ quickLinks: newLinks });
                  }}
                  className="delete-button"
                >
                  ×
                </button>
              </div>
            ))}
            {quickLinks.length < 8 && (
              <button
                onClick={() => {
                  const newLinks = [...quickLinks, {
                    id: Date.now().toString(),
                    name: 'New Link',
                    url: 'https://',
                    icon: '🔗'
                  }];
                  updateSettings({ quickLinks: newLinks });
                }}
                className="add-link-button"
              >
                + Add Link
              </button>
            )}
          </div>
        </div>

        {/* Quote Settings */}
        <div className="setting-group">
          <h2>Quote Settings</h2>
          <div className="setting-row">
            <label>
              Change quotes every:
              <select
                value={quoteChangeInterval}
                onChange={(e) => updateSettings({
                  quoteChangeInterval: parseInt(e.target.value)
                })}
              >
                <option value="3600">1 hour</option>
                <option value="21600">6 hours</option>
                <option value="43200">12 hours</option>
                <option value="86400">24 hours</option>
                <option value="604800">1 week</option>
              </select>
            </label>
          </div>
        </div>
      </div>
    );
  };

  // Background style based on the selected type
  const getBackgroundStyle = () => {
    console.log('Getting background style for type:', backgroundType);

    // Common background properties for all types
    const baseBackgroundStyle = {
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    };

    switch (backgroundType) {
      case 'color':
        return { ...baseBackgroundStyle, backgroundColor };

      case 'image':
        return backgroundImage
          ? { ...baseBackgroundStyle, backgroundImage: `url(${backgroundImage})` }
          : { ...baseBackgroundStyle, backgroundColor: '#000' };

      case 'gradient':
        const gradientValue = `linear-gradient(${gradientDirection}, ${gradientColors.join(', ')})`;
        return { ...baseBackgroundStyle, background: gradientValue };

      case 'video':
        return { ...baseBackgroundStyle, backgroundColor: 'transparent' }; // Changed to transparent for video background

      case 'random':
        if (randomSettings.type === 'solid') {
          const randomColor = generateRandomHexColor();
          return { ...baseBackgroundStyle, backgroundColor: randomColor };
        } else {
          const colors = [generateRandomHexColor(), generateRandomHexColor()];
          const direction = randomSettings.gradientType === 'radial'
            ? 'circle'
            : randomSettings.gradientType === 'linear'
              ? 'to right'
              : '45deg';

          const gradientValue = `linear-gradient(${direction}, ${colors[0]}, ${colors[1]})`;
          return { ...baseBackgroundStyle, background: gradientValue };
        }

      default:
        return { ...baseBackgroundStyle, backgroundColor: '#000' };
    }
  };

  // Helper function to generate random hex color
  const generateRandomHexColor = () => {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  };

  // Format time as HH:MM
  const formatTime = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    return `${hours}:${minutes < 10 ? '0' + minutes : minutes}`;
  };

  // Format date as Day, Month Date
  const formatDate = () => {
    return currentTime.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  // Handle search submission with selected search engine
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const searchValue = (e.currentTarget.elements.namedItem('search') as HTMLInputElement).value;
    if (searchValue.trim()) {
      trackEvent('search_performed', {
        engine: searchEngine,
        queryLength: searchValue.length
      });
      performSearch(searchValue, searchEngine);
    }
  };

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Set greeting based on time of day
  useEffect(() => {
    const hour = currentTime.getHours()
    let newGreeting = ''

    if (hour >= 5 && hour < 12) {
      newGreeting = 'Good morning'
    } else if (hour >= 12 && hour < 18) {
      newGreeting = 'Good afternoon'
    } else {
      newGreeting = 'Good evening'
    }

    setGreeting(newGreeting)
  }, [currentTime])

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];

      // Handle image files with compression
      if (file.type.startsWith('image/')) {
        try {
          // Compress image before saving
          const compressedDataUrl = await compressImage(file, { maxSizeKB: 500 });

          const newBackground = {
            id: Date.now().toString(),
            url: compressedDataUrl,
            type: 'image'
          };

          updateSettings({
            backgroundImage: compressedDataUrl,
            backgroundType: 'image',
            backgrounds: [...backgrounds, newBackground]
          });

          toast.success('Image uploaded and compressed successfully!');
        } catch (error) {
          console.error('Error compressing image:', error);
          toast.error('Failed to upload image. Please try a smaller file.');
        }
      } else if (file.type.startsWith('video/')) {
        // Check video file size
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
          toast.error('Video is too large. Maximum size is 10MB.');
          return;
        }

        const reader = new FileReader();
        reader.onloadend = (e) => {
          const result = e.target?.result as string;
          const newBackground = {
            id: Date.now().toString(),
            url: result,
            type: 'video'
          };

          updateSettings({
            backgroundVideo: result,
            backgroundType: 'video',
            backgrounds: [...backgrounds, newBackground]
          });

          toast.success('Video uploaded successfully!');
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Handle background color change with visual feedback
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    updateSettings({
      backgroundColor: color,
      backgroundType: 'color'
    });
  };

  // Improved file upload handling with size limits and storage
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check if user is trying to add more than 5 images at once
    const imageFilesCount = Array.from(files).filter(file => file.type.startsWith('image/')).length;

    // Count existing images in the backgrounds array
    const existingImagesCount = backgrounds.filter(bg => bg.type === 'image').length;

    // Calculate how many more images we can add
    const maxAllowedNewImages = 5 - existingImagesCount;

    if (imageFilesCount > maxAllowedNewImages) {
      toast.error(`You can only have up to 5 images total. You currently have ${existingImagesCount} image(s) and can add ${maxAllowedNewImages} more.`);
      return;
    }

    // Process files
    const newBackgrounds: Array<{id: string, url: string, type: string}> = [];
    let filesProcessed = 0;
    let totalSizeBytes = 0;

    // First pass: check total size
    Array.from(files).forEach(file => {
      const isVideo = file.type.startsWith('video/');
      const maxSize = isVideo ? 10 * 1024 * 1024 : 5 * 1024 * 1024;

      if (file.size > maxSize) {
        toast.error(`File ${file.name} is too large. Maximum size is ${isVideo ? '10MB' : '5MB'}.`);
        return;
      }

      totalSizeBytes += file.size;
    });

    // Estimate storage capacity (Chrome storage has limits)
    const MAX_STORAGE_BYTES = 5 * 1024 * 1024; // 5MB for images, which is conservative

    if (totalSizeBytes > MAX_STORAGE_BYTES) {
      toast.error(`Total file size (${Math.round(totalSizeBytes/1024/1024)}MB) exceeds storage limit. Consider using fewer or smaller files.`);
      return;
    }

    // Second pass: process the files
    Array.from(files).forEach(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;

        // Add to backgrounds list for cycling
        const newBackground = {
          id: Date.now().toString() + filesProcessed,
          url: result,
          type: isImage ? 'image' : 'video'
        };

        newBackgrounds.push(newBackground);
        filesProcessed++;

        // When all files are processed, update state
        if (filesProcessed === files.length) {
          const updatedBackgrounds = [...backgrounds, ...newBackgrounds];

          // If this is the first background, apply it
          if (backgrounds.length === 0 && newBackgrounds.length > 0) {
            const firstBackground = newBackgrounds[0];
            if (firstBackground.type === 'image') {
              updateSettings({
                backgroundImage: firstBackground.url,
                backgroundType: 'image',
                backgrounds: updatedBackgrounds
              });
            } else if (firstBackground.type === 'video') {
              updateSettings({
                backgroundVideo: firstBackground.url,
                backgroundType: 'video',
                backgrounds: updatedBackgrounds
              });
            }
          } else {
            // Just update the backgrounds list
            updateSettings({
              backgrounds: updatedBackgrounds
            });
          }

          // Automatically enable cycling if more than one background
          if (updatedBackgrounds.length > 1 && !cyclingEnabled) {
            updateSettings({
              cyclingEnabled: true
            });
          }

          toast.success(`${newBackgrounds.length} background${newBackgrounds.length === 1 ? '' : 's'} added successfully!`);
        }
      };

      reader.readAsDataURL(file);
    });
  };

  // Custom background upload UI that supports both image and video
  const renderCustomBackgroundUpload = () => {
    return (
      <div className="custom-background">
        <input
          type="file"
          id="backgroundUploader"
          accept="image/*,video/*"
          onChange={handleFileUpload}
          className="file-input"
          style={{ display: 'none' }}
          multiple // Enable multiple file selection
        />

        {backgroundType === 'image' && (
          <div className="image-controls">
            <button
              className="upload-button"
              onClick={() => document.getElementById('backgroundUploader')?.click()}
            >
              Upload Images
            </button>
            {backgroundImage && (
              <>
                <div className="image-preview" style={{ backgroundImage: `url(${backgroundImage})` }}></div>
                <button
                  className="remove-image"
                  onClick={() => updateSettings({
                    backgroundImage: null,
                    backgroundType: 'gradient' // Fall back to gradient
                  })}
                >
                  Remove Image
                </button>
              </>
            )}

            {/* Display all background images in a gallery */}
            {backgrounds.filter(bg => bg.type === 'image').length > 0 && (
              <div className="image-gallery">
                <h4>All Uploaded Images ({backgrounds.filter(bg => bg.type === 'image').length})</h4>
                <div className="image-thumbnails">
                  {backgrounds
                    .filter(bg => bg.type === 'image')
                    .map((bg, index) => (
                      <div
                        key={bg.id}
                        className={`image-thumbnail ${backgroundImage === bg.url ? 'active' : ''}`}
                      >
                        <div
                          className="thumbnail-image"
                          style={{ backgroundImage: `url(${bg.url})` }}
                          onClick={() => updateSettings({
                            backgroundImage: bg.url,
                            backgroundType: 'image',
                            currentBackgroundIndex: backgrounds.indexOf(bg)
                          })}
                          title={`Image ${index + 1} (Click to select)`}
                        />
                        <button
                          className="thumbnail-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            // If this is the current background, switch to another one
                            const isCurrentBackground = backgroundImage === bg.url;

                            // Remove this background from the list
                            const updatedBackgrounds = backgrounds.filter(item => item.id !== bg.id);

                            if (isCurrentBackground) {
                              // If there are other images, select one of them
                              const otherImages = updatedBackgrounds.filter(item => item.type === 'image');
                              if (otherImages.length > 0) {
                                updateSettings({
                                  backgroundImage: otherImages[0].url,
                                  backgrounds: updatedBackgrounds,
                                  currentBackgroundIndex: updatedBackgrounds.indexOf(otherImages[0])
                                });
                              } else {
                                // No other images, revert to gradient
                                updateSettings({
                                  backgroundImage: null,
                                  backgroundType: 'gradient',
                                  backgrounds: updatedBackgrounds
                                });
                              }
                            } else {
                              // Just update the backgrounds list
                              updateSettings({
                                backgrounds: updatedBackgrounds
                              });
                            }
                          }}
                          title="Delete this image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {backgroundType === 'video' && (
          <div className="video-controls">
            <button
              className="upload-button"
              onClick={() => document.getElementById('backgroundUploader')?.click()}
            >
              Upload Video
            </button>
            {backgroundVideo && (
              <>
                <div className="video-preview">
                  <video src={backgroundVideo} muted autoPlay loop style={{ width: '100%', maxHeight: '120px' }}></video>
                </div>
                <button
                  className="remove-video"
                  onClick={() => updateSettings({
                    backgroundVideo: null,
                    backgroundType: 'gradient' // Fall back to gradient
                  })}
                >
                  Remove Video
                </button>
              </>
            )}

            {/* Display all background videos in a gallery */}
            {backgrounds.filter(bg => bg.type === 'video').length > 0 && (
              <div className="video-gallery">
                <h4>All Uploaded Videos ({backgrounds.filter(bg => bg.type === 'video').length})</h4>
                <div className="video-thumbnails">
                  {backgrounds
                    .filter(bg => bg.type === 'video')
                    .map((bg, index) => (
                      <div
                        key={bg.id}
                        className={`video-thumbnail ${backgroundVideo === bg.url ? 'active' : ''}`}
                      >
                        <div
                          className="thumbnail-video"
                          onClick={() => updateSettings({
                            backgroundVideo: bg.url,
                            backgroundType: 'video',
                            currentBackgroundIndex: backgrounds.indexOf(bg)
                          })}
                          title={`Video ${index + 1} (Click to select)`}
                        >
                          <video src={bg.url} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <button
                          className="thumbnail-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            // If this is the current background, switch to another one
                            const isCurrentBackground = backgroundVideo === bg.url;

                            // Remove this background from the list
                            const updatedBackgrounds = backgrounds.filter(item => item.id !== bg.id);

                            if (isCurrentBackground) {
                              // If there are other videos, select one of them
                              const otherVideos = updatedBackgrounds.filter(item => item.type === 'video');
                              if (otherVideos.length > 0) {
                                updateSettings({
                                  backgroundVideo: otherVideos[0].url,
                                  backgrounds: updatedBackgrounds,
                                  currentBackgroundIndex: updatedBackgrounds.indexOf(otherVideos[0])
                                });
                              } else {
                                // No other videos, revert to gradient
                                updateSettings({
                                  backgroundVideo: null,
                                  backgroundType: 'gradient',
                                  backgrounds: updatedBackgrounds
                                });
                              }
                            } else {
                              // Just update the backgrounds list
                              updateSettings({
                                backgrounds: updatedBackgrounds
                              });
                            }
                          }}
                          title="Delete this video"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div
          className="dropzone"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <p>Drag and drop your {backgroundType === 'image' ? 'image' : 'video'} here</p>
          <p className="size-note">Maximum file size: 5MB</p>
        </div>
      </div>
    );
  };

  // Add a localStorage listener to sync between tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'lastUpdate') {
        try {
          const update = JSON.parse(e.newValue || '{}');
          if (update.key && update.timestamp) {
            console.log('Received update from another tab:', update);

            // Apply the update to this tab
            switch (update.key) {
              case STORAGE_KEYS.BACKGROUND_TYPE:
                setBackgroundType(update.value);
                break;
              case STORAGE_KEYS.BACKGROUND_COLOR:
                setBackgroundColor(update.value);
                break;
              case STORAGE_KEYS.BACKGROUND_IMAGE:
                setBackgroundImage(update.value);
                break;
              case STORAGE_KEYS.BACKGROUND_VIDEO:
                setBackgroundVideo(update.value);
                break;
              case STORAGE_KEYS.GRADIENT_COLORS:
                setGradientColors(update.value);
                break;
              case STORAGE_KEYS.GRADIENT_DIRECTION:
                setGradientDirection(update.value);
                break;
              case STORAGE_KEYS.RANDOM_SETTINGS:
                setRandomSettings(update.value);
                break;
              case STORAGE_KEYS.BACKGROUNDS:
                setBackgrounds(update.value);
                break;
              case STORAGE_KEYS.CYCLING_ENABLED:
                setCyclingEnabled(update.value);
                break;
              case STORAGE_KEYS.CYCLING_INTERVAL:
                setCyclingInterval(update.value);
                break;
              case STORAGE_KEYS.CYCLING_MODE:
                setCyclingMode(update.value);
                break;
              case STORAGE_KEYS.CURRENT_BACKGROUND_INDEX:
                setCurrentBackgroundIndex(update.value);
                break;
            }
          }
        } catch (err) {
          console.error('Error parsing localStorage update:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Add Chrome storage change listener
  useEffect(() => {
    const handleChromeStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      console.log(`Storage changes in ${areaName}:`, changes);

      Object.entries(changes).forEach(([key, change]) => {
        const newValue = change.newValue;
        switch (key) {
          case STORAGE_KEYS.BACKGROUND_TYPE:
            setBackgroundType(newValue);
            break;
          case STORAGE_KEYS.BACKGROUND_COLOR:
            setBackgroundColor(newValue);
            break;
          case STORAGE_KEYS.BACKGROUND_IMAGE:
            setBackgroundImage(newValue);
            break;
          case STORAGE_KEYS.BACKGROUND_VIDEO:
            setBackgroundVideo(newValue);
            break;
          case STORAGE_KEYS.GRADIENT_COLORS:
            setGradientColors(newValue);
            break;
          case STORAGE_KEYS.GRADIENT_DIRECTION:
            setGradientDirection(newValue);
            break;
          case STORAGE_KEYS.RANDOM_SETTINGS:
            setRandomSettings(newValue);
            break;
          case STORAGE_KEYS.BACKGROUNDS:
            setBackgrounds(newValue);
            break;
          case STORAGE_KEYS.CYCLING_ENABLED:
            setCyclingEnabled(newValue);
            break;
          case STORAGE_KEYS.CYCLING_INTERVAL:
            setCyclingInterval(newValue);
            break;
          case STORAGE_KEYS.CYCLING_MODE:
            setCyclingMode(newValue);
            break;
          case STORAGE_KEYS.CURRENT_BACKGROUND_INDEX:
            setCurrentBackgroundIndex(newValue);
            break;
        }
      });
    };

    chrome.storage.onChanged.addListener(handleChromeStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleChromeStorageChange);
  }, []);

  // Add an effect for quote rotation
  useEffect(() => {
    // Only change quotes if they're visible and we have quotes to display
    if (showQuote && quotes.length > 0) {
      // Setup interval to change quotes
      const interval = setInterval(() => {
        const nextIndex = (currentQuoteIndex + 1) % quotes.length;
        setCurrentQuoteIndex(nextIndex);
        updateSettings({ currentQuoteIndex: nextIndex });
      }, quoteChangeInterval * 1000);

      return () => clearInterval(interval);
    }
  }, [showQuote, quotes, currentQuoteIndex, quoteChangeInterval]);

  // Helper function to get current quote
  const getCurrentQuote = () => {
    if (quotes.length === 0) {
      return { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' };
    }
    return quotes[currentQuoteIndex];
  };

  return isPopup ? renderPopupUI() : (
    <div
      className="app"
      style={getBackgroundStyle()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Video background if selected */}
      {backgroundType === 'video' && backgroundVideo && (
        <video
          key={backgroundVideo}
          autoPlay
          loop
          muted
          playsInline
          className="video-background"
        >
          <source src={backgroundVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}

      {/* Weather Widget */}
      {showWeather && (
        <div className="weather-widget">
          {weatherLoading ? (
            <div className="weather-info">
              <div className="weather-temp">Loading...</div>
            </div>
          ) : weather ? (
            <>
              <div className="weather-icon">{weather.icon || '☀️'}</div>
              <div className="weather-info">
                <div className="weather-temp">{weather.temp}</div>
                <div className="weather-location">{weather.location}</div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>{weather.condition}</div>
              </div>
            </>
          ) : (
            <div className="weather-info">
              <div style={{ fontSize: '12px', cursor: 'pointer' }} onClick={() => setIsSettingsOpen(true)}>
                {weatherApiKey ? 'Weather unavailable' : 'Set API key in settings'}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Settings toggle button */}
      <button
        ref={settingsToggleRef}
        className="settings-toggle"
        onClick={() => {
          const newState = !isSettingsOpen;
          setIsSettingsOpen(newState);
          trackEvent(newState ? 'settings_opened' : 'settings_closed', {});
        }}
        aria-label={isSettingsOpen ? 'Close settings' : 'Open settings'}
        aria-expanded={isSettingsOpen}
      >
        {isSettingsOpen ? '×' : '⚙'}
      </button>

      {/* Clock Widget */}
      {showTime && <div className="clock-widget">{formatTime()}</div>}
      {showDate && <div className="date-widget">{formatDate()}</div>}

      {/* Greeting */}
      {showGreeting && <div className="greeting">{greeting}</div>}

      {/* Search Box */}
      {showSearchBar && (
        <form className="search-box" onSubmit={handleSearch}>
          <input
            type="text"
            name="search"
            className="search-input"
            placeholder="Search the web..."
            autoComplete="off"
          />
        </form>
      )}

      {/* Quick Links */}
      {showQuickLinks && quickLinks.length > 0 && (
        <div className="quick-links">
          {quickLinks.map(link => (
            <a key={link.id} href={link.url} className="quick-link">
              <div className="quick-link-icon">{link.icon}</div>
              <div className="quick-link-text">{link.name}</div>
            </a>
          ))}
        </div>
      )}

      {/* Quote Widget */}
      {showQuote && (
        <div className="quotes-widget">
          <div className="quote-text">"{getCurrentQuote().text}"</div>
          <div className="quote-author">— {getCurrentQuote().author}</div>
        </div>
      )}

      {/* Drag & drop overlay */}
      {isDragging && (
        <div className="dropzone active">
          <p>Drop your image or video here</p>
        </div>
      )}

      {/* Settings panel */}
      {isSettingsOpen && (
        <div ref={settingsPanelRef} className="settings-panel">
          <h2>New Tab Settings</h2>

          {/* Background Type Section */}
          <div className="setting-group">
            <h3>Background Type</h3>
            <div className="background-options">
              <button
                className={`background-option ${backgroundType === 'color' ? 'active' : ''}`}
                onClick={() => handleBackgroundTypeChange('color')}
              >
                Solid Color
              </button>
              <button
                className={`background-option ${backgroundType === 'image' ? 'active' : ''}`}
                onClick={() => handleBackgroundTypeChange('image')}
              >
                Image
              </button>
              <button
                className={`background-option ${backgroundType === 'gradient' ? 'active' : ''}`}
                onClick={() => handleBackgroundTypeChange('gradient')}
              >
                Gradient
              </button>
              <button
                className={`background-option ${backgroundType === 'video' ? 'active' : ''}`}
                onClick={() => handleBackgroundTypeChange('video')}
              >
                Video
              </button>
            </div>
          </div>

          {/* Background color picker (for solid color type) */}
          {backgroundType === 'color' && (
            <div className="setting-group">
              <h3>Background Color</h3>
              {renderColorPicker()}
            </div>
          )}

          {/* Gradient Controls - Show when gradient type is selected */}
          {backgroundType === 'gradient' && (
            <div className="setting-group">
              <h3>Gradient Settings</h3>
              {renderGradientControls()}
            </div>
          )}

          {/* Custom Background Upload */}
          {(backgroundType === 'image' || backgroundType === 'video') && (
            <div className="setting-group">
              <h3>Custom Background</h3>
              {renderCustomBackgroundUpload()}
            </div>
          )}

          {/* Background Cycling Settings - Only show once under Image/Video section */}
          {(backgroundType === 'image' || backgroundType === 'video') && backgrounds.length > 1 && (
            <div className="setting-group">
              <h3>Background Cycling</h3>
              <div className="setting-row">
                <label>
                  <input
                    type="checkbox"
                    checked={cyclingEnabled}
                    onChange={(e) => handleCyclingEnabledChange(e)}
                  />
                  Enable background cycling
                </label>
              </div>
              {cyclingEnabled && (
                <>
                  <div className="setting-row">
                    <label>
                      Cycling Interval (seconds):
                      <input
                        type="number"
                        min="5"
                        max="3600"
                        value={cyclingInterval}
                        onChange={(e) => handleCyclingIntervalChange(e)}
                      />
                    </label>
                  </div>
                  <div className="setting-row">
                    <label>
                      <input
                        type="radio"
                        name="cyclingMode"
                        value="sequential"
                        checked={cyclingMode === 'sequential'}
                        onChange={() => updateSettings({ cyclingMode: 'sequential' })}
                      />
                      Sequential
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="cyclingMode"
                        value="random"
                        checked={cyclingMode === 'random'}
                        onChange={() => updateSettings({ cyclingMode: 'random' })}
                      />
                      Random
                    </label>
                  </div>
                </>
              )}
            </div>
          )}

          {/* General Settings Section */}
          <div className="setting-group">
            <h3>General Settings</h3>

            {/* UI Element Visibility Settings */}
            <h4>UI Element Visibility</h4>
            <div className="setting-row">
              <label>
                <input
                  type="checkbox"
                  checked={showSearchBar}
                  onChange={(e) => updateSettings({ showSearchBar: e.target.checked })}
                />
                Show Search Bar
              </label>
            </div>
            <div className="setting-row">
              <label>
                <input
                  type="checkbox"
                  checked={showWeather}
                  onChange={(e) => updateSettings({ showWeather: e.target.checked })}
                />
                Show Weather Widget
              </label>
            </div>
            <div className="setting-row">
              <label>
                <input
                  type="checkbox"
                  checked={showTime}
                  onChange={(e) => updateSettings({ showTime: e.target.checked })}
                />
                Show Time
              </label>
            </div>
            <div className="setting-row">
              <label>
                <input
                  type="checkbox"
                  checked={showDate}
                  onChange={(e) => updateSettings({ showDate: e.target.checked })}
                />
                Show Date
              </label>
            </div>
            <div className="setting-row">
              <label>
                <input
                  type="checkbox"
                  checked={showGreeting}
                  onChange={(e) => updateSettings({ showGreeting: e.target.checked })}
                />
                Show Greeting
              </label>
            </div>
            <div className="setting-row">
              <label>
                <input
                  type="checkbox"
                  checked={showQuickLinks}
                  onChange={(e) => updateSettings({ showQuickLinks: e.target.checked })}
                />
                Show Quick Links
              </label>
            </div>
            <div className="setting-row">
              <label>
                <input
                  type="checkbox"
                  checked={showQuote}
                  onChange={(e) => updateSettings({ showQuote: e.target.checked })}
                />
                Show Quote
              </label>
            </div>

            {/* Quick Links Customization */}
            <h4>Customize Quick Links</h4>
            <div className="quick-links-editor">
              {quickLinks.map((link, index) => (
                <div key={link.id} className="quick-link-edit-row">
                  <input
                    type="text"
                    placeholder="Icon (emoji)"
                    value={link.icon}
                    onChange={(e) => {
                      const newLinks = [...quickLinks];
                      newLinks[index] = { ...newLinks[index], icon: e.target.value };
                      updateSettings({ quickLinks: newLinks });
                    }}
                    className="icon-input"
                    maxLength={2}
                  />
                  <input
                    type="text"
                    placeholder="Name"
                    value={link.name}
                    onChange={(e) => {
                      const sanitizedName = sanitizeHtml(e.target.value);
                      const newLinks = [...quickLinks];
                      newLinks[index] = { ...newLinks[index], name: sanitizedName };
                      updateSettings({ quickLinks: newLinks });
                      trackEvent('quick_link_name_changed', { linkId: link.id });
                    }}
                    className="name-input"
                  />
                  <input
                    type="url"
                    placeholder="URL"
                    value={link.url}
                    onChange={(e) => {
                      const newLinks = [...quickLinks];
                      newLinks[index] = { ...newLinks[index], url: e.target.value };
                      updateSettings({ quickLinks: newLinks });
                    }}
                    onBlur={async (e) => {
                      const url = e.target.value;
                      const validUrl = validateUrl(url);

                      if (validUrl) {
                        // Fetch favicon for the URL
                        try {
                          const faviconUrl = await fetchFavicon(validUrl);
                          const newLinks = [...quickLinks];
                          newLinks[index] = {
                            ...newLinks[index],
                            url: validUrl,
                            icon: link.icon === '🔗' ? '🌐' : link.icon // Keep custom icon if set
                          };
                          updateSettings({ quickLinks: newLinks });
                          trackEvent('quick_link_url_validated', { linkId: link.id, hasCustomFavicon: faviconUrl !== '' });
                        } catch (error) {
                          trackError(error as Error, { context: 'favicon_fetch', url: validUrl });
                        }
                      } else if (url && url !== 'https://') {
                        toast.error('Invalid URL. Please enter a valid URL starting with http:// or https://');
                        trackEvent('quick_link_validation_failed', { url });
                      }
                    }}
                    className="url-input"
                  />
                  <button
                    onClick={() => {
                      const newLinks = quickLinks.filter((_, i) => i !== index);
                      updateSettings({ quickLinks: newLinks });
                    }}
                    className="delete-button"
                  >
                    ×
                  </button>
                </div>
              ))}
              {quickLinks.length < 8 && (
                <button
                  onClick={() => {
                    const newLinks = [...quickLinks, {
                      id: Date.now().toString(),
                      name: 'New Link',
                      url: 'https://',
                      icon: '🔗'
                    }];
                    updateSettings({ quickLinks: newLinks });
                  }}
                  className="add-link-button"
                >
                  + Add Link
                </button>
              )}
            </div>

            {/* Quote Settings */}
            <h4>Quote Settings</h4>
            <div className="setting-row">
              <label>
                Change quotes every:
                <select
                  value={quoteChangeInterval}
                  onChange={(e) => updateSettings({
                    quoteChangeInterval: parseInt(e.target.value)
                  })}
                >
                  <option value="3600">1 hour</option>
                  <option value="21600">6 hours</option>
                  <option value="43200">12 hours</option>
                  <option value="86400">24 hours</option>
                  <option value="604800">1 week</option>
                </select>
              </label>
            </div>
          </div>

          {/* Preset Configurations */}
          <div className="setting-group">
            <h3>Quick Presets</h3>
            <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '10px' }}>
              Apply pre-configured themes instantly
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
              {PRESET_CONFIGS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={async () => {
                    try {
                      await applyPreset(preset.id);
                      toast.success(`Applied ${preset.name} preset!`);
                      trackEvent('preset_applied', { presetId: preset.id });
                      // Reload to apply changes
                      setTimeout(() => window.location.reload(), 500);
                    } catch (error) {
                      toast.error('Failed to apply preset');
                      trackError(error as Error, { context: 'apply_preset', presetId: preset.id });
                    }
                  }}
                  style={{
                    padding: '15px 10px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    background: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '5px' }}>{preset.icon}</div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{preset.name}</div>
                  <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '3px' }}>
                    {preset.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Features Section */}
          <div className="setting-group">
            <h3>Advanced Features</h3>

            {/* Weather API Key */}
            <div className="setting-row">
              <label>
                Weather API Key (OpenWeatherMap):
                <input
                  type="password"
                  placeholder="Enter your API key"
                  value={weatherApiKey}
                  onChange={(e) => {
                    const newKey = e.target.value;

                    // Validate input length
                    const lengthValidation = validateInputLength(newKey, 100, 'API Key');
                    if (!lengthValidation.valid) {
                      toast.error(lengthValidation.error!);
                      return;
                    }

                    setWeatherApiKey(newKey);
                    // Encrypt before saving
                    const encrypted = encryptApiKey(newKey);
                    saveSetting(STORAGE_KEYS.WEATHER_API_KEY, encrypted);
                    trackEvent('weather_api_key_updated', { hasKey: newKey.length > 0 });
                  }}
                  style={{ width: '100%', marginTop: '5px' }}
                  maxLength={100}
                />
              </label>
              {weatherError && <div style={{ color: 'red', fontSize: '12px' }}>{weatherError}</div>}
              <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '5px' }}>
                Get a free API key at <a href="https://openweathermap.org/api" target="_blank" rel="noopener noreferrer">openweathermap.org</a>
                <br />🔒 Your API key is encrypted before storage
              </div>
            </div>

            {/* Search Engine Selector */}
            <div className="setting-row">
              <label>
                Default Search Engine:
                <select
                  value={searchEngine}
                  onChange={(e) => {
                    const engine = e.target.value;
                    setSearchEngine(engine);
                    saveSetting(STORAGE_KEYS.SEARCH_ENGINE, engine);
                  }}
                  style={{ width: '100%', marginTop: '5px' }}
                >
                  {SEARCH_ENGINES.map((engine) => (
                    <option key={engine.id} value={engine.id}>
                      {engine.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Dark Mode Toggle */}
            <div className="setting-row">
              <label>
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    setDarkMode(enabled);
                    saveSetting(STORAGE_KEYS.DARK_MODE, enabled);
                  }}
                />
                Enable Dark Mode
              </label>
            </div>

            {/* Keyboard Shortcuts Toggle */}
            <div className="setting-row">
              <label>
                <input
                  type="checkbox"
                  checked={keyboardShortcutsEnabled}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    setKeyboardShortcutsEnabled(enabled);
                    saveSetting(STORAGE_KEYS.KEYBOARD_SHORTCUTS_ENABLED, enabled);
                  }}
                />
                Enable Keyboard Shortcuts
              </label>
              {keyboardShortcutsEnabled && (
                <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '5px' }}>
                  • Ctrl+K or / - Focus search • Ctrl+, - Toggle settings<br />
                  • Ctrl+Q - Next quote • Ctrl+R - Random background
                </div>
              )}
            </div>

            {/* Unsplash Browser Button */}
            <div className="setting-row">
              <button
                onClick={() => setShowUnsplashBrowser(true)}
                className="button-primary"
                style={{ width: '100%' }}
              >
                Browse Unsplash Photos
              </button>
            </div>
          </div>

          {/* Data Management Section */}
          <div className="setting-group">
            <h3>Data Management</h3>

            <div className="setting-row">
              <button
                onClick={async () => {
                  try {
                    await exportSettings();
                    toast.success('Settings exported successfully!');
                  } catch (error) {
                    console.error('Export error:', error);
                    toast.error('Failed to export settings');
                  }
                }}
                className="button-secondary"
                style={{ width: '100%', marginBottom: '10px' }}
              >
                Export Settings
              </button>
            </div>

            <div className="setting-row">
              <label
                htmlFor="import-settings"
                className="button-secondary"
                style={{ display: 'block', textAlign: 'center', cursor: 'pointer', width: '100%', marginBottom: '10px' }}
              >
                Import Settings
                <input
                  id="import-settings"
                  type="file"
                  accept=".json"
                  onChange={async (e) => {
                    if (e.target.files && e.target.files[0]) {
                      try {
                        await importSettings(e.target.files[0]);
                        toast.success('Settings imported successfully! Reloading...');
                        setTimeout(() => window.location.reload(), 1000);
                      } catch (error) {
                        console.error('Import error:', error);
                        toast.error('Failed to import settings');
                      }
                    }
                  }}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            <div className="setting-row">
              <button
                onClick={() => setShowResetConfirm(true)}
                className="button-danger"
                style={{ width: '100%' }}
              >
                Reset All Settings
              </button>
            </div>

            {/* Storage Usage Info */}
            <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '10px' }}>
              Storage Usage: {Math.round((quota.syncUsed / quota.syncQuota) * 100)}% sync,
              {Math.round((quota.localUsed / quota.localQuota) * 100)}% local
            </div>
          </div>
        </div>
      )}

      {/* Unsplash Browser Modal */}
      {showUnsplashBrowser && (
        <UnsplashBrowser
          onClose={() => setShowUnsplashBrowser(false)}
          onSelectImage={async (imageUrl) => {
            try {
              // Fetch and compress the image
              const response = await fetch(imageUrl);
              const blob = await response.blob();
              const file = new File([blob], 'unsplash-image.jpg', { type: 'image/jpeg' });
              const compressedDataUrl = await compressImage(file, { maxSizeKB: 500 });

              const newBackground = {
                id: Date.now().toString(),
                url: compressedDataUrl,
                type: 'image'
              };

              updateSettings({
                backgroundImage: compressedDataUrl,
                backgroundType: 'image',
                backgrounds: [...backgrounds, newBackground]
              });

              toast.success('Unsplash image set as background!');
              setShowUnsplashBrowser(false);
            } catch (error) {
              console.error('Error setting Unsplash image:', error);
              toast.error('Failed to set background image');
            }
          }}
        />
      )}

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <ConfirmDialog
          title="Reset All Settings"
          message="Are you sure you want to reset all settings? This will delete all your customizations and cannot be undone."
          onConfirm={async () => {
            try {
              await resetSettings();
              toast.success('All settings reset! Reloading...');
              trackEvent('settings_reset', {});
              setTimeout(() => window.location.reload(), 1000);
            } catch (error) {
              console.error('Reset error:', error);
              toast.error('Failed to reset settings');
              trackError(error as Error, { context: 'reset_settings' });
            }
            setShowResetConfirm(false);
          }}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}

      {/* Onboarding Modal */}
      {showOnboarding && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '40px',
              maxWidth: '600px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>👋</div>
            <h2 style={{ fontSize: '32px', marginBottom: '16px', color: '#333' }}>
              Welcome to Elk New Tab!
            </h2>
            <p style={{ fontSize: '16px', color: '#666', lineHeight: '1.6', marginBottom: '30px' }}>
              Your new tab experience just got a major upgrade with 90+ features including:
            </p>
            <div style={{ textAlign: 'left', marginBottom: '30px' }}>
              <div style={{ marginBottom: '12px', fontSize: '14px', color: '#555' }}>
                ✨ Real-time weather with OpenWeatherMap
              </div>
              <div style={{ marginBottom: '12px', fontSize: '14px', color: '#555' }}>
                🎨 Beautiful backgrounds from Unsplash
              </div>
              <div style={{ marginBottom: '12px', fontSize: '14px', color: '#555' }}>
                ⌨️ Powerful keyboard shortcuts (Ctrl+K, Ctrl+,)
              </div>
              <div style={{ marginBottom: '12px', fontSize: '14px', color: '#555' }}>
                🔍 Multi-search engine support (Google, DuckDuckGo, Bing, etc.)
              </div>
              <div style={{ marginBottom: '12px', fontSize: '14px', color: '#555' }}>
                🌙 Dark mode for comfortable viewing
              </div>
              <div style={{ marginBottom: '12px', fontSize: '14px', color: '#555' }}>
                📦 Import/Export settings for easy backup
              </div>
            </div>
            <p style={{ fontSize: '14px', color: '#888', marginBottom: '24px' }}>
              Click the settings icon (⚙️) in the top-right corner to customize everything!
            </p>
            <button
              onClick={async () => {
                await completeOnboarding();
                setShowOnboarding(false);
                toast.success('Welcome aboard! Explore the settings to customize your experience.');
                trackEvent('onboarding_completed', {});
              }}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '14px 32px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Get Started
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
