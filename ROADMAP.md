# Investing Dashboard — Roadmap
**Last updated:** 2026-05-15
**Current version:** V1 (static, monolithic index.html)
**Stack:** Static HTML/CSS/JS + Tauri desktop wrapper (optional), FastAPI backend
**Repo:** github.com/jeromio1987/investing-dashboard

---

## Current state (V1)

- Monolithic `index.html` with all content + logic inline
- `layouts/` contains preview variants (adam-preview, belle-preview, george-preview, hype-ledger-v1)
- Audio personalities (adam.mp3, george.mp3)
- No live data — thesis map is manually updated

**Key limitation:** Editing one sector or position requires navigating a multi-thousand-line HTML file. Any structural improvement requires this to be solved first.

---

## V2 — Structural refactor (do this first, blocks everything else)

**Owner:** Cursor
**Effort:** ~half day
**Blocks:** All V2 product upgrades below

**Stream 2.1 from workspace master — target structure:**

```
investing-dashboard/
  index.html          ← shell only (nav, tab switcher, widget mount points)
  assets/
    styles.css
    app.js            ← tab logic, filters, widget orchestration
  data/
    sectors.json      ← thesis map content + position data
    watchlist.json    ← tickers Jerome tracks
  README.md           ← how to run locally, how to update content, "as of" date
  ROADMAP.md          ← this file
```

**Done when:** Updating a sector thesis requires editing only `data/sectors.json`, nothing else.

---

## V2 — Product upgrades (parallel with or after refactor)

### A — "As of" metadata + thesis freeze date
**Effort:** 1 hour
- Add `as_of` field to `data/sectors.json`
- Render a visible "Thesis frozen: [date]" badge on the dashboard header
- Purpose: prevents acting on stale thesis without realising it

### B — Client-side filter ("Today I care about…")
**Effort:** 2–3 hours
- Top-of-page filter: Energy / Tech / Commodities / Uranium / All
- Filters the sector view to only show relevant cards
- State persists in localStorage between sessions
- ADHD principle: reduce cognitive load, one screen at a time

### C — Readiness Gate (Health → Investing bridge) ⭐ highest priority
**Effort:** 2–3 hours
**Depends on:** Supabase `cross_app.daily_snapshot` table having sleep_score + hrv_readiness populated by MY PENS

- FastAPI GET endpoint: `/api/readiness` — queries Supabase for today's row
- Banner in EVCalculator header:
  - Green (readiness ≥ 75): "Readiness OK — full position sizing available"
  - Amber (60–74): "Readiness moderate — consider reduced sizing"
  - Red (< 60): "Readiness low — sleep or HRV below threshold. No new positions recommended." + Override button (logs reason)
- Override is logged to `cross_app.impulses` with reason text
- **This is the highest-leverage single feature in the whole super app**

### D — Trade Impulse Router
**Effort:** 3 hours
**Depends on:** Supabase `cross_app.impulses` table

- "I want to trade" button always visible in EVCalculator tab
- Logs: ticker, direction (long/short), reason (free text), timestamp
- Displays last 5 impulse entries: time since logged, whether acted on
- 24h review flag: entries not acted on after 24h get a "Did you still act?" prompt
- Mirror of MY PENS Dopamine Router — same architecture, different domain

### E — Thesis Health Score in Decision Journal
**Effort:** 4 hours
- Add `outcome` ('win' | 'loss' | 'open' | 'scratch'), `exit_reason`, `exit_date`, `return_pct` fields to DecisionJournal entries
- Summary panel at top of Decision Journal tab: win rate overall, win rate by thesis_type, avg hold time by sector
- Closes the feedback loop ADHD decision-making cannot maintain manually across months

### F — Economic Calendar widget for watchlist
**Effort:** 3 hours
**Source:** Alpha Vantage free tier (earnings calendar) or Nasdaq calendar scrape

- FastAPI endpoint scrapes/calls calendar, filters to watchlist tickers (NXE, UUUU, CCJ, POWL, VRT, GEV, NOG, IONQ, NET, etc.)
- New tab or sidebar widget: upcoming earnings + Fed decisions in a 2-week window
- Complements macro regime — adds ticker-level event awareness

---

## V3 — Live data + notifications (medium term)

### G — Macro Regime Alert (push notification)
**Effort:** 4–6 hours
**Source:** MacroEngine indicator in existing FastAPI backend

- Cron job checks regime state on each backend run
- Sends notification on regime boundary crossing (Pushover or ntfy.sh — both free)
- Currently you must open the app to check regime. This makes it proactive.

### H — News sentiment layer for watchlist
**Effort:** 6–8 hours
**Source:** Yahoo Finance RSS (free, already scraped)

- Python VADER sentiment pass on headlines (no LLM needed, fast)
- Sentiment badge per ticker in HypeCycle tab: +/0/−
- Keep it dismissible — this can create noise

### I — Position Sizing Rule Engine
**Effort:** 6 hours
**Depends on:** Readiness Gate (C) live

- Kelly output + portfolio rules → suggested position size with rationale
- Rules: max 10% single position, max 30% single sector, readiness < 60 → all sizes × 0.5
- Converts EVCalculator from a calculator into a decision support system

---

## V4 — Scale / analytics (longer term)

### J — Backtesting simple rules
**Effort:** 1–2 days
**Depends on:** 6+ months of Decision Journal outcomes (E)

- Replay past regime + thesis + outcome data against a simple rule
- "In Risk-On regime, uranium positions returned X% on avg"
- Grows in value linearly with data history

### K — Net worth layer (Maybe Finance integration)
**Effort:** 1 day setup + ongoing maintenance
**Source:** github.com/maybe-finance/maybe (self-hosted, open source)

- Self-host Maybe Finance, wire to same Supabase instance
- Add net worth timeline to Morning Brief
- Covers non-market assets (real estate, ISZE salary, pension)

---

## Cross-app dependencies

| This dashboard needs | Provided by | When |
|---|---|---|
| sleep_score, hrv_readiness | MY PENS / Sleep module → daily_snapshot | After QW2 quick win |
| regime | Investing backend → daily_snapshot | After backend cron added |
| impulses table | Supabase cross_app schema | One migration |
| portfolio PnL row | Investing backend → daily_snapshot | After backend cron added |

---

## Definition of done (V2)
1. Content editable without touching HTML
2. Readiness Gate live and pulling from Supabase
3. Trade Impulse Router logging to Supabase
4. Decision Journal has outcome fields + summary stats
5. README has run instructions and "last verified" date

---

*Next session: do the structural refactor (V2.1) first — everything else builds on it.*
