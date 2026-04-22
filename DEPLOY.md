# Deploy to GitHub Pages

## One-time setup (5 minutes)

### 1. Create a GitHub repository
- Go to https://github.com/new
- Name it e.g. `investment-dashboard` (can be private or public)
- Leave it empty (no README)

### 2. Push these files to GitHub
Open a terminal in `C:\Users\jerom\Desktop\claude\Prive\investing\` and run:

```bash
git init
git add index.html smid_data.json fetch_smid_data.py requirements.txt .github/
git commit -m "Initial deploy"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/investment-dashboard.git
git push -u origin main
```

### 3. Enable GitHub Pages
- Go to your repo → **Settings** → **Pages**
- Source: **Deploy from a branch**
- Branch: `main` / `/ (root)`
- Click **Save**
- Your site will be live at: `https://YOUR_USERNAME.github.io/investment-dashboard/`

### 4. Auto data refresh (already wired up)
The `.github/workflows/fetch-data.yml` workflow runs automatically Mon–Fri at:
- 07:00 UTC (09:00 Brussels)
- 12:00 UTC (14:00 Brussels)
- 16:00 UTC (18:00 Brussels)
- 20:00 UTC (22:00 Brussels)

It fetches fresh prices and commits `smid_data.json` to the repo — your live site picks it up automatically.

You can also trigger it manually: repo → **Actions** → **Fetch SMID Data** → **Run workflow**.

## Notes
- The Yahoo Finance live fetch (in-browser) will work much better from HTTPS than from file://
- `sectoren-hype-cycle.html` is your local backup copy; `index.html` is what GitHub Pages serves
- Windows Task Scheduler (setup_scheduler.bat) still works for local use
