# PRD: Lender Lens (Financing Offer Engine)

Take-home for Endeavor, Product Engineer (Full-Stack). Source brief: `Take home assessment - Financing Offer Engine.md`.

**Tags:** `[source]` from the brief or measured from `lenders.json` · `[decided]` Kelly's call · `[proposal]` mine, pending Kelly's approval. Review the `[proposal]` lines.

## 1. Summary

A practice staff member (front desk / treatment coordinator) enters a patient's treatment amount, credit band, state, and procedure, and sees which lenders approve, at what cost, and why the others declined. `[decided: persona]`

Two separate TypeScript services in one repo `[source: separate services]` `[decided: TypeScript both sides]`:

- **api**: Fastify, one endpoint `POST /quote`, rules read from `lenders.json`. `[decided]`
- **web**: Vite + React. `[decided]`

What the brief grades, quoted: "Code clarity and structure", "Correctness and edge-case handling", "API and UI design judgment", "Ability to explain your decisions". "Design and structure matter more than volume or cleverness." `[source]`

### Scope risk

The brief says ~2 hours and "1–2 enhancements"; this PRD ships four (sorting, comparison, reason-code explanations, polished styling) `[decided]`. Preset scenarios are out `[decided]`. To keep that defensible in the walkthrough: no enhancement adds an endpoint, all loan math stays in the api, and every enhancement is a small frontend component. The README says so plainly. `[proposal]`

## 2. Non-goals

No database, no auth, no second endpoint `[source]`. No preset scenarios `[decided]`. No amortization schedule table, no extra payments/fees, no saved quotes, no real lender integration, no mobile-specific design beyond a responsive single column `[proposal]`.

## 3. Ground truth: `lenders.json` audit

| ID | Finding | Consequence |
| --- | --- | --- |
| AUD-1 | No lender defines an APR for band D. Alpha and Charlie decline D via `allowedCreditBands`. **Bravo has no credit rule**, so D passes every Bravo rule with no APR to quote. | FR-B7 |
| AUD-2 | The brief's example response is illustrative, not golden: standard amortization gives Alpha $398.00 (brief shows 398.12), and Bravo is shown declining `general` on procedure, which its rules approve. | Do not test against the example. |
| AUD-3 | `successReasonCodes` is a static list per lender, one `OK_*` per rule. | Returned as-is on approval. |
| AUD-4 | Rule types present: exactly the four the brief names. Max amounts: Alpha 25,000, Bravo 15,000, Charlie 30,000. Terms: 36 / 24 / 48 months. | |
| AUD-5 | Lowest APR, lowest monthly payment, and lowest total cost are usually three different lenders (case G1: Alpha / Charlie / Bravo). | Motivates sorting (FR-F6) and comparison (FR-F8). |

## 4. Backend requirements

### API contract

- **FR-B1** `POST /quote` accepts `{ amount, creditBand, state, procedure }` and returns `200 { offers: Offer[] }`, one offer per lender, in `lenders.json` order. The server does not sort; ordering is a presentation concern. `[source]` + `[proposal: order]`
- **FR-B2** Approved offer: `{ lender, approved: true, apr, termMonths, monthlyPayment, totalInterest, totalCost, reasonCodes }`. Declined offer: `{ lender, approved: false, reasonCodes }` with **none** of the loan-term keys. Modelled as a TypeScript discriminated union on `approved`. `[source]` + `[decided: added fields]` + `[proposal: union]`
- **FR-B3** The brief's response body is a sample, extended where needed. All business logic, including every amortization figure, is computed in the api; the frontend only formats, sorts, and subtracts for display. `[decided]`

### Rule evaluation

