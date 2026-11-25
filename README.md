# ChartRead 📈
> **Advanced Desktop Financial Charting & Multi-Timeframe Technical Analysis Platform**

[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-blue.svg)](#)
[![Runtime](https://img.shields.io/badge/Runtime-Electron%2041-brightgreen.svg)](#)
[![Node](https://img.shields.io/badge/Node-%3E%3D18.0.0-orange.svg)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Sponsor](https://img.shields.io/badge/Sponsor-%E2%9D%A4-ea4aaa?logo=githubsponsors&logoColor=white)](https://github.com/sponsors/SonyLucky7)

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

## ⚡ Quick Start (1-Minute Easy Setup)

Only **Node.js (v18+)** is required—**no Python, no C++ build tools, no `.env`, and no database setup needed.**

### Prerequisites
* [Node.js (LTS)](https://nodejs.org/) (v18 or higher — includes `npm`)

---

### Option 1: 1-Click Launch on Windows (Easiest)
1. Click **Code → Download ZIP** (and extract it) **or** run:
   ```bash
   git clone https://github.com/SonyLucky7/ChartRead.git
   ```
2. Double-click **`run-chartread.bat`** inside the `ChartRead` folder.  
   *On first run, it automatically installs Electron and launches ChartRead.*

---

### Option 2: Terminal Setup (Windows, macOS & Linux)
```bash
git clone https://github.com/SonyLucky7/ChartRead.git
cd ChartRead
npm install
npm start
```

*On macOS / Linux, you can also run `./start.sh` for automatic first-time install + launch.*

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

## 🤝 Contributing & Support

Contributions, bug reports, and feature requests are welcome!
Feel free to open an issue or submit a Pull Request on [GitHub](https://github.com/SonyLucky7/ChartRead/issues).

### Support Development
ChartRead is 100% free, open-source, and ad-free. If it helps your trading or backtesting, you can support ongoing development directly:

[![Sponsor on GitHub](https://img.shields.io/badge/Sponsor%20on%20GitHub-SonyLucky7-ea4aaa?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/SonyLucky7)

* **GitHub Sponsors:** [https://github.com/sponsors/SonyLucky7](https://github.com/sponsors/SonyLucky7) *(0% platform fee)*
* **USDT (BNB Smart Chain / BEP-20):** `0x992de9de5b80e98272e64a6f4cc3a49f4ec80198`

<p align="left">
  <img src="resources/branding/sponsor-usdt-bep20-qr.png" alt="USDT BEP-20 QR Code" width="160" />
</p>

---

## 📄 License

This project is open-source and released under the **[MIT License](LICENSE)**.
