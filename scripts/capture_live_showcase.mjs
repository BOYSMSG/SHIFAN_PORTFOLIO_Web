import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const TARGET_PORT = process.argv[2] || process.env.PORT || '3000';
const BASE_URL = `http://localhost:${TARGET_PORT}`;

const outDir = 'C:/Users/Shifan Gouri/.gemini/antigravity/brain/da82f20b-718e-4e50-84de-a23c6005d640/screenshots/live';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function findBrowserExecutable() {
  if (process.env.BROWSER_PATH && fs.existsSync(process.env.BROWSER_PATH)) {
    return process.env.BROWSER_PATH;
  }
  const platform = os.platform();
  const candidates = [];
  if (platform === 'win32') {
    candidates.push(
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      path.join(os.homedir(), 'AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'),
      path.join(os.homedir(), 'AppData\\Local\\Microsoft\\Edge\\Application\\msedge.exe')
    );
  }
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error('No Chromium browser found');
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function capture() {
  const browserPath = findBrowserExecutable();
  const cdpPort = 9225;
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-showcase-'));

  console.log(`Starting headless browser: ${browserPath}`);
  const browserProc = spawn(browserPath, [
    `--remote-debugging-port=${cdpPort}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-extensions',
    `--user-data-dir=${tempDir}`,
    'about:blank',
  ], { stdio: 'ignore' });

  try {
    await sleep(1500);

    const versionRes = await fetch(`http://localhost:${cdpPort}/json/version`);
    const versionData = await versionRes.json();
    console.log('Connected to browser:', versionData.Browser);

    const targetsRes = await fetch(`http://localhost:${cdpPort}/json/list`);
    const targets = await targetsRes.json();
    let target = targets.find((t) => t.type === 'page');

    if (!target) {
      const newTargetRes = await fetch(`http://localhost:${cdpPort}/json/new?${BASE_URL}`);
      target = await newTargetRes.json();
    }

    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((res, rej) => {
      ws.onopen = res;
      ws.onerror = rej;
    });

    let msgId = 1;
    const callbacks = new Map();
    ws.onmessage = (evt) => {
      const data = JSON.parse(evt.data);
      if (data.id && callbacks.has(data.id)) {
        callbacks.get(data.id)(data);
        callbacks.delete(data.id);
      }
    };

    const send = (method, params = {}) => {
      const id = msgId++;
      return new Promise((resolve) => {
        callbacks.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    };

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Network.enable');

    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    const pagesToCapture = [
      { name: '01_homepage_hero', url: `${BASE_URL}/`, wait: 3000, dismissIntro: true },
      { name: '02_homepage_projects_section', url: `${BASE_URL}/#projects`, wait: 2000, dismissIntro: true },
      { name: '03_developer_journal_timeline', url: `${BASE_URL}/journal`, wait: 2500, dismissIntro: false },
      { name: '04_journal_single_entry', url: `${BASE_URL}/journal/autonomous-ai-agent-v1-launch`, wait: 2500, dismissIntro: false },
      { name: '05_projects_gallery', url: `${BASE_URL}/projects`, wait: 2500, dismissIntro: false },
      { name: '06_project_case_study', url: `${BASE_URL}/projects/pokefun-network`, wait: 2500, dismissIntro: false },
      { name: '07_admin_dashboard_login', url: `${BASE_URL}/admin`, wait: 2000, dismissIntro: false },
    ];

    for (const page of pagesToCapture) {
      console.log(`Capturing: ${page.name} (${page.url})`);
      await send('Page.navigate', { url: page.url });
      await sleep(page.wait);

      if (page.dismissIntro) {
        await send('Runtime.evaluate', {
          expression: `(() => {
            const btn = document.querySelector('button[aria-label="Enter Portfolio Immediately"]') || document.querySelector('#cinematic-intro-overlay button');
            if (btn) btn.click();
            sessionStorage.setItem('shifan_intro_dismissed', 'true');
          })()`,
        });
        await sleep(1000);
      }

      const screenshot = await send('Page.captureScreenshot', { format: 'png' });
      const buf = Buffer.from(screenshot.result.data, 'base64');
      const filePath = path.join(outDir, `${page.name}.png`);
      fs.writeFileSync(filePath, buf);
      console.log(`Saved screenshot to: ${filePath}`);
    }

    ws.close();
    console.log('All screenshots captured successfully!');
  } finally {
    try {
      browserProc.kill('SIGKILL');
    } catch (e) {}
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {}
  }
}

capture().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
