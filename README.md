# Lender Lens

A practice staff member enters a patient's treatment amount, credit band, state, and procedure, and sees which lenders approve, at what cost, and why the others declined.

Two separate TypeScript services in one repo:

- `api/`: Fastify. One endpoint, `POST /quote`. Lender rules are read from `api/lenders.json` at startup.
- `web/`: Vite + React. Calls the api; contains no business logic.

The full spec is in [PRD.md](PRD.md). Requirement IDs below (FR-B7, AUD-1, G4 and so on) refer to it.

## How to run

Requires Node 22.12 or later (the test runner, Vitest 5, needs it). Each service is its own package; run them in two terminals.

```bash
cd api && npm install && npm run dev
```

```bash
cd web && npm install && npm run dev
```

| Service | URL | Notes |
| --- | --- | --- |
| api | http://localhost:3001 | `PORT` changes the port. |
| web | http://localhost:5173 | Open this in the browser. `VITE_API_URL` points it at a different api. |

The api allows cross-origin requests from `http://localhost:5173` only (`WEB_ORIGIN` changes it). Two consequences: open the app at `localhost`, not `127.0.0.1`, and the web dev server is set to fail if port 5173 is taken instead of quietly moving to 5174, where every request would be refused.

Tests and type checks, in either package:

```bash
npm test
```

```bash
npm run typecheck
```

Try the api directly:

```bash
curl -s -X POST http://localhost:3001/quote -H 'Content-Type: application/json' -d '{"amount":12000,"creditBand":"B","state":"TX","procedure":"general"}'
```

## Where things are

```
api/
  lenders.json        provided lender rules; not modified
  src/main.ts         entry point: load lenders, start listening
  src/server.ts       the Fastify app: POST /quote, 404, error handling, CORS
  src/validation.ts   normalizes and validates the request body
  src/lenders.ts      loads and schema-validates lenders.json
  src/rules.ts        the rule registry: one entry per rule type
  src/quote.ts        evaluates a lender's rules and builds its offer
  src/amortization.ts the loan math
  src/types.ts        QuoteRequest and the Offer union
  test/               unit tests, and G1–G10 + validation through Fastify inject
web/
  src/api.ts            fetch wrapper and types mirroring the api
  src/procedures.ts     known-procedure list, suggestions, validation
  src/formValidation.ts client-side checks mirroring the api's
  src/sortOffers.ts     approved/declined grouping and sorting
  src/compareOffers.ts  compare selection, side-by-side rows, summary line
  src/reasonCodes.ts    reason code -> plain-language text
  src/format.ts         currency / percent / term formatting
  src/components/       React components; no logic beyond wiring
  test/                 unit tests for the modules above
```

## The api

`POST /quote` with `{ amount, creditBand, state, procedure }` returns `200 { offers }`: one offer per lender, in `lenders.json` order.

```jsonc
// approved
{ "lender": "Alpha", "approved": true, "apr": 11.9, "termMonths": 36,
  "monthlyPayment": 398, "totalInterest": 2328, "totalCost": 14328,
  "reasonCodes": ["OK_AMOUNT", "OK_CREDIT"] }
// declined: no loan-term keys at all
{ "lender": "Bravo", "approved": false, "reasonCodes": ["DECLINE_PROCEDURE"] }
```

Malformed input returns `400 { error: "VALIDATION_ERROR", details: [{ field, message }] }` listing every invalid field. An unknown route is `404 { error: "NOT_FOUND" }`. An unexpected failure is `500 { error: "INTERNAL_ERROR" }` with the detail logged, not returned.

How a quote is built for each lender (`api/src/quote.ts`):

1. Evaluate every explicit rule. If any fail, decline with every failing rule's reason code, in rule order, de-duplicated.
2. Only if all rules pass, look up the APR for the credit band. If the lender has none, decline with `DECLINE_CREDIT`.
3. Otherwise approve: amortize, and return the lender's `successReasonCodes` unchanged.

Rules are a registry keyed by rule type (`api/src/rules.ts`). Each entry takes the rule's `value` from the file, checks its shape, and returns a function that answers "does this request pass?". Supporting a new rule type is one new entry. Because the value is checked when the registry entry runs, at load time, a malformed rule or unknown rule type stops the server from starting with a message such as:

```
Cannot start: Invalid lenders.json: lender "Bravo": rule #3: unknown rule type "allowedPlanets"
```

## Amortization approach

Standard fixed-rate amortization with monthly compounding (`api/src/amortization.ts`):

