# Investing Dashboard — data files

**Canonical editable content** lives here. React loads copies under `react-app/src/data/` (keep in sync when you edit).

| File | Purpose |
|------|---------|
| `sectors.json` | SMID sector theses, scores, watchlists, `as_of`, filter ids |
| `watchlist.json` | Ticker tape / live-quote seed list + `as_of` |
| `positions.json` | Static thesis seed (live book is Portfolio tab / API) |
| `regimes.json` | MacroEngine regime matrix (`as_of` + `regimes` map) |

## Update a thesis

1. Edit `data/sectors.json` (or the matching file under `react-app/src/data/`).
2. Bump `as_of` to today's date — the header badge reads it.
3. Restart / hot-reload Vite (`cd react-app && npm run dev` → http://localhost:5173).

## Filters (“Today I care about…”)

Defined in `sectors.json` → `filters`. Each sector has a `filter` field: `energy` | `tech` | `commodities` | `uranium`. Choice persists in `localStorage` key `investing_care_filter`.

## Sync tip

After editing project-root `data/*.json`:

```powershell
Copy-Item data\*.json react-app\src\data\ -Force
```
