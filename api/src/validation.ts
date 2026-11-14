import type { CreditBand, FieldError, QuoteRequest } from './types';

export type ValidationResult =
  | { ok: true; request: QuoteRequest }
  | { ok: false; details: FieldError[] };

const CREDIT_BANDS: readonly string[] = ['A', 'B', 'C', 'D'];
const MAX_PROCEDURE_LENGTH = 100;

// 50 states + DC
const US_STATES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI', 'ID',
  'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO',
  'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA',
  'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
]);

/**
 * Normalizes (FR-B11) and validates (FR-B12) a request body. Every field is
 * checked, so the caller gets all problems at once rather than one per attempt.
 * This only rejects malformed input; whether a lender accepts a well-formed
 * request is a business outcome, decided by the rules (FR-B13).
 */
export function validateQuoteRequest(body: unknown): ValidationResult {
  const input = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  const details: FieldError[] = [];

  // Strict: a JSON number only. "12000" as a string is rejected, not coerced.
  const amount = input.amount;
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    details.push({ field: 'amount', message: 'amount must be a number' });
  } else if (amount <= 0) {
    details.push({ field: 'amount', message: 'amount must be greater than 0' });
  } else if (Number(amount.toFixed(2)) !== amount) {
    details.push({ field: 'amount', message: 'amount must have at most 2 decimal places' });
  }

  const creditBand = typeof input.creditBand === 'string' ? input.creditBand.trim().toUpperCase() : '';
  if (!CREDIT_BANDS.includes(creditBand)) {
    details.push({ field: 'creditBand', message: 'creditBand must be one of A, B, C, D' });
  }

  const state = typeof input.state === 'string' ? input.state.trim().toUpperCase() : '';
  if (!US_STATES.has(state)) {
    details.push({ field: 'state', message: 'state must be a two-letter US state or DC code' });
  }

  const procedure = typeof input.procedure === 'string' ? input.procedure.trim().toLowerCase() : '';
  if (procedure === '') {
    details.push({ field: 'procedure', message: 'procedure is required' });
  } else if (procedure.length > MAX_PROCEDURE_LENGTH) {
    details.push({
      field: 'procedure',
      message: `procedure must be at most ${MAX_PROCEDURE_LENGTH} characters`,
    });
  }

  if (details.length > 0) {
    return { ok: false, details };
  }
  return {
    ok: true,
    request: { amount: amount as number, creditBand: creditBand as CreditBand, state, procedure },
  };
}
