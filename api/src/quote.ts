import { amortize } from './amortization';
import type { Lender } from './lenders';
import type { Offer, QuoteRequest } from './types';

/** One offer per lender, in lenders.json order. Sorting is the client's job (FR-B1). */
export function buildQuote(lenders: Lender[], request: QuoteRequest): Offer[] {
  return lenders.map((lender) => quoteLender(lender, request));
}

export function quoteLender(lender: Lender, request: QuoteRequest): Offer {
  // Step 1: evaluate every explicit rule, never stopping at the first failure,
  // so staff see every blocker at once (FR-B5). The Set removes duplicate codes
  // while keeping rule order.
  const failedCodes = lender.rules
    .filter((rule) => !rule.passes(request))
    .map((rule) => rule.reasonCode);

  if (failedCodes.length > 0) {
    return { lender: lender.name, approved: false, reasonCodes: [...new Set(failedCodes)] };
  }

  // Step 2, only when every explicit rule passed: a lender with no APR for the
  // band cannot quote it, which is a credit decline (FR-B7).
  const apr = lender.aprByCreditBand[request.creditBand];
  if (apr === undefined) {
    return { lender: lender.name, approved: false, reasonCodes: ['DECLINE_CREDIT'] };
  }

  return {
    lender: lender.name,
    approved: true,
    apr,
    termMonths: lender.termMonths,
    ...amortize(request.amount, apr, lender.termMonths),
    reasonCodes: lender.successReasonCodes,
  };
}
