import type { ApprovedOffer, DeclinedOffer } from '../src/api';

// The api's response for acceptance case G1 (12000 / B / TX / general).
export const alpha: ApprovedOffer = {
  lender: 'Alpha',
  approved: true,
  apr: 11.9,
  termMonths: 36,
  monthlyPayment: 398.0,
  totalInterest: 2328.0,
  totalCost: 14328.0,
  reasonCodes: ['OK_AMOUNT', 'OK_CREDIT'],
};

export const bravo: ApprovedOffer = {
  lender: 'Bravo',
  approved: true,
  apr: 14.9,
  termMonths: 24,
  monthlyPayment: 581.27,
  totalInterest: 1950.48,
  totalCost: 13950.48,
  reasonCodes: ['OK_AMOUNT', 'OK_PROCEDURE', 'OK_STATE'],
};

export const charlie: ApprovedOffer = {
  lender: 'Charlie',
  approved: true,
  apr: 12.9,
  termMonths: 48,
  monthlyPayment: 321.33,
  totalInterest: 3423.84,
  totalCost: 15423.84,
  reasonCodes: ['OK_AMOUNT', 'OK_CREDIT', 'OK_STATE'],
};

export function declined(lender: string, ...reasonCodes: string[]): DeclinedOffer {
  return { lender, approved: false, reasonCodes };
}
