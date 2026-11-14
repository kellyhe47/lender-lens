import type { QuoteRequest } from '../api';
import type { QuoteState } from '../quoteState';
import type { SortKey } from '../sortOffers';
import { OfferList } from './OfferList';

interface Props {
  quote: QuoteState;
  sortKey: SortKey;
  onSortChange: (sortKey: SortKey) => void;
  onRetry: (request: QuoteRequest) => void;
}

/** The right-hand column: one view per quote state (FR-F4). */
export function ResultsPanel({ quote, sortKey, onSortChange, onRetry }: Props) {
  return (
    <section className="results" aria-label="Lender offers" aria-busy={quote.status === 'loading'}>
      {quote.status === 'initial' && (
        <div className="card empty-state">
          <h2>No offers yet</h2>
          <p>Enter the patient's details and select Get offers to see which lenders approve and what each would cost.</p>
        </div>
      )}

      {quote.status === 'loading' && (
        <>
          <p className="sr-only" role="status">
            Getting offers…
          </p>
          <div className="card skeleton-card" />
          <div className="card skeleton-card" />
          <div className="card skeleton-card" />
        </>
      )}

      {quote.status === 'error' && (
        <div className="banner banner-error" role="alert">
          <p>
            <strong>We couldn't reach the quote service.</strong> Your entries are still here. Try again in a moment.
          </p>
          <button type="button" className="button" onClick={() => onRetry(quote.request)}>
            Retry
          </button>
        </div>
      )}

      {quote.status === 'results' && (
        // The key gives every new quote a fresh OfferList, which resets compare mode (FR-F9).
        <OfferList
          key={quote.id}
          offers={quote.offers}
          request={quote.request}
          sortKey={sortKey}
          onSortChange={onSortChange}
        />
      )}
    </section>
  );
}
