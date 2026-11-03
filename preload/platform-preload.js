(()=>{"use strict";const e=require("electron");var t,n;if(function(e){e[e.Classic=1]="Classic",e[e.Protocol=2]="Protocol",e[e.Both=3]="Both"}(t||(t={})),function(e){e.RENDERER_START="sentry-electron.renderer-start",e.EVENT="sentry-electron.event",e.SCOPE="sentry-electron.scope",e.ENVELOPE="sentry-electron.envelope",e.STATUS="sentry-electron.status",e.ADD_METRIC="sentry-electron.add-metric"}(n||(n={})),window.__SENTRY_IPC__)console.log("Sentry Electron preload has already been run");else{const t={sendRendererStart:()=>e.ipcRenderer.send(n.RENDERER_START),sendScope:t=>e.ipcRenderer.send(n.SCOPE,t),sendEvent:t=>e.ipcRenderer.send(n.EVENT,t),sendEnvelope:t=>e.ipcRenderer.send(n.ENVELOPE,t),sendStatus:t=>e.ipcRenderer.send(n.STATUS,t),sendAddMetric:t=>e.ipcRenderer.send(n.ADD_METRIC,t)};if(window.__SENTRY_IPC__=t,e.contextBridge)try{e.contextBridge.exposeInMainWorld("__SENTRY_IPC__",t)}catch(e){}}const r="tvd:debug-auto-save-dialog",o="tvd:screen-capture";class s{key;rules;constructor(e,t){this.key=e,this.rules=t}applyRules(t){const n=t??this.rules;if(!n)return;const r=localStorage.getItem(this.key);r&&e.webFrame.removeInsertedCSS(r);const o=e.webFrame.insertCSS(n);localStorage.setItem(this.key,o)}removeRules(){const t=localStorage.getItem(this.key);t&&e.webFrame.removeInsertedCSS(t)}}function a(e){let t,n=e;return()=>{if(n){const e=n;n=void 0,t=e()}return t}}require("url");const i="TARGET_TVD_HOST",c="https://www.tradingview.com/",d=a((()=>{const e="http(s?):\\/\\/((\\w|-)*\\.)?tradingview\\.com";let t=c;return i in process.env&&(t=process.env[i]??c),null!==new RegExp(e,"i").exec(t)?e:(t.endsWith("/")&&(t=t?.substring(0,t.length-1)),t.replace(/\./gi,"\\.").replace(/\//gi,"\\/"))}));function l(e,t=!0){const n=e=>{let n=e.toString().replace(/\./gi,"\\.").replace(/(?<!\))\*/gi,"(.*)");return n.match(/\w+(\/\((\.\*\)))/gi)&&(n=n.replace(/\/\((\.\*\))/gi,"(/(.*))?")),n=n.replace(/\//gi,"\\/").replace(/\$\{TV\}/gi,d()),n=`^${n}${t?"$":""}`,new RegExp(n,"i")};return"string"==typeof e?n(e):e.map(n)}const p="${TV}/chart/([a-zA-Z0-9]{0,12})?/?",v="${TV}/(\\w|-)*screener/*",u="${TV}/chart/[a-z0-9-._~:\\?#@!$&'()*+,;%=]+/[a-z0-9-._~:\\?#@!$&'()*+,;%=]+/",g=(a((()=>l(v))),a((()=>l("${TV}/",!0))),a((()=>l("${TV}/chart/",!0))),a((()=>l(p))),a((()=>l("(${TV}/chart/([a-zA-Z0-9]{0,12})?)/\\?*?"))),a((()=>l(u,!0))),a((()=>l("${TV}/screener/*"))),a((()=>l("${TV}/heatmap/*"))),a((()=>l("${TV}/community/*"))),a((()=>l("${TV}/pine-script-docs/en/v5/Introduction.html"))),a((()=>l("${TV}/pine-script-reference/v5/"))),a((()=>l("${TV}/x/*"))),a((()=>l("${TV}/*"))),a((()=>l("${TV}/account-recovery/*"))),a((()=>l("${TV}/chat/*"))),a((()=>/:\/\/s3\..+\/snapshots\//i)),a((()=>l("${TV}/pine/*"))),a((()=>l("${TV}/markets/*"))),a((()=>l("${TV}/markets/*/news/"))),a((()=>l("${TV}/markets/stocks-*/*")))),h=(a((()=>l("${TV}/markets/world-economy/*"))),a((()=>l("${TV}/u/TradingView/"))),a((()=>l("${TV}/news/*"))),a((()=>l("${TV}/news/"))),a((()=>l("${TV}/news/\\?market=*"))),a((()=>l("${TV}/news/\\?market=topstories"))),a((()=>l("${TV}/HTML5-stock-forex-bitcoin-charting-library/"))),a((()=>l("${TV}/support/*"))),a((()=>l("https://status.tradingview.com/",!0))),a((()=>l("${TV}/ideas/*"))),a((()=>l("${TV}/scripts/*"))),a((()=>l(["${TV}/","${TV}/ideas/*",u,"${TV}/scripts/*","${TV}/script/*","${TV}/community/*","${TV}/widget/","${TV}/markets/corporate-bonds/*","${TV}/social-network/","${TV}/the-leap/*","${TV}/broker/*","${TV}/data-coverage/","${TV}/markets/stocks-*/*"])))),m=a((()=>l("${TV}/markets/bonds/*")));function b(e,t){const n=e.split("\n").join("");return t instanceof RegExp?t.test(n):t.some((e=>e.test(n)))}a((()=>l([p,v,"${TV}/markets/*","${TV}/symbols/*","${TV}/(\\w|-)*calendar/*"])));const w=window.location.href,T=`\n\t.tv-market-heatmap__standalone-title-wrap,\n\t.tv-screener__standalone-title-wrap,\n\t.tv-footer {\n\t\tdisplay: none !important;\n\t}\n\n\t${k=w,b(k,h())?"":".tv-header { display: none !important; }"}\n\n\t${function(e){return b(e,g())}(w)?"":'.tv-economic-calendar [class^="separator"],\n\t\t.tv-content [class^="container"] [class^="marketHeader"],\n\t\t.tv-content .tv-category__tab-page [class^="marketHeader"],\n\t\t.tv-sticky-symbol-header,\n\t\t.tv-screener-toolbar {\n\t\t\ttop: 0 !important;\n\t\t}'}\n\n\t.tv-content .tv-category__tab-page [class^="shadow"] [class^="tableWrapSticky"] {\n\t\ttop: 58px !important;\n\t}\n\n\t.tv-content .tv-economy-country-tab [class^="table"] [class^="stickyContainer"],\n\t.tv-content .tv-economy-indicator-tab [class^="table"] [class^="stickyContainer"] {\n\t\ttop: -1px !important;\n\t}\n\n\t.tv-content [class^="container"] [class^="shadow"] [class^="tableWrapSticky"] {\n\t\ttop: ${function(e){return b(e,m())}(w)?"-1px":"58px"}\n\t}\n\n\t.tv-category__tab-page.tv-card-exterior > .screener-markets-page-container > div {\n\t\t--screener-sticky-offset-top: 63px !important;\n\t}\n\n\t.tv-screener__standalone-wrap {\n\t\tpadding: 0 !important;\n\t}\n\n\t.i-hidden-on-tvdesktop {\n\t\tdisplay: none !important;\n\t}\n`;var k;const y="tvd:session-storage",R={initCachedStoreSync:`${y}:init-cached-store-sync`,setItem:`${y}:set-item`,clear:`${y}:clear`,removeItem:`${y}:remove-item`},V=new class{#e=null;getLength(){return this.ensureLoaded().size}setItem(t,n){this.ensureLoaded().set(t,n),e.ipcRenderer.send(R.setItem,t,n)}getItem(e){return this.ensureLoaded().get(e)??null}removeItem(t){this.ensureLoaded().delete(t),e.ipcRenderer.send(R.removeItem,t)}clear(){this.ensureLoaded().clear(),e.ipcRenderer.send(R.clear)}ensureLoaded(){if(null!==this.#e)return this.#e;try{const n=e.ipcRenderer.sendSync(R.initCachedStoreSync);if(t=n,Array.isArray(t)&&t.every((e=>Array.isArray(e)&&2===e.length&&"string"==typeof e[0]&&"string"==typeof e[1])))return this.#e=new Map(n),this.#e}catch(e){console.log("TVD.sessionStorage cachedStorage init request failed with error: ",e)}var t;return this.#e=new Map,this.#e}},$={getLength:function(){return V.getLength()},setItem:function(e,t){V.setItem(String(e),String(t))},getItem:function(e){return V.getItem(String(e))},removeItem:function(e){V.removeItem(String(e))},clear:function(){V.clear()}},f={updateLinkValues(t){e.ipcRenderer.send("tvd:update-link-values",t)}},S={getDesktopStream:async()=>await e.ipcRenderer.invoke("tvd:get-screen"),async getCurrentCameraDevice(){const t=await e.ipcRenderer.invoke("tvd:get-camera");if(t)return A.findMediaDevice(t.label,"videoinput")},async getCurrentAudioDevice(){const t=await e.ipcRenderer.invoke("tvd:get-audio");if(t)return A.findMediaDevice(t.label,"audioinput")},async findMediaDevice(e,t){const n=await navigator.mediaDevices.enumerateDevices();return n.find((n=>n.label===e&&n.kind===t))?.deviceId},startedScreenCapture(){let t="";window&&(t=window.location.href),e.ipcRenderer.send(o,!0,t)},stoppedScreenCapture(){let t="";window&&(t=window.location.href),e.ipcRenderer.send(o,!1,t)}},E={setTitle(t){e.ipcRenderer.send("tvd:set-title",t)},reloadTab(){e.ipcRenderer.send("tvd:reload-tab")},layoutChange(t){e.ipcRenderer.send("tvd:layout-change",t)},getActiveWatchlistId:()=>e.ipcRenderer.invoke("tvd:get-watchlist"),onActiveWatchlistIdChange(t){e.ipcRenderer.send("tvd:watchlist-change",t)},layoutRestored(){e.ipcRenderer.send("tvd:layout-restored")},setFocusPineEditor(t){e.ipcRenderer.send("tvd:focus-pine-editor",t)}},x={setNotification(t){e.ipcRenderer.send("tvd:set-notification",t)},setNotificationViewed(){e.ipcRenderer.send("tvd:set-notification-viewed")}},_={setCredentials:t=>e.ipcRenderer.invoke("tvd:set-credentials",t),getCredentials:()=>e.ipcRenderer.invoke("tvd:get-credentials"),insertCredentialsText:t=>e.ipcRenderer.invoke("tvd:native-input-string",t)},I={setLocale(t){e.ipcRenderer.send("tvd-main:set-locale",t)},getTheme:()=>e.ipcRenderer.invoke("tvd:get-theme"),getThemeSetting:()=>e.ipcRenderer.invoke("tvd:get-theme-setting"),setThemeSetting(t){e.ipcRenderer.send("tvd:set-theme-setting",t)},getReports:async()=>await e.ipcRenderer.invoke("tvd:get-reports"),signIn(){e.ipcRenderer.send("tvd-main:initiate-sign-in")},openSettings(t){e.ipcRenderer.send("tvd:open-settings",t)},openNewWindow(t,n,r){e.ipcRenderer.send("tvd:open-new-window",t,n,r)},log(t){e.ipcRenderer.invoke("tvd:log",t)},sendToSentry(t){e.ipcRenderer.invoke("tvd:send-to-sentry-breadcrumb",t)},crosshairSyncEnabled:function(){let t=!0;const n=new Map,r=e=>{t!==e&&(t=e,o())},o=()=>{n.forEach((e=>e(t)))};return e.ipcRenderer.invoke("tvd:get-crosshair-sync").then((e=>{r(e)})).catch((e=>console.log(e))),e.ipcRenderer.on("tvd:crosshair-sync-setting-update",((e,t)=>{r(t)})),{value:()=>t,subscribe(e){const t=self.crypto.randomUUID();return n.set(t,e),t},unsubscribe(e){n.has(e)&&n.delete(e)}}}(),sessionStorage:$},A={...S,...E,...x,..._,...I,...{openAutosaveDialogDebug(){e.ipcRenderer.send(r,!0)},closeAutosaveDialogDebug(){e.ipcRenderer.send(r,!1)},errorAutosaveDialogDebug(){e.ipcRenderer.send(r,!1,!0)}},contracts:{link:{OpenExternal:"OpenExternal"}},linkingApi:f};if(function(t){if("darwin"===process.platform)return;const n=new s("scrollbarTheme"),r=e=>{const t="light"===e?"\n\t* {\n\t\t--scrollbar-thumb-default: #D1D4DC;\n\t\t--scrollbar-thumb-hover: #B2B5BE;\n\t\t--scrollbar-thumb-active: #9598A1;\n\t\t--scrollbar-track: #FFFFFF;\n\t\t--scrollbar-track-border: #E0E3EB;\n\t}\n\n":"\n\t* {\n\t\t--scrollbar-thumb-default: #50535E;\n\t\t--scrollbar-thumb-hover: #868993;\n\t\t--scrollbar-thumb-active: #A3A6AF;\n\t\t--scrollbar-track: #131722;\n\t\t--scrollbar-track-border: #2A2E39;\n\t}\n\n";n.applyRules(t+"\n\t::-webkit-scrollbar {\n\t\twidth: 9px;\n\t\theight: 9px;\n\t}\n\n\t::-webkit-scrollbar-thumb {\n\t\tbox-sizing: border-box;\n\t\tborder: 2px solid transparent;\n\t\tbox-shadow: inset 0 0 10px 10px var(--scrollbar-thumb-default);\n\t\tborder-radius: 8px;\n\t\tbackground-color: unset;\n\t}\n\n\t::-webkit-scrollbar-thumb:hover {\n\t\tbox-shadow: inset 0 0 10px 10px var(--scrollbar-thumb-hover);\n\t}\n\n\t::-webkit-scrollbar-thumb:active {\n\t\tbox-shadow: inset 0 0 10px 10px var(--scrollbar-thumb-active);\n\t}\n\n\t::-webkit-scrollbar-track {\n\t\tborder-radius: unset;\n\t\tpadding: 2px;\n\t\tbackground-color: var(--scrollbar-track);\n\t}\n\n\t::-webkit-scrollbar-track:vertical {\n\t\tborder-left: 1px solid var(--scrollbar-track-border);\n\t}\n\n\t::-webkit-scrollbar-track:horizontal {\n\t\tborder-top: 1px solid var(--scrollbar-track-border);\n\t}\n\n\t::-webkit-scrollbar-corner {\n\t\tdisplay: none;\n\t}\n")};window.addEventListener("load",(()=>{if(window._setTheme){const e=e=>{"theme"===e.key&&e.newValue&&r(e.newValue)};window.addEventListener("storage",e),window.addEventListener("unload",(()=>{window.removeEventListener("storage",e)}))}})),t().then((e=>{r(e)})).catch((e=>console.log(e))),e.ipcRenderer.on("tvd:update-theme",((e,t)=>{"string"==typeof t&&r(t)}))}(A.getTheme),function(){const e=()=>{new s("desktopOptimize",T).applyRules()};window.addEventListener("load",e),window.addEventListener("unload",(()=>{window.removeEventListener("load",e)})),e()}(),process.contextIsolated)try{e.contextBridge.exposeInMainWorld("TVD",A);try{e.contextBridge.exposeInMainWorld("ChartReadCloud",{saveUserData:(d)=>e.ipcRenderer.invoke("chartread:opensearch-save-userdata",d),getUserData:()=>e.ipcRenderer.invoke("chartread:opensearch-get-userdata"),saveLayout:(id,d)=>e.ipcRenderer.invoke("chartread:opensearch-save-layout",id,d),getLayout:(id)=>e.ipcRenderer.invoke("chartread:opensearch-get-layout",id),listLayouts:()=>e.ipcRenderer.invoke("chartread:opensearch-list-layouts"),saveDrawings:(s,d)=>e.ipcRenderer.invoke("chartread:opensearch-save-drawings",s,d),getDrawings:(s)=>e.ipcRenderer.invoke("chartread:opensearch-get-drawings",s)})}catch(_e){console.warn("ChartReadCloud expose err",_e)}}catch(e){console.error("Failed to expose API:",e)}})();


// ==========================================


// ==========================================
// ChartRead Desktop Platform Preload Injector v5
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

    // 2. Main-World Injection: Realtime Data, Watermark Eradication, Drawing Tools, Indicators & Cloud DB Sync
    const darkWatermark = "data:image/png;base64,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";
    const lightWatermark = "data:image/png;base64,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";

    const mainWorldCode = `
  try {
    // ================================================================
    // A. Canvas Watermark Interception & Eradication
    // ================================================================
    if (typeof CanvasRenderingContext2D !== "undefined") {
      const _origFill = CanvasRenderingContext2D.prototype.fill;
      CanvasRenderingContext2D.prototype.fill = function() {
        if (arguments[0] instanceof Path2D) {
          const t = this.getTransform();
          if (t.e < 60 && t.f > (this.canvas.height - 70)) {
            return; // Eradicate TradingView canvas logo!
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
    // B. WebSocket Realtime Data Connection Fix (Unstuck All Charts)
    // ================================================================
    const fixWebSocket = () => {
      try {
        if (window.WSBackendConnection) {
          window.WSBackendConnection.forbidConnection = () => {
            // Block paywall from disconnecting live data!
          };
          window.WSBackendConnection._isConnectionForbidden = false;
          window.WSBackendConnection._tryGetProHost = () => null;
          window.WSBackendConnection._proHost = null;
          if (!window.WSBackendConnection.isConnected() && !window.WSBackendConnection.isConnecting()) {
            window.WSBackendConnection.allowConnection();
          }
        }
      } catch(e) {}
    };
    fixWebSocket();
    setInterval(fixWebSocket, 1200);

    // ================================================================
    // C. User Premium/Expert Plan (16 Charts, 50 Indicators, 40K Bars, All Features Unlocked)
    // ================================================================
    const expertUser = {
      id: 100001,
      username: "ChartRead",
      pro_plan: "pro_premium_expert",
      is_pro: true,
      is_expert: true,
      is_trial: false,
      is_lite_plan: false,
      badges: ["pro_premium_expert", "pro_expert", "pro_premium", "pro"],
      available_offers: {},
      following: "0",
      followers: "0",
      ignore_list: [],
      joined: "2020-01-01",
      session_hash: "chartread_pro_session",
      is_authenticated: true,
      __chartread_unlocked: true
    };
    let _chartreadUser = expertUser;
    try {
      Object.defineProperty(window, "user", {
        get: () => _chartreadUser,
        set: (v) => { _chartreadUser = Object.assign({}, expertUser, v, { pro_plan: "pro_premium_expert", is_pro: true, is_expert: true, is_authenticated: true }); },
        configurable: true
      });
    } catch(e) { window.user = expertUser; }
    window.is_authenticated = true;

    // GoPro & Upsell Dialog Neutralization
    window.TradingView = window.TradingView || {};
    window.TradingView.createGoProDialog = () => false;
    window.TradingView.showGoProDialog = () => false;
    window.TradingView.gopro = () => false;

    // Feature Toggles (Multi-charts, Custom Resolutions, Bar Replay, Volume Profile, Extended Hours)
    const enableFeatures = () => {
      try {
        const ft = window.TradingView?.FeatureToggle;
        if (ft && typeof ft.enableFeature === "function") {
          ft.enableFeature("multiple_charts");
          ft.enableFeature("seconds_resolution");
          ft.enableFeature("custom_resolutions");
          ft.enableFeature("bar_replay");
          ft.enableFeature("volume_profile");
          ft.enableFeature("study_templates");
          ft.enableFeature("export_chart_data");
          ft.enableFeature("extended_trading_hours");
          ft.enableFeature("show_extended_hours");
          ft.enableFeature("chart_patterns");
        }
      } catch(e) {}
    };
    enableFeatures();
    setInterval(enableFeatures, 2000);

    // ================================================================
    // D. Webpack Modules Unlock (Drawings Gate, 16 Charts, 40K Bars, Replay, Paywalls)
    // ================================================================
    const patchWebpack = () => {
      try {
        if (!window.webpackChunktradingview) return;
        let req;
        window.webpackChunktradingview.push([[Symbol("cr_expert")], {}, r => req = r]);
        if (!req) return;

        // Module 178489 (AuthToken - Realtime guest streaming token)
        try {
          const mod178489 = req(178489);
          if (mod178489 && mod178489.AuthToken) {
            mod178489.AuthToken.prototype.currentTokenIsValid = () => true;
            mod178489.AuthToken.prototype.get = () => Promise.resolve("unauthorized_user_token");
          }
        } catch(e) {}

        // Module 380732 (Product Features, Plan Config & 30 Pro Features)
        try {
          const mod380732 = req(380732);
          if (mod380732) {
            try {
              Object.defineProperty(mod380732, 'enabled', {
                get: () => () => true,
                configurable: true
              });
            } catch(e) {}
            try {
              Object.defineProperty(mod380732, 'getProductId', {
                get: () => () => 'pro_premium_expert',
                configurable: true
              });
            } catch(e) {}
            try {
              Object.defineProperty(mod380732, 'canUpgradePlan', {
                get: () => () => false,
                configurable: true
              });
            } catch(e) {}
          }
        } catch(e) {}

        // ================================================================
        // Module 488104 (Session - Suppress backend replay session disconnects)
        // ================================================================
        try {
          const mod488104 = req(488104);
          if (mod488104 && mod488104.Session) {
            const sessionProto = mod488104.Session.prototype;
            if (!sessionProto.__cr_crit_patched) {
              sessionProto.__cr_crit_patched = true;
              const origOnCrit = sessionProto._onCriticalError;
              sessionProto._onCriticalError = function(reason, info) {
                // Suppress critical errors during replay or for replay sessions
                if (window.__cr_replay_active) return;
                if (this.constructor.name === 'H' || (this.sessionId && String(this.sessionId()).startsWith('rs_'))) {
                  return;
                }
                try { return origOnCrit.apply(this, arguments); } catch(e) {}
              };
            }
          }
        } catch(e) {}

        // ================================================================
        // Module 909517 (Series - Retain local historical candles & Multi-Timeframe Replay)
        // ================================================================
        try {
          const mod909517 = req(909517);
          if (mod909517 && mod909517.Series) {
            const seriesProto = mod909517.Series.prototype;
            if (!seriesProto.__cr_replay_patched) {
              seriesProto.__cr_replay_patched = true;

              // Always permit resolution and symbol changes during replay
              seriesProto.canChangeResolution = function(e) {
                return Promise.resolve(true);
              };
              seriesProto.canChangeSymbol = function(e) {
                return Promise.resolve({ result: true });
              };
              seriesProto._isReplayResolutionAvailableForUser = function() {
                return true;
              };

              // Ensure resolving symbol does not throw during timeframe changes in replay
              seriesProto._getResolvingSymbolObject = function() {
                return this._getSymbolObject({ overriddenSymbol: this._symbolForResolve(), skipDefaultSession: true });
              };
              seriesProto._processReplayOnApplySymbolParamsChanges = function(e, t) {
                return Promise.resolve();
              };
              seriesProto._modifyReplaySeries = function() {
                return Promise.resolve();
              };

              // Stub switchToReplay: set subscriber and permit all resolutions
              seriesProto.switchToReplay = function(subscriber, isReplayResolutionAvailableForUser, timestamp) {
                try {
                  const safeSub = subscriber || {
                    id: 'cr_local_replay',
                    generateReplaySymbol: (s) => s,
                    modifySeries: () => {},
                    onSeriesModified: () => ({ unsubscribeAll: () => {} }),
                    destroy: () => {}
                  };
                  this._replaySubscriber.setValue(safeSub);
                  this._isReplayResolutionAvailableForUser = () => true;
                  this._onInReplayStateChanged.fire();
                } catch(e) {}
              };

              // Hook switchToRealtime: exit our local replay first
              const origSwitchToRealtime = seriesProto.switchToRealtime;
              seriesProto.switchToRealtime = function() {
                if (window.__cr_replay_active && typeof window.__cr_exit_replay === 'function') {
                  window.__cr_exit_replay();
                }
                try { return origSwitchToRealtime.apply(this, arguments); } catch(e) {}
              };

              // Hook clearData: DO NOT exit replay; clear bars cutoff cache so new resolution loads
              const origClearData = seriesProto.clearData;
              seriesProto.clearData = function() {
                try {
                  const b = this.bars();
                  if (b) delete b.__cr_cutoff_end;
                } catch(e) {}
                return origClearData.apply(this, arguments);
              };

              // Hook setSymbol: exit replay when symbol changes
              const origSetSymbol = seriesProto.setSymbol;
              seriesProto.setSymbol = function() {
                if (window.__cr_replay_active && typeof window.__cr_exit_replay === 'function') {
                  window.__cr_exit_replay();
                }
                return origSetSymbol.apply(this, arguments);
              };
            }
          }
        } catch(e) {}

        // ================================================================
        // Module 318057 (Bar Replay UI Controller & Complete Local Playback Engine v2)
        // ================================================================
        try {
          if (req.e && !window.__cr_replay_engine_v2_installed) {
            window.__cr_replay_engine_v2_installed = true;

            const replayChunks = [
              61404, 96212, 72260, 59830, 10338, 25220, 88550, 64634, 44106, 52869, 10589, 89185, 25931, 91878, 72542, 51360, 62070, 24827, 24270, 49050, 45089, 94533, 11828, 60945, 37517, 86605, 20953, 31466, 38782, 30079, 15632, 95392, 31368, 30148, 73856, 50442, 37704, 17637, 19129, 52392, 65088, 98224, 33985, 9271, 94958, 41627, 14041, 96081, 94686, 31713, 4520, 54630
            ];

            Promise.all(replayChunks.map(id => req.e(id))).then(() => {
              const mod318057 = req(318057);

              // ---- Resolve ReplayStatus enum ----
              let ReplayStatus = { Pause: 1, AutoPlay: 2, Finish: 3, Undefined: 0 };
              try {
                const mod668294 = req(668294);
                if (mod668294 && mod668294.ReplayStatus) ReplayStatus = mod668294.ReplayStatus;
              } catch(e) {}

              // ---- getChartModel helper ----
              const getChartModel = function(w) {
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
                } catch(e) { return null; }
              };

              // ---- Clamp Bars Helper (Universal Multi-Timeframe Anchor) ----
              const clampBarsToCutoff = function(barsObj) {
                if (!window.__cr_replay_active || typeof window.__cr_cutoff_timestamp !== 'number') return;
                const items = barsObj._items;
                if (!items || items.length === 0) return;

                let matchedIdx = items.length - 1;
                for (let j = 0; j < items.length; j++) {
                  if (items[j]?.value?.[0] > window.__cr_cutoff_timestamp) {
                    matchedIdx = Math.max(0, j - 1);
                    break;
                  }
                }
                barsObj.__cr_cutoff_end = matchedIdx + 1;
                barsObj._end = matchedIdx + 1;
                window.__cr_cutoff_index = matchedIdx;
                try { barsObj._invalidateSearchCaches(); } catch(e) {}
              };

              // ---- Install Bars.prototype guards ----
              const installBarsGuards = function(b) {
                const BarsProto = Object.getPrototypeOf(b);
                if (BarsProto.__cr_guarded_v2) return;
                BarsProto.__cr_guarded_v2 = true;

                ['_append', '_merge', 'add', 'merge'].forEach(name => {
                  const orig = BarsProto[name];
                  if (!orig) return;
                  BarsProto[name] = function() {
                    const res = orig.apply(this, arguments);
                    if (window.__cr_replay_active && typeof window.__cr_cutoff_timestamp === 'number') {
                      clampBarsToCutoff(this);
                    }
                    return res;
                  };
                });
                if (typeof BarsProto.set === 'function') {
                  const origSet = BarsProto.set;
                  BarsProto.set = function() {
                    const res = origSet.apply(this, arguments);
                    if (window.__cr_replay_active && typeof window.__cr_cutoff_timestamp === 'number') {
                      clampBarsToCutoff(this);
                    }
                    return res;
                  };
                }
              };

              // ---- Hook ChartModel lightUpdate to guarantee multi-timeframe clamp ----
              const installModelGuards = function(m) {
                if (!m) return;
                const ModelProto = Object.getPrototypeOf(m);
                if (ModelProto.__cr_model_guarded) return;
                ModelProto.__cr_model_guarded = true;

                const origLight = ModelProto.lightUpdate;
                ModelProto.lightUpdate = function() {
                  try {
                    if (window.__cr_replay_active && typeof window.__cr_cutoff_timestamp === 'number') {
                      const ms = this.mainSeries();
                      if (ms) clampBarsToCutoff(ms.bars());
                    }
                  } catch(e) {}
                  return origLight.apply(this, arguments);
                };
              };

              // ---- Sync Chart to Replay Point ----
              window.__cr_sync_chart_to_point = function(targetIndex) {
                const m = getChartModel();
                if (!m) return null;

                installModelGuards(m);

                const s = m.mainSeries();
                const b = s.bars();
                const ts = m.timeScale();

                installBarsGuards(b);

                const maxIdx = b._items.length - 1;
                const clampedIdx = Math.max(0, Math.min(maxIdx, targetIndex));

                if (!window.__cr_replay_active) {
                  window.__cr_replay_full_end = b._items.length;
                }

                window.__cr_cutoff_index = clampedIdx;
                window.__cr_replay_active = true;

                // Mark series in replay mode with resilient mock subscriber
                try {
                  if (s && s._replaySubscriber) {
                    s._replaySubscriber.setValue({
                      id: 'cr_local_replay',
                      generateReplaySymbol: (sym) => sym,
                      modifySeries: () => {},
                      onSeriesModified: () => ({ unsubscribeAll: () => {} }),
                      destroy: () => {}
                    });
                  }
                } catch(e) {}

                const targetBar = b._items[clampedIdx];
                const targetTime = targetBar ? targetBar.value[0] : null;
                const targetBarIndex = targetBar ? targetBar.index : clampedIdx;

                if (targetTime) {
                  window.__cr_cutoff_timestamp = targetTime;
                }

                // Truncate main series bars
                b.__cr_cutoff_end = clampedIdx + 1;
                b._end = clampedIdx + 1;
                try { b._invalidateSearchCaches(); } catch(e) {}

                // Set timeScale base index & scroll
                try {
                  if (ts && typeof ts.setBaseIndex === 'function') {
                    ts.setBaseIndex(targetBarIndex);
                    ts.scrollToRealtime();
                  }
                } catch(e) {}

                // Sync ALL studies (Volume, RSI, MACD, MAs, etc.)
                try {
                  const studies = m.allStudies ? m.allStudies() : [];
                  for (const study of studies) {
                    const sd = study.data ? study.data() : null;
                    if (!sd || !sd._items || sd._items.length === 0) continue;

                    const sdProto = Object.getPrototypeOf(sd);
                    if (!sdProto.__cr_guarded_v2) {
                      sdProto.__cr_guarded_v2 = true;
                      ['_append', '_merge', 'add', 'set'].forEach(name => {
                        const orig = sdProto[name];
                        if (!orig || typeof orig !== 'function') return;
                        sdProto[name] = function() {
                          const res = orig.apply(this, arguments);
                          if (window.__cr_replay_active && typeof this.__cr_cutoff_end === 'number') {
                            const maxLen = this._items ? this._items.length : this._end;
                            this._end = Math.min(maxLen, this.__cr_cutoff_end);
                            try { this._invalidateSearchCaches(); } catch(e) {}
                          }
                          return res;
                        };
                      });
                    }

                    let sEnd = sd._items.length;
                    if (targetTime) {
                      for (let j = 0; j < sd._items.length; j++) {
                        const row = sd._items[j];
                        if (row && row.value && row.value[0] > targetTime) {
                          sEnd = j;
                          break;
                        }
                      }
                    }

                    sd.__cr_cutoff_end = sEnd;
                    sd._end = sEnd;
                    try { if (sd._invalidateSearchCaches) sd._invalidateSearchCaches(); } catch(e) {}
                    try { m.updateSource(study); } catch(e) {}
                  }
                } catch(e) {}

                // Update & render
                try {
                  m.updateSource(s);
                  m.lightUpdate();
                } catch(e) {}

                return { clampedIdx, targetTime, targetBarIndex, end: b._end };
              };

              // ---- Exit Replay (with re-entrancy guard) ----
              window.__cr_exit_replay = function() {
                if (window.__cr_exiting_replay) return;
                if (!window.__cr_replay_active) return;

                window.__cr_exiting_replay = true;
                window.__cr_replay_active = false;
                window.__cr_cutoff_index = null;
                window.__cr_cutoff_timestamp = null;

                // Stop any autoplay timer
                try {
                  const api = window.TradingViewApi;
                  const ctrl = api?._replayApi?._replayUIController;
                  const mgr = ctrl?._replayManager;
                  if (mgr) {
                    if (mgr.__cr_timer) {
                      clearInterval(mgr.__cr_timer);
                      mgr.__cr_timer = null;
                    }
                    try { mgr._isAutoplayEnabled.setValue(false); } catch(e) {}
                    try { mgr._isReplayStarted.setValue(false); } catch(e) {}
                    try { mgr._replayPoint.setValue(null); } catch(e) {}
                    try { mgr._replaySelectedPoint.setValue(null); } catch(e) {}
                  }
                } catch(e) {}

                const m = getChartModel();
                if (!m) {
                  window.__cr_exiting_replay = false;
                  return;
                }

                const s = m.mainSeries();
                const b = s.bars();

                // Restore main bars
                delete b.__cr_cutoff_end;
                b._end = b._items.length;
                try { b._invalidateSearchCaches(); } catch(e) {}

                // Clear series replay subscriber
                try {
                  if (s && s._replaySubscriber) {
                    s._replaySubscriber.setValue(null);
                  }
                } catch(e) {}

                // Restore ALL studies
                try {
                  const studies = m.allStudies ? m.allStudies() : [];
                  for (const st of studies) {
                    const sd = st.data ? st.data() : null;
                    if (sd && sd._items) {
                      delete sd.__cr_cutoff_end;
                      sd._end = sd._items.length;
                      try { if (sd._invalidateSearchCaches) sd._invalidateSearchCaches(); } catch(e) {}
                      try { m.updateSource(st); } catch(e) {}
                    }
                  }
                } catch(e) {}

                // Reset TimeScale
                try {
                  const ts = m.timeScale();
                  if (ts) {
                    ts.resetBaseIndex();
                    try { ts.resetRightOffset(); } catch(e) {}
                    ts.scrollToRealtime();
                  }
                } catch(e) {}

                // Full model redraw
                try {
                  m.updateSource(s);
                  m.fullUpdate();
                } catch(e) {}

                window.__cr_replay_full_end = null;
                window.__cr_exiting_replay = false;
              };

              // ---- hookManager ----
              function hookManager(mgr, widget) {
                if (!mgr || mgr.__cr_v2_hooked) return;
                mgr.__cr_v2_hooked = true;

                mgr.canChangeSymbolParams = () => Promise.resolve({ res: true });
                mgr._handleAddRemoveSeriesError = () => {};
                mgr._handleError = () => {};
                mgr._handleResetError = () => {};

                // Safe stopReplay override: no assertion error
                mgr.stopReplay = function() {
                  if (this.__cr_timer) {
                    clearInterval(this.__cr_timer);
                    this.__cr_timer = null;
                  }
                  try { this._isAutoplayEnabled.setValue(false); } catch(e) {}
                  try { this._isReplayStarted.setValue(false); } catch(e) {}
                  try { this._replayPoint.setValue(null); } catch(e) {}
                  try { this._replaySelectedPoint.setValue(null); } catch(e) {}
                  const models = this._models || [];
                  this.setReplayStatus(models, ReplayStatus.Undefined);
                  return true;
                };

                // resetReplay: when user selects a new bar
                mgr.resetReplay = function(targetTimestamp, t = true) {
                  try { if (this._isAutoplayEnabled.value()) this.stopAutoplay(); } catch(e) {}

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
                    if (this._replaySelectedPoint && typeof this._replaySelectedPoint.setValue === 'function')
                      this._replaySelectedPoint.setValue(targetTimestamp);
                    if (this._replayPoint && typeof this._replayPoint.setValue === 'function')
                      this._replayPoint.setValue(targetTimestamp);
                    if (this._isReplayStarted && typeof this._isReplayStarted.setValue === 'function')
                      this._isReplayStarted.setValue(true);
                  } catch(e) {}

                  try {
                    const models = this._models ? this._models.filter(m => { try { return m.isInReplay().value(); } catch(e) { return false; } }) : [];
                    this.setReplayStatus(models, ReplayStatus.Pause);
                  } catch(e) {}
                };

                // doReplayStep: advance by N bars
                mgr.doReplayStep = function(step = 1) {
                  const m = getChartModel(widget);
                  const ms = m ? m.mainSeries() : null;
                  if (!ms) return Promise.resolve();
                  const b = ms.bars();

                  const curIdx = typeof window.__cr_cutoff_index === 'number' ? window.__cr_cutoff_index : b._items.length - 1;
                  const nextIdx = curIdx + step;

                  if (nextIdx >= b._items.length - 1) {
                    this.stopAutoplay();
                    window.__cr_sync_chart_to_point(b._items.length - 1);
                    return Promise.resolve();
                  }

                  const res = window.__cr_sync_chart_to_point(nextIdx);
                  if (res && res.targetTime) {
                    try {
                      if (this._replayPoint && typeof this._replayPoint.setValue === 'function')
                        this._replayPoint.setValue(res.targetTime);
                    } catch(e) {}
                  }
                  return Promise.resolve();
                };

                // startAutoplay
                mgr.startAutoplay = function() {
                  try { this._isAutoplayEnabled.setValue(true); } catch(e) {}
                  try {
                    const models = this._models ? this._models.filter(m => { try { return m.isInReplay().value(); } catch(e) { return false; } }) : [];
                    this.setReplayStatus(models, ReplayStatus.AutoPlay);
                  } catch(e) {}

                  if (this.__cr_timer) { clearInterval(this.__cr_timer); this.__cr_timer = null; }

                  const self = this;
                  const getDelay = () => {
                    try {
                      return Math.max(50, this._autoplayDelay ? this._autoplayDelay.value() : 1000);
                    } catch(e) { return 1000; }
                  };

                  const tick = () => {
                    try {
                      if (!self._isAutoplayEnabled.value() || !window.__cr_replay_active) {
                        if (self.__cr_timer) { clearInterval(self.__cr_timer); self.__cr_timer = null; }
                        return;
                      }
                      self.doReplayStep(1);
                    } catch(e) {
                      if (self.__cr_timer) { clearInterval(self.__cr_timer); self.__cr_timer = null; }
                    }
                  };

                  const startTimer = () => {
                    if (self.__cr_timer) clearInterval(self.__cr_timer);
                    self.__cr_timer = setInterval(tick, getDelay());
                  };

                  if (this._autoplayDelay && !this.__cr_delay_sub_v2) {
                    this.__cr_delay_sub_v2 = true;
                    try {
                      this._autoplayDelay.subscribe(() => {
                        try {
                          if (self._isAutoplayEnabled.value() && self.__cr_timer) startTimer();
                        } catch(e) {}
                      });
                    } catch(e) {}
                  }

                  startTimer();
                };

                // stopAutoplay
                mgr.stopAutoplay = function() {
                  if (this.__cr_timer) {
                    clearInterval(this.__cr_timer);
                    this.__cr_timer = null;
                  }
                  try { this._isAutoplayEnabled.setValue(false); } catch(e) {}
                  try {
                    const models = this._models ? this._models.filter(m => { try { return m.isInReplay().value(); } catch(e) { return false; } }) : [];
                    this.setReplayStatus(models, ReplayStatus.Pause);
                  } catch(e) {}
                };
              }

              // ---- Patch ReplayUIController prototype ----
              if (mod318057 && mod318057.ReplayUIController) {
                const proto = mod318057.ReplayUIController.prototype;

                // All popular resolutions for the replay toolbar dropdown
                const ALL_REPLAY_RESOLUTIONS = [
                  "1S", "5S", "10S", "15S", "30S",
                  "1", "2", "3", "5", "10", "15", "30", "45",
                  "60", "120", "180", "240",
                  "1D", "1W", "1M"
                ];

                const origShowToolbar = proto.showReplayToolbar;
                proto.showReplayToolbar = function() {
                  try {
                    hookManager(this._replayManager, this._currentChartWidget ? this._currentChartWidget() : null);
                  } catch(e) {}
                  return origShowToolbar.apply(this, arguments);
                };

                proto.enableReplayMode = function(e = true) {
                  try {
                    hookManager(this._replayManager, this._currentChartWidget ? this._currentChartWidget() : null);
                  } catch(e2) {}
                  this._setReplayModeEnabled(true, e);
                  return Promise.resolve();
                };

                const origSetReplayModeEnabled = proto._setReplayModeEnabled;
                proto._setReplayModeEnabled = function(enabled, t = enabled) {
                  if (!enabled && window.__cr_replay_active) {
                    window.__cr_exit_replay();
                  }
                  try {
                    return origSetReplayModeEnabled.apply(this, arguments);
                  } catch(e) {}
                };

                const origDestroy = proto.destroy;
                proto.destroy = function() {
                  if (window.__cr_replay_active) window.__cr_exit_replay();
                  return origDestroy.apply(this, arguments);
                };

                // Suppress paywalls and point errors
                proto._onPointTooDeepError = function() {};
                proto._onParamsNotApplicableForReplay = function() {};

                // Always populate full resolutions list in Replay Toolbar
                proto._updateAllReplayResolutions = function() {
                  if (this._allReplayResolutions) {
                    this._allReplayResolutions.setValue(ALL_REPLAY_RESOLUTIONS);
                  }
                };

                proto._updateFilteredByCurrentPointReplayResolutions = function() {
                  const cur = this._activeChartWidget?.value()?.resolution?.() || "15";
                  if (this._autoReplayResolution) this._autoReplayResolution.setValue(cur);
                  if (this._replayResolutions) this._replayResolutions.setValue([...ALL_REPLAY_RESOLUTIONS, null]);
                  try { this._correctCurrentReplayResolutionValue(); } catch(e) {}
                };

                // Change resolution from Replay Toolbar dropdown
                proto.changeReplayResolution = function(newRes) {
                  if (!newRes) return;
                  try {
                    if (this._currentReplayResolution) this._currentReplayResolution.setValue(newRes);
                    const w = this._currentChartWidget ? this._currentChartWidget() : (window.TradingViewApi?._activeChartWidgetWV?.value?.());
                    if (w && typeof w.setResolution === 'function') {
                      w.setResolution(newRes);
                    }
                  } catch(e) {}
                };

                proto.pointsIsTooDeepForCharts = function() {
                  if (this._pointsIsTooDeepForCharts) {
                    try { this._pointsIsTooDeepForCharts.setValue([]); } catch(e) {}
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

                // _onPointSelected
                proto._onPointSelected = function(widget, timestamp) {
                  try {
                    hookManager(this._replayManager, widget);
                  } catch(e) {}

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
                      if (mgr._replayPoint && typeof mgr._replayPoint.setValue === 'function')
                        mgr._replayPoint.setValue(timestamp);
                      if (mgr._replaySelectedPoint && typeof mgr._replaySelectedPoint.setValue === 'function')
                        mgr._replaySelectedPoint.setValue(timestamp);
                      if (mgr._isReplayStarted && typeof mgr._isReplayStarted.setValue === 'function')
                        mgr._isReplayStarted.setValue(true);
                    } catch(e) {}

                    try {
                      const models = mgr._models ? mgr._models.filter(m => { try { return m.isInReplay().value(); } catch(e) { return false; } }) : [];
                      mgr.setReplayStatus(models, ReplayStatus.Pause);
                    } catch(e) {}
                  }

                  try { this.showReplayToolbar(); } catch(e) {}

                  try {
                    if (w && typeof w.cancelRequestSelectPoint === 'function') {
                      w.cancelRequestSelectPoint();
                    }
                  } catch(e) {}
                };

                // toggleAutoplay
                proto.toggleAutoplay = function() {
                  try {
                    hookManager(this._replayManager, this._currentChartWidget ? this._currentChartWidget() : null);
                  } catch(e) {}
                  const mgr = this._replayManager;
                  if (!mgr) return;

                  try {
                    if (mgr.isAutoplayStarted().value()) {
                      mgr.stopAutoplay();
                    } else {
                      try {
                        if (this._currentChartWidget) this._currentChartWidget().cancelRequestSelectPoint();
                      } catch(e) {}
                      mgr.startAutoplay();
                    }
                  } catch(e) {}
                };

                // doStep
                proto.doStep = function() {
                  try {
                    hookManager(this._replayManager, this._currentChartWidget ? this._currentChartWidget() : null);
                  } catch(e) {}
                  const mgr = this._replayManager;
                  if (!mgr) return Promise.resolve();

                  try {
                    if (mgr.isAutoplayStarted().value()) mgr.stopAutoplay();
                  } catch(e) {}

                  return mgr.doReplayStep(1);
                };

                // goToRealtime (>>| button)
                proto.goToRealtime = function() {
                  const mgr = this._replayManager;
                  try {
                    if (mgr && mgr.isAutoplayStarted().value()) mgr.stopAutoplay();
                  } catch(e) {}
                  
                  const m = getChartModel(this._currentChartWidget ? this._currentChartWidget() : null);
                  const ms = m?.mainSeries ? m.mainSeries() : null;
                  if (ms) {
                    const b = ms.bars();
                    window.__cr_sync_chart_to_point(b._items.length - 1);
                    try {
                      if (mgr && mgr._replayPoint && typeof mgr._replayPoint.setValue === 'function') {
                        if (b.last()) mgr._replayPoint.setValue(b.last().value[0]);
                      }
                    } catch(e) {}
                  }

                  if (mgr) {
                    try {
                      const models = mgr._models ? mgr._models.filter(m => { try { return m.isInReplay().value(); } catch(e) { return false; } }) : [];
                      mgr.setReplayStatus(models, ReplayStatus.Pause);
                    } catch(e) {}
                  }
                };

                // requestCloseReplay: instant clean exit with NO popups
                proto.requestCloseReplay = function(force = true, callback) {
                  const mgr = this._replayManager;
                  if (mgr) {
                    try { if (mgr.isAutoplayStarted().value()) mgr.stopAutoplay(); } catch(e) {}
                    try { if (mgr._isReplayStarted) mgr._isReplayStarted.setValue(false); } catch(e) {}
                    try { if (mgr._replayPoint) mgr._replayPoint.setValue(null); } catch(e) {}
                    try { if (mgr._replaySelectedPoint) mgr._replaySelectedPoint.setValue(null); } catch(e) {}
                    try {
                      const models = mgr._models || [];
                      mgr.setReplayStatus(models, ReplayStatus.Undefined);
                    } catch(e) {}
                  }

                  // 1. Restore chart data immediately (all bars, volume, studies, time scale)
                  window.__cr_exit_replay();

                  // 2. Hide toolbar and disable replay mode
                  try {
                    this._setReplayModeEnabled(false);
                  } catch(e) {}

                  // 3. Dismiss any confirmation dialogs (e.g. "Leave current replay?")
                  try {
                    const dialogs = document.querySelectorAll('#leaveReplayDialog, [data-dialog-name="confirm-dialog"]');
                    dialogs.forEach(d => {
                      if (/leave current replay/i.test(d.innerText || '')) {
                        const closeBtn = d.querySelector('[class*="closeButton"], [aria-label="Close"]');
                        if (closeBtn) closeBtn.click();
                        else d.remove();
                      }
                    });
                  } catch(e) {}

                  if (typeof callback === 'function') {
                    try { callback(); } catch(e) {}
                  }
                  return Promise.resolve();
                };
              }
            }).catch((err) => { console.warn('[ChartRead Replay] Chunk load error:', err); });
          }
        } catch(e) {}

        // Module 19710 (applyStudyWithCheckPermission - Unlocks Volume Profile, Chart Patterns, TPO & All Studies)
        try {
          const mod19710 = req(19710);
          if (mod19710) {
            mod19710.applyStudyWithCheckPermission = (pkg, id, cb) => {
              if (typeof cb === "function") cb();
            };
          }
        } catch(e) {}

        // Module 240586 (StudySearchDialogRendererBase - Resets dialogPromise on error to avoid stuck dialog)
        try {
          const mod240586 = req(240586);
          if (mod240586 && mod240586.StudySearchDialogRendererBase) {
            const proto240586 = mod240586.StudySearchDialogRendererBase.prototype;
            if (!proto240586.__cr_req_patched) {
              proto240586.__cr_req_patched = true;
              const origReq = proto240586._requestDialog;
              proto240586._requestDialog = function() {
                const p = origReq.apply(this, arguments);
                if (p && typeof p.catch === "function") {
                  p.catch(() => { this._dialogPromise = null; });
                }
                return p;
              };
            }
          }
        } catch(e) {}

        // Study Market singleton recovery
        try {
          if (window.studyMarket && window.studyMarket._dialogPromise && !window.studyMarket._dialog) {
            window.studyMarket._dialogPromise = null;
          }
        } catch(e) {}

        // Module 403933 & 244085 (StudySearchBaseDialog & StudySearchDialog - Lazy module hooks to prevent cache poisoning)
        try {
          if (req.m[403933] && !req.m[403933].__cr_wrapped) {
            const origM403933 = req.m[403933];
            req.m[403933] = function(module, exports, require) {
              origM403933.apply(this, arguments);
              if (exports?.StudySearchBaseDialog) {
                exports.StudySearchBaseDialog.prototype._handleClickOnStudyApply = function(item, t, i) {
                  if (!item) return;
                  if (this._applyStudy) return this._applyStudy(item, t, i);
                };
              }
            };
            req.m[403933].__cr_wrapped = true;
          }
          if (req.c[403933]?.exports?.StudySearchBaseDialog) {
            req.c[403933].exports.StudySearchBaseDialog.prototype._handleClickOnStudyApply = function(item, t, i) {
              if (!item) return;
              if (this._applyStudy) return this._applyStudy(item, t, i);
            };
          }

          if (req.m[244085] && !req.m[244085].__cr_wrapped) {
            const origM244085 = req.m[244085];
            req.m[244085] = function(module, exports, require) {
              origM244085.apply(this, arguments);
              if (exports?.StudySearchDialog) {
                exports.StudySearchDialog.prototype._ignoreChecksWhenAddingStudy = true;
              }
            };
            req.m[244085].__cr_wrapped = true;
          }
          if (req.c[244085]?.exports?.StudySearchDialog) {
            req.c[244085].exports.StudySearchDialog.prototype._ignoreChecksWhenAddingStudy = true;
          }
        } catch(e) {}

        // Module 159000 & 542672 (50 Indicators per chart, suppress study errors, ensure valid Study ctor)
        try {
          const patchStudyClass = (Study) => {
            if (!Study || Study.__cr_patched) return;
            Study.__cr_patched = true;
            Study.prototype._handleStudyError = function() {
              this._setStatus({ type: 2 });
              try {
                this._statusView?.update?.();
                this._model?.updateSource?.(this);
                this._enablePriceRangeReady?.();
              } catch(e) {}
            };
            Study.prototype.isFailed = () => false;
            Study.prototype.hasCompileError = () => false;
            Study.prototype.error = () => null;

            try {
              const mod542672 = req(542672);
              const info = mod542672?.getStudyInfoByName?.("Study");
              if (info) info.studyConstructor = Study;
            } catch(e) {}
          };

          if (req.m[159000] && !req.m[159000].__cr_wrapped) {
            const origM159000 = req.m[159000];
            req.m[159000] = function(module, exports, require) {
              origM159000.apply(this, arguments);
              patchStudyClass(module.exports?.Study);
            };
            req.m[159000].__cr_wrapped = true;
          }
          if (req.c[159000]?.exports?.Study) {
            patchStudyClass(req.c[159000].exports.Study);
          }

          const mod498438 = req.c[498438]?.exports;
          if (mod498438 && mod498438.StudyStatusProviderBase) {
            mod498438.StudyStatusProviderBase.prototype.errorStatus = () => null;
          }
          const mod861744 = req.c[861744]?.exports;
          if (mod861744) {
            mod861744.isMaxSubscriptionPlan = () => true;
          }

          // Patch ChartModel and InnerModel for 50 indicators and robust scale handling
          const sm = window.studyMarket;
          const widget = sm?._dialog?._insertStudyService?._chartWidgetCollection?.activeChartWidget?.value();
          const chart = window._activeChart || (typeof window.TradingViewApi !== 'undefined' ? window.TradingViewApi.activeChart?.() : null);
          const model = widget?.model?.() || (chart?._chartWidget?.model ? chart._chartWidget.model() : chart?._chartWidget?._model);
          if (model) {
            const proto = Object.getPrototypeOf(model);
            if (proto && !proto.__cr_study_patched) {
              proto.__cr_study_patched = true;
              proto.canCreateStudy = () => ({ success: true, limitValue: 50 });
              proto.checkIfFeatureAvailable = () => true;
            }
            const innerModel = typeof model.model === 'function' ? model.model() : null;
            if (innerModel) {
              const innerProto = Object.getPrototypeOf(innerModel);
              if (innerProto && !innerProto.__cr_study_patched) {
                innerProto.__cr_study_patched = true;
                const origInsertParams = innerProto.insertStudyWithParams;
                if (origInsertParams) {
                  innerProto.insertStudyWithParams = function(params) {
                    if (params && params.preferredPriceScale === null) {
                      params.preferredPriceScale = undefined;
                    }
                    return origInsertParams.apply(this, arguments);
                  };
                }
              }
            }
          }
        } catch(e) {}

        // Module 324604 (ChartWidgetCollection - 16 Charts per tab layout unlock)
        try {
          const mod324604 = req(324604);
          if (mod324604 && mod324604.ChartWidgetCollection) {
            mod324604.ChartWidgetCollection.prototype._checkProFeature = function(e) { return e; };
            mod324604.ChartWidgetCollection.prototype._isLayoutKeptBehindPaywall = function() { return false; };
            mod324604.ChartWidgetCollection.prototype._openMultipleChartsPaywall = function() {};
          }
        } catch(e) {}

        // Module 637735 (Paywalls Suppression)
        try {
          const mod637735 = req(637735);
          if (mod637735 && mod637735.openPaywall) {
            mod637735.openPaywall = () => {};
          }
        } catch(e) {}

        // Module 153041 (Registration Wall Suppression)
        try {
          const mod153041 = req(153041);
          if (mod153041 && mod153041.runOrSignInWithWall) {
            mod153041.runOrSignInWithWall = (descriptor, callback, options) => {
              if (typeof callback === "function") return callback();
              return Promise.resolve();
            };
          }
        } catch(e) {}

        // Module 347582 (GoPro Suppression)
        try {
          const mod347582 = req(347582);
          if (mod347582) {
            if (mod347582.openGoPro) mod347582.openGoPro = () => {};
            if (mod347582.openGoProPage) mod347582.openGoProPage = () => {};
            if (mod347582.getFullProductId) mod347582.getFullProductId = () => "pro_premium_expert";
          }
        } catch(e) {}

        // Module 861288 (Drawing permission gate)
        try {
          const mod861288 = req(861288);
          if (mod861288) {
            mod861288.ensureDrawingSelectAllowed = () => true;
            mod861288.ensureDrawingCreationAllowed = () => true;
          }
        } catch(e) {}

        // Module 137663 (Entitlements)
        try {
          const ent = req(137663);
          if (ent && typeof ent.setChartApiEntitlements === "function") {
            ent.setChartApiEntitlements({
              isFeatureEnabled: () => true,
              featureLimit: () => 99999
            });
          }
        } catch(e) {}

        // Module 899801 (Supported Line Tools)
        try {
          const mod899801 = req(899801);
          if (mod899801 && mod899801.isImageDrawingToolAvailable) {
            mod899801.isImageDrawingToolAvailable = () => true;
          }
        } catch(e) {}

        // Module 73728 & 182110 (Study Access Errors)
        try {
          const mod73728 = req(73728);
          if (mod73728) {
            mod73728.paidStudyAccessError = () => ({ studyAccessBlocked: false });
            mod73728.isServiceStudyErrorCode = () => false;
          }
          const mod182110 = req(182110);
          if (mod182110) {
            mod182110.studyStatusBlocked = () => false;
          }
        } catch(e) {}
      } catch(e) {}
    };
    patchWebpack();
    setInterval(patchWebpack, 1500);

    // Replay Button and Header Actions Listener
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('button, [role="button"]');
      if (!btn) return;
      const txt = (btn.innerText || '').trim();
      const title = (btn.getAttribute('title') || btn.getAttribute('aria-label') || '').trim();
      if (txt.toLowerCase() === 'replay' || title.toLowerCase() === 'replay' || btn.getAttribute('data-name') === 'replay') {
        setTimeout(() => {
          document.querySelectorAll('[role="dialog"], [class*="dialog-"]').forEach(d => {
            if (/unlock bar replay|look first|create a free account|gopro/i.test(d.innerText || '')) {
              d.remove();
            }
          });
        }, 50);
      }
    }, true);

    // ================================================================
    // E. Study Prototype & Universal Indicator Calculation Engine
    // ================================================================
    const patchStudyPrototype = () => {
      try {
        const chart = window.TradingViewApi?.activeChart?.();
        const studies = chart?.getAllStudies?.() || [];
        if (studies.length > 0) {
          const firstStudy = chart.getStudyById(studies[0].id)?.study?.();
          if (firstStudy) {
            const proto = Object.getPrototypeOf(firstStudy);
            if (proto && !proto.__chartread_patched) {
              proto.__chartread_patched = true;
              proto._handleStudyError = function(e) {
                // Suppress study error transition
              };
              proto.isFailed = function() { return false; };
              proto.hasCompileError = function() { return false; };
            }
          }
        }
      } catch(e) {}
    };
    patchStudyPrototype();
    setInterval(patchStudyPrototype, 2000);

    // Universal client-side calculation for all indicators (BB, RSI, EMA, SMA, Volume, etc.)
    const computeAllStudies = () => {
      try {
        const chart = window.TradingViewApi?.activeChart?.();
        if (!chart) return;
        const studies = chart.getAllStudies?.() || [];
        if (studies.length === 0) return;

        const first = chart.getStudyById(studies[0].id)?.study?.();
        const model = chart._chartWidget?.model ? chart._chartWidget.model() : (first?._model || chart._chartWidget?._model);
        const ms = model?.mainSeries ? model.mainSeries() : null;
        if (!ms) return;
        const bars = ms.bars?.();
        if (!bars || bars.isEmpty?.()) return;

        const firstIdx = bars.firstIndex();
        const lastIdx = bars.lastIndex();
        const barsList = [];
        for (let i = firstIdx; i <= lastIdx; i++) {
          const v = bars.valueAt(i);
          if (v) {
            barsList.push({
              index: i,
              time: v[0],
              open: v[1],
              high: v[2],
              low: v[3],
              close: v[4],
              volume: v[5]
            });
          }
        }
        if (barsList.length < 2) return;

        studies.forEach(s => {
          try {
            const study = chart.getStudyById(s.id)?.study?.();
            if (!study) return;
            const name = (s.name || '').toLowerCase();

            study._wasCompletedBefore = true;
            study.isFailed = () => false;
            study.hasCompileError = () => false;
            study.error = () => null;

            if (study.data().isEmpty()) {
              if (name.includes('bollinger')) {
                const length = 20, mult = 2;
                for (let i = length - 1; i < barsList.length; i++) {
                  let sum = 0;
                  for (let j = 0; j < length; j++) sum += barsList[i - j].close;
                  const basis = sum / length;
                  let varSum = 0;
                  for (let j = 0; j < length; j++) {
                    const diff = barsList[i - j].close - basis;
                    varSum += diff * diff;
                  }
                  const stddev = Math.sqrt(varSum / length);
                  study.data().add(barsList[i].index, [barsList[i].time, basis, basis + mult * stddev, basis - mult * stddev]);
                }
              } else if (name.includes('relative') || name.includes('rsi')) {
                const length = 14;
                let avgGain = 0, avgLoss = 0;
                for (let i = 1; i <= length; i++) {
                  const diff = barsList[i].close - barsList[i - 1].close;
                  if (diff > 0) avgGain += diff; else avgLoss += -diff;
                }
                avgGain /= length; avgLoss /= length;
                for (let i = length; i < barsList.length; i++) {
                  const diff = barsList[i].close - barsList[i - 1].close;
                  const gain = diff > 0 ? diff : 0, loss = diff < 0 ? -diff : 0;
                  avgGain = (avgGain * (length - 1) + gain) / length;
                  avgLoss = (avgLoss * (length - 1) + loss) / length;
                  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
                  const rsi = 100 - (100 / (1 + rs));
                  study.data().add(barsList[i].index, [barsList[i].time, rsi]);
                }
              } else if (name.includes('exponential') || name.includes('ema')) {
                const length = 9;
                const k = 2 / (length + 1);
                let ema = barsList[0].close;
                study.data().add(barsList[0].index, [barsList[0].time, ema]);
                for (let i = 1; i < barsList.length; i++) {
                  ema = barsList[i].close * k + ema * (1 - k);
                  study.data().add(barsList[i].index, [barsList[i].time, ema]);
                }
              } else if (name.includes('moving') || name.includes('sma') || name.includes('ma')) {
                const length = 9;
                for (let i = length - 1; i < barsList.length; i++) {
                  let sum = 0;
                  for (let j = 0; j < length; j++) sum += barsList[i - j].close;
                  study.data().add(barsList[i].index, [barsList[i].time, sum / length]);
                }
              } else if (name.includes('volume') || name.includes('vol')) {
                for (let i = 0; i < barsList.length; i++) {
                  const color = barsList[i].close >= barsList[i].open ? 1 : 0;
                  study.data().add(barsList[i].index, [barsList[i].time, barsList[i].volume, color]);
                }
              } else {
                for (let i = 0; i < barsList.length; i++) {
                  study.data().add(barsList[i].index, [barsList[i].time, barsList[i].close]);
                }
              }
              if (study._dataUpdated?.fire) study._dataUpdated.fire();
            }
          } catch(e) {}
        });

        if (ms._model?.lightUpdate) ms._model.lightUpdate();
      } catch(e) {}
    };
    setInterval(computeAllStudies, 1200);

    // ================================================================
    // F. Universal Indicator Click & Study Market Bypass
    // ================================================================
    if (window.studyMarket?._insertStudyService) {
      window.studyMarket._insertStudyService.getStudiesCounter = () => 0;
    }
    if (window.TVScript?.Access) {
      window.TVScript.Access.ACCESS_CLOSED_NEEDS_AUTH = "open_no_auth";
      if (window.TVScript.Access.MAP_ID_TO_NAME) window.TVScript.Access.MAP_ID_TO_NAME["3"] = "open_no_auth";
      if (window.TVScript.Access.MAP_NAME_TO_ID) window.TVScript.Access.MAP_NAME_TO_ID["closed_needs_auth"] = "1";
    }

    document.addEventListener('click', (e) => {
      try {
        const itemEl = e.target.closest('[data-role="list-item"]');
        if (!itemEl) return;
        const dialog = itemEl.closest('[data-dialog-name="Indicators, metrics, and strategies"]');
        if (!dialog) return;

        const key = Object.keys(itemEl).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'));
        const fiber = itemEl[key];
        if (!fiber) return;

        let cur = fiber;
        let itemData = null;
        while (cur) {
          if (cur.memoizedProps?.item) {
            itemData = cur.memoizedProps.item;
            break;
          }
          cur = cur.return;
        }

        if (itemData) {
          const chart = window.TradingViewApi?.activeChart?.();
          const studyData = itemData.studyData || {};
          const title = studyData.title || itemData.name || itemData.title || "";
          const id = studyData.id || itemData.id || "";

          if (chart && chart.createStudy && title && !id.startsWith("PUB;")) {
            try {
              chart.createStudy(title, false, false);
              setTimeout(() => { if (window.chartreadSyncLayout) window.chartreadSyncLayout(); }, 1200);
              return;
            } catch(err) {}
          }

          if (window.studyMarket?._insertStudyService) {
            const desc = studyData.descriptor || {
              type: id.startsWith("PUB;") ? "pine" : "java",
              pineId: id,
              pineVersion: studyData.version || "1.0"
            };
            window.studyMarket._insertStudyService.insertStudy({
              descriptor: desc,
              insertionInfo: itemData
            }).then(() => {
              setTimeout(() => { if (window.chartreadSyncLayout) window.chartreadSyncLayout(); }, 1200);
            }).catch(err => {
              console.warn("[ChartRead] insertStudy error:", err);
            });
          }
        }
      } catch(err) {}
    }, true);

    // ================================================================
    // G. 24/7 Cloud Database (Aiven OpenSearch) Auto-Sync
    // ================================================================
    const initOpenSearchAutoSync = () => {
      if (!window.ChartReadCloud) return;

      const getActiveChartModel = () => {
        try {
          const sm = window.studyMarket;
          const widget = sm?._dialog?._insertStudyService?._chartWidgetCollection?.activeChartWidget?.value();
          if (widget?.model) return widget.model();
          const chart = window.TradingViewApi?.activeChart?.() || window._activeChart;
          return chart?._chartWidget?.model ? chart._chartWidget.model() : (chart?._chartWidget?._model || chart?.model?.());
        } catch(e) { return null; }
      };

      // 1. Sync Drawings to OpenSearch
      window.chartreadSyncDrawings = async () => {
        try {
          const model = getActiveChartModel();
          if (!model) return;
          const symbol = model.mainSeries?.()?.symbol?.() || 'GLOBAL';

          const tools = model.allLineTools ? model.allLineTools() : [];
          const drawingsData = tools.map(t => {
            try {
              return {
                id: t.id(),
                name: t.name ? t.name() : t.toolname,
                points: t.points ? t.points() : null,
                state: t.state ? t.state() : null
              };
            } catch(e) { return null; }
          }).filter(Boolean);

          await window.ChartReadCloud.saveDrawings(symbol, drawingsData);
          return { success: true, count: drawingsData.length, symbol };
        } catch(err) {
          return { error: err.message };
        }
      };

      // 2. Sync Layout & Active Indicators to OpenSearch
      window.chartreadSyncLayout = async () => {
        try {
          const model = getActiveChartModel();
          if (!model || !model.state) return;

          const layoutState = model.state({ withData: false });
          const symbol = model.mainSeries?.()?.symbol?.() || 'DEFAULT';
          const resolution = model.mainSeries?.()?.properties?.()?.interval?.value?.() || '1D';

          await window.ChartReadCloud.saveLayout('default_layout', {
            symbol,
            resolution,
            state: layoutState,
            studies: model.allStudies ? model.allStudies().map(s => s.metaInfo?.()?.description) : [],
            updatedAt: new Date().toISOString()
          });
          return { success: true, symbol, resolution };
        } catch(err) {
          return { error: err.message };
        }
      };

      // Periodic cloud sync every 25 seconds
      setInterval(() => {
        window.chartreadSyncDrawings();
        window.chartreadSyncLayout();
      }, 25000);

      // Auto-sync after drawing operations on chart canvas
      document.addEventListener('mouseup', (e) => {
        if (e.target.closest && e.target.closest('.chart-gui-wrapper')) {
          setTimeout(window.chartreadSyncDrawings, 400);
          setTimeout(window.chartreadSyncLayout, 600);
        }
      }, { passive: true });
    };
    initOpenSearchAutoSync();

    // ================================================================
    // H. Paywall & Custom Interval Dialog Neutralization
    // ================================================================
    const handlePaywallDialogs = () => {
      try {
        document.querySelectorAll('div[role="dialog"], [class*="dialog-"]').forEach(dialog => {
          const txt = (dialog.innerText || '');
          if (
            txt.includes("custom intervals") ||
            txt.includes("See what others don't") ||
            txt.includes("upgraded plans") ||
            txt.includes("Invite-only script") ||
            txt.includes("Access to this script is restricted") ||
            txt.includes("Ready to trade") ||
            txt.includes("Sign up and gain access") ||
            txt.includes("Unlock Bar Replay") ||
            txt.includes("Look first") ||
            txt.includes("Create a free account") ||
            txt.includes("registration_promotion") ||
            txt.includes("Try AI Copilot") ||
            txt.includes("Copilot empowers") ||
            txt.includes("Non-standard intervals") ||
            txt.includes("Seconds intervals") ||
            txt.includes("Intraday bar replay") ||
            txt.includes("Go Pro") ||
            txt.includes("30-day Free Trial") ||
            txt.includes("trial period") ||
            txt.includes("Try AI Copilot") ||
            txt.includes("Copilot empowers") ||
            txt.includes("Non-standard intervals") ||
            txt.includes("Seconds intervals") ||
            txt.includes("Intraday bar replay") ||
            txt.includes("Go Pro") ||
            txt.includes("30-day Free Trial") ||
            txt.includes("trial period") ||
            txt.includes("Try AI Copilot") ||
            txt.includes("Copilot empowers") ||
            txt.includes("Non-standard intervals") ||
            txt.includes("Seconds intervals") ||
            txt.includes("Intraday bar replay") ||
            txt.includes("Go Pro") ||
            txt.includes("30-day Free Trial") ||
            txt.includes("trial period")
          ) {
            const closeBtn = dialog.querySelector('[data-name="close"], button[aria-label="Close"], [class*="close-"]');
            if (closeBtn) closeBtn.click();
            else dialog.remove();
          }
        });
      } catch(e) {}
    };
    setInterval(handlePaywallDialogs, 300);

    // ================================================================
    // Global ChartRead Branding & TradingView Logo Eradication
    // ================================================================
    try {
      const globalBrandStyle = document.createElement('style');
      globalBrandStyle.id = 'cr-global-brand-style';
      globalBrandStyle.textContent = 'span[class*="proPlanIcon"] svg path:first-child, svg path[d*="M12 6H0v6h6v9h6V6"], svg path[d*="15h-7l6-15h7"], svg path[d*="M14 22H7V11H0V4h14v18zM28 22h-8l7.5-18h8L28"] { display: none !important; visibility: hidden !important; opacity: 0 !important; } .chartread-nav-logo { width: 32px !important; height: 32px !important; filter: drop-shadow(0 0 8px rgba(0,255,56,0.7)) !important; vertical-align: middle !important; margin-right: 8px !important; } .chartread-nav-text { font-family: -apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif !important; font-weight: 800 !important; font-size: 22px !important; letter-spacing: -0.5px !important; color: #ffffff !important; vertical-align: middle !important; } .chartread-menu-logo { width: 24px !important; height: 24px !important; border-radius: 4px !important; margin-right: 8px !important; vertical-align: middle !important; filter: drop-shadow(0 0 6px rgba(0, 255, 56, 0.6)) !important; } span[class*="proPlanIcon"] { display: inline-flex !important; align-items: center !important; }';
      (document.head || document.documentElement).appendChild(globalBrandStyle);
    } catch(e) {}

    const patchGlobalBranding = () => {
      try {
        // 1. Home page & top navigation bar logo
        const headerLogo = document.querySelector('.tv-header__link--logo, a[aria-label*="TradingView main page" i]');
        if (headerLogo && !headerLogo.__cr_branded) {
          headerLogo.__cr_branded = true;
          headerLogo.setAttribute('aria-label', 'ChartRead');
          headerLogo.title = 'ChartRead';

          const iconSpan = headerLogo.querySelector('.tv-header__icon');
          if (iconSpan) {
            iconSpan.innerHTML = '<img class="chartread-nav-logo" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAOEElEQVR42u1ae3Bc1Xn/vnPOvbt77z61kh/ggo0lS4bJUBpI/FISDDY4YIyDY3da43ZKCHTauJ0GmyRAElKThD8SpimTaQIhCTS0hQY7soVVaFOD7dqWcQjgh4gL+CFZsi3J0r4f55yvf5zV1VperSTbCe3UZ3Z27uzee8753r/fdy5OmzobAIkIEWFigwCw0vUFDm+qcc3JiIae867GO3CU6wscOKE5hVH8xNX/v2Uw+D8+/v8KQJcs8CELgJcscHGG+O1qRgMAcM4BQGs98VLzoQjAAQgwSQBAQQSCwcGE1joYdG3b0pq01hdztXCo7qIVUA5AwBIECvLNduYLYd6ejYjgt7/ztUDA39XVffp0n5TKti0hxHnV/krLTpt69cXZegFYUlMYs4v86TVu9pM+kcLa67uiEHyrY4dt2Z2dXf/W9svNLVvf2PvrwcGE3+93nAAiXohrIeKFCcAAECBHLE1qCsstC6TudvPXCtAAebJOQXxRdxRC23a11tXGGSsljIMHOlpatr7c+srBA+8WCkXHcfx+30SCZBjkXYAAHAAA04R5kg0ivSKQWRUoNliQV5gCACI/Wr0Yv6knSu729rbaeNzsjzFmcJeUcveuvZs2tr76yrajR48BoOs6Ew0SRBT" />';
          }

          const textSpan = headerLogo.querySelector('.tv-header__logo-text');
          if (textSpan) {
            textSpan.innerHTML = '<span class="chartread-nav-text">Chart<span style="color: #00ff38;">Read</span></span>';
          }
        }

        // 2. In-Chart Hamburger Menu Logo (span[class*="proPlanIcon"])
        const proIcons = document.querySelectorAll('span[class*="proPlanIcon"]');
        proIcons.forEach(proIcon => {
          const svg = proIcon.querySelector('svg');
          if (!svg) return;

          const paths = Array.from(svg.querySelectorAll('path'));
          if (paths.length >= 1) {
            const tvPath = paths.find(p => {
              const d = p.getAttribute('d') || '';
              return d.includes('M12 6H0v6h6v9h6V6') || d.includes('15h-7l6-15h7');
            }) || paths[0];

            if (tvPath) {
              tvPath.style.display = 'none';
              tvPath.style.visibility = 'hidden';
              tvPath.setAttribute('visibility', 'hidden');
            }

            if (!proIcon.querySelector('.chartread-menu-logo')) {
              const crImg = document.createElement('img');
              crImg.className = 'chartread-menu-logo';
              crImg.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAOEElEQVR42u1ae3Bc1Xn/vnPOvbt77z61kh/ggo0lS4bJUBpI/FISDDY4YIyDY3da43ZKCHTauJ0GmyRAElKThD8SpimTaQIhCTS0hQY7soVVaFOD7dqWcQjgh4gL+CFZsi3J0r4f55yvf5zV1VperSTbCe3UZ3Z27uzee8753r/fdy5OmzobAIkIEWFigwCw0vUFDm+qcc3JiIae867GO3CU6wscOKE5hVH8xNX/v2Uw+D8+/v8KQJcs8CELgJcscHGG+O1qRgMAcM4BQGs98VLzoQjAAQgwSQBAQQSCwcGE1joYdG3b0pq01hdztXCo7qIVUA5AwBIECvLNduYLYd6ejYjgt7/ztUDA39XVffp0n5TKti0hxHnV/krLTpt69cXZegFYUlMYs4v86TVu9pM+kcLa67uiEHyrY4dt2Z2dXf/W9svNLVvf2PvrwcGE3+93nAAiXohrIeKFCcAAECBHLE1qCsstC6TudvPXCtAAebJOQXxRdxRC23a11tXGGSsljIMHOlpatr7c+srBA+8WCkXHcfx+30SCZBjkXYAAHAAA04R5kg0ivSKQWRUoNliQV5gCACI/Wr0Yv6knSu729rbaeNzsjzFmcJeUcveuvZs2tr76yrajR48BoOs6Ew0SRBT';
              crImg.style.width = '24px';
              crImg.style.height = '24px';
              crImg.style.marginRight = '8px';
              crImg.style.verticalAlign = 'middle';
              crImg.style.filter = 'drop-shadow(0 0 6px rgba(0, 255, 56, 0.6))';
              proIcon.insertBefore(crImg, svg);
            }

            svg.setAttribute('viewBox', '40 0 82 28');
            svg.style.width = '70px';
          }
        });

        // 3. Footer logo replacement
        const footerLogo = document.querySelector('.logoWrapper-s9vf589d, a[class*="logoWrapper"]');
        if (footerLogo && !footerLogo.__cr_branded) {
          footerLogo.__cr_branded = true;
          footerLogo.innerHTML = '<div style="display: flex; align-items: center; gap: 8px;"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAOEElEQVR42u1ae3Bc1Xn/vnPOvbt77z61kh/ggo0lS4bJUBpI/FISDDY4YIyDY3da43ZKCHTauJ0GmyRAElKThD8SpimTaQIhCTS0hQY7soVVaFOD7dqWcQjgh4gL+CFZsi3J0r4f55yvf5zV1VperSTbCe3UZ3Z27uzee8753r/fdy5OmzobAIkIEWFigwCw0vUFDm+qcc3JiIae867GO3CU6wscOKE5hVH8xNX/v2Uw+D8+/v8KQJcs8CELgJcscHGG+O1qRgMAcM4BQGs98VLzoQjAAQgwSQBAQQSCwcGE1joYdG3b0pq01hdztXCo7qIVUA5AwBIECvLNduYLYd6ejYjgt7/ztUDA39XVffp0n5TKti0hxHnV/krLTpt69cXZegFYUlMYs4v86TVu9pM+kcLa67uiEHyrY4dt2Z2dXf/W9svNLVvf2PvrwcGE3+93nAAiXohrIeKFCcAAECBHLE1qCsstC6TudvPXCtAAebJOQXxRdxRC23a11tXGGSsljIMHOlpatr7c+srBA+8WCkXHcfx+30SCZBjkXYAAHAAA04R5kg0ivSKQWRUoNliQV5gCACI/Wr0Yv6knSu729rbaeNzsjzFmcJeUcveuvZs2tr76yrajR48BoOs6Ew0SRBT" style="width: 28px; height: 28px; filter: drop-shadow(0 0 6px rgba(0,255,56,0.6));" /><span style="font-family: -apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif; font-weight: 800; font-size: 18px; color: #fff;">Chart<span style="color: #00ff38;">Read</span></span></div>';
        }

        // 4. Document title branding
        if (document.title && document.title.includes('TradingView')) {
          document.title = document.title.replace(/TradingView/g, 'ChartRead');
        }
      } catch(e) {}
    };

    try {
      const globalBrandObserver = new MutationObserver(patchGlobalBranding);
      globalBrandObserver.observe(document.documentElement, { childList: true, subtree: true });
      setInterval(patchGlobalBranding, 150);
      patchGlobalBranding();
    } catch(e) {}

  } catch(e) {
    console.warn("ChartRead main world setup error:", e);
  }
`;

    // Safely execute in main world
    const injectMainWorld = () => {
      if (electron && electron.webFrame && electron.webFrame.executeJavaScript) {
        try {
          electron.webFrame.executeJavaScript(mainWorldCode);
          return;
        } catch(e) {}
      }
      try {
        const s = document.createElement("script");
        s.textContent = mainWorldCode;
        (document.head || document.documentElement).appendChild(s);
        s.remove();
      } catch(e) {}
    };
    injectMainWorld();
    document.addEventListener("DOMContentLoaded", injectMainWorld);

    // 3. ChartRead Watermark Injection (Canvas Watermark Replacement)
    const injectWatermarks = () => {
      try {
        const isDark = document.documentElement.classList.contains("theme-dark") ||
                       document.body?.classList.contains("theme-dark") ||
                       window.matchMedia("(prefers-color-scheme: dark)").matches;
        const logoData = isDark ? darkWatermark : lightWatermark;

        const chartWidgets = document.querySelectorAll(".chart-widget, .chart-gui-wrapper");
        chartWidgets.forEach(widget => {
          // Centered subtle watermark
          if (!widget.querySelector(".chartread-chart-watermark")) {
            const wm = document.createElement("img");
            wm.className = "chartread-chart-watermark";
            wm.src = logoData;
            wm.alt = "ChartRead";
            widget.style.position = "relative";
            widget.appendChild(wm);
          }
          // Bottom-left corner single watermark (clean replacement)
          if (!widget.querySelector(".chartread-corner-logo")) {
            const corner = document.createElement("img");
            corner.className = "chartread-corner-logo";
            corner.src = logoData;
            corner.alt = "ChartRead";
            widget.appendChild(corner);
          }
        });
      } catch(e) {}
    };
    setInterval(injectWatermarks, 2000);
    document.addEventListener("DOMContentLoaded", injectWatermarks);

    // 4. Inject Premium Styling & Paywall Removal CSS
    const styleStr = `
      /* Eradicate TradingView 17 logo in the hamburger menu header */
      span[class*="proPlanIcon"] svg path:first-child,
      svg path[d*="M12 6H0v6h6v9h6V6"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
      }
      .chartread-menu-logo {
        width: 24px !important;
        height: 24px !important;
        border-radius: 4px !important;
        margin-right: 8px !important;
        vertical-align: middle !important;
        filter: drop-shadow(0 0 6px rgba(0, 255, 56, 0.6)) !important;
      }
      span[class*="proPlanIcon"] {
        display: inline-flex !important;
        align-items: center !important;
      }

      /* Remove all Upgrade, GoPro, Trial, and Billing UI */
      [data-name="go-pro-button"],
      a[href*="/pricing/"],
      a[href*="/gopro/"],
      div[class*="pill-"][class*="blinkAnimation"],
      div[class*="trial-"],
      .tv-dialog--gopro,
      .tv-go-pro-dialog,
      div[class*="tv-dialog__modal-wrap--gopro"],
      div[data-dialog-name="gopro"],
      div[data-dialog-name="sign-in"],
      div[class*="banner-container"],
      div[class*="upgrade-badge"],

      /* Remove lock icons on all indicators */
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

      /* Hide TradingView watermark, copyright, and logo wrappers */
      [data-name="watermark"],
      [class*="watermark" i],
      [class*="chartLogo" i],
      [class*="logoWrapper" i],
      [class*="brandWrapper" i],
      #tradingview-copyright,
      div[class*="chart-markup-table"] a[href*="tradingview"],
      table[class*="chart-markup-table"] a[href*="tradingview"],
      div[class*="layout__area--bottom"] a[href*="tradingview"],
      div[class*="bottom-widget-bar"] a[href*="tradingview"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        width: 0 !important;
        height: 0 !important;
        overflow: hidden !important;
        pointer-events: none !important;
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
        opacity: 0.16 !important;
        width: 220px !important;
        height: auto !important;
        display: block !important;
      }

      /* ChartRead Bottom-Left Corner Watermark - Perfect Size & Positioning */
      .chartread-corner-logo {
        position: absolute;
        left: 14px !important;
        bottom: 28px !important;
        pointer-events: none !important;
        user-select: none !important;
        z-index: 5 !important;
        opacity: 0.75 !important;
        width: 64px !important;
        height: auto !important;
        display: block !important;
      }

      /* ChartRead Neon Green Brand Colors */
      :root {
        --tv-color-brand: #00FF38 !important;
        --tv-color-brand-hover: #00E635 !important;
        --tv-color-brand-active: #00B82B !important;
        --color-brand: #00FF38 !important;
        --color-brand-hover: #00E635 !important;
        --color-brand-active: #00B82B !important;
      }
    `;

    
    // 5. ChartRead In-Chart Hamburger Menu Logo Replacement
    const patchChartMenuHeader = () => {
      try {
        const proIcons = document.querySelectorAll('span[class*="proPlanIcon"]');
        proIcons.forEach(proIcon => {
          const svg = proIcon.querySelector('svg');
          if (!svg) return;

          const paths = Array.from(svg.querySelectorAll('path'));
          if (paths.length >= 1) {
            // Hide the first path (TradingView 17 logo mark)
            const tvPath = paths.find(p => {
              const d = p.getAttribute('d') || '';
              return d.includes('M12 6H0v6h6v9h6V6') || d.includes('15h-7l6-15h7');
            }) || paths[0];

            if (tvPath) {
              tvPath.style.display = 'none';
              tvPath.style.visibility = 'hidden';
              tvPath.setAttribute('visibility', 'hidden');
            }

            // Insert ChartRead logo icon if not already present
            if (!proIcon.querySelector('.chartread-menu-logo')) {
              const crImg = document.createElement('img');
              crImg.className = 'chartread-menu-logo';
              crImg.src = 'data:image/png;base64,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';
              crImg.alt = 'ChartRead';
              crImg.style.width = '24px';
              crImg.style.height = '24px';
              crImg.style.borderRadius = '4px';
              crImg.style.marginRight = '8px';
              crImg.style.verticalAlign = 'middle';
              crImg.style.filter = 'drop-shadow(0 0 6px rgba(0,255,56,0.6))';
              proIcon.style.display = 'inline-flex';
              proIcon.style.alignItems = 'center';
              proIcon.insertBefore(crImg, svg);
            }

            // Adjust SVG viewBox so "Ultimate" sits right next to the logo
            if (!svg.dataset.chartreadAdjusted) {
              svg.dataset.chartreadAdjusted = "true";
              svg.setAttribute('viewBox', '40 0 82 28');
              svg.setAttribute('width', '82');
              svg.style.overflow = 'visible';
            }
          }
        });

        const anyTvPaths = document.querySelectorAll('svg path[d*="M12 6H0v6h6v9h6V6"]');
        anyTvPaths.forEach(p => {
          p.style.display = 'none';
          p.setAttribute('visibility', 'hidden');
        });
      } catch(e) {}
    };

    try {
      const menuObserver = new MutationObserver(patchChartMenuHeader);
      menuObserver.observe(document.documentElement, { childList: true, subtree: true });
      setInterval(patchChartMenuHeader, 200);
      document.addEventListener("DOMContentLoaded", patchChartMenuHeader);
    } catch(e) {}

    if (electron && electron.webFrame && electron.webFrame.insertCSS) {
      electron.webFrame.insertCSS(styleStr);
    }
  } catch(err) {
    console.log("ChartRead platform-preload error:", err);
  }
})();

//# sourceMappingURL=platform-preload.js.map
