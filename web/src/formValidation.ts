import type { CreditBand, FieldError, QuoteRequest } from './api';
import { resolveProcedure } from './procedures';

/** The form's raw values, exactly as typed or selected. */
export interface FormValues {
  amount: string;
  creditBand: CreditBand | '';
  state: string;
  procedure: string;
}

export type FieldErrors = Partial<Record<keyof FormValues, string>>;

export type FormResult = { ok: true; request: QuoteRequest } | { ok: false; errors: FieldErrors };

/**
 * Client-side checks that mirror the api's (FR-F3), so most mistakes are caught
 * without a round trip. The api still validates everything itself. The one
 * rule that exists only here is that the procedure must be a listed one.
 */
export function validateForm(values: FormValues): FormResult {
  const errors: FieldErrors = {};

  const amount = parseAmount(values.amount);
  if (typeof amount === 'string') errors.amount = amount;

  if (values.creditBand === '') errors.creditBand = 'Select a credit band';
  if (values.state === '') errors.state = 'Select a state';

  const procedure = resolveProcedure(values.procedure);
  if (procedure === null) errors.procedure = 'Choose a listed procedure';

  if (typeof amount === 'string' || values.creditBand === '' || values.state === '' || procedure === null) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    request: { amount, creditBand: values.creditBand, state: values.state, procedure },
  };
}

/** Returns the amount as a number, or an error message for the field. */
export function parseAmount(text: string): number | string {
  const cleaned = text.replace(/[$,\s]/g, '');
  if (cleaned === '') return 'Enter a treatment amount';
  if (!/^(\d+\.?\d*|\.\d+)$/.test(cleaned)) return 'Enter a valid dollar amount'; // 12000, 12000.5, .5
  const decimals = cleaned.split('.')[1] ?? '';
  if (decimals.length > 2) return 'Use at most 2 decimal places';
  const amount = Number(cleaned);
  if (amount <= 0) return 'Amount must be greater than 0';
  return amount;
}

const FORM_FIELDS: readonly string[] = ['amount', 'creditBand', 'state', 'procedure'];

/** Maps the `details` of an api 400 back onto form fields (FR-F3). */
export function fieldErrorsFromDetails(details: FieldError[]): FieldErrors {
  const errors: FieldErrors = {};
  for (const { field, message } of details) {
    if (FORM_FIELDS.includes(field)) {
      errors[field as keyof FormValues] = message;
    }
  }
  return errors;
}
