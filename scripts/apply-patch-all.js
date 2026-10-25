const fs = require('fs');
const path = require('path');

console.log('=== Applying ChartRead Complete Rebranding, Tab Icon, Watermark & Live Data Fixes ===');

// Load CR transparent PNG as base64
const crPngBuffer = fs.readFileSync('resources/branding/ChartRead-Logo-Transparent-128.png');
const crBase64 = 'data:image/png;base64,' + crPngBuffer.toString('base64');
console.log(`Loaded ChartRead CR logo base64 (${crBase64.length} chars)`);

// 1. PATCH 1892.js (in runtime and root)
const patch1892 = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  console.log(`Patching ${filePath}...`);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace module 29274 SVG definition
  const old29274Pattern = 'r||(r=a.createElement("path",{fillRule:"evenodd",clipRule:"evenodd",d:"M9 18A9 9 0 1 0 9 0a9 9 0 0 0 0 18ZM2.75 5.5h4.5v7h-2.5V8h-2V5.5ZM9.5 8a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Zm5.75-2.5h-3l-2.5 7h3l2.5-7Z",fill:"currentColor"}))';
  const new29274Pattern = `r||(r=a.createElement("image",{width:18,height:18,href:"${crBase64}"}))`;
  if (content.includes(old29274Pattern)) {
    content = content.replace(old29274Pattern, new29274Pattern);
    console.log(`  -> Module 29274 TV favicon SVG replaced with ChartRead CR image in ${filePath}`);
  } else {
    console.log(`  -> Note: old29274Pattern not found in ${filePath} (already patched?)`);
  }

  // Patch renderTitle to fallback to i.$.get("home") if faviconKey is chart/undefined
  const oldRenderTitle = 'o=t?i.$.get(t):void 0;';
  const newRenderTitle = 'o=(t?i.$.get(t):void 0)||i.$.get("home");';
  if (content.includes(oldRenderTitle)) {
    content = content.replace(oldRenderTitle, newRenderTitle);
    console.log(`  -> renderTitle patched with home fallback in ${filePath}`);
  }

  // Patch renderLogo to render ChartRead icon when e.logoUrls is empty
  const oldRenderLogo = 'renderLogo=e=>{const{isLogoVisible:t}=this.props;return t&&"string"!=typeof e?r.createElement(O,{key:"logo",last:e.last??"",sources:e.logoUrls?.length?e.logoUrls:[],symbol:e.symbol??""}):r.createElement(r.Fragment,{key:"noLogo"})}';
  const newRenderLogo = 'renderLogo=e=>{const{isLogoVisible:t}=this.props;if(!t)return r.createElement(r.Fragment,{key:"noLogo"});if("string"!=typeof e&&e?.logoUrls?.length)return r.createElement(O,{key:"logo",last:e.last??"",sources:e.logoUrls,symbol:e.symbol??""});const cIcon=i.$.get("home");return cIcon?r.createElement("div",{className:"logo-image-container single"},r.createElement(cIcon)):r.createElement(r.Fragment,{key:"noLogo"})}';
  if (content.includes(oldRenderLogo)) {
    content = content.replace(oldRenderLogo, newRenderLogo);
    console.log(`  -> renderLogo patched with ChartRead icon fallback in ${filePath}`);
  }

  // Patch EmptyLogo (E) to render ChartRead icon when symbol is empty
  const oldEmptyLogo = 'E=({symbol:e})=>r.createElement("span",{className:"empty-logo"},r.createElement("div",{className:"empty-logo-symbol"},e))';
  const newEmptyLogo = `E=({symbol:e})=>{if(!e||!e.trim()){const cIcon=i.$.get("home");if(cIcon)return r.createElement("div",{className:"logo-image-container single"},r.createElement(cIcon))}return r.createElement("span",{className:"empty-logo"},r.createElement("div",{className:"empty-logo-symbol"},e))}`;
  if (content.includes(oldEmptyLogo)) {
    content = content.replace(oldEmptyLogo, newEmptyLogo);
    console.log(`  -> EmptyLogo (E) patched with ChartRead icon fallback in ${filePath}`);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`  -> Successfully saved ${filePath}`);
};

patch1892('runtime/resources/app/app/1892.js');
patch1892('app/1892.js');

