/**
 * ChartRead Storage Bridge
 * Supports both:
 * 1. Offline Local Storage (Zero-config, saves directly to disk)
 * 2. Optional OpenSearch / Elasticsearch Cloud Storage for syncing:
 *    - User data & preferences (chartread_userdata)
 *    - Chart layouts & indicator configurations (chartread_layouts)
 *    - Drawings & technical analysis annotations (chartread_drawings)
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
let ipcMain = null;
let app = null;

try {
  const electron = require('electron');
  ipcMain = electron.ipcMain;
  app = electron.app;
} catch (e) {}

// Load optional .env file if present
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  try {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
      }
    }
  } catch (e) {}
}

const OPENSEARCH_CONFIG = {
  host: process.env.OPENSEARCH_HOST || '',
  port: parseInt(process.env.OPENSEARCH_PORT, 10) || 12445,
  user: process.env.OPENSEARCH_USER || '',
  pass: process.env.OPENSEARCH_PASS || '',
  protocol: process.env.OPENSEARCH_PROTOCOL || 'https'
};

const hasRemoteConfig = Boolean(OPENSEARCH_CONFIG.host && OPENSEARCH_CONFIG.host.trim().length > 0);

// Local fallback cache path
let cacheDir = '';
try {
  cacheDir = app ? app.getPath('userData') : path.join(__dirname, 'TVAppStorage');
} catch (e) {
  cacheDir = path.join(__dirname, 'TVAppStorage');
}

if (!fs.existsSync(cacheDir)) {
  try {
    fs.mkdirSync(cacheDir, { recursive: true });
  } catch (e) {}
}

const CACHE_FILE = path.join(cacheDir, 'chartread-local-storage.json');

// Memory Cache
let memoryCache = {
  userdata: {},
  layouts: {},
  drawings: {}
};

// Load local cache if exists
try {
  if (fs.existsSync(CACHE_FILE)) {
    memoryCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  }
} catch (e) {}

function saveCacheToDisk() {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(memoryCache, null, 2), 'utf8');
  } catch (e) {}
}

/**
 * Perform request to OpenSearch (if configured)
 */
function openSearchRequest(method, endpoint, body = null) {
  if (!hasRemoteConfig) {
    return Promise.resolve({ ok: false, error: 'local_storage_mode' });
  }

  return new Promise((resolve) => {
    try {
      const isHttps = OPENSEARCH_CONFIG.protocol === 'https';
      const transport = isHttps ? https : http;
      const postData = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;

      const authHeader = (OPENSEARCH_CONFIG.user && OPENSEARCH_CONFIG.pass)
        ? 'Basic ' + Buffer.from(OPENSEARCH_CONFIG.user + ':' + OPENSEARCH_CONFIG.pass).toString('base64')
        : null;

      const req = transport.request({
        method,
        hostname: OPENSEARCH_CONFIG.host,
        port: OPENSEARCH_CONFIG.port,
        path: endpoint,
        headers: {
          ...(authHeader ? { 'Authorization': authHeader } : {}),
          'Content-Type': 'application/json',
          ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
        },
        timeout: 5000,
        rejectUnauthorized: false
      }, (res) => {
        let respData = '';
        res.on('data', chunk => respData += chunk);
        res.on('end', () => {
          try {
            resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, data: JSON.parse(respData) });
          } catch (e) {
            resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, raw: respData });
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ ok: false, error: 'timeout' });
      });

      req.on('error', (err) => {
        resolve({ ok: false, error: err.message });
      });

      if (postData) req.write(postData);
      req.end();
    } catch (err) {
      resolve({ ok: false, error: err.message });
    }
  });
}

