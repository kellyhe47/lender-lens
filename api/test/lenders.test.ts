import { describe, expect, it } from 'vitest';
import { loadLenders, parseLenders } from '../src/lenders';

/** A minimal valid lender; each test breaks one thing. */
function lender(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Test',
    aprByCreditBand: { A: 5 },
    termMonths: 12,
    rules: [{ type: 'maxAmount', value: 1000, reasonCode: 'DECLINE_AMOUNT' }],
    successReasonCodes: ['OK_AMOUNT'],
    ...overrides,
  };
}

function parse(...lenders: unknown[]) {
  return parseLenders({ lenders });
}

describe('loadLenders', () => {
  it('loads the provided lenders.json in file order', () => {
    const lenders = loadLenders();
    expect(lenders.map((l) => l.name)).toEqual(['Alpha', 'Bravo', 'Charlie']);
    expect(lenders.map((l) => l.termMonths)).toEqual([36, 24, 48]);
    expect(lenders.map((l) => l.rules.length)).toEqual([2, 3, 3]);
  });
});

describe('parseLenders', () => {
  it('accepts a valid lender', () => {
    expect(parse(lender())).toHaveLength(1);
  });

  it('rejects a file with no lenders array', () => {
    expect(() => parseLenders({})).toThrow(/"lenders" must be an array/);
    expect(() => parseLenders(null)).toThrow(/"lenders" must be an array/);
  });

  it('rejects a lender without a name', () => {
    expect(() => parse(lender({ name: '' }))).toThrow(/lender #1.*name/);
  });

  it('rejects APRs that are missing, non-numeric, or for an unknown band', () => {
    expect(() => parse(lender({ aprByCreditBand: undefined }))).toThrow(/"Test".*aprByCreditBand/);
    expect(() => parse(lender({ aprByCreditBand: { A: '5' } }))).toThrow(/"Test".*APR/);
    expect(() => parse(lender({ aprByCreditBand: { E: 5 } }))).toThrow(/"Test".*band "E"/);
  });

  it('rejects a term that is not a positive whole number', () => {
    expect(() => parse(lender({ termMonths: 0 }))).toThrow(/"Test".*termMonths/);
    expect(() => parse(lender({ termMonths: 12.5 }))).toThrow(/"Test".*termMonths/);
  });

  it('rejects an unknown rule type, naming the lender and the type', () => {
    const rules = [{ type: 'minAmount', value: 1, reasonCode: 'DECLINE_AMOUNT' }];
    expect(() => parse(lender({ rules }))).toThrow(/"Test".*unknown rule type "minAmount"/);
  });

  it('rejects a rule whose value has the wrong shape', () => {
    const rules = [{ type: 'maxAmount', value: 'lots', reasonCode: 'DECLINE_AMOUNT' }];
    expect(() => parse(lender({ rules }))).toThrow(/"Test".*maxAmount.*number/);
  });

  it('rejects a rule without a reason code', () => {
    const rules = [{ type: 'maxAmount', value: 1000 }];
    expect(() => parse(lender({ rules }))).toThrow(/"Test".*reasonCode/);
  });

  it('rejects missing success reason codes', () => {
    expect(() => parse(lender({ successReasonCodes: undefined }))).toThrow(
      /"Test".*successReasonCodes/,
    );
  });
});
