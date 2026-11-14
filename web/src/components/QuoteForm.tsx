import { useState, type FormEvent, type ReactNode } from 'react';
import type { CreditBand } from '../api';
import { formatAmountText, type FieldErrors, type FormValues } from '../formValidation';
import { US_STATES } from '../states';
import { ProcedureInput } from './ProcedureInput';

const CREDIT_BANDS: CreditBand[] = ['A', 'B', 'C', 'D'];
const EMPTY_FORM: FormValues = { amount: '', creditBand: '', state: '', procedure: '' };

interface Props {
  errors: FieldErrors;
  loading: boolean;
  onFieldChange: (field: keyof FormValues) => void;
  onSubmit: (values: FormValues) => void;
}

/**
 * The patient-details form. It owns only the raw field values; validation and
 * errors live in App, so client-side and api errors share one path.
 */
export function QuoteForm({ errors, loading, onFieldChange, onSubmit }: Props) {
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);

  function setField<Field extends keyof FormValues>(field: Field, value: FormValues[Field]) {
    setValues((current) => ({ ...current, [field]: value }));
    onFieldChange(field); // editing a field clears its error
  }

  function formatAmount() {
    setValues((current) => ({ ...current, amount: formatAmountText(current.amount) }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    formatAmount(); // Enter submits without leaving the field, so format here too
    onSubmit(values);
  }

  return (
    <form className="card form" onSubmit={handleSubmit} noValidate aria-label="Patient details">
      <h2>Patient details</h2>

      <Field label="Treatment amount" htmlFor="amount" error={errors.amount}>
        <div className="amount-input">
          <span aria-hidden="true">$</span>
          <input
            id="amount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            value={values.amount}
            onChange={(event) => setField('amount', event.target.value)}
            onBlur={formatAmount}
            aria-invalid={errors.amount !== undefined}
            aria-describedby={errors.amount && 'amount-error'}
          />
        </div>
      </Field>

      <fieldset className="field">
        <legend>Patient's credit band</legend>
        <div className="segmented">
          {CREDIT_BANDS.map((band) => (
            <label key={band}>
              <input
                type="radio"
                name="creditBand"
                value={band}
                checked={values.creditBand === band}
                onChange={() => setField('creditBand', band)}
                aria-describedby={errors.creditBand && 'creditBand-error'}
              />
              <span>{band}</span>
            </label>
          ))}
        </div>
        <FieldError id="creditBand-error" message={errors.creditBand} />
      </fieldset>

      <Field label="State" htmlFor="state" error={errors.state}>
        <select
          id="state"
          value={values.state}
          onChange={(event) => setField('state', event.target.value)}
          aria-invalid={errors.state !== undefined}
          aria-describedby={errors.state && 'state-error'}
        >
          <option value="">Select a state</option>
          {US_STATES.map((state) => (
            <option key={state.code} value={state.code}>
              {state.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Procedure" htmlFor="procedure" error={errors.procedure}>
        <ProcedureInput
          id="procedure"
          value={values.procedure}
          onChange={(text) => setField('procedure', text)}
          invalid={errors.procedure !== undefined}
        />
      </Field>

      <button type="submit" className="button button-primary" disabled={loading}>
        {loading ? 'Getting offers…' : 'Get offers'}
      </button>
    </form>
  );
}

function Field(props: { label: string; htmlFor: string; error?: string; children: ReactNode }) {
  return (
    <div className="field">
      <label htmlFor={props.htmlFor}>{props.label}</label>
      {props.children}
      <FieldError id={`${props.htmlFor}-error`} message={props.error} />
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p className="field-error" id={id} role="alert">
      {message}
    </p>
  );
}
