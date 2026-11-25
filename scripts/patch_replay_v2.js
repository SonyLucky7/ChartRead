const fs = require('fs');
const path = require('path');

// ============================================================================
// ChartRead Platform Preload Builder v6
// - Zero hardcoded Webpack module IDs (100% resilient to TradingView updates)
// - Zero 404 chunk errors, zero 403 auth/settings/alerts noise
// - Complete Black Friday / Cyber Monday / Offers / Banners / Copilot Hint block
// - Single-execution guard & rAF-throttled MutationObserver (low CPU & memory)
// - Full Bar Replay Engine v2 with multi-timeframe timestamp anchoring
// - Complete ChartRead branding with full valid PNG assets & single watermark
// ============================================================================

const ROOT = path.resolve(__dirname, '..');

function loadDataUri(relPath, mime = 'image/png') {
  const fullPath = path.join(ROOT, relPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error('Missing asset: ' + fullPath);
  }
  const raw = relPath.endsWith('.txt')
    ? fs.readFileSync(fullPath, 'utf8').trim()
    : fs.readFileSync(fullPath).toString('base64');
  return raw.startsWith('data:') ? raw : `data:${mime};base64,${raw}`;
}

const DEV_CONFIG = {
  name: 'SonyLucky7',
  role: 'Creator & Independent Developer',
  githubProfile: 'https://github.com/SonyLucky7',
  githubRepo: 'https://github.com/SonyLucky7/ChartRead',
  githubSponsors: 'https://github.com/sponsors/SonyLucky7',
  usdtNetwork: 'BNB Smart Chain (BEP-20)',
  usdtAddress: '0x992de9de5b80e98272e64a6f4cc3a49f4ec80198'
};

const crLogoDataUri = loadDataUri('resources/branding/ChartRead-Logo-192.png');
const sponsorQrDataUri = loadDataUri('resources/branding/sponsor-usdt-bep20-qr.png');
const darkWatermarkDataUri = loadDataUri('resources/watermarks/dark-base64.txt');
const lightWatermarkDataUri = loadDataUri('resources/watermarks/light-base64.txt');

