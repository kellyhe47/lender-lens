export type CreditBand = 'A' | 'B' | 'C' | 'D';

/** A quote request after validation and normalization (FR-B11). */
export interface QuoteRequest {
  amount: number;
  creditBand: CreditBand;
  /** Upper-case two-letter code, e.g. "TX". */
  state: string;
  /** Lower-case, trimmed. Any string is allowed (FR-B14). */
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

/** A declined offer carries no loan terms at all (FR-B2). */
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
