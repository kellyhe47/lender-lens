import type { ApprovedOffer, QuoteRequest } from '../api';
import { formatCurrency, formatPercent, formatTerm } from '../format';
import { explainReasonCode } from '../reasonCodes';
import { Donut } from './Donut';
import { CheckIcon } from './icons';
import { ReasonChip } from './ReasonChip';

interface Props {
  offer: ApprovedOffer;
  request: QuoteRequest;
  /** "Lowest monthly payment" etc., on the first card only. */
  tag?: string;
  /** Present only in compare mode. */
  compare?: { checked: boolean; disabled: boolean; onToggle: () => void };
}

export function ApprovedCard({ offer, request, tag, compare }: Props) {
  return (
    <article className="card offer-card offer-approved">
      <header className="offer-header">
        {compare && (
          <label className="compare-check">
            <input
              type="checkbox"
              checked={compare.checked}
              disabled={compare.disabled}
              onChange={compare.onToggle}
            />
            Compare
            {/* So a screen reader hears "Compare Alpha", not three identical "Compare"s. */}
            <span className="sr-only"> {offer.lender}</span>
          </label>
        )}
        <h3>{offer.lender}</h3>
        <span className="badge badge-approved">
          <CheckIcon /> Approved
        </span>
        {tag && <span className="tag">{tag}</span>}
      </header>

      <div className="offer-body">
        <div className="offer-figures">
          <p className="payment">
            <strong>{formatCurrency(offer.monthlyPayment)}</strong> / month
          </p>
          <dl className="stats">
            <Stat label="APR" value={formatPercent(offer.apr)} />
            <Stat label="Term" value={formatTerm(offer.termMonths)} />
            <Stat label="Total interest" value={formatCurrency(offer.totalInterest)} />
            <Stat label="Total cost" value={formatCurrency(offer.totalCost)} />
          </dl>
        </div>
        <Donut principal={request.amount} interest={offer.totalInterest} total={offer.totalCost} />
      </div>

      <ul className="chips" aria-label="Reason codes">
        {offer.reasonCodes.map((code) => (
          <li key={code}>
            <ReasonChip code={code} explanation={explainReasonCode(code, request)} />
          </li>
        ))}
      </ul>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
