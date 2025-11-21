# E2E SEO Desktop Application

A cross-platform desktop application for comprehensive SEO analysis, built with Tauri, Rust, React, and TypeScript.

## Overview

The E2E SEO Desktop App provides a beautiful, user-friendly interface to run comprehensive SEO checks on any website. It performs 260+ checks across 27 categories and presents results in an intuitive, filterable interface.

## Features

- **Cross-Platform**: Runs on Windows, macOS, and Linux
- **Fast & Lightweight**: Built with Tauri and Rust for optimal performance
- **Modern UI**: React-based interface with real-time updates
- **Comprehensive Analysis**: Leverages the full power of the e2e-seo library
- **Preset Configurations**: Choose from Basic, Advanced, or Strict presets
- **Filterable Results**: View all checks, only passed, or only failed
- **Visual Progress**: Progress bars and statistics for quick insights

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **Tauri API** for desktop integration

### Backend
- **Rust** for native performance
- **Tauri 2.x** framework
- **Node.js** integration for running existing SEO checks

## Prerequisites

Before running the desktop app, ensure you have:

1. **Node.js** (v14 or higher)
2. **Rust** (latest stable version)
3. **System Dependencies** for Tauri:
   - **Linux**: `sudo apt install libwebkit2gtk-4.0-dev build-essential curl wget libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev`
   - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
   - **Windows**: Microsoft C++ Build Tools

## Installation

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository-url>
   cd e2e-seo
   ```

2. **Install dependencies**:
   ```bash
   # Install root dependencies (includes Tauri CLI)
   npm install

   # Install desktop app frontend dependencies
   npm run desktop:deps
   ```

3. **Build the SEO checker library**:
   ```bash
   npm run build
   ```

## Development

To run the desktop app in development mode:

```bash
npm run desktop:dev
```

This will:
1. Build the TypeScript SEO checker library
2. Start the Vite dev server for the React frontend
3. Launch the Tauri development window

The app will automatically reload when you make changes to the frontend code.

### Development Structure

```
e2e-seo/
├── desktop-app/          # React frontend application
│   ├── src/
│   │   ├── App.tsx      # Main application component
│   │   ├── App.css      # Styling
│   │   └── main.tsx     # Entry point
│   ├── dist/            # Built frontend (generated)
│   └── package.json     # Frontend dependencies
│
├── src-tauri/           # Rust backend
│   ├── src/
│   │   ├── lib.rs       # Main Tauri application logic
│   │   └── main.rs      # Entry point
│   ├── Cargo.toml       # Rust dependencies
│   └── tauri.conf.json  # Tauri configuration
│
├── src/                 # SEO checker library (TypeScript)
└── dist/                # Built library (generated)
```

## Building for Production

To create a production build:

```bash
npm run desktop:build
```

This will:
1. Build the TypeScript library
2. Build the React frontend for production
3. Compile the Rust backend
4. Create platform-specific installers in `src-tauri/target/release/bundle/`

### Build Outputs

Depending on your platform, you'll find:

- **Windows**: `.exe` installer and `.msi` in `bundle/msi/`
- **macOS**: `.app` bundle and `.dmg` in `bundle/dmg/`
- **Linux**: `.deb` and `.AppImage` in `bundle/deb/` and `bundle/appimage/`

## Usage

### Running SEO Checks

1. **Enter a URL**: Type or paste a website URL into the input field
2. **Select Preset**: Choose from:
   - **Basic**: Essential SEO checks (faster)
   - **Advanced**: Comprehensive analysis (recommended)
   - **Strict**: All checks with strict rules (thorough)
3. **Click "Check SEO"**: Start the analysis
4. **View Results**: Results are displayed with:
   - Summary statistics (total, passed, failed, pass rate)
   - Progress bar visualization
   - Filterable list of all checks

### Filtering Results

Use the tabs to filter the results:
- **All**: Show all checks performed
- **Passed**: Show only successful checks
- **Failed**: Show only failed checks (requires attention)

### Understanding Results

Each check shows:
- **Status Icon**: ✓ for passed, ✗ for failed
- **Category**: The SEO category (e.g., Meta Tags, Performance)
- **Message**: Detailed description of what was checked

## Architecture

### How It Works

1. **Frontend (React)**:
   - User enters URL and selects configuration
   - Calls Tauri command `run_seo_check` via IPC
   - Displays results in a responsive, interactive UI

2. **Backend (Rust)**:
   - Receives command from frontend
   - Executes Node.js CLI with `--json` flag
   - Parses JSON output
   - Returns structured data to frontend

3. **SEO Checker (Node.js/TypeScript)**:
   - Runs Playwright-based analysis
   - Performs 260+ checks across 27 categories
   - Outputs JSON report

### Tauri Commands

The app exposes these commands:

#### `run_seo_check(url: String, config: Option<String>)`
Runs a comprehensive SEO check on the provided URL.

**Parameters**:
- `url`: Website URL to analyze
- `config`: Optional configuration preset (basic, advanced, strict)

**Returns**: `SeoCheckResult` with success status, data, or error

#### `get_available_presets()`
Returns list of available configuration presets.

**Returns**: `Vec<String>` with preset names

## Configuration

### Tauri Configuration

Edit `src-tauri/tauri.conf.json` to customize:
- Window size and behavior
- App name and identifier
- Build options
- Security policies

### Frontend Configuration

Edit `desktop-app/vite.config.ts` for:
- Build optimizations
- Plugin configuration
- Development server settings

## Troubleshooting

### Desktop app won't start

1. **Check Rust installation**: `rustc --version`
2. **Check Node.js installation**: `node --version`
3. **Rebuild the project**: `npm run build && npm run desktop:dev`

### SEO checks fail

1. **Ensure TypeScript is built**: `npm run build`
2. **Check Node.js can execute**: `node dist/cli.js --help`
3. **Verify Playwright is installed**: `npx playwright install chromium`

### Build errors

1. **Clean and rebuild**:
   ```bash
   npm run clean
   rm -rf desktop-app/dist
   npm run build
   npm run desktop:build
   ```

2. **Update dependencies**:
   ```bash
   npm update
   cd desktop-app && npm update && cd ..
   ```

## Performance

- **Startup Time**: < 2 seconds
- **SEO Check Time**: 10-60 seconds (depending on website and preset)
- **Memory Usage**: ~150-300 MB (including Chromium)
- **App Size**:
  - Windows: ~15-20 MB (installer)
  - macOS: ~10-15 MB (.dmg)
  - Linux: ~10-15 MB (.deb)

## Security

The desktop app:
- Runs in a sandboxed environment
- Only executes the Node.js SEO checker CLI
- Does not store or transmit user data
- Opens external URLs with system default browser

## Contributing

To contribute to the desktop app:

1. Fork the repository
2. Create a feature branch
3. Make your changes in `desktop-app/` or `src-tauri/`
4. Test thoroughly
5. Submit a pull request

## Roadmap

Future enhancements planned:
- [ ] Report export (PDF, HTML, CSV)
- [ ] Historical comparison
- [ ] Batch URL checking
- [ ] Custom configuration UI
- [ ] Scheduled checks
- [ ] Auto-update functionality

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Check existing documentation
- Review the main e2e-seo README

## Additional Resources

- [Tauri Documentation](https://tauri.app/v2/guides/)
- [React Documentation](https://react.dev/)
- [Rust Documentation](https://www.rust-lang.org/learn)
- [Main e2e-seo Documentation](./README.md)
