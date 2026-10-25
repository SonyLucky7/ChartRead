const fs = require('fs');
const path = require('path');

console.log('=== Applying ChartRead Full Rebrand & Feature Unlock ===\n');

// 1. Get base64 transparent logo
const logo128Path = path.join(__dirname, '..', 'resources', 'branding', 'ChartRead-Logo-Transparent-128.png');
const logo128B64 = fs.readFileSync(logo128Path).toString('base64');
const dataUri128 = `data:image/png;base64,${logo128B64}`;

const logo256Path = path.join(__dirname, '..', 'resources', 'branding', 'ChartRead-Logo-Transparent-256.png');
const logo256B64 = fs.readFileSync(logo256Path).toString('base64');
const dataUri256 = `data:image/png;base64,${logo256B64}`;

console.log('Base64 icons prepared.');

// ==========================================================
// 2. Patch runtime/resources/app/index.js
// ==========================================================
const indexPath = path.join(__dirname, '..', 'runtime', 'resources', 'app', 'index.js');
if (fs.existsSync(indexPath)) {
  let code = fs.readFileSync(indexPath, 'utf8');
  let count = 0;

  // A. Patch Module 53829 (Class User)
  // Original: class i{claims;session;constructor(e,t){this.claims=e,this.session=t}get id(){return this.getClaim(r.Vc,"")}get username(){return this.getClaim(r.XY,this.id)}get isAuthenticated(){return(0,r.FA)(this.claims,r.Vc)}get isAnonymous(){return!this.isAuthenticated}get userpic(){return this.getClaim(r.uC,"")}get isPro(){return!!this.getClaim(r.J1,"")}get plan(){return this.getClaim(r.Fp,"")}get userPlanBadgeName(){return this.getClaim(r.Nx)??"free"}
  const userClassTarget = 'class i{claims;session;constructor(e,t){this.claims=e,this.session=t}get id(){return this.getClaim(r.Vc,"")}get username(){return this.getClaim(r.XY,this.id)}get isAuthenticated(){return(0,r.FA)(this.claims,r.Vc)}get isAnonymous(){return!this.isAuthenticated}get userpic(){return this.getClaim(r.uC,"")}get isPro(){return!!this.getClaim(r.J1,"")}get plan(){return this.getClaim(r.Fp,"")}get userPlanBadgeName(){return this.getClaim(r.Nx)??"free"}';
  const userClassReplace = 'class i{claims;session;constructor(e,t){this.claims=e||[],this.session=t}get id(){return"1"}get username(){return"ChartRead"}get isAuthenticated(){return!0}get isAnonymous(){return!1}get userpic(){return""}get isPro(){return!0}get plan(){return"premium"}get userPlanBadgeName(){return"pro:pro_premium_expert"}';
  if (code.includes(userClassTarget)) {
    code = code.replace(userClassTarget, userClassReplace);
    count++;
    console.log('[index.js] Patched Class User (Module 53829) -> Pro/Authenticated/Premium');
  }

  // B. Patch UserService initial user
  // currentUser=new yD.K(iO.VY({id:void 0}))
  const initUserTarget = 'currentUser=new yD.K(iO.VY({id:void 0}))';
  const initUserReplace = 'currentUser=new yD.K([{type:"user:id",value:"1"},{type:"user:username",value:"ChartRead"},{type:"user:plan",value:"premium"},{type:"user:pro",value:!0},{type:"user:pro_badge_name",value:"pro:pro_premium_expert"}])';
  if (code.includes(initUserTarget)) {
    code = code.replace(initUserTarget, initUserReplace);
    count++;
    console.log('[index.js] Patched UserService initial currentUser');
  }

  // C. Patch showAppOnboardingDialog in UserService
  // showAppOnboardingDialog(e,t){(0,M.uY)(this.authHandler.showWelcomeDialog(e||H_.AppFirstLaunch,t))}
  const onboardingTarget = 'showAppOnboardingDialog(e,t){(0,M.uY)(this.authHandler.showWelcomeDialog(e||H_.AppFirstLaunch,t))}';
  const onboardingReplace = 'showAppOnboardingDialog(e,t){}';
  if (code.includes(onboardingTarget)) {
    code = code.replace(onboardingTarget, onboardingReplace);
    count++;
    console.log('[index.js] Disabled showAppOnboardingDialog in UserService');
  }

  // D. Patch showWelcomeDialog in AuthenticationHandler
  // async showWelcomeDialog(e,t){if(X_.isAppOnboardingWindowLoading=!0
  const showWelcomeTarget = 'async showWelcomeDialog(e,t){if(X_.isAppOnboardingWindowLoading=!0';
  const showWelcomeReplace = 'async showWelcomeDialog(e,t){return Promise.resolve();if(X_.isAppOnboardingWindowLoading=!0';
  if (code.includes(showWelcomeTarget)) {
    code = code.replace(showWelcomeTarget, showWelcomeReplace);
    count++;
    console.log('[index.js] Neutralized showWelcomeDialog in AuthenticationHandler');
  }

  // E. Patch requestProFeature in UserService
  // async requestProFeature(){const e=(0,Pe.Qh)().getLastFocusedWindow();
  const requestProTarget = 'async requestProFeature(){const e=(0,Pe.Qh)().getLastFocusedWindow();';
  const requestProReplace = 'async requestProFeature(){return Promise.resolve();const e=(0,Pe.Qh)().getLastFocusedWindow();';
  if (code.includes(requestProTarget)) {
    code = code.replace(requestProTarget, requestProReplace);
    count++;
    console.log('[index.js] Neutralized requestProFeature in UserService');
  }

  // F. Patch doSignIn in UserService
  // async doSignIn(e){this.currentUser.isAuthenticated?(0,u.Ow)().warn("Requesting sign in when authentication is active"):await this.authHandler.signIn(e)}
  const doSignInTarget = 'async doSignIn(e){this.currentUser.isAuthenticated?(0,u.Ow)().warn("Requesting sign in when authentication is active"):await this.authHandler.signIn(e)}';
  const doSignInReplace = 'async doSignIn(e){return Promise.resolve();}';
  if (code.includes(doSignInTarget)) {
    code = code.replace(doSignInTarget, doSignInReplace);
    count++;
    console.log('[index.js] Neutralized doSignIn in UserService');
  }

  // G. Disable initial app onboarding call on startup
  const startupOnboarding = '!(0,A.D0)().advanced.disableAppOnboarding&&!$p()&&(0,xt.Dv)().showAppOnboardingDialog(H_.AppFirstLaunch)';
  if (code.includes(startupOnboarding)) {
    code = code.replace(startupOnboarding, '!1');
    count++;
    console.log('[index.js] Disabled startup onboarding trigger');
  }

  // H. Auto-signin on startup to launch main window without login prompts
  const autoSignInTarget = 'async updateCurrentUser(){let e,t={id:void 0};if(this.session)';
  const autoSignInReplace = 'async updateCurrentUser(){if(!this.hasNotifiedProSignIn){this.hasNotifiedProSignIn=!0;try{await vD(this.prepareSignInSubject,this.currentUser)}catch(err){}this.notifyUserSignedIn({user:this.currentUser,initiator:"startup"});this.userChangeEvent.next(this.currentUser.claims);return}let e,t={id:void 0};if(this.session)';
  if (code.includes(autoSignInTarget)) {
    code = code.replace(autoSignInTarget, autoSignInReplace);
    count++;
    console.log('[index.js] Patched updateCurrentUser for auto-signin on startup');
  }

  // I. Disable splash window delay
  const targetSplash = 'showSplashWindow(){(0,u.Ow)().info("Show Splash Window");';
  const replaceSplash = 'showSplashWindow(){(0,u.Ow)().info("Splash skipped for instant launch");return;';
  if (code.includes(targetSplash)) {
    code = code.replace(targetSplash, replaceSplash);
    count++;
    console.log('[index.js] Disabled splash window for instant launch');
  }

  if (count > 0) {
    fs.writeFileSync(indexPath, code, 'utf8');
    console.log(`[index.js] Successfully applied ${count} patches.`);
  }
}