- **FR-B4** Supported rule types: `maxAmount`, `allowedCreditBands`, `allowedStates`, `disallowedProcedures`. Each is one small pure function in a registry keyed by `type`; adding a rule type is one entry. `[source]` + `[proposal: registry]`
- **FR-B5** **All** rules are evaluated; a declined offer returns every failing rule's `reasonCode`, in rule order, de-duplicated. No short-circuit, so staff see every blocker at once. `[proposal]` (brief: "one or more reasonCodes")
- **FR-B6** `maxAmount` is inclusive: `amount <= value` passes. `[proposal]`
- **FR-B7** Two-step order, always: (1) evaluate every explicit rule; (2) only if all of them pass, look up the APR for the credit band, and if the lender has none, decline with `DECLINE_CREDIT`. The APR check never runs, and never adds a code, when an explicit rule has already failed. `[decided]` (AUD-1)
- **FR-B8** Approved offers return the lender's `successReasonCodes` unchanged. `[source]`
- **FR-B9** `lenders.json` is loaded and schema-validated once at startup. An unknown rule type or malformed lender fails startup with a clear message, not a request. `[proposal]`

### Offer calculation

- **FR-B10** Standard fixed-rate amortization, monthly compounding: `r = apr / 100 / 12`; `payment = P·r / (1 − (1 + r)^−n)`; if `r = 0`, `payment = P / n`. Rounded half-up to cents. `totalCost = monthlyPayment (rounded) × termMonths`; `totalInterest = totalCost − amount`. This ignores the small final-payment adjustment a real schedule would have. Documented in README. `[source: formula allowed]` + `[proposal: specifics]`

### Validation and errors

- **FR-B11** Input normalization: `state` and `creditBand` trimmed and upper-cased; `procedure` trimmed and lower-cased. `[proposal]`
- **FR-B12** `400` with `{ error: "VALIDATION_ERROR", details: [{ field, message }] }` listing **all** invalid fields when: `amount` missing, not a finite number, `<= 0`, or more than 2 decimal places; `creditBand` not A–D; `state` not a real US state/DC code; `procedure` missing, empty, or over 100 characters. `[source: graceful, status codes]` + `[proposal: shape and limits]`
- **FR-B13** A real state that a lender does not serve is a `200` with that lender declined (`DECLINE_STATE`), not a `400`. Same for band D and over-max amounts: business outcomes are 200s, malformed input is 400. `[proposal]`
- **FR-B14** `procedure` is an open string: unknown procedures are valid and only declined where a lender disallows them. `[source: "string (e.g. …)"]`
- **FR-B15** Unknown route `404`; wrong method `405` or `404` (Fastify default); unexpected error `500 { error: "INTERNAL_ERROR" }` with no stack trace. CORS allows the web dev origin. `[proposal]`

## 5. Frontend requirements

### Input form (left column on desktop, top on mobile; styled after the two reference screenshots)

- **FR-F1** Fields `[source]`, controls `[proposal]`:
  - **Treatment amount**: text input with `$` prefix and thousands formatting.
  - **Patient's credit band**: four-option segmented control A / B / C / D.
  - **State**: select of 50 states + DC.
  - **Procedure**: type-ahead text input `[decided]`. As the user types, matching known procedures appear below; the user finishes typing or taps a suggestion. The value is trimmed and lower-cased, and must equal one of the known procedures or the field shows a validation error ("Choose a listed procedure") and the form does not submit. Known procedures are a frontend constant `[decided]`, because the one-endpoint constraint rules out fetching them. It covers dental and vision so the field feels complete `[decided]`; each entry has a display label and a lower-case value sent to the api `[proposal: exact list]`: Dental: `general`, `implants`, `ortho`, `crowns`, `veneers`, `root canal`, `dentures`, `extractions`, `periodontal`, `whitening`. Vision: `lasik`, `cataract surgery`, `eye exam`, `glasses`, `contact lenses`. Suggestions match on any substring. Only `implants` is disallowed by any lender today; the rest exist to describe the treatment. The api stays open to any procedure string (FR-B14).
- **FR-F2** Primary button **Get offers**. Client-side validation mirrors FR-B12 and shows inline field errors; the server remains the authority, and a `400` maps `details` back onto fields. `[proposal]`
- **FR-F3** *(removed: preset scenarios)* `[decided]`

