# Changelog

All notable changes to the Elk New Tab extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.0] - 2024-03-08

### Added
- UI element visibility toggles (search bar, weather, time, date, greeting, quick links, quote)
- Customizable quick links with ability to edit icons, names, and URLs
- Dynamic quote system with 50+ inspirational quotes
- Configurable quote rotation intervals (1 hour, 6 hours, 12 hours, 24 hours, 1 week)
- Add up to 8 custom quick links

### Changed
- Reorganized settings panel with new "General Settings" section
- Improved background-type persistence when cycling is enabled
- Enhanced responsive design for settings panel
- Improved scrolling experience with styled scrollbars
- Better visual hierarchy with clearer section headings
- Ensured all gradient presets are visible and accessible

### Fixed
- Fixed issue where background type wasn't preserved during cycling
- Removed duplicate settings sections across different background types
- Ensured background images always fit browser window with proper scaling
- Fixed settings panel scrolling and display on different screen sizes
- Improved settings organization to prevent confusion

## [1.4.0] - 2023-12-15

### Added
- Multiple image uploads (up to 5 images) with storage optimization
- Automatic background cycling when opening new tabs
- Background stats display showing image and video counts
- Enhanced UI for backgrounds management
- Image and video galleries with thumbnails of all uploads
- "X" delete buttons on thumbnails for easy removal of specific backgrounds

### Changed
- Improved settings panel layout without scrollbars
- Optimized storage usage for multiple backgrounds
- Updated "Open Settings" functionality in popup for better security
- Enhanced cycling mechanism with sequential and random modes

### Fixed
- Resolved Content Security Policy issues in popup
- Fixed video backgrounds not persisting across tabs
- Improved layout in settings panel to prevent overflow
- Enhanced button and control layouts for better user experience

## [1.1.0] - 2023-12-01

### Added
- Background cycling feature with custom intervals
- Video background support with various formats
- Multiple gradient directions for more customization
- Preset gradient options for quick selection
- Color pickers for precise gradient customization
- Drag and drop support for image and video uploads
- Random color and gradient generators
- Improved settings panel with better organization

### Changed
- Enhanced UI with smoother transitions
- Optimized storage for better performance
- Improved cross-browser compatibility
- Better handling of high-resolution backgrounds

### Fixed
- Fixed issue with settings not persisting across sessions
- Improved image sizing and positioning
- Fixed layout issues with various screen sizes

## [1.0.0] - 2023-11-15

### Initial Release
- Custom background support for images
- Gradient background with customizable colors
- Solid color background option
- Clock and date display
- Personalized greeting based on time of day
- Weather information display
- Quick search functionality
- Settings panel for customization