// ==========================================================
// 3. Patch runtime/resources/app/app/window/bundle.js
// ==========================================================
const windowBundlePath = path.join(__dirname, '..', 'runtime', 'resources', 'app', 'app', 'window', 'bundle.js');
if (fs.existsSync(windowBundlePath)) {
  let wCode = fs.readFileSync(windowBundlePath, 'utf8');
  let wCount = 0;

  // Original:
  // get isAnonymous(){return!this.isAuthenticated}get userpic(){return this.getClaim("user:pic","")}get isPro(){return!!this.getClaim("user:pro","")}get plan(){return this.getClaim("user:plan","")}get userPlanBadgeName(){return this.getClaim("user:pro_badge_name")??"free"}
  const wUserTarget = 'get isAnonymous(){return!this.isAuthenticated}get userpic(){return this.getClaim("user:pic","")}get isPro(){return!!this.getClaim("user:pro","")}get plan(){return this.getClaim("user:plan","")}get userPlanBadgeName(){return this.getClaim("user:pro_badge_name")??"free"}';
  const wUserReplace = 'get isAuthenticated(){return!0}get isAnonymous(){return!1}get userpic(){return""}get isPro(){return!0}get plan(){return"premium"}get userPlanBadgeName(){return"pro:pro_premium_expert"}';
  if (wCode.includes(wUserTarget)) {
    wCode = wCode.replace(wUserTarget, wUserReplace);
    wCount++;
    console.log('[window/bundle.js] Patched Class User -> Pro/Authenticated/Premium');
  }

  if (wCount > 0) {
    fs.writeFileSync(windowBundlePath, wCode, 'utf8');
    console.log(`[window/bundle.js] Successfully applied ${wCount} patches.`);
  }
}

