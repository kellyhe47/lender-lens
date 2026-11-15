# Manual QA report

```yaml
sha: c90f754
branch: main
tree: dirty      # uncommitted UI changes; this report describes the working tree
launched: web http://localhost:5173 (vite dev), api http://localhost:3001 (tsx watch)
```

Spec: `PRD.md`. Designs: none in the repo (the PRD's reference screenshots are not checked in), so screens were judged against PRD prose. Walked in the app's built-in browser at 1280, 1000, and 375 px wide. Screenshots are in `.qa/screens/` (not tracked).

## Flows walked

| # | Flow | Requirements | Result | Screens |
| --- | --- | --- | --- | --- |
| A | Load, submit empty form | FR-F3, FR-F4 initial | Pass: four inline errors, no request | 01 |
| B | Amount typing: letters, commas, decimals | FR-F1 | Finding 1 | |
| C | Keyboard only: Tab, arrows on band, type-ahead arrows + Enter, Enter submits | FR-F1, FR-F10 | Pass | |
| D | G1 quote: loading, 3 approved, card contents, chip tooltip on hover and focus | FR-F4, FR-F5, FR-F6, FR-F8 | Pass; values match PRD section 6 | 02, 03, 04 |
| E | Sort by APR, then Total cost | FR-F5 | Pass: order and tag change; choice persists across quotes | |
| F | Compare: enter, pick by card click and by keyboard, third blocked, Done, new quote resets | FR-F9 | Findings 2 and 4 | 05, 11 |
| G | G4 all declined; G5 multiple reasons; G3 mixed | FR-F4, FR-F7, FR-F8 | Pass on content; Finding 3 on layout | 06, 07, 10 |
| H | Api stopped: banner, inputs kept, Retry after restart | FR-F4 | Pass | 08 |
| I | 375 px: single column, compare panel, declined card | FR-F10 | Pass: no horizontal scroll | 09 |

Every UI requirement (FR-F1 to FR-F10) is touched by a flow.

## Findings (all fixed and re-verified in the browser)

1. **Amount accepts more than two decimals.** Type `10000000.59912000`: the field shows all eight decimals, and only Submit says "Use at most 2 decimal places". Expected: a money field stops at cents (FR-B12 allows at most 2). Fix: the formatter keeps two digits after the point.
2. **Comparison appears off screen.** G1, Compare lenders, scroll down, pick two cards: nothing visible changes; the panel is above the viewport (`05`). Expected (FR-F9): "With two selected, a side-by-side panel shows". Fix: the panel scrolls into view when it appears (`11`).
3. **Decline explanations do not line up.** G5: each explanation starts wherever its code chip ends (`07`). Fix: two-column grid (`10`); stacked under the code on narrow screens.
4. **Compare checkboxes all have the same name.** Each is announced as "Compare". Fix: hidden lender name, so "Compare Alpha".
5. **Summary line shows the raw api value.** "· root canal" while the form shows "Root canal". Fix: the summary uses the procedure label.

## Observed, not changed

- Between about 861 and 1040 px wide, the donut wraps under the stats on approved cards. Readable and centered; left as is.
- While the suggestion list is open it covers Get offers (documented in the README).

## Escalations (could not drive from the UI)

- A server `400` mapped back onto fields (FR-F3): client validation blocks every bad input first.
- A stale response being dropped (FR-F4): the button is disabled while loading.
- Safari, Firefox, screen readers.
