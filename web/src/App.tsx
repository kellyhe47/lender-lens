import { useRef, useState } from 'react';
import { fetchQuote, QuoteValidationError, type QuoteRequest } from './api';
import { QuoteForm } from './components/QuoteForm';
import { ResultsPanel } from './components/ResultsPanel';
import { fieldErrorsFromDetails, validateForm, type FieldErrors, type FormValues } from './formValidation';
import type { QuoteState } from './quoteState';
import type { SortKey } from './sortOffers';

export function App() {
  const [quote, setQuote] = useState<QuoteState>({ status: 'initial' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [sortKey, setSortKey] = useState<SortKey>('monthlyPayment');
  const latestRequestId = useRef(0); // lets a slow, superseded response be recognized and dropped

  function handleSubmit(values: FormValues) {
    const result = validateForm(values);
    setFieldErrors(result.ok ? {} : result.errors);
    if (result.ok) getOffers(result.request);
  }

  async function getOffers(request: QuoteRequest) {
    const id = ++latestRequestId.current;
    setQuote({ status: 'loading' });
    try {
      const offers = await fetchQuote(request);
      if (id !== latestRequestId.current) return; // a newer request started; drop this stale response
      setQuote({ status: 'results', id, request, offers });
    } catch (error) {
      if (id !== latestRequestId.current) return;
      // A 400 the form can show goes back onto its fields. Anything else
      // (network failure, 5xx, a 400 about no form field) is the error banner.
      const errors = error instanceof QuoteValidationError ? fieldErrorsFromDetails(error.details) : {};
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setQuote({ status: 'initial' });
      } else {
        setQuote({ status: 'error', request });
      }
    }
  }

  function clearFieldError(field: keyof FormValues) {
    setFieldErrors(({ [field]: _cleared, ...rest }) => rest);
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Lender Lens</h1>
        <p>Compare patient financing offers across lenders.</p>
      </header>
      <main className="layout">
        <QuoteForm
          errors={fieldErrors}
          loading={quote.status === 'loading'}
          onFieldChange={clearFieldError}
          onSubmit={handleSubmit}
        />
        <ResultsPanel quote={quote} sortKey={sortKey} onSortChange={setSortKey} onRetry={getOffers} />
      </main>
    </div>
  );
}
