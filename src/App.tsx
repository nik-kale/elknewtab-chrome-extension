import React, { useState, useEffect, useRef } from 'react'
import './App.css'
import { RandomColorOptions } from './components/RandomColorGenerator'

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

  // Time and date state
  const [currentTime, setCurrentTime] = useState(new Date())
  const [greeting, setGreeting] = useState('')

  // Quote and weather - read-only, not setting these
  const [quote] = useState({ text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' })
  const [weather] = useState({ temp: '72°', location: 'San Francisco, CA' })

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
    CURRENT_BACKGROUND_INDEX: 'currentBackgroundIndex'
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
      STORAGE_KEYS.CURRENT_BACKGROUND_INDEX
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
      backgroundsCount: backgrounds.length
    });

    const interval = setInterval(() => {
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
  }, [cyclingEnabled, cyclingInterval, cyclingMode, backgrounds, currentBackgroundIndex]);

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

  // Fix the handleShuffleMode function
  const handleShuffleMode = () => {
    updateSettings({
      cyclingMode: 'random',
      cyclingEnabled: true
    });
    alert('Shuffle mode enabled! Backgrounds will cycle randomly.');
  };

  // Fix the handleRandomColorType function
  const handleRandomColorType = (type: 'solid' | 'gradient') => {
    const newRandomSettings = { ...randomSettings, type };
    updateSettings({
      randomSettings: newRandomSettings,
      backgroundType: 'random'
    });

    // Show success message
    alert(`Random ${type} color mode enabled!`);
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

  // Fix the handleRemoveFromList function
  const handleRemoveFromList = (index: number) => {
    const newBackgrounds = [...backgrounds];
    newBackgrounds.splice(index, 1);

    const settings: Record<string, any> = {
      backgrounds: newBackgrounds
    };

    // If the current background was removed, reset to default
    if (currentBackgroundIndex === index) {
      settings.currentBackgroundIndex = 0;
    }

    updateSettings(settings);
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
        {/* First row of direction buttons */}
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
        </div>

        {/* Second row of direction buttons */}
        <div className="gradient-directions">
          <button
            className={`gradient-direction ${gradientDirection === 'to bottom right' ? 'active' : ''}`}
            onClick={() => handleGradientDirectionChange('to bottom right')}
          >
            Diagonal ↘
          </button>
          <button
            className={`gradient-direction ${gradientDirection === 'to bottom left' ? 'active' : ''}`}
            onClick={() => handleGradientDirectionChange('to bottom left')}
          >
            Diagonal ↙
          </button>
        </div>

        {/* Third row of direction buttons */}
        <div className="gradient-directions">
          <button
            className={`gradient-direction ${gradientDirection === 'to top right' ? 'active' : ''}`}
            onClick={() => handleGradientDirectionChange('to top right')}
          >
            Diagonal ↗
          </button>
          <button
            className={`gradient-direction ${gradientDirection === 'to top left' ? 'active' : ''}`}
            onClick={() => handleGradientDirectionChange('to top left')}
          >
            Diagonal ↖
          </button>
        </div>

        <h4>Preset Gradients</h4>
        <div className="gradient-presets">
          {/* Existing preset buttons */}
          <button
            className="preset-button"
            style={{ background: 'linear-gradient(to right, #3498db, #9b59b6)' }}
            onClick={() => updateSettings({
              gradientColors: ['#3498db', '#9b59b6'],
              gradientDirection: 'to right',
              backgroundType: 'gradient'
            })}
            title="Blue to Purple"
          ></button>
          <button
            className="preset-button"
            style={{ background: 'linear-gradient(to right, #2ecc71, #3498db)' }}
            onClick={() => updateSettings({
              gradientColors: ['#2ecc71', '#3498db'],
              gradientDirection: 'to right',
              backgroundType: 'gradient'
            })}
            title="Green to Blue"
          ></button>
          <button
            className="preset-button"
            style={{ background: 'linear-gradient(to right, #f1c40f, #e74c3c)' }}
            onClick={() => updateSettings({
              gradientColors: ['#f1c40f', '#e74c3c'],
              gradientDirection: 'to right',
              backgroundType: 'gradient'
            })}
            title="Yellow to Red"
          ></button>
          <button
            className="preset-button"
            style={{ background: 'linear-gradient(to bottom, #e74c3c, #9b59b6)' }}
            onClick={() => updateSettings({
              gradientColors: ['#e74c3c', '#9b59b6'],
              gradientDirection: 'to bottom',
              backgroundType: 'gradient'
            })}
            title="Red to Purple"
          ></button>
          <button
            className="preset-button"
            style={{ background: 'linear-gradient(to right, #FF6B6B, #556270)' }}
            onClick={() => updateSettings({
              gradientColors: ['#FF6B6B', '#556270'],
              gradientDirection: 'to right',
              backgroundType: 'gradient'
            })}
            title="Coral to Slate"
          ></button>
          <button
            className="preset-button"
            style={{ background: 'linear-gradient(to right, #FEAC5E, #C779D0, #4BC0C8)' }}
            onClick={() => updateSettings({
              gradientColors: ['#FEAC5E', '#C779D0', '#4BC0C8'],
              gradientDirection: 'to right',
              backgroundType: 'gradient'
            })}
            title="Sunset Vibes"
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
        <div className="setting-group">
          <h2>Custom Background</h2>
          {renderCustomBackgroundUpload()}
        </div>

        {/* Background Cycling */}
        <div className="setting-group">
          <h2>Background Cycling</h2>
          <button
            id="addBackground"
            onClick={() => document.getElementById('backgroundUploader')?.click()}
          >
            Add Images to Cycle
          </button>
          <button
            id="shuffleMode"
            onClick={handleShuffleMode}
            className={cyclingMode === 'random' ? 'active' : ''}
          >
            Shuffle Mode
          </button>
          <div className="cycling-settings">
            <label>
              <input
                type="checkbox"
                id="cyclingEnabled"
                checked={cyclingEnabled}
                onChange={handleCyclingEnabledChange}
              />
              Enable Cycling
            </label>
            <div className="cycling-interval">
              <label htmlFor="cyclingInterval">Interval (seconds):</label>
              <input
                type="number"
                id="cyclingInterval"
                min="10"
                value={cyclingInterval}
                onChange={handleCyclingIntervalChange}
              />
            </div>
          </div>
          <h3>Backgrounds List ({backgrounds.length})</h3>
          <div className="backgrounds-info">
            <p>
              {backgrounds.filter(bg => bg.type === 'image').length} Images,
              {backgrounds.filter(bg => bg.type === 'video').length} Videos
              {backgrounds.length > 0 && cyclingEnabled ? ' - Cycling Enabled' : ''}
              {backgrounds.length > 0 && !cyclingEnabled ? ' - Cycling Disabled' : ''}
            </p>
          </div>
          <ul id="backgroundList" className="backgrounds-list">
            {backgrounds.length === 0 ? (
              <li className="empty-list">No backgrounds added yet</li>
            ) : (
              backgrounds.map((bg, index) => (
                <li key={bg.id}>
                  {bg.type.charAt(0).toUpperCase() + bg.type.slice(1)} Background {index + 1}
                  <button onClick={() => handleRemoveFromList(index)}>Remove</button>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Random Colors */}
        <div className="setting-group">
          <h2>Random Colors</h2>
          <button
            id="randomSolidColor"
            onClick={() => handleRandomColorType('solid')}
            className={backgroundType === 'random' && randomSettings.type === 'solid' ? 'active' : ''}
          >
            Random Solid Color
          </button>
          <button
            id="randomGradient"
            onClick={() => handleRandomColorType('gradient')}
            className={backgroundType === 'random' && randomSettings.type === 'gradient' ? 'active' : ''}
          >
            Random Gradient
          </button>
          <div className="gradient-options">
            <button
              className={`gradient-option ${randomSettings.gradientType === 'linear' ? 'active' : ''}`}
              data-gradient="linear"
              onClick={() => updateSetting('randomSettings', { ...randomSettings, gradientType: 'linear' }, setRandomSettings)}
            >
              Linear
            </button>
            <button
              className={`gradient-option ${randomSettings.gradientType === 'radial' ? 'active' : ''}`}
              data-gradient="radial"
              onClick={() => updateSetting('randomSettings', { ...randomSettings, gradientType: 'radial' }, setRandomSettings)}
            >
              Radial
            </button>
            <button
              className={`gradient-option ${randomSettings.gradientType !== 'linear' && randomSettings.gradientType !== 'radial' ? 'active' : ''}`}
              data-gradient="diagonal"
              onClick={() => updateSetting('randomSettings', { ...randomSettings, gradientType: 'diagonal' }, setRandomSettings)}
            >
              Diagonal
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Background style based on the selected type
  const getBackgroundStyle = () => {
    console.log('Getting background style for type:', backgroundType);

    switch (backgroundType) {
      case 'color':
        return { backgroundColor };

      case 'image':
        return backgroundImage
          ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : { backgroundColor: '#000' };

      case 'gradient':
        const gradientValue = `linear-gradient(${gradientDirection}, ${gradientColors.join(', ')})`;
        return { background: gradientValue };

      case 'video':
        return { backgroundColor: 'transparent' }; // Changed to transparent for video background

      case 'random':
        if (randomSettings.type === 'solid') {
          const randomColor = generateRandomHexColor();
          return { backgroundColor: randomColor };
        } else {
          const colors = [generateRandomHexColor(), generateRandomHexColor()];
          const direction = randomSettings.gradientType === 'radial'
            ? 'circle'
            : randomSettings.gradientType === 'linear'
              ? 'to right'
              : '45deg';

          const gradientValue = `linear-gradient(${direction}, ${colors[0]}, ${colors[1]})`;
          return { background: gradientValue };
        }

      default:
        return { backgroundColor: '#000' };
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

  // Handle search submission
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const searchValue = (e.currentTarget.elements.namedItem('search') as HTMLInputElement).value;
    if (searchValue.trim()) {
      window.location.href = `https://www.google.com/search?q=${encodeURIComponent(searchValue)}`;
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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];

      // Check file size
      const isVideo = file.type.startsWith('video/');
      const maxSize = isVideo ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(`File is too large. Maximum size is ${isVideo ? '10MB' : '5MB'}.`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = (e) => {
        const result = e.target?.result as string;

        if (file.type.startsWith('image/')) {
          const newBackground = {
            id: Date.now().toString(),
            url: result,
            type: 'image'
          };

          updateSettings({
            backgroundImage: result,
            backgroundType: 'image',
            backgrounds: [...backgrounds, newBackground]
          });
        } else if (file.type.startsWith('video/')) {
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
        }
      };
      reader.readAsDataURL(file);
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
      alert(`You can only have up to 5 images total. You currently have ${existingImagesCount} image(s) and can add ${maxAllowedNewImages} more.`);
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
        alert(`File ${file.name} is too large. Maximum size is ${isVideo ? '10MB' : '5MB'}.`);
        return;
      }

      totalSizeBytes += file.size;
    });

    // Estimate storage capacity (Chrome storage has limits)
    const MAX_STORAGE_BYTES = 5 * 1024 * 1024; // 5MB for images, which is conservative

    if (totalSizeBytes > MAX_STORAGE_BYTES) {
      alert(`Total file size (${Math.round(totalSizeBytes/1024/1024)}MB) exceeds storage limit. Please select smaller or fewer files.`);
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

          alert(`${newBackgrounds.length} background${newBackgrounds.length === 1 ? '' : 's'} added successfully!`);
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
      <div className="weather-widget">
        <div className="weather-icon">☀️</div>
        <div className="weather-info">
          <div className="weather-temp">{weather.temp}</div>
          <div className="weather-location">{weather.location}</div>
        </div>
      </div>

      {/* Settings toggle button */}
      <button
        ref={settingsToggleRef}
        className="settings-toggle"
        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
      >
        {isSettingsOpen ? '×' : '⚙'}
      </button>

      {/* Clock Widget */}
      <div className="clock-widget">{formatTime()}</div>
      <div className="date-widget">{formatDate()}</div>

      {/* Greeting */}
      <div className="greeting">{greeting}</div>

      {/* Search Box */}
      <form className="search-box" onSubmit={handleSearch}>
        <input
          type="text"
          name="search"
          className="search-input"
          placeholder="Search the web..."
          autoComplete="off"
        />
      </form>

      {/* Quick Links */}
      <div className="quick-links">
        <a href="https://mail.google.com" className="quick-link">
          <div className="quick-link-icon">📧</div>
          <div className="quick-link-text">Gmail</div>
        </a>
        <a href="https://drive.google.com" className="quick-link">
          <div className="quick-link-icon">📁</div>
          <div className="quick-link-text">Drive</div>
        </a>
        <a href="https://calendar.google.com" className="quick-link">
          <div className="quick-link-icon">📅</div>
          <div className="quick-link-text">Calendar</div>
        </a>
        <a href="https://youtube.com" className="quick-link">
          <div className="quick-link-icon">📺</div>
          <div className="quick-link-text">YouTube</div>
        </a>
      </div>

      {/* Quote Widget */}
      <div className="quotes-widget">
        <div className="quote-text">"{quote.text}"</div>
        <div className="quote-author">— {quote.author}</div>
      </div>

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

          <div className="setting-group">
            <h3>Background Type</h3>
            <div className="background-options">
              <button
                className={`background-option ${backgroundType === 'color' ? 'active' : ''}`}
                onClick={() => updateSettings({ backgroundType: 'color' })}
              >
                Solid Color
              </button>
              <button
                className={`background-option ${backgroundType === 'image' ? 'active' : ''}`}
                onClick={() => updateSettings({ backgroundType: 'image' })}
              >
                Image
              </button>
              <button
                className={`background-option ${backgroundType === 'gradient' ? 'active' : ''}`}
                onClick={() => updateSettings({ backgroundType: 'gradient' })}
              >
                Gradient
              </button>
              <button
                className={`background-option ${backgroundType === 'video' ? 'active' : ''}`}
                onClick={() => updateSettings({ backgroundType: 'video' })}
              >
                Video
              </button>
            </div>
          </div>

          {/* Background color picker (for solid color type) */}
          {backgroundType === 'color' && (
            <div className="setting-group">
              <h3>Background Color</h3>
              <input
                type="color"
                value={backgroundColor}
                onChange={handleColorChange}
              />
              <span className="color-value">{backgroundColor}</span>
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
        </div>
      )}
    </div>
  );
}

export default App;
