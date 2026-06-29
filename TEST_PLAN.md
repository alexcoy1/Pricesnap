# PriceSnap Test Plan — Arctic Spa Durham

Run these scenarios before trusting PriceSnap on a live deal.  
**Environment:** `standalone/` at `http://localhost:8765` (run `standalone/start.bat` or `serve.ps1`).  
**Login:** `admin@example.com` / `password123`

Clear localStorage between full regression runs if testing first-time onboarding (`localStorage.clear()` in browser console).

---

## Pre-flight

| Step | Action | Expected |
|------|--------|----------|
| PF-1 | Open app, log in | Dashboard loads; 2026 price list auto-loads (or tap **Load 2026 Arctic Spa Price List**) |
| PF-2 | Go to **Create Quote** | Green banner: "✓ N items loaded" (7+ for test file; 327 for full list) |
| PF-3 | Toggle **Internal View** on any quote | Profit $ and margin % visible; cost not on customer view |

---

## Core matching scenarios (P0)

### TC-1 — Summit Signature + grey cover
**Input:** `summit signature with grey cover`  
**Steps:** Create Quote → enter text → **Preview Matches** → **Create Quote**  
**Expected lines:**
- `Custom - Summit XL Signtaure`
- `Custom - Summit XL Cover`

### TC-2 — Arctic Fox Prestige + cover + Onzen
**Input:** `arctic fox prestige with cover and onzen`  
**Expected lines:**
- `Custom - Arctic Fox Prestige`
- `Custom - Fox Mylovac Cover`
- `Custom - Onzen`

### TC-3 — Covana Legend 14ft + installation
**Input:** `covana legend 14ft slate white with installation`  
**Expected lines:**
- `Covana Legend - LEGEND - 14' Slate/White or Mocha/White`
- `Covana Legend - Legend Installation`

---

## Workflow scenarios (P1)

### TC-4 — Quick bundle chip
**Steps:** Create Quote → tap **Summit + Cover** chip  
**Expected:** Textarea fills with `summit signature with grey cover`; run TC-1 match.

### TC-5 — Match preview cancel
**Steps:** Preview matches → **Edit Request**  
**Expected:** Preview closes; textarea preserved; no quote created.

### TC-6 — Recent customer chip
**Steps:** Create quote for "Jane Smith" → New Quote → **Jane Smith** chip appears  
**Expected:** Customer name field fills on chip tap.

### TC-7 — Duplicate from history
**Steps:** Quote History → **Duplicate** on existing quote  
**Expected:** New Draft quote opens with same lines; new ID and date.

### TC-8 — Copy summary
**Steps:** Open quote → **Copy Summary**  
**Expected:** Clipboard has item list + total; paste into Notepad to verify.

### TC-9 — Manual builder search
**Steps:** Manual builder → search `summit`  
**Expected:** Only Summit-related SKUs shown; select + qty → manual quote creates.

### TC-10 — Quick discount + customer savings
**Steps:** Open quote → Quick Discounts → 10% → Apply  
**Expected:** Strikethrough original prices; green savings summary on customer view; internal view still shows margin.

---

## Mobile / field (P0)

### TC-11 — Mobile navigation
**Steps:** Resize browser &lt;768px or use phone → tap ☰ menu  
**Expected:** Sidebar slides in; tap overlay closes; Create Quote reachable.

---

## Accuracy edge cases

### TC-12 — Series confusion guard
**Input:** `summit prestige with cover` (not signature)  
**Expected:** `Custom - Summit XL Prestige` + `Custom - Summit XL Cover` (not Signature).

### TC-13 — Core Nova bundle chip
**Input:** tap **Core Nova Sig** chip → preview  
**Expected:** `Core - Nova Signature` + likely `Core - Mylovac Cover Upgrade` if "mylovac" in phrase.

### TC-14 — Empty / nonsense input
**Input:** `asdfghjkl`  
**Expected:** Alert: could not match; no quote created; manual builder suggested.

---

## Output & trust

### TC-15 — PDF export
**Steps:** Export PDF on quoted deal  
**Expected:** Company name (Arctic Spa Durham), line items, total, terms footer; no cost/margin on PDF.

### TC-16 — Price list persistence
**Steps:** Refresh browser → Create Quote  
**Expected:** 2026 list still selected; no re-upload required.

---

## Pass criteria

- **All TC-1 through TC-3 must pass** before live customer use.
- **TC-4 through TC-10** should pass for daily workflow confidence.
- **TC-11** required if using phone in field.
- Zero instances of wrong-series spa or wrong cover size on TC-1/2/12.

---

## Automated smoke test (optional)

If Node.js is installed:

```bash
cd frontend
node ../scripts/test-matching.mjs
```

Uses rule-based matcher (no embeddings). Expect `3 passed, 0 failed` with test or full price list.

---

## Known limitations

- Full 327-item commission file must be present for production accuracy; minimal test xlsx covers TC-1–3 only.
- Embedding model first load may take 10–30s on slow devices (shows "Matching items...").
- React app (`npm run dev`) mirrors P1 features; standalone is the primary field deployment.
