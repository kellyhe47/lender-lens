// One place for number formatting, so every figure in the UI reads the same.

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const percent = new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 });

/** 398 -> "$398.00", 14328 -> "$14,328.00" */
export function formatCurrency(value: number): string {
  return currency.format(value);
}

/** 11.9 -> "11.9%", 8 -> "8.0%" */
export function formatPercent(value: number): string {
  return `${percent.format(value)}%`;
}

/** 36 -> "36 months" */
export function formatTerm(months: number): string {
  return `${months} months`;
}
