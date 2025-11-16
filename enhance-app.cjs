const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Replace hardcoded weather state with real weather data
content = content.replace(
  "const [weather] = useState({ temp: '72°', location: 'San Francisco, CA' })",
  "const [weather, setWeather] = useState<WeatherData | null>(null)"
);

// 2. Add new state variables after weather state
const newStates = `
  const [weatherApiKey, setWeatherApiKey] = useState<string>('')
  const [unsplashApiKey, setUnsplashApiKey] = useState<string>('')
  const [searchEngine, setSearchEngine] = useState<string>('google')
  const [showUnsplashBrowser, setShowUnsplashBrowser] = useState<boolean>(false)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [confirmDialog, setConfirmDialog] = useState<{show: boolean, title: string, message: string, onConfirm: () => void, type?: 'danger' | 'warning' | 'info'} | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
`;

content = content.replace(
  "const [weather, setWeather] = useState<WeatherData | null>(null)",
  "const [weather, setWeather] = useState<WeatherData | null>(null)" + newStates
);

// 3. Replace all alert() calls with toast
content = content.replace(/alert\(`(.+?)`\)/g, "toast.error('$1')");
content = content.replace(/alert\('(.+?)'\)/g, "toast.error('$1')");
content = content.replace(/alert\("(.+?)"\)/g, "toast.error('$1')");

// 4. Add weather loading useEffect before the last useEffect
const weatherEffect = `
  // Load weather data
  useEffect(() => {
    const loadWeather = async () => {
      const weatherData = await getCachedWeatherData(weatherApiKey || undefined);
      if (weatherData) {
        setWeather(weatherData);
      }
    };

    loadWeather();
    // Refresh weather every 30 minutes
    const interval = setInterval(loadWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [weatherApiKey]);

  // Register keyboard shortcuts
  useEffect(() => {
    registerDefaultShortcuts({
      toggleSettings: () => setIsSettingsOpen(prev => !prev),
      focusSearch: () => searchInputRef.current?.focus(),
      nextQuote: () => {
        const nextIndex = (currentQuoteIndex + 1) % quotes.length;
        setCurrentQuoteIndex(nextIndex);
        updateSettings({ currentQuoteIndex: nextIndex });
      },
      randomBackground: () => {
        updateSettings({ backgroundType: 'random' });
      },
      openQuickLink: (index) => {
        if (quickLinks[index]) {
          window.location.href = quickLinks[index].url;
        }
      }
    });

    return () => cleanupShortcuts();
  }, [currentQuoteIndex, quotes, quickLinks]);
`;

// Insert before the quote rotation effect (around line 1673)
content = content.replace(
  '  // Add an effect for quote rotation\n  useEffect(() => {',
  weatherEffect + '\n  // Add an effect for quote rotation\n  useEffect(() => {'
);

// 5. Update handleSearch to use search engine
content = content.replace(
  /const handleSearch = \(e: React\.FormEvent<HTMLFormElement>\) => \{[\s\S]*?window\.location\.href = `https:\/\/www\.google\.com\/search\?q=\${encodeURIComponent\(searchValue\)}`[\s\S]*?\}/,
  `const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const searchValue = (e.currentTarget.elements.namedItem('search') as HTMLInputElement).value;
    if (searchValue.trim()) {
      performSearch(searchValue, searchEngine);
    }
  }`
);

// 6. Update search input to use ref
content = content.replace(
  '<input\n            type="text"\n            name="search"\n            className="search-input"\n            placeholder="Search the web..."',
  '<input\n            ref={searchInputRef}\n            type="text"\n            name="search"\n            className="search-input"\n            placeholder={getSearchEngine(searchEngine).placeholder}'
);

// 7. Update weather widget to use real data
content = content.replace(
  /<div className="weather-widget">[\s\S]*?<div className="weather-icon">☀️<\/div>[\s\S]*?<div className="weather-temp">\{weather\.temp\}<\/div>[\s\S]*?<div className="weather-location">\{weather\.location\}<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>/,
  `<div className="weather-widget">
          <div className="weather-icon">{weather?.icon || '☀️'}</div>
          <div className="weather-info">
            <div className="weather-temp">{weather?.temp || '--°'}</div>
            <div className="weather-location">{weather?.location || 'Loading...'}</div>
          </div>
        </div>`
);

