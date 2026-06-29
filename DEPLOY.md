# Deploy PriceSnap to Netlify (live app)

**You do not need GitHub.** GitHub is optional (handy for auto-updates when you push code). You can deploy the whole project straight from your computer.

## Architecture

```
your-site.netlify.app          ← React app (what users see)
        │
        └── /api/ai/generate-quote-items   ← Netlify Function (calls Claude)
                    │
                    └── Anthropic API (your ANTHROPIC_API_KEY)
```

User data (quotes, customers, price lists) saves in each user’s browser (`localStorage`). The server only handles AI matching.

---

## Option A — Deploy from your PC (no GitHub)

This uploads your project folder directly to Netlify, including the Claude server.

### 1. Install Node.js and Netlify CLI

- Node LTS: [nodejs.org](https://nodejs.org)
- Then in PowerShell:

```powershell
npm install -g netlify-cli
netlify login
```

### 2. Create the site and set your Claude key

From your project folder (where `netlify.toml` lives):

```powershell
cd "C:\Users\Vaughan - Alex\Projects\pricesnap"
netlify sites:create --name your-pricesnap-name
```

In the Netlify website: **Site configuration → Environment variables** → add:

| Key | Value |
|-----|--------|
| `ANTHROPIC_API_KEY` | Your `sk-ant-...` key from [console.anthropic.com](https://console.anthropic.com) |

### 3. Deploy

```powershell
netlify deploy --build --prod
```

Netlify builds the React app on their servers, uploads it, and deploys the AI function. You get a live URL like `https://your-pricesnap-name.netlify.app`.

To update later, run `netlify deploy --build --prod` again from the same folder.

---

## Option B — Drag & drop (website only — AI will NOT work)

Netlify’s “Deploy manually” / drag-and-drop only uploads **static files**. It does **not** deploy `netlify/functions/`, so **Claude matching will not work**.

Use Option A or C if you need AI quotes on the live site.

---

## Option C — GitHub (optional, for auto-deploy)

If you want Netlify to rebuild automatically whenever you push code:

1. Push the project to GitHub
2. [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import from Git**
3. Netlify reads `netlify.toml` automatically
4. Add `ANTHROPIC_API_KEY` under **Environment variables**
5. Deploy

---

## Add your Claude API key (all options)

1. Netlify dashboard → your site → **Site configuration** → **Environment variables**
2. Add `ANTHROPIC_API_KEY` = your `sk-ant-...` key
3. Redeploy (or run `netlify deploy --build --prod` again)

The key stays on Netlify’s servers. Users never see it. You do **not** paste it in the app Settings on the live site.

---

## Verify

1. Open your Netlify URL
2. Create an account → **New Quote** → load a price list
3. Type a description → **Identify Items (AI)**

If you see *“Claude API key not configured”*, add the env var and redeploy.

---

## Local development

```powershell
# Terminal 1
copy backend\.env.example backend\.env
# Edit backend\.env — set ANTHROPIC_API_KEY
npm run dev:backend

# Terminal 2
npm run dev:frontend
```

Open `http://localhost:5173`.

---

## What goes to Netlify vs stays local

| Goes to Netlify | Stays local only |
|-----------------|------------------|
| React app (`frontend/dist` after build) | `standalone/` folder (old local-only app) |
| `netlify/functions/` (Claude API) | `backend/server.js` (replaced by Netlify Functions) |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `netlify: command not found` | Run `npm install -g netlify-cli` |
| Build fails | Install Node 20+; run `npm install --prefix frontend` locally to test |
| 503 on Identify Items | Set `ANTHROPIC_API_KEY` in Netlify env vars, redeploy |
| Drag-drop deploy but AI broken | Expected — use Option A instead |
