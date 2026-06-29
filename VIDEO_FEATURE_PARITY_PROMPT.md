# PriceSnap Video Feature Parity — Agent Prompt

## How to use

1. **Finish optimization work first** — Run this prompt only after the current PriceSnap optimization pass is complete and the app runs locally.
2. **Open this file** and copy everything inside the **PROMPT START** / **PROMPT END** block below into a new Cursor Agent chat.
3. **Attach your original PriceSnap video** in the same message (screen recording of the pre-optimization app). The agent must watch/review that video as the source of truth.
4. **Send the message** — The agent will audit the codebase against the video, produce a gap report, fix P0/high-value P1 gaps, and re-verify against the video.

---

## PROMPT START

You are an experienced **QA engineer and Arctic Spa salesperson** who used the original PriceSnap app daily in the field. You know every screen, workflow, and visual detail from memory. Your job is to ensure the **current optimized codebase** has **full feature, option, capability, and style parity** with the **original app shown in the attached video**.

The video is the **authoritative reference**. The codebase is what you audit and fix. Do not assume parity — prove it.

---

### Inputs

| Input | Description |
|-------|-------------|
| **Attached video** | Screen recording of the **original** PriceSnap build (pre-optimization). Review it section-by-section. Pause, rewind, and note every UI element, label, interaction, and workflow. |
| **Current codebase** | Workspace: `C:\Users\Vaughan - Alex\Projects\pricesnap` |
| **Runnable standalone app** | `standalone/index.html` — serve via `standalone/serve.ps1` or `standalone/start.bat` → http://localhost:8765 |
| **React app** (if used) | `frontend/src/` — Vite dev server on http://localhost:5173 |
| **Matcher API** | `backend/` — category/rule-based matching (`categoryMatcher.js`, `server.js`) |
| **2026 price list** | `2026-Arctic-Spa-PriceSnap-Price-List.xlsx` (should live beside `standalone/index.html` for one-click load) |
| **Original partial source** (secondary reference) | `C:\Users\Vaughan - Alex\Desktop\Pricesnap\Price snap\` — use only to resolve ambiguities; **video wins** on conflicts |

**Demo credentials:** `admin@example.com` / `password123`

---

### Your methodology

Work **section-by-section through the video** (frame-by-frame when needed). For each section, record what you see in the video, then inspect the current code and run the app to confirm behavior matches.

Use this checklist — add rows for anything in the video not listed here:

#### 1. Login & authentication
- [ ] Login screen layout, branding, gradient/auth card styling
- [ ] Email + password fields, validation, error messages
- [ ] Demo / quick-login affordances (if shown)
- [ ] Sign-up flow and field requirements
- [ ] Help screen (if present) and navigation back to login
- [ ] Session persistence (`localStorage` user survives refresh)
- [ ] Logout confirmation and redirect to login
- [ ] Auth-gated routes — unauthenticated users cannot reach app views

#### 2. Navigation, sidebar & shell
- [ ] Sidebar brand ("PriceSnap" gradient text)
- [ ] All nav items present and labeled correctly: Dashboard, Create Quote, Quote History, Price Lists, Customers, Branding, Settings, Profile
- [ ] Active nav state highlighting
- [ ] Sign Out in sidebar footer
- [ ] Page header with title + subtitle per view
- [ ] Mobile hamburger menu, sidebar overlay, and field-usable tap targets
- [ ] Content area layout and spacing match original

#### 3. Dashboard
- [ ] Stat cards (quotes, revenue, customers, etc. — match video counts/labels)
- [ ] Recent quotes list with status badges
- [ ] Quick actions (e.g. "Create Quote", "Load 2026 Price List" when no list loaded)
- [ ] Empty states and onboarding hints

#### 4. Create Quote
- [ ] **Natural-language input** — textarea placeholder examples (Arctic Spa product names: summit, arctic fox, covana, onzen, mylovac, etc.)
- [ ] **Auto Match** badge / service status indicator (must NOT say "AI" in user-facing copy)
- [ ] Generate Quote button, loading state, error handling for unmatched items
- [ ] **Quick bundles / chips** — tap-to-fill presets (e.g. Summit + Cover, Fox + Onzen, Covana 14ft, Core Nova Sig, AWP Ocean)
- [ ] **Manual Quote Builder** — show/hide toggle, searchable item list, checkboxes, quantity inputs, "Create Manual Quote"
- [ ] Customer name field and customer picker/autocomplete from saved customers
- [ ] Matching results: correct Arctic Spa items, quantities, series-aware logic (Custom, Core, All Weather Pool, Covana, etc.)

#### 5. Price lists
- [ ] Excel upload zone (.xlsx) with Item / Price / Cost columns
- [ ] Saved price lists management (name, item count, upload date)
- [ ] **Preferred price list** selection and persistence
- [ ] **One-click "Load 2026 Arctic Spa Price List"** (bundled fetch of `2026-Arctic-Spa-PriceSnap-Price-List.xlsx`, ~323 items)
- [ ] Auto-load preferred/2026 list on app start (if shown in video)
- [ ] Delete price list, switch active list
- [ ] Inline load button on Create Quote when no list active

#### 6. Customer handling
- [ ] Customer field on quote creation
- [ ] Link quote to customer record
- [ ] Customer data appears on quote display and PDF

#### 7. Quote display — customer vs internal
- [ ] **Customer view** — prices, line items, totals; NO cost/margin columns
- [ ] **Internal view** — cost, profit, profit margin per line and overall
- [ ] Toggle between Customer View / Internal View
- [ ] Line-item table: item name, qty, unit price, line total
- [ ] Discount display: strikethrough original price, % OFF badges, per-line savings
- [ ] **Quick Discounts** toolbar: presets (5/10/15/20/25%), reason dropdown (Volume, Seasonal, Loyalty, Custom Offer), Apply to All, Remove Discounts
- [ ] Savings summary banner ("Total savings on this quote!")
- [ ] Edit mode for line prices (if shown)
- [ ] Quote notes and terms section
- [ ] Quote ID, date, version, status badge
- [ ] Back / New Quote actions

#### 8. PDF export, branding & terms
- [ ] Export PDF button
- [ ] PDF includes company logo, name, address, contact, website, tax number
- [ ] Brand primary/secondary colors reflected in PDF or header
- [ ] Line items with discount formatting in PDF
- [ ] Terms & conditions block at bottom
- [ ] Filename pattern (e.g. `quote-<id>.pdf`)

#### 9. Quote history
- [ ] List of historical quotes with search/filter
- [ ] Status badges: Draft, Sent, Approved, Rejected, Completed (match video colors)
- [ ] Open/view historical quote
- [ ] Duplicate quote
- [ ] Delete quote (if shown)
- [ ] Status update workflow
- [ ] Persistence across refresh (`historicalQuotes` / `ps_quotes`)

#### 10. Customers CRUD
- [ ] List customers with name, email, phone, company, address
- [ ] Add new customer form
- [ ] Edit existing customer
- [ ] Delete customer with confirmation
- [ ] Search/filter customers
- [ ] Persistence (`customers` / `ps_customers`)

#### 11. Company branding
- [ ] Company name, address, contact, website, tax/BN number
- [ ] Logo URL upload or path
- [ ] Primary and secondary brand colors (color pickers)
- [ ] Live preview of branding on quote/PDF
- [ ] Default Arctic Spa Durham branding if shown in video

#### 12. Settings
- [ ] Default terms & conditions editor (multi-line)
- [ ] Theme toggle: Light / Dark
- [ ] Any other toggles shown in video (notifications, defaults, etc.)

#### 13. Profile
- [ ] Display name, email, company, phone
- [ ] Edit and save profile
- [ ] Profile persists in auth context / localStorage

#### 14. Mobile & field usability
- [ ] Responsive layout at phone/tablet widths
- [ ] Mobile sidebar menu (☰) and overlay dismiss
- [ ] Touch-friendly buttons, chips, and form controls
- [ ] Horizontal scroll on wide tables where needed
- [ ] Usable one-handed in a showroom / backyard context

#### 15. Styles & visual design
- [ ] **Colors:** primary `#0066FF`, sidebar dark gradient (`#0f172a` → `#1e293b`), success green discounts
- [ ] **Typography:** Inter font family, heading weights, page title size
- [ ] **Layout:** card borders, border-radius, shadows, grid stat cards
- [ ] **Components:** buttons (primary/secondary/danger/success), badges, alerts, upload zone dashed border
- [ ] **Dark mode:** `data-theme="dark"` CSS variables, readable contrast
- [ ] **Animations:** discount pulse/savings highlight (if in video)
- [ ] **Icons/emojis** in nav and UI match original placement
- [ ] No user-facing text containing "AI", "Gemini", "Claude", or API key prompts

