import { useEffect, useRef } from 'react';
import type { ApprovedOffer } from '../api';
import { COMPARISON_LABELS, comparisonRows, tradeOffSummary } from '../compareOffers';
import { CheckIcon } from './icons';

interface Props {
  left: ApprovedOffer;
  right: ApprovedOffer;
}

/** Two approved offers side by side, with the better value in each row marked (FR-F9). */
export function ComparePanel({ left, right }: Props) {
  // The panel sits above the cards, so it is often off screen when the second
  // lender is picked further down. Bring it into view when it appears.
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    panel.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  return (
    <section className="card compare-panel" aria-label="Lender comparison" ref={panel}>
      <table>
        <thead>
          <tr>
            <td />
            <th scope="col">{left.lender}</th>
            <th scope="col">{right.lender}</th>
          </tr>
        </thead>
        <tbody>
          {comparisonRows(left, right).map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              <ComparedValue value={row.left} better={row.better === 'left'} />
              <ComparedValue value={row.right} better={row.better === 'right'} />
            </tr>
          ))}
        </tbody>
      </table>
      <p className="compare-summary">{tradeOffSummary(left, right)}</p>
    </section>
  );
}

/**
 * Shown in compare mode until two lenders are picked: the prompt, then the
 * shape of the comparison with its values empty. The table is decoration, so
 * screen readers get only the prompt.
 */
export function ComparePlaceholder() {
  return (
    <section className="card compare-panel compare-placeholder" aria-label="Lender comparison">
      <p className="compare-hint">Select two lenders to compare.</p>
      <table aria-hidden="true">
        <thead>
          <tr>
            <td />
            <th><span className="placeholder-bar" /></th>
            <th><span className="placeholder-bar" /></th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON_LABELS.map((label) => (
            <tr key={label}>
              <th>{label}</th>
              <td><span className="placeholder-bar" /></td>
              <td><span className="placeholder-bar" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

// "Better" is carried by a check mark and hidden text as well as by color.
function ComparedValue({ value, better }: { value: string; better: boolean }) {
  return (
    <td className={better ? 'better' : undefined}>
      {better && <CheckIcon />}
      {value}
      {better && <span className="sr-only"> (better)</span>}
    </td>
  );
}
