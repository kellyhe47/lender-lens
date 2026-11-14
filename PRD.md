# PRD: Lender Lens (Financing Offer Engine)

Take-home for Endeavor, Product Engineer (Full-Stack). Source brief: `Take home assessment - Financing Offer Engine.md`.

## 1. Summary

A practice staff member (front desk / treatment coordinator) enters a patient's treatment amount, credit band, state, and procedure, and sees which lenders approve, at what cost, and why the others declined.

Two separate TypeScript services in one repo:

- **api**: Fastify, one endpoint `POST /quote`, rules read from `lenders.json`.
- **web**: Vite + React.

The brief grades "Code clarity and structure", "Correctness and edge-case handling", "API and UI design judgment", and "Ability to explain your decisions". "Design and structure matter more than volume or cleverness."

Beyond the required basics, the app ships four enhancements: sorting, lender comparison, reason-code explanations, and polished styling. None adds an endpoint, and all business logic stays in the api.

## 2. Non-goals

No database, auth, or second endpoint. No amortization schedule table, extra payments or fees, saved quotes, or real lender integration. No mobile-specific design beyond a responsive single column.

## 3. Ground truth: `lenders.json`

| ID | Finding | Consequence |
| --- | --- | --- |
| AUD-1 | No lender defines an APR for band D. Alpha and Charlie decline D via `allowedCreditBands`. Bravo has no credit rule, so D passes every Bravo rule with no APR to quote. | FR-B7 |
| AUD-2 | The brief's example response is illustrative: standard amortization gives Alpha $398.00 (brief shows 398.12), and Bravo is shown declining `general` on procedure, which its rules approve. | Tests use section 6, not the example. |
| AUD-3 | `successReasonCodes` is a static list per lender, one `OK_*` per rule. | FR-B8 |
| AUD-4 | Rule types present are exactly the four the brief names. Max amounts: Alpha 25,000, Bravo 15,000, Charlie 30,000. Terms: 36 / 24 / 48 months. | |
| AUD-5 | Lowest APR, lowest monthly payment, and lowest total cost are usually three different lenders (case G1: Alpha / Charlie / Bravo). | Motivates sorting (FR-F5) and comparison (FR-F9). |

## 4. Backend requirements

### API contract

- **FR-B1** `POST /quote` accepts `{ amount, creditBand, state, procedure }` and returns `200 { offers: Offer[] }`, one offer per lender, in `lenders.json` order. The server does not sort; ordering is a presentation concern.
- **FR-B2** Approved offer: `{ lender, approved: true, apr, termMonths, monthlyPayment, totalInterest, totalCost, reasonCodes }`. Declined offer: `{ lender, approved: false, reasonCodes }` with none of the loan-term keys. Modelled as a TypeScript discriminated union on `approved`.
- **FR-B3** The brief's response body is treated as a sample and extended with `totalInterest` and `totalCost`. All business logic, including every amortization figure, is computed in the api; the frontend only formats, sorts, and subtracts for display.

### Rule evaluation

- **FR-B4** Supported rule types: `maxAmount`, `allowedCreditBands`, `allowedStates`, `disallowedProcedures`. Each is one small pure function in a registry keyed by `type`; adding a rule type is one entry.
- **FR-B5** Every rule is evaluated, with no stopping at the first failure. A declined offer returns every failing rule's `reasonCode`, in rule order, de-duplicated, so staff see every blocker at once.
- **FR-B6** `maxAmount` is inclusive: `amount <= value` passes.
- **FR-B7** Two-step order, always: (1) evaluate every explicit rule; (2) only if all of them pass, look up the APR for the credit band, and if the lender has none, decline with `DECLINE_CREDIT`. The APR check never runs, and never adds a code, when an explicit rule has already failed.
- **FR-B8** Approved offers return the lender's `successReasonCodes` unchanged.
- **FR-B9** `lenders.json` is loaded and schema-validated once at startup: each lender needs a name, APRs by band, a term, and rules of the four supported types. A malformed lender or unknown rule type stops the server from starting, with a clear message, rather than being silently ignored at request time.

### Offer calculation

- **FR-B10** Standard fixed-rate amortization, monthly compounding: `r = apr / 100 / 12`; `payment = P·r / (1 − (1 + r)^−n)`; if `r = 0`, `payment = P / n`. Rounded half-up to cents. `totalCost = monthlyPayment (rounded) × termMonths`; `totalInterest = totalCost − amount`. This ignores the small final-payment adjustment a real schedule would have. Documented in the README.

### Validation and errors