---

### Codebase map (where to look)

| Area | Primary files |
|------|---------------|
| Standalone app (preferred for parity testing) | `standalone/index.html`, `standalone/categoryMatcher.js` |
| React shell & state | `frontend/src/App.tsx`, `frontend/src/types.ts` |
| Views | `frontend/src/components/views/*.tsx` |
| Auth | `frontend/src/components/auth/` |
| Quote creation | `frontend/src/components/QuoteInputForm.tsx` |
| Quote display / discounts | `frontend/src/components/QuoteDisplay.tsx`, `frontend/src/utils/discountHelpers.ts` |
| PDF | `frontend/src/utils/pdfExport.ts` |
| Matching logic | `backend/categoryMatcher.js`, `frontend/src/utils/categoryMatcher.ts` |
| Theme | `frontend/src/utils/themeUtils.ts`, `frontend/src/index.css` |
| Sidebar | `frontend/src/components/navigation/Sidebar.tsx` |

**localStorage keys to preserve (do not rename without migration):**

| Standalone (`standalone/index.html`) | React (`frontend/src/`) |
|--------------------------------------|-------------------------|
| `ps_user`, `ps_users` | `pricesnap_user`, `pricesnap_users` |
| `ps_quotes` | `historicalQuotes` |
| `ps_customers` | `customers` |
| `ps_price_lists`, `ps_preferred_list` | `managedPriceLists`, `preferredPriceListId` |
| `ps_company`, `ps_terms` | `companyInfo`, `defaultTerms` |
| `ps_theme` | `theme` |

