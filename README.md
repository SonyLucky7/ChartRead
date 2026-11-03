# ChartRead 📈
> **Advanced Desktop Financial Charting & Multi-Timeframe Technical Analysis Platform**

[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-blue.svg)](#)
[![Runtime](https://img.shields.io/badge/Runtime-Electron%2041-brightgreen.svg)](#)
[![Node](https://img.shields.io/badge/Node-%3E%3D18.0.0-orange.svg)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**ChartRead** is a high-performance desktop market analysis workstation built with **Electron, Node.js, and Chromium**. It provides an institutional-grade charting experience featuring real-time market data across global exchanges, unlimited technical indicators, multi-chart tiling, and an engineered **universal client-side Bar Replay backtesting engine** that seamlessly operates across **all timeframes** without subscription paywalls.

---

## ✨ Features at a Glance

* 📊 **Universal Multi-Timeframe Bar Replay:**  
  Practice backtesting with precision historical bar scrubbing across:
  * **Seconds:** `1S`, `5S`, `10S`, `15S`, `30S`
  * **Minutes:** `1m`, `2m`, `3m`, `5m`, `10m`, `15m`, `30m`, `45m`
  * **Hours:** `1h`, `2h`, `3h`, `4h`
  * **Daily / Weekly / Monthly:** `1D`, `1W`, `1M`
  * Instant switching between timeframes during active replay with automatic historical timestamp anchoring (`clampBarsToCutoff`).
* ⚡ **Real-Time Market Data Feeds:**  
  High-frequency streaming for Crypto, Forex, US Equities, Commodities, and Global Indices.
* 🛠️ **Unlimited Technical Analysis & Studies:**  
  Apply unlimited indicators (RSI, MACD, Bollinger Bands, Moving Averages, Volume, SuperTrend) with full dynamic recalculation during replay.
* 🪟 **Multi-Chart Tiled Workspaces:**  
  Split your desktop into multiple synchronized charts with customizable linking by symbol, interval, or crosshair.
* 💾 **Dual Storage Engine (Offline-First + Cloud Sync):**  
  * **Local Offline Storage (Default):** Zero configuration needed; saves all layouts, drawings, and indicators directly to local disk.
  * **OpenSearch Cloud Storage (Optional):** Plug in any OpenSearch or Elasticsearch cluster for multi-device sync via `.env`.
* 🎨 **Clean, Native Desktop UI:**  
  Cohesive dark neon-accented UI, custom frameless window styling, and taskbar integration.

---

## ⚡ Quick Start (Easy Setup)

Get ChartRead running in **under 2 minutes**:

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* [npm](https://www.npmjs.com/) (bundled with Node.js)
* Git

### Step 1: Clone the Repository
```bash
git clone https://github.com/SonyLucky7/ChartRead.git
cd ChartRead
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Launch ChartRead
```bash
npm start
```

*On Windows, you can also double-click `run-chartread.bat` or execute `npm run run:portable`.*

---

## 🏗️ Architecture & How It Works

ChartRead leverages Electron's multi-process model to deliver native performance:

```
+-------------------------------------------------------------------+
|                        ChartRead Main Process                     |
|        - Window Management & Native OS Framing (Windows API)      |
|        - IPC Handlers & Local / Cloud Storage Bridge              |
+---------------------------------+---------------------------------+
                                  |
               Preload Injection (platform-preload.js)
                                  |
+---------------------------------v---------------------------------+
|                      Chromium Renderer Process                    |
|        - WebGL & HTML5 Canvas 2D Hardware-Accelerated Charts      |
|        - Webpack Runtime Interception & Prototype Metaprogramming  |
|        - Bar Replay Simulation Engine v2 (Historical Clamping)    |
|        - Live WebSocket Real-Time Ticker Ingestion                |
+-------------------------------------------------------------------+
```

### Key Technical Innovations
1. **Timestamp Clamping (`clampBarsToCutoff`):**  
   Overcomes the limitation where switching resolutions resets the chart. When resolution changes, the preload catches the incoming candle buffer, computes the exact cutoff bar, clamps the buffer range, aligns the `timeScale` base index, and repaints studies in a single frame.
2. **Prototype Hooking:**  
   Patches `Series.prototype`, `Bars.prototype`, and `ReplayUIController.prototype` dynamically during module initialization, suppressing commercial paywall prompts and enabling all resolutions.

---

## ⚙️ Configuration (Optional Cloud Sync)

By default, ChartRead works **100% offline out of the box**—no databases, credentials, or cloud setup required!

If you want to sync your layouts and drawings to an **OpenSearch / Elasticsearch** cluster:
1. Copy the example configuration:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in your connection details:
   ```env
   OPENSEARCH_HOST=your-cluster-url.com
   OPENSEARCH_PORT=12445
   OPENSEARCH_USER=your_username
   OPENSEARCH_PASS=your_password
   OPENSEARCH_PROTOCOL=https
   ```

---

## 📜 Available NPM Scripts

| Command | Description |
|---|---|
| `npm start` | Launches ChartRead in normal desktop mode |
| `npm run dev` | Launches ChartRead with Chrome DevTools Inspector on port `5858` |
| `npm run test:replay` | Runs the automated Bar Replay multi-timeframe test suite via CDP |
| `npm run patch:replay` | Recompiles and verifies the Bar Replay v2 engine patches |

---

## 🤝 Contributing

Contributions, bug reports, and feature requests are welcome!
Feel free to open an issue or submit a Pull Request on [GitHub](https://github.com/SonyLucky7/ChartRead/issues).

---

## 📄 License

This project is open-source and released under the **[MIT License](LICENSE)**.
