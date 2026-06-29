# PriceSnap — Full Build Verification & Presentation-Ready Prompt

## How to use

1. **Attach the original video** in the same Cursor Agent message:  
   `C:\Users\Vaughan - Alex\Downloads\Original Pricesnap walkthrough - 2025.MOV`
2. **Copy everything between PROMPT START and PROMPT END** below into a new Agent chat.
3. The agent must **audit every source of truth**, produce a gap report, **fix all blocking issues**, optimize for a live demo, and leave a verification checklist.

> **Important:** The video shows a **top horizontal nav** app at `localhost:5173` — **not** an older sidebar layout described in some audit docs. When sources conflict, **the video wins** for UI/layout; **SALESPERSON_AUDIT.md** wins for field-sales workflows and matching accuracy **only where they don't contradict the video**.

> **Product positioning:** PriceSnap is a **general-purpose quoting tool for salespeople** in any industry. Remove or generalize any **vertical-specific branding, copy, matcher rules, or demo data** (company names, product lines, industry jargon) so the app reads as industry-agnostic. The bundled price list is **sample demo data**, not a locked-in vertical.

---

## PROMPT START

You are a **senior full-stack engineer and experienced field salesperson** preparing PriceSnap for a **live presentation** to stakeholders. Your job is to prove — with evidence — that the current build is the application specified across **all** inputs below, then fix anything that isn't ready.

**Do not assume parity. Do not ship partial fixes. The demo must work end-to-end without excuses.**

---

### Authoritative inputs (review ALL of these)

