# PayTrail — deploy via GitHub + Netlify

PayTrail lives in this repo under `apps/paytrail`. Deploy it as a **separate Netlify site** from your PriceSnap site (do not use the repo-root `netlify.toml` — that is for PriceSnap).

## 1. Push to GitHub

From the repo root (`pricesnap`), or double-click **`apps/paytrail/setup-deploy.bat`**:

```bash
git add apps/paytrail .gitignore
git commit -m "Add PayTrail commission app"
git push origin main
```

Repo: [github.com/alexcoy1/Pricesnap](https://github.com/alexcoy1/Pricesnap)

**One-click (Windows):** `apps/paytrail/setup-deploy.bat` — stages PayTrail, commits, pushes, opens Netlify.

**CLI deploy (no GitHub import):** after `netlify login`, run `apps/paytrail/netlify-deploy.bat`.

## 2. Create a Netlify site

1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**
2. Choose **GitHub** → authorize → select **Pricesnap**
3. Configure build settings:

| Setting | Value |
|---------|--------|
| **Branch** | `main` |
| **Base directory** | `apps/paytrail` |
| **Build command** | `npm run build` |
| **Publish directory** | `apps/paytrail/dist` |

Netlify reads `apps/paytrail/netlify.toml` when the base directory is set correctly. The publish directory in the UI should be `dist` (relative to base) or `apps/paytrail/dist` (relative to repo root) — both work if base is `apps/paytrail`.

4. Click **Deploy site**

## 3. Environment variable (optional — for PDF/photo AI)

**Site settings → Environment variables → Add:**

| Key | Value |
|-----|--------|
| `ANTHROPIC_API_KEY` | Your key from [console.anthropic.com](https://console.anthropic.com) |

Redeploy after adding the key. Without it, **smart matching** still works for Excel, CSV, and text PDFs.

## 4. Custom domain (optional)

**Site settings → Domain management** → add your domain (e.g. `paytrail.yourcompany.com`).

## Local dev

```bash
cd apps/paytrail
npm install
npm run dev
```

→ **http://localhost:3000**

Smart matching works without an API key. For local Claude testing: **Settings → Invoice AI (local dev)** or add `ANTHROPIC_API_KEY` to `apps/paytrail/.env`.

## How data works

- Accounts and data are stored in each user’s **browser** (`localStorage`)
- **Backup / restore** — Settings → Download backup
- No database required

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails on Netlify | Confirm **Base directory** = `apps/paytrail` |
| 404 on `/app` routes | `netlify.toml` SPA redirect must deploy — check base directory |
| Invoice AI 503 | Add `ANTHROPIC_API_KEY` in Netlify env vars and redeploy |
| Wrong app deploys | Root site uses `frontend/`; PayTrail needs its **own** Netlify site with base `apps/paytrail` |