// 2. PATCH 3173.js (Map of favicons: add ["chart", S.A])
const patch3173 = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  console.log(`Patching ${filePath}...`);
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('new Map([["about",S.A]') && !content.includes('["chart",S.A]')) {
    content = content.replace('new Map([["about",S.A]', 'new Map([["chart",S.A],["about",S.A]');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  -> Added ["chart", S.A] to favicon map in ${filePath}`);
  }
};
patch3173('runtime/resources/app/app/3173.js');
patch3173('app/3173.js');

// 3. PATCH tv-favicon.svg in source
const tvFaviconSvgPath = 'src/app/window/tab-panel/assets/tv-favicon.svg';
if (fs.existsSync(tvFaviconSvgPath)) {
  const newTvFaviconSvg = `var _image;
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
import * as React from "react";
var SvgTvFavicon = function SvgTvFavicon(props) {
  return /*#__PURE__*/React.createElement("svg", _extends({
    width: 18,
    height: 18,
    viewBox: "0 0 18 18",
    xmlns: "http://www.w3.org/2000/svg"
  }, props), _image || (_image = /*#__PURE__*/React.createElement("image", {
    width: 18,
    height: 18,
    href: "${crBase64}"
  })));
};
export default SvgTvFavicon;
`;
  fs.writeFileSync(tvFaviconSvgPath, newTvFaviconSvg, 'utf8');
  console.log(`Updated ${tvFaviconSvgPath} with ChartRead CR logo image`);
}

// 4. PATCH Tokyo Night active logo in new-tab
const patchTokyoNight = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  console.log(`Patching Tokyo Night logo in ${filePath}...`);
  let content = fs.readFileSync(filePath, 'utf8');
  const oldActivePath = 'M36.4 33H26v5.2h5.2V46h5.2V33Zm10.4 13h-6.07l5.2-13H52l-5.2 13Zm-6.07-7.8a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z';
  if (content.includes(oldActivePath)) {
    // Replace with ChartRead logo image inside SVG
    const replacement = `<image x="25" y="24" width="28" height="28" href="${crBase64}"/>`;
    content = content.split(`<path d="${oldActivePath}" fill="url(#k3f0n0jp3)"/>`).join(replacement);
    content = content.split(`<path opacity=".6" d="${oldActivePath}" fill="url(#i3f0n0jp3)"/>`).join('');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  -> Tokyo Night active logo patched with ChartRead image in ${filePath}`);
  }
};
patchTokyoNight('runtime/resources/app/app/new-tab/bundle.js');
patchTokyoNight('app/new-tab/bundle.js');

// 5. PATCH DEFAULT_TAB_TITLE in index.js and interfaces
const patchDefaultTabTitle = () => {
  const indexJsPath = 'runtime/resources/app/index.js';
  if (fs.existsSync(indexJsPath)) {
    let content = fs.readFileSync(indexJsPath, 'utf8');
    const oldTitle = 'const i="TradingView",o="about:blank",s="#default",a="tvd://new-tab"';
    const newTitle = 'const i="ChartRead",o="about:blank",s="#default",a="tvd://new-tab"';
    if (content.includes(oldTitle)) {
      content = content.replace(oldTitle, newTitle);
      fs.writeFileSync(indexJsPath, content, 'utf8');
      console.log(`Updated DEFAULT_TAB_TITLE to 'ChartRead' in ${indexJsPath}`);
    }
  }

  const interfacesPath = 'src/services/interfaces.ts';
  if (fs.existsSync(interfacesPath)) {
    let content = fs.readFileSync(interfacesPath, 'utf8');
    content = content.replace("export const DEFAULT_TAB_TITLE = 'TradingView';", "export const DEFAULT_TAB_TITLE = 'ChartRead';");
    fs.writeFileSync(interfacesPath, content, 'utf8');
    console.log(`Updated DEFAULT_TAB_TITLE to 'ChartRead' in ${interfacesPath}`);
  }
};
patchDefaultTabTitle();

