import type { DeclinedOffer, QuoteRequest } from '../api';
import { explainReasonCode } from '../reasonCodes';
import { CrossIcon } from './icons';
import { ReasonChip } from './ReasonChip';

interface Props {
  offer: DeclinedOffer;
  request: QuoteRequest;
}

/** Lender, Declined badge, and every reason with its explanation shown inline (FR-F7, FR-F8). */
export function DeclinedCard({ offer, request }: Props) {
  return (
    <article className="card offer-card offer-declined">
      <header className="offer-header">
        <h3>{offer.lender}</h3>
        <span className="badge badge-declined">
          <CrossIcon /> Declined
        </span>
      </header>
      <ul className="decline-reasons">
        {offer.reasonCodes.map((code) => {
          const explanation = explainReasonCode(code, request);
          return (
            <li key={code}>
              <ReasonChip code={code} explanation={explanation} declined />
              {/* An unknown code explains as itself; do not print it twice. */}
              {explanation !== code && <span>{explanation}</span>}
            </li>
          );
        })}
      </ul>
    </article>
  );
}