// ==========================================================
// 4. Patch runtime/resources/app/app/3739.js
// ==========================================================
const bundle3739Path = path.join(__dirname, '..', 'runtime', 'resources', 'app', 'app', '3739.js');
if (fs.existsSync(bundle3739Path)) {
  let c3739 = fs.readFileSync(bundle3739Path, 'utf8');
  let cCount = 0;

  const target3739 = 'get isAnonymous(){return!this.isAuthenticated}get userpic(){return this.getClaim("user:pic","")}get isPro(){return!!this.getClaim("user:pro","")}get plan(){return this.getClaim("user:plan","")}get userPlanBadgeName(){return this.getClaim("user:pro_badge_name")??"free"}';
  const replace3739 = 'get isAuthenticated(){return!0}get isAnonymous(){return!1}get userpic(){return""}get isPro(){return!0}get plan(){return"premium"}get userPlanBadgeName(){return"pro:pro_premium_expert"}';
  if (c3739.includes(target3739)) {
    c3739 = c3739.replace(target3739, replace3739);
    cCount++;
    console.log('[3739.js] Patched Class User -> Pro/Authenticated/Premium');
  }

  // Also replace SVGs if present
  if (c3739.includes('d:"M21 38H11V21H0V11h21v27Zm15-21a6 6 0 1 1-12 0 6 6 0 0 1 12 0Zm-6 21 11.5-27h12L42 38H30Z"')) {
    // Replace short logo path
    c3739 = c3739.replace(
      'rt||(rt=o.createElement("path",{fillRule:"evenodd",clipRule:"evenodd",d:"M21 38H11V21H0V11h21v27Zm15-21a6 6 0 1 1-12 0 6 6 0 0 1 12 0Zm-6 21 11.5-27h12L42 38H30Z",fill:"currentColor"}))',
      `rt||(rt=o.createElement("image",{width:54,height:48,href:"${dataUri128}"}))`
    );
    cCount++;
    console.log('[3739.js] Replaced short logo SVG with ChartRead CR image');
  }

  if (cCount > 0) {
    fs.writeFileSync(bundle3739Path, c3739, 'utf8');
    console.log(`[3739.js] Successfully applied ${cCount} patches.`);
  }
}