### Results

- **FR-F4** States `[source: loading, error]`: **initial** (prompt to enter patient details), **loading** (skeleton cards, button disabled), **results**, **all declined** (message that no lender approved, declined cards still shown with reasons), **error** (network/5xx banner with Retry; inputs preserved). A stale response never overwrites a newer request. `[proposal: specifics]`
- **FR-F5** Approved lenders are listed first, declined lenders after, under separate headings with counts ("2 approved", "1 declined"). Distinction is carried by badge text and icon as well as color. `[decided: approved first]` `[source: clear distinction]`
- **FR-F6** **Sorting** (enhancement 1): control over the approved group with Monthly payment (default), APR, Total cost; all ascending. Declined stay in file order. The best value for the active sort gets a "Lowest …" tag `[proposal: tag]`. Sorting happens in the frontend over api-computed values. `[decided: three options, monthly default]`
- **FR-F7** **Approved card** shows lender, Approved badge, APR, term, monthly payment (largest figure), reason codes as chips `[decided: show the brief's fields]`, plus a **donut** of principal vs total interest with total cost labelled `[decided: donut]`, drawn from the api's `totalInterest` and `totalCost`. The donut has a text equivalent ("$12,000 principal + $2,328 interest = $14,328") for accessibility. `[proposal]`
- **FR-F8** **Declined card** shows lender, Declined badge, and each reason code. No APR, term, payment, or donut. `[source]`
- **FR-F9** **Reason codes explainable** (enhancement 3): every code chip shows the raw code plus a plain-language explanation, available on hover/focus as a tooltip and, on declined cards, expanded inline by default. Copy uses the request values where useful. Unknown codes fall back to showing the raw code. `[source: visible or explainable]` `[proposal: copy]`

  | Code | Explanation |
  | --- | --- |
  | `DECLINE_AMOUNT` | Requested amount is above this lender's maximum. |
  | `DECLINE_CREDIT` | This lender does not offer financing for credit band {band}. |
  | `DECLINE_STATE` | This lender does not operate in {state}. |
  | `DECLINE_PROCEDURE` | This lender does not finance {procedure} procedures. |
  | `OK_AMOUNT` / `OK_CREDIT` / `OK_STATE` / `OK_PROCEDURE` | Amount within limit / Credit band accepted / Available in state / Procedure eligible. |

- **FR-F10** **Comparison** (enhancement 2): opt-in, never automatic `[decided]`.
  - A **Compare lenders** button sits by the sort control. It is rendered only when 2 or more lenders are approved. `[decided]`
  - Clicking it enters compare mode: checkboxes appear on approved cards. Exactly two can be selected; with two selected the remaining checkboxes disable. `[decided: compare 2 approved]` `[proposal: interaction]`
  - With two selected, a side-by-side panel shows rows for APR, term, monthly payment, total interest, total cost; the better value in each row is highlighted, with a one-line trade-off summary (e.g. "Charlie is $76.67/mo lower; Alpha costs $1,095.84 less overall"). `[proposal]`
  - **Done** exits compare mode and hides checkboxes and panel. A new quote also exits it. Declined lenders are never selectable. `[proposal]`
- **FR-F11** **Polished styling** (enhancement 4): clean card layout in the spirit of the reference screenshots, consistent currency/percent formatting (`$398.00`, `11.9%`), keyboard-operable controls, visible focus, responsive down to a single column. `[decided: include]`

### Structure

- **FR-F12** The web app contains no loan math. Sort comparators and comparison deltas (subtraction of two api values, for display) live in pure functions separate from components. API types mirror the api's `Offer` union. `[proposal]`

## 6. Acceptance cases

Computed with the FR-B10 formula; these are the unit-test fixtures. Format: `monthly / total cost / total interest`.

