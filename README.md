# PriceSnap

**Sales quoting application** for field reps — natural-language item matching (Claude AI), margin-aware quotes, branded PDFs, customers, promotions, financing, team workspace, and catalog management.

## Deploy live (Netlify)

**You do not need GitHub.** Deploy the whole project from your PC with the Netlify CLI, or connect GitHub if you want auto-updates later.

**→ See [DEPLOY.md](DEPLOY.md)** — Option A: `netlify deploy --build --prod` from this folder.

---

## Run locally (development)

Double-click **`start.bat`** or run:

```powershell
.\start-local.ps1
```

Opens **http://127.0.0.1:8766**

**First time:** click **Get started** on the landing page and create your account. Your workspace starts empty — upload your price list under **New Quote** or **Branding → Price Lists**.

**AI matching:** For best results, add your Claude API key under **Settings → Preferences** (starts with `sk-ant-`). Without a key, local AI is used as fallback.

### Claude API setup (standalone app at :8766)

1. Get a key from [console.anthropic.com](https://console.anthropic.com)
2. Open the app → **Settings → Preferences**
3. Paste your key in **Claude API Key** and click out of the field to save
4. **Install Node.js LTS** if you have not already ([nodejs.org](https://nodejs.org)) — the standalone server uses it as a secure local proxy to Claude
5. Restart the app (`start.bat`) and hard-refresh the browser

### Claude API setup (full stack with backend)

1. Copy `backend/.env.example` to `backend/.env`
2. Set `ANTHROPIC_API_KEY=sk-ant-your-key-here`
3. Run `start.bat` (with Node installed) — backend starts on port 3001
4. Optionally also paste the key in **Settings → Preferences** in the React app at :5173

This is the **full application** — not a slideshow or mockup. Every nav item is functional with create/edit/delete and persistence across refresh.

---

## What you get locally

| Area | Capability |
|------|------------|
| **Quotes** | Describe items → match catalog → adjustments → customer/internal views → PDF export |
| **Customers** | Full CRUD, quote history per contact |
| **Catalog** | Upload `.xlsx` (Item, Price, Cost), multiple lists, preferred list |
| **Promotions** | Create/edit/toggle promotions; apply on quote lines |
| **Financing** | Manage options; select on quote edit |
| **Team** | Invite/edit members, workspace stats |
| **Files** | Upload/download documents (stored locally) |
| **Analytics** | Pipeline stats, filters, CSV export |
| **Inventory** | Search/sort full catalog |
| **Branding** | Logo, colors, presets, PDF styling |
| **Settings** | Profile, preferences, subscription plan (local), marketing page |

---

## React + API dev stack (optional)

If [Node.js LTS](https://nodejs.org) is installed, `start-local.ps1` automatically runs:

- **Frontend** — http://localhost:5173 (React + Vite)
- **Backend** — http://localhost:3001 (Express, rule-based matcher)

Manual:

```powershell
npm run install:all   # from project root
npm run dev
```

---

## Your price list

1. Prepare Excel: columns **Item**, **Price**, **Cost**
2. **New Quote** → **Upload New**
3. Describe products using names from that file → **Identify Items**

Bundled `sample-price-list.json` is starter data only.

---

## Architecture

| Path | Role |
|------|------|
| `standalone/` | Self-contained app — **use this for daily local work** |
| `frontend/` | React source (same features as standalone) |
| `backend/` | Optional API; matcher also runs in-browser |
| `scripts/test-matching.mjs` | Catalog matching regression tests |

---

## Smoke-test phrase (sample catalog)

```
cub sig, spaboy, spaboy starter
```

Should match three line items before creating a quote.

---

## Local-only limitations

- **Single browser profile** — data does not sync across devices or browsers
- **No email delivery** — export PDF and send yourself
- **Subscription** — plan selection is saved locally (no payment processor)
- **Auth** — local accounts in browser storage, not a remote user database

For a multi-user hosted deployment you would add a server database and authentication backend; the UI and workflows in this repo are the complete sales application layer.
