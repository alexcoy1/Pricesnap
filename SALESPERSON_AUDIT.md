# PriceSnap Salesperson Audit — Arctic Spa Durham

Audit perspective: daily field/showroom quoting across Classic, Core, Custom, AWP, Covana Legend, and Covana Evolution lines using the 2026 commission price list.

---

## P0 — Blocks daily use or causes wrong quotes

| # | Problem | Who it hurts | Suggested solution | Impact |
|---|---------|--------------|-------------------|--------|
| P0-1 | **Missing cover SKUs** in price list (Fox, 7ft, 8ft Mylovac, Summit XL Cover) caused cover segments to match wrong items or fail | Every rep quoting spa + cover bundles | Merge commission sheets with covers included; one-click reload of 2026 list | **~3–5 min saved per bundle quote**; prevents $500–$1,700 cover pricing errors |
| P0-2 | **Series confusion** (Summit Signature vs Prestige vs Legend Select; Fox vs 7ft/8ft) when typing natural language | Showroom + field reps under time pressure | Arctic Spa–aware `categoryMatcher` rules with context carry-over (spa match → correct cover) | **Prevents wrong-model quotes** on high-ticket spas ($12k–$25k) |
| P0-3 | **No price list on first login** — reps had to upload Excel before any quote | New users, fresh browsers, showroom iPads | Auto-load bundled `2026-Arctic-Spa-PriceSnap-Price-List.xlsx` on login / first visit | **~2 min saved** every morning; removes #1 onboarding failure |
| P0-4 | **Covana size + color + install** not parsed as one bundle (`14ft slate white with installation`) | Covana specialists | Rule-based Covana Legend/Evolution size (8–20ft / 8–11ft) + install from prior context | **Prevents missing install line** (~$2,500) on Covana deals |
| P0-5 | **Mobile sidebar inaccessible** — nav hidden with no menu button on phone | Field reps at customer homes | Hamburger menu + overlay on screens &lt;768px | **Unblocks mobile quoting**; field use becomes viable |
| P0-6 | **No match review before quote created** — wrong embedding match went straight to customer PDF | All reps | Preview matched lines → confirm or edit request | **Prevents 1 bad quote/week** from being sent; ~10 min rework each |

---

## P1 — Saves significant time every quote

| # | Problem | Who it hurts | Suggested solution | Impact |
|---|---------|--------------|-------------------|--------|
| P1-1 | Re-typing common bundles (`summit signature with cover`, `fox prestige onzen`) | High-volume showroom reps | Quick-bundle chips on Create Quote form | **~30–60 sec/quote** × 10+ quotes/day |
| P1-2 | **Manual builder** scrolls 327 SKUs with no search | Everyone using manual fallback | Search/filter by series or item name | **~2 min saved** when fixing a partial auto-match |
| P1-3 | **Repeat customer names** re-entered every visit | Reps with loyal client base | Recent-customer chips from quote history | **~15 sec/quote** |
| P1-4 | **Duplicate quote** from history not available | Follow-up visits, revised pricing | Duplicate button in Quote History | **~5 min saved** vs rebuilding multi-line spa+cover+install quotes |
| P1-5 | **Copy quote summary** for SMS/email not built in | Field reps texting customers in driveway | Copy Summary button (items + total to clipboard) | **~2 min saved** vs retyping from PDF |
| P1-6 | **Internal margin view** exists but profit not visible during match preview | Sales manager / rep negotiating discount | Keep internal view toggle; show margin on confirmed quote | Better discount decisions; protects **5–15% margin** |
| P1-7 | Preferred price list not restored into active session (React app) | Reps switching devices | Load preferred list data on mount; auto-fetch 2026 list | **~1 min saved** per session |
| P1-8 | Accessory keywords (`onzen`, `spa boy`, `peak`, `smart ph`) not rule-matched | Custom line reps | Dedicated accessory rules in categoryMatcher | **~1 min saved**; fewer missed add-ons |

---

## P2 — Nice-to-have competitive polish

| # | Problem | Who it hurts | Suggested solution | Impact |
|---|---------|--------------|-------------------|--------|
| P2-1 | Quote templates stub only (console.log) | Reps with standard showroom packages | Save named templates from history | **~3 min** on repeat package quotes |
| P2-2 | No customer phone/email on quote PDF | Follow-up / CRM handoff | Optional contact fields on customer record → PDF header | Cleaner handoff to office admin |
| P2-3 | Quote status workflow basic (no sent-date, no reminders) | Manager pipeline review | Sent date + follow-up reminder | Better close-rate tracking |
| P2-4 | Offline mode not supported | Rural field visits without signal | Service worker + cached price list | Field reliability in dead zones |
| P2-5 | No series filter tabs in manual builder (Classic / Core / Custom / Covana) | Power users | Category tabs above manual list | Faster SKU browsing |
| P2-6 | Version diff when re-quoting same customer | Manager audit | Show v1 vs v2 line changes in history | Trust + accountability |
| P2-7 | PandaDoc-style e-sign / pay link | Closing at showroom | Future integration (out of scope now) | Faster close — competitive with generic CRMs |

---

## Friction walkthrough (before fixes)

### 1. Login & daily start
- Demo login works (`admin@example.com` / `password123`) but previously required manual price list upload before quoting.
- **Fixed:** Auto-load 2026 list on login; dashboard shortcut if list missing.

### 2. Price list
- Upload works; preferred list persisted in localStorage.
- Covers were missing from merged list (now added).
- **Fixed:** One-click load on Create Quote + Price Lists pages.

### 3. Quote creation
- Natural language + manual builder both available.
- Multi-item (`spa + cover + onzen + install`) now splits on `with` / `and` / commas with context.
- **Fixed:** Bundle chips + match preview before confirm.

### 4. Customer handling
- Name field + datalist from saved customers.
- **Fixed:** Recent customer chips from quote history.

### 5. Editing & discounts
- 5–25% bulk discount with customer savings summary; internal view shows profit/margin.
- Line-level price edit in edit mode.

### 6. Output
- PDF export with branding, terms, savings summary.
- **Fixed:** Copy summary for quick text/email.

### 7. History & follow-up
- Search by customer; status dropdown on quote.
- **Fixed:** Duplicate quote from history.

### 8. Mobile / field use
- Layout responsive but sidebar was unusable on phone.
- **Fixed:** Hamburger nav + touch-friendly chip/button sizes.

### 9. Accuracy
- Embedding fallback can still mis-match obscure phrases; rule layer handles Arctic Spa patterns first.
- Summit typo in commission sheet (`Signtaure`) preserved in matcher.

### 10. Trust
- Cost/margin visible in internal view only; version increments on edits.
- Match preview adds confidence before customer-facing output.

---

## Implementation status (this sprint)

| Item | Status |
|------|--------|
| P0-1 Covers in price list | Done (merged list; reload button) |
| P0-2 Category matcher | Done (`backend/`, `standalone/`, `frontend/`) |
| P0-3 Auto-load 2026 list | Done (`standalone/index.html`, `App.tsx`) |
| P0-4 Covana + install context | Done |
| P0-5 Mobile nav | Done |
| P0-6 Match preview | Done (standalone) |
| P1-1 Bundle chips | Done (standalone + React) |
| P1-2 Manual search | Done (standalone + React) |
| P1-3 Recent customers | Done (standalone) |
| P1-4 Duplicate quote | Done (standalone + React) |
| P1-5 Copy summary | Done (standalone + React) |
| P1-7 Preferred list restore | Done (React `App.tsx`) |
| P1-8 Accessory rules | Done |
