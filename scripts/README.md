# Visual QA & Automated Testing Suite

This repository includes a completely reproducible, cross-platform Chromium DevTools Protocol (CDP) automated testing suite.

## Prerequisites

1. **Node.js 18+** (uses standard global `fetch` and `WebSocket`).
2. **Any Chromium-based browser** installed on your system:
   - Google Chrome
   - Microsoft Edge
   - Brave Browser
   - Chromium

## Quick Execution Commands

```bash
# 1. Run Security, Auth, Rate-Limit & API Test Suite:
npm run test:security

# 2. Run Chromium DevTools Protocol (CDP) 5-Viewport Visual QA Suite:
npm run test:visual
```

## Running the Visual QA Suite

1. **Start the Development Server** (if not already running):
   ```bash
   npm run dev
   ```
   *The server runs at `http://localhost:3000`.*

2. **Execute the Visual QA Suite**:
   ```bash
   node scripts/run_visual_qa.mjs
   ```

   *(Optional) To test a different port:*
   ```bash
   node scripts/run_visual_qa.mjs 3001
   ```

   *(Optional) To specify a custom browser binary:*
   ```bash
   BROWSER_PATH="/usr/bin/google-chrome" node scripts/run_visual_qa.mjs
   ```

## What the Suite Validates Across All 5 Viewports

The script automatically tests:
- **1920 × 1080** (Desktop Full)
- **1366 × 768** (Standard Laptop)
- **1024 × 768** (Tablet Landscape)
- **768 × 1024** (Tablet Portrait)
- **390 × 844** (Mobile iOS / Android)

Checks performed per viewport:
1. **Network CSS Check:** Verifies all compiled stylesheets return HTTP 200 (zero 404s).
2. **Post-Intro Dismissal & Reload:** Verifies zero hydration errors, zero FOUC, and computed background styling.
3. **Floating Navbar:** Position is `fixed`, `z-index >= 50`, and visible across all sections.
4. **Section Visibility:** All 9 content sections exist with `opacity: 1`, `display: block/flex`, and valid bounding rects.
5. **Navbar & Hash Navigation:** Clicking links and setting `window.location.hash` scrolls to sections with calibrated offsets (visible below the 84px floating navbar).
6. **Scroll Interruption & Cancellation:** Dynamic scroll-end detection releases locks cleanly when the user scrolls manually.
7. **Zero Horizontal Overflow:** Verifies `scrollWidth <= clientWidth` across all breakpoints.
8. **Automated Artifacts:** Generates both viewport and full-page PNG screenshots in `./screenshots/regression/`.
