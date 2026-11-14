import type { Offer, QuoteRequest } from './api';

/**
 * The states of the results area (FR-F4). "All declined" is not a separate
 * status: it is `results` with no approved offer. `results` and `error` keep
 * the request they belong to, because the form may have been edited since.
 */
export type QuoteState =
  | { status: 'initial' }
  | { status: 'loading' }
  | { status: 'results'; id: number; request: QuoteRequest; offers: Offer[] }
  | { status: 'error'; request: QuoteRequest };
