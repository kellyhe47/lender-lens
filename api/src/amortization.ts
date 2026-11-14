export interface LoanFigures {
  monthlyPayment: number;
  totalInterest: number;
  totalCost: number;
}

/**
 * Standard fixed-rate amortization with monthly compounding (FR-B10):
 *
 *   r = apr / 100 / 12
 *   payment = P·r / (1 − (1 + r)^−n)      (P / n when r is 0)
 *
 * The payment is rounded half-up to the cent, and the totals are derived from
 * that rounded payment: totalCost = payment × n, totalInterest = totalCost − P.
 * A real schedule would adjust the final payment by a few cents; we do not.
 *
 * Money is handled in whole cents internally so the results are exact cent
 * values rather than floats like 2327.8999999999996.
 */
export function amortize(principal: number, aprPercent: number, termMonths: number): LoanFigures {
  const principalCents = Math.round(principal * 100);
  const monthlyRate = aprPercent / 100 / 12;

  const exactPaymentCents =
    monthlyRate === 0
      ? principalCents / termMonths
      : (principalCents * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths));

  // Math.round rounds .5 up, which is half-up for the positive amounts we handle.
  const paymentCents = Math.round(exactPaymentCents);
  const totalCostCents = paymentCents * termMonths;

  return {
    monthlyPayment: paymentCents / 100,
    totalInterest: (totalCostCents - principalCents) / 100,
    totalCost: totalCostCents / 100,
  };
}
