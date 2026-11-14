import { useState } from 'react';
import type { Offer, QuoteRequest } from '../api';
import { isSelectionFull, toggleSelection } from '../compareOffers';
import { formatCurrency } from '../format';
import { groupOffers, SORT_OPTIONS, type SortKey } from '../sortOffers';
import { stateName } from '../states';
import { ApprovedCard } from './ApprovedCard';
import { ComparePanel } from './ComparePanel';
import { DeclinedCard } from './DeclinedCard';

interface Props {
  offers: Offer[];
  /** The request these offers answer. The form may have been edited since. */
  request: QuoteRequest;
  sortKey: SortKey;
  onSortChange: (sortKey: SortKey) => void;
}

/** Approved offers (sortable, comparable) followed by declined ones (FR-F5, FR-F9). */
export function OfferList({ offers, request, sortKey, onSortChange }: Props) {
  const [comparing, setComparing] = useState(false);
  const [selected, setSelected] = useState<string[]>([]); // lender names, at most two

  const { approved, declined } = groupOffers(offers, sortKey);
  const sortTag = SORT_OPTIONS.find((option) => option.key === sortKey)?.tag;
  const [left, right] = approved.filter((offer) => selected.includes(offer.lender));

  function toggleCompareMode() {
    setComparing(!comparing);
    setSelected([]);
  }

  return (
    <>
      <p className="request-summary">
        Offers for {formatCurrency(request.amount)} · credit band {request.creditBand} ·{' '}
        {stateName(request.state)} · {request.procedure}
      </p>

      {approved.length === 0 && (
        <div className="banner banner-notice" role="status">
          <p>
            <strong>No lender approved this request.</strong> Each lender's reasons are listed below.
          </p>
        </div>
      )}

      {approved.length > 0 && (
        <>
          <div className="toolbar">
            <h2>{approved.length} approved</h2>
            <label className="sort-control">
              Sort by
              <select value={sortKey} onChange={(event) => onSortChange(event.target.value as SortKey)}>
                {SORT_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {approved.length >= 2 && (
              <button type="button" className="button" onClick={toggleCompareMode} aria-pressed={comparing}>
                {comparing ? 'Done' : 'Compare lenders'}
              </button>
            )}
          </div>

          {comparing &&
            (left && right ? (
              <ComparePanel left={left} right={right} />
            ) : (
              <p className="compare-hint">Select two lenders to compare.</p>
            ))}

          {approved.map((offer, index) => (
            <ApprovedCard
              key={offer.lender}
              offer={offer}
              request={request}
              tag={index === 0 ? sortTag : undefined}
              compare={
                comparing
                  ? {
                      checked: selected.includes(offer.lender),
                      disabled: isSelectionFull(selected, offer.lender),
                      onToggle: () => setSelected(toggleSelection(selected, offer.lender)),
                    }
                  : undefined
              }
            />
          ))}
        </>
      )}

      {declined.length > 0 && (
        <>
          <h2 className="group-heading">{declined.length} declined</h2>
          {declined.map((offer) => (
            <DeclinedCard key={offer.lender} offer={offer} request={request} />
          ))}
        </>
      )}
    </>
  );
}