// ==========================================================
// 5. Patch runtime/resources/app/app/4491.js (Monochrome TV Logo)
// ==========================================================
const bundle4491Path = path.join(__dirname, '..', 'runtime', 'resources', 'app', 'app', '4491.js');
if (fs.existsSync(bundle4491Path)) {
  let c4491 = fs.readFileSync(bundle4491Path, 'utf8');
  const tvSvg4491 = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 28 28"><path fill="currentColor" d="M12 20H7v-7H2V8h10zm9.2 0h-5.6l4.8-12H26zM15.5 8a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5"/></svg>';
  const crSvg4491 = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><image width="28" height="28" href="${dataUri128}"/></svg>`;
  if (c4491.includes(tvSvg4491)) {
    c4491 = c4491.split(tvSvg4491).join(crSvg4491);
    fs.writeFileSync(bundle4491Path, c4491, 'utf8');
    console.log('[4491.js] Replaced 28px monochrome logo with ChartRead CR logo');
  }
}

// ==========================================================
// 6. Patch runtime/resources/app/app/6787.js (Header Logo)
// ==========================================================
const bundle6787Path = path.join(__dirname, '..', 'runtime', 'resources', 'app', 'app', '6787.js');
if (fs.existsSync(bundle6787Path)) {
  let c6787 = fs.readFileSync(bundle6787Path, 'utf8');
  if (c6787.includes('d:"M11.143 1.428H.857v10.286h10.286v16h10.286V1.428H11.143Zm29.143 26.198H28L38.378 1.428H50l-9.714 26.198ZM28.5 11.362a4.919 4.919 0 0 0 4.914-4.923c0-2.719-2.2-4.923-4.914-4.923a4.919 4.919 0 0 0-4.914 4.923c0 2.72 2.2 4.923 4.914 4.923Z",fill:"#fff"}')) {
    c6787 = c6787.replace(
      '{fillRule:"evenodd",clipRule:"evenodd",d:"M11.143 1.428H.857v10.286h10.286v16h10.286V1.428H11.143Zm29.143 26.198H28L38.378 1.428H50l-9.714 26.198ZM28.5 11.362a4.919 4.919 0 0 0 4.914-4.923c0-2.719-2.2-4.923-4.914-4.923a4.919 4.919 0 0 0-4.914 4.923c0 2.72 2.2 4.923 4.914 4.923Z",fill:"#fff"}',
      `{width:50,height:28,href:"${dataUri128}"}`
    );
    c6787 = c6787.replace('ot.createElement("path",', 'ot.createElement("image",');
    fs.writeFileSync(bundle6787Path, c6787, 'utf8');
    console.log('[6787.js] Replaced header logo with ChartRead CR image');
  }
}

// ==========================================================
// 7. Patch runtime/resources/app/app/new-tab/bundle.js
// ==========================================================
const newTabBundlePath = path.join(__dirname, '..', 'runtime', 'resources', 'app', 'app', 'new-tab', 'bundle.js');
if (fs.existsSync(newTabBundlePath)) {
  let nCode = fs.readFileSync(newTabBundlePath, 'utf8');
  let nCount = 0;

  // Disable GoProModal
  if (nCode.includes('openGoProModal:()=>{t(!0)}')) {
    nCode = nCode.replace('openGoProModal:()=>{t(!0)}', 'openGoProModal:()=>{}');
    nCount++;
  }
  if (nCode.includes('openGoPro:()=>{t(!0)}')) {
    nCode = nCode.replace('openGoPro:()=>{t(!0)}', 'openGoPro:()=>{}');
    nCount++;
  }

  // Disable showSignInDialog in sign-up modal
  if (nCode.includes('onClick:()=>{M(),q().showSignInDialog()}')) {
    nCode = nCode.replace('onClick:()=>{M(),q().showSignInDialog()}', 'onClick:()=>{M()}');
    nCount++;
  }

  // Replace pricing redirect
  if (nCode.includes('window.open(`${j}pricing/`)')) {
    nCode = nCode.replace('window.open(`${j}pricing/`)', 'console.log("ChartRead: all features free")');
    nCount++;
  }

  if (nCount > 0) {
    fs.writeFileSync(newTabBundlePath, nCode, 'utf8');
    console.log(`[new-tab/bundle.js] Successfully applied ${nCount} patches.`);
  }
}

// ==========================================================
// 7.5. Patch runtime/resources/app/app/menu/bundle.js
// ==========================================================
const menuBundlePath = path.join(__dirname, '..', 'runtime', 'resources', 'app', 'app', 'menu', 'bundle.js');
if (fs.existsSync(menuBundlePath)) {
  let mCode = fs.readFileSync(menuBundlePath, 'utf8');
  const targetXe = 'const Xe=({name:e,avatar:t,isAnonymous:n,isPro:o,userPlanBadgeName:a})=>{const{t:i}=(0,h.Bd)();';
  const replaceXe = 'const Xe=({name:e,avatar:t,isAnonymous:n,isPro:o,userPlanBadgeName:a})=>{n=!1;e=e||"ChartRead";o=!0;a="pro:pro_premium_expert";const{t:i}=(0,h.Bd)();';
  if (mCode.includes(targetXe)) {
    mCode = mCode.replace(targetXe, replaceXe);
    fs.writeFileSync(menuBundlePath, mCode, 'utf8');
    console.log('[menu/bundle.js] Successfully patched UserCard to always show ChartRead Pro profile!');
  }
}

// ==========================================================
// 8. Patch runtime/resources/app/preload/platform-preload.js
//    Inject Premium features, bypass GoPro, hide payment UI, style ChartRead green
// ==========================================================
const preloadPath = path.join(__dirname, '..', 'runtime', 'resources', 'app', 'preload', 'platform-preload.js');
if (fs.existsSync(preloadPath)) {
  let pCode = fs.readFileSync(preloadPath, 'utf8');

  const chartReadFeaturesScript = `
;try {
  // ChartRead Pro / Premium Features Unlocker
  window.addEventListener("DOMContentLoaded", () => {
    // 1. Sanitize titles
    const sanitizeTitle = () => {
      if (document.title && document.title.includes("TradingView")) {
        document.title = document.title.replace(/TradingView/g, "ChartRead");
      }
    };
    sanitizeTitle();
    const tElem = document.querySelector("title");
    if (tElem) new MutationObserver(sanitizeTitle).observe(tElem, { childList: true, characterData: true, subtree: true });

    // 2. Mock window.user as Premium Pro
    try {
      const mockUser = {
        id: 1,
        username: "ChartRead",
        is_pro: true,
        pro_plan: "premium",
        pro_badge_name: "pro:pro_premium_expert",
        user_type: "pro",
        is_authenticated: true,
        is_active: true,
        has_pro: true,
        is_pro_realtime: true,
        is_pro_premium: true,
        is_pro_expert: true,
        plan: "premium",
        badges: [{ name: "pro:pro_premium_expert" }],
        privileges: ["all", "pro", "premium", "expert", "realtime", "multiple_charts", "custom_timeframes", "bar_replay", "volume_profile", "indicators", "alerts"]
      };
      if (!window.user || !window.user.is_pro) {
        window.user = Object.assign(window.user || {}, mockUser);
      }
    } catch (e) {}

    // 3. Bypass TradingView GoPro and payment dialogs
    try {
      if (!window.TradingView) window.TradingView = {};
      window.TradingView.createGoProDialog = () => false;
      window.TradingView.isFeatureEnabled = () => true;
      window.TradingView.gopro = () => false;
    } catch (e) {}
  });

  // 4. Inject global CSS to hide all upgrade/payment/sign-in popups & apply ChartRead green theme
  const styleStr = \`
    /* Hide all GoPro, Upgrade, Payment, and Sign-in UI */
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

    /* ChartRead Neon Green Accent */
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

  if (!pCode.includes('ChartRead Pro / Premium Features Unlocker')) {
    pCode = pCode.replace('process.contextIsolated)', chartReadFeaturesScript + 'process.contextIsolated)');
    fs.writeFileSync(preloadPath, pCode, 'utf8');
    console.log('[platform-preload.js] Injected ChartRead feature unlocker & payment remover');
  }
}

// ==========================================================
// 9. Inject ChartRead Theme & Anti-Signin CSS into all HTML files
// ==========================================================
const appDir = path.join(__dirname, '..', 'runtime', 'resources', 'app', 'app');
const brandStyleTag = `
<style id="chartread-brand-theme">
  :root {
    --color-tv-blue-500: #00FF38 !important;
    --color-tv-blue-600: #00E635 !important;
    --color-tv-blue-700: #00B82B !important;
    --color-brand: #00FF38 !important;
    --color-brand-hover: #00E635 !important;
    --color-brand-active: #00B82B !important;
    --color-link: #00FF38 !important;
    --color-link-hover: #00E635 !important;
    --color-link-active: #00B82B !important;
    --color-container-fill-primary-accent: #00FF38 !important;
    --color-container-fill-primary-accent-bold: #00B82B !important;
    --color-content-primary-accent: #00FF38 !important;
    --color-border-primary-accent: #00FF38 !important;
    --color-button-fill_border-primary-accent-default: #00FF38 !important;
    --color-button-fill_border-primary-accent-hover: #00E635 !important;
    --color-button-fill_border-primary-accent-active: #00B82B !important;
    --color-button-content-primary-accent-default: #13141F !important;
    --color-button-content-primary-accent-hover: #13141F !important;
  }
  .theme-dark {
    --color-brand: #00FF38 !important;
    --color-brand-hover: #00E635 !important;
    --color-brand-active: #00B82B !important;
    --color-body-bg: #13141F !important;
    --color-header-bg: #13141F !important;
    --color-pane-bg: #13141F !important;
    --color-bg-primary: #13141F !important;
    --color-background-primary: #13141F !important;
  }
  /* Remove sign-in options & payment modals */
  .sign-in-button,
  [aria-label="sign-in-button-close"],
  .sign-in,
  .signin-dialog,
  .sign-up-modal,
  .go-pro-modal {
    display: none !important;
  }
</style>
`;

function walkAndInjectHtml(dir) {
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      walkAndInjectHtml(full);
    } else if (item.endsWith('.html')) {
      let html = fs.readFileSync(full, 'utf8');
      if (!html.includes('id="chartread-brand-theme"')) {
        if (html.includes('</head>')) {
          html = html.replace('</head>', `${brandStyleTag}</head>`);
        } else if (html.includes('<head>')) {
          html = html.replace('<head>', `<head>${brandStyleTag}`);
        }
        fs.writeFileSync(full, html, 'utf8');
        console.log(`[HTML] Injected brand theme into: ${path.relative(appDir, full)}`);
      }
    }
  }
}
walkAndInjectHtml(appDir);

// ==========================================================
// 10. Update Source Code (src/ and packages/)
// ==========================================================
// A. src/services/user/user.ts
const srcUserPath = path.join(__dirname, '..', 'src', 'services', 'user', 'user.ts');
if (fs.existsSync(srcUserPath)) {
  let sUser = fs.readFileSync(srcUserPath, 'utf8');
  sUser = sUser
    .replace('get id(): string {\n\t\treturn this.getClaim(CLAIM_USER_ID, \'\') as string;\n\t}', 'get id(): string {\n\t\treturn \'1\';\n\t}')
    .replace('get username(): string {\n\t\treturn this.getClaim(CLAIM_USER_NAME, this.id) as string;\n\t}', 'get username(): string {\n\t\treturn \'ChartRead\';\n\t}')
    .replace('get isAuthenticated(): boolean {\n\t\treturn hasNonEmptyClaim(this.claims, CLAIM_USER_ID);\n\t}', 'get isAuthenticated(): boolean {\n\t\treturn true;\n\t}')
    .replace('get isAnonymous(): boolean {\n\t\treturn !this.isAuthenticated;\n\t}', 'get isAnonymous(): boolean {\n\t\treturn false;\n\t}')
    .replace('get isPro(): boolean {\n\t\treturn !!this.getClaim(CLAIM_PRO, \'\');\n\t}', 'get isPro(): boolean {\n\t\treturn true;\n\t}')
    .replace('get plan(): string {\n\t\treturn this.getClaim(CLAIM_PLAN, \'\') as string;\n\t}', 'get plan(): string {\n\t\treturn \'premium\';\n\t}')
    .replace('get userPlanBadgeName(): UserPlanBadgeName {\n\t\treturn this.getClaim<ProBadgeName>(CLAIM_PRO_BADGE_NAME) ?? \'free\';\n\t}', 'get userPlanBadgeName(): UserPlanBadgeName {\n\t\treturn \'pro:pro_premium_expert\';\n\t}');
  fs.writeFileSync(srcUserPath, sUser, 'utf8');
  console.log('[src/services/user/user.ts] Updated user getters to Pro/Premium/Authenticated');
}

// B. packages/ui-lib/color-palette.css
const palettePath = path.join(__dirname, '..', 'packages', 'ui-lib', 'color-palette.css');
if (fs.existsSync(palettePath)) {
  let pCss = fs.readFileSync(palettePath, 'utf8');
  pCss = pCss
    .replace(/--color-tv-blue-500:#2962ff/g, '--color-tv-blue-500:#00FF38')
    .replace(/--color-tv-blue-600:#1e53e5/g, '--color-tv-blue-600:#00E635')
    .replace(/--color-tv-blue-700:#1848cc/g, '--color-tv-blue-700:#00B82B');
  fs.writeFileSync(palettePath, pCss, 'utf8');
  console.log('[packages/ui-lib/color-palette.css] Replaced tv-blue with ChartRead neon green');
}

// C. packages/ui-lib/icons/monochrome/tradingview-logo/size_28px__stroke_1.5px__usage_product-icons.js
const uiLogoPath = path.join(__dirname, '..', 'packages', 'ui-lib', 'icons', 'monochrome', 'tradingview-logo', 'size_28px__stroke_1.5px__usage_product-icons.js');
if (fs.existsSync(uiLogoPath)) {
  const newUiLogo = `export const svgIcontradingviewLogoSize28pxStroke1 = \`<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><image width="28" height="28" href="${dataUri128}"/></svg>\`;\n`;
  fs.writeFileSync(uiLogoPath, newUiLogo, 'utf8');
  console.log('[packages/ui-lib/.../size_28px] Replaced monochrome logo with ChartRead CR image');
}

// D. src/app/assets/tv-logo.svg
const tvLogoPath = path.join(__dirname, '..', 'src', 'app', 'assets', 'tv-logo.svg');
if (fs.existsSync(tvLogoPath)) {
  const newTvLogo = `import * as React from "react";
var SvgTvLogo = function SvgTvLogo(props) {
  return /*#__PURE__*/React.createElement("svg", Object.assign({
    width: 50,
    height: 28,
    viewBox: "0 0 50 28",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, props), /*#__PURE__*/React.createElement("image", {
    width: 50,
    height: 28,
    href: "${dataUri128}"
  }));
};
export default SvgTvLogo;
`;
  fs.writeFileSync(tvLogoPath, newTvLogo, 'utf8');
  console.log('[src/app/assets/tv-logo.svg] Replaced with ChartRead CR image');
}

// E. src/app/dialog-window/welcome-dialog/signin-dialog/assets/tv-logo-short.svg
const tvShortPath = path.join(__dirname, '..', 'src', 'app', 'dialog-window', 'welcome-dialog', 'signin-dialog', 'assets', 'tv-logo-short.svg');
if (fs.existsSync(tvShortPath)) {
  const newTvShort = `import * as React from "react";
var SvgTvLogoShort = function SvgTvLogoShort(props) {
  return /*#__PURE__*/React.createElement("svg", Object.assign({
    width: 54,
    height: 48,
    viewBox: "0 0 54 48",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, props), /*#__PURE__*/React.createElement("image", {
    width: 54,
    height: 48,
    href: "${dataUri128}"
  }));
};
export default SvgTvLogoShort;
`;
  fs.writeFileSync(tvShortPath, newTvShort, 'utf8');
  console.log('[src/.../tv-logo-short.svg] Replaced with ChartRead CR image');
}

// F. src/app/dialog-window/welcome-dialog/signin-dialog/assets/tv-logo-full.svg
const tvFullPath = path.join(__dirname, '..', 'src', 'app', 'dialog-window', 'welcome-dialog', 'signin-dialog', 'assets', 'tv-logo-full.svg');
if (fs.existsSync(tvFullPath)) {
  const newTvFull = `import * as React from "react";
var SvgTvLogoFull = function SvgTvLogoFull(props) {
  return /*#__PURE__*/React.createElement("svg", Object.assign({
    width: 158,
    height: 28,
    viewBox: "0 0 158 28",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, props), 
  /*#__PURE__*/React.createElement("image", {
    width: 28,
    height: 28,
    href: "${dataUri128}"
  }),
  /*#__PURE__*/React.createElement("text", {
    x: 34,
    y: 20,
    fill: "#00FF38",
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontWeight: "900",
    fontSize: "15",
    letterSpacing: "0.5"
  }, "CHART", /*#__PURE__*/React.createElement("tspan", { fill: "#FFFFFF" }, "READ"))
  );
};
export default SvgTvLogoFull;
`;
  fs.writeFileSync(tvFullPath, newTvFull, 'utf8');
  console.log('[src/.../tv-logo-full.svg] Replaced with ChartRead logo & text');
}

console.log('\n--- Full ChartRead Rebrand & Feature Unlock Successfully Applied! ---');