| ID | Request (amount / band / state / procedure) | Alpha | Bravo | Charlie |
| --- | --- | --- | --- | --- |
| G1 | 12000 / B / TX / general | 11.9%, 36 → 398.00 / 14,328.00 / 2,328.00 | 14.9%, 24 → 581.27 / 13,950.48 / 1,950.48 | 12.9%, 48 → 321.33 / 15,423.84 / 3,423.84 |
| G2 | 12000 / B / TX / implants | as G1 | `DECLINE_PROCEDURE` | as G1 |
| G3 | 20000 / A / CA / general | 7.9%, 36 → 625.81 / 22,529.16 / 2,529.16 | `DECLINE_AMOUNT`, `DECLINE_STATE` | 8.9%, 48 → 496.75 / 23,844.00 / 3,844.00 |
| G4 | 12000 / D / TX / general | `DECLINE_CREDIT` | `DECLINE_CREDIT` (FR-B7) | `DECLINE_CREDIT` |
| G5 | 40000 / D / WA / implants | `DECLINE_AMOUNT`, `DECLINE_CREDIT` | `DECLINE_AMOUNT`, `DECLINE_PROCEDURE`, `DECLINE_STATE` | `DECLINE_AMOUNT`, `DECLINE_CREDIT`, `DECLINE_STATE` |
| G6 | 15000 / B / TX / general (boundary) | 497.50 | approved, 726.59 | 401.67 |
| G7 | 15000.01 / B / TX / general | approved | `DECLINE_AMOUNT` | approved |
| G8 | 25000 / C / NY / general | 17.9%, 36 → 902.56 | `DECLINE_AMOUNT`, `DECLINE_STATE` | 18.9%, 48 → 746.18 |
| G9 | 12000 / "b" / "tx" / " General " | same as G1 (normalization) | | |

Note on G5/Bravo: explicit rules already fail there, so the FR-B7 APR check never runs and no `DECLINE_CREDIT` is added. `[decided]`

G10 (api only; the UI blocks unlisted procedures): 12000 / B / TX / "veneers" → same as G1; unknown procedures are only declined where disallowed (FR-B14).

Validation cases, all `400` with the offending fields in `details`: `amount` of 0, −5, `"abc"`, missing, 100.999; `creditBand` `"E"` or missing; `state` `"ZZ"` or `"Texas"`; `procedure` `""` or missing; two bad fields at once returns two details.

UI checks (manual test plan in README): each FR-F4 state reachable; G4 shows the all-declined state; G2 shows Bravo under Declined with the explained reason; sort changes order and the "Lowest" tag; compare is absent until the button is clicked, absent entirely with fewer than 2 approved, procedure field rejects an unlisted value, and enforces exactly two; killing the api shows the error banner and Retry recovers.

## 7. Repo layout and deliverables

```
api/   src/{server,quote,rules,amortization,validation,lenders}.ts  lenders.json  test/
web/   src/{api,sortOffers,compareOffers,reasonCodes}.ts  src/components/…
README.md
```

- **D1** README: how to run (one command per service, ports), amortization approach, assumptions and shortcuts (AUD-1/2, FR-B5/6/7/13), what to improve with more time. `[source]`
- **D2** Unit tests (Vitest): rule functions, amortization, `POST /quote` via Fastify `inject` for G1–G10 and validation cases; sort and compare-selection logic in web. `[source: optional but appreciated]` `[proposal: scope]`
- **D3** Short manual test plan for the UI in the README. `[proposal]`

## 8. Decisions log

All proposals are confirmed by Kelly, including: return all failing reason codes (FR-B5); validate `lenders.json` at startup (FR-B9); "Lowest …" tag as a visual cue (FR-F6); reason-code explanation text as a frontend lookup (FR-F9); compare at 2 or more approved, opt-in (FR-F10); declined reasons show the reason only; procedure type-ahead restricted to a frontend constant of dental and vision procedures (FR-F1).

Only remaining `[proposal]`: the exact procedure list in FR-F1.
