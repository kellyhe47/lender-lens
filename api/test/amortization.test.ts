import { describe, expect, it } from 'vitest';
import { amortize } from '../src/amortization';

describe('amortize', () => {
  // Fixtures from PRD section 6: [amount, apr, term, monthly, totalCost, totalInterest]
  it.each([
    [12000, 11.9, 36, 398.0, 14328.0, 2328.0], // G1 Alpha
    [12000, 14.9, 24, 581.27, 13950.48, 1950.48], // G1 Bravo
    [12000, 12.9, 48, 321.33, 15423.84, 3423.84], // G1 Charlie
    [20000, 7.9, 36, 625.81, 22529.16, 2529.16], // G3 Alpha
    [20000, 8.9, 48, 496.75, 23844.0, 3844.0], // G3 Charlie
    [15000, 11.9, 36, 497.5, 17910.0, 2910.0], // G6 Alpha
    [15000, 14.9, 24, 726.59, 17438.16, 2438.16], // G6 Bravo
    [15000, 12.9, 48, 401.67, 19280.16, 4280.16], // G6 Charlie
    [25000, 17.9, 36, 902.56, 32492.16, 7492.16], // G8 Alpha
    [25000, 18.9, 48, 746.18, 35816.64, 10816.64], // G8 Charlie
  ])('%d at %d%% over %d months', (amount, apr, term, monthly, totalCost, totalInterest) => {
    expect(amortize(amount, apr, term)).toEqual({
      monthlyPayment: monthly,
      totalCost,
      totalInterest,
    });
  });

  it('divides the principal evenly when the APR is 0', () => {
    expect(amortize(1200, 0, 12)).toEqual({
      monthlyPayment: 100,
      totalCost: 1200,
      totalInterest: 0,
    });
  });

  it('rounds half-up to cents', () => {
    // 100.01 / 2 = 50.005 exactly, which must round up to 50.01
    expect(amortize(100.01, 0, 2).monthlyPayment).toBe(50.01);
  });

  it('derives total cost from the rounded payment, not the exact one', () => {
    // 100 / 3 = 33.333… -> 33.33 x 3 = 99.99, one cent under the principal.
    // This is the final-payment adjustment FR-B10 knowingly ignores.
    expect(amortize(100, 0, 3)).toEqual({
      monthlyPayment: 33.33,
      totalCost: 99.99,
      totalInterest: -0.01,
    });
  });

  it('returns clean cent values with no floating-point noise', () => {
    // Naively, 14328 - 12000.1 = 2327.8999999999996
    expect(amortize(12000.1, 11.9, 36).totalInterest).toBe(2327.9);
  });
});
