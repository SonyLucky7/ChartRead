(()=>{"use strict";const e=require("electron");var t,n;if(function(e){e[e.Classic=1]="Classic",e[e.Protocol=2]="Protocol",e[e.Both=3]="Both"}(t||(t={})),function(e){e.RENDERER_START="sentry-electron.renderer-start",e.EVENT="sentry-electron.event",e.SCOPE="sentry-electron.scope",e.ENVELOPE="sentry-electron.envelope",e.STATUS="sentry-electron.status",e.ADD_METRIC="sentry-electron.add-metric"}(n||(n={})),window.__SENTRY_IPC__)console.log("Sentry Electron preload has already been run");else{const t={sendRendererStart:()=>e.ipcRenderer.send(n.RENDERER_START),sendScope:t=>e.ipcRenderer.send(n.SCOPE,t),sendEvent:t=>e.ipcRenderer.send(n.EVENT,t),sendEnvelope:t=>e.ipcRenderer.send(n.ENVELOPE,t),sendStatus:t=>e.ipcRenderer.send(n.STATUS,t),sendAddMetric:t=>e.ipcRenderer.send(n.ADD_METRIC,t)};if(window.__SENTRY_IPC__=t,e.contextBridge)try{e.contextBridge.exposeInMainWorld("__SENTRY_IPC__",t)}catch(e){}}const r="tvd:debug-auto-save-dialog",o="tvd:screen-capture";class s{key;rules;constructor(e,t){this.key=e,this.rules=t}applyRules(t){const n=t??this.rules;if(!n)return;const r=localStorage.getItem(this.key);r&&e.webFrame.removeInsertedCSS(r);const o=e.webFrame.insertCSS(n);localStorage.setItem(this.key,o)}removeRules(){const t=localStorage.getItem(this.key);t&&e.webFrame.removeInsertedCSS(t)}}function a(e){let t,n=e;return()=>{if(n){const e=n;n=void 0,t=e()}return t}}require("url");const i="TARGET_TVD_HOST",c="https://www.tradingview.com/",d=a((()=>{const e="http(s?):\\/\\/((\\w|-)*\\.)?tradingview\\.com";let t=c;return i in process.env&&(t=process.env[i]??c),null!==new RegExp(e,"i").exec(t)?e:(t.endsWith("/")&&(t=t?.substring(0,t.length-1)),t.replace(/\./gi,"\\.").replace(/\//gi,"\\/"))}));function l(e,t=!0){const n=e=>{let n=e.toString().replace(/\./gi,"\\.").replace(/(?<!\))\*/gi,"(.*)");return n.match(/\w+(\/\((\.\*\)))/gi)&&(n=n.replace(/\/\((\.\*\))/gi,"(/(.*))?")),n=n.replace(/\//gi,"\\/").replace(/\$\{TV\}/gi,d()),n=`^${n}${t?"$":""}`,new RegExp(n,"i")};return"string"==typeof e?n(e):e.map(n)}const p="${TV}/chart/([a-zA-Z0-9]{0,12})?/?",v="${TV}/(\\w|-)*screener/*",u="${TV}/chart/[a-z0-9-._~:\\?#@!$&'()*+,;%=]+/[a-z0-9-._~:\\?#@!$&'()*+,;%=]+/",g=(a((()=>l(v))),a((()=>l("${TV}/",!0))),a((()=>l("${TV}/chart/",!0))),a((()=>l(p))),a((()=>l("(${TV}/chart/([a-zA-Z0-9]{0,12})?)/\\?*?"))),a((()=>l(u,!0))),a((()=>l("${TV}/screener/*"))),a((()=>l("${TV}/heatmap/*"))),a((()=>l("${TV}/community/*"))),a((()=>l("${TV}/pine-script-docs/en/v5/Introduction.html"))),a((()=>l("${TV}/pine-script-reference/v5/"))),a((()=>l("${TV}/x/*"))),a((()=>l("${TV}/*"))),a((()=>l("${TV}/account-recovery/*"))),a((()=>l("${TV}/chat/*"))),a((()=>/:\/\/s3\..+\/snapshots\//i)),a((()=>l("${TV}/pine/*"))),a((()=>l("${TV}/markets/*"))),a((()=>l("${TV}/markets/*/news/"))),a((()=>l("${TV}/markets/stocks-*/*")))),h=(a((()=>l("${TV}/markets/world-economy/*"))),a((()=>l("${TV}/u/TradingView/"))),a((()=>l("${TV}/news/*"))),a((()=>l("${TV}/news/"))),a((()=>l("${TV}/news/\\?market=*"))),a((()=>l("${TV}/news/\\?market=topstories"))),a((()=>l("${TV}/HTML5-stock-forex-bitcoin-charting-library/"))),a((()=>l("${TV}/support/*"))),a((()=>l("https://status.tradingview.com/",!0))),a((()=>l("${TV}/ideas/*"))),a((()=>l("${TV}/scripts/*"))),a((()=>l(["${TV}/","${TV}/ideas/*",u,"${TV}/scripts/*","${TV}/script/*","${TV}/community/*","${TV}/widget/","${TV}/markets/corporate-bonds/*","${TV}/social-network/","${TV}/the-leap/*","${TV}/broker/*","${TV}/data-coverage/","${TV}/markets/stocks-*/*"])))),m=a((()=>l("${TV}/markets/bonds/*")));function b(e,t){const n=e.split("\n").join("");return t instanceof RegExp?t.test(n):t.some((e=>e.test(n)))}a((()=>l([p,v,"${TV}/markets/*","${TV}/symbols/*","${TV}/(\\w|-)*calendar/*"])));const w=window.location.href,T=`\n\t.tv-market-heatmap__standalone-title-wrap,\n\t.tv-screener__standalone-title-wrap,\n\t.tv-footer {\n\t\tdisplay: none !important;\n\t}\n\n\t${k=w,b(k,h())?"":".tv-header { display: none !important; }"}\n\n\t${function(e){return b(e,g())}(w)?"":'.tv-economic-calendar [class^="separator"],\n\t\t.tv-content [class^="container"] [class^="marketHeader"],\n\t\t.tv-content .tv-category__tab-page [class^="marketHeader"],\n\t\t.tv-sticky-symbol-header,\n\t\t.tv-screener-toolbar {\n\t\t\ttop: 0 !important;\n\t\t}'}\n\n\t.tv-content .tv-category__tab-page [class^="shadow"] [class^="tableWrapSticky"] {\n\t\ttop: 58px !important;\n\t}\n\n\t.tv-content .tv-economy-country-tab [class^="table"] [class^="stickyContainer"],\n\t.tv-content .tv-economy-indicator-tab [class^="table"] [class^="stickyContainer"] {\n\t\ttop: -1px !important;\n\t}\n\n\t.tv-content [class^="container"] [class^="shadow"] [class^="tableWrapSticky"] {\n\t\ttop: ${function(e){return b(e,m())}(w)?"-1px":"58px"}\n\t}\n\n\t.tv-category__tab-page.tv-card-exterior > .screener-markets-page-container > div {\n\t\t--screener-sticky-offset-top: 63px !important;\n\t}\n\n\t.tv-screener__standalone-wrap {\n\t\tpadding: 0 !important;\n\t}\n\n\t.i-hidden-on-tvdesktop {\n\t\tdisplay: none !important;\n\t}\n`;var k;const y="tvd:session-storage",R={initCachedStoreSync:`${y}:init-cached-store-sync`,setItem:`${y}:set-item`,clear:`${y}:clear`,removeItem:`${y}:remove-item`},V=new class{#e=null;getLength(){return this.ensureLoaded().size}setItem(t,n){this.ensureLoaded().set(t,n),e.ipcRenderer.send(R.setItem,t,n)}getItem(e){return this.ensureLoaded().get(e)??null}removeItem(t){this.ensureLoaded().delete(t),e.ipcRenderer.send(R.removeItem,t)}clear(){this.ensureLoaded().clear(),e.ipcRenderer.send(R.clear)}ensureLoaded(){if(null!==this.#e)return this.#e;try{const n=e.ipcRenderer.sendSync(R.initCachedStoreSync);if(t=n,Array.isArray(t)&&t.every((e=>Array.isArray(e)&&2===e.length&&"string"==typeof e[0]&&"string"==typeof e[1])))return this.#e=new Map(n),this.#e}catch(e){console.log("TVD.sessionStorage cachedStorage init request failed with error: ",e)}var t;return this.#e=new Map,this.#e}},$={getLength:function(){return V.getLength()},setItem:function(e,t){V.setItem(String(e),String(t))},getItem:function(e){return V.getItem(String(e))},removeItem:function(e){V.removeItem(String(e))},clear:function(){V.clear()}},f={updateLinkValues(t){e.ipcRenderer.send("tvd:update-link-values",t)}},S={getDesktopStream:async()=>await e.ipcRenderer.invoke("tvd:get-screen"),async getCurrentCameraDevice(){const t=await e.ipcRenderer.invoke("tvd:get-camera");if(t)return A.findMediaDevice(t.label,"videoinput")},async getCurrentAudioDevice(){const t=await e.ipcRenderer.invoke("tvd:get-audio");if(t)return A.findMediaDevice(t.label,"audioinput")},async findMediaDevice(e,t){const n=await navigator.mediaDevices.enumerateDevices();return n.find((n=>n.label===e&&n.kind===t))?.deviceId},startedScreenCapture(){let t="";window&&(t=window.location.href),e.ipcRenderer.send(o,!0,t)},stoppedScreenCapture(){let t="";window&&(t=window.location.href),e.ipcRenderer.send(o,!1,t)}},E={setTitle(t){e.ipcRenderer.send("tvd:set-title",t)},reloadTab(){e.ipcRenderer.send("tvd:reload-tab")},layoutChange(t){e.ipcRenderer.send("tvd:layout-change",t)},getActiveWatchlistId:()=>e.ipcRenderer.invoke("tvd:get-watchlist"),onActiveWatchlistIdChange(t){e.ipcRenderer.send("tvd:watchlist-change",t)},layoutRestored(){e.ipcRenderer.send("tvd:layout-restored")},setFocusPineEditor(t){e.ipcRenderer.send("tvd:focus-pine-editor",t)}},x={setNotification(t){e.ipcRenderer.send("tvd:set-notification",t)},setNotificationViewed(){e.ipcRenderer.send("tvd:set-notification-viewed")}},_={setCredentials:t=>e.ipcRenderer.invoke("tvd:set-credentials",t),getCredentials:()=>e.ipcRenderer.invoke("tvd:get-credentials"),insertCredentialsText:t=>e.ipcRenderer.invoke("tvd:native-input-string",t)},I={setLocale(t){e.ipcRenderer.send("tvd-main:set-locale",t)},getTheme:()=>e.ipcRenderer.invoke("tvd:get-theme"),getThemeSetting:()=>e.ipcRenderer.invoke("tvd:get-theme-setting"),setThemeSetting(t){e.ipcRenderer.send("tvd:set-theme-setting",t)},getReports:async()=>await e.ipcRenderer.invoke("tvd:get-reports"),signIn(){e.ipcRenderer.send("tvd-main:initiate-sign-in")},openSettings(t){e.ipcRenderer.send("tvd:open-settings",t)},openNewWindow(t,n,r){e.ipcRenderer.send("tvd:open-new-window",t,n,r)},log(t){e.ipcRenderer.invoke("tvd:log",t)},sendToSentry(t){e.ipcRenderer.invoke("tvd:send-to-sentry-breadcrumb",t)},crosshairSyncEnabled:function(){let t=!0;const n=new Map,r=e=>{t!==e&&(t=e,o())},o=()=>{n.forEach((e=>e(t)))};return e.ipcRenderer.invoke("tvd:get-crosshair-sync").then((e=>{r(e)})).catch((e=>console.log(e))),e.ipcRenderer.on("tvd:crosshair-sync-setting-update",((e,t)=>{r(t)})),{value:()=>t,subscribe(e){const t=self.crypto.randomUUID();return n.set(t,e),t},unsubscribe(e){n.has(e)&&n.delete(e)}}}(),sessionStorage:$},A={...S,...E,...x,..._,...I,...{openAutosaveDialogDebug(){e.ipcRenderer.send(r,!0)},closeAutosaveDialogDebug(){e.ipcRenderer.send(r,!1)},errorAutosaveDialogDebug(){e.ipcRenderer.send(r,!1,!0)}},contracts:{link:{OpenExternal:"OpenExternal"}},linkingApi:f};if(function(t){if("darwin"===process.platform)return;const n=new s("scrollbarTheme"),r=e=>{const t="light"===e?"\n\t* {\n\t\t--scrollbar-thumb-default: #D1D4DC;\n\t\t--scrollbar-thumb-hover: #B2B5BE;\n\t\t--scrollbar-thumb-active: #9598A1;\n\t\t--scrollbar-track: #FFFFFF;\n\t\t--scrollbar-track-border: #E0E3EB;\n\t}\n\n":"\n\t* {\n\t\t--scrollbar-thumb-default: #50535E;\n\t\t--scrollbar-thumb-hover: #868993;\n\t\t--scrollbar-thumb-active: #A3A6AF;\n\t\t--scrollbar-track: #131722;\n\t\t--scrollbar-track-border: #2A2E39;\n\t}\n\n";n.applyRules(t+"\n\t::-webkit-scrollbar {\n\t\twidth: 9px;\n\t\theight: 9px;\n\t}\n\n\t::-webkit-scrollbar-thumb {\n\t\tbox-sizing: border-box;\n\t\tborder: 2px solid transparent;\n\t\tbox-shadow: inset 0 0 10px 10px var(--scrollbar-thumb-default);\n\t\tborder-radius: 8px;\n\t\tbackground-color: unset;\n\t}\n\n\t::-webkit-scrollbar-thumb:hover {\n\t\tbox-shadow: inset 0 0 10px 10px var(--scrollbar-thumb-hover);\n\t}\n\n\t::-webkit-scrollbar-thumb:active {\n\t\tbox-shadow: inset 0 0 10px 10px var(--scrollbar-thumb-active);\n\t}\n\n\t::-webkit-scrollbar-track {\n\t\tborder-radius: unset;\n\t\tpadding: 2px;\n\t\tbackground-color: var(--scrollbar-track);\n\t}\n\n\t::-webkit-scrollbar-track:vertical {\n\t\tborder-left: 1px solid var(--scrollbar-track-border);\n\t}\n\n\t::-webkit-scrollbar-track:horizontal {\n\t\tborder-top: 1px solid var(--scrollbar-track-border);\n\t}\n\n\t::-webkit-scrollbar-corner {\n\t\tdisplay: none;\n\t}\n")};window.addEventListener("load",(()=>{if(window._setTheme){const e=e=>{"theme"===e.key&&e.newValue&&r(e.newValue)};window.addEventListener("storage",e),window.addEventListener("unload",(()=>{window.removeEventListener("storage",e)}))}})),t().then((e=>{r(e)})).catch((e=>console.log(e))),e.ipcRenderer.on("tvd:update-theme",((e,t)=>{"string"==typeof t&&r(t)}))}(A.getTheme),function(){const e=()=>{new s("desktopOptimize",T).applyRules()};window.addEventListener("load",e),window.addEventListener("unload",(()=>{window.removeEventListener("load",e)})),e()}(),process.contextIsolated)try{e.contextBridge.exposeInMainWorld("TVD",A)}catch(e){console.error("Failed to expose API:",e)}})();

// ==========================================
// ChartRead Desktop Platform Preload Injector
// ==========================================
;(function() {
  try {
    const electron = require("electron");

    // 1. Sanitize document title
    const sanitizeTitle = () => {
      if (document.title && document.title.includes("TradingView")) {
        document.title = document.title.replace(/TradingView/g, "ChartRead");
      }
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", sanitizeTitle);
    } else {
      sanitizeTitle();
    }
    const tElem = document.querySelector("title");
    if (tElem) new MutationObserver(sanitizeTitle).observe(tElem, { childList: true, characterData: true, subtree: true });

    // 2. Real-Time Market Data & Client-Side Pro Capabilities
    // Keeping network requests unauthenticated enables TradingView's free, real-time public WebSockets (crypto, forex, indices, equities) to stream live data without 401/403 session errors.
    const injectScript = document.createElement("script");
    injectScript.textContent = `
      try {
        window.TradingView = window.TradingView || {};
        window.TradingView.createGoProDialog = () => false;
        window.TradingView.gopro = () => false;
        window.TradingView.isFeatureEnabled = () => true;

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

        // Intercept Canvas rendering to suppress "TradingView" watermark text
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

        // Chart API overrides to turn off watermark visibility
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
    `;
    (document.head || document.documentElement).appendChild(injectScript);

    // 3. Continuous DOM Watermark Eradication
    const eradicateWatermarks = () => {
      // Hide all links to tradingview on chart
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
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", eradicateWatermarks);
    } else {
      eradicateWatermarks();
    }
    setInterval(eradicateWatermarks, 500);
    new MutationObserver(eradicateWatermarks).observe(document.documentElement, { childList: true, subtree: true });

    // 4. Inject global CSS rules for watermarks, GoPro removal, and neon green branding
    const styleStr = `
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
    `;
    if (electron && electron.webFrame && electron.webFrame.insertCSS) {
      electron.webFrame.insertCSS(styleStr);
    }
  } catch (err) {
    console.log("ChartRead platform-preload error:", err);
  }
})();

//# sourceMappingURL=platform-preload.js.map
