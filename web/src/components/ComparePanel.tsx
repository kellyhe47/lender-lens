import type { ApprovedOffer } from '../api';
import { comparisonRows, tradeOffSummary } from '../compareOffers';
import { CheckIcon } from './icons';

interface Props {
  left: ApprovedOffer;
  right: ApprovedOffer;
}

/** Two approved offers side by side, with the better value in each row marked (FR-F9). */
export function ComparePanel({ left, right }: Props) {
  return (
    <section className="card compare-panel" aria-label="Lender comparison">
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