```
r        = apr / 100 / 12
payment  = P · r / (1 − (1 + r)^−n)        (P / n when r = 0)
```

- The payment is rounded half-up to the cent.
- `totalCost = rounded payment × termMonths` and `totalInterest = totalCost − amount`. Totals are derived from the rounded payment because that is what the patient actually pays each month.
- This ignores the final-payment adjustment of a real schedule, where the last payment differs by a few cents so the balance lands exactly on zero.
- The function works in whole cents internally. Amounts arrive with at most two decimal places, so converting to cents is exact, and the results are clean cent values rather than floats like `2327.8999999999996`.

All of these figures are computed in the api. The web app never recomputes one.

## Assumptions and shortcuts

From the PRD:

- **Band D and Bravo (AUD-1, FR-B7).** No lender has an APR for band D. Alpha and Charlie decline D through their `allowedCreditBands` rule. Bravo has no credit rule, so D passes all of Bravo's rules with no rate to quote. That is treated as a credit decline (`DECLINE_CREDIT`), but only as a second step after every explicit rule has passed. If an explicit rule has already failed, the APR check does not run and adds no code (case G5: Bravo's codes are amount, procedure, state, and not credit).
- **The brief's example response is illustrative (AUD-2).** It shows Alpha at 398.12 where the formula gives 398.00, and Bravo declining `general` on procedure, which its rules allow. Tests use the PRD's section 6 table, not the example.
- **Extended response (FR-B3).** Offers carry `totalInterest` and `totalCost` in addition to the brief's fields, so the UI has nothing to calculate.
- **All failing rules are returned (FR-B5).** Evaluation does not stop at the first failure; staff see every blocker at once.
- **`maxAmount` is inclusive (FR-B6).** 15,000 passes a 15,000 maximum; 15,000.01 does not (cases G6, G7).
- **Business outcomes are 200s (FR-B13).** A real state the lender does not serve, band D, and an over-limit amount are valid requests that some lender declines. Only malformed input is a 400.
- **The procedure list lives in the frontend (FR-F2).** With one endpoint, there is nowhere to fetch it from. The api accepts any procedure string and declines only where a lender disallows it (case G10, `sedation`); the UI limits staff to the known list. The asymmetry is deliberate.

Decisions I made where the PRD was silent:

- **`amount` must be a JSON number.** `"12000"` as a string is a 400 rather than being coerced.
- **Requests Fastify rejects before the route runs** (body is not valid JSON, for example) keep Fastify's 4xx status and use the same `VALIDATION_ERROR` shape, with `field: "body"`.
- **`lenders.json` values are compared as written.** Requests are normalized; the file is assumed to already use upper-case states and bands and lower-case procedures, as the provided file does.
- **No upper or lower limit on `amount` beyond "greater than 0".** Every provided lender has a `maxAmount`, so a huge amount is simply declined. At the other end, an amount of a few cents is approved with a payment that rounds to `$0.00` and total interest of `-$0.01`: that is the FR-B10 formula applied faithfully, and a real lender would have a minimum loan amount. No such rule is in the provided file, so none was invented.
- **In the comparison, a shorter term counts as the better value.** The PRD asks for a better value in every row; for term that is a judgment call (debt-free sooner), and the summary line states the real trade-off.
- **The donut's text uses the same two-decimal currency format as everything else** (`$12,000.00 principal + $2,328.00 interest = $14,328.00`), favoring FR-F10's consistency over the whole-dollar example in FR-F6.
- **Decline explanations use the state's name** ("does not operate in Washington") rather than its code.
- **Reason text and the summary line above results use the request that produced them,** not the current form values, which may have been edited since.
- **The amount is formatted with thousands separators when the field loses focus or the form is submitted,** not on each keystroke. Reformatting while typing moves the caret when editing mid-number.
- **Suggestions appear on focus as well as while typing,** so staff can browse the list. The list hides once the text is a listed procedure or matches nothing, because it overlays the Get offers button.
- **A field's error clears when that field is edited.** The sort choice persists across quotes; compare mode does not (FR-F9).
- **The stale-response guard is defensive.** The button is disabled while loading, so the UI cannot normally send overlapping requests; the guard (a request counter in `App.tsx`) makes that a guarantee rather than a side effect of the button state.
- **The web app's only arithmetic** is the sort comparator, the subtraction of two api values for the comparison summary, and the interest's share of the donut ring for drawing.
- **Extra files beyond the PRD's layout sketch:** `api/src/main.ts` (so tests can build the server without listening) and `types.ts`; `web/src/format.ts`, `states.ts`, `formValidation.ts`, `quoteState.ts`.
- **The Offer types are written out in both services.** They share no code, so a contract change has to be made twice.