// 8. Add import/export buttons to settings panel (before closing div of popup container)
const importExportUI = `
        {/* Import/Export Settings */}
        <div className="setting-group">
          <h3>Data Management</h3>
          <div className="setting-row">
            <button
              onClick={async () => {
                try {
                  await exportSettings();
                  toast.success('Settings exported successfully!');
                } catch (error) {
                  toast.error('Failed to export settings');
                }
              }}
              className="export-button"
              style={{
                padding: '10px 20px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              📥 Export Settings
            </button>
            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    try {
                      await importSettings(file);
                      toast.success('Settings imported! Reloading...');
                      setTimeout(() => window.location.reload(), 1000);
                    } catch (error) {
                      toast.error('Failed to import settings');
                    }
                  }
                };
                input.click();
              }}
              className="import-button"
              style={{
                padding: '10px 20px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              📤 Import Settings
            </button>
            <button
              onClick={() => {
                setConfirmDialog({
                  show: true,
                  title: 'Reset All Settings?',
                  message: 'This will delete all your settings and backgrounds. This action cannot be undone.',
                  type: 'danger',
                  onConfirm: async () => {
                    try {
                      await resetSettings();
                      toast.success('Settings reset! Reloading...');
                      setTimeout(() => window.location.reload(), 1000);
                    } catch (error) {
                      toast.error('Failed to reset settings');
                    }
                    setConfirmDialog(null);
                  }
                });
              }}
              className="reset-button"
              style={{
                padding: '10px 20px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              🔄 Reset All
            </button>
          </div>
        </div>

        {/* API Keys Settings */}
        <div className="setting-group">
          <h3>API Configuration</h3>
          <div className="setting-row">
            <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
              Weather API Key (OpenWeatherMap):
              <input
                type="text"
                value={weatherApiKey}
                onChange={(e) => {
                  setWeatherApiKey(e.target.value);
                  updateSettings({ weatherApiKey: e.target.value });
                }}
                placeholder="Enter API key for live weather"
                style={{
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  color: 'white'
                }}
              />
            </label>
          </div>
          <div className="setting-row">
            <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
              Unsplash API Key:
              <input
                type="text"
                value={unsplashApiKey}
                onChange={(e) => {
                  setUnsplashApiKey(e.target.value);
                  updateSettings({ unsplashApiKey: e.target.value });
                }}
                placeholder="Enter API key for Unsplash"
                style={{
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  color: 'white'
                }}
              />
            </label>
          </div>
        </div>

        {/* Search Engine Selection */}
        <div className="setting-group">
          <h3>Search Engine</h3>
          <div className="setting-row">
            <select
              value={searchEngine}
              onChange={(e) => {
                setSearchEngine(e.target.value);
                updateSettings({ searchEngine: e.target.value });
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                width: '100%'
              }}
            >
              {SEARCH_ENGINES.map(engine => (
                <option key={engine.id} value={engine.id} style={{ backgroundColor: '#1a1a1a' }}>
                  {engine.icon} {engine.name}
                </option>
              ))}
            </select>
          </div>
        </div>
`;

// Add before the closing </div> of popup container (before Quote Settings)
content = content.replace(
  '          {/* Quote Settings */}',
  importExportUI + '          {/* Quote Settings */}'
);

// 9. Add Unsplash browser button in image upload section
const unsplashButton = `
            <button
              className="upload-button"
              onClick={() => setShowUnsplashBrowser(true)}
              style={{ marginTop: '10px', backgroundColor: 'rgba(33, 150, 243, 0.2)', border: '1px solid rgba(33, 150, 243, 0.5)' }}
            >
              🖼️ Browse Unsplash
            </button>`;

content = content.replace(
  '<button\n              className="upload-button"\n              onClick={() => document.getElementById(\'backgroundUploader\')?.click()}\n            >\n              Upload Images\n            </button>',
  `<button
              className="upload-button"
              onClick={() => document.getElementById('backgroundUploader')?.click()}
            >
              Upload Images
            </button>${unsplashButton}`
);

// 10. Add Unsplash browser and confirm dialog components before closing return
const dialogsJSX = `
      {/* Unsplash Browser */}
      {showUnsplashBrowser && (
        <UnsplashBrowser
          onSelectImage={(imageUrl) => {
            updateSettings({
              backgroundImage: imageUrl,
              backgroundType: 'image',
              backgrounds: [...backgrounds, {
                id: Date.now().toString(),
                url: imageUrl,
                type: 'image'
              }]
            });
            setShowUnsplashBrowser(false);
          }}
          onClose={() => setShowUnsplashBrowser(false)}
          apiKey={unsplashApiKey}
        />
      )}

      {/* Confirm Dialog */}
      {confirmDialog?.show && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          type={confirmDialog.type}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
`;

content = content.replace(
  '    </div>\n  );\n}\n\nexport default App;',
  `    </div>${dialogsJSX}\n  );\n}\n\nexport default App;`
);

// 11. Load API keys from storage
content = content.replace(
  "if (result.quoteChangeInterval) setQuoteChangeInterval(result.quoteChangeInterval);",
  `if (result.quoteChangeInterval) setQuoteChangeInterval(result.quoteChangeInterval);
      if (result.weatherApiKey) setWeatherApiKey(result.weatherApiKey);
      if (result.unsplashApiKey) setUnsplashApiKey(result.unsplashApiKey);
      if (result.searchEngine) setSearchEngine(result.searchEngine);`
);

// 12. Add API keys to STORAGE_KEYS
content = content.replace(
  "QUOTE_CHANGE_INTERVAL: 'quoteChangeInterval'",
  "QUOTE_CHANGE_INTERVAL: 'quoteChangeInterval',\n    WEATHER_API_KEY: 'weatherApiKey',\n    UNSPLASH_API_KEY: 'unsplashApiKey',\n    SEARCH_ENGINE: 'searchEngine'"
);

// 13. Add API keys to updateSettings cases
content = content.replace(
  "case STORAGE_KEYS.QUOTE_CHANGE_INTERVAL:\n          setQuoteChangeInterval(value);\n          nonMediaSettings[key] = value;\n          break;",
  `case STORAGE_KEYS.QUOTE_CHANGE_INTERVAL:
          setQuoteChangeInterval(value);
          nonMediaSettings[key] = value;
          break;
        case STORAGE_KEYS.WEATHER_API_KEY:
          setWeatherApiKey(value);
          nonMediaSettings[key] = value;
          break;
        case STORAGE_KEYS.UNSPLASH_API_KEY:
          setUnsplashApiKey(value);
          nonMediaSettings[key] = value;
          break;
        case STORAGE_KEYS.SEARCH_ENGINE:
          setSearchEngine(value);
          nonMediaSettings[key] = value;
          break;`
);

// Write the enhanced file
fs.writeFileSync('src/App.tsx', content);

console.log('✅ App.tsx enhanced successfully!');
console.log('Added:');
console.log('- Weather API integration');
console.log('- Unsplash browser');
console.log('- Toast notifications');
console.log('- Search engine selector');
console.log('- Import/Export settings');
console.log('- Keyboard shortcuts');
console.log('- Confirm dialogs');
console.log('- API key configuration');
