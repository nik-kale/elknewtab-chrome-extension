# Elk New Tab - Development Guide

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
elknewtab-chrome-extension/
├── src/
│   ├── components/          # React components
│   │   ├── ErrorBoundary.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── ConfirmDialog.tsx
│   │   └── UnsplashBrowser.tsx
│   ├── utils/              # Utility modules
│   │   ├── imageCompression.ts
│   │   ├── weatherAPI.ts
│   │   ├── unsplashAPI.ts
│   │   ├── notifications.ts
│   │   ├── searchEngines.ts
│   │   ├── settingsManager.ts
│   │   ├── keyboardShortcuts.ts
│   │   ├── faviconFetcher.ts
│   │   ├── validation.ts
│   │   ├── accessibility.ts
│   │   ├── performance.ts
│   │   └── analytics.ts
│   ├── styles/             # CSS styles
│   │   └── darkMode.css
│   ├── App.tsx             # Main application
│   ├── App.css            # Main styles
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── public/
│   ├── manifest.json      # Chrome extension manifest
│   ├── icons/            # Extension icons
│   └── popup.html        # Extension popup
├── dist/                 # Build output
└── tests/               # Test files

```

## 🛠️ Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Chrome Extension Manifest V3** - Extension API

## 🔧 Key Features

### Utility Modules

#### `imageCompression.ts`
Compresses images before storing to optimize Chrome storage usage.
```typescript
import { compressImage } from './utils/imageCompression';
const compressed = await compressImage(file, { maxWidth: 1920, quality: 0.85 });
```

#### `weatherAPI.ts`
Integrates with OpenWeatherMap for real weather data.
```typescript
import { getCachedWeatherData } from './utils/weatherAPI';
const weather = await getCachedWeatherData(apiKey);
```

#### `unsplashAPI.ts`
Browse and download images from Unsplash.
```typescript
import { searchImages } from './utils/unsplashAPI';
const images = await searchImages('landscape', 1, 12, apiKey);
```

#### `notifications.ts`
Toast notification system replacing alert().
```typescript
import { toast } from './utils/notifications';
toast.success('Settings saved!');
toast.error('Failed to load data');
```

#### `settingsManager.ts`
Import/export settings as JSON.
```typescript
import { exportSettings, importSettings } from './utils/settingsManager';
await exportSettings(); // Downloads JSON file
await importSettings(file); // Imports from file
```

#### `keyboardShortcuts.ts`
Manage keyboard shortcuts.
```typescript
import { registerDefaultShortcuts } from './utils/keyboardShortcuts';
registerDefaultShortcuts({
  toggleSettings: () => setIsSettingsOpen(prev => !prev),
  focusSearch: () => searchInput.current?.focus()
});
```

#### `validation.ts`
Input validation and sanitization.
```typescript
import { validateUrl, sanitizeHtml } from './utils/validation';
const safeUrl = validateUrl(userInput);
const safeText = sanitizeHtml(userInput);
```

#### `accessibility.ts`
Accessibility utilities.
```typescript
import { announceToScreenReader, trapFocus } from './utils/accessibility';
announceToScreenReader('Settings updated');
const cleanup = trapFocus(modalElement);
```

#### `performance.ts`
Performance optimization utilities.
```typescript
import { debounce, memoize } from './utils/performance';
const debouncedSearch = debounce(handleSearch, 300);
const memoizedCalc = memoize(expensiveCalculation);
```

#### `analytics.ts`
Privacy-focused local analytics.
```typescript
import { trackEvent, getUsageStats } from './utils/analytics';
await trackEvent('background_changed', { type: 'image' });
const stats = await getUsageStats();
```

## 🎨 Components

### `ErrorBoundary`
Catches React errors and shows fallback UI.
```tsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### `LoadingSpinner`
Shows loading state.
```tsx
<LoadingSpinner size="large" message="Loading..." />
```

### `ConfirmDialog`
Confirmation dialog for destructive actions.
```tsx
<ConfirmDialog
  title="Delete Background?"
  message="This cannot be undone"
  type="danger"
  onConfirm={handleDelete}
  onCancel={() => setShowDialog(false)}
/>
```

### `UnsplashBrowser`
Browse and select Unsplash images.
```tsx
<UnsplashBrowser
  onSelectImage={(url) => setBackgroundImage(url)}
  onClose={() => setShowBrowser(false)}
  apiKey={unsplashKey}
/>
```

## 🔌 Chrome Extension APIs Used

- **Storage API** - Sync and local storage
- **Tabs API** - Manage browser tabs
- **Host Permissions** - API access (Weather, Unsplash)

## 🧪 Testing

```bash
# Run tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

## 📦 Building for Production

```bash
# Build extension
npm run build

# Output will be in dist/ folder
# Load unpacked extension from dist/ in Chrome
```

## 🐛 Debugging

### Chrome DevTools
1. Open new tab
2. Right-click → Inspect
3. Check Console for logs

### Extension Debugging
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Inspect views: index.html"

## 🔒 Security

- All user input is validated and sanitized
- URLs are validated before opening
- XSS protection via sanitizeHtml
- CSP enforced in manifest
- No eval() or inline scripts

## ♿ Accessibility

- ARIA labels on interactive elements
- Keyboard navigation support
- Focus trap in modals
- Screen reader announcements
- Color contrast checking

## ⚡ Performance

- Image compression before storage
- Debounced search input
- Memoized expensive calculations
- Lazy loading for images
- Chunked array processing

## 🌙 Dark Mode

Dark mode is supported via CSS custom properties.
Toggle with `[data-theme="dark"]` attribute on `<html>`.

## 📝 Code Style

- **TypeScript strict mode** enabled
- **ESLint** for linting
- **2 spaces** for indentation
- **No unused variables** enforcement
- **camelCase** for variables and functions
- **PascalCase** for components and types

## 🚨 Common Issues

### Build Errors
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Storage Quota Exceeded
- Images are compressed to max 500KB
- Reduce number of backgrounds
- Use Unsplash integration instead

### API Key Not Working
- Check if key is valid
- Ensure host_permissions in manifest.json
- Check browser console for errors

## 📚 Resources

- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [OpenWeatherMap API](https://openweathermap.org/api)
- [Unsplash API](https://unsplash.com/developers)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 👤 Author

Nik Kale - [@dabbleintech](https://github.com/dabbleintech)

---

**Happy coding! 🎉**
