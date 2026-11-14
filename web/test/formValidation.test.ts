import { describe, expect, it } from 'vitest';
import {
  fieldErrorsFromDetails,
  formatAmountText,
  parseAmount,
  validateForm,
  type FormValues,
} from '../src/formValidation';

const valid: FormValues = { amount: '12,000', creditBand: 'B', state: 'TX', procedure: 'General' };

describe('validateForm', () => {
  it('turns valid form values into the api request', () => {
    expect(validateForm(valid)).toEqual({
      ok: true,
      request: { amount: 12000, creditBand: 'B', state: 'TX', procedure: 'general' },
    });
  });

  it('rejects an unlisted procedure with the PRD message', () => {
    expect(validateForm({ ...valid, procedure: 'sedation' })).toEqual({
      ok: false,
      errors: { procedure: 'Choose a listed procedure' },
    });
  });

  it('reports every invalid field at once', () => {
    expect(validateForm({ amount: '', creditBand: '', state: '', procedure: '' })).toEqual({
      ok: false,
      errors: {
        amount: 'Enter a treatment amount',
        creditBand: 'Select a credit band',
        state: 'Select a state',
        procedure: 'Choose a listed procedure',
      },
    });
  });
});

describe('parseAmount', () => {
  it('reads plain and formatted amounts', () => {
    expect(parseAmount('12000')).toBe(12000);
    expect(parseAmount('12,000.50')).toBe(12000.5);
    expect(parseAmount(' $15,000.01 ')).toBe(15000.01);
  });

  it.each([
    ['', 'Enter a treatment amount'],
    ['abc', 'Enter a valid dollar amount'],
    ['-5', 'Enter a valid dollar amount'],
    ['1.2.3', 'Enter a valid dollar amount'],
    ['0', 'Amount must be greater than 0'],
    ['0.00', 'Amount must be greater than 0'],
    ['100.999', 'Use at most 2 decimal places'],
  ])('rejects %j', (text, message) => {
    expect(parseAmount(text)).toBe(message);
  });
});

describe('formatAmountText', () => {
  it('adds thousands separators and keeps typed decimals', () => {
    expect(formatAmountText('12000')).toBe('12,000');
    expect(formatAmountText('1234567.5')).toBe('1,234,567.5');
    expect(formatAmountText('12,000.50')).toBe('12,000.50');
    expect(formatAmountText('500')).toBe('500');
    expect(formatAmountText('12000.')).toBe('12,000'); // a trailing dot is dropped
    expect(formatAmountText('$012000')).toBe('12,000');
  });

  it('leaves text it cannot parse untouched', () => {
    expect(formatAmountText('abc')).toBe('abc');
    expect(formatAmountText('')).toBe('');
  });
});

describe('fieldErrorsFromDetails', () => {
  it('maps api validation details onto form fields', () => {
    const details = [
      { field: 'amount', message: 'amount must be greater than 0' },
      { field: 'state', message: 'state must be a two-letter US state or DC code' },
    ];
    expect(fieldErrorsFromDetails(details)).toEqual({
      amount: 'amount must be greater than 0',
      state: 'state must be a two-letter US state or DC code',
    });
  });

  it('ignores details for fields the form does not have', () => {
    expect(fieldErrorsFromDetails([{ field: 'body', message: 'bad JSON' }])).toEqual({});
  });
});