const injectorCode = `
// ==========================================
// ChartRead Desktop Platform Preload Injector v6 (Optimized & Dynamic)
// ==========================================
;(function() {
  if (window.__cr_preload_v6_installed) return;
  window.__cr_preload_v6_installed = true;

  try {
    const electron = require("electron");
    const CR_LOGO_URI = ${JSON.stringify(crLogoDataUri)};
    const SPONSOR_QR_URI = ${JSON.stringify(sponsorQrDataUri)};
    const DARK_WATERMARK_URI = ${JSON.stringify(darkWatermarkDataUri)};
    const LIGHT_WATERMARK_URI = ${JSON.stringify(lightWatermarkDataUri)};
    const DEV_CONFIG = ${JSON.stringify(DEV_CONFIG)};

    // ======================================================================
    // 0. Custom ChartRead Home / Developer & Sponsor Page (Replaces TV Home)
    // ======================================================================
    const isHomeRoute = /^\\/(home\\/?)?$/.test(location.pathname || "");
    if (isHomeRoute) {
      // 0ms veil so ZERO TradingView homepage pixels ever flash
      if (electron?.webFrame?.insertCSS) {
        electron.webFrame.insertCSS(\`
          html, body {
            background: #0B0E14 !important;
            color: #F3F6FA !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            min-height: 100vh !important;
            overflow-x: hidden !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Ubuntu, sans-serif !important;
          }
          body > *:not(#chartread-home-root) {
            display: none !important;
            visibility: hidden !important;
            pointer-events: none !important;
          }
        \`);
      }

      const mountChartReadHome = () => {
        try { window.stop(); } catch (e) {}
        try {
          document.title = "ChartRead — Built by " + DEV_CONFIG.name;
          // Strip third-party stylesheets and scripts cleanly
          document.querySelectorAll('link[rel="stylesheet"], style:not(#chartread-home-style), script').forEach((n) => n.remove());
          if (!document.getElementById("chartread-home-style")) {
            const st = document.createElement("style");
            st.id = "chartread-home-style";
            st.textContent = \`
              * { box-sizing: border-box; }
              html, body {
                margin: 0;
                padding: 0;
                background: #0B0E14;
                color: #F3F6FA;
                min-height: 100vh;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Ubuntu, sans-serif;
                -webkit-font-smoothing: antialiased;
              }
              #chartread-home-root {
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                background:
                  radial-gradient(900px 420px at 14% -8%, rgba(0, 255, 56, 0.08), transparent 60%),
                  linear-gradient(180deg, #0B0E14 0%, #090C11 100%);
              }
              .cr-topbar {
                height: 64px;
                padding: 0 36px;
                border-bottom: 1px solid #1B2230;
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: rgba(11, 14, 20, 0.9);
              }
              .cr-brand {
                display: flex;
                align-items: center;
                gap: 12px;
              }
              .cr-brand img {
                width: 34px;
                height: 34px;
                border-radius: 8px;
                border: 1px solid rgba(0, 255, 56, 0.25);
              }
              .cr-wordmark {
                font-size: 20px;
                font-weight: 800;
                letter-spacing: -0.4px;
                color: #FFFFFF;
              }
              .cr-wordmark span { color: #00FF38; }
              .cr-ver {
                font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
                font-size: 11px;
                color: #8E9BB0;
                padding: 3px 8px;
                border: 1px solid #222B3C;
                border-radius: 999px;
                background: #111622;
              }
              .cr-top-actions {
                display: flex;
                align-items: center;
                gap: 10px;
              }
              .cr-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                padding: 10px 18px;
                border-radius: 8px;
                font-size: 13.5px;
                font-weight: 600;
                text-decoration: none;
                cursor: pointer;
                border: 1px solid transparent;
                transition: transform 0.14s ease, background 0.15s ease, border-color 0.15s ease;
              }
              .cr-btn:active { transform: scale(0.98); }
              .cr-btn-primary {
                background: #00FF38;
                color: #07120A;
                border-color: #00FF38;
              }
              .cr-btn-primary:hover { background: #1FFF50; }
              .cr-btn-ghost {
                background: #131926;
                color: #E2E8F0;
                border-color: #253044;
              }
              .cr-btn-ghost:hover {
                background: #1A2233;
                border-color: #364560;
              }
              .cr-btn-sponsor {
                width: 100%;
                padding: 12px 18px;
                background: rgba(0, 255, 56, 0.12);
                color: #00FF38;
                border: 1px solid rgba(0, 255, 56, 0.45);
                font-size: 14px;
              }
              .cr-btn-sponsor:hover {
                background: #00FF38;
                color: #07120A;
              }
              .cr-main {
                flex: 1;
                width: 100%;
                max-width: 1080px;
                margin: 0 auto;
                padding: 48px 36px 36px;
                display: grid;
                grid-template-columns: 1.2fr 0.95fr;
                gap: 32px;
                align-items: start;
              }
              @media (max-width: 860px) {
                .cr-main { grid-template-columns: 1fr; padding: 28px 20px; }
                .cr-topbar { padding: 0 20px; }
              }
              .cr-eyebrow {
                font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
                font-size: 11.5px;
                letter-spacing: 0.12em;
                text-transform: uppercase;
                color: #00FF38;
                margin-bottom: 12px;
              }
              .cr-title {
                font-size: 42px;
                line-height: 1.08;
                font-weight: 800;
                letter-spacing: -0.03em;
                margin: 0 0 14px;
                color: #FFFFFF;
              }
              .cr-lead {
                font-size: 15.5px;
                line-height: 1.6;
                color: #9AA7BC;
                margin: 0 0 28px;
                max-width: 52ch;
              }
              .cr-card {
                background: #111622;
                border: 1px solid #1E2738;
                border-radius: 14px;
                padding: 24px;
              }
              .cr-dev-card {
                margin-bottom: 22px;
              }
              .cr-card-label {
                font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
                font-size: 11px;
                letter-spacing: 0.1em;
                text-transform: uppercase;
                color: #6F7E96;
                margin-bottom: 16px;
              }
              .cr-dev-row {
                display: flex;
                align-items: center;
                gap: 16px;
                margin-bottom: 18px;
              }
              .cr-dev-avatar {
                width: 54px;
                height: 54px;
                border-radius: 12px;
                border: 1px solid rgba(0, 255, 56, 0.35);
                flex-shrink: 0;
              }
              .cr-dev-name {
                font-size: 20px;
                font-weight: 700;
                color: #FFFFFF;
                margin: 0 0 3px;
              }
              .cr-dev-role {
                font-size: 13.5px;
                color: #8E9BB0;
                margin: 0;
              }
              .cr-dev-bio {
                font-size: 14px;
                line-height: 1.55;
                color: #B4C0D3;
                margin: 0 0 18px;
              }
              .cr-link-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
              }
              .cr-link-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                padding: 11px 14px;
                border-radius: 9px;
                background: #0C1018;
                border: 1px solid #1C2536;
                color: #E5ECF6;
                text-decoration: none;
                font-size: 13.5px;
                cursor: pointer;
                transition: border-color 0.15s ease, background 0.15s ease;
              }
              .cr-link-row:hover {
                border-color: rgba(0, 255, 56, 0.45);
                background: #101624;
              }
              .cr-link-mono {
                font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
                font-size: 12.5px;
                color: #00FF38;
              }
              .cr-cta-row {
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
              }
              .cr-sponsor-card {
                border-top: 2px solid #00FF38;
                margin-bottom: 20px;
              }
              .cr-sponsor-head {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
                margin-bottom: 10px;
              }
              .cr-sponsor-title {
                font-size: 18px;
                font-weight: 700;
                color: #FFFFFF;
                margin: 0;
              }
              .cr-pill {
                font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
                font-size: 11px;
                color: #00FF38;
                background: rgba(0, 255, 56, 0.1);
                border: 1px solid rgba(0, 255, 56, 0.25);
                padding: 3px 9px;
                border-radius: 999px;
              }
              .cr-sponsor-text {
                font-size: 13px;
                line-height: 1.55;
                color: #9AA7BC;
                margin: 0 0 16px;
              }
              .cr-crypto-box {
                display: grid;
                grid-template-columns: 112px 1fr;
                gap: 16px;
                align-items: center;
                padding: 14px;
                border-radius: 11px;
                background: #0A0E16;
                border: 1px solid #1E283A;
                margin-bottom: 14px;
              }
              .cr-qr-frame {
                width: 112px;
                height: 112px;
                padding: 6px;
                border-radius: 9px;
                background: #FFFFFF;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
              }
              .cr-qr-frame img {
                width: 100%;
                height: 100%;
                display: block;
                image-rendering: pixelated;
              }
              .cr-crypto-meta {
                min-width: 0;
                display: flex;
                flex-direction: column;
                gap: 7px;
              }
              .cr-crypto-net {
                font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.06em;
                color: #00FF38;
                text-transform: uppercase;
              }
              .cr-crypto-addr {
                font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
                font-size: 11.5px;
                line-height: 1.4;
                color: #E2E8F0;
                word-break: break-all;
                background: #111724;
                border: 1px solid #1E283B;
                border-radius: 6px;
                padding: 6px 8px;
                user-select: all;
              }
              .cr-btn-copy-addr {
                width: 100%;
                padding: 7px 12px;
                font-size: 12px;
                border-radius: 7px;
                background: #151D2C;
                color: #F3F6FA;
                border: 1px solid #2A3750;
              }
              .cr-btn-copy-addr:hover {
                border-color: rgba(0, 255, 56, 0.55);
                color: #00FF38;
              }
              .cr-crypto-hint {
                font-size: 11px;
                color: #6F7E96;
              }
              .cr-sponsor-actions {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
              }
              .cr-fee-note {
                font-size: 11.5px;
                color: #77869E;
                margin-top: 12px;
                line-height: 1.45;
              }
              .cr-specs {
                display: flex;
                flex-direction: column;
                gap: 12px;
              }
              .cr-spec-item {
                display: grid;
                grid-template-columns: 112px 1fr;
                gap: 12px;
                align-items: baseline;
                padding-bottom: 12px;
                border-bottom: 1px solid #1A2232;
                font-size: 13px;
              }
              .cr-spec-item:last-child {
                padding-bottom: 0;
                border-bottom: none;
              }
              .cr-spec-key {
                font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
                font-size: 11px;
                letter-spacing: 0.06em;
                color: #00FF38;
              }
              .cr-spec-val {
                color: #C4CFE0;
                line-height: 1.45;
              }
              .cr-footer {
                padding: 18px 36px;
                border-top: 1px solid #161C28;
                display: flex;
                align-items: center;
                justify-content: space-between;
                font-size: 12.5px;
                color: #6B7A92;
              }
              .cr-footer a {
                color: #9AA7BC;
                text-decoration: none;
                cursor: pointer;
              }
              .cr-footer a:hover { color: #00FF38; }
            \`;
            (document.head || document.documentElement).appendChild(st);
          }

          if (!document.body) return;
          document.body.innerHTML = "";

          const root = document.createElement("div");
          root.id = "chartread-home-root";
          root.innerHTML =
            '<header class="cr-topbar">' +
              '<div class="cr-brand">' +
                '<img src="' + CR_LOGO_URI + '" alt="ChartRead" />' +
                '<span class="cr-wordmark">Chart<span>Read</span></span>' +
                '<span class="cr-ver">v1.0 · Open Source</span>' +
              '</div>' +
              '<div class="cr-top-actions">' +
                '<a class="cr-btn cr-btn-ghost" data-cr-external="' + DEV_CONFIG.githubRepo + '" href="' + DEV_CONFIG.githubRepo + '">GitHub Repo</a>' +
                '<a class="cr-btn cr-btn-primary" data-cr-charts="1" href="https://www.tradingview.com/chart/">Open Live Charts &rarr;</a>' +
              '</div>' +
            '</header>' +
            '<main class="cr-main">' +
              '<section>' +
                '<div class="cr-eyebrow">INDEPENDENT DESKTOP CHARTING WORKSTATION</div>' +
                '<h1 class="cr-title">Built for clean, focused market analysis.</h1>' +
                '<p class="cr-lead">ChartRead is a fast, distraction-free desktop workstation engineered for real-time charting, unlimited technical indicators, and multi-timeframe Bar Replay backtesting.</p>' +
                '<div class="cr-card cr-dev-card">' +
                  '<div class="cr-card-label">Developed &amp; Maintained By</div>' +
                  '<div class="cr-dev-row">' +
                    '<img class="cr-dev-avatar" src="' + CR_LOGO_URI + '" alt="' + DEV_CONFIG.name + '" />' +
                    '<div>' +
                      '<h2 class="cr-dev-name">' + DEV_CONFIG.name + '</h2>' +
                      '<p class="cr-dev-role">' + DEV_CONFIG.role + '</p>' +
                    '</div>' +
                  '</div>' +
                  '<p class="cr-dev-bio">Created and maintained as a free, open-source project under the MIT License. Explore the source code, suggest features, or follow updates directly on GitHub.</p>' +
                  '<div class="cr-link-list">' +
                    '<a class="cr-link-row" data-cr-external="' + DEV_CONFIG.githubProfile + '" href="' + DEV_CONFIG.githubProfile + '">' +
                      '<span>GitHub Profile</span>' +
                      '<span class="cr-link-mono">github.com/' + DEV_CONFIG.name + ' &nearr;</span>' +
                    '</a>' +
                    '<a class="cr-link-row" data-cr-external="' + DEV_CONFIG.githubRepo + '" href="' + DEV_CONFIG.githubRepo + '">' +
                      '<span>Project Repository</span>' +
                      '<span class="cr-link-mono">github.com/' + DEV_CONFIG.name + '/ChartRead &nearr;</span>' +
                    '</a>' +
                  '</div>' +
                '</div>' +
                '<div class="cr-cta-row">' +
                  '<a class="cr-btn cr-btn-primary" data-cr-charts="1" href="https://www.tradingview.com/chart/">Launch Live Charts &rarr;</a>' +
                  '<button type="button" class="cr-btn cr-btn-ghost" data-cr-copy="' + DEV_CONFIG.githubRepo + '">Copy GitHub Link</button>' +
                '</div>' +
              '</section>' +
              '<aside>' +
                '<div class="cr-card cr-sponsor-card">' +
                  '<div class="cr-sponsor-head">' +
                    '<h3 class="cr-sponsor-title">Sponsor Development</h3>' +
                    '<span class="cr-pill">Free &amp; MIT</span>' +
                  '</div>' +
                  '<p class="cr-sponsor-text">Zero ads, zero tracking, zero paywalls. Support ChartRead via direct USDT (BEP-20) or GitHub Sponsors.</p>' +
                  '<div class="cr-crypto-box">' +
                    '<div class="cr-qr-frame"><img src="' + SPONSOR_QR_URI + '" alt="USDT BEP-20 QR Code" /></div>' +
                    '<div class="cr-crypto-meta">' +
                      '<div class="cr-crypto-net">USDT &middot; ' + DEV_CONFIG.usdtNetwork + '</div>' +
                      '<div class="cr-crypto-addr">' + DEV_CONFIG.usdtAddress + '</div>' +
                      '<button type="button" class="cr-btn cr-btn-copy-addr" data-cr-copy="' + DEV_CONFIG.usdtAddress + '">Copy USDT Address</button>' +
                      '<div class="cr-crypto-hint">Scan from Binance or any BEP-20 wallet</div>' +
                    '</div>' +
                  '</div>' +
                  '<div class="cr-sponsor-actions">' +
                    '<a class="cr-btn cr-btn-sponsor" data-cr-external="' + DEV_CONFIG.githubSponsors + '" href="' + DEV_CONFIG.githubSponsors + '">GitHub Sponsors &rarr;</a>' +
                    '<a class="cr-btn cr-btn-ghost" style="width:100%;" data-cr-external="' + DEV_CONFIG.githubRepo + '/issues" href="' + DEV_CONFIG.githubRepo + '/issues">Report Issue</a>' +
                  '</div>' +
                  '<div class="cr-fee-note">100% voluntary community support &middot; Send USDT on BNB Smart Chain (BEP-20) only.</div>' +
                '</div>' +
                '<div class="cr-card">' +
                  '<div class="cr-card-label">Workstation Capabilities</div>' +
                  '<div class="cr-specs">' +
                    '<div class="cr-spec-item"><span class="cr-spec-key">BAR REPLAY</span><span class="cr-spec-val">Multi-timeframe replay (1S to 1M) with timestamp-anchored switching</span></div>' +
                    '<div class="cr-spec-item"><span class="cr-spec-key">INDICATORS</span><span class="cr-spec-val">Unlimited studies with real-time calculation and replay sync</span></div>' +
                    '<div class="cr-spec-item"><span class="cr-spec-key">STORAGE</span><span class="cr-spec-val">Offline-first local disk persistence with optional cloud sync</span></div>' +
                  '</div>' +
                '</div>' +
              '</aside>' +
            '</main>' +
            '<footer class="cr-footer">' +
              '<span>ChartRead &middot; Developed by ' + DEV_CONFIG.name + ' &middot; MIT License</span>' +
              '<a data-cr-external="' + DEV_CONFIG.githubRepo + '" href="' + DEV_CONFIG.githubRepo + '">github.com/' + DEV_CONFIG.name + '/ChartRead</a>' +
            '</footer>';

          document.body.appendChild(root);

          // Wire external links via Electron shell.openExternal + Copy button + Charts navigation
          root.addEventListener("click", (e) => {
            const ext = e.target.closest("[data-cr-external]");
            if (ext) {
              e.preventDefault();
              const url = ext.getAttribute("data-cr-external");
              if (url && electron?.shell?.openExternal) {
                electron.shell.openExternal(url);
              } else if (url) {
                window.open(url, "_blank", "noopener");
              }
              return;
            }
            const copyBtn = e.target.closest("[data-cr-copy]");
            if (copyBtn) {
              e.preventDefault();
              const val = copyBtn.getAttribute("data-cr-copy");
              const origText = copyBtn.textContent;
              try {
                if (electron?.clipboard?.writeText) electron.clipboard.writeText(val);
                else if (navigator.clipboard?.writeText) navigator.clipboard.writeText(val);
                copyBtn.textContent = "Copied to Clipboard!";
                setTimeout(() => { copyBtn.textContent = origText; }, 1600);
              } catch (err) {}
              return;
            }
            const chartBtn = e.target.closest("[data-cr-charts]");
            if (chartBtn) {
              e.preventDefault();
              window.location.href = "https://www.tradingview.com/chart/";
            }
          });

          // Keep body strictly clean if any late third-party script attempts to append nodes
          new MutationObserver(() => {
            document.title = "ChartRead — Built by " + DEV_CONFIG.name;
            for (const child of Array.from(document.body.children)) {
              if (child.id !== "chartread-home-root") child.remove();
            }
          }).observe(document.body, { childList: true });
        } catch (e) {}
      };

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", mountChartReadHome, { once: true });
      } else {
        mountChartReadHome();
      }
      return;
    }

    // Intercept "Home" menu click on chart pages so it switches cleanly to our ChartRead Home page in-place
    document.addEventListener("click", (e) => {
      try {
        const homeItem = e.target?.closest?.('[data-role="menuitem"][aria-label="Home"]');
        if (homeItem) {
          e.preventDefault();
          e.stopImmediatePropagation();
          window.location.href = "https://www.tradingview.com/";
        }
      } catch (err) {}
    }, true);

    // 1. Document Title Sanitizer (event-driven, zero polling)
    const sanitizeTitle = () => {
      try {
        if (document.title && /TradingView/i.test(document.title)) {
          document.title = document.title.replace(/TradingView/gi, "ChartRead");
        }
      } catch (e) {}
    };
    const bindTitleObserver = () => {
      sanitizeTitle();
      const tElem = document.querySelector("title");
      if (tElem && !tElem.__cr_obs) {
        tElem.__cr_obs = true;
        new MutationObserver(sanitizeTitle).observe(tElem, { childList: true, characterData: true, subtree: true });
      }
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", bindTitleObserver, { once: true });
    } else {
      bindTitleObserver();
    }

    // 2. Main-World Script (Single-Execution Guarded)
    const mainWorldCode = \`
(function() {
  if (window.__cr_main_world_v6) return;
  window.__cr_main_world_v6 = true;

  const CR_LOGO_URI = \${JSON.stringify(CR_LOGO_URI)};

  try {
    // ================================================================
    // A. Pre-seed localStorage to Suppress All Hints, Copilot & Sale Popups
    // ================================================================
    try {
      const dismissFlags = {
        "tradingview.hint.copilotTabButton": "true",
        "tradingview.hint.copilotFreeTrial": "true",
        "tradingview.hint.copilotFreeStandalone": "true",
        "tradingview.hint.copilotBlackFriday": "true",
        "tradingview.hint.copilotFreeUltimate": "true",
        "tradingview.hint.copilotTabButtonShimmer": "true",
        "tradingview.hint.startFocusedZoom": "true",
        "tradingview.hint.replayJumpToBar": "true",
        "tradingview.hint.chartFloatingTooltipActivationHint": "true",
        "black_friday.show_popup_2026": "1",
        "black_friday.show_popup_2_2026": "1",
        "cyber_monday.show_popup_2026": "1",
        "black_friday.show_popup": "1",
        "cyber_monday.show_popup": "1"
      };
      for (const [k, v] of Object.entries(dismissFlags)) {
        if (localStorage.getItem(k) !== v) localStorage.setItem(k, v);
      }
    } catch (e) {}

    // ================================================================
    // B. Canvas Watermark & Branding Eradication
    // ================================================================
    if (typeof CanvasRenderingContext2D !== "undefined" && !CanvasRenderingContext2D.prototype.__cr_v6) {
      CanvasRenderingContext2D.prototype.__cr_v6 = true;
      const _origFill = CanvasRenderingContext2D.prototype.fill;
      CanvasRenderingContext2D.prototype.fill = function() {
        if (arguments[0] instanceof Path2D) {
          const t = this.getTransform();
          if (t.e < 60 && t.f > (this.canvas.height - 70)) {
            return;
          }
        }
        return _origFill.apply(this, arguments);
      };

      const _origFillText = CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText = function(text, x, y, maxWidth) {
        if (typeof text === "string" && /tradingview/i.test(text)) {
          text = text.replace(/tradingview/gi, "ChartRead");
        }
        return _origFillText.call(this, text, x, y, maxWidth);
      };

      const _origStrokeText = CanvasRenderingContext2D.prototype.strokeText;
      CanvasRenderingContext2D.prototype.strokeText = function(text, x, y, maxWidth) {
        if (typeof text === "string" && /tradingview/i.test(text)) {
          text = text.replace(/tradingview/gi, "ChartRead");
        }
        return _origStrokeText.call(this, text, x, y, maxWidth);
      };
    }

    // ================================================================
    // C0. WebSocket Router -> widgetdata.tradingview.com
    // Unlocks real server-side Pine Script & unlimited simultaneous custom indicators
    // (Flux Charts, LuxAlgo, ICT, Volume, RSI, BB, etc.) without study_limit_exceeded!
    // ================================================================
    if (typeof window.WebSocket === "function" && !window.WebSocket.__cr_v6_wd) {
      const OrigWS = window.WebSocket;
      const PatchedWS = function(url, protocols) {
        let targetUrl = url;
        try {
          if (typeof targetUrl === "string" && targetUrl.includes("/socket.io/websocket")) {
            if (targetUrl.startsWith("wss://prodata.tradingview.com")) {
              targetUrl = "wss://widgetdata.tradingview.com" + targetUrl.slice("wss://prodata.tradingview.com".length);
            } else if (targetUrl.startsWith("wss://data.tradingview.com")) {
              targetUrl = "wss://widgetdata.tradingview.com" + targetUrl.slice("wss://data.tradingview.com".length);
            }
          }
        } catch (e) {}
        return protocols !== undefined ? new OrigWS(targetUrl, protocols) : new OrigWS(targetUrl);
      };
      PatchedWS.prototype = OrigWS.prototype;
      Object.setPrototypeOf(PatchedWS, OrigWS);
      PatchedWS.CONNECTING = OrigWS.CONNECTING;
      PatchedWS.OPEN = OrigWS.OPEN;
      PatchedWS.CLOSING = OrigWS.CLOSING;
      PatchedWS.CLOSED = OrigWS.CLOSED;
      PatchedWS.__cr_v6_wd = true;
      window.WebSocket = PatchedWS;
    }

    // ================================================================
    // C. Fetch Interception (Zero 403s, Zero Offer APIs, Zero Auto-Logout)
    // ================================================================
    if (typeof window.fetch === "function" && !window.fetch.__cr_v6) {
      const origFetch = window.fetch.bind(window);
      const makeJsonResp = (obj) => Promise.resolve(new Response(JSON.stringify(obj), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }));

      const wrappedFetch = function(input, init) {
        try {
          const url = typeof input === "string" ? input : (input && input.url ? input.url : "");
          if (url) {
            if (url.includes("/quote_token/")) {
              return makeJsonResp({ token: "unauthorized_user_token" });
            }
            if (url.includes("/pro-plans/profile/")) {
              return makeJsonResp({
                pro_plan: "pro_premium_expert",
                is_pro: true,
                is_expert: true,
                is_authenticated: true
              });
            }
            if (url.includes("/pro-plans/offers/") || url.includes("/available_offers") || url.includes("/offers/")) {
              return makeJsonResp({ response: null, offers: {} });
            }
            if (url.includes("/savesettings/")) {
              return makeJsonResp({ status: "ok" });
            }
            if (url.includes("/api/v1/symbols_list/colored") || url.includes("/pubscripts-get/personal-access/")) {
              return makeJsonResp([]);
            }
            if (url.includes("/list_alerts") || url.includes("/get_offline_fire_controls") || url.includes("/get_offline_fires")) {
              return makeJsonResp({ s: "ok", r: [] });
            }
            if (
              url.includes("snowplow") ||
              url.includes("telemetry.tradingview.com") ||
              url.includes("accounts.google.com/gsi") ||
              url.includes("googlesyndication.com") ||
              url.includes("doubleclick.net") ||
              url.includes("googletagservices.com")
            ) {
              return Promise.resolve(new Response("", { status: 200 }));
            }
          }
        } catch (e) {}
        return origFetch(input, init);
      };
      wrappedFetch.__cr_v6 = true;
      window.fetch = wrappedFetch;
    }

    // ================================================================
    // D. Hardened window.user & window.initData Traps (Zero Offers, Valid Avatar)
    // ================================================================
    const expertUserBase = {
      id: 100001,
      username: "ChartRead",
      pro_plan: "pro_premium_expert",
      is_pro: true,
      is_expert: true,
      is_trial: false,
      is_lite_plan: false,
      badges: ["pro_premium_expert", "pro_expert", "pro_premium", "pro"],
      available_offers: {},
      notification_count: 0,
      unread_notifications_count: 0,
      userpic: CR_LOGO_URI,
      userpic_mid: CR_LOGO_URI,
      userpic_big: CR_LOGO_URI,
      following: "0",
      followers: "0",
      ignore_list: [],
      joined: "2020-01-01",
      session_hash: "chartread_pro_session",
      is_authenticated: true,
      __chartread_unlocked: true
    };
    const buildSanitizedUser = (incoming) => Object.assign({}, expertUserBase, incoming || {}, {
      username: "ChartRead",
      pro_plan: "pro_premium_expert",
      is_pro: true,
      is_expert: true,
      is_trial: false,
      is_lite_plan: false,
      badges: ["pro_premium_expert", "pro_expert", "pro_premium", "pro"],
      available_offers: {},
      notification_count: 0,
      unread_notifications_count: 0,
      userpic: CR_LOGO_URI,
      userpic_mid: CR_LOGO_URI,
      userpic_big: CR_LOGO_URI,
      is_authenticated: true,
      __chartread_unlocked: true
    });

    let _crUser = buildSanitizedUser(window.user);
    try {
      Object.defineProperty(window, "user", {
        get: () => _crUser,
        set: (v) => { _crUser = buildSanitizedUser(v); },
        configurable: true
      });
    } catch (e) { window.user = _crUser; }
    window.is_authenticated = true;

    // Sanitize window.initData so Black Friday offerButtonInfo & trackers never load
    const sanitizeInitData = (d) => {
      if (!d || typeof d !== "object") return d;
      try {
        d.offerButtonInfo = null;
        d.offlineAlertEventsOnInit = [];
        d.snowplowSettings = null;
        d.gaId = "";
        d.gadwId = "";
        d.cm360GlobalTagId = "";
        d.fbTagId = "";
        d.yaTagId = "";
        if (d.user && typeof d.user === "object") {
          d.user.available_offers = {};
        }
      } catch (e) {}
      return d;
    };
    let _crInitData = sanitizeInitData(window.initData);
    try {
      Object.defineProperty(window, "initData", {
        get: () => _crInitData,
        set: (v) => { _crInitData = sanitizeInitData(v); },
        configurable: true
      });
    } catch (e) {}

    // GoPro & Upsell Global Stubs
    window.TradingView = window.TradingView || {};
    window.TradingView.createGoProDialog = () => false;
    window.TradingView.showGoProDialog = () => false;
    window.TradingView.gopro = () => false;

    // ================================================================
    // E. Shared Replay Engine v2 Helpers (Multi-Timeframe Timestamp Clamping)
    // ================================================================
    let LiveReplayStatus = { Pause: 1, AutoPlay: 2, Finish: 3, Undefined: 0 };

    const getActiveReplayController = () => {
      try {
        const api = window.TradingViewApi;
        if (!api) return null;
        if (api._replayApi?._replayUIController) return api._replayApi._replayUIController;
        return null;
      } catch (e) { return null; }
    };

    const getChartModel = (w) => {
      try {
        const api = window.TradingViewApi;
        const target = w || api?._activeChartWidgetWV?.value?.();
        if (!target) return null;
        if (target.chartModel) return target.chartModel();
        if (target.model) {
          const m = target.model();
          return m?.model ? m.model() : m;
        }
        return null;
      } catch (e) { return null; }
    };

    const clampBarsToCutoff = (barsObj, isMainSeries) => {
      if (!window.__cr_replay_active || typeof window.__cr_cutoff_timestamp !== "number") return false;
      const items = barsObj?._items;
      if (!items || items.length === 0) return false;

      const tsCut = window.__cr_cutoff_timestamp;
      // Fast O(1) exit when bars and cutoff timestamp haven't changed
      if (
        barsObj.__cr_last_len === items.length &&
        barsObj.__cr_last_ts === tsCut &&
        barsObj._end === barsObj.__cr_cutoff_end
      ) {
        return false;
      }

      let matchedIdx = items.length - 1;
      for (let j = 0; j < items.length; j++) {
        if (items[j]?.value?.[0] > tsCut) {
          matchedIdx = Math.max(0, j - 1);
          break;
        }
      }
      const newEnd = matchedIdx + 1;
      barsObj.__cr_last_len = items.length;
      barsObj.__cr_last_ts = tsCut;
      barsObj.__cr_cutoff_end = newEnd;
      barsObj._end = newEnd;
      if (isMainSeries) {
        window.__cr_cutoff_index = matchedIdx;
      }
      try { barsObj._invalidateSearchCaches(); } catch (e) {}
      return true;
    };

    const installBarsGuards = (b) => {
      if (!b) return;
      b.__cr_is_main_bars = true;
      const BarsProto = Object.getPrototypeOf(b);
      if (!BarsProto || BarsProto.__cr_guarded_v6) return;
      BarsProto.__cr_guarded_v6 = true;

      ["_append", "_prepend", "_merge", "_updateLast", "add", "merge", "set"].forEach((name) => {
        const orig = BarsProto[name];
        if (typeof orig !== "function") return;
        BarsProto[name] = function() {
          const isManaged = window.__cr_replay_active &&
            typeof window.__cr_cutoff_timestamp === "number" &&
            (this.__cr_is_main_bars || this.__cr_is_study_bars);

          if (!isManaged) {
            return orig.apply(this, arguments);
          }

          this.__cr_mutating_depth = (this.__cr_mutating_depth || 0) + 1;
          if (this.__cr_mutating_depth === 1 && this._items) {
            // Temporarily restore full _end so PlotList internal invariants (e.g. _updateLast) hold 100%
            this._end = this._items.length;
          }
          try {
            return orig.apply(this, arguments);
          } finally {
            this.__cr_mutating_depth--;
            if (this.__cr_mutating_depth === 0) {
              this.__cr_last_len = -1;
              clampBarsToCutoff(this, !!this.__cr_is_main_bars);
            }
          }
        };
      });
    };

    const installModelGuards = (m) => {
      if (!m) return;
      const ModelProto = Object.getPrototypeOf(m);
      if (!ModelProto || ModelProto.__cr_model_guarded_v6) return;
      ModelProto.__cr_model_guarded_v6 = true;

      const origLight = ModelProto.lightUpdate;
      if (typeof origLight === "function") {
        ModelProto.lightUpdate = function() {
          try {
            if (window.__cr_replay_active && typeof window.__cr_cutoff_timestamp === "number") {
              const ms = this.mainSeries?.();
              const b = ms?.bars?.();
              if (b) {
                b.__cr_is_main_bars = true;
                const changed = clampBarsToCutoff(b, true);
                if (changed) {
                  // Re-sync timescale & studies when new resolution bars arrive during Replay
                  try {
                    const lastBar = b._items[window.__cr_cutoff_index];
                    const ts = this.timeScale?.();
                    if (ts && lastBar && typeof ts.setBaseIndex === "function") {
                      ts.setBaseIndex(lastBar.index);
                    }
                  } catch (e2) {}
                  try {
                    const studies = this.allStudies ? this.allStudies() : [];
                    for (const st of studies) {
                      const sd = st.data ? st.data() : null;
                      if (sd && sd._items && sd._items.length > 0) {
                        sd.__cr_is_study_bars = true;
                        clampBarsToCutoff(sd, false);
                      }
                    }
                  } catch (e2) {}
                }
              }
            }
          } catch (e) {}
          return origLight.apply(this, arguments);
        };
      }
    };

    window.__cr_sync_chart_to_point = function(targetIndex) {
      const m = getChartModel();
      if (!m) return null;

      installModelGuards(m);
      const s = m.mainSeries();
      const b = s.bars();
      const ts = m.timeScale();
      installBarsGuards(b);

      if (!b?._items?.length) return null;
      const maxIdx = b._items.length - 1;
      const clampedIdx = Math.max(0, Math.min(maxIdx, targetIndex));

      if (!window.__cr_replay_active) {
        window.__cr_replay_full_end = b._items.length;
      }

      window.__cr_cutoff_index = clampedIdx;
      window.__cr_replay_active = true;

      try {
        if (s && s._replaySubscriber) {
          s._replaySubscriber.setValue({
            id: "cr_local_replay",
            generateReplaySymbol: (sym) => sym,
            modifySeries: () => {},
            onSeriesModified: () => ({ unsubscribeAll: () => {} }),
            destroy: () => {}
          });
        }
      } catch (e) {}

      const targetBar = b._items[clampedIdx];
      const targetTime = targetBar ? targetBar.value[0] : null;
      const targetBarIndex = targetBar ? targetBar.index : clampedIdx;
      if (targetTime) window.__cr_cutoff_timestamp = targetTime;

      b.__cr_is_main_bars = true;
      b.__cr_last_len = b._items.length;
      b.__cr_last_ts = window.__cr_cutoff_timestamp;
      b.__cr_cutoff_end = clampedIdx + 1;
      b._end = clampedIdx + 1;
      try { b._invalidateSearchCaches(); } catch (e) {}

      try {
        if (ts && typeof ts.setBaseIndex === "function") {
          ts.setBaseIndex(targetBarIndex);
          ts.scrollToRealtime();
        }
      } catch (e) {}

      // Sync all studies using the unified O(1)-cached timestamp clamper
      try {
        const studies = m.allStudies ? m.allStudies() : [];
        for (const study of studies) {
          const sd = study.data ? study.data() : null;
          if (!sd || !sd._items || sd._items.length === 0) continue;
          sd.__cr_is_study_bars = true;
          clampBarsToCutoff(sd, false);
          try { m.updateSource(study); } catch (e) {}
        }
      } catch (e) {}

      try {
        m.updateSource(s);
        m.fullUpdate();
      } catch (e) {}

      return { clampedIdx, targetTime, targetBarIndex, end: b._end };
    };

    window.__cr_exit_replay = function() {
      if (window.__cr_exiting_replay || !window.__cr_replay_active) return;

      window.__cr_exiting_replay = true;
      window.__cr_replay_active = false;
      window.__cr_cutoff_index = null;
      window.__cr_cutoff_timestamp = null;

      try {
        const ctrl = getActiveReplayController();
        const mgr = ctrl?._replayManager;
        if (mgr) {
          if (mgr.__cr_timer) {
            clearInterval(mgr.__cr_timer);
            mgr.__cr_timer = null;
          }
          try { mgr._isAutoplayEnabled.setValue(false); } catch (e) {}
          try { mgr._isReplayStarted.setValue(false); } catch (e) {}
          try { mgr._replayPoint.setValue(null); } catch (e) {}
          try { mgr._replaySelectedPoint.setValue(null); } catch (e) {}
        }
      } catch (e) {}

      const m = getChartModel();
      if (!m) {
        window.__cr_exiting_replay = false;
        return;
      }

      const s = m.mainSeries();
      const b = s.bars();
      delete b.__cr_cutoff_end;
      delete b.__cr_last_len;
      delete b.__cr_last_ts;
      b._end = b._items.length;
      try { b._invalidateSearchCaches(); } catch (e) {}

      try {
        if (s && s._replaySubscriber) s._replaySubscriber.setValue(null);
      } catch (e) {}

      try {
        const studies = m.allStudies ? m.allStudies() : [];
        for (const st of studies) {
          const sd = st.data ? st.data() : null;
          if (sd && sd._items) {
            delete sd.__cr_cutoff_end;
            delete sd.__cr_last_len;
            delete sd.__cr_last_ts;
            sd._end = sd._items.length;
            try { if (sd._invalidateSearchCaches) sd._invalidateSearchCaches(); } catch (e) {}
            try { m.updateSource(st); } catch (e) {}
          }
        }
      } catch (e) {}

      try {
        const ts = m.timeScale();
        if (ts) {
          ts.resetBaseIndex();
          try { ts.resetRightOffset(); } catch (e) {}
          ts.scrollToRealtime();
        }
      } catch (e) {}

      try {
        m.updateSource(s);
        m.fullUpdate();
      } catch (e) {}

      window.__cr_replay_full_end = null;
      window.__cr_exiting_replay = false;
    };

    const hookReplayManager = (mgr, widget) => {
      if (!mgr || mgr.__cr_v6_hooked) return;
      mgr.__cr_v6_hooked = true;

      mgr.canChangeSymbolParams = () => Promise.resolve({ res: true });
      mgr._handleAddRemoveSeriesError = () => {};
      mgr._handleError = () => {};
      mgr._handleResetError = () => {};

      mgr.stopReplay = function() {
        if (this.__cr_timer) {
          clearInterval(this.__cr_timer);
          this.__cr_timer = null;
        }
        try { this._isAutoplayEnabled.setValue(false); } catch (e) {}
        try { this._isReplayStarted.setValue(false); } catch (e) {}
        try { this._replayPoint.setValue(null); } catch (e) {}
        try { this._replaySelectedPoint.setValue(null); } catch (e) {}
        try { this.setReplayStatus(this._models || [], LiveReplayStatus.Undefined); } catch (e) {}
        return true;
      };

      mgr.resetReplay = function(targetTimestamp) {
        try { if (this._isAutoplayEnabled.value()) this.stopAutoplay(); } catch (e) {}
        window.__cr_cutoff_timestamp = targetTimestamp;

        const m = getChartModel(widget);
        const ms = m ? m.mainSeries() : null;
        if (ms) {
          const b = ms.bars();
          let matchedIdx = b._items.length - 1;
          for (let i = 0; i < b._items.length; i++) {
            if (b._items[i]?.value?.[0] >= targetTimestamp) {
              matchedIdx = i;
              break;
            }
          }
          window.__cr_sync_chart_to_point(matchedIdx);
        }

        try {
          if (this._replaySelectedPoint?.setValue) this._replaySelectedPoint.setValue(targetTimestamp);
          if (this._replayPoint?.setValue) this._replayPoint.setValue(targetTimestamp);
          if (this._isReplayStarted?.setValue) this._isReplayStarted.setValue(true);
        } catch (e) {}

        try {
          const models = (this._models || []).filter(m => { try { return m.isInReplay().value(); } catch (e) { return false; } });
          this.setReplayStatus(models, LiveReplayStatus.Pause);
        } catch (e) {}
      };

      mgr.doReplayStep = function(step = 1) {
        const m = getChartModel(widget);
        const ms = m ? m.mainSeries() : null;
        if (!ms) return Promise.resolve();
        const b = ms.bars();

        const curIdx = typeof window.__cr_cutoff_index === "number" ? window.__cr_cutoff_index : b._items.length - 1;
        const nextIdx = curIdx + step;

        if (nextIdx >= b._items.length - 1) {
          this.stopAutoplay();
          window.__cr_sync_chart_to_point(b._items.length - 1);
          return Promise.resolve();
        }

        const res = window.__cr_sync_chart_to_point(nextIdx);
        if (res && res.targetTime) {
          try { if (this._replayPoint?.setValue) this._replayPoint.setValue(res.targetTime); } catch (e) {}
        }
        return Promise.resolve();
      };

      mgr.startAutoplay = function() {
        try { this._isAutoplayEnabled.setValue(true); } catch (e) {}
        try {
          const models = (this._models || []).filter(m => { try { return m.isInReplay().value(); } catch (e) { return false; } });
          this.setReplayStatus(models, LiveReplayStatus.AutoPlay);
        } catch (e) {}

        if (this.__cr_timer) { clearInterval(this.__cr_timer); this.__cr_timer = null; }
        const self = this;
        const getDelay = () => {
          try { return Math.max(50, this._autoplayDelay ? this._autoplayDelay.value() : 1000); } catch (e) { return 1000; }
        };
        const tick = () => {
          try {
            if (!self._isAutoplayEnabled.value() || !window.__cr_replay_active) {
              if (self.__cr_timer) { clearInterval(self.__cr_timer); self.__cr_timer = null; }
              return;
            }
            self.doReplayStep(1);
          } catch (e) {
            if (self.__cr_timer) { clearInterval(self.__cr_timer); self.__cr_timer = null; }
          }
        };
        const startTimer = () => {
          if (self.__cr_timer) clearInterval(self.__cr_timer);
          self.__cr_timer = setInterval(tick, getDelay());
        };
        if (this._autoplayDelay && !this.__cr_delay_sub_v6) {
          this.__cr_delay_sub_v6 = true;
          try {
            this._autoplayDelay.subscribe(() => {
              try { if (self._isAutoplayEnabled.value() && self.__cr_timer) startTimer(); } catch (e) {}
            });
          } catch (e) {}
        }
        startTimer();
      };

      mgr.stopAutoplay = function() {
        if (this.__cr_timer) {
          clearInterval(this.__cr_timer);
          this.__cr_timer = null;
        }
        try { this._isAutoplayEnabled.setValue(false); } catch (e) {}
        try {
          const models = (this._models || []).filter(m => { try { return m.isInReplay().value(); } catch (e) { return false; } });
          this.setReplayStatus(models, LiveReplayStatus.Pause);
        } catch (e) {}
      };
    };

    const patchReplayUIControllerClass = (ReplayUIController) => {
      if (!ReplayUIController?.prototype || ReplayUIController.prototype.__cr_v6_patched) return;
      const proto = ReplayUIController.prototype;
      proto.__cr_v6_patched = true;

      const ALL_REPLAY_RESOLUTIONS = [
        "1S", "5S", "10S", "15S", "30S",
        "1", "2", "3", "5", "10", "15", "30", "45",
        "60", "120", "180", "240",
        "1D", "1W", "1M"
      ];
      const ALL_REPLAY_RESOLUTIONS_WITH_NULL = [...ALL_REPLAY_RESOLUTIONS, null];

      // Prevent Replay from activating server-side broker trading (avoids login/broker loops)
      proto._isReplayTradingInAccountManager = returnFalse;
      proto._subscribeTradingController = noop;
      proto._unsubscribeTradingController = noop;

      const origShowToolbar = proto.showReplayToolbar;
      if (typeof origShowToolbar === "function") {
        proto.showReplayToolbar = function() {
          try { hookReplayManager(this._replayManager, this._currentChartWidget ? this._currentChartWidget() : null); } catch (e) {}
          return origShowToolbar.apply(this, arguments);
        };
      }

      proto.enableReplayMode = function(e = true) {
        try { hookReplayManager(this._replayManager, this._currentChartWidget ? this._currentChartWidget() : null); } catch (e2) {}
        this._setReplayModeEnabled(true, e);
        return Promise.resolve();
      };

      const origSetReplayModeEnabled = proto._setReplayModeEnabled;
      if (typeof origSetReplayModeEnabled === "function") {
        proto._setReplayModeEnabled = function(enabled) {
          if (!enabled && window.__cr_replay_active) window.__cr_exit_replay();
          try { return origSetReplayModeEnabled.apply(this, arguments); } catch (e) {}
        };
      }

      const origDestroy = proto.destroy;
      if (typeof origDestroy === "function") {
        proto.destroy = function() {
          if (window.__cr_replay_active) window.__cr_exit_replay();
          return origDestroy.apply(this, arguments);
        };
      }

      proto._onPointTooDeepError = function() {};
      proto._onParamsNotApplicableForReplay = function() {};

      proto._updateAllReplayResolutions = function() {
        if (this._allReplayResolutions && this._allReplayResolutions.value?.() !== ALL_REPLAY_RESOLUTIONS) {
          this._allReplayResolutions.setValue(ALL_REPLAY_RESOLUTIONS);
        }
      };

      proto._updateFilteredByCurrentPointReplayResolutions = function() {
        const cur = this._activeChartWidget?.value()?.resolution?.() || "15";
        if (this._autoReplayResolution && this._autoReplayResolution.value?.() !== cur) {
          this._autoReplayResolution.setValue(cur);
        }
        if (this._replayResolutions && this._replayResolutions.value?.() !== ALL_REPLAY_RESOLUTIONS_WITH_NULL) {
          this._replayResolutions.setValue(ALL_REPLAY_RESOLUTIONS_WITH_NULL);
        }
        try { this._correctCurrentReplayResolutionValue(); } catch (e) {}
      };

      proto.changeReplayResolution = function(newRes) {
        if (!newRes) return;
        try {
          if (this._currentReplayResolution) this._currentReplayResolution.setValue(newRes);
          const w = this._currentChartWidget ? this._currentChartWidget() : (window.TradingViewApi?._activeChartWidgetWV?.value?.());
          if (w && typeof w.setResolution === "function") w.setResolution(newRes);
        } catch (e) {}
      };

      proto.pointsIsTooDeepForCharts = function() {
        if (this._pointsIsTooDeepForCharts) {
          try { this._pointsIsTooDeepForCharts.setValue([]); } catch (e) {}
          return this._pointsIsTooDeepForCharts;
        }
        if (!this.__cr_pointsTooDeepWV) {
          this.__cr_pointsTooDeepWV = {
            value: () => [],
            setValue: () => {},
            subscribe: () => ({ unsubscribe: () => {} }),
            unsubscribe: () => {},
            weakReference: function() { return this; },
            ownership: function() { return this; }
          };
        }
        return this.__cr_pointsTooDeepWV;
      };

      proto._onPointSelected = function(widget, timestamp) {
        try { hookReplayManager(this._replayManager, widget); } catch (e) {}
        window.__cr_cutoff_timestamp = timestamp;

        const w = widget || (this._currentChartWidget ? this._currentChartWidget() : null);
        const m = getChartModel(w);
        const ms = m?.mainSeries ? m.mainSeries() : null;

        if (ms) {
          const b = ms.bars();
          let matchedIdx = b._items.length - 1;
          for (let i = 0; i < b._items.length; i++) {
            if (b._items[i]?.value?.[0] >= timestamp) {
              matchedIdx = i;
              break;
            }
          }
          window.__cr_sync_chart_to_point(matchedIdx);
        }

        const mgr = this._replayManager;
        if (mgr) {
          try {
            if (mgr._replayPoint?.setValue) mgr._replayPoint.setValue(timestamp);
            if (mgr._replaySelectedPoint?.setValue) mgr._replaySelectedPoint.setValue(timestamp);
            if (mgr._isReplayStarted?.setValue) mgr._isReplayStarted.setValue(true);
          } catch (e) {}
          try {
            const models = (mgr._models || []).filter(m => { try { return m.isInReplay().value(); } catch (e) { return false; } });
            mgr.setReplayStatus(models, LiveReplayStatus.Pause);
          } catch (e) {}
        }

        try { this.showReplayToolbar(); } catch (e) {}
        try { if (w?.cancelRequestSelectPoint) w.cancelRequestSelectPoint(); } catch (e) {}
      };

      proto.toggleAutoplay = function() {
        try { hookReplayManager(this._replayManager, this._currentChartWidget ? this._currentChartWidget() : null); } catch (e) {}
        const mgr = this._replayManager;
        if (!mgr) return;
        try {
          if (mgr.isAutoplayStarted().value()) {
            mgr.stopAutoplay();
          } else {
            try { if (this._currentChartWidget) this._currentChartWidget().cancelRequestSelectPoint(); } catch (e) {}
            mgr.startAutoplay();
          }
        } catch (e) {}
      };

      proto.doStep = function() {
        try { hookReplayManager(this._replayManager, this._currentChartWidget ? this._currentChartWidget() : null); } catch (e) {}
        const mgr = this._replayManager;
        if (!mgr) return Promise.resolve();
        try { if (mgr.isAutoplayStarted().value()) mgr.stopAutoplay(); } catch (e) {}
        return mgr.doReplayStep(1);
      };

      proto.goToRealtime = function() {
        const mgr = this._replayManager;
        try { if (mgr?.isAutoplayStarted?.().value()) mgr.stopAutoplay(); } catch (e) {}
        const m = getChartModel(this._currentChartWidget ? this._currentChartWidget() : null);
        const ms = m?.mainSeries ? m.mainSeries() : null;
        if (ms) {
          const b = ms.bars();
          window.__cr_sync_chart_to_point(b._items.length - 1);
          try {
            if (mgr?._replayPoint?.setValue && b.last()) mgr._replayPoint.setValue(b.last().value[0]);
          } catch (e) {}
        }
        if (mgr) {
          try {
            const models = (mgr._models || []).filter(m => { try { return m.isInReplay().value(); } catch (e) { return false; } });
            mgr.setReplayStatus(models, LiveReplayStatus.Pause);
          } catch (e) {}
        }
      };

      proto.requestCloseReplay = function(force = true, callback) {
        const mgr = this._replayManager;
        if (mgr) {
          try { if (mgr.isAutoplayStarted().value()) mgr.stopAutoplay(); } catch (e) {}
          try { if (mgr._isReplayStarted) mgr._isReplayStarted.setValue(false); } catch (e) {}
          try { if (mgr._replayPoint) mgr._replayPoint.setValue(null); } catch (e) {}
          try { if (mgr._replaySelectedPoint) mgr._replaySelectedPoint.setValue(null); } catch (e) {}
          try { mgr.setReplayStatus(mgr._models || [], LiveReplayStatus.Undefined); } catch (e) {}
        }

        window.__cr_exit_replay();
        try { this._setReplayModeEnabled(false); } catch (e) {}

        try {
          document.querySelectorAll('#leaveReplayDialog, [data-dialog-name="confirm-dialog"]').forEach((d) => {
            if (/leave current replay/i.test(d.innerText || "")) {
              const closeBtn = d.querySelector('[class*="closeButton"], [aria-label="Close"]');
              if (closeBtn) closeBtn.click();
              else d.remove();
            }
          });
        } catch (e) {}

        if (typeof callback === "function") {
          try { callback(); } catch (e) {}
        }
        return Promise.resolve();
      };
    };

    // ================================================================
    // F. Dynamic Future-Proof Webpack Hook (ZERO Hardcoded Module IDs!)
    // ================================================================
    const noop = () => {};
    const noopAsync = () => Promise.resolve();
    const returnFalse = () => false;
    const returnTrue = () => true;
    const returnNull = () => null;
    const returnNullAsync = () => Promise.resolve(null);
    const returnEmptyObjAsync = () => Promise.resolve({});

    // Re-entrancy-safe bypass for sign-in / GoPro walls (prevents async recursion loops like _selectBroker!)
    const activeWallTimestamps = new Map();
    const safeBypassWall = (wallId, cb, opts) => {
      const idStr = (wallId && typeof wallId === "object") ? (wallId.name || wallId.id || wallId.feature || "obj") : String(wallId || "");
      const key = idStr + "|" + String(opts?.source || "");
      // Never auto-connect TradingView server-side broker trading without a real session
      if (/broker|trading_panel|regwall_trading/i.test(key)) {
        return Promise.resolve({ shown: false });
      }
      const now = Date.now();
      const prev = activeWallTimestamps.get(key) || 0;
      if (now - prev < 500) {
        return Promise.resolve({ shown: false });
      }
      activeWallTimestamps.set(key, now);
      if (typeof cb === "function") {
        try {
          const out = cb();
          return out && typeof out.then === "function" ? out : Promise.resolve({ shown: false });
        } catch (e) {}
      }
      return Promise.resolve({ shown: false });
    };

    const EXPORT_OVERRIDES = {
      // Offers, Black Friday, Cyber Monday, Promotional Banners & Modals
      showBlackFridayDialog: noop,
      openPaywall: noop,
      openOnboarding: noop,
      showUpgradeToProDialog: noopAsync,
      showIntradayRestrictionPaywall: noop,
      isIntradayExchangeRestricted: returnFalse,
      isIntradayRestrictedResolution: returnFalse,
      showGoProAlertsOnSecondsDialog: noop,
      showGoProAlertsWebhookDialog: noop,
      showGoProInfExpDialog: noop,
      showGoProOrderDialog: noop,
      showGoProNoWatchlistAlertPermissionDialog: noop,
      showGoProNoMulticonditionAlertPermissionDialog: noop,
      showGoProBondDataDialog: noop,
      showTickCalculationPaywallIfNotIncluded: noop,
      showConversionResetPaywall: noop,
      showSavedScriptsLimitPaywall: noop,
      brokerTradingPaywall: noop,
      onGoPro: noop,
      openGoPro: noop,
      openGoProPage: noop,
      openPaymentOrderDialogOnLoad: noop,
      openPartnerProgramDialogOnLoad: noop,
      showFailedPaymentBanner: noop,
      showFailedPaymentBannerOnChart: noop,
      createCompetitionsBanner: returnNull,
      createUpgradeButton: returnNull,
      TreeMonthOfferToast: returnNull,
      togglePromoVisible: noop,
      getOfferButtonInfo: returnNullAsync,
      loadRealtimeDataOffersOnDemand: returnEmptyObjAsync,
      ensureOffers: returnEmptyObjAsync,
      setInitialOffers: noop,

      // Offer / Promo / Trial Availability Booleans
      isUpgradeOfferAvailable: returnFalse,
      isTrialAvailableForUser: returnFalse,
      canShowReferralPromoToast: returnFalse,
      canShowAccountManagerBanner: returnFalse,
      isCopilotSaleOn: returnFalse,
      isShowPromoVideo: returnFalse,
      hasOpenAccountOffer: returnFalse,
      isPaywallGate: returnFalse,
      isSaveBlockedByPaywall: returnFalse,
      isScriptUpdateBlockedByPaywall: returnFalse,
      isFreeTrialHidden: returnTrue,

      // Auth & Auto-Reload Prevention
      syncUserData: noopAsync,
      syncUserConversionData: () => Promise.resolve({ is_authenticated: true, user: window.user }),
      isPageReloadedOnSignOut: returnFalse,

      // Paywall & Sign-In Execution Bypasses (Re-entrancy Safe!)
      runOrGoPro: (paywallId, cb, _feat, opts) => safeBypassWall("gopro:" + paywallId, cb, opts),
      runOrGoProWithoutSync: (paywallId, cb, _feat, opts) => safeBypassWall("gopro_ns:" + paywallId, cb, opts),
      reloginOrGoPro: () => Promise.resolve({ shown: false }),
      runOrSignInWithWall: (descriptor, cb, opts) => safeBypassWall("wall:" + descriptor, cb, opts),
      runOrSignIn: (cb, opts) => safeBypassWall("signin", cb, opts),

      // Pro Feature Unlocks
      canUpgradePlan: returnFalse,
      getProductId: () => "pro_premium_expert",
      getFullProductId: () => "pro_premium_expert",
      isMaxSubscriptionPlan: returnTrue,
      ensureDrawingSelectAllowed: returnTrue,
      ensureDrawingCreationAllowed: returnTrue,
      isImageDrawingToolAvailable: returnTrue,
      paidStudyAccessError: () => ({ studyAccessBlocked: false }),
      isServiceStudyErrorCode: returnFalse,
      studyStatusBlocked: returnFalse,
      applyStudyWithCheckPermission: (...args) => {
        const cb = args.find((a) => typeof a === "function");
        if (cb) cb();
      },
      applyStudyWithCheckPermissionByStudyId: (...args) => {
        const cb = args.find((a) => typeof a === "function");
        if (cb) cb();
      }
    };

    let cachedStudyClass = null;

    const CLASS_PATCHERS = {
      AuthToken(AuthToken) {
        if (!AuthToken?.prototype?.currentTokenIsValid || AuthToken.prototype.__cr_v6) return;
        AuthToken.prototype.__cr_v6 = true;
        AuthToken.prototype.currentTokenIsValid = () => true;
        AuthToken.prototype.get = () => Promise.resolve("unauthorized_user_token");
      },
      Session(Session) {
        if (!Session?.prototype?._onCriticalError || Session.prototype.__cr_v6) return;
        Session.prototype.__cr_v6 = true;
        const origOnCrit = Session.prototype._onCriticalError;
        Session.prototype._onCriticalError = function() {
          if (window.__cr_replay_active) return;
          if (this.constructor?.name === "H" || (this.sessionId && String(this.sessionId()).startsWith("rs_"))) {
            return;
          }
          try { return origOnCrit.apply(this, arguments); } catch (e) {}
        };
      },
      Series(Series) {
        if (!Series?.prototype?.switchToReplay || Series.prototype.__cr_v6) return;
        const sp = Series.prototype;
        sp.__cr_v6 = true;

        sp.canChangeResolution = () => Promise.resolve(true);
        sp.canChangeSymbol = () => Promise.resolve({ result: true });
        sp._isReplayResolutionAvailableForUser = () => true;
        sp._getResolvingSymbolObject = function() {
          return this._getSymbolObject({ overriddenSymbol: this._symbolForResolve(), skipDefaultSession: true });
        };
        sp._processReplayOnApplySymbolParamsChanges = () => Promise.resolve();
        sp._modifyReplaySeries = () => Promise.resolve();

        sp.switchToReplay = function(subscriber) {
          try {
            const safeSub = subscriber || {
              id: "cr_local_replay",
              generateReplaySymbol: (s) => s,
              modifySeries: () => {},
              onSeriesModified: () => ({ unsubscribeAll: () => {} }),
              destroy: () => {}
            };
            this._replaySubscriber.setValue(safeSub);
            this._isReplayResolutionAvailableForUser = () => true;
            this._onInReplayStateChanged.fire();
          } catch (e) {}
        };

        const origSwitchToRealtime = sp.switchToRealtime;
        sp.switchToRealtime = function() {
          if (window.__cr_replay_active && typeof window.__cr_exit_replay === "function") {
            window.__cr_exit_replay();
          }
          try { return origSwitchToRealtime.apply(this, arguments); } catch (e) {}
        };

        const origClearData = sp.clearData;
        sp.clearData = function() {
          try {
            const b = this.bars();
            if (b) {
              delete b.__cr_cutoff_end;
              delete b.__cr_last_len;
              delete b.__cr_last_ts;
            }
          } catch (e) {}
          return origClearData.apply(this, arguments);
        };

        const origSetSymbol = sp.setSymbol;
        sp.setSymbol = function() {
          if (window.__cr_replay_active && typeof window.__cr_exit_replay === "function") {
            window.__cr_exit_replay();
          }
          return origSetSymbol.apply(this, arguments);
        };
      },
      ReplayStatus(rs) {
        if (rs && typeof rs === "object" && "Pause" in rs) {
          LiveReplayStatus = rs;
        }
      },
      ReplayUIController(ctrl) {
        if (ctrl?.prototype?._onPointSelected) {
          patchReplayUIControllerClass(ctrl);
        }
      },
      ChartWidgetCollection(CWC) {
        if (!CWC?.prototype || CWC.prototype.__cr_v6) return;
        if (!CWC.prototype._checkProFeature && !CWC.prototype._isLayoutKeptBehindPaywall) return;
        CWC.prototype.__cr_v6 = true;
        CWC.prototype._checkProFeature = function(e) { return e; };
        CWC.prototype._isLayoutKeptBehindPaywall = returnFalse;
        CWC.prototype._showIntradayRestrictionIfAny = returnFalse;
        CWC.prototype._openMultipleChartsPaywall = noop;
      },
      Study(Study) {
        if (!Study?.prototype?._handleStudyError || Study.prototype.__cr_v6) return;
        Study.prototype.__cr_v6 = true;
        cachedStudyClass = Study;
        Study.prototype._handleStudyError = function() {
          try { this._setStatus({ type: 2 }); } catch (e) {}
          try {
            this._statusView?.update?.();
            this._model?.updateSource?.(this);
            this._enablePriceRangeReady?.();
          } catch (e) {}
        };
        Study.prototype.isFailed = () => false;
        Study.prototype.hasCompileError = () => false;
        Study.prototype.error = () => null;
      },
      StudyStatusProviderBase(SSP) {
        if (!SSP?.prototype || SSP.prototype.__cr_v6) return;
        SSP.prototype.__cr_v6 = true;
        SSP.prototype.errorStatus = () => null;
      },
      StudySearchDialogRendererBase(SSDR) {
        if (!SSDR?.prototype?._requestDialog || SSDR.prototype.__cr_v6) return;
        SSDR.prototype.__cr_v6 = true;
        const origReq = SSDR.prototype._requestDialog;
        SSDR.prototype._requestDialog = function() {
          const p = origReq.apply(this, arguments);
          if (p && typeof p.catch === "function") {
            p.catch(() => { this._dialogPromise = null; });
          }
          return p;
        };
      },
      StudySearchBaseDialog(SSBD) {
        if (!SSBD?.prototype || SSBD.prototype.__cr_v6) return;
        SSBD.prototype.__cr_v6 = true;
        SSBD.prototype._ignoreChecksWhenAddingStudy = true;
        SSBD.prototype._handleClickOnStudyApply = function(item, t, i, s) {
          if (!item) return;
          if (this._applyStudy) return this._applyStudy(item, t, i, s);
        };
      },
      StudySearchDialog(SSD) {
        if (!SSD?.prototype || SSD.prototype.__cr_v6) return;
        SSD.prototype.__cr_v6 = true;
        SSD.prototype._ignoreChecksWhenAddingStudy = true;
      },
      availableOffers(avail) {
        if (!avail || typeof avail !== "object" || avail.__cr_v6) return;
        avail.__cr_v6 = true;
        avail.getData = () => ({});
        avail.ensureOffers = () => Promise.resolve({});
        avail.setInitial = noop;
        avail._updateOffers = () => Promise.resolve({});
        avail.runOrUpdate = () => Promise.resolve({});
      },
      isCopilotTabHintDone(wv) {
        if (!wv || typeof wv !== "object" || wv.__cr_v6) return;
        wv.__cr_v6 = true;
        try { if (typeof wv.setValue === "function") wv.setValue(true); } catch (e) {}
        wv.value = () => true;
      },
      setChartApiEntitlements(origFn) {
        if (typeof origFn !== "function" || origFn.__cr_v6_called) return;
        origFn.__cr_v6_called = true;
        try {
          origFn({ isFeatureEnabled: () => true, featureLimit: () => 99999 });
        } catch (e) {}
      }
    };

    const installWebpackHooks = (req) => {
      if (!req || req.__cr_v6_hooked) return;
      req.__cr_v6_hooked = true;
      window.__cr_webpack_req = req;

      // Wrap req.d so EVERY module export is intercepted cleanly at definition time
      if (typeof req.d === "function") {
        req.d = function(exportsObj, definition) {
          const isProductFeaturesMod = ("getProductId" in definition) || ("canUpgradePlan" in definition) || ("getProductFeaturesConfig" in definition);

          for (const key in definition) {
            if (!Object.prototype.hasOwnProperty.call(definition, key)) continue;
            if (Object.prototype.hasOwnProperty.call(exportsObj, key)) continue;

            const origGetter = definition[key];

            if (key === "enabled" && isProductFeaturesMod) {
              Object.defineProperty(exportsObj, key, { enumerable: true, configurable: true, get: () => returnTrue });
            } else if (key === "setChartApiEntitlements") {
              Object.defineProperty(exportsObj, key, {
                enumerable: true,
                configurable: true,
                get: () => {
                  const realFn = origGetter();
                  if (typeof realFn === "function" && !realFn.__cr_v6_wrap) {
                    const wrapped = function() {
                      return realFn({ isFeatureEnabled: () => true, featureLimit: () => 99999 });
                    };
                    wrapped.__cr_v6_wrap = true;
                    try { realFn({ isFeatureEnabled: () => true, featureLimit: () => 99999 }); } catch (e) {}
                    return wrapped;
                  }
                  return realFn;
                }
              });
            } else if (Object.prototype.hasOwnProperty.call(EXPORT_OVERRIDES, key)) {
              const overrideVal = EXPORT_OVERRIDES[key];
              Object.defineProperty(exportsObj, key, { enumerable: true, configurable: true, get: () => overrideVal });
            } else if (Object.prototype.hasOwnProperty.call(CLASS_PATCHERS, key)) {
              const patcher = CLASS_PATCHERS[key];
              let done = false;
              Object.defineProperty(exportsObj, key, {
                enumerable: true,
                configurable: true,
                get: () => {
                  const val = origGetter();
                  if (!done && val) {
                    done = true;
                    try { patcher(val); } catch (e) {}
                  }
                  return val;
                }
              });
            } else {
              Object.defineProperty(exportsObj, key, { enumerable: true, configurable: true, get: origGetter });
            }
          }
        };
      }

      // One-time sweep of any modules already in req.c
      if (req.c) {
        for (const mod of Object.values(req.c)) {
          const exp = mod?.exports;
          if (!exp || typeof exp !== "object") continue;
          for (const key of Object.keys(CLASS_PATCHERS)) {
            try {
              if (exp[key]) CLASS_PATCHERS[key](exp[key]);
            } catch (e) {}
          }
        }
      }
    };

    // Register boot chunk BEFORE runtime.js loads (fires synchronously in runtime.js f.forEach)
    try {
      window.webpackChunktradingview = window.webpackChunktradingview || [];
      window.webpackChunktradingview.push([[Symbol("cr_boot_v6")], {}, installWebpackHooks]);
    } catch (e) {}

    // ================================================================
    // G. One-Time Bounded Runtime Setup (WS, FeatureToggle, ChartModel)
    // ================================================================
    let wsHooked = false;
    let ftEnabled = false;
    let modelPatched = false;
    let setupAttempts = 0;

    const runBoundedSetup = () => {
      setupAttempts++;

      // 1. WebSocket Connection Guard
      if (!wsHooked && window.WSBackendConnection) {
        try {
          wsHooked = true;
          window.WSBackendConnection.forbidConnection = noop;
          window.WSBackendConnection._isConnectionForbidden = false;
          window.WSBackendConnection._tryGetProHost = returnNull;
          window.WSBackendConnection._proHost = null;
          if (!window.WSBackendConnection.isConnected() && !window.WSBackendConnection.isConnecting()) {
            window.WSBackendConnection.allowConnection();
          }
        } catch (e) {}
      } else if (wsHooked && window.WSBackendConnection) {
        try {
          window.WSBackendConnection._isConnectionForbidden = false;
          if (!window.WSBackendConnection.isConnected() && !window.WSBackendConnection.isConnecting()) {
            window.WSBackendConnection.allowConnection();
          }
        } catch (e) {}
      }

      // 2. Feature Toggles
      if (!ftEnabled && window.TradingView?.FeatureToggle?.enableFeature) {
        try {
          const ft = window.TradingView.FeatureToggle;
          [
            "multiple_charts",
            "seconds_resolution",
            "custom_resolutions",
            "bar_replay",
            "volume_profile",
            "study_templates",
            "export_chart_data",
            "extended_trading_hours",
            "show_extended_hours",
            "chart_patterns"
          ].forEach((f) => ft.enableFeature(f));
          ftEnabled = true;
        } catch (e) {}
      }

      // 3. ChartModel & StudyMarket 50-Indicator Unlock
      if (!modelPatched) {
        try {
          if (window.studyMarket?._insertStudyService) {
            window.studyMarket._insertStudyService.getStudiesCounter = () => 0;
          }
          if (window.studyMarket && window.studyMarket._dialogPromise && !window.studyMarket._dialog) {
            window.studyMarket._dialogPromise = null;
          }
          if (window.TVScript?.Access) {
            window.TVScript.Access.ACCESS_CLOSED_NEEDS_AUTH = "open_no_auth";
            if (window.TVScript.Access.MAP_ID_TO_NAME) window.TVScript.Access.MAP_ID_TO_NAME["3"] = "open_no_auth";
            if (window.TVScript.Access.MAP_NAME_TO_ID) window.TVScript.Access.MAP_NAME_TO_ID["closed_needs_auth"] = "1";
          }

          const w = window.TradingViewApi?._activeChartWidgetWV?.value?.();
          const model = w?.model?.() || w?.chartModel?.();
          if (model) {
            const proto = Object.getPrototypeOf(model);
            if (proto && !proto.__cr_study_patched_v6) {
              proto.__cr_study_patched_v6 = true;
              proto.canCreateStudy = () => ({ success: true, limitValue: 50 });
              proto.checkIfFeatureAvailable = returnTrue;
            }
            const innerModel = typeof model.model === "function" ? model.model() : model;
            if (innerModel) {
              const innerProto = Object.getPrototypeOf(innerModel);
              if (innerProto && !innerProto.__cr_study_patched_v6) {
                innerProto.__cr_study_patched_v6 = true;
                const origInsertParams = innerProto.insertStudyWithParams;
                if (typeof origInsertParams === "function") {
                  innerProto.insertStudyWithParams = function(params) {
                    if (params && params.preferredPriceScale === null) params.preferredPriceScale = undefined;
                    return origInsertParams.apply(this, arguments);
                  };
                }
              }
            }
            modelPatched = true;
          }
        } catch (e) {}
      }

      if ((wsHooked && ftEnabled && modelPatched) || setupAttempts >= 25) {
        clearInterval(setupTimer);
      }
    };
    const setupTimer = setInterval(runBoundedSetup, 800);
    runBoundedSetup();

    // ================================================================
    // H. Study Sync Hook (Real Server-Computed Pine & Built-in Studies)
    // Note: Removed fake computeEmptyStudies dummy close-price injection and
    // duplicate capture-phase click listener — all real custom/community Pine
    // scripts (Flux Charts, LuxAlgo, ICT, etc.) execute natively on widgetdata WS!
    // ================================================================

    // ================================================================
    // J. Local / Cloud Workspace Auto-Sync (Debounced, Low Overhead)
    // ================================================================
    if (window.ChartReadCloud) {
      const getActiveChartModel = () => getChartModel();

      window.chartreadSyncDrawings = async () => {
        try {
          const model = getActiveChartModel();
          if (!model) return;
          const symbol = model.mainSeries?.()?.symbol?.() || "GLOBAL";
          const tools = model.allLineTools ? model.allLineTools() : [];
          const drawingsData = tools.map((t) => {
            try {
              return {
                id: t.id(),
                name: t.name ? t.name() : t.toolname,
                points: t.points ? t.points() : null,
                state: t.state ? t.state() : null
              };
            } catch (e) { return null; }
          }).filter(Boolean);
          await window.ChartReadCloud.saveDrawings(symbol, drawingsData);
          return { success: true, count: drawingsData.length, symbol };
        } catch (err) { return { error: err.message }; }
      };

      window.chartreadSyncLayout = async () => {
        try {
          const model = getActiveChartModel();
          if (!model || !model.state) return;
          const layoutState = model.state({ withData: false });
          const symbol = model.mainSeries?.()?.symbol?.() || "DEFAULT";
          const resolution = model.mainSeries?.()?.properties?.()?.interval?.value?.() || "1D";
          await window.ChartReadCloud.saveLayout("default_layout", {
            symbol,
            resolution,
            state: layoutState,
            studies: model.allStudies ? model.allStudies().map(s => s.metaInfo?.()?.description) : [],
            updatedAt: new Date().toISOString()
          });
          return { success: true, symbol, resolution };
        } catch (err) { return { error: err.message }; }
      };

      setInterval(() => {
        window.chartreadSyncDrawings();
        window.chartreadSyncLayout();
      }, 30000);

      let mouseSyncTimer = null;
      document.addEventListener("mouseup", (e) => {
        if (e.target?.closest?.(".chart-gui-wrapper")) {
          if (mouseSyncTimer) clearTimeout(mouseSyncTimer);
          mouseSyncTimer = setTimeout(() => {
            window.chartreadSyncDrawings();
            window.chartreadSyncLayout();
          }, 800);
        }
      }, { passive: true });
    }

    // ================================================================
    // K. Unified rAF-Throttled DOM Sweeper: Banners, Offers, Hints & Branding
    // ================================================================
    const PROMO_DIALOG_RE = /black friday|cyber monday|up to \\\\d+% off|our best deal is here|explore offers|sale ends in|custom intervals|see what others don't|upgraded plans|invite-only script|access to this script is restricted|ready to trade|sign up and gain access|unlock bar replay|look first|create a free account|registration_promotion|try ai copilot|ai copilot is now free|copilot empowers|non-standard intervals|seconds intervals|intraday bar replay|go pro|30-day free trial|trial period|special offer|claim your offer|get it before the point of no return/i;
    const PROMO_CARD_RE = /black friday — our best deal|black friday.*\\\\d+% off|cyber monday.*\\\\d+% off|our best deal is here|claim your offer|30-day free trial|\\\\+1 free month/i;

    const runDomSweep = () => {
      try {
        // 1. Neutralize any promo dialogs, offer popups, Black Friday modals, or Copilot hints
        const overlayTargets = document.querySelectorAll(
          '[role="dialog"], [class*="dialog-"], [data-qa-id="ui-lib-HintWizard"], [data-role="hint"], .tv-header-promo-backdrop, .js-main-page-promo, .js-offer-button, [class*="tv-header__offer-button"]'
        );
        overlayTargets.forEach((el) => {
          const cls = typeof el.className === "string" ? el.className : "";
          const isKnownPromo =
            el.matches('[data-qa-id="ui-lib-HintWizard"], [data-role="hint"], .tv-header-promo-backdrop, .js-main-page-promo, .js-offer-button, [class*="tv-header__offer-button"]') ||
            /black.?friday|cyber.?monday|promo|gopro|upgrade/i.test(cls);

          if (isKnownPromo) {
            const closeBtn = el.querySelector('[data-name="close"], button[aria-label="Close"], [class*="closeButton"], [class*="close-"]');
            if (closeBtn) {
              try { closeBtn.click(); } catch (e) {}
            }
            el.remove();
            return;
          }

          const txt = el.textContent || "";
          if (txt.length > 0 && txt.length < 2500 && PROMO_DIALOG_RE.test(txt)) {
            const closeBtn = el.querySelector('[data-name="close"], button[aria-label="Close"], [class*="closeButton"], [class*="close-"]');
            if (closeBtn) {
              try { closeBtn.click(); } catch (e) {}
            } else {
              el.remove();
            }
          }
        });

        // 1b. Neutralize promotional cards & Google GPT ad slots injected into homepage feeds / carousels
        document.querySelectorAll('[id^="div-gpt-ad"], [id*="google_ads_iframe"], iframe[src*="googlesyndication"], iframe[src*="doubleclick"]').forEach((ad) => {
          const cardWrap = ad.closest('article, [class*="card-"], [class*="adUnit" i]') || ad;
          if (cardWrap && cardWrap.tagName !== "BODY" && cardWrap.tagName !== "MAIN" && cardWrap.tagName !== "SECTION") {
            cardWrap.remove();
          } else {
            ad.remove();
          }
        });
        document.querySelectorAll('article, [class*="card-"], [class*="promo" i]').forEach((card) => {
          const hasPromoLink = !!card.querySelector('a[href*="/black-friday"], a[href*="/cyber-monday"], a[href*="/pricing"], a[href*="/gopro"]');
          if (hasPromoLink) {
            const container = card.closest('article, [class*="ideaCard-"], [class*="card-exterior-"]') || card;
            if (container && container.tagName !== "BODY" && container.tagName !== "MAIN" && container.tagName !== "SECTION") {
              container.remove();
            }
            return;
          }
          const txt = card.textContent || "";
          if (txt.length > 0 && txt.length < 600 && PROMO_CARD_RE.test(txt)) {
            const container = card.closest('article, [class*="ideaCard-"], [class*="card-exterior-"]') || card;
            if (container && container.tagName !== "BODY" && container.tagName !== "MAIN" && container.tagName !== "SECTION") {
              container.remove();
            }
          }
        });

        // 2. Homepage & Top Nav Logo (full valid PNG, never broken)
        const headerLogo = document.querySelector('.tv-header__link--logo, a[aria-label*="TradingView main page" i]');
        if (headerLogo && !headerLogo.__cr_branded_v6) {
          headerLogo.__cr_branded_v6 = true;
          headerLogo.setAttribute("aria-label", "ChartRead");
          headerLogo.title = "ChartRead";

          const iconSpan = headerLogo.querySelector(".tv-header__icon");
          if (iconSpan) {
            iconSpan.innerHTML = '<img class="chartread-nav-logo" src="' + CR_LOGO_URI + '" alt="ChartRead" />';
          }
          const textSpan = headerLogo.querySelector(".tv-header__logo-text");
          if (textSpan) {
            textSpan.innerHTML = '<span class="chartread-nav-text">Chart<span style="color:#00ff38;">Read</span></span>';
          }
        }

        // 3. In-Chart Hamburger Menu Header (clean ChartRead logo + text, NO clipped "Jltimate")
        document.querySelectorAll('span[class*="proPlanIcon"]').forEach((proIcon) => {
          if (proIcon.__cr_branded_v6) return;
          proIcon.__cr_branded_v6 = true;
          proIcon.innerHTML =
            '<img class="chartread-menu-logo" src="' + CR_LOGO_URI + '" alt="ChartRead" />' +
            '<span class="chartread-menu-title">Chart<span style="color:#00ff38;">Read</span></span>';
        });

        // 3b. Top-left chart menu button -> crisp ChartRead CR emblem pill
        const menuBtn = [...document.querySelectorAll(".layout__area--topleft button, .layout__area--top button")].find((b) => {
          const r = b.getBoundingClientRect();
          return r.width > 10 && r.x >= 0 && r.x < 48 && r.y >= 0 && r.y < 48;
        });
        if (menuBtn && !menuBtn.__cr_emblem_v7) {
          menuBtn.__cr_emblem_v7 = true;
          menuBtn.classList.add("chartread-top-menu-btn");
          menuBtn.setAttribute("title", "ChartRead Menu");
          const svg = menuBtn.querySelector("svg");
          if (svg && !menuBtn.querySelector(".chartread-top-emblem")) {
            svg.style.display = "none";
            const img = document.createElement("img");
            img.className = "chartread-top-emblem";
            img.src = CR_LOGO_URI;
            img.alt = "ChartRead";
            menuBtn.appendChild(img);
          }
        }

        // 4. Fix top-left avatar image (prevent broken image icon)
        document.querySelectorAll('img[class*="userPic"], img.js-userpic-mid').forEach((img) => {
          if (!img.getAttribute("src") || !img.complete || img.naturalWidth === 0) {
            img.src = CR_LOGO_URI;
            img.alt = "ChartRead";
          }
        });

        // 5. Footer logo replacement
        document.querySelectorAll('.logoWrapper-s9vf589d, a[class*="logoWrapper"]').forEach((footerLogo) => {
          if (footerLogo.__cr_branded_v6) return;
          footerLogo.__cr_branded_v6 = true;
          footerLogo.setAttribute("data-cr-branded", "true");
          footerLogo.innerHTML =
            '<div style="display:flex;align-items:center;gap:8px;">' +
              '<img src="' + CR_LOGO_URI + '" alt="ChartRead" style="width:26px;height:26px;border-radius:4px;filter:drop-shadow(0 0 6px rgba(0,255,56,0.6));" />' +
              '<span style="font-family:-apple-system,BlinkMacSystemFont,Trebuchet MS,Roboto,Ubuntu,sans-serif;font-weight:800;font-size:18px;color:#fff;">Chart<span style="color:#00ff38;">Read</span></span>' +
            '</div>';
        });

        // 6. Replace visible "TradingView" text nodes cleanly on homepage/chart
        if (document.body) {
          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          let node;
          while ((node = walker.nextNode())) {
            const val = node.nodeValue;
            if (val && /tradingview/i.test(val)) {
              const p = node.parentElement;
              if (p && p.tagName !== "SCRIPT" && p.tagName !== "STYLE" && p.tagName !== "TEXTAREA" && p.tagName !== "INPUT") {
                node.nodeValue = val.replace(/TradingView/gi, "ChartRead");
              }
            }
          }
        }

        // 7. Sanitize document.title
        if (document.title && /TradingView/i.test(document.title)) {
          document.title = document.title.replace(/TradingView/gi, "ChartRead");
        }
      } catch (e) {}
    };

    const isChartPage = location.pathname.startsWith("/chart");
    let domMutationAllowed = isChartPage;

    let sweepScheduled = false;
    const scheduleDomSweep = () => {
      if (!domMutationAllowed || sweepScheduled) return;
      sweepScheduled = true;
      requestAnimationFrame(() => {
        sweepScheduled = false;
        runDomSweep();
      });
    };

    const startObservers = () => {
      if (domMutationAllowed) runDomSweep();
      try {
        const obs = new MutationObserver((mutations) => {
          if (!domMutationAllowed) return;
          for (const m of mutations) {
            if (m.addedNodes && m.addedNodes.length > 0) {
              scheduleDomSweep();
              return;
            }
          }
        });
        obs.observe(document.documentElement, { childList: true, subtree: true });
      } catch (e) {}
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", startObservers, { once: true });
    } else {
      startObservers();
    }

    // On SSR pages (homepage, markets), wait until after React hydration completes to mutate text/DOM
    // (CSS already hides all banners, Black Friday promos, and GPT ads at 0ms without affecting hydration!)
    if (!isChartPage) {
      const enableAfterHydration = () => {
        setTimeout(() => {
          domMutationAllowed = true;
          runDomSweep();
        }, 900);
      };
      if (document.readyState === "complete") {
        enableAfterHydration();
      } else {
        window.addEventListener("load", enableAfterHydration, { once: true });
      }
    } else {
      window.addEventListener("load", scheduleDomSweep, { once: true });
    }
  } catch (e) {
    console.warn("[ChartRead] Main world setup error:", e);
  }
})();
\`;

    // Execute Main-World Script ONCE cleanly
    const injectMainWorld = () => {
      if (electron?.webFrame?.executeJavaScript) {
        try {
          electron.webFrame.executeJavaScript(mainWorldCode);
          return;
        } catch (e) {}
      }
      try {
        const s = document.createElement("script");
        s.textContent = mainWorldCode;
        (document.head || document.documentElement).appendChild(s);
        s.remove();
      } catch (e) {}
    };
    injectMainWorld();

    // 3. Single Crisp Watermark Injection (ONLY on .chart-gui-wrapper — ZERO duplicates!)
    let wmScheduled = false;
    const injectWatermarks = () => {
      wmScheduled = false;
      try {
        const isDark = document.documentElement.classList.contains("theme-dark") ||
                       document.body?.classList.contains("theme-dark") ||
                       window.matchMedia("(prefers-color-scheme: dark)").matches;
        const logoData = isDark ? DARK_WATERMARK_URI : LIGHT_WATERMARK_URI;

        // Clean any stray watermarks outside .chart-gui-wrapper
        document.querySelectorAll(".chart-widget > .chartread-chart-watermark, .chart-widget > .chartread-corner-logo").forEach((el) => el.remove());

        document.querySelectorAll(".chart-gui-wrapper").forEach((wrapper) => {
          if (!wrapper.querySelector(":scope > .chartread-chart-watermark")) {
            const wm = document.createElement("img");
            wm.className = "chartread-chart-watermark";
            wm.src = logoData;
            wm.alt = "ChartRead";
            if (getComputedStyle(wrapper).position === "static") wrapper.style.position = "relative";
            wrapper.appendChild(wm);
          }
          if (!wrapper.querySelector(":scope > .chartread-corner-logo")) {
            const corner = document.createElement("img");
            corner.className = "chartread-corner-logo";
            corner.src = logoData;
            corner.alt = "ChartRead";
            wrapper.appendChild(corner);
          }
        });
      } catch (e) {}
    };

    const scheduleWatermarks = () => {
      if (wmScheduled) return;
      wmScheduled = true;
      requestAnimationFrame(injectWatermarks);
    };

    const startWatermarkObserver = () => {
      injectWatermarks();
      try {
        const wmObs = new MutationObserver((mutations) => {
          for (const m of mutations) {
            if (m.addedNodes && m.addedNodes.length > 0) {
              scheduleWatermarks();
              return;
            }
          }
        });
        wmObs.observe(document.body || document.documentElement, { childList: true, subtree: true });
      } catch (e) {}
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", startWatermarkObserver, { once: true });
    } else {
      startWatermarkObserver();
    }

    // 4. Comprehensive CSS: Eradicate Banners, Offers, Black Friday, Copilot Hints, Watermarks & Notifications Badge
    const styleStr = \`
      /* Hide ALL Upgrade, GoPro, Trial, Black Friday, Cyber Monday, Promo & Offer UI */
      [data-name="go-pro-button"],
      a[href*="/pricing"],
      a[href*="/gopro"],
      a[href*="/black-friday"],
      a[href*="/cyber-monday"],
      article:has(a[href*="/black-friday"]),
      article:has(a[href*="/cyber-monday"]),
      article:has(a[href*="/pricing"]),
      article:has(a[href*="/gopro"]),
      [class*="card-"]:has(a[href*="/black-friday"]),
      [class*="card-"]:has(a[href*="/cyber-monday"]),
      [class*="promoCard" i],
      [class*="promoBanner" i],
      [id^="div-gpt-ad"],
      [id*="google_ads_iframe"],
      iframe[src*="googlesyndication"],
      iframe[src*="doubleclick"],
      [class*="card-"]:has([id^="div-gpt-ad"]),
      [class*="card-"]:has(iframe[src*="googlesyndication"]),
      [class*="card-"]:has(iframe[src*="doubleclick"]),
      [data-ad-unit],
      .tv-header-promo-backdrop,
      .js-main-page-promo,
      .js-offer-button,
      [class*="tv-header__offer-button"],
      [class*="desktopUpgrade-"],
      [class*="mobileUpgrade-"],
      [class*="blackFriday" i],
      [class*="black-friday" i],
      [class*="cyberMonday" i],
      [class*="cyber-monday" i],
      div[class*="pill-"][class*="blinkAnimation"],
      div[class*="trial-"],
      .tv-dialog--gopro,
      .tv-go-pro-dialog,
      div[class*="tv-dialog__modal-wrap--gopro"],
      div[data-dialog-name="gopro"],
      div[data-dialog-name="sign-in"],
      div[class*="banner-container"],
      div[class*="upgrade-badge"],
      [data-qa-id="ui-lib-HintWizard"],
      [data-role="hint"],
      span[class*="menuNotifications-"],
      div[class*="notifications-"] [class*="counter-"],
      [data-role="menuitem"][aria-label="Help"],
      [data-role="menuitem"][aria-label="What's new"],
      [data-role="menuitem"][aria-label="Log in"],
      [data-role="menuitem"][aria-label="Sign in"],
      div:has(> [data-role="menuitem"][aria-label="Help"]),
      div:has(> [data-role="menuitem"][aria-label="What's new"]),
      div:has(> [data-role="menuitem"][aria-label="Log in"]),
      div:has(> [data-role="menuitem"][aria-label="Sign in"]),

      /* Remove lock icons on indicators */
      [class*="lock-"],
      [class*="lockIcon"],
      [data-name*="lock"],
      div[role="row"] svg[class*="lock"],

      /* Hide Study Error Icons & Red Exclamation Marks */
      [class*="status-"][class*="error"],
      [class*="statusItem-"][class*="error"],
      [data-qa-id="legend-source-item"] [class*="error"],
      [class*="legend-"] [class*="error"],
      [class*="dataProblem"],
      [data-qa-id="legend-source-item"] [data-qa-id="legend-statuses-wrapper"],
      [data-qa-id="legend-source-item"] button[data-role="statuses-pill"],
      [data-qa-id="legend-source-item"] span[class*="statusItem-"],
      .statusesWrapper-quatTGAC,
      [data-qa-id="legend-source-item"] svg[class*="warning"],
      [data-qa-id="legend-source-item"] svg[class*="alert"],

      /* Hide TradingView watermarks, copyright & logos */
      [data-name="watermark"],
      [class*="watermark" i]:not(.chartread-chart-watermark),
      [class*="chartLogo" i],
      [class*="logoWrapper" i]:not([data-cr-branded]),
      [class*="brandWrapper" i],
      #tradingview-copyright,
      div[class*="chart-markup-table"] a[href*="tradingview"],
      table[class*="chart-markup-table"] a[href*="tradingview"],
      div[class*="layout__area--bottom"] a[href*="tradingview"],
      div[class*="bottom-widget-bar"] a[href*="tradingview"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }

      /* ChartRead Header & Menu Branding */
      .chartread-nav-logo {
        width: 30px !important;
        height: 30px !important;
        border-radius: 6px !important;
        filter: drop-shadow(0 0 8px rgba(0, 255, 56, 0.65)) !important;
        vertical-align: middle !important;
        margin-right: 8px !important;
      }
      .chartread-nav-text {
        font-family: -apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif !important;
        font-weight: 800 !important;
        font-size: 21px !important;
        letter-spacing: -0.4px !important;
        color: #ffffff !important;
        vertical-align: middle !important;
      }
      .chartread-menu-logo {
        width: 24px !important;
        height: 24px !important;
        border-radius: 5px !important;
        margin-right: 8px !important;
        vertical-align: middle !important;
        filter: drop-shadow(0 0 6px rgba(0, 255, 56, 0.55)) !important;
      }
      .chartread-menu-title {
        font-family: -apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif !important;
        font-weight: 800 !important;
        font-size: 16px !important;
        letter-spacing: -0.3px !important;
        color: #ffffff !important;
        vertical-align: middle !important;
      }
      span[class*="proPlanIcon"] {
        display: inline-flex !important;
        align-items: center !important;
      }
      img[class*="userPic"] {
        border-radius: 6px !important;
        object-fit: cover !important;
      }

      /* ChartRead Centered Watermark */
      .chartread-chart-watermark {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none !important;
        user-select: none !important;
        z-index: 1 !important;
        opacity: 0.14 !important;
        width: 210px !important;
        height: auto !important;
        display: block !important;
      }

      /* ChartRead Single Bottom-Left Corner Logo */
      .chartread-corner-logo {
        position: absolute;
        left: 14px !important;
        bottom: 28px !important;
        pointer-events: none !important;
        user-select: none !important;
        z-index: 5 !important;
        opacity: 0.72 !important;
        width: 58px !important;
        height: auto !important;
        display: block !important;
      }

      /* ================================================================
         ChartRead Obsidian-Emerald Workstation Redesign
         Distinctive institutional-dark surfaces & emerald active accents
         ================================================================ */
      :root {
        --tv-color-brand: #00FF38 !important;
        --tv-color-brand-hover: #2BFF5B !important;
        --tv-color-brand-active: #00C92E !important;
        --color-brand: #00FF38 !important;
        --color-brand-hover: #2BFF5B !important;
        --color-brand-active: #00C92E !important;
        --color-tv-blue-500: #00E858 !important;
        --color-tv-blue-600: #00C84B !important;
        --color-tv-blue-400: #33FF78 !important;
        --color-tv-blue-a100: rgba(0, 255, 56, 0.14) !important;
        --tv-color-toolbar-button-text-active: #00FF38 !important;
        --tv-color-toolbar-button-text-active-hover: #3BFF6A !important;
        --tv-color-item-active-text: #00FF38 !important;
        --tv-color-popup-element-text-active: #00FF38 !important;
      }

      html.theme-dark {
        --tv-color-platform-background: #06090F !important;
        --tv-color-pane-background: #0A0F19 !important;
        --tv-color-toolbar-button-background-hover: rgba(0, 255, 56, 0.10) !important;
        --tv-color-toolbar-button-background-expanded: rgba(0, 255, 56, 0.12) !important;
        --tv-color-toolbar-button-background-active: rgba(0, 255, 56, 0.16) !important;
        --tv-color-toolbar-button-background-active-hover: rgba(0, 255, 56, 0.22) !important;
        --tv-color-toolbar-divider-background: #1B2436 !important;
        --tv-color-popup-background: #0D1422 !important;
        --tv-color-popup-element-background-hover: rgba(0, 255, 56, 0.09) !important;
        --tv-color-popup-element-background-active: rgba(0, 255, 56, 0.16) !important;
        --themed-color-bg-primary: #0A0F19 !important;
        --themed-color-pane-bg: #0A0F19 !important;
        --themed-color-toolbar-bg: #0A0F19 !important;
        --themed-color-container-fill-primary-neutral-extra-bold: #06090F !important;
        --themed-color-container-fill-primary-neutral-bold: #0D1422 !important;
      }

      /* Top Toolbar & Top-Left Corner: Obsidian surface + signature emerald top accent bar */
      html.theme-dark .layout__area--top,
      html.theme-dark .layout__area--topleft {
        background: #0A0F19 !important;
        border-top: 2px solid rgba(0, 255, 56, 0.52) !important;
        border-bottom: 1px solid #182336 !important;
      }
      html.theme-dark .layout__area--top [class*="toolbar-"],
      html.theme-dark .layout__area--top [class*="inner-"],
      html.theme-dark .layout__area--topleft [class*="inner-"] {
        background: #0A0F19 !important;
      }

      /* Top-Left ChartRead CR Menu Emblem Button */
      .chartread-top-menu-btn {
        border-radius: 8px !important;
        padding: 3px !important;
        transition: transform 0.14s ease, box-shadow 0.16s ease !important;
      }
      .chartread-top-menu-btn:hover {
        transform: scale(1.04) !important;
        box-shadow: 0 0 12px rgba(0, 255, 56, 0.35) !important;
      }
      .chartread-top-emblem {
        width: 26px !important;
        height: 26px !important;
        border-radius: 7px !important;
        border: 1px solid rgba(0, 255, 56, 0.45) !important;
        display: block !important;
      }

      /* Rounded Pill Symbol Search, Indicators & Replay Controls */
      html.theme-dark #header-toolbar-symbol-search {
        background: #111928 !important;
        border: 1px solid #22304A !important;
        border-radius: 8px !important;
        margin: 4px 4px !important;
        height: 30px !important;
        padding: 0 10px !important;
        transition: border-color 0.16s ease, background 0.16s ease !important;
      }
      html.theme-dark #header-toolbar-symbol-search:hover {
        background: #152033 !important;
        border-color: rgba(0, 255, 56, 0.5) !important;
      }

      html.theme-dark .layout__area--top button,
      html.theme-dark .layout__area--left button,
      html.theme-dark .layout__area--right button,
      html.theme-dark .layout__area--bottom button {
        border-radius: 7px !important;
      }

      /* Replay Button: sleek emerald active pill instead of stark white */
      html.theme-dark #header-toolbar-replay[aria-pressed="true"],
      html.theme-dark #header-toolbar-replay[class*="isActive-"] {
        background: rgba(0, 255, 56, 0.15) !important;
        color: #00FF38 !important;
        border: 1px solid rgba(0, 255, 56, 0.5) !important;
        box-shadow: 0 0 12px rgba(0, 255, 56, 0.18) !important;
      }
      html.theme-dark #header-toolbar-replay[aria-pressed="true"] svg,
      html.theme-dark #header-toolbar-replay[class*="isActive-"] svg {
        color: #00FF38 !important;
      }

      /* Left Drawing Rail, Right Widget Bar & Bottom Bar: Cohesive Obsidian Slate */
      html.theme-dark .layout__area--left,
      html.theme-dark .layout__area--left [class*="drawingToolbar-"],
      html.theme-dark .layout__area--left [class*="inner-"],
      html.theme-dark .layout__area--right,
      html.theme-dark .layout__area--right [class*="widgetbar-"],
      html.theme-dark .layout__area--bottom,
      html.theme-dark .layout__area--bottom [class*="toolbar-"] {
        background: #0A0F19 !important;
      }
      html.theme-dark .layout__area--left {
        border-right: 1px solid #182336 !important;
      }
      html.theme-dark .layout__area--right {
        border-left: 1px solid #182336 !important;
      }
      html.theme-dark .layout__area--bottom {
        border-top: 1px solid #182336 !important;
      }

      /* Replace harsh white/blue active states on drawing rail with refined emerald pill */
      html.theme-dark .layout__area--left [class*="isActive-"],
      html.theme-dark .layout__area--left [aria-pressed="true"] {
        background: rgba(0, 255, 56, 0.16) !important;
        color: #00FF38 !important;
        box-shadow: inset 0 0 0 1px rgba(0, 255, 56, 0.42) !important;
      }
      html.theme-dark .layout__area--left [class*="isActive-"] *,
      html.theme-dark .layout__area--left [aria-pressed="true"] * {
        background-color: transparent !important;
        color: #00FF38 !important;
      }

      /* Floating Bar Replay Control Dock */
      html.theme-dark [class*="replayToolbar-"],
      html.theme-dark [data-name="replay-toolbar"] {
        background: #0D1422 !important;
        border: 1px solid rgba(0, 255, 56, 0.28) !important;
        border-radius: 11px !important;
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.55) !important;
      }

      /* Dialogs, Indicators Search Modal & Context Menus */
      html.theme-dark [data-dialog-name],
      html.theme-dark [class*="dialog-"][role="dialog"],
      html.theme-dark [data-name="menu-inner"],
      html.theme-dark [class*="menuBox-"] {
        background: #0D1422 !important;
        border: 1px solid #1E2B42 !important;
        border-radius: 12px !important;
        box-shadow: 0 18px 48px rgba(0, 0, 0, 0.65) !important;
      }
      /* Replace TradingView's default blue selection highlight in Indicators & menus with ChartRead emerald */
      html.theme-dark [data-dialog-name] [data-role="list-item"][class*="selected-"],
      html.theme-dark [data-dialog-name] [data-role="list-item"]:hover,
      html.theme-dark [data-role="menuitem"]:hover {
        background: rgba(0, 255, 56, 0.11) !important;
      }
      html.theme-dark [data-dialog-name] input:focus,
      html.theme-dark [data-dialog-name] [class*="focused-"] {
        border-color: rgba(0, 255, 56, 0.65) !important;
        box-shadow: 0 0 0 2px rgba(0, 255, 56, 0.14) !important;
      }

      /* Sleek ChartRead Ultra-Thin Dark Scrollbars */
      html.theme-dark ::-webkit-scrollbar {
        width: 6px !important;
        height: 6px !important;
      }
      html.theme-dark ::-webkit-scrollbar-track {
        background: #080C14 !important;
      }
      html.theme-dark ::-webkit-scrollbar-thumb {
        background: #233049 !important;
        border-radius: 999px !important;
      }
      html.theme-dark ::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 255, 56, 0.55) !important;
      }
    \`;

    if (electron?.webFrame?.insertCSS) {
      electron.webFrame.insertCSS(styleStr);
    }
  } catch (err) {
    console.warn("ChartRead platform-preload v6 error:", err);
  }
})();

//# sourceMappingURL=platform-preload.js.map
`;

function patchPreload(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn('Skipping missing file:', filePath);
    return false;
  }
  const existing = fs.readFileSync(filePath, 'utf8');
  const firstNewline = existing.indexOf('\n');
  if (firstNewline === -1) {
    console.error('Unexpected format in:', filePath);
    return false;
  }
  const electronTvdHeader = existing.slice(0, firstNewline);
  const output = electronTvdHeader + '\n\n' + injectorCode.trimStart();
  fs.writeFileSync(filePath, output, 'utf8');
  console.log(`✅ Built optimized preload v6 (${output.length} bytes): ${filePath}`);
  return true;
}

const preloadTargets = [
  path.join(ROOT, 'preload', 'platform-preload.js'),
  path.join(ROOT, 'runtime', 'resources', 'app', 'preload', 'platform-preload.js')
];

let allOk = true;
for (const target of preloadTargets) {
  if (fs.existsSync(target)) {
    if (!patchPreload(target)) allOk = false;
  }
}

if (allOk) {
  console.log('\n🎯 ChartRead preload v6 built & synced successfully!');
} else {
  process.exit(1);
}