- **FR-B11** Input normalization: `state` and `creditBand` trimmed and upper-cased; `procedure` trimmed and lower-cased.
- **FR-B12** `400` with `{ error: "VALIDATION_ERROR", details: [{ field, message }] }` listing all invalid fields when: `amount` is missing, not a finite number, `<= 0`, or has more than 2 decimal places; `creditBand` is not A–D; `state` is not a real US state/DC code; `procedure` is missing, empty, or over 100 characters.
- **FR-B13** Business outcomes are `200`s, malformed input is `400`. A real state a lender does not serve, band D, and over-max amounts all return `200` with that lender declined.
- **FR-B14** `procedure` is an open string in the api: unknown procedures are valid and only declined where a lender disallows them.
- **FR-B15** Unknown route `404`; unexpected error `500 { error: "INTERNAL_ERROR" }` with no stack trace. CORS allows the web dev origin.

## 5. Frontend requirements

### Input form

Left column on desktop, top on mobile; styled after the two reference screenshots.

- **FR-F1** Fields:
  - **Treatment amount**: text input with `$` prefix and thousands formatting.
  - **Patient's credit band**: four-option segmented control A / B / C / D.
  - **State**: select of 50 states + DC.
  - **Procedure**: type-ahead text input. As the user types, known procedures containing the typed text appear below; the user finishes typing or taps a suggestion. The value is trimmed and lower-cased and must equal a known procedure, otherwise the field shows "Choose a listed procedure" and the form does not submit.
- **FR-F2** Known procedures are a frontend constant, since the one-endpoint constraint rules out fetching them. Each has a display label and a lower-case value sent to the api. Only `implants` is disallowed by any lender; the rest describe the treatment.
  - Dental: `general`, `implants`, `ortho`, `crowns`, `veneers`, `root canal`, `dentures`, `extractions`, `periodontal`, `whitening`
  - Vision: `lasik`, `cataract surgery`, `eye exam`, `glasses`, `contact lenses`
- **FR-F3** Primary button **Get offers**. Client-side validation mirrors FR-B12 and shows inline field errors; the server remains the authority, and a `400` maps `details` back onto fields.

### Results

- **FR-F4** States: **initial** (prompt to enter patient details), **loading** (skeleton cards, button disabled), **results**, **all declined** (message that no lender approved; declined cards still shown with reasons), **error** (network/5xx banner with Retry; inputs preserved). A stale response never overwrites a newer request.
- **FR-F5** **Sorting**: approved lenders are listed first, declined after, under separate headings with counts ("2 approved", "1 declined"). A sort control orders the approved group by Monthly payment (default), APR, or Total cost, all ascending. Declined stay in file order. The first approved card carries a visual tag naming the active sort: "Lowest monthly payment", "Lowest APR", or "Lowest total cost". Sorting happens in the frontend over api values.
- **FR-F6** **Approved card** shows lender, Approved badge, APR, term, monthly payment (largest figure), total interest, total cost, reason codes as chips, and a **donut** of principal vs total interest. The donut has a text equivalent ("$12,000 principal + $2,328 interest = $14,328"). Approved vs declined is carried by badge text and icon as well as color.
- **FR-F7** **Declined card** shows lender, Declined badge, and each reason code with its explanation. No APR, term, payment, or donut.
- **FR-F8** **Reason-code explanations**: every code chip shows the raw code plus a plain-language explanation, as a tooltip on hover/focus and, on declined cards, inline by default. The text is a frontend lookup table, filled with the request's values. Declines state the reason only, not the lender's limit. Unknown codes fall back to the raw code.

  | Code | Explanation |
  | --- | --- |
  | `DECLINE_AMOUNT` | Requested amount is above this lender's maximum. |
  | `DECLINE_CREDIT` | This lender does not offer financing for credit band {band}. |
  | `DECLINE_STATE` | This lender does not operate in {state}. |
  | `DECLINE_PROCEDURE` | This lender does not finance {procedure} procedures. |
  | `OK_AMOUNT` | Amount within limit. |
  | `OK_CREDIT` | Credit band accepted. |
  | `OK_STATE` | Available in state. |
  | `OK_PROCEDURE` | Procedure eligible. |

- **FR-F9** **Comparison**: opt-in, never automatic.
  - A **Compare lenders** button sits by the sort control. It is rendered only when 2 or more lenders are approved.
  - Clicking it enters compare mode: checkboxes appear on approved cards. Exactly two can be selected; with two selected the remaining checkboxes disable. Declined lenders are never selectable.
  - With two selected, a side-by-side panel shows rows for APR, term, monthly payment, total interest, and total cost, highlights the better value in each row, and gives a one-line trade-off summary (e.g. "Charlie is $76.67/mo lower; Alpha costs $1,095.84 less overall").
  - **Done** exits compare mode and hides the checkboxes and panel. A new quote also exits it.
