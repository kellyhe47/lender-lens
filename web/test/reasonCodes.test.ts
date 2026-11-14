import { describe, expect, it } from 'vitest';
import type { QuoteRequest } from '../src/api';
import { explainReasonCode } from '../src/reasonCodes';

const request: QuoteRequest = { amount: 40000, creditBand: 'D', state: 'WA', procedure: 'implants' };

describe('explainReasonCode', () => {
  it('fills decline explanations with the request’s values', () => {
    expect(explainReasonCode('DECLINE_CREDIT', request)).toBe(
      'This lender does not offer financing for credit band D.',
    );
    expect(explainReasonCode('DECLINE_STATE', request)).toBe('This lender does not operate in Washington.');
    expect(explainReasonCode('DECLINE_PROCEDURE', request)).toBe(
      'This lender does not finance implants procedures.',
    );
  });

  it('states the amount reason without revealing the lender’s limit', () => {
    const text = explainReasonCode('DECLINE_AMOUNT', request);
    expect(text).toBe("Requested amount is above this lender's maximum.");
    expect(text).not.toMatch(/\d/);
  });

  it('explains success codes', () => {
    expect(explainReasonCode('OK_AMOUNT', request)).toBe('Amount within limit.');
    expect(explainReasonCode('OK_CREDIT', request)).toBe('Credit band accepted.');
    expect(explainReasonCode('OK_STATE', request)).toBe('Available in state.');
    expect(explainReasonCode('OK_PROCEDURE', request)).toBe('Procedure eligible.');
  });

  it('falls back to the raw code when it is unknown', () => {
    expect(explainReasonCode('DECLINE_INCOME', request)).toBe('DECLINE_INCOME');
    expect(explainReasonCode('toString', request)).toBe('toString');
  });
});
