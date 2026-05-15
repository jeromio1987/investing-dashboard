

Use this as a **checklist only you can complete** (browser, secrets, OS).  
Cursor/Claude can edit code and run `pip` / `npm` **in your repo**, but it cannot log into your accounts or safely receive production keys.

Tick items as you go: `- [ ]` → `- [x]`

---

## 1. Supabase — run SQL for holdings

- **Action:** In [Supabase](https://supabase.com) → your project → **SQL Editor**, open and execute  
`Prive/investing/portfolio_schema.sql` (creates `public.holdings`, optional `asset_prices`, RLS).
- **Action:** Confirm `Prive/investing/cross_app_schema.sql` was already applied (creates `cross_app.daily_snapshot` and related objects). If unsure, open **Table Editor** → schema `**cross_app`** → table `**daily_snapshot**`.

**Why manual:** Only a project owner (you) can run DDL against yourManual setup log — Investing app (OpenBB + portfolio + Supabase) live database. The agent has no access to your Supabase session and must not run destructive SQL on your behalf without you reviewing it.

---

## 2. Supabase — service role and URL (secrets)

- **Action:** In Supabase → **Project Settings** → **API**, copy **Project URL** and the `**service_role`** key (secret).
- **Action:** On your PC, create or edit `**Prive/investing/backend/.env`** (this file is normally gitignored) and set at least:
  - `SUPABASE_URL=https://<your-ref>.supabase.co`
  - `SUPABASE_SERVICE_ROLE_KEY=<service_role_secret>`

**Why manual:** The service role bypasses RLS and must **never** be committed to Git or pasted into chat. Only you should create the real `.env` on your machine.

**Why service role (not anon):** The FastAPI backend writes/reads `holdings` and updates `cross_app.daily_snapshot` server-side; that requires elevated access your browser must not expose.

---

## 3. Backend — optional env for cron and regime

- **Action:** In the same `**backend/.env`**, set as needed:
  - `CRON_SECRET=<long random string>` — required if you want the cron route locked (recommended).
  - `INVESTING_MACRO_REGIME=neutral` (or `risk_on` / `risk_off` / `transition`) — written to `cross_app.daily_snapshot.regime` when the cron job runs.
  - `NEWS_API_KEY` — only if you use `/news`.

**Why manual:** You choose secret values and regime labels; the agent should not invent production secrets for you.

---

## 4. Windows — daily job at ~17:00 (cross-app snapshot)

- **Action:** Ensure the FastAPI process is reachable when the task runs (PC on, backend running, or a service wrapper you trust).
- **Action:** **Task Scheduler** → create a basic task → daily ~17:00 → **Start a program**:
  - Program: `powershell.exe`
  - Arguments (adjust URL and secret; keep the secret out of shared screenshots):
    ```text
    -NoProfile -Command "Invoke-RestMethod -Uri 'http://127.0.0.1:8765/cron/daily-cross-app' -Method Post -Headers @{ Authorization = 'Bearer YOUR_CRON_SECRET' }"
    ```

**Why manual:** Task Scheduler is an **OS** configuration. The agent cannot click through Windows UI for your user profile. The POST must include `Authorization: Bearer <CRON_SECRET>` when `CRON_SECRET` is set in `.env`.

**Why this job exists:** Writes `regime` and `portfolio_pnl_pct` into `cross_app.daily_snapshot` for the same day so other apps (e.g. Morning Brief) can read them.

---

## 5. Frontend — API URL (only if not default)

- **Action:** If the backend is **not** at `http://127.0.0.1:8765`, copy `react-app/.env.example` to `react-app/.env` and set:
  - `VITE_API_URL=http://<host>:<port>`
  Then restart `npm run dev` (Vite reads env at startup).

**Why manual:** Your network layout (different port, LAN IP, HTTPS reverse proxy) is unknown to the repo; only you know the correct base URL for your machine.

---

## 6. Install platform tools (if missing)

- **Action:** Install **Node.js 18+** (LTS) from [nodejs.org](https://nodejs.org) if you run the React app.
- **Action:** Install **Python 3.10+** and ensure `pip` works if you run the backend locally.
- **Action (optional — Tauri desktop only):** Install **Rust** (`rustup`), **Visual Studio Build Tools** (C++ workload), per `SETUP.md` Tier 4.

**Why manual:** These are **system-wide** installers and PATH changes; they require administrator consent and a real shell on your PC.

---

## 7. Verify everything (you in the browser / terminal)

- **Action:** Start backend → open `http://127.0.0.1:8765/health` and confirm JSON includes `"status":"ok"`, and ideally `"supabase": true`, `"openbb": true`.
- **Action:** Start React dev server → open Portfolio tab → add a test holding → confirm it appears after refresh.

**Why manual:** Confirms **your** `.env`, **your** Supabase project, and **your** network (firewall, VPN) together — something no template file can prove.

---

## 8. Security habits (ongoing)

- **Action:** Never commit `backend/.env`, never commit `react-app/.env` if it contains secrets.
- **Action:** Rotate the service role key in Supabase if it was ever leaked.

**Why manual:** Git history and chat logs are easy to overshare; secret hygiene is a human process.

---

## What you can delegate to Cursor/Agent (optional)

These are **not** in the manual list above because an agent can run them **if** you open the repo and allow terminal access:

- `pip install -r backend/requirements.txt`
- `npm install` / `npm run build` in `react-app/`

They stay out of the “manual only” list because they do not require your Supabase login or your `.env` contents.

---

## File map (quick reference)


| File                     | Purpose                                     |
| ------------------------ | ------------------------------------------- |
| `portfolio_schema.sql`   | `public.holdings` (+ optional prices cache) |
| `cross_app_schema.sql`   | `cross_app.daily_snapshot` + RPC/helpers    |
| `backend/.env.example`   | Lists env var **names** (no real secrets)   |
| `react-app/.env.example` | `VITE_API_URL` template                     |
| `SETUP.md`               | Tiers 1–4 (HTML, API, React, Tauri)         |


Update this log when your setup changes (e.g. new machine, new Supabase project).