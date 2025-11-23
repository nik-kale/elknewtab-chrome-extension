# Elk New Tab - Chrome Extension

<div align="center">

![Elk New Tab Logo](public/icons/icon128.png)

[![Version](https://img.shields.io/badge/version-1.5.0-blue.svg)](https://github.com/dabbleintech/elknewtab-chrome-extension/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Chrome](https://img.shields.io/badge/Chrome-Extension-orange.svg)](https://chrome.google.com/webstore)
[![Made with React](https://img.shields.io/badge/Made%20with-React-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)](https://www.typescriptlang.org/)

**Transform your browser's new tab page into a beautiful, customizable experience.**

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [Development](#development) • [Contributing](#contributing)

</div>

---

## Overview

Elk New Tab transforms your browser's new tab page into a beautiful, customizable experience. Whether you prefer stunning gradients, solid colors, personal photos, or videos, Elk New Tab gives you complete control over your browsing environment.

## Screenshots

<div align="center">

> **Note:** Add your screenshots here to showcase Elk New Tab's beautiful customization options!

<!-- Example structure:
![Gradient Background](screenshots/gradient-example.png)
![Custom Image Background](screenshots/image-example.png)
![Settings Panel](screenshots/settings-panel.png)
-->

</div>

## Features

### 🎨 Stunning Backgrounds
- **Gradient Backgrounds**: Choose from preset gradients or create your own multi-color masterpieces
- **Custom Images**: Upload your favorite photos as your new tab background
- **Videos**: Use videos as dynamic, moving backgrounds
- **Solid Colors**: Keep it simple with your favorite color
- **Random Mode**: Let Elk surprise you with beautiful colors every time you open a new tab

### ⚡ Productivity Tools
- **Clock and Date**: Keep track of time with a beautiful, prominent clock
- **Quick Search**: Instantly search the web without navigating to a search engine
- **Personalized Greeting**: Enjoy a friendly greeting that changes based on the time of day
- **Weather Information**: See current weather conditions at a glance
- **Quick Links**: Add up to 8 customizable quick links with custom icons
- **Inspirational Quotes**: Dynamic quote system with 50+ quotes and configurable rotation

### 🎛️ Deep Customization
- **Background Cycling**: Automatically rotate through your saved backgrounds
- **Multiple Gradient Options**: Customize gradient direction and color combinations
- **Preset Designs**: Choose from carefully crafted gradient presets

## Installation

### From Chrome Web Store

1. Visit the [Chrome Web Store page](#) for Elk New Tab (coming soon)
2. Click "Add to Chrome"
3. Open a new tab to experience your customizable new tab page

### Manual Installation (for Development)

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run build` to build the extension
4. Open Chrome and navigate to `chrome://extensions/`
5. Enable "Developer mode"
6. Click "Load unpacked" and select the `dist` folder

## Usage

### Customizing Your Background

1. Open a new tab in Chrome
2. Click the settings icon (⚙️) in the top right corner
3. Choose your preferred background type:
   - Solid Color: Pick a color from the color picker
   - Gradient: Create a gradient by selecting colors and direction
   - Image: Upload your own image
   - Video: Upload a short video clip

### Gradient Customization

1. Select "Gradient" from the background options
2. Add or remove colors to your gradient
3. Choose a direction for your gradient
4. Select from preset gradients for quick styling

### Background Cycling

1. Add multiple backgrounds to your collection
2. Enable background cycling
3. Set the interval for rotation
4. Choose between sequential or random cycling

## Development

### Tech Stack

- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Chrome Extension**: Manifest V3
- **Styling**: CSS with custom properties
- **State Management**: Chrome Storage API

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Chrome browser

### Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/dabbleintech/elknewtab-chrome-extension.git
   cd elknewtab-chrome-extension
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

5. **Load the extension in Chrome**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

### Project Structure

```
elknewtab-chrome-extension/
├── public/
│   ├── icons/           # Extension icons
│   ├── manifest.json    # Chrome extension manifest
│   └── popup.html       # Extension popup
├── src/                 # React source code
├── CHANGELOG.md         # Version history
├── PRIVACY.md          # Privacy policy
└── package.json        # Dependencies and scripts
```

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build extension for production
- `npm run preview` - Preview production build

## Privacy

Elk New Tab respects your privacy:
- All your settings and backgrounds are stored locally in your browser
- No data is sent to external servers
- No tracking or analytics
- No ads


## Contributing

Contributions are welcome! We love your input and want to make contributing as easy as possible.

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Test thoroughly**
5. **Commit your changes** (`git commit -m 'Add some amazing feature'`)
6. **Push to the branch** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

### Reporting Bugs

Found a bug? Please open an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

### Feature Requests

Have an idea? We'd love to hear it! Open an issue with the `enhancement` label.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes and releases.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📧 Report issues on [GitHub Issues](https://github.com/dabbleintech/elknewtab-chrome-extension/issues)
- 📖 Read the [Privacy Policy](PRIVACY.md)
- ⭐ Star this repo if you find it helpful!

## Author

Created with care by [Nik Kale](https://github.com/dabbleintech)

---

<div align="center">

**Elk New Tab** - Your new tab page, reimagined.

Made with ❤️ using React and TypeScript

</div>
