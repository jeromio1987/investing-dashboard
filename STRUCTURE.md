# Investing Dashboard — structure

**Canonical app:** `react-app/` (Vite + React). Run: `cd react-app && npm run dev` (port 5173).

**Legacy (do not extend):** root `index.html`, `index-v2.html` — monolithic shells kept for archive/links only.

**Backend:** `backend/server_v2.py` on port **8765** — quotes, macro, portfolio, `/api/readiness`, cross_app cron.

## Data layout (target)

| Path | Role |
|------|------|
| `react-app/src/data/*.js` | Static thesis / sector content (modular) |
| `react-app/src/tabs/*.jsx` | Tab panels |
| `react-app/src/config/api.js` | `VITE_API_URL` → FastAPI base |

New sector/thesis edits go in `react-app/src/data/` — not root HTML.

## Readiness Gate

- UI: `react-app/src/tabs/EVCalculator.jsx`
- API: `GET /api/readiness` on FastAPI (reads `cross_app.daily_snapshot`)
- Requires MY PENS sleep log → `crossAppWriter` → Supabase