## With more time

- Share the request/response contract between the services (a small shared package or a generated OpenAPI client) instead of mirroring the types by hand.
- Add component tests and an in-repo end-to-end test. Today the UI is covered by unit tests on its logic plus the manual plan below.
- Model a real schedule: adjust the final payment so the balance reaches exactly zero, and send money as integer cents on the wire.
- Serve the procedure list from the api once more than one endpoint is allowed, so the UI and the lender rules cannot drift.
- Format the amount as the user types, with caret handling.
- Give the web request a timeout, and distinguish "service unreachable" from "service returned an error" in the banner.
- Production concerns left out on purpose: request logging with correlation IDs, rate limiting, a health check, a build step and container for the api.
- A screen-reader pass. Controls are keyboard-operable with visible focus, and state is never carried by color alone, but I have not tested with assistive technology.

## Manual test plan

Start both services, then open http://localhost:5173.

| # | Do this | Expect |
| --- | --- | --- |
| 1 | Load the page. | "No offers yet" prompt on the right. No cards. |
| 2 | Select **Get offers** with the form empty. | Four inline errors, one per field. No request is sent. |
| 3 | Type `12000` in the amount and tab out. | The field shows `12,000`. Its error clears. |
| 4 | In Procedure, type `ca`. | Suggestions "Root canal" and "Cataract surgery" appear below. Arrow keys highlight; Enter or a click picks one. |
| 5 | Type `sedation` in Procedure and submit. | "Choose a listed procedure". No request is sent. |
| 6 | **G1:** 12000 / B / Texas / General, submit. | Skeleton cards and a disabled "Getting offers…" button, briefly. Then "3 approved": Charlie $321.33, Alpha $398.00, Bravo $581.27, in that order. Charlie is tagged "Lowest monthly payment". Each card has an Approved badge with a check mark, APR, term, total interest, total cost, a donut with its text line, and `OK_*` chips. No "declined" heading. |
| 7 | Hover an `OK_*` chip, then Tab to one. | A tooltip with the explanation, for example "Amount within limit." |
| 8 | Change **Sort by** to APR, then Total cost. | APR: Alpha, Charlie, Bravo, tag "Lowest APR". Total cost: Bravo, Alpha, Charlie, tag "Lowest total cost". |
| 9 | Look for checkboxes, then select **Compare lenders**. | No checkboxes or panel before the click. After it, a checkbox on each approved card and "Select two lenders to compare." |
| 10 | Tick Alpha and Charlie. | Bravo's checkbox disables. A panel shows APR, term, monthly payment, total interest, total cost side by side, the better value in each row marked with a check, and "Charlie is $76.67/mo lower; Alpha costs $1,095.84 less overall". |
| 11 | Untick one, tick another; then select **Done**. | The panel follows the selection. Done removes the checkboxes and the panel. |
| 12 | Enter compare mode, tick two, then submit the form again. | The new results are not in compare mode. |
| 13 | **G2:** change Procedure to Implants, submit. | "2 approved", then "1 declined": Bravo, with a Declined badge and cross, `DECLINE_PROCEDURE`, and "This lender does not finance implants procedures." No payment, APR, or donut on that card. In compare mode Bravo has no checkbox. |
| 14 | 12000 / B / Washington / General. | "1 approved" (Alpha), "2 declined". No **Compare lenders** button. |
| 15 | **G4:** 12000 / D / Texas / General. | "No lender approved this request." and "3 declined", each with the credit band explanation. No sort control, no Compare button. |
| 16 | **G5:** 40000 / D / Washington / Implants. | Alpha: amount, credit. Bravo: amount, procedure, state (no credit). Charlie: amount, credit, state. No lender limit is shown anywhere. |
| 17 | Stop the api (Ctrl+C), then submit. | A red banner, "We couldn't reach the quote service.", with **Retry**. The form keeps its values. |
| 18 | Start the api again, select **Retry**. | Results appear; the banner is gone. |
| 19 | Complete and submit the form using only the keyboard. | Tab reaches every control, arrow keys change the credit band, focus is always visible. |
| 20 | Narrow the window below about 860px. | One column: form on top, results below. No horizontal scrolling. |
