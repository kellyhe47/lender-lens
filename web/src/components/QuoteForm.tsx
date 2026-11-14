import { useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import type { CreditBand } from '../api';
import { caretAfterFormatting, formatAmountText } from '../amountInput';
import type { FieldErrors, FormValues } from '../formValidation';
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

  // The amount is reformatted with thousands separators on every keystroke.
  function handleAmountChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const typedBeforeCaret = input.value.slice(0, input.selectionStart ?? input.value.length);
    const formatted = formatAmountText(input.value);
    let caret = caretAfterFormatting(typedBeforeCaret, formatted);
    // The Delete key on a comma changes nothing (the comma comes straight back),
    // so step over it. Otherwise the caret would be stuck in front of it.
    const pressedDelete = (event.nativeEvent as InputEvent).inputType === 'deleteContentForward';
    if (pressedDelete && formatted === values.amount) caret += 1;
    // Write the text and the caret back now, in the same event. If the text
    // were only corrected on React's re-render, the caret would jump to the end.
    input.value = formatted;
    input.setSelectionRange(caret, caret);
    setField('amount', formatted);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
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
            onChange={handleAmountChange}
            onBlur={() => setValues((current) => ({ ...current, amount: current.amount.replace(/\.$/, '') }))}
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
