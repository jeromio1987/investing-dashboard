# Investing Dashboard — Setup Guide

**Human-only checklist (Supabase, secrets, Windows Task Scheduler, why each):** see [`MANUAL_SETUP_LOG.md`](MANUAL_SETUP_LOG.md).

Three tiers. Use whichever fits your workflow.

---

## Tier 1 — Original HTML (works right now, zero setup)

Just open `index.html` in your browser. Double-click it.
This is the production file: 8 tabs, all charts, full functionality.
No build step, no server, no dependencies.

---

## Tier 2 — FastAPI backend (better live prices)

The Python backend eliminates CORS proxy hacks and adds WebSocket
streaming. The original `index.html` auto-connects to it when running.

### One-time setup

```bash
cd backend
pip install -r requirements.txt
```

### Every session

```bash
cd backend
python server.py
```

Then open `index.html` as normal. The dashboard detects the backend and
switches from Yahoo proxy to WebSocket automatically. A green **● LIVE**
badge appears in the header.

If the backend is not running, the dashboard falls back gracefully to
the Yahoo Finance proxy — no errors, no broken UI.

**Endpoints:**
- `GET  http://127.0.0.1:8765/quotes?tickers=NXE,POWL,...` — snapshot
- `WS   ws://127.0.0.1:8765/ws/prices` — 30-second streaming
- `GET  http://127.0.0.1:8765/docs` — interactive API docs

---

## Tier 3 — React SPA (component architecture, dev mode)

The React app lives in `react-app/`. It has the same 8 tabs, built with
Vite + React 18. State persists to `localStorage` between sessions.

### Prerequisites

Install Node.js 18+ from https://nodejs.org (LTS version).

### One-time setup

```bash
cd react-app
npm install
```

### Dev server (hot reload)

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### Production build

```bash
npm run build
```

Output in `react-app/dist/`. Open `dist/index.html` directly.

---

## Tier 4 — Tauri desktop app (native .exe)

Wraps the React app in a native Windows window. No browser chrome,
file system access, auto-launch from taskbar.

### Prerequisites (in addition to Node.js)

1. Install **Rust** from https://rustup.rs
   - During install, select the default toolchain (stable-x86_64-pc-windows-msvc)
   - Restart your terminal after install

2. Install **Visual Studio Build Tools** (C++ workload) — needed by Rust
   - Download from https://visualstudio.microsoft.com/downloads/
   - Select "Desktop development with C++"

3. Install the Tauri CLI:
   ```bash
   cd react-app
   npm install
   ```
   The `@tauri-apps/cli` is already in package.json.

### Dev mode (live Tauri window)

```bash
cd react-app
npm run tauri
```

This opens a native window that hot-reloads as you edit code.

### Build the .exe

```bash
cd react-app
npm run tauri:build
```

Output: `react-app/src-tauri/target/release/bundle/`
- `.exe` installer for Windows
- Also produces an `.msi` installer

**Note:** First build takes 10–20 minutes (Rust compiles from scratch).
Subsequent builds are much faster.

### Add an icon (optional)

Replace the placeholder icons in `react-app/src-tauri/icons/` with your
own 32×32, 128×128, and 256×256 PNG files. Run:
```bash
cd react-app
npx tauri icon path/to/your-icon.png
```
This auto-generates all required sizes.

---

## Architecture diagram

```
index.html                         ← Tier 1: works standalone, always will
    │
    └── backend/server.py          ← Tier 2: optional, start before opening HTML
           FastAPI on :8765
           REST /quotes + WS /ws/prices

react-app/                         ← Tier 3+4: React SPA
    ├── src/
    │   ├── App.jsx                    main layout + tab routing
    │   ├── App.css                    all styles (same as index.html)
    │   ├── context/
    │   │   └── DashboardContext.jsx   shared state (portfolio, journal, EV, corr)
    │   ├── hooks/
    │   │   └── useLiveData.js         WS → REST → Yahoo fallback chain
    │   ├── data/
    │   │   ├── regimes.js             all REGIMES constant
    │   │   ├── smidStocks.js          SMID_STOCKS + sector constants
    │   │   ├── radarData.js           RADAR_DATA + CAT_EVENTS
    │   │   └── corrData.js            CORR_SECTOR_MAP + CORR_FACTOR_BASE
    │   ├── utils/
    │   │   └── chartUtils.js          canvas drawing functions (radar, treemap, etc.)
    │   └── tabs/
    │       ├── HypeCycle.jsx          SVG chart + sector cards
    │       ├── MacroEngine.jsx        regime selector (controlled React)
    │       ├── SmidAlpha.jsx          SMID table + radar + catalyst timeline
    │       ├── SmidSectors.jsx        sector deep-dives
    │       ├── Portfolio.jsx          position tracker + treemap
    │       ├── EVCalculator.jsx       EV/Kelly/payoff engine
    │       ├── DecisionJournal.jsx    thesis logging + outcome tracking
    │       └── Correlation.jsx        NxN heatmap + factor breakdown
    │
    └── src-tauri/                 ← Tier 4: Tauri desktop wrapper
        ├── tauri.conf.json            window size, bundle config, allowlist
        ├── Cargo.toml                 Rust dependencies
        └── src/main.rs                Tauri entry point (3 lines)
```

---

## Troubleshooting

**Backend not connecting:**
Check `http://127.0.0.1:8765/health` in your browser. If it returns `{"status":"ok"}`, the backend is running. The dashboard connects automatically.

**React build fails:**
Run `npm install` first. Make sure Node.js ≥ 18.

**Tauri build fails (MSVC not found):**
You need Visual Studio Build Tools with the "Desktop development with C++" workload. Download from Microsoft's website.

**Tauri build fails (Rust error):**
Run `rustup update stable` to ensure you have the latest stable Rust.

**Canvas charts blank in React dev:**
Charts initialize when their tab becomes active. Click the tab to trigger the draw. This is by design (lazy init for performance).
