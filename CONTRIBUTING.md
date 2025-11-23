# Contributing to Elk New Tab

Thank you for your interest in contributing to Elk New Tab! We welcome contributions from the community and are grateful for your support.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Coding Guidelines](#coding-guidelines)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

## Code of Conduct

This project and everyone participating in it is expected to:
- Be respectful and inclusive
- Exercise empathy and kindness
- Give and gracefully accept constructive feedback
- Focus on what is best for the community

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the issue
- **Expected behavior** vs **actual behavior**
- **Screenshots** if applicable
- **Browser and OS information**
- **Extension version**

Use the bug report template when creating an issue.

### Suggesting Features

Feature suggestions are welcome! Before creating a feature request:

1. Check if the feature has already been suggested
2. Ensure it aligns with the project's goals
3. Provide a clear use case and rationale

Use the feature request template when creating an issue.

### Code Contributions

1. **Find an issue to work on** or create a new one
2. **Comment on the issue** to let others know you're working on it
3. **Fork the repository**
4. **Create a branch** with a descriptive name
5. **Make your changes**
6. **Test thoroughly**
7. **Submit a pull request**

## Development Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Chrome browser
- Git

### Setup Instructions

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/elknewtab-chrome-extension.git
   cd elknewtab-chrome-extension
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Load the extension in Chrome**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

5. **Make your changes**
   - The extension will hot-reload when you make changes
   - Test your changes thoroughly

## Coding Guidelines

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow existing code style and patterns
- Use meaningful variable and function names
- Add comments for complex logic
- Avoid `any` types when possible

### React Components

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper prop typing with TypeScript

### CSS

- Use semantic class names
- Follow existing styling patterns
- Ensure responsive design
- Test on different screen sizes

### File Organization

- Place components in appropriate directories
- Keep related files together
- Use clear, descriptive file names

## Commit Guidelines

### Commit Messages

Follow this format for commit messages:

```
<type>: <subject>

<body (optional)>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat: add dark mode toggle to settings panel

fix: resolve background cycling not working on startup

docs: update installation instructions in README
```

### Commit Best Practices

- Keep commits atomic (one logical change per commit)
- Write clear, descriptive commit messages
- Reference issue numbers when applicable (e.g., "fixes #123")

## Pull Request Process

### Before Submitting

- [ ] Test your changes thoroughly
- [ ] Ensure no console errors or warnings
- [ ] Update documentation if needed
- [ ] Follow the code style guidelines
- [ ] Run the build command successfully

### Submitting a Pull Request

1. **Push your changes** to your fork
2. **Create a pull request** from your branch to `main`
3. **Fill out the PR template** completely
4. **Link related issues** using keywords (fixes #123)
5. **Wait for review** and respond to feedback

### PR Review Process

- Maintainers will review your PR
- You may be asked to make changes
- Once approved, your PR will be merged
- Your contribution will be recognized in releases

## Testing

### Manual Testing Checklist

When making changes, test:

- [ ] Different background types (solid, gradient, image, video)
- [ ] Settings persistence across tabs
- [ ] Background cycling functionality
- [ ] All widgets (clock, weather, search, quotes)
- [ ] Responsive design on different screen sizes
- [ ] Settings panel functionality
- [ ] Extension popup

### Browser Testing

Test on:
- Chrome (latest version)
- Different operating systems if possible

## Style Guide

### Code Formatting

- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Add trailing commas in multiline objects/arrays

### Naming Conventions

- **Components**: PascalCase (e.g., `SettingsPanel`)
- **Functions**: camelCase (e.g., `handleBackgroundChange`)
- **Files**: kebab-case or PascalCase for components
- **CSS Classes**: kebab-case (e.g., `settings-panel`)

## Questions?

If you have questions:
- Check existing issues and discussions
- Create a new issue with the question label
- Be specific and provide context

## Recognition

Contributors will be:
- Listed in release notes
- Credited in the project
- Appreciated by the community!

---

Thank you for contributing to Elk New Tab! Your efforts help make this extension better for everyone.
