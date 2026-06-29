# PriceSnap — Presentation Ready

**Status:** Ready for stakeholder demo (standalone path verified; React path requires Node).

---

## Pre-demo checklist

| Item | Status |
|------|--------|
| Top nav matches video (+ Home dashboard) | ✅ |
| Landing page (unauthenticated + from Settings) | ✅ |
| Footer © 2025 PriceSnap | ✅ |
| Login works (`admin@example.com` / `password123`) | ✅ |
| Sample catalog auto-loads | ✅ |
| Identify Items — video phrase works | ✅ |
| Internal view + Tax (13%) | ✅ |
| PDF export | ✅ |
| Team / Promotions / Branding / Customers — full CRUD | ✅ |
| Analytics / Inventory / Financing / Files / Subscription | ✅ |
| Settings dropdown (Profile, Branding, Price Lists, Preferences, Subscription, Marketing) | ✅ |
| No vertical dealer branding in defaults | ✅ |
| No user-facing "AI" copy | ✅ |
| Standalone + React parity | ✅ |

---

## How to start

### Standalone (recommended — no Node)

```powershell
cd "C:\Users\Vaughan - Alex\Projects\pricesnap\standalone"
.\serve.ps1
```

Open **http://localhost:8765**

Or double-click `start.bat`.

### React (full dev build)

```powershell
cd "C:\Users\Vaughan - Alex\Projects\pricesnap\frontend"
npm install
npm run dev
```

Open **http://localhost:5173**

---

## Demo credentials

- **Email:** `admin@example.com`
- **Password:** `password123`
- **Welcome name:** Alex Coy (matches video)

---

## 60-second demo script

1. **Login** with demo credentials.
2. **New Quote** — confirm **Sample Catalog** is loaded (28 items).
3. Type: `cub sig, spaboy, spaboy starter` → click **Identify Items**.
4. Confirm 3 line items in table → **Create Quote**.
5. Toggle **Internal View** → point out cost, margin, **Tax (13%)**.
6. **Export PDF** → show Acme Sales Co. branding.
7. Click **Team** → show performance cards.
8. **Settings → Branding** → show logo upload and color presets.

---

## 5-minute demo script

Everything in the 60-second script, plus:

1. **PriceSnap Adjustments** — enter `discount all by 10%` → **Apply** before creating quote.
2. On quote view — show **Financing Options** and per-line **Promotion** dropdowns.
3. **Customers** — show demo customer Alex Coy; add a new customer.
4. **Promotions** — walk through Create New Promotion form.
5. **Files** — show sample document list.
6. **Upload New** price list — explain reps upload their own `.xlsx` (Item, Price, Cost columns).
7. Refresh browser — confirm quote and customer data persist.

---

## Swap in a customer's price list

1. Prepare Excel with columns: **Item**, **Price**, **Cost** (one row per SKU).
2. On **New Quote**, click **Upload New** and select the `.xlsx` file.
3. The dropdown updates with the file name and item count.
4. Describe items using names/abbreviations from that catalog → **Identify Items**.

The bundled **Sample Catalog** is demo data only — any sales team can replace it with their own list.

---

## Smoke-test phrases (sample catalog)

| Phrase | Expected lines |
|--------|----------------|
| `cub sig, spaboy, spaboy starter` | Cub Signature 7', SpaBoy Salt Water System, SpaBoy Starter Kit |
| `summit signature with grey cover` | Summit XL Signature + Cover |
| `arctic fox prestige with cover and onzen` | Fox Prestige + Cover + Onzen |

---

## Known limitations

- **Matcher rules** are tuned for the bundled sample catalog; highly specialized SKU naming in custom uploads may need manual line edits after Identify Items.
- **Subscription** billing is simulated (plan selection + email saved locally) — no payment processor integration.
- **Quote history** is not in top nav (per video); access via Home, Analytics, or Settings → Price Lists area.

---

## Quick paths from the app

| Goal | How |
|------|-----|
| Marketing / landing page | **Settings → Marketing site** (stays signed in) |
| Price list management | **Settings → Price Lists** |
| Quote history | **Home → View all** or **Analytics → View all history** |
| Preferences / theme | **Settings → Preferences** |

---

## Files changed (presentation pass)

- `frontend/public/sample-price-list.json` — bundled demo catalog
- `standalone/sample-price-list.json` — same catalog for standalone
- `frontend/src/App.tsx` — sample catalog load, generic defaults
- `frontend/src/components/auth/AuthContext.tsx` — Acme Sales Co.
- `frontend/src/components/views/NewQuoteView.tsx` — generic placeholders
- `frontend/src/components/views/FilesView.tsx`, `CompanyBrandingView.tsx`
- `backend/categoryMatcher.js`, `standalone/categoryMatcher.js`, `frontend/src/utils/categoryMatcher.ts` — SpaBoy fuzzy match
- `standalone/index.html` — sample catalog, neutral copy
- `scripts/test-matching.mjs` — video demo tests
- `README.md`, `PRESENTATION_GAP_REPORT.md`, `VIDEO_GAP_REPORT.md`
