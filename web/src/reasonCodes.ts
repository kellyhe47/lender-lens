import type { QuoteRequest } from './api';
import { stateName } from './states';

/**
 * Plain-language text for each reason code (FR-F8), filled in with the values
 * of the request that produced the offer. Declines say why, never the lender's
 * actual limit.
 */
const EXPLANATIONS: Record<string, (request: QuoteRequest) => string> = {
  DECLINE_AMOUNT: () => "Requested amount is above this lender's maximum.",
  DECLINE_CREDIT: (request) =>
    `This lender does not offer financing for credit band ${request.creditBand}.`,
  DECLINE_STATE: (request) => `This lender does not operate in ${stateName(request.state)}.`,
  DECLINE_PROCEDURE: (request) => `This lender does not finance ${request.procedure} procedures.`,
  OK_AMOUNT: () => 'Amount within limit.',
  OK_CREDIT: () => 'Credit band accepted.',
  OK_STATE: () => 'Available in state.',
  OK_PROCEDURE: () => 'Procedure eligible.',
};

/** A code the UI does not know yet is shown as the raw code. */
export function explainReasonCode(code: string, request: QuoteRequest): string {
  const explain = Object.hasOwn(EXPLANATIONS, code) ? EXPLANATIONS[code] : undefined;
  return explain ? explain(request) : code;
}
