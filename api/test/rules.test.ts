import { describe, expect, it } from 'vitest';
import { ruleTypes } from '../src/rules';
import type { QuoteRequest } from '../src/types';

const baseRequest: QuoteRequest = {
  amount: 12000,
  creditBand: 'B',
  state: 'TX',
  procedure: 'general',
};

function request(overrides: Partial<QuoteRequest>): QuoteRequest {
  return { ...baseRequest, ...overrides };
}

describe('maxAmount', () => {
  const passes = ruleTypes.maxAmount(15000);

  it('passes below the maximum', () => {
    expect(passes(request({ amount: 14999.99 }))).toBe(true);
  });

  it('is inclusive: an amount equal to the maximum passes (FR-B6)', () => {
    expect(passes(request({ amount: 15000 }))).toBe(true);
  });

  it('fails one cent over the maximum', () => {
    expect(passes(request({ amount: 15000.01 }))).toBe(false);
  });

  it('rejects a non-numeric value at build time', () => {
    expect(() => ruleTypes.maxAmount('15000')).toThrow(/number/);
  });
});

describe('allowedCreditBands', () => {
  const passes = ruleTypes.allowedCreditBands(['A', 'B', 'C']);

  it('passes a listed band', () => {
    expect(passes(request({ creditBand: 'C' }))).toBe(true);
  });

  it('fails an unlisted band', () => {
    expect(passes(request({ creditBand: 'D' }))).toBe(false);
  });

  it('rejects a non-list value at build time', () => {
    expect(() => ruleTypes.allowedCreditBands('ABC')).toThrow(/list of strings/);
  });
});

describe('allowedStates', () => {
  const passes = ruleTypes.allowedStates(['TX', 'FL']);

  it('passes a listed state', () => {
    expect(passes(request({ state: 'FL' }))).toBe(true);
  });

  it('fails an unlisted state', () => {
    expect(passes(request({ state: 'CA' }))).toBe(false);
  });
});

describe('disallowedProcedures', () => {
  const passes = ruleTypes.disallowedProcedures(['implants']);

  it('fails a listed procedure', () => {
    expect(passes(request({ procedure: 'implants' }))).toBe(false);
  });

  it('passes any procedure that is not listed, known or not (FR-B14)', () => {
    expect(passes(request({ procedure: 'general' }))).toBe(true);
    expect(passes(request({ procedure: 'sedation' }))).toBe(true);
  });
});
