import type { ApprovedOffer } from './api';
import { formatCurrency, formatPercent, formatTerm } from './format';

// ---- Selection (FR-F9): exactly two lenders can be compared ----

const MAX_COMPARED = 2;

/** Ticking a selected lender removes it; a third lender is ignored. */
export function toggleSelection(selected: string[], lender: string): string[] {
  if (selected.includes(lender)) {
    return selected.filter((name) => name !== lender);
  }
  return selected.length < MAX_COMPARED ? [...selected, lender] : selected;
}

/** True when two other lenders are already selected, so this one's checkbox is disabled. */
export function isSelectionFull(selected: string[], lender: string): boolean {
  return selected.length >= MAX_COMPARED && !selected.includes(lender);
}

// ---- Side-by-side rows ----

export interface ComparisonRow {
  label: string;
  left: string;
  right: string;
  better: 'left' | 'right' | 'tie';
}

type ComparedField = 'apr' | 'termMonths' | 'monthlyPayment' | 'totalInterest' | 'totalCost';

// Lower is better in every row. For term that is a judgment call: a shorter
// term means the patient is debt-free sooner.
const ROWS: { label: string; field: ComparedField; format: (value: number) => string }[] = [
  { label: 'APR', field: 'apr', format: formatPercent },
  { label: 'Term', field: 'termMonths', format: formatTerm },
  { label: 'Monthly payment', field: 'monthlyPayment', format: formatCurrency },
  { label: 'Total interest', field: 'totalInterest', format: formatCurrency },
  { label: 'Total cost', field: 'totalCost', format: formatCurrency },
];

/** The row labels alone, for the empty comparison shown before two lenders are picked. */
export const COMPARISON_LABELS = ROWS.map((row) => row.label);

export function comparisonRows(left: ApprovedOffer, right: ApprovedOffer): ComparisonRow[] {
  return ROWS.map(({ label, field, format }) => ({
    label,
    left: format(left[field]),
    right: format(right[field]),
    better: left[field] === right[field] ? 'tie' : left[field] < right[field] ? 'left' : 'right',
  }));
}

// ---- One-line summary ----

/** e.g. "Charlie is $76.67/mo lower; Alpha costs $1,095.84 less overall" */
export function tradeOffSummary(a: ApprovedOffer, b: ApprovedOffer): string {
  const monthly = lowerOf(a, b, 'monthlyPayment');
  const overall = lowerOf(a, b, 'totalCost');

  if (monthly && overall && monthly.lender === overall.lender) {
    return `${monthly.lender} is ${monthly.saving}/mo lower and costs ${overall.saving} less overall`;
  }
  const monthlyPart = monthly
    ? `${monthly.lender} is ${monthly.saving}/mo lower`
    : 'Monthly payments are the same';
  const overallPart = overall
    ? `${overall.lender} costs ${overall.saving} less overall`
    : 'total cost is the same';
  return `${monthlyPart}; ${overallPart}`;
}

/** Which of two offers is lower on a field, and by how much. Null on a tie. */
function lowerOf(a: ApprovedOffer, b: ApprovedOffer, field: 'monthlyPayment' | 'totalCost') {
  if (a[field] === b[field]) return null;
  const [lower, higher] = a[field] < b[field] ? [a, b] : [b, a];
  // Subtracting two api values for display only; formatting rounds to cents.
  return { lender: lower.lender, saving: formatCurrency(higher[field] - lower[field]) };
}
