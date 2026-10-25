const fs = require('fs');
const path = require('path');

const ASAR_EXTRACT_DIR = 'C:/Users/hac/AppData/Local/Temp/rea-extracted-d9a9661b-9acb-4eef-a13e-c1314ee228e4';
const MSIX_EXTRACT_DIR = 'C:/Users/hac/AppData/Local/Temp/rea-extracted-5be371bb-4147-4ab3-950b-a389b9d4d88f';
const TARGET_DIR = path.resolve(__dirname, '..');

console.log('Target directory:', TARGET_DIR);

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    ensureDir(dest);
    for (const item of fs.readdirSync(src)) {
      copyRecursive(path.join(src, item), path.join(dest, item));
    }
  } else {
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
  }
}

function walkMaps(dir) {
  let res = [];
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) res.push(...walkMaps(full));
    else if (item.endsWith('.map')) res.push(full);
  }
  return res;
}

// 1. Recover TypeScript & Frontend Source files from source maps
console.log('--- Phase 1: Recovering Source Files from Source Maps ---');
const maps = walkMaps(ASAR_EXTRACT_DIR);
console.log(`Found ${maps.length} source maps.`);

let recoveredCount = 0;
let vendorCount = 0;
const writtenFiles = new Set();

for (const mapFile of maps) {
  try {
    const mapData = JSON.parse(fs.readFileSync(mapFile, 'utf8'));
    if (!mapData.sources || !mapData.sourcesContent) continue;

    mapData.sources.forEach((rawSource, idx) => {
      const content = mapData.sourcesContent[idx];
      if (!content) return;

      let norm = rawSource.replace(/\\/g, '/');
      norm = norm.replace(/^webpack:\/\/tradingview-desktop\//, '');
      norm = norm.replace(/^webpack:\/\/\//, '');
      norm = norm.replace(/^\.\.\//, '');
      norm = norm.replace(/^\.\//, '');
      norm = norm.split('?')[0]; // Remove query string

      if (norm.startsWith('webpack/') || norm.startsWith('external ') || norm.includes('webpack/runtime')) {
        return;
      }

      let targetPath = null;
      if (norm.startsWith('src/')) {
        targetPath = path.join(TARGET_DIR, norm);
        recoveredCount++;
      } else if (norm.includes('@tradingview/')) {
        // Vendor libraries authored by TradingView
        const match = norm.match(/node_modules\/@tradingview\/(.+)/);
        if (match) {
          targetPath = path.join(TARGET_DIR, 'packages', match[1]);
          vendorCount++;
        }
      }

      if (targetPath) {
        ensureDir(path.dirname(targetPath));
        // Prefer longer/fresher version if duplicate
        if (!fs.existsSync(targetPath) || fs.statSync(targetPath).size < Buffer.byteLength(content, 'utf8')) {
          fs.writeFileSync(targetPath, content, 'utf8');
          writtenFiles.add(targetPath);
        }
      }
    });
  } catch (err) {
    console.error(`Error processing map ${mapFile}:`, err.message);
  }
}
console.log(`Successfully recovered ${writtenFiles.size} unique source files! (${recoveredCount} app src, ${vendorCount} packages)`);

// 2. Copy Static Runtime Assets
console.log('--- Phase 2: Copying Runtime Bundles, Preload, Configs & Assets ---');
const assetDirs = ['configs', 'resources', 'preload', 'app', 'build', 'native'];
for (const dir of assetDirs) {
  const src = path.join(ASAR_EXTRACT_DIR, dir);
  const dest = path.join(TARGET_DIR, dir);
  console.log(`Copying ${dir}...`);
  copyRecursive(src, dest);
}

// Copy root binaries & index files from asar
const rootFiles = ['keytar.node', 'index.js', 'index.js.map', '.npmrc'];
for (const file of rootFiles) {
  const src = path.join(ASAR_EXTRACT_DIR, file);
  const dest = path.join(TARGET_DIR, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${file}`);
  }
}

// Also ensure native unpacked modules exist
const unpackedSrc = path.join(MSIX_EXTRACT_DIR, 'resources', 'app.asar.unpacked');
if (fs.existsSync(unpackedSrc)) {
  console.log('Copying unpacked native modules...');
  copyRecursive(unpackedSrc, TARGET_DIR);
}

// 3. Set up Portable Electron Runtime
console.log('--- Phase 3: Setting up Portable Electron Runtime ---');
const runtimeDir = path.join(TARGET_DIR, 'runtime');
ensureDir(runtimeDir);

const runtimeFiles = [
  'chrome_100_percent.pak',
  'chrome_200_percent.pak',
  'd3dcompiler_47.dll',
  'dxcompiler.dll',
  'dxil.dll',
  'ffmpeg.dll',
  'icudtl.dat',
  'libEGL.dll',
  'libGLESv2.dll',
  'resources.pak',
  'snapshot_blob.bin',
  'v8_context_snapshot.bin',
  'vk_swiftshader.dll',
  'vk_swiftshader_icd.json',
  'vulkan-1.dll'
];

for (const rf of runtimeFiles) {
  const s = path.join(MSIX_EXTRACT_DIR, rf);
  const d = path.join(runtimeDir, rf);
  if (fs.existsSync(s)) {
    fs.copyFileSync(s, d);
  }
}

// Copy locales to runtime
copyRecursive(path.join(MSIX_EXTRACT_DIR, 'locales'), path.join(runtimeDir, 'locales'));

// Copy TradingView.exe as ChartRead.exe
const exeSrc = path.join(MSIX_EXTRACT_DIR, 'TradingView.exe');
const exeDest = path.join(runtimeDir, 'ChartRead.exe');
if (fs.existsSync(exeSrc)) {
  fs.copyFileSync(exeSrc, exeDest);
  console.log('Created runtime/ChartRead.exe');
}

// Create run-chartread.bat launcher
const batContent = `@echo off
echo Starting ChartRead Desktop Application...
cd /d "%~dp0"
start "" "%~dp0runtime\\ChartRead.exe" "%~dp0." %*
`;
fs.writeFileSync(path.join(TARGET_DIR, 'run-chartread.bat'), batContent, 'utf8');
console.log('Created run-chartread.bat launcher!');

console.log('--- Reconstruction Phase Completed Successfully! ---');