| # | Source | Path | Role |
|---|--------|------|------|
| 1 | **Original video (PRIMARY UI reference)** | `C:\Users\Vaughan - Alex\Downloads\Original Pricesnap walkthrough - 2025.MOV` | Layout, nav, labels, workflows, visual style |
| 2 | **Video frames** (if present) | `C:\Users\Vaughan - Alex\Projects\pricesnap\video-frames\` | Re-extract with ffmpeg if empty; compare frame-by-frame |
| 3 | **Current codebase** | `C:\Users\Vaughan - Alex\Projects\pricesnap` | What you audit and fix |
| 4 | **Standalone app** | `standalone/index.html`, `standalone/categoryMatcher.js`, `standalone/serve.ps1` | Primary demo path if Node unavailable → http://localhost:8765 |
| 5 | **React app** | `frontend/src/` | Must match video (localhost:5173) |
| 6 | **Backend matcher** | `backend/categoryMatcher.js`, `backend/server.js` | Rule-based / local product matching |
| 7 | **Bundled price list** | Any `.xlsx` in project root or beside `standalone/` (e.g. sample commission/catalog file) | Full item count loaded in demo; not truncated test SKUs |
| 8 | **Original partial source** | `C:\Users\Vaughan - Alex\Desktop\Pricesnap\Price snap\` | Secondary; resolve ambiguities only |
| 9 | **Gap report** | `VIDEO_GAP_REPORT.md`, `VIDEO_GAP_VERIFICATION.md` | Prior audit state |
| 10 | **Salesperson audit** | `SALESPERSON_AUDIT.md` | Field workflows, matching quality (generalize vertical-specific items) |
| 11 | **Test plan** | `TEST_PLAN.md` | Regression scenarios |
| 12 | **Competitive advantages** | `COMPETITIVE_ADVANTAGES.md` | Talking points for presentation |

**Demo credentials:** `admin@example.com` / `password123`

---

### What the video app MUST look like (non-negotiable UI)

These were confirmed from video frame extraction. **Sidebar navigation is wrong.**

#### Shell
- [ ] **Top nav bar:** PS logo + **PriceSnap** | New Quote | Customers | Analytics | Inventory | Promotions | Financing | Files | Team | **Settings ▾**
- [ ] Settings dropdown: Profile, Branding, Subscription
- [ ] Top-right: **Welcome, {name}** + **Logout**
- [ ] Footer on every authenticated page: **© 2025 PriceSnap. All rights reserved.**
- [ ] Browser title: **PriceSnap - Smart Quote Gen...**
- [ ] Light theme, clean white/gray UI, blue accent links — **not** dark sidebar-first layout

#### New Quote (`/` or create flow)
- [ ] **Select Price List** dropdown (e.g. "My Catalog (N items)") + **Upload New** button
- [ ] **Customer Information:** Name, Email, Phone, Address (four fields)
- [ ] **Describe Items** textarea + **Identify Items** button (never "AI", never "Generate Quote" as primary CTA)
- [ ] Success message: **"Matched N item(s)"** (or similar without "AI")
- [ ] **PriceSnap Adjustments:** NL input (e.g. "discount all by 10%") + **Apply Changes** / **Describe Changes**
- [ ] **Quote Items** table: ITEM | QTY | PRICE | NEW PRICE | PROMOTION | TOTAL | delete + **Add** row
- [ ] No sidebar, no hamburger menu, no bundle chips **unless** they appear in the video for that screen

#### Quote edit (`/quotes/:id/edit` behavior)
- [ ] **Financing Options:** dropdown (e.g. "6 Month No Interest - 240 months at 13.99%"), Deposit Amount, radio: Total Only / Payments Only / Both
- [ ] PriceSnap Adjustments section on edit page
- [ ] Promotion dropdown per line item ("None" default)
- [ ] Editable NEW PRICE column

#### Internal quote view
- [ ] Strikethrough list prices where discounted
- [ ] Cost, profit, margin columns
- [ ] Summary: Revenue, Total Cost, Gross Profit, Profit Margin, **Tax (configurable %, video shows 13%)**, Total to Customer
- [ ] Promo badges (e.g. -10%) where applicable

#### Other video pages (at minimum UI shells that look real)
- [ ] **Team** — cards: Team Members, Total Quotes, Total Revenue, Total Profit; team performance list
- [ ] **Promotions** — Create New Promotion form
- [ ] **Branding** (`/branding`) — logo upload/remove, primary/secondary colors, **preset color schemes** row, Preview section
- [ ] **Customers** — list + CRUD
- [ ] Analytics, Inventory, Financing, Files — navigable pages with plausible content (not blank errors)

---

### Product matching & quoting (non-negotiable behavior)

From `SALESPERSON_AUDIT.md`, `TEST_PLAN.md`, and the bundled price list — **expressed in industry-neutral terms**:

- [ ] **Auto-load bundled price list** on first login / when no list active (full catalog, not truncated test data)
- [ ] **categoryMatcher** handles general sales patterns:
  - Natural-language item descriptions → correct SKUs from the active price list
  - **Context carry-over** (e.g. accessory/add-on lines inferred from a primary product already matched)
  - **Bundles** (product + optional add-ons + delivery/install/service lines when described together)
  - **Abbreviations and aliases** common in the demo catalog (short names map to full item names)
  - Quantity defaults and multi-item comma-separated input
- [ ] Matching works **without external API keys** (rule-based / local embeddings only)
- [ ] **No user-facing "AI"**, "Gemini", "Claude", or API key prompts

**Smoke-test phrases** — derive from the **video demo** and the **actual bundled price list** (replace any vertical-specific examples in old docs with phrases that match real SKUs in the loaded catalog):

| Input phrase | Expected behavior |
|--------------|-------------------|
| *(from video)* short multi-item description used in walkthrough | All items from video demo appear in quote table |
| `product name with optional add-on` | Primary product + related add-on/accessory from list |
| `bundle with delivery and installation` | Product line(s) + delivery/install SKUs if present in list |
| Abbreviated SKU names (comma-separated) | Each abbreviation resolves to a catalog item |

Run `scripts/test-matching.mjs` if Node is available; otherwise verify manually in the browser against the loaded price list.

---

### Industry-neutral cleanup (required)

Audit the **entire codebase and docs** for vertical-specific references and generalize:

- [ ] **UI copy** — no industry-specific company names, product lines, or dealer branding in labels, placeholders, help text, or defaults
- [ ] **Demo / seed data** — generic company name (e.g. "Acme Sales Co."), generic sample customer, neutral logo placeholder
- [ ] **Price list labels** — dropdown shows user-defined list name + item count, not a hardcoded vertical brand
- [ ] **Matcher rules** — keep logic (context, bundles, abbreviations) but remove hardcoded vertical product names where possible; prefer matching against **whatever is in the uploaded/bundled catalog**
- [ ] **PDF / branding defaults** — blank or generic placeholders reps can customize per company
- [ ] **Docs** (`README.md`, gap reports, audit files) — frame PriceSnap as **for salespeople in general**; note bundled xlsx is sample data only

Do **not** break matching quality for the demo catalog — generalize **presentation**, not correctness of SKU resolution against the loaded list.

---

### Feature reconciliation (video vs audit docs)

When `SALESPERSON_AUDIT.md` conflicts with the video:

| Topic | Rule |
|-------|------|
| Navigation | **Video:** top nav only. Remove or hide sidebar. Dashboard/Quote History/Price Lists are **not** in video nav — access via Settings or quote flow if needed, don't restore sidebar. |
| Bundle chips | **Video:** not on New Quote screen. Optional behind advanced/manual mode only. |
| Match preview | **Audit:** preview before confirm is valuable. Implement as **inline table edit after Identify Items**, not a separate wizard step that blocks the video layout. |
| Mobile | **Video:** horizontal nav scrolls. Ensure usable tap targets; no sidebar hamburger required. |
| Quote history | **Audit:** duplicate/copy summary valuable. Expose via Customers, quote list in Team/Analytics, or Settings — don't break video nav. |
| Vertical examples | **This prompt:** generalize industry-specific audit examples; keep workflow intent (speed, accuracy, margin visibility). |

---

### Codebase map

| Area | Files |
|------|-------|
| React shell | `frontend/src/App.tsx`, `frontend/src/types.ts`, `frontend/src/index.css` |
| Top nav | `frontend/src/components/navigation/TopNav.tsx` |
| New Quote | `frontend/src/components/views/NewQuoteView.tsx` |
| Quote display/edit/internal | `frontend/src/components/QuoteDisplay.tsx` |
| Team, Promotions, Branding, shells | `frontend/src/components/views/*.tsx` |
| PDF | `frontend/src/utils/pdfExport.ts` |
| Discounts | `frontend/src/utils/discountHelpers.ts` |
| Matcher (sync all copies) | `backend/categoryMatcher.js`, `standalone/categoryMatcher.js`, `frontend/src/utils/categoryMatcher.ts` |
| Standalone | `standalone/index.html` — must mirror React top-nav UX |
| Dead code to remove if unused | `frontend/src/components/navigation/Sidebar.tsx`, orphaned sidebar CSS |

**localStorage keys — preserve (migrate, don't rename):**

| Standalone | React |
|------------|-------|
| `ps_user`, `ps_users` | `pricesnap_user`, `pricesnap_users` |
| `ps_quotes` | `historicalQuotes` |
| `ps_customers` | `customers` |
| `ps_price_lists`, `ps_preferred_list` | `managedPriceLists`, `preferredPriceListId` |
| `ps_company`, `ps_terms` | `companyInfo`, `defaultTerms` |
| `ps_theme`, `ps_templates` | `theme`, templates key if used |

---

### Phase 1 — Full audit (do FIRST)

1. **Watch the video** section-by-section. Note timestamps for every screen.
2. **Re-extract frames** if `video-frames/` is empty:
   ```powershell
   ffmpeg -i "C:\Users\Vaughan - Alex\Downloads\Original Pricesnap walkthrough - 2025.MOV" -vf "fps=1/10" "C:\Users\Vaughan - Alex\Projects\pricesnap\video-frames\frame_%03d.jpg"
   ```
3. **Read every doc** listed in the inputs table; **flag and generalize** vertical-specific content.
4. **Run both apps** — standalone :8765 and React :5173 if Node available.
5. Produce **`PRESENTATION_GAP_REPORT.md`** using this format per item:

```markdown
### [Area] — [Feature]

**Source:** Video @ MM:SS | SALESPERSON_AUDIT | TEST_PLAN | Code inspection
**Current build:** file(s) + observed behavior
**Status:** ✅ Matches | ⚠️ Degraded | ❌ Missing | 🔀 Conflict (explain)
**Priority:** P0 (blocks demo) | P1 (visible in presentation) | P2 (polish)
**Fix:** specific files and approach
```

End with summary table and **Presentation blockers** list (must be empty before Phase 3).

---

### Phase 2 — Fix & optimize for presentation

Fix in order:

1. **P0 presentation blockers** — broken nav, wrong layout, login fails, price list won't load, Identify Items broken, internal view missing tax/profit, blank/error pages on nav items, vertical-specific copy blocking a generic demo
2. **P1 visible gaps** — label mismatches vs video, missing financing/promotions on edit, branding presets, PDF missing logo/colors, matcher failures on smoke-test phrases
3. **P2 polish** — dead sidebar code removal, consistent spacing/fonts, mobile nav scroll, README demo script

**Presentation optimizations (required):**
- [ ] Pre-seed demo data: **generic company branding** (placeholder logo URL optional), default terms, sample customer from video (e.g. walkthrough name) or "Demo Customer"
- [ ] On demo login, bundled price list loads automatically; New Quote ready in &lt;10 seconds
- [ ] One **rehearsed demo path** documented in README:
  1. Login → New Quote
  2. Type the **video walkthrough phrase** (or equivalent multi-item description from loaded catalog) → Identify Items
  3. Apply 10% adjustment → show table
  4. Create/save quote → toggle Internal View → show tax & margin
  5. Export PDF → show branding
  6. Visit Team, Promotions, Branding tabs
- [ ] Remove console errors, broken links, placeholder "lorem ipsum" on pages shown in demo
- [ ] Sync `standalone/index.html` and `frontend/src/` — presenter may use either
- [ ] Update `README.md` with presentation quick-start (standalone + React paths) — **positioned for general sales teams**
- [ ] Update `VIDEO_GAP_REPORT.md` with final verification status

**Constraints:**
- No external API keys for core flows
- No "AI" in user-facing copy
- Industry-agnostic user-facing copy and defaults
- Minimal focused diffs — no unrelated refactors
- Do not commit unless user asks

---

### Phase 3 — Verification & handoff

1. Re-watch video; tick every checklist item above.
2. Run smoke test (browser):
   - Login / logout
   - New Quote full flow with video demo phrase
   - Smoke-test phrases from loaded catalog (table above)
   - Internal view + tax line
   - PDF export with branding
   - Team, Promotions, Branding pages render
   - Refresh — data persists
   - Mobile width (~375px) — nav usable
   - **No vertical-specific branding** visible in default demo state
3. Write **`PRESENTATION_READY.md`** containing:
   - ✅/❌ checklist (all must be ✅)
   - Demo script (60–90 second version + 5-minute version)
   - How to start: `standalone/start.bat` OR `cd frontend && npm run dev`
   - How to swap in a customer's own price list (upload .xlsx)
   - Known limitations (honest, brief)
   - Files changed summary

4. If Node available: `cd frontend && npm run build` must succeed with zero errors.

---

### Deliverables

1. `PRESENTATION_GAP_REPORT.md` — full audit before fixes
2. Code fixes for all P0 and P1 items (including industry-neutral cleanup)
3. `PRESENTATION_READY.md` — demo script + verification checklist
4. Updated `README.md`, `VIDEO_GAP_REPORT.md`
5. Remaining P2 backlog (if any) with rationale

**Begin now:** watch the video, read all docs, run the apps, produce Phase 1 gap report, then implement through Phase 3 without stopping at "mostly done."

## PROMPT END
