import { describe, expect, it } from 'vitest';
import { comparisonRows, isSelectionFull, toggleSelection, tradeOffSummary } from '../src/compareOffers';
import { alpha, bravo, charlie } from './fixtures';

describe('toggleSelection', () => {
  it('adds a lender until two are selected', () => {
    expect(toggleSelection([], 'Alpha')).toEqual(['Alpha']);
    expect(toggleSelection(['Alpha'], 'Charlie')).toEqual(['Alpha', 'Charlie']);
  });

  it('ignores a third lender', () => {
    expect(toggleSelection(['Alpha', 'Charlie'], 'Bravo')).toEqual(['Alpha', 'Charlie']);
  });

  it('removes a lender that is already selected', () => {
    expect(toggleSelection(['Alpha', 'Charlie'], 'Alpha')).toEqual(['Charlie']);
  });
});

describe('isSelectionFull', () => {
  it('is false while fewer than two are selected', () => {
    expect(isSelectionFull([], 'Alpha')).toBe(false);
    expect(isSelectionFull(['Alpha'], 'Bravo')).toBe(false);
  });

  it('is true for the remaining lenders once two are selected', () => {
    expect(isSelectionFull(['Alpha', 'Charlie'], 'Bravo')).toBe(true);
  });

  it('is false for the two selected lenders, so they can be unticked', () => {
    expect(isSelectionFull(['Alpha', 'Charlie'], 'Alpha')).toBe(false);
  });
});

describe('comparisonRows', () => {
  it('formats both sides and marks the lower value as better in each row', () => {
    expect(comparisonRows(alpha, charlie)).toEqual([
      { label: 'APR', left: '11.9%', right: '12.9%', better: 'left' },
      { label: 'Term', left: '36 months', right: '48 months', better: 'left' },
      { label: 'Monthly payment', left: '$398.00', right: '$321.33', better: 'right' },
      { label: 'Total interest', left: '$2,328.00', right: '$3,423.84', better: 'left' },
      { label: 'Total cost', left: '$14,328.00', right: '$15,423.84', better: 'left' },
    ]);
  });

  it('marks equal values as a tie', () => {
    const rows = comparisonRows(alpha, { ...alpha, lender: 'Twin' });
    expect(rows.every((row) => row.better === 'tie')).toBe(true);
  });
});

describe('tradeOffSummary', () => {
  it('names each winner when the two lenders split the trade-off (the PRD example)', () => {
    const expected = 'Charlie is $76.67/mo lower; Alpha costs $1,095.84 less overall';
    expect(tradeOffSummary(alpha, charlie)).toBe(expected);
    expect(tradeOffSummary(charlie, alpha)).toBe(expected); // order does not matter
  });

  it('uses one clause when the same lender wins both', () => {
    const cheaper = { ...alpha, lender: 'Delta', monthlyPayment: 350, totalCost: 12600 };
    expect(tradeOffSummary(alpha, cheaper)).toBe(
      'Delta is $48.00/mo lower and costs $1,728.00 less overall',
    );
  });

  it('says so when a figure is the same', () => {
    expect(tradeOffSummary(alpha, { ...bravo, monthlyPayment: 398 })).toBe(
      'Monthly payments are the same; Bravo costs $377.52 less overall',
    );
    expect(tradeOffSummary(alpha, { ...alpha, lender: 'Twin' })).toBe(
      'Monthly payments are the same; total cost is the same',
    );
  });
});