- **FR-F10** **Styling**: clean card layout in the spirit of the reference screenshots, consistent currency and percent formatting (`$398.00`, `11.9%`), keyboard-operable controls, visible focus, responsive down to a single column.

### Structure

- **FR-F11** The web app contains no loan math. Sort comparators and comparison deltas (subtraction of two api values, for display) live in pure functions separate from components. API types mirror the api's `Offer` union.

## 6. Acceptance cases

Computed with the FR-B10 formula; these are the unit-test fixtures. Format: `monthly / total cost / total interest`.

| ID | Request (amount / band / state / procedure) | Alpha | Bravo | Charlie |
| --- | --- | --- | --- | --- |
| G1 | 12000 / B / TX / general | 11.9%, 36 → 398.00 / 14,328.00 / 2,328.00 | 14.9%, 24 → 581.27 / 13,950.48 / 1,950.48 | 12.9%, 48 → 321.33 / 15,423.84 / 3,423.84 |
| G2 | 12000 / B / TX / implants | as G1 | `DECLINE_PROCEDURE` | as G1 |
| G3 | 20000 / A / CA / general | 7.9%, 36 → 625.81 / 22,529.16 / 2,529.16 | `DECLINE_AMOUNT`, `DECLINE_STATE` | 8.9%, 48 → 496.75 / 23,844.00 / 3,844.00 |
| G4 | 12000 / D / TX / general | `DECLINE_CREDIT` | `DECLINE_CREDIT` (FR-B7) | `DECLINE_CREDIT` |
| G5 | 40000 / D / WA / implants | `DECLINE_AMOUNT`, `DECLINE_CREDIT` | `DECLINE_AMOUNT`, `DECLINE_PROCEDURE`, `DECLINE_STATE` | `DECLINE_AMOUNT`, `DECLINE_CREDIT`, `DECLINE_STATE` |
| G6 | 15000 / B / TX / general (boundary) | 497.50 / 17,910.00 / 2,910.00 | 726.59 / 17,438.16 / 2,438.16 | 401.67 / 19,280.16 / 4,280.16 |
| G7 | 15000.01 / B / TX / general | approved | `DECLINE_AMOUNT` | approved |
| G8 | 25000 / C / NY / general | 17.9%, 36 → 902.56 / 32,492.16 / 7,492.16 | `DECLINE_AMOUNT`, `DECLINE_STATE` | 18.9%, 48 → 746.18 / 35,816.64 / 10,816.64 |
| G9 | 12000 / "b" / "tx" / " General " | as G1 (normalization) | as G1 | as G1 |
| G10 | 12000 / B / TX / "sedation" (api only; not in the UI list) | as G1 | as G1 | as G1 |

G5/Bravo: explicit rules already fail, so the FR-B7 APR check never runs and no `DECLINE_CREDIT` is added.

**Validation cases**, all `400` with the offending fields in `details`: `amount` of 0, −5, `"abc"`, missing, 100.999; `creditBand` `"E"` or missing; `state` `"ZZ"` or `"Texas"`; `procedure` `""` or missing; two bad fields at once returns two details.

**UI checks** (manual test plan in the README):

- Each FR-F4 state is reachable; G4 shows the all-declined state.
- G2 shows Bravo under Declined with the explained reason.
- Changing the sort reorders approved cards and updates the "Lowest …" tag.
- The procedure field suggests as you type and rejects an unlisted value.
- Compare is absent with fewer than 2 approved, hidden until the button is clicked, and enforces exactly two.
- Stopping the api shows the error banner; Retry recovers.

## 7. Repo layout and deliverables

```
api/   src/{server,quote,rules,amortization,validation,lenders}.ts  lenders.json  test/
web/   src/{api,procedures,sortOffers,compareOffers,reasonCodes}.ts  src/components/…
README.md
```

- **D1** README: how to run (one command per service, ports), amortization approach, assumptions and shortcuts (AUD-1, AUD-2, FR-B3, FR-B5, FR-B6, FR-B7, FR-B13, FR-F2), what to improve with more time.
- **D2** Unit tests (Vitest): rule functions, amortization, and `POST /quote` via Fastify `inject` for G1–G10 and the validation cases; sort, compare-selection, and procedure-validation logic in web.
- **D3** Short manual test plan for the UI in the README.
