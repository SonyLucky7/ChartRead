# ChartRead

> **Advanced Multi-Window Desktop Charting Application**  
> Reconstructed from TradingView Desktop (v3.4.1) using the [Reverse Engineer Anything (REA)](https://github.com/morluto/rea.git) framework.

---

## 📌 Executive Summary

**ChartRead** is a complete, fully reconstructed TypeScript and Electron codebase derived from the TradingView Desktop application. Using REA's content-addressed artifact graph inspection, ASAR extraction, source-map symbol recovery, and Electron fuse inspection, the entire source tree—including all original TypeScript, React TSX, CSS modules, and SVG assets—has been extracted and reconstituted into a clean, modern, and editable repository.

---

## 🛠️ Reverse Engineering Workflow (REA)

1. **Artifact Ingestion & Container Analysis (`open_binary` / `inspect_artifact`)**:
   - Input binaries: `TradingView.msix` (Windows AppX/MSIX) and `TradingView.dmg` (macOS).
   - MSIX package SHA-256: `fb9ac708c7dd4e82e563a75f678b79ddba6baf6b92cda7552b375ddad50ef84e`.
   - Extracted primary runtime container: `resources/app.asar` (38.1 MB) and `app.asar.unpacked`.
2. **ASAR Extraction & Source Map Decompilation (`extract_artifact`)**:
   - De-indexed 268 files from `app.asar`.
   - Discovered 63 production source map files containing full embedded `sourcesContent`.
   - Reconstructed **930+ unique pristine source files** (315 TypeScript `.ts`, 140 React `.tsx`, 100 CSS stylesheets, 55 SVG assets, plus custom `@tradingview/` packages).
3. **Electron Fuse Audit (`inspect_electron_fuses`)**:
   - Runtime binary: `ChartRead.exe` (Electron 41.7.1, x86_64).
   - `RunAsNode`: **Enabled** (value `49`).
   - `EnableNodeCliInspectArguments`: **Enabled** (value `49`).
   - `OnlyLoadAppFromAsar`: **Disabled** (value `48` - allows loading directly from filesystem directories).
   - `EnableEmbeddedAsarIntegrityValidation`: **Disabled** (value `48` - allows custom edits and patches without signature rejection).

---

## 📂 Project Architecture

```
ChartRead/
├── src/                               # 100% Original TypeScript / TSX Source Tree
│   ├── index.ts                       # Main process entrypoint & lifecycle bootstrap
│   ├── index.css                      # Global styling
│   ├── app/                           # UI renderer application
│   │   ├── components-ui/             # Reusable UI controls (ThemePicker, Modals, Inputs, etc.)
│   │   ├── dialog-window/             # Dialog management & welcome views
│   │   ├── crash-view/                # Crash recovery views
│   │   ├── toast/                     # Notifications & toast overlay system
│   │   └── common/                    # UI hooks, hotkey hash, linking color palettes
│   ├── linking/                       # Multi-tab / multi-window symbol & interval synchronization
│   │   ├── groups-manager.ts          # Color-coded linking groups (Red, Blue, Green, etc.)
│   │   ├── linker.ts                  # Bidirectional sync engine
│   │   └── linkable.ts                # Tab & window sync interfaces
│   ├── main/                          # Main process core controllers
│   │   ├── tab-manager.ts             # Tab lifecycle, tab dragging, detaching, and attaching
│   │   ├── session-storage.ts         # Persistent workspace tab state
│   │   └── network/                   # Proxy credentials, network services
│   ├── services/                      # Application service singletons
│   │   ├── service-startup.ts         # Dependency injection & service registry
│   │   ├── window/                    # WindowService, TabbedWindow, BrowserView facade
│   │   ├── settings/                  # SettingsProvider, ThemeManager, tab title interfaces
│   │   ├── context-menu/              # Context menu integrations
│   │   ├── locale/                    # i18n & locale service (30+ locales)
│   │   ├── user/                      # Authentication handler, user claims, pro features
│   │   └── update/                    # Auto-update service & version checks
│   ├── tv-api/                        # ChartRead / TradingView IPC channels & protocol definitions
│   ├── ipc-remote/                    # Cross-process RPC proxy protocol (Main <-> Renderer)
│   ├── tvd-runtime/                   # Persistence proxies, compound objects, GUID, heap utils
│   ├── logger/                        # Structured logging with file & console sinks
│   ├── navigation/                    # Navigation handler, URL routing & security rules
│   ├── notification/                  # OS-level alerts & macOS/Windows notifications
│   ├── performance/                   # Telemetry & performance metrics
│   └── utils/                         # Hotkeys, datetime, math, OS interop, URI parsing
├── packages/                          # Extracted Internal Component Libraries
│   ├── ui-lib/                        # TradingView UI design system components
│   ├── core/                          # Platform primitives & core helpers
│   ├── hotkey-actions/                # Desktop keyboard shortcuts & keybinding maps
│   └── platform-features/             # Feature flags & platform capabilities
├── configs/                           # Application Configuration
│   ├── config.json                    # Hosts, endpoints, window defaults, timeouts
│   ├── nav-rules.json                 # Navigation security rules & permitted domains
│   └── nav-rules.schema.json          # Schema validator for navigation policies
├── preload/                           # Electron Preload Scripts
│   ├── platform-preload.js            # Platform bridge & contextBridge APIs
│   ├── menu-handler-preload.js        # Window menu bridge
│   ├── scrollbar-preload.js           # Custom scrollbar injection
│   └── target-tvd-host-preload.js     # ChartRead web interface bridge
├── resources/                         # Application Assets
│   ├── icons/                         # Application icons & window branding
│   ├── locales/                       # Translations across 30+ languages
│   ├── sounds/                        # Notification & alert sounds
│   └── licenses/                      # Open-source and third-party notices
├── runtime/                           # Standalone Portable Electron 41.7.1 Runtime
│   ├── ChartRead.exe                  # Primary portable executable
│   ├── resources/                     # Packaged runtime assets
│   └── *.dll / *.pak                  # Chromium & V8 rendering libraries
├── scripts/
│   └── reconstruct.js                 # Automated REA source map extractor & asset synchronizer
├── package.json                       # Project manifests & dependencies
├── tsconfig.json                      # TypeScript compilation configuration
└── run-chartread.bat                  # One-click portable launcher
```

---

## 🚀 Getting Started

### Option 1: One-Click Portable Launch
Run the pre-configured launcher:
```cmd
run-chartread.bat
```
This immediately starts the application using the local Electron runtime in `runtime/ChartRead.exe`.

### Option 2: Running via Node / Electron
Ensure [Node.js](https://nodejs.org) is installed, then run:
```bash
# Install dependencies
npm install

# Start ChartRead
npm start

# Or start in inspect/debug mode
npm run dev
```

### Option 3: TypeScript Verification
Check the reconstructed TypeScript source code:
```bash
npm run typecheck
```

---

## ⚙️ Key Configuration Options

Edit `configs/config.json` to customize behavior:
- **`urls.defaultHost`**: The base chart web application URL (default: `https://www.tradingview.com/`).
- **`windows.chartInitialWidth` / `chartInitialHeight`**: Default window dimensions (1152x864).
- **`windows.chartMinWidth` / `chartMinHeight`**: Minimum window constraints (500x350).
- **`logging.console` & `logging.file`**: Log levels and log file rotation parameters.
- **`persistence.autoSaveInterval`**: Session auto-save frequency (default: 300,000 ms = 5 min).

---

## 🔒 Security & Navigation Rules

The application enforces domain isolation through `configs/nav-rules.json`. External URLs and OAuth flows are routed according to predefined matching rules to prevent arbitrary web views from accessing internal Electron IPC channels.

---

## 📜 License & Provenance

- Reconstructed for the `ChartRead` project using [REA (Reverse Engineer Anything)](https://github.com/morluto/rea.git).
- Source artifacts: `TradingView.msix` / `TradingView.dmg` (v3.4.1).
- Proprietary assets remain the copyright of their respective owners.
