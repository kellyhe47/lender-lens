// Formatting for the treatment amount field as the user types. Display only:
// turning the text into a number, and rejecting bad input, is formValidation's job.

/**
 * Formats typed text as a dollar amount: digits with thousands separators and
 * at most one decimal point. Anything else is dropped, so "$12000.5" becomes
 * "12,000.5". A trailing "." is kept, because the user may be about to type cents.
 */
export function formatAmountText(text: string): string {
  const cleaned = text.replace(/[^\d.]/g, '');
  const dot = cleaned.indexOf('.');
  const whole = dot === -1 ? cleaned : cleaned.slice(0, dot);
  // BigInt, so a very long number is grouped exactly and leading zeros go.
  const grouped = whole === '' ? '' : BigInt(whole).toLocaleString('en-US');
  if (dot === -1) return grouped;
  const decimals = cleaned.slice(dot + 1).replace(/\./g, '');
  return `${grouped}.${decimals}`;
}

/**
 * Formatting adds and removes commas, which would move the caret. This returns
 * where the caret belongs in the formatted text: after the same number of
 * digits (and the decimal point) as it was after in the text the user typed.
 */
export function caretAfterFormatting(typedBeforeCaret: string, formatted: string): number {
  const digitsBeforeCaret = typedBeforeCaret.replace(/[^\d.]/g, '').length;
  let digitsSeen = 0;
  for (let index = 0; index < formatted.length; index++) {
    if (digitsSeen === digitsBeforeCaret) return index;
    if (formatted[index] !== ',') digitsSeen++;
  }
  return formatted.length;
}