---

### Phase 1 — Gap report (do this FIRST)

Before changing code, produce a **structured gap report** in this exact format. One subsection per checklist area above.

For **each** feature or UI element observed in the video:

```markdown
### [Area name] — [Feature name]

**Video reference:** [timestamp or brief description of what you see]
**Current build:** [file(s) and behavior observed, or "not found"]

**Status:** ✅ Present and matches | ⚠️ Present but degraded | ❌ Missing

**Details:** [Specific differences — labels, colors, missing columns, broken flows, etc.]

**Priority:** P0 | P1 | P2

**Suggested fix:** [File(s) to change and approach — only if not ✅]
```

**Priority definitions:**
- **P0** — Blocks parity; core workflow broken or absent (login, quote generation, PDF, price list load, customer/internal views)
- **P1** — Important UX/feature gap; app works but clearly worse than original (missing bundles, wrong labels, degraded mobile, missing discount presets)
- **P2** — Polish; minor style/copy differences that a salesperson might notice but won't block daily use

End Phase 1 with a **summary table**:

| Priority | Count | Top items |
|----------|-------|-----------|
| P0 | n | … |
| P1 | n | … |
| P2 | n | … |

**Stop and present the full gap report before implementing fixes**, unless the user has already asked you to proceed through implementation in the same session.

---

### Phase 2 — Implementation

After the gap report is acknowledged (or if instructed to continue in one pass):

1. Fix **all P0** gaps first, then **high-value P1** gaps (bundles, mobile menu, 2026 load, discount toolbar, internal/customer toggle, PDF branding).
2. Prefer fixing **`standalone/index.html`** for field-use parity unless the video clearly matches the React app — keep both in sync when practical.
3. Reuse existing utilities (`categoryMatcher`, `discountHelpers`, `pdfExport`) — do not rewrite from scratch.
4. Run the app locally and smoke-test every fixed flow.

---

### Constraints (mandatory)

- **No "AI" in user-facing copy** — Use "Auto Match", "Smart Match", or "Product Match" instead. Never expose model names, API keys, or "configure your API key" messaging to end users.
- **No external API keys required** — Matching must work offline via `categoryMatcher` rule-based logic. Do not add Gemini/Claude/OpenAI dependencies for core flows.
- **Preserve localStorage patterns** — Keep existing keys and JSON shapes. If you must change a key, add a one-time migration on load.
- **Arctic Spa domain accuracy** — Product names, bundles, and matcher behavior must reflect real 2026 price list items (spa series, covers, Covana, Onzen, Mylovac, AWP, etc.).
- **Minimal scope** — Fix parity gaps only; do not refactor unrelated code or add features not in the video.
- **No secrets in repo** — Do not commit `.env` files or API keys.

---

### Phase 3 — Verification

After fixes:

1. **Re-watch the video** section-by-section and confirm each former gap is resolved.
2. Update the gap report with a **Verification** column: ✅ Fixed | ⚠️ Partial | ❌ Still open
3. Run through this **smoke test script** in the browser:
   - Log in → Dashboard loads
   - Load 2026 price list (one click)
   - Create quote via natural language ("arctic fox prestige with cover and onzen")
   - Create quote via manual builder
   - Toggle internal/customer view; apply 10% volume discount
   - Export PDF; confirm branding and terms
   - Save quote to history; duplicate it
   - Add/edit/delete a customer
   - Toggle dark mode; resize to mobile width; open sidebar menu
   - Refresh page — data persists
4. List any **remaining P1/P2** items explicitly if not fixed.

---

### Output deliverables

1. **Gap report** (Phase 1 format) — complete before coding
2. **Code changes** for P0 and agreed P1 items
3. **Updated verification report** showing video re-check results
4. **Remaining backlog** (unfixed P1/P2 with rationale)

Begin now: watch the attached video, explore the codebase, run `standalone/index.html` locally, and produce the Phase 1 gap report.

## PROMPT END
