/**
 * Reproducible Visual QA & Section Navigation Test Suite
 *
 * Requirements:
 * - Node.js 18+ (uses global fetch and WebSocket)
 * - Any installed Chromium-based browser (Google Chrome, Microsoft Edge, Brave, or Chromium)
 *
 * Usage:
 *   node scripts/run_visual_qa.mjs [PORT]
 *   Default port: 3000 (http://localhost:3000)
 *
 * Optional Environment Variables:
 *   BROWSER_PATH - custom path to browser executable
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const TARGET_PORT = process.argv[2] || process.env.PORT || '3000';
const BASE_URL = `http://localhost:${TARGET_PORT}`;

const VIEWPORTS = [
  { name: '1920x1080_desktop', width: 1920, height: 1080, isMobile: false },
  { name: '1366x768_laptop', width: 1366, height: 768, isMobile: false },
  { name: '1024x768_tablet_landscape', width: 1024, height: 768, isMobile: false },
  { name: '768x1024_tablet_portrait', width: 768, height: 1024, isMobile: true },
  { name: '390x844_mobile', width: 390, height: 844, isMobile: true, deviceScaleFactor: 3 },
];

const SECTIONS = [
  'hero',
  'about',
  'journey',
  'projects',
  'ventures',
  'skills',
  'services',
  'community',
  'contact',
];

const outDir = path.resolve(process.cwd(), 'screenshots', 'regression');
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
      path.join(os.homedir(), 'AppData\\Local\\Microsoft\\Edge\\Application\\msedge.exe'),
      path.join(os.homedir(), 'AppData\\Local\\BraveSoftware\\Brave-Browser\\Application\\brave.exe'),
      'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe'
    );
  } else if (platform === 'darwin') {
    candidates.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
      '/Applications/Chromium.app/Contents/MacOS/Chromium'
    );
  } else {
    candidates.push(
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/usr/bin/microsoft-edge',
      '/usr/bin/brave-browser'
    );
  }

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }

  throw new Error(
    'No Chromium browser found automatically. Please set BROWSER_PATH environment variable to your Chrome/Edge/Brave executable.'
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runVisualQA() {
  console.log(`=== STARTING VISUAL REGRESSION & NAVIGATION QA SUITE ===`);
  console.log(`Target URL: ${BASE_URL}`);

  const browserPath = findBrowserExecutable();
  console.log(`Browser: ${browserPath}`);

  const profileDir = path.join(os.tmpdir(), `browser_qa_${Date.now()}`);
  const cdpPort = 9222 + Math.floor(Math.random() * 50);

  const browserProc = spawn(browserPath, [
    '--headless=new',
    `--remote-debugging-port=${cdpPort}`,
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${profileDir}`,
    'about:blank',
  ]);

  await sleep(2500);

  let versionData;
  try {
    const vRes = await fetch(`http://localhost:${cdpPort}/json/version`);
    versionData = await vRes.json();
    console.log(`Connected to CDP: ${versionData.Browser}\n`);
  } catch (err) {
    browserProc.kill();
    throw new Error(`Failed to connect to browser CDP port ${cdpPort}: ${err.message}`);
  }

  const results = {};

  try {
    for (const vp of VIEWPORTS) {
      console.log(`------------------------------------------------------`);
      console.log(`TESTING VIEWPORT: ${vp.name} (${vp.width}x${vp.height})`);
      console.log(`------------------------------------------------------`);

      const targetsRes = await fetch(`http://localhost:${cdpPort}/json`);
      const targets = await targetsRes.json();
      let target = targets.find((t) => t.type === 'page');

      if (!target) {
        const newTargetRes = await fetch(`http://localhost:${cdpPort}/json/new?${BASE_URL}`);
        target = await newTargetRes.json();
      }

      const ws = new WebSocket(target.webSocketDebuggerUrl);
      await new Promise((resolve, reject) => {
        ws.onopen = resolve;
        ws.onerror = reject;
      });

      let msgId = 1;
      const callbacks = new Map();
      const cssRequests = [];

      ws.onmessage = (evt) => {
        const data = JSON.parse(evt.data);
        if (data.id && callbacks.has(data.id)) {
          callbacks.get(data.id)(data);
          callbacks.delete(data.id);
        }
        if (data.method === 'Network.responseReceived') {
          const resp = data.params.response;
          if (resp.url.includes('.css') || resp.mimeType === 'text/css') {
            cssRequests.push({ url: resp.url, status: resp.status });
          }
        }
      };

      const send = (method, params = {}) => {
        const id = msgId++;
        return new Promise((resolve) => {
          callbacks.set(id, resolve);
          ws.send(JSON.stringify({ id, method, params }));
        });
      };

      const evalVal = (res) => res.result?.result?.value ?? res.result?.value ?? {};

      await send('Page.enable');
      await send('Runtime.enable');
      await send('Network.enable');

      // 1. Device metrics
      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: vp.deviceScaleFactor || 1,
        mobile: vp.isMobile,
      });

      // 2. Fresh Page Load
      await send('Page.navigate', { url: BASE_URL });
      await sleep(2500);

      const allCss200 = cssRequests.length > 0 && cssRequests.every((r) => r.status === 200);
      console.log(`  -> CSS Requests Captured: ${cssRequests.length} (All HTTP 200: ${allCss200})`);

      // 3. Dismiss Intro
      await send('Runtime.evaluate', {
        expression: `(() => {
          const btn = document.querySelector('button[aria-label="Enter Portfolio Immediately"]') || document.querySelector('#cinematic-intro-overlay button');
          if (btn) btn.click();
          sessionStorage.setItem('shifan_intro_dismissed', 'true');
        })()`,
      });
      await sleep(800);

      // 4. Reload Test (Intro Dismissed, Zero FOUC)
      await send('Page.reload');
      await sleep(2500);

      const stylesCheck = await send('Runtime.evaluate', {
        expression: `(() => {
          const bodyBg = window.getComputedStyle(document.body).backgroundColor;
          const navbar = document.querySelector('header');
          const navbarPos = navbar ? window.getComputedStyle(navbar).position : null;
          const navbarZ = navbar ? window.getComputedStyle(navbar).zIndex : null;
          const hasHydrationError = Boolean(document.querySelector('nextjs-portal, [data-nextjs-dialog-overlay]'));
          const horizontalOverflow = document.documentElement.scrollWidth > window.innerWidth;
          return {
            bodyBg,
            navbarPos,
            navbarZ,
            hasHydrationError,
            horizontalOverflow,
            scrollWidth: document.documentElement.scrollWidth,
            windowWidth: window.innerWidth,
          };
        })()`,
        returnByValue: true,
      });

      const st = evalVal(stylesCheck);
      console.log(`  -> Body Background: ${st.bodyBg}`);
      console.log(`  -> Navbar: position=${st.navbarPos}, zIndex=${st.navbarZ}`);
      console.log(`  -> Hydration Error: ${st.hasHydrationError}`);
      console.log(`  -> Horizontal Overflow: ${st.horizontalOverflow} (${st.scrollWidth}px <= ${st.windowWidth}px)`);

      // 5. Scroll from Hero to Contact & Check Section Visibility
      await send('Runtime.evaluate', {
        expression: `window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })`,
      });
      await sleep(600);

      const visCheck = await send('Runtime.evaluate', {
        expression: `(() => {
          const res = {};
          for (const id of ${JSON.stringify(SECTIONS)}) {
            const el = document.getElementById(id);
            if (!el) {
              res[id] = { exists: false };
            } else {
              const comp = window.getComputedStyle(el);
              res[id] = {
                exists: true,
                opacity: parseFloat(comp.opacity),
                display: comp.display,
                visibility: comp.visibility,
              };
            }
          }
          return res;
        })()`,
        returnByValue: true,
      });

      const vis = evalVal(visCheck);
      const allSectionsVisible = Object.values(vis).every(
        (v) => v.exists && v.opacity >= 1 && v.display !== 'none' && v.visibility !== 'hidden'
      );
      console.log(`  -> All 9 Sections Visible: ${allSectionsVisible}`);

      // 6. Navigation Link Click Verification (Desktop)
      if (!vp.isMobile) {
        for (const sec of ['about', 'journey', 'projects', 'ventures', 'skills', 'services', 'community', 'contact']) {
          await send('Runtime.evaluate', {
            expression: `(() => {
              const link = document.querySelector('a[href="#${sec}"]');
              if (link) link.click();
            })()`,
          });
          await sleep(950);

          const clickCheck = await send('Runtime.evaluate', {
            expression: `(() => {
              const el = document.getElementById('${sec}');
              const rect = el ? el.getBoundingClientRect() : null;
              return {
                top: rect ? Math.round(rect.top) : null,
                visibleUnderNavbar: rect ? (rect.top >= 40 && rect.top <= 140) : false,
              };
            })()`,
            returnByValue: true,
          });
          const cRes = evalVal(clickCheck);
          console.log(`  -> Nav Click '#${sec}': Top=${cRes.top}px (Visible below navbar: ${cRes.visibleUnderNavbar})`);
        }
      }

      // 7. Hash & History Navigation Verification
      console.log(`  -> Testing History & Hash Navigation...`);
      await send('Runtime.evaluate', {
        expression: `(() => {
          window.location.hash = '#skills';
        })()`,
      });
      await sleep(900);
      const hashCheck = await send('Runtime.evaluate', {
        expression: `(() => {
          const el = document.getElementById('skills');
          const rect = el ? el.getBoundingClientRect() : null;
          return {
            hash: window.location.hash,
            top: rect ? Math.round(rect.top) : null,
            visible: rect ? (rect.top >= 40 && rect.top <= 140) : false,
          };
        })()`,
        returnByValue: true,
      });
      const hRes = evalVal(hashCheck);
      console.log(`  -> Hash Nav to '#skills': Hash=${hRes.hash}, Top=${hRes.top}px (Visible: ${hRes.visible})`);

      // 8. Capture Viewport & Full Page Screenshots
      const vpScreenshot = await send('Page.captureScreenshot', { format: 'png' });
      const vpBuf = Buffer.from(vpScreenshot.result.data, 'base64');
      fs.writeFileSync(path.join(outDir, `viewport_${vp.name}.png`), vpBuf);

      const layoutMetrics = await send('Page.getLayoutMetrics');
      const content = layoutMetrics.result.contentSize;
      const fullScreenshot = await send('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: true,
        clip: {
          x: 0,
          y: 0,
          width: content.width || vp.width,
          height: content.height,
          scale: 1,
        },
      });
      const fullBuf = Buffer.from(fullScreenshot.result.data, 'base64');
      fs.writeFileSync(path.join(outDir, `full_page_${vp.name}.png`), fullBuf);
      console.log(`  -> Saved: viewport_${vp.name}.png & full_page_${vp.name}.png (${fullBuf.length} bytes)`);

      results[vp.name] = {
        allCss200,
        allSectionsVisible,
        noHydrationErrors: !st.hasHydrationError,
        noHorizontalOverflow: !st.horizontalOverflow,
        fullScreenshotBytes: fullBuf.length,
      };

      ws.close();
    }

    console.log(`\n======================================================`);
    console.log(`FINAL VISUAL QA SUMMARY:`);
    console.log(JSON.stringify(results, null, 2));
    console.log(`======================================================\n`);
  } finally {
    browserProc.kill();
  }
}

runVisualQA().catch((err) => {
  console.error('Visual QA Error:', err);
  process.exit(1);
});