const OpenSearchService = {
  // 1. User Data
  async saveUserData(userData) {
    memoryCache.userdata = { ...memoryCache.userdata, ...userData, updated_at: new Date().toISOString() };
    saveCacheToDisk();

    if (hasRemoteConfig) {
      await openSearchRequest('PUT', '/chartread_userdata/_doc/default_user', memoryCache.userdata);
    }
    return true;
  },

  async getUserData() {
    if (hasRemoteConfig) {
      const res = await openSearchRequest('GET', '/chartread_userdata/_doc/default_user');
      if (res.ok && res.data && res.data._source) {
        memoryCache.userdata = res.data._source;
        saveCacheToDisk();
        return res.data._source;
      }
    }
    return memoryCache.userdata || null;
  },

  // 2. Chart Layouts
  async saveLayout(layoutId, layoutData) {
    if (!layoutId) layoutId = 'default_layout';
    const entry = {
      id: layoutId,
      data: layoutData,
      updated_at: new Date().toISOString()
    };
    memoryCache.layouts[layoutId] = entry;
    saveCacheToDisk();

    if (hasRemoteConfig) {
      await openSearchRequest('PUT', `/chartread_layouts/_doc/${encodeURIComponent(layoutId)}`, entry);
    }
    return true;
  },

  async getLayout(layoutId) {
    if (!layoutId) layoutId = 'default_layout';
    if (hasRemoteConfig) {
      const res = await openSearchRequest('GET', `/chartread_layouts/_doc/${encodeURIComponent(layoutId)}`);
      if (res.ok && res.data && res.data._source) {
        memoryCache.layouts[layoutId] = res.data._source;
        saveCacheToDisk();
        return res.data._source.data;
      }
    }
    return memoryCache.layouts[layoutId]?.data || null;
  },

  async listLayouts() {
    if (hasRemoteConfig) {
      const res = await openSearchRequest('GET', '/chartread_layouts/_search?size=100');
      if (res.ok && res.data?.hits?.hits) {
        return res.data.hits.hits.map(h => ({
          id: h._id,
          updated_at: h._source.updated_at,
          name: h._source.data?.name || h._id
        }));
      }
    }
    return Object.keys(memoryCache.layouts).map(id => ({
      id,
      updated_at: memoryCache.layouts[id].updated_at,
      name: memoryCache.layouts[id].data?.name || id
    }));
  },

  async deleteLayout(layoutId) {
    if (memoryCache.layouts[layoutId]) {
      delete memoryCache.layouts[layoutId];
      saveCacheToDisk();
    }
    if (hasRemoteConfig) {
      await openSearchRequest('DELETE', `/chartread_layouts/_doc/${encodeURIComponent(layoutId)}`);
    }
    return true;
  },

  // 3. Drawings & Technical Annotations
  async saveDrawings(symbol, drawingsData) {
    if (!symbol) symbol = 'GLOBAL';
    const key = symbol.replace(/[^a-zA-Z0-9_-]/g, '_');
    const entry = {
      symbol,
      drawings: drawingsData,
      updated_at: new Date().toISOString()
    };
    memoryCache.drawings[key] = entry;
    saveCacheToDisk();

    if (hasRemoteConfig) {
      await openSearchRequest('PUT', `/chartread_drawings/_doc/${encodeURIComponent(key)}`, entry);
    }
    return true;
  },

  async getDrawings(symbol) {
    if (!symbol) symbol = 'GLOBAL';
    const key = symbol.replace(/[^a-zA-Z0-9_-]/g, '_');
    if (hasRemoteConfig) {
      const res = await openSearchRequest('GET', `/chartread_drawings/_doc/${encodeURIComponent(key)}`);
      if (res.ok && res.data && res.data._source) {
        memoryCache.drawings[key] = res.data._source;
        saveCacheToDisk();
        return res.data._source.drawings;
      }
    }
    return memoryCache.drawings[key]?.drawings || null;
  },

  // Register IPC handlers in Electron Main process
  registerIpc() {
    if (!ipcMain) return;

    ipcMain.handle('chartread:opensearch-save-userdata', async (event, data) => {
      return await this.saveUserData(data);
    });

    ipcMain.handle('chartread:opensearch-get-userdata', async () => {
      return await this.getUserData();
    });

    ipcMain.handle('chartread:opensearch-save-layout', async (event, layoutId, data) => {
      return await this.saveLayout(layoutId, data);
    });

    ipcMain.handle('chartread:opensearch-get-layout', async (event, layoutId) => {
      return await this.getLayout(layoutId);
    });

    ipcMain.handle('chartread:opensearch-list-layouts', async () => {
      return await this.listLayouts();
    });

    ipcMain.handle('chartread:opensearch-delete-layout', async (event, layoutId) => {
      return await this.deleteLayout(layoutId);
    });

    ipcMain.handle('chartread:opensearch-save-drawings', async (event, symbol, data) => {
      return await this.saveDrawings(symbol, data);
    });

    ipcMain.handle('chartread:opensearch-get-drawings', async (event, symbol) => {
      return await this.getDrawings(symbol);
    });

    const mode = hasRemoteConfig ? `Cloud OpenSearch (${OPENSEARCH_CONFIG.host})` : 'Local Offline Storage';
    console.log(`[ChartRead] Storage system initialized [${mode}].`);
  }
};

module.exports = OpenSearchService;
