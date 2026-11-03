// scripts/cdp_helper.js
const fs = require('fs');

async function getWsUrl() {
  const res = await fetch('http://localhost:9222/json');
  const pages = await res.json();
  const page = pages.find(p => p.url && p.url.includes('tradingview.com/chart'));
  if (!page) throw new Error('TradingView chart page not found');
  return page.webSocketDebuggerUrl;
}

async function evalInPage(expression) {
  const wsUrl = await getWsUrl();
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let msgId = 1;
    ws.onopen = () => {
      ws.send(JSON.stringify({
        id: msgId,
        method: 'Runtime.evaluate',
        params: {
          expression,
          returnByValue: true,
          awaitPromise: true
        }
      }));
    };
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id === msgId) {
        ws.close();
        if (data.error) {
          reject(data.error);
        } else if (data.result.exceptionDetails) {
          reject(data.result.exceptionDetails);
        } else {
          resolve(data.result.result.value);
        }
      }
    };
    ws.onerror = (err) => reject(err);
  });
}

async function captureScreenshot(filepath) {
  const wsUrl = await getWsUrl();
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let msgId = 1;
    ws.onopen = () => {
      ws.send(JSON.stringify({
        id: msgId,
        method: 'Page.captureScreenshot',
        params: { format: 'png' }
      }));
    };
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id === msgId) {
        ws.close();
        if (data.result && data.result.data) {
          fs.writeFileSync(filepath, Buffer.from(data.result.data, 'base64'));
          resolve(filepath);
        } else {
          reject(new Error('Failed to capture screenshot'));
        }
      }
    };
    ws.onerror = (err) => reject(err);
  });
}

module.exports = { getWsUrl, evalInPage, captureScreenshot };

if (require.main === module) {
  const expr = process.argv[2] || 'document.title';
  evalInPage(expr).then(res => console.log('Result:', res)).catch(err => console.error('Error:', err));
}
