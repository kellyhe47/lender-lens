import type { ApprovedOffer, DeclinedOffer, Offer } from './api';

export type SortKey = 'monthlyPayment' | 'apr' | 'totalCost';

/** The sort choices, with the tag shown on the first approved card (FR-F5). */
export const SORT_OPTIONS: { key: SortKey; label: string; tag: string }[] = [
  { key: 'monthlyPayment', label: 'Monthly payment', tag: 'Lowest monthly payment' },
  { key: 'apr', label: 'APR', tag: 'Lowest APR' },
  { key: 'totalCost', label: 'Total cost', tag: 'Lowest total cost' },
];

export interface GroupedOffers {
  approved: ApprovedOffer[];
  declined: DeclinedOffer[];
}

/**
 * Splits offers into approved (sorted ascending by the chosen key) and declined
 * (left in the api's order). Array.sort is stable, so approved offers that tie
 * also keep the api's order.
 */
export function groupOffers(offers: Offer[], sortKey: SortKey): GroupedOffers {
  const approved = offers.filter((offer): offer is ApprovedOffer => offer.approved);
  const declined = offers.filter((offer): offer is DeclinedOffer => !offer.approved);
  approved.sort((a, b) => a[sortKey] - b[sortKey]);
  return { approved, declined };
}
