(()=>{"use strict";const e=require("electron");var t,n;if(function(e){e[e.Classic=1]="Classic",e[e.Protocol=2]="Protocol",e[e.Both=3]="Both"}(t||(t={})),function(e){e.RENDERER_START="sentry-electron.renderer-start",e.EVENT="sentry-electron.event",e.SCOPE="sentry-electron.scope",e.ENVELOPE="sentry-electron.envelope",e.STATUS="sentry-electron.status",e.ADD_METRIC="sentry-electron.add-metric"}(n||(n={})),window.__SENTRY_IPC__)console.log("Sentry Electron preload has already been run");else{const t={sendRendererStart:()=>e.ipcRenderer.send(n.RENDERER_START),sendScope:t=>e.ipcRenderer.send(n.SCOPE,t),sendEvent:t=>e.ipcRenderer.send(n.EVENT,t),sendEnvelope:t=>e.ipcRenderer.send(n.ENVELOPE,t),sendStatus:t=>e.ipcRenderer.send(n.STATUS,t),sendAddMetric:t=>e.ipcRenderer.send(n.ADD_METRIC,t)};if(window.__SENTRY_IPC__=t,e.contextBridge)try{e.contextBridge.exposeInMainWorld("__SENTRY_IPC__",t)}catch(e){}}const r="tvd:debug-auto-save-dialog",o="tvd:screen-capture";class s{key;rules;constructor(e,t){this.key=e,this.rules=t}applyRules(t){const n=t??this.rules;if(!n)return;const r=localStorage.getItem(this.key);r&&e.webFrame.removeInsertedCSS(r);const o=e.webFrame.insertCSS(n);localStorage.setItem(this.key,o)}removeRules(){const t=localStorage.getItem(this.key);t&&e.webFrame.removeInsertedCSS(t)}}function a(e){let t,n=e;return()=>{if(n){const e=n;n=void 0,t=e()}return t}}require("url");const i="TARGET_TVD_HOST",c="https://www.tradingview.com/",d=a((()=>{const e="http(s?):\\/\\/((\\w|-)*\\.)?tradingview\\.com";let t=c;return i in process.env&&(t=process.env[i]??c),null!==new RegExp(e,"i").exec(t)?e:(t.endsWith("/")&&(t=t?.substring(0,t.length-1)),t.replace(/\./gi,"\\.").replace(/\//gi,"\\/"))}));function l(e,t=!0){const n=e=>{let n=e.toString().replace(/\./gi,"\\.").replace(/(?<!\))\*/gi,"(.*)");return n.match(/\w+(\/\((\.\*\)))/gi)&&(n=n.replace(/\/\((\.\*\))/gi,"(/(.*))?")),n=n.replace(/\//gi,"\\/").replace(/\$\{TV\}/gi,d()),n=`^${n}${t?"$":""}`,new RegExp(n,"i")};return"string"==typeof e?n(e):e.map(n)}const p="${TV}/chart/([a-zA-Z0-9]{0,12})?/?",v="${TV}/(\\w|-)*screener/*",u="${TV}/chart/[a-z0-9-._~:\\?#@!$&'()*+,;%=]+/[a-z0-9-._~:\\?#@!$&'()*+,;%=]+/",g=(a((()=>l(v))),a((()=>l("${TV}/",!0))),a((()=>l("${TV}/chart/",!0))),a((()=>l(p))),a((()=>l("(${TV}/chart/([a-zA-Z0-9]{0,12})?)/\\?*?"))),a((()=>l(u,!0))),a((()=>l("${TV}/screener/*"))),a((()=>l("${TV}/heatmap/*"))),a((()=>l("${TV}/community/*"))),a((()=>l("${TV}/pine-script-docs/en/v5/Introduction.html"))),a((()=>l("${TV}/pine-script-reference/v5/"))),a((()=>l("${TV}/x/*"))),a((()=>l("${TV}/*"))),a((()=>l("${TV}/account-recovery/*"))),a((()=>l("${TV}/chat/*"))),a((()=>/:\/\/s3\..+\/snapshots\//i)),a((()=>l("${TV}/pine/*"))),a((()=>l("${TV}/markets/*"))),a((()=>l("${TV}/markets/*/news/"))),a((()=>l("${TV}/markets/stocks-*/*")))),h=(a((()=>l("${TV}/markets/world-economy/*"))),a((()=>l("${TV}/u/TradingView/"))),a((()=>l("${TV}/news/*"))),a((()=>l("${TV}/news/"))),a((()=>l("${TV}/news/\\?market=*"))),a((()=>l("${TV}/news/\\?market=topstories"))),a((()=>l("${TV}/HTML5-stock-forex-bitcoin-charting-library/"))),a((()=>l("${TV}/support/*"))),a((()=>l("https://status.tradingview.com/",!0))),a((()=>l("${TV}/ideas/*"))),a((()=>l("${TV}/scripts/*"))),a((()=>l(["${TV}/","${TV}/ideas/*",u,"${TV}/scripts/*","${TV}/script/*","${TV}/community/*","${TV}/widget/","${TV}/markets/corporate-bonds/*","${TV}/social-network/","${TV}/the-leap/*","${TV}/broker/*","${TV}/data-coverage/","${TV}/markets/stocks-*/*"])))),m=a((()=>l("${TV}/markets/bonds/*")));function b(e,t){const n=e.split("\n").join("");return t instanceof RegExp?t.test(n):t.some((e=>e.test(n)))}a((()=>l([p,v,"${TV}/markets/*","${TV}/symbols/*","${TV}/(\\w|-)*calendar/*"])));const w=window.location.href,T=`\n\t.tv-market-heatmap__standalone-title-wrap,\n\t.tv-screener__standalone-title-wrap,\n\t.tv-footer {\n\t\tdisplay: none !important;\n\t}\n\n\t${k=w,b(k,h())?"":".tv-header { display: none !important; }"}\n\n\t${function(e){return b(e,g())}(w)?"":'.tv-economic-calendar [class^="separator"],\n\t\t.tv-content [class^="container"] [class^="marketHeader"],\n\t\t.tv-content .tv-category__tab-page [class^="marketHeader"],\n\t\t.tv-sticky-symbol-header,\n\t\t.tv-screener-toolbar {\n\t\t\ttop: 0 !important;\n\t\t}'}\n\n\t.tv-content .tv-category__tab-page [class^="shadow"] [class^="tableWrapSticky"] {\n\t\ttop: 58px !important;\n\t}\n\n\t.tv-content .tv-economy-country-tab [class^="table"] [class^="stickyContainer"],\n\t.tv-content .tv-economy-indicator-tab [class^="table"] [class^="stickyContainer"] {\n\t\ttop: -1px !important;\n\t}\n\n\t.tv-content [class^="container"] [class^="shadow"] [class^="tableWrapSticky"] {\n\t\ttop: ${function(e){return b(e,m())}(w)?"-1px":"58px"}\n\t}\n\n\t.tv-category__tab-page.tv-card-exterior > .screener-markets-page-container > div {\n\t\t--screener-sticky-offset-top: 63px !important;\n\t}\n\n\t.tv-screener__standalone-wrap {\n\t\tpadding: 0 !important;\n\t}\n\n\t.i-hidden-on-tvdesktop {\n\t\tdisplay: none !important;\n\t}\n`;var k;const y="tvd:session-storage",R={initCachedStoreSync:`${y}:init-cached-store-sync`,setItem:`${y}:set-item`,clear:`${y}:clear`,removeItem:`${y}:remove-item`},V=new class{#e=null;getLength(){return this.ensureLoaded().size}setItem(t,n){this.ensureLoaded().set(t,n),e.ipcRenderer.send(R.setItem,t,n)}getItem(e){return this.ensureLoaded().get(e)??null}removeItem(t){this.ensureLoaded().delete(t),e.ipcRenderer.send(R.removeItem,t)}clear(){this.ensureLoaded().clear(),e.ipcRenderer.send(R.clear)}ensureLoaded(){if(null!==this.#e)return this.#e;try{const n=e.ipcRenderer.sendSync(R.initCachedStoreSync);if(t=n,Array.isArray(t)&&t.every((e=>Array.isArray(e)&&2===e.length&&"string"==typeof e[0]&&"string"==typeof e[1])))return this.#e=new Map(n),this.#e}catch(e){console.log("TVD.sessionStorage cachedStorage init request failed with error: ",e)}var t;return this.#e=new Map,this.#e}},$={getLength:function(){return V.getLength()},setItem:function(e,t){V.setItem(String(e),String(t))},getItem:function(e){return V.getItem(String(e))},removeItem:function(e){V.removeItem(String(e))},clear:function(){V.clear()}},f={updateLinkValues(t){e.ipcRenderer.send("tvd:update-link-values",t)}},S={getDesktopStream:async()=>await e.ipcRenderer.invoke("tvd:get-screen"),async getCurrentCameraDevice(){const t=await e.ipcRenderer.invoke("tvd:get-camera");if(t)return A.findMediaDevice(t.label,"videoinput")},async getCurrentAudioDevice(){const t=await e.ipcRenderer.invoke("tvd:get-audio");if(t)return A.findMediaDevice(t.label,"audioinput")},async findMediaDevice(e,t){const n=await navigator.mediaDevices.enumerateDevices();return n.find((n=>n.label===e&&n.kind===t))?.deviceId},startedScreenCapture(){let t="";window&&(t=window.location.href),e.ipcRenderer.send(o,!0,t)},stoppedScreenCapture(){let t="";window&&(t=window.location.href),e.ipcRenderer.send(o,!1,t)}},E={setTitle(t){e.ipcRenderer.send("tvd:set-title",t)},reloadTab(){e.ipcRenderer.send("tvd:reload-tab")},layoutChange(t){e.ipcRenderer.send("tvd:layout-change",t)},getActiveWatchlistId:()=>e.ipcRenderer.invoke("tvd:get-watchlist"),onActiveWatchlistIdChange(t){e.ipcRenderer.send("tvd:watchlist-change",t)},layoutRestored(){e.ipcRenderer.send("tvd:layout-restored")},setFocusPineEditor(t){e.ipcRenderer.send("tvd:focus-pine-editor",t)}},x={setNotification(t){e.ipcRenderer.send("tvd:set-notification",t)},setNotificationViewed(){e.ipcRenderer.send("tvd:set-notification-viewed")}},_={setCredentials:t=>e.ipcRenderer.invoke("tvd:set-credentials",t),getCredentials:()=>e.ipcRenderer.invoke("tvd:get-credentials"),insertCredentialsText:t=>e.ipcRenderer.invoke("tvd:native-input-string",t)},I={setLocale(t){e.ipcRenderer.send("tvd-main:set-locale",t)},getTheme:()=>e.ipcRenderer.invoke("tvd:get-theme"),getThemeSetting:()=>e.ipcRenderer.invoke("tvd:get-theme-setting"),setThemeSetting(t){e.ipcRenderer.send("tvd:set-theme-setting",t)},getReports:async()=>await e.ipcRenderer.invoke("tvd:get-reports"),signIn(){e.ipcRenderer.send("tvd-main:initiate-sign-in")},openSettings(t){e.ipcRenderer.send("tvd:open-settings",t)},openNewWindow(t,n,r){e.ipcRenderer.send("tvd:open-new-window",t,n,r)},log(t){e.ipcRenderer.invoke("tvd:log",t)},sendToSentry(t){e.ipcRenderer.invoke("tvd:send-to-sentry-breadcrumb",t)},crosshairSyncEnabled:function(){let t=!0;const n=new Map,r=e=>{t!==e&&(t=e,o())},o=()=>{n.forEach((e=>e(t)))};return e.ipcRenderer.invoke("tvd:get-crosshair-sync").then((e=>{r(e)})).catch((e=>console.log(e))),e.ipcRenderer.on("tvd:crosshair-sync-setting-update",((e,t)=>{r(t)})),{value:()=>t,subscribe(e){const t=self.crypto.randomUUID();return n.set(t,e),t},unsubscribe(e){n.has(e)&&n.delete(e)}}}(),sessionStorage:$},A={...S,...E,...x,..._,...I,...{openAutosaveDialogDebug(){e.ipcRenderer.send(r,!0)},closeAutosaveDialogDebug(){e.ipcRenderer.send(r,!1)},errorAutosaveDialogDebug(){e.ipcRenderer.send(r,!1,!0)}},contracts:{link:{OpenExternal:"OpenExternal"}},linkingApi:f};if(function(t){if("darwin"===process.platform)return;const n=new s("scrollbarTheme"),r=e=>{const t="light"===e?"\n\t* {\n\t\t--scrollbar-thumb-default: #D1D4DC;\n\t\t--scrollbar-thumb-hover: #B2B5BE;\n\t\t--scrollbar-thumb-active: #9598A1;\n\t\t--scrollbar-track: #FFFFFF;\n\t\t--scrollbar-track-border: #E0E3EB;\n\t}\n\n":"\n\t* {\n\t\t--scrollbar-thumb-default: #50535E;\n\t\t--scrollbar-thumb-hover: #868993;\n\t\t--scrollbar-thumb-active: #A3A6AF;\n\t\t--scrollbar-track: #131722;\n\t\t--scrollbar-track-border: #2A2E39;\n\t}\n\n";n.applyRules(t+"\n\t::-webkit-scrollbar {\n\t\twidth: 9px;\n\t\theight: 9px;\n\t}\n\n\t::-webkit-scrollbar-thumb {\n\t\tbox-sizing: border-box;\n\t\tborder: 2px solid transparent;\n\t\tbox-shadow: inset 0 0 10px 10px var(--scrollbar-thumb-default);\n\t\tborder-radius: 8px;\n\t\tbackground-color: unset;\n\t}\n\n\t::-webkit-scrollbar-thumb:hover {\n\t\tbox-shadow: inset 0 0 10px 10px var(--scrollbar-thumb-hover);\n\t}\n\n\t::-webkit-scrollbar-thumb:active {\n\t\tbox-shadow: inset 0 0 10px 10px var(--scrollbar-thumb-active);\n\t}\n\n\t::-webkit-scrollbar-track {\n\t\tborder-radius: unset;\n\t\tpadding: 2px;\n\t\tbackground-color: var(--scrollbar-track);\n\t}\n\n\t::-webkit-scrollbar-track:vertical {\n\t\tborder-left: 1px solid var(--scrollbar-track-border);\n\t}\n\n\t::-webkit-scrollbar-track:horizontal {\n\t\tborder-top: 1px solid var(--scrollbar-track-border);\n\t}\n\n\t::-webkit-scrollbar-corner {\n\t\tdisplay: none;\n\t}\n")};window.addEventListener("load",(()=>{if(window._setTheme){const e=e=>{"theme"===e.key&&e.newValue&&r(e.newValue)};window.addEventListener("storage",e),window.addEventListener("unload",(()=>{window.removeEventListener("storage",e)}))}})),t().then((e=>{r(e)})).catch((e=>console.log(e))),e.ipcRenderer.on("tvd:update-theme",((e,t)=>{"string"==typeof t&&r(t)}))}(A.getTheme),function(){const e=()=>{new s("desktopOptimize",T).applyRules()};window.addEventListener("load",e),window.addEventListener("unload",(()=>{window.removeEventListener("load",e)})),e()}(),process.contextIsolated)try{e.contextBridge.exposeInMainWorld("TVD",A);try{e.contextBridge.exposeInMainWorld("ChartReadCloud",{saveUserData:(d)=>e.ipcRenderer.invoke("chartread:opensearch-save-userdata",d),getUserData:()=>e.ipcRenderer.invoke("chartread:opensearch-get-userdata"),saveLayout:(id,d)=>e.ipcRenderer.invoke("chartread:opensearch-save-layout",id,d),getLayout:(id)=>e.ipcRenderer.invoke("chartread:opensearch-get-layout",id),listLayouts:()=>e.ipcRenderer.invoke("chartread:opensearch-list-layouts"),saveDrawings:(s,d)=>e.ipcRenderer.invoke("chartread:opensearch-save-drawings",s,d),getDrawings:(s)=>e.ipcRenderer.invoke("chartread:opensearch-get-drawings",s)})}catch(_e){console.warn("ChartReadCloud expose err",_e)}}catch(e){console.error("Failed to expose API:",e)}})();

// ==========================================
// ChartRead Desktop Platform Preload Injector v6 (Optimized & Dynamic)
// ==========================================
;(function() {
  if (window.__cr_preload_v6_installed) return;
  window.__cr_preload_v6_installed = true;

  try {
    const electron = require("electron");
    const CR_LOGO_URI = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAIAAADdvvtQAAA430lEQVR4nO19d5wcxZX/e1U9M90TdnZXIknImAOEhIgKgG2CJJMkAQKTwWQDPgNnjI1tDPwAgUk22D5MMNjAwRmwTVBCwoBQFggOEEGAQBgUUEBod2d2J3fV+/1R3T09aXdmt2e1hvkyHzHbU91dXf3q1cuFw4aMAiAABAAAICIiAhuIiIjquHOktFmlxoVQp6gbOV8kIgNgiGBfkgAJgalLOc2JpOt0AADGWPHVSQAwAAnA3A1KH8r9IOW6Wvxc7ruU/bWbWwCAlNLdU8Z40UUKG+RHsuQBCQDU+JTrj7RPZ66BIgKJwJ0rW6Nc0ttKIJLO1Uo7hkN3HAlICAgIQEgggfItur/0gAZKINZzsyovZo/7AAER1fJqCiaet93QiBT1ICjiBqbuNaDGqzfwjnpg4I1GjRO7jlyAAVBRZ9zceKANXAMDDUrU6H4JbNDQAEVZSbSfwUqZ4b+x3NNA/wILxfWCH/q/Nw3UirLKWj+Ddc8DB0IXGxjI0Cr90KCbBqqBl7puA19DNAiogT6hQUAN9All1PgGGqgeDQ7UQJ/QIKAG+oQGATXQJzQIqIE+wTEk1itkpO8gIlCxJsAaEv9AAwMAQNlTs20Gl6eFnIi7BgYONACPY6+8hW1lQJsJNTCwUNEXNvCw7Vev6sOovz4YuLxnAKJBOqVoEFADfUKDgGpDgwkVoUFADfQJDQJqoE9oEFADfUKDgBroExoE1C2UjX4AW+r7E1aGBUr3nw0C6hbKRj+ALfV9RrVKZT7wsHA0/o0s0Q3UAUjuWhrdoJL94is8t3oLBOBlxpRz/hUM/+0Dc1Uk1SAgFxgAR8gRxUwsnG9E1NERy2aznPOvJiX1FnUloH8foy1D4AhpgjbTbGW5s5oghChI1b2RUhqGfuqpU7ffflB7W3ssFhNCcs6LKlx9LUE4bMio+pjnSVWsqsOVPQVHIMCEkILMPXn2pFD6rGb0Y8sh61mMyIcIaJoiHA6+uWKhKcwXnp/37LPPvbLs9a1ftvv8vlAoqGmalLKoxNjXBMigfgSkMFDJCAEYogDqNMlH5jg9dWYofUwwtx0QUeATGDRpE+sC0AABhRC6Hli4ePbOw3ZWZ3/66Wf/nDtv5sy5K1a81xnv0nU9GDQQUUr5tXKWIX4NCQgBGGCOIEEyCtnvGqnTQtlDjGwYICExC2SQvoENnrQJ4tIhIMMILFwyZ8iQnYQpGGfO4vXuuytnTp/zwgvz333n/VzODIWCuq4DwNeBkhARsI5L2MADA0DEtKSEKXZi4vho4gwjM8ZvEkGXBIHIEYAoAKHPWcvkjRBzE5C+cMmcoUN3UsUJFX1wxlWUWy6XW7rk1enPzp7/8pI1a9YRQTgc8vn99JVe2hAR8GtiB1Kkk5SUFbn/4OmTIumTI9kRfmkKiOeAGHACTdWARUAkQSSlW9NCROb60+FAipJ8Pt/4CYeOn3BoR0ds4YIlM2fMWbLolU0bN/t8gWA4yDn/9xKSEJCqU4AQ8atOQBxAIiQESGnu48+c1Zo8Xs8MBUoRdOQAEVhBtDURAYEQAiQhYI+jqCiJSNXppebm6NQTpkw9Ycrn6zc8P/eFmTPmLl/+ViKRNAzdMAaAkFRauTZvSCQr7hyJrDKrrgZop+0QFMUWf0WXMARgCAKgS5CPcgdq2XOakscYZguTCQkZiQxdgpkrpYkAAhhYS4Mmb2JdaC9h0jACCxc/N3TnIZKom9wiIpJSIqLDot568505c16YPfP5j1atzpkiFAoGAgHYZkJSafJW2SMKWKGB/TMiMvzKEZAinRxBpymbwJwYTJ8dSR3iy4UIEhKzDBiQxVnUhFIDVEBAxjpsmbyRdTpamNR138Ilc3feeQhJKljMKkBREmNW7Yp0OvPqK8uffXb2/JcWr1m7HpGFQiGfXyNJA2JpU0tWjeqOIqCv0BJmychEqZzYAbOnBNNnhjNjAiZHSAhoB+SMuJOjiIqKCME5Yl9IInCbayuQmmxQdf4lInLOweY0uh4YP+Gw8RMOa9vaNm/ewpkz5ixb8tqXW7Zqfn8oFOScSSml3HbTmKzS4L049StBQByQgJIEWTO3u5Y5sTl1ipEZwcgESEokIAbAgYBctGLX7qc8DSGhvR0DY8gITDe1KD5dqw/DFpJISgKg1kGtp5x64imnnrh2zdrnn5/3zFMzV7z1XiKZMgzDMPRtLST1xtry77yEob0xRpdERuYB/uRpofSxRnYop5SAFAEiMDfLkK4z0UU6rlWfEPxgrGeDJm/CTiJbjQ8G9QWL82p8r7tcKiS9+caKWTPnznnuxdUff2KaIhgKbVMhqTYgQxw2dBRtQ+bZOyhBxyTskkKXuUMC5jktySMC2QhRQmDWogQAAJDltrlwOJBKl3YRBCH4UV9DrcduYgkGHBBQShkMGgsXP7fTkB37SEAOpCQiqZY5AEilUkuXvDpzxtyF8xevXfs5AYZCIb9fkwNESKoAZKjVxePp6UYnhVcGYAgZCUlTNKN5RjB9djg1zi8CRF0mtgMye2Maa8Wxds0poSEqFH1ccjQ6C5XFvdSp3vIDxhAgLyQZhnHEkROOOHJCe3v7gpcXzZg+d+mS5Zs3b/H5/cGgoWl8wFLSgJOBKu6LYxsDIW3mdobchU2p00LpvTUCgISElCIdAmsvI3WpostaXwuXLQDIG3ys8xgi4y6hkqQUdXp7LiFJAkBLS8uJJ0098aSpa9esmzv3xVkzn3/rzXe//DI2UCxJJRhwMlAZAmIAgJCUaJK5J0ufGk6eFMztymWWMEVqgyG7BIz7RGanskvXJbGUgGxhyLaeBZixHlsnb8I4uV0Zi5bOHeLdElYJpULS22+/O2vm8y88//J7772fy4lweAAJSYgD2Q7kkpEJSRzgz57TlJiiZ7cHSgjI2P4FLEs94Ap1KlW+8o3dxmZShpAAM9Zjy+RNzEVAoZCxcPEcD2WgHqGEJMY4Wu627OJFr8x49rl5Ly9at3YDIoZCQZ/ft20tSQPVleHIyHEpdRDj9fRZwdTRerYJqEtAm4r/AgAgpZsDIVFlG5hjh0fXEVRKmeOwIGfXIioTJmxtpdiPKBKSfD7/xO8ePvG7h7e1tc9/edGsmc8vXbp886YvfJo/GNqWQtIAIyBEYABZCZ2mbGXilFDyzFDmEH/WL6FTQjsCA8hvF+muPQUuw6CCBGDVxIyXNiAEBImWf8g6tq3YdLElqbXlpJOnnnTy1PXrN8yd88Ks6XPeeOvdL7+MGbpuBA1kKEX/LW1EhDvvtJf7yDYrw8MAESElZUrKIZg9Lpg+M5IZHTClhIRAicSK9CYJlsCE4DgnoIAPITEoJqlugABo+cLWwaDJm3gnUEE4x3NDhw7ptyWsEkqFpPfee3/WjLlznnvx/Q9W5TK5YCik6/0nJCkCsl8MSrcJpX+AjBFITBCZIjecZ08Kp08OZXbXZE5CUiIwYACotn4tVJ1c5Z7QshpYq5L1OIBQICMXX6GoI+o2EGDGWmiZsoF1IXB0AsoWLZ0zZMi2JyAHRe62XC63bOmrM6fPeXn+4s/+tY6IgqGg3+8HICll/QhJAwBAQgIC7O8MOo4gAOICNRBjA4nT9NQUI7eTRikBHSYCA4YWbyn3/IXTq8iH7P4CSGqXWnWwkrRElhgNEhhjgO6bImO1JmEKIZy3Ww8Uudt8Pt/h4w89fPyhsVh88cKlM6Y/t2jxK5s3bWGMB4OGpmmOpcBTkAZAQKxf13dHRu4wKYyZSXrmrGh6QiATEdAlsc200mss1uLmKO4V1q2HO8o5KzwFwBaTUQIxtLlS6eM62hlYXg5gbgpCUNtaVwXTNDVNc7/dulJSkZAUjTYde/ykY4+ftGnT5pfnLZo1c+4ry17/8sutuq4bhl7uAr2WWwgQcOchI/qP8TgO86SQ22HmaD13TnNynM/UJCYITAAGVKxgk0UhxT5zcHshsDDQySEgBARBxAhCDNMEgqiEgBT9EQKAREIKsOA6bJm8EfPhHCIYNBYt6VmNV2vK6o8/+cmPfzl58lFTjjvmG7sMUz8JISxGVucVsFRIWr36k38+P2/mjLnvr/yozAlW+GEve4U77zSiP9ILGQAgpiSkhdiFZU4Jp04OpkdokhCSAgltQYdKOI20j0ChKg6uZlSOgBAlkEYY4lqW6QuTuW/y9DCErFLcixiY+j8hIelorMVBkzdAJ4CGvSCgVR9+9O2Dj85lc9tvP3jCxEOmnjDl0MO+HW2OqjbCFMiwH3LKSilp0tEnvbb8rXA4VLyWVZ3gXAqNqOYQhdrAAQgxIYGkOVLLnNaUPCGU+yYXGRM7JSISU7xGVhBwC+JyXBadImOg9QwqJhUAwA8Q5YEO0p9JGY8ltUWJtuk7wG4+yKgHzt+MLEGLLEFb6W5qR/R8N2rYH5lx3hQJE2Aqk3nqqdlPPzVr2LAhRxw1/nsnHX/gQWN9Ph8AEIEUgvH+EZJICOHzaX6/v3zQTx/UJq1eejtaQaUYE6RR7ttG6vuh9BGB3GAmkxLaTEAgOwUdwXmNjihD1rpVpncON3KUR/urBCQkHVhI820yjScT+l/jvrdyQAyCHDWmVu3SiHH7LmT9i1hoo7bvUjVIkpCCcx6NNgHIzV9sffCBxx577B8jRwyfNPm7k6ccve9+e3Ot34QkRFT38vjKRFQfQyJHyEmMmdCsmSdEEqcbqcN8uSBAl8B2CQyAq7fDrG5g0RpE9vFuxpSclZesdZwgyLif6Z9C8OlO/rcO7WMBPg4RjQhQgIYcUDlHKg8kMkAGCIiIvQvRA5BCSJKASJIECADw+/2GoUtJH3zw0Rtvvv2HPzwwZsy+xx53zOTJRxUKSVAnSiJrRntvqtbsQDvvOk2AHTmxHU9/L5w9N5od68uCCXGB7QicESdUHoi8MKucEeB8BwDLtJBHgZZUoKJLIASKMB8w/7s544m4PivN1uWkziHKgYiEdaawfO1QuCwWAG2JqOhnopqMcigLRSUiMk0BAIZhhEIhYYpXlr2xcMErt9/2h/ETDjnuuGPGTziktbVVNRZCuAUXD4E18tFqoCGSZ2WmEFCA1Cl9YXPyrEh6DyalgM4cSLCCjEHas7qIIMj1p/OrChos48BSbVECaUhR9Ge5vjgbeLTN/3Iat0oMcWrRQBIIyp8qJEkJqIT5iryFQDFExsqsc9UOQzdJVU6CWDgcYiySzWSnPzPnmadm7bLLsKOOnjDl2KO+9e2DVG4reEpJ9nBj9U9R1WURPZWBECAjxShf/PrWrGlCzEQEYEDcdlTZPkmsyF1cR8n6l9AdAI9ACBLQhxBl/k7wP9UZeiLlX5alBEGEQ4tGkkgUyk6WoupI35U4ECrRHBEBsShYsTDIrNthQOyxkaIkW0iCLVvaHnzwsUceeWLPPfc46qjxU447ZsyY/epiSUKP7QjeCtEIgEiMYgKQkDPI5+c5zKNI0EHXv2RlsdnUZsUTunLfQAIEkIU03xZp/COh/28nezONxCisYQsjIRXXKX0kREDukA1VYEKKfJhEKUEylxxNDuurbrRsKbyHGU9ESvTx+bSWQDMRrf7403ffef++ex/ae5+RkyYdMXnK0SP32lM19oCSCu0XnsBbIVpJMxI0UCuBI99gfs+vInsgouVlQIflOK3yRhf19gzGdK6vE8bDcd9f49rKHGqcIn4AAAHUbcwgAZAEQLJvUJYJWSxKCgIpEZjjja9x2hLZWmTVJ1iUpOv+YFAXQq5YsXL5q//3u7vuO/Cg0VNPmHz0MUfsuOMOqrG1tCGrde4TqY+XNOS1FqYkZKBCLdg22KBDE46ILF1mzLwgrSgKlejLCEKM+bixSgT/FvM9neCfZcHPKOojAhBVdYuIpDSBOBAVjXthHAgBKasnt9OAEACYnRdW21jUDilJSgEAoWAwEg6Zplgwf9mLLyzceeedDjvsW8dNnTx+wqHhcEg1rtndVvzoHsB7Nd42s7jZv7UCkXIaWKbLIgojKpDllQtCQpRx8gXeyuj/u1V/Ls03AwU5RX1AVB3pWNdHRGS8rAJfmOMMFkH3bZ72XdtxyjE0RcKIGIt1/e3J6X//+4zd99j1yCPHH3fcMQcePJbz6l6f/SRCSu+1MI+vB0BILL9aob0pIliubvVD3sRTLEFbuhoHaOZalukvJ/X/SQXmpzFOGObUCiAgr15VDQRkyHoUAFyyvlrC7ONUo1GooqGgZggpAUDTeHNLMwCsXbvh7rv//OcH/2e//fY9ZtJ3zzr7tB122B66NcQUW0RLO1spkaEK1IEDgYrdAQRmGwmRiqdkXk8hBHvSA0ggP2IU/XGmT08Zj3VqC5OQBWzyQwuQJDB72SsCZYhlPVUuIQClgrEyx6uFirD1crI7QlLA7w8aupTy3Xc/fGn+wqFDh5x+5snK/1+xNzYNaRqv1KbXvfKagKjwS158RlIFiSzdGAuqp0hAYqQjM9D3hdSfTBqPd7K3skwyCPsgBCBKFqwafcgIRCABWE+iLbMF/1I7uMf6S+/g2CSDQaM12qzopgcxyKYgxsoTUF+Wa885EHGuIfeByJbMWSo0LttrmiAIMvRr+r/M4LNd/r/H+YcCfUghHwCBrCAm98L/V3hKZb7NkKn1jtyNqynKYd2H7Jo69YSUUghhkXu1xO39HNC8NSuRUtqxdFKUWn0ACMAPPODT3zP1v34ZmJFgnxPqjJo1IgKvE65Vh/Lu+vJNkACQmAQlydnrbC0GFMsMWX/YQWTVyuwka4gpqAbep/UggJCSJAESSsyLyi5TMpKtxQdAXwtNv2vz/TPBvpQY1GQLktsF4R1cTo3KZmiHvgkLy7sAEVUfV4zFZ9cTlueuqpvVIzSaKYHXO6BF5oSSKUkCCs2GYAUASoIg9y9N6w/EMMeoxSd9AKJqZlxrt6wVk9zyO5LynTKXCYpss3OJzcRtB+0R/SUvoeUcrooDFdpqvYHH8UAW00dyW1ysWA2LCSGoZU5p936UUQ4cwaz3kCMCK2PLRyoIxyMAkEREJNGliKHd4apGq/+kbTfddwdr3iC3//Lq/tLjmAEEYIXLViGoqDEAYPfJNh7BJpxiN6dj80Ql0qNUNh9W5PCtRarpN/pBtCLqe+RAtiVXAoCXIfAEdQhfQmDKZ174DtQsd2pkkAoBo3qY18t2yrIGFrk3baau5DJEiSAA/Rx5caZK9eInQneCumdQgpaUUB0HAgCSwuu37XXUkiVBUJHjHfMrG4Arwa/EL1U3kOOKdunmhMw2SiEpJUVnLOLX2gRkZQmrqrarshaVrffIx6j0zIFs+Q09FqNRal5a3QEA7KcqcE7YHLTYBYY9ZYt6CSJygmjzBxFBAkgCA5mhBT4Wof+N+5/upBQCLyCbmpzrHna7AlR8gBUl0CMHUo/tFETzDIQagfTc5oUF/KXys5Hsj4wi615EVn9cKqEEkgAhxgKor5LBx2P+J+NsPWFEA61ozaphiGwPeRHTqskZ0iOsIVaeslreoMcsSAOv83oQAICBFPbbKmXotgOVEIjqEeVUpleITOOgFEBgJAmAyOCaphkrzcCjHb7pXdoWgCCjQUiyzJSuPvqGyBXJlO+BY0TwEE7x4ersQGr/Bu+64HVIqwI5+g6UowxbuCaLdiCfmFxHEBBJAmAoACRBhHHGjDfN0KNb+axO/JIwrFEUoYIZk0jKqg1mNusqMsWXTyiyLVQ1g4hcVfuqvkKxFtF7qBnisStDKTsEEhg5div7R8pTj31A2ar7RwgiU4BAjHCfT9NfNwMPtmlzungnUIhRi+2Vq3QuQfW1bNECABS62ywacg94718nAhBY9RJ6jjCw/k9KZ+jlLcuhHnlh5OKrBRY69cUJki+3utULCKi1+DRDMxZkgo+1a3OS2EnQpFELgQAUPTDivCGxqlXI03WiAggAkHFevX3TW8qxGK3Wl7zoSkDbIO2mGyQnjpUsX1OlVc5zEJAGweUyeE+MPxvDNECEQQsDYQcY9TQAiGglP1UxVCq3g6gcb/V0qImkCu3o2Yzo+DAIoGzHeos61IlWxYYsPyq67Ifo0JDtP2BYe2R4b4CAhNqvNmMWKayBXjlKpAKIyFrCquBAlgRUYwJNrWGBnHPONMY5VC1EQ4WIlD5GJHrsCwNGdtYM2owHQBl6CV11C9EK/OifhYwAAoyMcrFpPQOJagiEUPaZbDaTywlW7BGhQkmIlARsz7KytyBbYEVHQEdEjfNkMlmbLxzLL2K1UU/hklUHGQgZA7SlQ0VDiuuA+18CAIR+3aKGauM6hWfWwE6QYc40h+6803bbDc5mc4ypqkcSkTmzBZFZSeUMbfGcCor2YaHVGG0WaFmTyefzx2Id0WgUlPeo31D4xuoQE21r5UpHL4xCdL5bzAmt7/2mivUSBQnWVcDM5bbbbvDsOX9jrC7byxfZmWxRumpgX7yqBUNQj2eTUhniLLkHi3+3y3iq9W5gU05vQJIikfCSxcvvvefPjDEVDO8temd8ISmt05x30Gd4TkAEyJSJ2TIWliEQysuiBP1jie4ranphCEKIlubmu+68d/XHnzDGRL122qgReRnIM0OD1/FA6MRtKZQhDnSlrdrsqJ988r0GAlQfVA8ARKT5tHis8+pfTlMH6tSxmsBY7em1PXA7rwPKLJRuFdAbn/YAQ9U0oHxhQojm5ubn5877xz+e5ZzXYyGrFV7nxUOvxajK11N+RIaWMG2zmhL1kexKYf3kTO1POCq/lDIUCt16812xWKwvthbvelbzGd2wH0QE4KwuLw8JmKIa5l6ebIOQHZ2IVp2Fgb+E1ZzXDAgAUkrD0D/55LM7f3s3Y2zb7xjXzY405VCFqI7ea0G24IxWGoRL3nfzoYFOMoWoUYbOj7xayP503yNvvLFigCxkvUARJeV9xQg91xuoGaoOARVUeCmhfLQ3A4N/E1qqtZPWLFIloXI5cc3V0yzq2XbrWK3Mwllzu1l8mbfvz1qaiIrUr5K9mNSPjMrFyHR7AyqVp/oBtXWSpF3KSQKAECIabVq29PXHHn2Scy7kNmVCNb5topJ3WfhrHbQwJku3EygHabGqmjyOxfn1/YVablrqnhFCRCLhW35918aNm7ehMITIeiPHK6+T+4AN8NwOZPv9yqjxtlve+TC1/UlNG72Qq+xcvcDLRHKjYz2vorec2aFDjvGCyO/3bdq45eabfrNN1DF1P8a456FK9bADUan+peAo9eAuA90/mYXVgCMCYLuUJkGF/IVq2CUiY6xYvTVN0dra/Pj//mPeSwt6J00LIUzTNE1hmu4v7k8prJ+EKUzTJJCeB4B6rsYTACJwcDylxUILOkFC1l8DQYjmAADYYUoh0meFs/fvRAZCYZhi9UsnKjVM7QjsAhFpmu/G629Pp9O94EOcc03TNI1rmvuL+1MK6yefT9M0zce59LpwRZ32TM0Lx0VFeQqoR/2Oah3bRjYSjiCBxYQIYvbUcPoHzYlvcf1zGSgUZGoqbiqtCPziiSGlDIdDK1a898e7H/jZVf8lhKg+Ucs0zQcfeCjWHtf8frC98Y5PniRJFeaJjofR6ToAWlLLZ5+tD/j9nldp9ZYBoBVUX9lr4Y5tdRhq/0sGyNVeMFKGIHNiMHVRc/Jgn5CCkqbsVIEE7uY1ZCtLOyuo9BSlkf3urvumTDl65F57qu2herygEELTtM7OxNXX/r/myPamEFaZa7ubsiQAvSgvjQCAIBKJ+AOeEZB6ZV7XB6qcZeAuH47SCTez4wv6jXoQgCEKku0mRTB3ejBzXlNyrCZJQjyLhBQEUItPQRoXVp86owJaWDnnKxFxzjs7um64/tYn//5IlU/NOZdS/vwXP1m29LVlS14fNLhVmIKcGE+iUpsx2c+q7qpmgxDC83H2XIi2OCrY24A5sN0Xilbs3QssTtRP1EMcgAA7TCLKnRaOP7Nj232t8bFcJExISGIkmXsvH2v87TSdmqzRFZ9ICNHSEp07Z96TTzxVqzR906+v1Xw8m8mapims/0xhS9elwrP9h/W1HrO0HvFAzlgX05Cyz1rLtBV0L/vPrkOAMZJSJk7S25/evu3B1sRYLuMCk5IYSkaUF/jJCam0n6WGXjJWLD4XQQgZCgVvmnbHli1bnNjWHq8phNhnn1E/uuzC9vaObmqy9hvqYgeyMtcUH6oY9UbWLr9IWBqxWCcQCBSZEwKdz+zU8eDgxBhuxnLQJYnZG09Z0bVoG9ILel9TUH2Pgd5EpOv6urWf//Y3dzOGVdoVlQXyx1f8cMReeySTyX7YNLMaeG9ItN5FuSANRVK2nVpaASr9ENSKQEJm79xh66ODO8eg7BKQJGBYxg5vW0HdbiA7E6Lqu1XR0jTN1tbWh//y16VLXuWcVxOyqITWSKTphht/oQwB1XaobqiPKwOUkuU2D5Z1pjg+lvqvYQTEILUbypzELgKmitCXvS8BEWOMFe6hVpMMVH1bIei6a3+dy+Vs0bAHKJlpypRjTjl1altbu+eFw3sBjyuUoeWMp5LDWO4IkaxH5dAy/WKILCPt1dOOZSugbLRCUNQmb6yYgGq5W1V1fqWUTU2R11976757/1y9g0zxoRtuvHr7HQZls7lty4fQs70KbVgMpRy7KSoybhEQWqU66utjV4nUDFwbpjqiMbmOWFY4EqSq5zsXkLVsllG9tKTMQnf+9p7PPl1bJQ2pZjsPG/rzX1wRi8W9rxnlQjV81/sim2UOVvR/MrAToOu6jiGoIOVuoh9dVG9xRln0e/WckmG1fJ2INE2LdXTecMNtxZmE3VyfMSnleeefedDBYzo7u7atNF2HnV2rVe4IkCFjCNQvUa09vlKHFQGBLNYhsWJieeX7VSUKKbPQ9Gdnz5g+m/OqksgUqfn9/ltuu05lXdfUMQ/h/RIGeUJwVe/Ggh9cDS3joud9KN+tamaqo8wXgtWSEePsQFAlpCQ9oN9w/e3xWLxKl44itYMOGnfe+WduQ7MQYtXMtnpILBeCVOzisIyJNWwg0AeQsuUXlj8vBSIC2V68Qh8wSaKqo8DIcr1WyxuklIZh/Gv1mt/ddU/10jRjTEr61TU/3fU/dkml6qLVd2/9Ujs61GVzcqY2KunBRIgqKLEf1Hg7Apx1v7Zag0X22Lh+UVep9nauk6qEaZrRluif7n/47bfeUZ6vnu+CSCRbW1uuve5nyWSirtJ0WaiSN/WISAS11V9V4adel/js5k4AsrBIArM/6G5kGahKJJ7qp3jvJgRDyGRy1/xqmmmaVUaPKLPQKaeecMyk73Z0xLYJDXmvhZH1BqQTUFauleMsY+h1YH8Z5JVwtEnHfcfCFYskqg0PCi4g612JRgjZ1NS0YMErTzz+D85rMAsh4rSbrwmFg9skZ6gulUd6mjyWSxWVwa3+PIjA2fCLsEzMdmFMLQIBytIK6LUUmOrdjBBCNDU13XrL7zZv+kKJOD2eopysI0YM/+F/ntfe3t7P0nRdDIlobzhXLv6wtLldq7++QFBUoW6KdnlYAOV3cT4AAMDIkrbdztRabsZqCB5yg4gCAf/6dRtuvOFWJeJUc5aSu6/4yY/2239UvZysFdLP6+ILc6RnQtmNEERWIUVUoVrIEBmC64NqcWPWT84HnEUPXTJMNx8GSnqWtq/CrWSVNd4hIDB0D1mNrgxL6++FZqScrI8//vRLL86vMlpIaf7hcPimm67JZbN1cW5UNtRVFYxSEzBfVErpPgX2tMK5DgAIWYCMhCxhFjBDmCHI/wuYAcgQZAkypL5glpyDqgFmAbOgGri+A2QAsoAZwAyxLGNMs3KOrOmkFilHHnKYkhNcXKjK16SF9aEiPBH5NP8N19+WTmeqNgtxIcTEI8af1O9OVu+3vASAKnbhIQAASRSRYheAJk2a1uskO7xXGW7UdhrIEEjtpQ2KQRBIO2cSkalV04ozJ6mKXNnxGEAackQgjUAAkCpfVGyAyjNLa49Fsh12rg5XByFMKST2NoNGxd6//dbK++/98xVXXlpl7L0KTLvhxl8sWrC0qzPJNd4/Fuq6yFykjMxOOXHXk+RFIk6YkMkJWnb+joBMkF3VzFrZ7EqvEkjtoexcBxEtAlKEBIAMrIw5VGG/iBycwH5Czjgg5vwmpu0t6q2Atkr9L42Fq8HZK4WUUnLeqzRQAFBO1uamu+68d8qxR+8xfPdqYu8ZQyHE0KFDr77myv+69Betg1r7RynzmIDyDsly1FPcWJKpoekjABMAXZJqYY4BEIDIJ4cW8zYCErYi5zhlXWOHpIqJg3T4in0mQknwANph28p4jtahHoJUC4CM1eKSLwNV4KyjPXbddb9+8m8PV3ktxrgQ8pxzz/j73595ZekbTU2RfsihroPETmrhqW68JYFJYAKYBALUB01ACfk/JaEEMFWJZ9WeUID6gAng+o4C0MyfC6qBKcGUQLJEryFHCyvulVQpV2gZpWuJN+FeVGYVpmhpaZ4z+4Wn/v5M1dI0IAJj7MZp1zDuvXRbFp7XSLS8QABQ5sU4zQrnfNHHilNGyy0CyihQQcmyeAOSExBWUR0DgMr+HSTIt1OrZHEAU8H/uxsEhoxzrFV3K4GUIhQK3zTtN21b26uUppVZaNy40RdfcnZ7R384WesQUIaWkNJds+oG1mUiogpF1p2KyfmVqCfLU4XrFHqwbC2ghNqq6LkS5Kli5flqISXpuv7pp+tvvfWuGp2s8pe/vHL48P9IpVNleaGHqr7XufH5/a8ICiqq1ew0tRVpNwNxiS9U9L2aaKwK1jB3DTWwkrKpD0GSUkopvakYYZpmS0vzIw/99dVXXq/JLBRtjl5/wy9TyTJeem+TgFn3EQ69ALkCgSBvB2JlzUJFQBdckx0BkKjYZeZejKobkB5tM7bozqiMw6N6IbrGJMQeQYTX/OqmbDZbi1lIHj918uQpR7S3FztZu71CzdOG1Vh3sSooQ2Jh5agCpazsALsOYrmX7cmkQbVDc+koWVRr8U9mb/bh0IK1KFdDqY645UWHrdj715a/cc/dD9QSew8AcNPN1zRFQ6Ypqqbo2pwwVDqt+wi1dlnyqH2PmhgmEapP0QsoZE5Q9FOlvhT+6djHiwODsIjWbctkvoEdeLdNkiBM04xGo7///f2f/uuzKqOFlDS9+x67/eTKH8ViNUR6VHxXzrQrnHx1cKZao9yNF6w8E7JJTXkyS1XuquBa/tzXL/qze4EMkVTyBro6VcMssM/xjNZU7H081nXdtb+uvitqi4XLLr/4oINHexB770zpwiWrTgH9PTxht2yJnE+lNkWsyGnmHCnHkyyiISvOzVUhrXjpJFsKzp8rpayeguphfhEyF402zZg+d/qzz1UvTQOA3++/+ZZr7UiEvqGc670ehsS8VlO44lSkhgoX6kHgrfBCyf7X/bOr+JLdxwpXZUAM1H7y7sOyBhbk2jfeOxASyVAoeMuv7+rq7Kop9v7ggw88/4Kz2tq8jxaqR1YGAQIJl9VYEEpAQSgJhLSOF35QAjqnOEekskcTqa24C86VUNhenWL/JEiq2xEIQgH2T2RfM39ZFECCKH8dAAEMNMYLZSDOiKhcWcIyHymqNsTXAJSSDMNY9eHHd9zxB8ZYLpcToorOSJnL5X7+8x9/Y9hOyYT30UJekyQhaQxbfVgcZ2gJ1gVuegLHT1DIFJCsgC7Mq9aWIoSWuTsftOx6zQAqsZoBA0BmX8d2ram7SACVOwLAwNa7LKkNJQOG2iCOjLsdagzZoMGtVYRJcABoaWnGqrMEa4KSpu+95y/HHT9p3LjR1Z3EAWC77be79093nnLSeZ5ncGrooSmRAPzA14um67YqaxwhIQISs6VjlCqOjPKGQkAkJCRigMQ4SZJSqt8QiKQEZGDFeDG0wjBUqAdIBLQzhpQWLsAEQJYPSCJgDBCklIDIEElKIaxSS4wzYMiRMWBCSCEEEGi6j3dKSktUOY9AiJjN5m668Y5Bg1pN01S+cUQGVvoXEREC4xoTUgCwjvaO+ghCzmOyK6+4etLko6SUDBkyJCnt1BOwTaEqOtR2ChAQ0aDBrbGOLk3TPDQk4s477eXVtQAAEMAESAjbnOB4Bpy/0SXQO03sIm320p5/buui9v+V0bn49aCiSEv0zrd2hfMQKa+68tXZZdKcNrb9gQARiQGEi1l9PN7pyP6IaG0fVpLXRkScs0gkUtOw1QTGWCaTSSSSaHPPIoLI822rmJc1lE3RCPNaaPGagEDZWQqWHgAoICGrUVmU1X7do1OdKbnikaq165JyuMqUYr0RF1HnqdlihEAE9Y7FYQwZYyonqjQzimwaKhjs+vSqDt5acka/eHJW+F56fvdX7/H23R/pJfceUBvtSEly2+65odCv20U38JUD1iM3voGvEajBgRroGxoE1ECf0E+Rsw18VVHfmFnGGGNoZ+Mo3aGMV09pyG41BxE5Z5XaOxdXLqFu2iAi57zA6kRQ1jOquurov672VE0NXgVN40VXqPQI6gHVV3d706yoWyGickR0rw9yzt1ibaXn9Qp1JCDOeTKZSqVSjCEiCiH9fn84HCotP9jW1s4Ya2qKOGa6XC7X3p7Qdd0w9PIx8IjpdDqVSukB3QgalV5SOpNJJpJFvQqHQ5qmuU9BxGQymUqlwbYu2qHWoGlaJBKu5gVIKbds6XBOVJcyDMMw9KLuIWImk0kmU5bt0ropAUFTNFq615hqIIRob+/gnDsDVQoiamtrc1dl0DQtFAr5fFWVou4F6mBIBAAAxlgsFttr1J5Tp04+YMx+mqZ9+MFHz83+57Klr4XDYeveiFJKn893+Y8v6uiIP/jAoz5NQ8RUKr3nnrt9/5zT57204OV5i0OhYNELYIwlEokxY/c77/wzZ8785z/nzmtqChcNEGMsmUyNGbvfcccfAwCapiFiV1di1YcfvfTigs7OpPNeVcujJ008/PDv5HIm59w0BVccieHqj1c/8vATgUCg+1pdpmlGo00XXnSOrgeU01sIsX7d+kWLln34wcfhcNh5BMZYMpEce+D+3/ve1JyZ45xZoZAI2WzuT/c9/OWXbVphXqmaUa2Dmq+59qeffPLZH//7wdL+qCkaDOmX/PD8oGEo9tzREXvn3ZVLl7zaGU9EImHPTVmIqHkbYq3AGIt3dv7o0gun3XyNpmnJZJKIJk487EeX/uCPdz9w4/W3B4MWTUhJmo9d+dPL1qxZd/+9DykCymQyu+/xH5f88Lx0OjVn9guRSLh0BhPJX1x9xcSJh+8/er+FCxaXTi/FokaNGnnpZRcV/bRy5QffP/PijRs2+/1+ImKMpVLpgw4afdHF55Y+y2vL/+/BBx7V9fKM0IEQMhwO/eyqy4qOZ7PZH/3wyqefnh1talLvDxmm05kDRu970SXnlF7nicf/sXnTFz5fgbuKc97e3nHxJeeeedapADD/5UXvvP1B6bySUgQN42dXXV50zdWrP/nZldctXLAsGm3ynIa818I457FY/IQTJt1y2/WbN31x2inn7rf3t/bb+zsnf+/sd99ZueWLLSXLDcZisY6OmMYt+Hw+FYqQSWewhJ8zxrq6EmPG7n/44YesX79+5IjhkycfGY93lkZtImIikTBN88Ybbh2++wEHHzjxwLET77/voVGjRl511eWplJXyYppmNBq5756HD/3OUXvvdfDll/3MNMUffn/vnnuM/s7BR1184Y8dcu8GCJAzc7mcufzV/xs18qADx40fO/qw/7zkilw2d/sd0wYPasnl7KLgBMiwM95lmmLaDbftuceYA8dOHDd6wrgx40fvf9jn6zf5A/6i25k5s3VQy/kXnPXFF1tMYV5w4dmpVLKcAQ9zOTOZTK1Y8c6okQeNGzNh/GFT7rj997vvvtsTf/vL6DH7dHUlPA/n8J6AhBChUPDqa36aM80LL7h0xvTn02kzlcrMe2nRsVNOu+/eh90ii0pEZIxJIbd+2dbW1tHW1rG1Y2s8Ftc0XnbKI2Imk77gwu9zzi/5wRXxeOell12k+cp6mJFzpmlarKNr/bqNGzd+sfrjT6fdeHsqldr/gH11PeB0g3PW0RFb/fGaT1Z/tnnTVk3jW7e2f/qvdZ9+unbT5i+rsbUq16zPp+VyuQ3rN234/IsvNrfd/8Ajs2bNHTS4dZddhmUyduEVtILhNI1v3LD5o9UrP1i5auV7q957d9Waz9aXcgjOeWdX17HHHv3NXXe58YZb57248JRTTxg+fLd0ucKaBOTzabmsuXbN5+vXbfzg/Y+vufrmyy79qWEY11x3VT28Hx4L0YyxZDI5au8Rw4fv/sorr722/K0hQ3YyTZNzHo1GTdMsuxbkcmbroJYzvn+yYRjIMJlIjh69L4DjXM8PEyJLpzO77b7rSSdPnf/yojn//OfTT804/4Lvf/tb45Yufa1EErKiOhLJZCrbmegKpVKpQw87SNf1jZs2ZzJZw7DKwhGB2mI0k8n6/RoA6AHdMHTDCORy1W7SpgIQsrlsR1ccEKSkYUOG7rXXnkKIrW3tjlijlC6NcwA4fMJ3pKRgUFf1AJe/8vqaNet8Pp/7jlJKv9936eU/6OrseuapWbGO+NHHfPe8C8687ppbjKBeqLXZUSwMdT0QCPgBaOiQIc88NfunP/uvQw45eNiwoZs3b/F7uuul91qYEFKpLWs+W6uCi1V3VZmSsvpzJpPZZZdhjzx6X3HnNF7kaOacdXUlzjjzh5qm3TztDoDMb2//w+lnnPSfPzp/0cJlpZ52xbHPPe+M73z7IH/AF9D9kyYdKaW85+4HOS9gWsoc4ERDE4GUIGuJZEXGstnsqL1GPvbonwIBfy6XHTP2gD333OOePz7w2afrmqIRKawrOzr86WecfPoZJztXuPzSq95/f1Vra4vDh5Q88N0jDt1rrxHX/79bNm3ZMP2Z2StWvHPuuWf+9+//lE5lC8u4oAo4cZIBpJSc81zOXL/u81133SXaHN2wYbO3Uq/3BMQ572iPIeKuu+6iTBfqlXDO0uks54yxAuulME2/3792zbqfXHF1IKBzzru6usaM3e/a635etEUjImaz2R13HHzueWeYpnna6d87+eQTc7lsMpE8evKR++w38qNV/zIMo0g/B4D99x+1zz4jVYzOhx98eOl/XvXuex+WCqEKSgcWtXN7RBCmGLzdoBNOnKRpPl3XTdO89Ic/efqp2eFwSBaK+Ypz/PHuP01/9rnmaLMpTMb4J598WsbMgXDRxecAwKi9R9x7z39LU2SzueaW5mOPO/qhvzw+eHCrmwk5WWycc8dOpmnasG/snMvl4vF42TncF3hMQFJKXdc//vhf7767cuy40YeP//ac5+YNHjxIStnV1fXNXb/R2dmVy+bcQXFqlrS3x+bMfkk3dM5YeyxmRXgVZj0qSeXU06buuOOOqVT64h9eoI6n02nO+LnnnXHlFdeFQgUvIJczAeCG62+/796/7Dl8txmzn2xpbe2Md1mBY+UtTAAWK6thoBGBpDSCxpIlr5x84tmM83vu/e0JJx7LNZ5OZYKhoOqJe6AA4P2Vq+bNfzESHGyaAoB03QgGDadXjLFEIrnvPiMnTDxcCHHqqd9Tx03TBIAfXHze356cXqx+IiJDSTKRSACgEKKzM37p5T/45je/8eILL69dsz4S8bjmSz20MJbJZG++6Tec80ceve+iS87ebrtB2+8w+PQzTpy/cNY9992RddfxI3DmRHNLtLk5Gm2ONkejoVDINIuFDyGkrgcu/ME5HR2xIydOPWDfQ8eOHj96/8O+fdCRqz/+5ORTTtxpp+0z6YzbjscYmqbIZXNIbPXqNT+/6roddtj+/j//HkCaplkhQZaZphA1jrIytgshhCmyWSEF/OLn12/cuOnO3906euy+pfnFAGSa4pu77jJ6/3Fjxx5w4IGjDzxw9KhRwwOuXZWVQHnW2af6/f6LLrx8xPBxY0dPHDd64sjh4x76y2P77LPXIYce1NnZ5b4yAmQzOcPQ995n5Mi9hn/nkAP/eO9v7vrdrfF457Qbb9e49wtOXbSwpqbIiy8s/MmPf6lp2j333vn2e0veeW/pnx/6Y8Dvf+H5+QUxuQgA0NISbW6JChumaXKOmsZ1Q3dCRjnn8XjXsccftfc+ez35xFOvv/7mF19sXb9uw+bNX76/ctWDD/5PS0vzhRed3ZXoYpaLAEgS13yaxg1DJ6Dtths8a8YLf7rvodGj97vjzhvLb/pH5PP5NI2HXJygKhAgY8pMjAihcHDLF21X/NcvfT7fY48/sOOOg/NqPABJCofDmsZ//osfv/HWopcXzlywePaCxc8tXvb8iJF7pFNptfqkkqk9R+x+8SXnf/DBqmefea6jPb5+3fr16z/fsqXt/vseAoBr/99Vmq8gUZVxruuBvffe69XX5i1YNHvGrCcuuvi8N95YcerJ572/8qNgqLzJvi/wMr7agZQyEg4/8vATixa9ctTRE0eNGoGI77z93ty5L635bH002qRuqqz+uZz5q19OSySSirDUIvjRR6un3XjH8ldfdyQVSdLv93V1JqfdePuM6c+1trZqGldm3EGDB8+cPlcPBDZu2hwMBpW0IaU0gvqbb6646cbbly9/wzCMbDYbiURuu+33n3221uf3tQ5qSSZSjDNnpZJSBgz9ww8/uvmm3yxb+nowaFRZXJyINI13xuM3XH/bxg2b/H5/LpuLNjXNf3nJhRdctvvuu+2w445tbasUq5AkjaD+xhtv3/Lru8xcDhA5Y6CK+hJs3LjZ57e0MALSA8bN036zbNlyn8/n2B38fv+6tRsuu/Sq7QYPao42JZNpJVYqjnXNr24KBg2VlRmLxT9c9dHbK97LZnKRSMRzKyIR1cuVAQCc83Q6nUymiFSdBRYMGroeKH2MeLwTGUYiEXD5wrq6in1hiJhMpjKZTCQSdrMxZcWPx+NFfisldCcSiWAwqGz/ynkSj3cSQTQaKZtmr25tGHqP1uciEFEsFtc0XyQSsrI+GIvHO3O5XDgc9vt97o5lMhnlenPcf+qL+9FUZzo7uwzDMII6yQJ9Ih7vEsKMNje5yyEQUWdnl8vMhj6/L2QYWHVVhlqBQ3ccWb+gRMeBrFDJLVy9N155qIQovk6l9sob79bmevRpVxMIUAnK2OMWbJVvvFKHnah4sIX3opbddKZ00Nx3VCCC7qMV+o76ElADX21QnXZtbuDrgwYBNdB7oCpv3ohqbaDXYIUVWBpooDY0lrAG+oQGATXQJzQyUxvoExocqIE+oUFADfQe9aiR2MDXCw0CaqBPaBBQA31Cg4C+Auj9xkJ9R0ON/wqgdIfX/rtzgwM10Cc0CKiBPqFBQA30CQ0CaqBPaJS4a6BPaHCgBvqEBgE10HsQUcMO1EAfQA0ZqIG+obGENdAnNAiogT6hQUBfR3go+DYI6GsHe29Ib9K5qqo45K5MYFdiVxsTV+xBfufK6lBUUcD9U9lSYu6C8JWuU1MH6opuns7dppoH9xZOWf5eX+H/AzYMwiwaZupyAAAAAElFTkSuQmCC";
    const SPONSOR_QR_URI = "data:image/png;base64,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";
    const DARK_WATERMARK_URI = "data:image/png;base64,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";
    const LIGHT_WATERMARK_URI = "data:image/png;base64,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";
    const DEV_CONFIG = {"name":"SonyLucky7","role":"Creator & Independent Developer","githubProfile":"https://github.com/SonyLucky7","githubRepo":"https://github.com/SonyLucky7/ChartRead","githubSponsors":"https://github.com/sponsors/SonyLucky7","usdtNetwork":"BNB Smart Chain (BEP-20)","usdtAddress":"0x992de9de5b80e98272e64a6f4cc3a49f4ec80198"};

    // ======================================================================
    // 0. Custom ChartRead Home / Developer & Sponsor Page (Replaces TV Home)
    // ======================================================================
    const isHomeRoute = /^\/(home\/?)?$/.test(location.pathname || "");
    if (isHomeRoute) {
      // 0ms veil so ZERO TradingView homepage pixels ever flash
      if (electron?.webFrame?.insertCSS) {
        electron.webFrame.insertCSS(`
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
        `);
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
            st.textContent = `
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
            `;
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
    const mainWorldCode = `
(function() {
  if (window.__cr_main_world_v6) return;
  window.__cr_main_world_v6 = true;

  const CR_LOGO_URI = ${JSON.stringify(CR_LOGO_URI)};

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
            if (url.includes("/api/v1/symbols_list/colored")) {
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
      applyStudyWithCheckPermission: (pkg, id, cb) => {
        if (typeof cb === "function") cb();
      },
      applyStudyWithCheckPermissionByStudyId: (id, cb) => {
        if (typeof cb === "function") cb();
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
        SSBD.prototype._handleClickOnStudyApply = function(item, t, i) {
          if (!item) return;
          if (this._applyStudy) return this._applyStudy(item, t, i);
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
    // H. Optimized Client-Side Study Fallback (Early-Exit When Populated)
    // ================================================================
    const computeEmptyStudies = () => {
      try {
        const chart = window.TradingViewApi?.activeChart?.();
        if (!chart) return;
        const studies = chart.getAllStudies?.() || [];
        if (studies.length === 0) return;

        // Fast check: only build barsList if at least one study has empty data
        const emptyStudies = [];
        for (const s of studies) {
          const study = chart.getStudyById(s.id)?.study?.();
          if (study && study.data && study.data().isEmpty()) {
            emptyStudies.push({ meta: s, study });
          }
        }
        if (emptyStudies.length === 0) return;

        const model = chart._chartWidget?.model ? chart._chartWidget.model() : (emptyStudies[0].study?._model || chart._chartWidget?._model);
        const ms = model?.mainSeries ? model.mainSeries() : null;
        const bars = ms?.bars?.();
        if (!bars || bars.isEmpty?.()) return;

        const firstIdx = bars.firstIndex();
        const lastIdx = bars.lastIndex();
        const barsList = [];
        for (let i = firstIdx; i <= lastIdx; i++) {
          const v = bars.valueAt(i);
          if (v) barsList.push({ index: i, time: v[0], open: v[1], high: v[2], low: v[3], close: v[4], volume: v[5] });
        }
        if (barsList.length < 2) return;

        for (const { meta, study } of emptyStudies) {
          try {
            const name = (meta.name || "").toLowerCase();
            study._wasCompletedBefore = true;
            study.isFailed = returnFalse;
            study.hasCompileError = returnFalse;
            study.error = returnNull;

            if (name.includes("bollinger")) {
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
            } else if (name.includes("relative") || name.includes("rsi")) {
              const length = 14;
              let avgGain = 0, avgLoss = 0;
              for (let i = 1; i <= length && i < barsList.length; i++) {
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
                study.data().add(barsList[i].index, [barsList[i].time, 100 - (100 / (1 + rs))]);
              }
            } else if (name.includes("exponential") || name.includes("ema")) {
              const length = 9, k = 2 / (length + 1);
              let ema = barsList[0].close;
              study.data().add(barsList[0].index, [barsList[0].time, ema]);
              for (let i = 1; i < barsList.length; i++) {
                ema = barsList[i].close * k + ema * (1 - k);
                study.data().add(barsList[i].index, [barsList[i].time, ema]);
              }
            } else if (name.includes("moving") || name.includes("sma") || name.includes("ma")) {
              const length = 9;
              for (let i = length - 1; i < barsList.length; i++) {
                let sum = 0;
                for (let j = 0; j < length; j++) sum += barsList[i - j].close;
                study.data().add(barsList[i].index, [barsList[i].time, sum / length]);
              }
            } else if (name.includes("volume") || name.includes("vol")) {
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
          } catch (e) {}
        }
        if (ms._model?.lightUpdate) ms._model.lightUpdate();
      } catch (e) {}
    };
    setInterval(computeEmptyStudies, 2500);

    // ================================================================
    // I. Indicator Click Helper (Single Listener, Zero Duplicates)
    // ================================================================
    document.addEventListener("click", (e) => {
      try {
        const itemEl = e.target.closest('[data-role="list-item"]');
        if (!itemEl) return;
        const dialog = itemEl.closest('[data-dialog-name="Indicators, metrics, and strategies"]');
        if (!dialog) return;

        const key = Object.keys(itemEl).find(k => k.startsWith("__reactFiber") || k.startsWith("__reactInternalInstance"));
        let cur = itemEl[key];
        let itemData = null;
        while (cur) {
          if (cur.memoizedProps?.item) { itemData = cur.memoizedProps.item; break; }
          cur = cur.return;
        }
        if (!itemData) return;

        const chart = window.TradingViewApi?.activeChart?.();
        const studyData = itemData.studyData || {};
        const title = studyData.title || itemData.name || itemData.title || "";
        const id = studyData.id || itemData.id || "";

        if (chart?.createStudy && title && !id.startsWith("PUB;")) {
          try {
            chart.createStudy(title, false, false);
            setTimeout(() => { if (window.chartreadSyncLayout) window.chartreadSyncLayout(); }, 1200);
            return;
          } catch (err) {}
        }

        if (window.studyMarket?._insertStudyService) {
          const desc = studyData.descriptor || {
            type: id.startsWith("PUB;") ? "pine" : "java",
            pineId: id,
            pineVersion: studyData.version || "1.0"
          };
          window.studyMarket._insertStudyService.insertStudy({ descriptor: desc, insertionInfo: itemData })
            .then(() => setTimeout(() => { if (window.chartreadSyncLayout) window.chartreadSyncLayout(); }, 1200))
            .catch(() => {});
        }
      } catch (err) {}
    }, true);

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
    const PROMO_DIALOG_RE = /black friday|cyber monday|up to \\d+% off|our best deal is here|explore offers|sale ends in|custom intervals|see what others don't|upgraded plans|invite-only script|access to this script is restricted|ready to trade|sign up and gain access|unlock bar replay|look first|create a free account|registration_promotion|try ai copilot|ai copilot is now free|copilot empowers|non-standard intervals|seconds intervals|intraday bar replay|go pro|30-day free trial|trial period|special offer|claim your offer|get it before the point of no return/i;
    const PROMO_CARD_RE = /black friday — our best deal|black friday.*\\d+% off|cyber monday.*\\d+% off|our best deal is here|claim your offer|30-day free trial|\\+1 free month/i;

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
`;

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
    const styleStr = `
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

    if (electron?.webFrame?.insertCSS) {
      electron.webFrame.insertCSS(styleStr);
    }
  } catch (err) {
    console.warn("ChartRead platform-preload v6 error:", err);
  }
})();

//# sourceMappingURL=platform-preload.js.map