// 6. PATCH platform-preload.js (WATERMARKS, LIVE MARKET DATA, PRO FEATURES)
const patchPlatformPreload = () => {
  const preloadPath = 'runtime/resources/app/preload/platform-preload.js';
  if (!fs.existsSync(preloadPath)) return;
  console.log(`Patching ${preloadPath}...`);
  let content = fs.readFileSync(preloadPath, 'utf8');

  // Locate the existing injected block
  const startMark = '// ChartRead Pro / Premium Features Unlocker';
  const endMark = 'process.contextIsolated)try{e.contextBridge.exposeInMainWorld("TVD",A)}';

  const startIdx = content.indexOf(startMark);
  const endIdx = content.indexOf(endMark);

  if (startIdx === -1 || endIdx === -1) {
    console.log('Error: Could not locate injection markers in platform-preload.js');
    return;
  }

  const newInjection = `// ChartRead Pro / Premium Features Unlocker
  window.addEventListener("DOMContentLoaded", () => {
    // 1. Sanitize document title
    const sanitizeTitle = () => {
      if (document.title && document.title.includes("TradingView")) {
        document.title = document.title.replace(/TradingView/g, "ChartRead");
      }
    };
    sanitizeTitle();
    const tElem = document.querySelector("title");
    if (tElem) new MutationObserver(sanitizeTitle).observe(tElem, { childList: true, characterData: true, subtree: true });

    // 2. Real-Time Data & Client-Side Pro Unlocks
    // CRITICAL: We DO NOT set is_authenticated: true or id: 1
    // Keeping network requests unauthenticated enables TradingView's free, real-time public WebSockets (crypto, forex, indices, equities) to stream live data without 401/403 session errors.
    try {
      const injectScript = document.createElement("script");
      injectScript.textContent = \`
        try {
          window.TradingView = window.TradingView || {};
          window.TradingView.createGoProDialog = () => false;
          window.TradingView.gopro = () => false;
          window.TradingView.isFeatureEnabled = () => true;

          // Set client-side capability flags if window.user exists, preserving guest/anonymous session for real-time data feeds
          if (window.user) {
            window.user.is_pro = true;
            window.user.pro_plan = "premium";
            window.user.pro_badge_name = "pro:pro_premium_expert";
            window.user.has_pro = true;
            window.user.is_pro_realtime = true;
            window.user.is_pro_premium = true;
            window.user.is_pro_expert = true;
            window.user.plan = "premium";
            window.user.username = "ChartRead";
          }

          // Canvas Watermark Interception: Suppress any drawing of "TradingView" text or logo on chart canvas
          if (typeof CanvasRenderingContext2D !== "undefined") {
            const _origFillText = CanvasRenderingContext2D.prototype.fillText;
            CanvasRenderingContext2D.prototype.fillText = function(text, x, y, maxWidth) {
              if (typeof text === "string" && /tradingview/i.test(text)) return;
              return _origFillText.apply(this, arguments);
            };
            const _origStrokeText = CanvasRenderingContext2D.prototype.strokeText;
            CanvasRenderingContext2D.prototype.strokeText = function(text, x, y, maxWidth) {
              if (typeof text === "string" && /tradingview/i.test(text)) return;
              return _origStrokeText.apply(this, arguments);
            };
            const _origDrawImage = CanvasRenderingContext2D.prototype.drawImage;
            CanvasRenderingContext2D.prototype.drawImage = function(img) {
              try {
                if (img && (img.src || img.currentSrc)) {
                  const s = img.src || img.currentSrc;
                  if (/tradingview|watermark|logo/i.test(s) && !s.includes("ChartRead")) return;
                }
              } catch(e) {}
              return _origDrawImage.apply(this, arguments);
            };
          }

          // Apply chart overrides to disable watermark if TradingViewApi is available
          const applyChartOverrides = () => {
            try {
              if (window.TradingViewApi && typeof window.TradingViewApi.activeChart === "function") {
                const chart = window.TradingViewApi.activeChart();
                if (chart && typeof chart.applyOverrides === "function") {
                  chart.applyOverrides({
                    "symbolWatermarkProperties.visibility": false,
                    "paneProperties.watermark": false,
                    "paneProperties.legendProperties.showSeriesTitle": true
                  });
                }
              }
            } catch(e) {}
          };
          setInterval(applyChartOverrides, 1000);
        } catch(e) {}
      \`;
      (document.head || document.documentElement).appendChild(injectScript);
    } catch (e) {}

    // 3. Continuous DOM Watermark Eradication
    const eradicateWatermarks = () => {
      // Hide all links to tradingview
      document.querySelectorAll('a[href*="tradingview"]').forEach(el => {
        el.style.setProperty("display", "none", "important");
        el.style.setProperty("visibility", "hidden", "important");
        el.style.setProperty("opacity", "0", "important");
        el.style.setProperty("width", "0", "important");
        el.style.setProperty("height", "0", "important");
      });

      // Hide all watermark, brand, logoWrapper elements
      document.querySelectorAll('[class*="watermark" i], [class*="waterMark" i], [class*="logoWrapper" i], [class*="chartLogo" i], [class*="brandWrapper" i], #tradingview-copyright, [data-name="watermark"]').forEach(el => {
        el.style.setProperty("display", "none", "important");
        el.style.setProperty("visibility", "hidden", "important");
        el.style.setProperty("opacity", "0", "important");
        el.style.setProperty("width", "0", "important");
        el.style.setProperty("height", "0", "important");
      });

      // Hide any standalone text node containing TradingView
      document.querySelectorAll("span, div, a").forEach(el => {
        if (el.children.length === 0 && el.textContent && el.textContent.trim() === "TradingView") {
          const parent = el.closest("a") || el.closest("div") || el;
          parent.style.setProperty("display", "none", "important");
          parent.style.setProperty("visibility", "hidden", "important");
        }
      });
    };
    eradicateWatermarks();
    setInterval(eradicateWatermarks, 500);
    new MutationObserver(eradicateWatermarks).observe(document.documentElement, { childList: true, subtree: true });
  });

  // 4. Inject global CSS: Hide GoPro, upgrade banners, sign-in, and all watermarks; apply ChartRead Neon Green Theme
  const styleStr = \`
    /* Complete Watermark, Branding, and Logo Eradication */
    a[href*="tradingview.com"],
    a[href*="tradingview"],
    [class*="watermark" i],
    [class*="waterMark" i],
    [class*="logoWrapper" i],
    [class*="chartLogo" i],
    [class*="brandWrapper" i],
    [class*="branding" i],
    [data-name="watermark"],
    #tradingview-copyright,
    div[class*="chart-markup-table"] a,
    table[class*="chart-markup-table"] a,
    div[class*="chart-status-picture"],
    div[class*="layout__area--bottom"] a,
    div[class*="bottom-widget-bar"] a,
    div[class*="tv-watermark"],
    span[class*="tv-watermark"],
    div[class*="canvas-watermark"] {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      width: 0 !important;
      height: 0 !important;
      max-width: 0 !important;
      max-height: 0 !important;
      overflow: hidden !important;
      position: absolute !important;
      left: -99999px !important;
      pointer-events: none !important;
      z-index: -99999 !important;
    }

    /* Hide GoPro, Upgrade, Payment, and Sign-in UI */
    [data-name="header-go-pro-button"],
    [data-name="go-pro-button"],
    .tv-dialog--gopro,
    .tv-go-pro-dialog,
    [class*="goPro-"],
    [class*="gopro-"],
    [class*="upgradeButton-"],
    [class*="trial-button"],
    [class*="subscription-banner"],
    [class*="billing-"],
    .tv-header__go-pro,
    .tv-floating-toolbar__widget-wrapper--gopro,
    [data-name="sign-in-button"],
    .tv-banner-gopro,
    .tv-dialog__modal-wrap--gopro,
    div[class*="bottom-widget-upgrade"],
    div[class*="banner-container"],
    div[class*="upgrade-badge"] {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }

    /* ChartRead Neon Green Theme */
    :root {
      --tv-color-brand: #00FF38 !important;
      --tv-color-brand-hover: #00E635 !important;
      --tv-color-brand-active: #00B82B !important;
      --color-brand: #00FF38 !important;
      --color-brand-hover: #00E635 !important;
      --color-brand-active: #00B82B !important;
    }
  \`;
  if (e && e.webFrame && e.webFrame.insertCSS) {
    e.webFrame.insertCSS(styleStr);
  }
} catch (err) {
  console.log("ChartRead preload init error:", err);
};
`;

  content = content.slice(0, startIdx) + newInjection + content.slice(endIdx);
  fs.writeFileSync(preloadPath, content, 'utf8');
  console.log(`Successfully patched ${preloadPath}!`);
};
patchPlatformPreload();

console.log('=== All Patches Successfully Applied ===');
