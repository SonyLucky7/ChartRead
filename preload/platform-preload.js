(()=>{"use strict";const e=require("electron");var t,n;if(function(e){e[e.Classic=1]="Classic",e[e.Protocol=2]="Protocol",e[e.Both=3]="Both"}(t||(t={})),function(e){e.RENDERER_START="sentry-electron.renderer-start",e.EVENT="sentry-electron.event",e.SCOPE="sentry-electron.scope",e.ENVELOPE="sentry-electron.envelope",e.STATUS="sentry-electron.status",e.ADD_METRIC="sentry-electron.add-metric"}(n||(n={})),window.__SENTRY_IPC__)console.log("Sentry Electron preload has already been run");else{const t={sendRendererStart:()=>e.ipcRenderer.send(n.RENDERER_START),sendScope:t=>e.ipcRenderer.send(n.SCOPE,t),sendEvent:t=>e.ipcRenderer.send(n.EVENT,t),sendEnvelope:t=>e.ipcRenderer.send(n.ENVELOPE,t),sendStatus:t=>e.ipcRenderer.send(n.STATUS,t),sendAddMetric:t=>e.ipcRenderer.send(n.ADD_METRIC,t)};if(window.__SENTRY_IPC__=t,e.contextBridge)try{e.contextBridge.exposeInMainWorld("__SENTRY_IPC__",t)}catch(e){}}const r="tvd:debug-auto-save-dialog",o="tvd:screen-capture";class s{key;rules;constructor(e,t){this.key=e,this.rules=t}applyRules(t){const n=t??this.rules;if(!n)return;const r=localStorage.getItem(this.key);r&&e.webFrame.removeInsertedCSS(r);const o=e.webFrame.insertCSS(n);localStorage.setItem(this.key,o)}removeRules(){const t=localStorage.getItem(this.key);t&&e.webFrame.removeInsertedCSS(t)}}function a(e){let t,n=e;return()=>{if(n){const e=n;n=void 0,t=e()}return t}}require("url");const i="TARGET_TVD_HOST",c="https://www.tradingview.com/",d=a((()=>{const e="http(s?):\\/\\/((\\w|-)*\\.)?tradingview\\.com";let t=c;return i in process.env&&(t=process.env[i]??c),null!==new RegExp(e,"i").exec(t)?e:(t.endsWith("/")&&(t=t?.substring(0,t.length-1)),t.replace(/\./gi,"\\.").replace(/\//gi,"\\/"))}));function l(e,t=!0){const n=e=>{let n=e.toString().replace(/\./gi,"\\.").replace(/(?<!\))\*/gi,"(.*)");return n.match(/\w+(\/\((\.\*\)))/gi)&&(n=n.replace(/\/\((\.\*\))/gi,"(/(.*))?")),n=n.replace(/\//gi,"\\/").replace(/\$\{TV\}/gi,d()),n=`^${n}${t?"$":""}`,new RegExp(n,"i")};return"string"==typeof e?n(e):e.map(n)}const p="${TV}/chart/([a-zA-Z0-9]{0,12})?/?",v="${TV}/(\\w|-)*screener/*",u="${TV}/chart/[a-z0-9-._~:\\?#@!$&'()*+,;%=]+/[a-z0-9-._~:\\?#@!$&'()*+,;%=]+/",g=(a((()=>l(v))),a((()=>l("${TV}/",!0))),a((()=>l("${TV}/chart/",!0))),a((()=>l(p))),a((()=>l("(${TV}/chart/([a-zA-Z0-9]{0,12})?)/\\?*?"))),a((()=>l(u,!0))),a((()=>l("${TV}/screener/*"))),a((()=>l("${TV}/heatmap/*"))),a((()=>l("${TV}/community/*"))),a((()=>l("${TV}/pine-script-docs/en/v5/Introduction.html"))),a((()=>l("${TV}/pine-script-reference/v5/"))),a((()=>l("${TV}/x/*"))),a((()=>l("${TV}/*"))),a((()=>l("${TV}/account-recovery/*"))),a((()=>l("${TV}/chat/*"))),a((()=>/:\/\/s3\..+\/snapshots\//i)),a((()=>l("${TV}/pine/*"))),a((()=>l("${TV}/markets/*"))),a((()=>l("${TV}/markets/*/news/"))),a((()=>l("${TV}/markets/stocks-*/*")))),h=(a((()=>l("${TV}/markets/world-economy/*"))),a((()=>l("${TV}/u/TradingView/"))),a((()=>l("${TV}/news/*"))),a((()=>l("${TV}/news/"))),a((()=>l("${TV}/news/\\?market=*"))),a((()=>l("${TV}/news/\\?market=topstories"))),a((()=>l("${TV}/HTML5-stock-forex-bitcoin-charting-library/"))),a((()=>l("${TV}/support/*"))),a((()=>l("https://status.tradingview.com/",!0))),a((()=>l("${TV}/ideas/*"))),a((()=>l("${TV}/scripts/*"))),a((()=>l(["${TV}/","${TV}/ideas/*",u,"${TV}/scripts/*","${TV}/script/*","${TV}/community/*","${TV}/widget/","${TV}/markets/corporate-bonds/*","${TV}/social-network/","${TV}/the-leap/*","${TV}/broker/*","${TV}/data-coverage/","${TV}/markets/stocks-*/*"])))),m=a((()=>l("${TV}/markets/bonds/*")));function b(e,t){const n=e.split("\n").join("");return t instanceof RegExp?t.test(n):t.some((e=>e.test(n)))}a((()=>l([p,v,"${TV}/markets/*","${TV}/symbols/*","${TV}/(\\w|-)*calendar/*"])));const w=window.location.href,T=`\n\t.tv-market-heatmap__standalone-title-wrap,\n\t.tv-screener__standalone-title-wrap,\n\t.tv-footer {\n\t\tdisplay: none !important;\n\t}\n\n\t${k=w,b(k,h())?"":".tv-header { display: none !important; }"}\n\n\t${function(e){return b(e,g())}(w)?"":'.tv-economic-calendar [class^="separator"],\n\t\t.tv-content [class^="container"] [class^="marketHeader"],\n\t\t.tv-content .tv-category__tab-page [class^="marketHeader"],\n\t\t.tv-sticky-symbol-header,\n\t\t.tv-screener-toolbar {\n\t\t\ttop: 0 !important;\n\t\t}'}\n\n\t.tv-content .tv-category__tab-page [class^="shadow"] [class^="tableWrapSticky"] {\n\t\ttop: 58px !important;\n\t}\n\n\t.tv-content .tv-economy-country-tab [class^="table"] [class^="stickyContainer"],\n\t.tv-content .tv-economy-indicator-tab [class^="table"] [class^="stickyContainer"] {\n\t\ttop: -1px !important;\n\t}\n\n\t.tv-content [class^="container"] [class^="shadow"] [class^="tableWrapSticky"] {\n\t\ttop: ${function(e){return b(e,m())}(w)?"-1px":"58px"}\n\t}\n\n\t.tv-category__tab-page.tv-card-exterior > .screener-markets-page-container > div {\n\t\t--screener-sticky-offset-top: 63px !important;\n\t}\n\n\t.tv-screener__standalone-wrap {\n\t\tpadding: 0 !important;\n\t}\n\n\t.i-hidden-on-tvdesktop {\n\t\tdisplay: none !important;\n\t}\n`;var k;const y="tvd:session-storage",R={initCachedStoreSync:`${y}:init-cached-store-sync`,setItem:`${y}:set-item`,clear:`${y}:clear`,removeItem:`${y}:remove-item`},V=new class{#e=null;getLength(){return this.ensureLoaded().size}setItem(t,n){this.ensureLoaded().set(t,n),e.ipcRenderer.send(R.setItem,t,n)}getItem(e){return this.ensureLoaded().get(e)??null}removeItem(t){this.ensureLoaded().delete(t),e.ipcRenderer.send(R.removeItem,t)}clear(){this.ensureLoaded().clear(),e.ipcRenderer.send(R.clear)}ensureLoaded(){if(null!==this.#e)return this.#e;try{const n=e.ipcRenderer.sendSync(R.initCachedStoreSync);if(t=n,Array.isArray(t)&&t.every((e=>Array.isArray(e)&&2===e.length&&"string"==typeof e[0]&&"string"==typeof e[1])))return this.#e=new Map(n),this.#e}catch(e){console.log("TVD.sessionStorage cachedStorage init request failed with error: ",e)}var t;return this.#e=new Map,this.#e}},$={getLength:function(){return V.getLength()},setItem:function(e,t){V.setItem(String(e),String(t))},getItem:function(e){return V.getItem(String(e))},removeItem:function(e){V.removeItem(String(e))},clear:function(){V.clear()}},f={updateLinkValues(t){e.ipcRenderer.send("tvd:update-link-values",t)}},S={getDesktopStream:async()=>await e.ipcRenderer.invoke("tvd:get-screen"),async getCurrentCameraDevice(){const t=await e.ipcRenderer.invoke("tvd:get-camera");if(t)return A.findMediaDevice(t.label,"videoinput")},async getCurrentAudioDevice(){const t=await e.ipcRenderer.invoke("tvd:get-audio");if(t)return A.findMediaDevice(t.label,"audioinput")},async findMediaDevice(e,t){const n=await navigator.mediaDevices.enumerateDevices();return n.find((n=>n.label===e&&n.kind===t))?.deviceId},startedScreenCapture(){let t="";window&&(t=window.location.href),e.ipcRenderer.send(o,!0,t)},stoppedScreenCapture(){let t="";window&&(t=window.location.href),e.ipcRenderer.send(o,!1,t)}},E={setTitle(t){e.ipcRenderer.send("tvd:set-title",t)},reloadTab(){e.ipcRenderer.send("tvd:reload-tab")},layoutChange(t){e.ipcRenderer.send("tvd:layout-change",t)},getActiveWatchlistId:()=>e.ipcRenderer.invoke("tvd:get-watchlist"),onActiveWatchlistIdChange(t){e.ipcRenderer.send("tvd:watchlist-change",t)},layoutRestored(){e.ipcRenderer.send("tvd:layout-restored")},setFocusPineEditor(t){e.ipcRenderer.send("tvd:focus-pine-editor",t)}},x={setNotification(t){e.ipcRenderer.send("tvd:set-notification",t)},setNotificationViewed(){e.ipcRenderer.send("tvd:set-notification-viewed")}},_={setCredentials:t=>e.ipcRenderer.invoke("tvd:set-credentials",t),getCredentials:()=>e.ipcRenderer.invoke("tvd:get-credentials"),insertCredentialsText:t=>e.ipcRenderer.invoke("tvd:native-input-string",t)},I={setLocale(t){e.ipcRenderer.send("tvd-main:set-locale",t)},getTheme:()=>e.ipcRenderer.invoke("tvd:get-theme"),getThemeSetting:()=>e.ipcRenderer.invoke("tvd:get-theme-setting"),setThemeSetting(t){e.ipcRenderer.send("tvd:set-theme-setting",t)},getReports:async()=>await e.ipcRenderer.invoke("tvd:get-reports"),signIn(){e.ipcRenderer.send("tvd-main:initiate-sign-in")},openSettings(t){e.ipcRenderer.send("tvd:open-settings",t)},openNewWindow(t,n,r){e.ipcRenderer.send("tvd:open-new-window",t,n,r)},log(t){e.ipcRenderer.invoke("tvd:log",t)},sendToSentry(t){e.ipcRenderer.invoke("tvd:send-to-sentry-breadcrumb",t)},crosshairSyncEnabled:function(){let t=!0;const n=new Map,r=e=>{t!==e&&(t=e,o())},o=()=>{n.forEach((e=>e(t)))};return e.ipcRenderer.invoke("tvd:get-crosshair-sync").then((e=>{r(e)})).catch((e=>console.log(e))),e.ipcRenderer.on("tvd:crosshair-sync-setting-update",((e,t)=>{r(t)})),{value:()=>t,subscribe(e){const t=self.crypto.randomUUID();return n.set(t,e),t},unsubscribe(e){n.has(e)&&n.delete(e)}}}(),sessionStorage:$},A={...S,...E,...x,..._,...I,...{openAutosaveDialogDebug(){e.ipcRenderer.send(r,!0)},closeAutosaveDialogDebug(){e.ipcRenderer.send(r,!1)},errorAutosaveDialogDebug(){e.ipcRenderer.send(r,!1,!0)}},contracts:{link:{OpenExternal:"OpenExternal"}},linkingApi:f};if(function(t){if("darwin"===process.platform)return;const n=new s("scrollbarTheme"),r=e=>{const t="light"===e?"\n\t* {\n\t\t--scrollbar-thumb-default: #D1D4DC;\n\t\t--scrollbar-thumb-hover: #B2B5BE;\n\t\t--scrollbar-thumb-active: #9598A1;\n\t\t--scrollbar-track: #FFFFFF;\n\t\t--scrollbar-track-border: #E0E3EB;\n\t}\n\n":"\n\t* {\n\t\t--scrollbar-thumb-default: #50535E;\n\t\t--scrollbar-thumb-hover: #868993;\n\t\t--scrollbar-thumb-active: #A3A6AF;\n\t\t--scrollbar-track: #131722;\n\t\t--scrollbar-track-border: #2A2E39;\n\t}\n\n";n.applyRules(t+"\n\t::-webkit-scrollbar {\n\t\twidth: 9px;\n\t\theight: 9px;\n\t}\n\n\t::-webkit-scrollbar-thumb {\n\t\tbox-sizing: border-box;\n\t\tborder: 2px solid transparent;\n\t\tbox-shadow: inset 0 0 10px 10px var(--scrollbar-thumb-default);\n\t\tborder-radius: 8px;\n\t\tbackground-color: unset;\n\t}\n\n\t::-webkit-scrollbar-thumb:hover {\n\t\tbox-shadow: inset 0 0 10px 10px var(--scrollbar-thumb-hover);\n\t}\n\n\t::-webkit-scrollbar-thumb:active {\n\t\tbox-shadow: inset 0 0 10px 10px var(--scrollbar-thumb-active);\n\t}\n\n\t::-webkit-scrollbar-track {\n\t\tborder-radius: unset;\n\t\tpadding: 2px;\n\t\tbackground-color: var(--scrollbar-track);\n\t}\n\n\t::-webkit-scrollbar-track:vertical {\n\t\tborder-left: 1px solid var(--scrollbar-track-border);\n\t}\n\n\t::-webkit-scrollbar-track:horizontal {\n\t\tborder-top: 1px solid var(--scrollbar-track-border);\n\t}\n\n\t::-webkit-scrollbar-corner {\n\t\tdisplay: none;\n\t}\n")};window.addEventListener("load",(()=>{if(window._setTheme){const e=e=>{"theme"===e.key&&e.newValue&&r(e.newValue)};window.addEventListener("storage",e),window.addEventListener("unload",(()=>{window.removeEventListener("storage",e)}))}})),t().then((e=>{r(e)})).catch((e=>console.log(e))),e.ipcRenderer.on("tvd:update-theme",((e,t)=>{"string"==typeof t&&r(t)}))}(A.getTheme),function(){const e=()=>{new s("desktopOptimize",T).applyRules()};window.addEventListener("load",e),window.addEventListener("unload",(()=>{window.removeEventListener("load",e)})),e()}(),process.contextIsolated)try{e.contextBridge.exposeInMainWorld("TVD",A);try{e.contextBridge.exposeInMainWorld("ChartReadCloud",{saveUserData:(d)=>e.ipcRenderer.invoke("chartread:opensearch-save-userdata",d),getUserData:()=>e.ipcRenderer.invoke("chartread:opensearch-get-userdata"),saveLayout:(id,d)=>e.ipcRenderer.invoke("chartread:opensearch-save-layout",id,d),getLayout:(id)=>e.ipcRenderer.invoke("chartread:opensearch-get-layout",id),listLayouts:()=>e.ipcRenderer.invoke("chartread:opensearch-list-layouts"),saveDrawings:(s,d)=>e.ipcRenderer.invoke("chartread:opensearch-save-drawings",s,d),getDrawings:(s)=>e.ipcRenderer.invoke("chartread:opensearch-get-drawings",s)})}catch(_e){console.warn("ChartReadCloud expose err",_e)}}catch(e){console.error("Failed to expose API:",e)}})();

// ==========================================
// ChartRead Desktop Platform Preload Injector v6 (Optimized & Dynamic)
// ==========================================
;(function() {
  if (window.__cr_preload_v6_installed) return;
  window.__cr_preload_v6_installed = true;

  try {
    const electron = require("electron");
    const CR_LOGO_URI = "data:image/png;base64,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";
    const DARK_WATERMARK_URI = "data:image/png;base64,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";
    const LIGHT_WATERMARK_URI = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKQAAACaCAYAAAAnxeOcAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAABgzSURBVHhe7Z37ayzHlcf954RAIATDwrIYFpYlEDBLILCE/LQYQ2AxC4YQFgLGLCwswRAIZiFgTCBgTMCxr+/V1ePq/Ry939LoLY1GoxmN3s/LQi+fGpXUc9TTPT1dM+qeqS8c63q6u7q6+tunTp06deqddyxC4+7u7Q9vbm7/Xv5uYdFQQMSdvexMe/egs7ax/X/yuMbe/sFAd/+os727v3x7e/cTedzCIhJOz85/Pbuw4nT1DDsv2/uc71/3Outbu6fyPI39g8Pvv3/d47xs73U6ugedsYlZZ2d3f+Hu7u5H8lwLi6oBESdnFhSxkFcdfUog5MbWXkGer5HJ5ro4R5+PvGjrdtrfDDpzCyvO0fHJp2hbeZ2FhSd297KTA8MTTltnfxmpqiXk/kHulSRkufQrbTs9t+ycnJ5/JK+3sHjn6ur6p9s7++negZTzoq1HEad2QtJl+xGyVLbWvJB/fWPn9uzs4gNZlkWLgUHH/GK6Ivm8BLJtbmcysiyNagjpJZqcDJxkmRZNjuLxySez8yvKrlP2YedTglQSExrSUzpLpGRA1EmXPrvsHOQKX8nyLZoIZ+cX/zaSmnG+fflGkSCMZtRSN0IKoW7fvep2XncNOMvpDcf6PpsIu5mD0eGxqQfbTb78MBJESK9RdlShzhBzaHTKWVvfdi4urn4h72sRc9ze3f0Ye+xN38jDQMWEBBESx7hpQmrhg6JLp/zR1IyTOyz8meeUdbCIEa6vb/5xYXlNuVbkCzUhQYOaTPagu16EdIvW9NibkzOLzmH+6E+yLhbPCNwmC0tp9ZLQIrXYh9VIECH3s7n2RhBSizZD6AV6+ked1bUt5/jk7DeyXhYNApphaGzqyYuql5QIuZeV9dAwNaiJKr0DY8q0uHv79geyjhaGgd3EjApGvu666qURpQRpyHoMamoVeor2NwNOanLOwba9ur75J1lfi4hIr287bZ0lYjSKhG4JGtTERUO65WEw1NbjjE/NO8zTy3pbhMDJ6dl/MKOCAR/VbRNVkkhIt+gpy76hcWdpZd0pFk8+lc9gUQEMVCam5pXBTiM+h0aUknRCaikNhvqU8x17ExeZjUKqgMx+rhv78HVXdEe2aWkWQrqlpDX7nM7uIWd0fMZhIqHlB0MMVDLZw/aegTGlEeOgDb2kGQmpRbc57d/eNeAw38+8f0tpTiKpV9ObzpvekScNFEcJImScRtkmpK2jT70bJhvOzy9/JZ+3aXB+cfnLlbVNp7NnSI0AZUPEVVqNkIgepdO1ExOwtZPZJFBFPnsiARHxi8mHToq0IiHdort1yNk/PO4wMyXbIBHI5vJ/xQf22kDEzXNKqxPyQR7iN3udN72lJRnZg/w3sV9pmT04/K6rd1i5F+I6UAkjQYRkhNoShHQJ71XHb/L/rNKM1azQ5eX1+yvpTeXfSrI29JIgQtYz/CwpUorf7Hf6hyccePBsi9kuLq9+zmiMlXVxcWSbliBCJtntY1pKg6FSJNLgyKSznz18dXN7965sM+PIF4p/ZKDCRD4OVlmxZpJGEVKHlPHvZvqwO5TzfVY532XbRQKObCKWh1PTiXLbRJUgQpoY1HA9SQU2tnaP9YyVPCep4na+4/KbX1x1isenv5PtGAqsI06KIxtx+9HksbACWeodfkZd02tbji6TdeME3nb1DKmBQ9OZQ+29Kri4vCUDgJeeRunuGzW6RqWeos0H1jsTVMtUWHSy+GtIE102hKStZdmAgOTZhVX1HnTkjrw+iYK5J5/VE9fXt+9Nzi5GfpGNllIUS8rBvtXPQrhVVPOCdvBLNmVKQy6urAe+oMLR8e8xmVAQ9Vy20QgJJGQuf/SFcmR3MVCJ1sANEVfQ7sT0QhkRNZZXN4wQEttOlq1hQkO+oMte99aQXsC7QSoYInX0yFaVFSIBwnNLRULm88XP+4fGH5ycSRG656mZRV+HrDlC1rfLhpAbmzvnsuxqcHv39ke43kgFmCRbs4yQTPeQhLNvMJUouwRydfWOOCxrQEuUvRkPLK3Un5AmuuwohNQgZKxwVPyMSHuWBMcpyNlLFCFZw4zxzP8kzQYhbnJtY+etfBF+aAQhTczUmCCkBB8K/j/yGcn7xUEUIUk9nARtqD8UzIjhsWknf1T8g2zwamCqy66326cehNRACRFfQDuWgiPioYgUIXFMygNxE2xDvmpmgnKHR1/KBg4DU6Nsv3XZcdWQXiBHEHPNA8OTzx6FpQiJ4SsPxEmwe6Zm/QcqYbC4bIaQfqPsJBHSjcur659BTrwqekDbSM0ZW0LyMlXI/FLa+PphUxqyGQnpBlPCTCKQqKtRg9xYEVL7zvg60xvb3v4oA2jEoOa53T6mkcsXvhwamar7KD02NiQvj7g51gXXOymnJWTtYA0NtjMJX3U7yHpHkVhoSNZkEPYuH75esIQ0A2z6pRWzKQ8bTkhUvbZFGKgcFU/+Sz5ovdEQQhpIxxd3QmrgfD8sFD+X9a9FGt5lE5jJ1N7x6dnH8sEahYYQsgU0pBvM8pmwK+uuIXUMIsGlK+mtWCRtt4Q0DwK1Y01I3S0zL878eByIqGGKkH7hZ5aQtYkiJP+RB2oVKoVDFR/iwWHhL7LicQAxhiYI2QgNSVS+LDuOMEpIUxqSCjG1d5DLfy0rHCeYc4xXJqSJuWzq6LcFcpxglJAmNCRdNJHLsqJxhLmpw8qENKEhLSEjCIS8ur7+Z1nROMKUDelHSBMaUnXZmztXsuw4Ip6EvLr+qaxoHNEIQgZvTxwsLTuoMWFDtiIh/UfZlpC1iCVkjRKkIU112S1JSFNdNlHIsqJxhAlC8rx+Aw5LyNrEKCGvrm5aYlDDs5J0gG1KZNkalpC1iWFCNm+XTWMTC0hkC2vVZZkSJtw+lpARpJk1JM9GsicieKrdJsMEIa0fMoIky4as3jHOXHwtM08mCGk1ZARJVpddmZA8BzI2PuuZhqVaNMOamjAwSkhTbp/kaMinXTbLbAmRIy9OFCJq2EFNbaIIyVZiEEoeDCNJIqSM9mGwQkItk3uu2C67NjGqIZMyqIGQkJDVjZMzi3UJCjGlIVsy/AwNKQ+ElSTZkBASjXh7+/bH8pgpmNKQLUnIVtOQjYAJQpbcPuESaT0XYkrIZGjIRsBElw0hwyQsfU4YXeTVboyQVkNqtBohgTFCmthuIkmj7EbAVJetA3QPcoWv2KpNyXz8ZGp2yUh6FUvIOsGEhnS7fchK1nGfZPRlDEXWvVYxSkhrQz7CFCHdg5qNzd3TqGXGXe4J2VpTh42ACUJ6BVeQjlme10xiWEPaQY2GKRtSun2OT85+o44naKuPMGJUQ1ob8hEmCFlp6pB9AeVcfLOIUT+kJeQj6klI0Dc4bmRUGzexhKwT6k1I9pxOyl6TYcQSsk4wMajxIyQYTc1EjtKKm1hC1gmNICTzx+TblNclWYwRErm+vjaybUczwFSXHZRKhS08ot4nTmKMkFZDlsMUIf00pEbvwNiTa5MqpeAKQ2tqLCEf0UhCnp5dfMiIuxlG3ZaQdUIjbEg3CG5ohgGO0ZkaS8hHmNKQQTakBvtjm1Aszy2WkHWCCQ3pNZftB5besnpSlpMkMUrIVgmuIDHr0uqGs7uXnZTHNExoSAi5urYZKkCXHV1NhoM1WozakM1OSIg4O7+sVitCNr/NN01pyPRauIhxthqu1wCH+tRbUI5WQwbg/OLyl2S70ETkZZcIWTk/pAkNWbIht0OvOlxZ21SJD2R5tQrPMTO/oqK5MMvqKWr7GEtIb7BwiSUD8lmRRhGy2lG2GwxwjGrIzj7ndeeAw4cp71UXmCNkc8RDnp6e//v8YtphvTrdiHxWJM6EBOwh2eZRZhQZm5gNZT7UDFOEROXKspMEUu3NLa6qrBby+aTEnZAA36QsM4qwIdbWzt6OvI9xtDoh6YogYmfPcNXO5SQQ8uLy6ueyzCiCGcAObfI+xtGqEeMY0IvLa6pbpv5h7K4gQpoYZUclJMA1ZXKAQzthV8v7GEWruX0w+ucWVpz2+2WltUgQIXczB6NxICQYHJl8UnYUwaQ5zB/9Sd7HGFqty15e3VD2UBiNKCWIkHFKWJo/Ov6s0uCsFqHdBkcm6qclWy38zCthaViBbJvbmYwsWyMONqQbPLMsP4rwbPhm5X2MwFyXnQy3T5IIWW1wRRBubu/eZUAi7xFFeL6T0/OP5L0iwxwhk2FDygy6tUijCGlKQ4LMfq77u7buJ/epVei62Y5a3icyTNmQSSGkX9L7aqVEyL2sLFvDxCibOppOWDoxvfDkPlGE9469LO8TCaZsyOQQMhldNnU0nY6PPOom3UBtnUToDDpqDtoUOnuir1xrRUL6jbJNaEiTNqQb6fXtyM8vxegAx5SGbLVRtv/2xNE1pGkb0g18k1HcXlJ4/8WT0/+U96kJURzE7gq1GiEboSHrRcjDQvFzfLHynlGEDUnlfWqCuZTOtsvWiDshwfTcsnpv8r5RZDeTTcn7hIYxt8/1dUv5If0IGfcuWwPfpMmuG4msmMwR8iYRmStMuX38CJkEDQm2djKbUdvCLYzgCXuT9wkFU4RMig1pyjHeDIQE2H7y3lElUnS5CUIilpCPSEqXDc7OLj5oNxCC6BY2uicZlrxXVTBBSKshy5EkDQkWltKR28QtL9tZwlujU98EIZGkZD9rDCEPuk0QMkyigKjoHUw9qUMUgVc1DXBM+CERqyEfYUJD1mPq0A+5/NEXsg5RhF5zcHQyfP1bb6am/oQ0FaBbj6lDP4ykpo36Jl929Dqkn5b38YUJQiJkcsjsH/RSAUKd9jIHw/zlt8d/P4o+70GyuS5+c4s+xvVK9g8GKO/xOve/hWRzXfqcvf1cqV7ZXBd7vURt9CBCmtCQjbQhNXDdmdiu2i3dfSPhBjimCInWSYLIetcizUpIsLmzl4n6wboF3+TkzGL1XbepQU0rCWTzC65IMiHv7t7+EK1mNkyt3ykWTz6V9/KEJWR4CSKkKT9ko21IjYuLy38l1lHWKYr0D41XpyVNddmtJI3osjEviF2UZTcKJE8w2XVX/TyWkOEliJAmNGTVL7BOuL65ec9EEgktdNsMmAKjy035IVtJGkHI5+yyNYiblPWKKoFJq6wNGV6CCGmiy36uQY3E2MSc0QHOi7ZuB3ecvM8DTKrlVpEgQprSkHEgJEmrTNqSdN29g2OVtaTVkOEliJDNpCEBcZOyflEEgpPoS95HwRIyvDTK7RMXQgKCL0xGl3/78o3DhvTyPpaQNUiQhmxGQpKV12TXjYyOzzzVkpaQ4aUVCQmIm5T1jCKk9sMcKLuJJWR4CeqyTUX7xI2QBF+oQbDBWRzcjpdX1z97uIklZHgJIqSphKXrG9tvZdnPDZWVN+KzSZmdd2XltYQML0FdtolRNjM1ppNNmQK+SZMDHLru7EH+G1W4JWR4wbj3IyQ2ZNQBwPftvQ1dwhAGjI6jfnBuUb7JgXvfJAWTVoNhOH/d4vVbGOF6dxlRy5Miyw+SMOdWOp/fvnnR5aQ3Ks8zY0Nyjq5fLfLNi06HpAay7LhgdX3b+ZtHvaPIwtKa807h6Pj3B4eFv+QOC3/m70Eu/3VJCl/xm1vU8ftz9f+XHcsVvvK67lGOvnx63tGXXmW7RZ+v6uV5Tqlcr9/lb/L+D+U+/L0X+Wz6//NHX1Du9c3tP8iXpEGEtHd9qhfqE2l9cwNA8ntZ7yhSKJ78t7yHhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhcTN7e3fhcpcZWFhGkTvzswtO919o07HmyGno3vIGRqbckiHJ8+VYLK9p3/MIeWdPAZy+cKXLIGcmFrwPF4JZDsYHJlSm/OE3e2BfJDUqW9oXOWX0ZKamK0qM8Tt7d1P+gZTZdfzbxY98Vf9PjzhvT4kJEj0RPmEYrnvNzAyqTKIZXP5v8prvLC1u5/uHUg5qt6DqbLnVuUPphw2spfX+WFqdlFdFzZ5AcE73f2jpbrc35+dxNgIdGdvf06eXwYCQglRJ2CSxeF6zTaxeYSpBWUdIFKaEC2SnstjgI11KA+CyGN+YOdVriPGkI9FHvfD9NySug7hGbTwjAh7tRSPTz6R12mQiJXF7e5rdRyfLpO/fLhRe5PLy+v3ZdmP9e1Wv/EO7t6+/YG81o3ZhZWH1IPuOrqffSpEirzz88tfqYDc+6ULgelQXMgeHH737as3T56J56EeXb3D3okDdvayM/rFDYxMOPnC8R/osk/Pzn89PbukCkFr8hXLazVYsMONeMnyGNCE5OuVx/yg8w9RNwh/en7xgTynEjQheQHu0DoSrJJrhobu6R/1rY87PI124hraY2t7L4PW4li+UPyjvC4sNCHZ1xrlQBQ1ZZNsdWJ6XikJlfMnIKE8iaI4D01LWFd5qF9J2H1BXlcJ9DJKMd3n2AyjJSEk74zrt3czaf1MpKtmPY16p23dzvbOfvrhImL7Ou4PVtJAvIyg+Lzt3f1l04Tc3smsU+bQ6JQzObOg6hhm91FNyNW1zSfX0J3wldLIJ6fnH8njXuAjLRGyJ7T5EASSxNM+f3vZ5RwfP93McmV1U31Aw2PTT57FjfnFtNI+/UPR9x/UC7toQ7p5/vYPV5laz0VIrpNpvzGH5hZW1DOxxeFDe7KFAw/AgaDuwA+sJfEjJJHUYQmJvcE1aAnWBr9q73Xe9HmX7wVNyCUPm4kG4BgLqrB/5XEv8PHWi5BkHPMjJKmpOU6byGNuzMzTo/UY2RBT52RHQ0Og9q6S4kLjynO9oLtsrvHafpAet6t3xHnV0e+sb+6WVlliMHPB+NRcpAegwXi5fFEQYWJq3klNzjksChobn1FGbWn9RHWEPDs7/5CysEnRTPyGcUwD0eXK873wSMinWpUvnq4Xk0AeqwRNSD5g8t7I41FQRkiR1YH70ktwfMa9Ss8D8/f7ztAlMtii7d1SbdsB7H2eV38gLN2gbLLsynO9EERIoPlH0v3SD9OlrpCRlDw5DJSGdBnT/NWiV6mFIeT41LwyfhdceWDQlJCIxq5Gm2tCMtLj4xifnFddHiRXdezsc9Y2dqpeburWkGXriQ1AE5Kyh0enVH0Rul7uSX35QE/PLj6U17pR0mqP7d+m2v1Rypad+gAycT2KxP07PSAf5GG++L/u371QTkjvHoX3q0wMrdF5aTzASCqa6wKyQCAGC147L2AvlLrs4FE2GkLbHhBzOb2h9m3BvNA2TTVbTmhC8pL1yFqPQGnoarseDTch/dbV1AJNSETXFdEfOESqZjMibYLx4ReKx/9TLJ5+QntqqfZDwjTivn1DKYeROzIzv6w+btqAwa68RsJNSGlDauA5YMD24MWBPDwAF1Vr3HtBEzLYhgwmJGk7qA9C3dwr//iNBqnG96cJycs8Pjn97fHp2cfsWKoIOZhSdpG8xg/lhLx5Tx6PAk1IXiAL8iEPHwy9AQpjaaVCxjABbDHaLIoNWRqMlNw1pY8ZN01J9AfNHolBLqAyDXl186TLZqCs91rEbfhwgK9JdaeD3t0pG37jTpC/uxE0qAkzyi4Zun0O5gQ2kVv4SmkUvqqTk7OP5bVuaEK6F93jL3x13wUOa7ulSpQRssIXXyvcNmTx+PR3+vdsrvC16nqx5bwyhglg50UlZGpyvjSiT00/aX8EG5I24F3Ia91wE1KPAzQwPfSe3WjjMhOMEWypK+xTRj7un5X0psrjhybRX8TFxdUv3IW6kcketpsgJP49HsDPgU43jtbAxpLH3NCElHYi2rL0ZfYrbeQ+5od6E5KyS4Oa09+6j2nDHwf85dXV++5jEnTZ1A/TiQ+aa/HD0jMomVl0mGyQ12lQDz2axg8tjwM+DOqKu7CSbQg0ITmXd8Zonfpgx8O379t7nI6eIQcXnLxWMbazZ+jBbqEQbb+0dfQ7rDWW17iBhmTBNw0hjwEIyU6hONjlMTe4J12z33QlIzZdN2YS5HGNqZkF9XK8pgmX05vqPhxnKwx53AsQUtevWlusWtD9UfY3LzrKNKQGHzrPG/QRzi4sq3fIuZQnJagMpvV4vqEA95JWVPiK5TGN/WyunQ/MXRf+TZure4xO+nf7+IXw5DOAwMHKYAKW397evivPlYAkVK7SYOPy8upfIBnly2Ma3H9nNzvnR0YNZkn2MrkBv8EF04I47CvNTPARYdtWOu4FZmsoU/5uAny0zHh5TUNib1HXoDltyLyxvVtgV66tnb0dyuPfD7K9l/XzuzIA5RmD3Fq4gmiH/NHxZ/KYBmTjHGRrN7POvWlzOOClSP4fnTx523YXwb4AAAAASUVORK5CYII=";

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
      [data-role="menuitem"][aria-label="What's new"] [class*="right-"],
      [data-role="menuitem"][aria-label="What's new"] [class*="badge-"],
      [data-role="menuitem"][aria-label="What's new"] [class*="counter-"],
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
