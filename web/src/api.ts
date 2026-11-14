// These types mirror the api's (api/src/types.ts). The two services share no
// code, so a change to the contract must be made in both places.

export type CreditBand = 'A' | 'B' | 'C' | 'D';

export interface QuoteRequest {
  amount: number;
  creditBand: CreditBand;
  state: string;
  procedure: string;
}

export interface ApprovedOffer {
  lender: string;
  approved: true;
  apr: number;
  termMonths: number;
  monthlyPayment: number;
  totalInterest: number;
  totalCost: number;
  reasonCodes: string[];
}

export interface DeclinedOffer {
  lender: string;
  approved: false;
  reasonCodes: string[];
}

export type Offer = ApprovedOffer | DeclinedOffer;

export interface FieldError {
  field: string;
  message: string;
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

/** The api rejected the input (400). `details` says which fields and why. */
export class QuoteValidationError extends Error {
  constructor(public details: FieldError[]) {
    super('The quote request was invalid');
  }
}

/**
 * Asks the api for one offer per lender. Throws QuoteValidationError on a 400,
 * and a plain Error on a network failure or any other status.
 */
export async function fetchQuote(request: QuoteRequest): Promise<Offer[]> {
  const response = await fetch(`${API_URL}/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (response.status === 400) {
    const body: { details: FieldError[] } = await response.json();
    throw new QuoteValidationError(body.details);
  }
  if (!response.ok) {
    throw new Error(`Quote service responded with ${response.status}`);
  }
  const body: { offers: Offer[] } = await response.json();
  return body.offers;
}
