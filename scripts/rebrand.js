const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, search, replace) {
  if (!fs.existsSync(filePath)) return false;
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(search)) {
    content = content.split(search).join(replace);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath} (${search} -> ${replace})`);
    return true;
  }
  return false;
}

function rebrandTarget(baseDir) {
  console.log(`\n=== Rebranding target: ${baseDir} ===`);

  // 1. package.json
  const pkgPath = path.join(baseDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkg.name = 'chartread';
    pkg.productName = 'ChartRead';
    pkg.description = 'ChartRead - Advanced Desktop Charting Platform';
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
    console.log(`Updated package.json: productName = "ChartRead"`);
  }

  // 2. Locales
  const localesDir = path.join(baseDir, 'resources', 'locales');
  if (fs.existsSync(localesDir)) {
    for (const f of fs.readdirSync(localesDir)) {
      if (f.endsWith('.json')) {
        const full = path.join(localesDir, f);
        let txt = fs.readFileSync(full, 'utf8');
        let updated = txt
          .replace(/Exit TradingView/g, 'Exit ChartRead')
          .replace(/Quit TradingView/g, 'Quit ChartRead')
          .replace(/Hide TradingView/g, 'Hide ChartRead')
          .replace(/Welcome to TradingView/g, 'Welcome to ChartRead')
          .replace(/TradingView Desktop/g, 'ChartRead Desktop')
          .replace(/TradingView is up to date/g, 'ChartRead is up to date')
          .replace(/TradingView wants to provide/g, 'ChartRead wants to provide')
          .replace(/TradingView account/g, 'ChartRead account');
        if (txt !== updated) {
          fs.writeFileSync(full, updated, 'utf8');
          console.log(`Rebranded locale: ${f}`);
        }
      }
    }
  }

  // 3. HTML files: ensure <title>ChartRead</title>
  const appDir = path.join(baseDir, 'app');
  if (fs.existsSync(appDir)) {
    function walkHtml(dir) {
      for (const item of fs.readdirSync(dir)) {
        const full = path.join(dir, item);
        if (fs.statSync(full).isDirectory()) walkHtml(full);
        else if (item.endsWith('.html')) {
          let html = fs.readFileSync(full, 'utf8');
          let modified = false;
          if (html.includes('<title>')) {
            html = html.replace(/<title>.*?<\/title>/, '<title>ChartRead</title>');
            modified = true;
          } else if (html.includes('<head>')) {
            html = html.replace('<head>', '<head><title>ChartRead</title>');
            modified = true;
          }
          if (modified) {
            fs.writeFileSync(full, html, 'utf8');
            console.log(`Set <title>ChartRead</title> in ${item}`);
          }
        }
      }
    }
    walkHtml(appDir);
  }

  // 4. App bundles
  const appFiles = [
    'app/3739.js',
    'app/6787.js',
    'app/menu/bundle.js',
    'app/new-tab/bundle.js',
    'app/splash/bundle.js',
    'app/window/bundle.js',
    'app/3409.js',
    'app/3703.js',
    'app/1892.js'
  ];

  for (const rel of appFiles) {
    const full = path.join(baseDir, rel);
    if (!fs.existsSync(full)) continue;
    let txt = fs.readFileSync(full, 'utf8');
    let updated = txt
      .replace(/Welcome to TradingView/g, 'Welcome to ChartRead')
      .replace(/TradingView Desktop/g, 'ChartRead Desktop')
      .replace(/Exit TradingView/g, 'Exit ChartRead')
      .replace(/Quit TradingView/g, 'Quit ChartRead')
      .replace(/TradingView is up to date/g, 'ChartRead is up to date')
      .replace(/TradingView Desktop Proxy/g, 'ChartRead Desktop Proxy')
      .replace(/Set up TradingView MCP Server/g, 'Set up ChartRead MCP Server')
      .replace(/TradingView account/g, 'ChartRead account')
      .replace(/title:"TradingView"/g, 'title:"ChartRead"');

    // In 6787.js
    if (rel === 'app/6787.js') {
      updated = updated.replace(/name:"typography-accent-18px-semibold"},"TradingView"/g, 'name:"typography-accent-18px-semibold"},"ChartRead"');
    }

    // In new-tab/bundle.js
    if (rel === 'app/new-tab/bundle.js') {
      updated = updated.replace(/const S="TradingView"/g, 'const S="ChartRead"');
    }

    // In 1892.js (Tab title rebrand)
    if (rel === 'app/1892.js') {
      updated = updated.replace(
        'className:"title"},e)',
        'className:"title"},("string"==typeof e?e.replace(/TradingView/g,"ChartRead"):e))'
      );
    }

    // In 3739.js (Sign-in dialog logo rebrand)
    if (rel === 'app/3739.js') {
      updated = updated.replace(
        /const st=\(\{type:t\}\)=>o\.createElement\("div",\{className:`sign-in-logo \$\{t\}`\},"full"===t\?o\.createElement\(nt,null\):o\.createElement\(ot,null\)\)/,
        'const st=({type:t})=>o.createElement("div",{className:`sign-in-logo ${t}`,style:{fontSize:"32px",fontWeight:"900",letterSpacing:"-1.5px",color:"#2962ff",fontFamily:"sans-serif",textAlign:"center",padding:"10px 0"}},"ChartRead")'
      );
    }

    if (txt !== updated) {
      fs.writeFileSync(full, updated, 'utf8');
      console.log(`Rebranded bundle: ${rel}`);
    }
  }

  // 5. Preload script title sanitizer
  const preloadPath = path.join(baseDir, 'preload', 'platform-preload.js');
  if (fs.existsSync(preloadPath)) {
    let pCode = fs.readFileSync(preloadPath, 'utf8');
    const sanitizer = ';window.addEventListener("DOMContentLoaded",()=>{const s=()=>{if(document.title&&document.title.includes("TradingView")){document.title=document.title.replace(/TradingView/g,"ChartRead")}};s();const t=document.querySelector("title");if(t){new MutationObserver(s).observe(t,{childList:true,characterData:true,subtree:true})}});';
    if (!pCode.includes('replace(/TradingView/g,"ChartRead")')) {
      pCode = pCode.replace('process.contextIsolated)', sanitizer + 'process.contextIsolated)');
      fs.writeFileSync(preloadPath, pCode, 'utf8');
      console.log(`Injected title sanitizer into ${preloadPath}`);
    }
  }

  // 6. src/app/splash/promo-events.ts
  const promoPath = path.join(baseDir, 'src', 'app', 'splash', 'promo-events.ts');
  if (fs.existsSync(promoPath)) {
    let pTxt = fs.readFileSync(promoPath, 'utf8');
    pTxt = pTxt.replace(/'TradingView'/g, "'ChartRead'");
    fs.writeFileSync(promoPath, pTxt, 'utf8');
    console.log(`Rebranded promo-events.ts in ${promoPath}`);
  }

  // 7. src/index.ts
  const srcIndexPath = path.join(baseDir, 'src', 'index.ts');
  if (fs.existsSync(srcIndexPath)) {
    let sTxt = fs.readFileSync(srcIndexPath, 'utf8');
    sTxt = sTxt
      .replace(/` TVDesktop\/\${ app.getVersion\(\) }`/g, '` ChartRead/${ app.getVersion() }`')
      .replace(/initialize\(\);/, 'try { app.setName("ChartRead"); app.setAppUserModelId("ChartRead"); } catch (e) {}\n\tinitialize();');
    fs.writeFileSync(srcIndexPath, sTxt, 'utf8');
    console.log(`Rebranded src/index.ts in ${srcIndexPath}`);
  }

  // 8. index.js patches
  const indexPath = path.join(baseDir, 'index.js');
  if (fs.existsSync(indexPath)) {
    let code = fs.readFileSync(indexPath, 'utf8');
    let modified = false;

    // Inject app.setName("ChartRead") into startup
    if (code.includes('function jD(){(0,a.initialize)()') && !code.includes('i.app.setName("ChartRead")')) {
      code = code.replace(
        'function jD(){(0,a.initialize)()',
        'function jD(){try{i.app.setName("ChartRead");i.app.setAppUserModelId("ChartRead");}catch(e){}(0,a.initialize)()'
      );
      modified = true;
      console.log('Injected app.setName("ChartRead") in startup function jD()');
    }

    // Replace window title updates so window always shows ChartRead
    // 1) this.windowRef.setTitle(e) -> this.windowRef.setTitle((e||"ChartRead").replace(/TradingView/g,"ChartRead"))
    if (code.includes('this.windowRef.setTitle(e)') && !code.includes('e||"ChartRead"')) {
      code = code.replace(
        'this.windowRef.setTitle(e)',
        'this.windowRef.setTitle((e||"ChartRead").replace(/TradingView/g,"ChartRead"))'
      );
      modified = true;
      console.log('Injected windowRef.setTitle(e) rebrand');
    }

    // 2) this.windowRef.setTitle(n) -> this.windowRef.setTitle((n||"ChartRead").replace(/TradingView/g,"ChartRead"))
    if (code.includes('this.windowRef.setTitle(n)') && !code.includes('n||"ChartRead"')) {
      code = code.replace(
        'this.windowRef.setTitle(n)',
        'this.windowRef.setTitle((n||"ChartRead").replace(/TradingView/g,"ChartRead"))'
      );
      modified = true;
      console.log('Injected windowRef.setTitle(n) rebrand');
    }

    // Replace TVDesktop user agent with ChartRead
    if (code.includes('` TVDesktop/${i.app.getVersion()}`')) {
      code = code.replace(
        '` TVDesktop/${i.app.getVersion()}`',
        '` ChartRead/${i.app.getVersion()}`'
      );
      modified = true;
      console.log('Rebranded userAgent to ChartRead');
    }

    if (modified) {
      fs.writeFileSync(indexPath, code, 'utf8');
    }
  }
}

// Apply rebranding to both project root and runtime app
const ROOT_DIR = path.resolve(__dirname, '..');
const RUNTIME_APP_DIR = path.join(ROOT_DIR, 'runtime', 'resources', 'app');

rebrandTarget(ROOT_DIR);
if (fs.existsSync(RUNTIME_APP_DIR)) {
  rebrandTarget(RUNTIME_APP_DIR);
}

// Also run the full rebrand and feature unlock
try {
  require('./apply-chartread-full');
} catch (err) {
  console.log('Error applying chartread full:', err);
}

console.log('\n--- Rebranding to ChartRead Complete! ---');
