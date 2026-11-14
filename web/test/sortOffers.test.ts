import { describe, expect, it } from 'vitest';
import { groupOffers, SORT_OPTIONS } from '../src/sortOffers';
import { alpha, bravo, charlie, declined } from './fixtures';

const names = (offers: { lender: string }[]) => offers.map((offer) => offer.lender);

describe('groupOffers', () => {
  const g1 = [alpha, bravo, charlie];

  // AUD-5: in G1 each sort puts a different lender first.
  it('sorts approved offers by monthly payment, ascending', () => {
    expect(names(groupOffers(g1, 'monthlyPayment').approved)).toEqual(['Charlie', 'Alpha', 'Bravo']);
  });

  it('sorts approved offers by APR, ascending', () => {
    expect(names(groupOffers(g1, 'apr').approved)).toEqual(['Alpha', 'Charlie', 'Bravo']);
  });

  it('sorts approved offers by total cost, ascending', () => {
    expect(names(groupOffers(g1, 'totalCost').approved)).toEqual(['Bravo', 'Alpha', 'Charlie']);
  });

  it('separates declined offers and keeps them in api order whatever the sort', () => {
    const offers = [declined('Zulu', 'DECLINE_STATE'), charlie, declined('Bravo', 'DECLINE_AMOUNT'), alpha];
    for (const { key } of SORT_OPTIONS) {
      const { approved, declined: declinedGroup } = groupOffers(offers, key);
      expect(names(declinedGroup)).toEqual(['Zulu', 'Bravo']);
      expect(approved).toHaveLength(2);
    }
  });

  it('keeps api order between approved offers that tie', () => {
    const twin = { ...alpha, lender: 'Twin' };
    expect(names(groupOffers([twin, alpha], 'apr').approved)).toEqual(['Twin', 'Alpha']);
    expect(names(groupOffers([alpha, twin], 'apr').approved)).toEqual(['Alpha', 'Twin']);
  });

  it('handles all declined and does not mutate its input', () => {
    const offers = [declined('Alpha', 'DECLINE_CREDIT'), declined('Bravo', 'DECLINE_CREDIT')];
    expect(groupOffers(offers, 'apr')).toEqual({ approved: [], declined: offers });

    const input = [alpha, bravo, charlie];
    groupOffers(input, 'monthlyPayment');
    expect(names(input)).toEqual(['Alpha', 'Bravo', 'Charlie']);
  });
});

describe('SORT_OPTIONS', () => {
  it('defaults to monthly payment and names each sort for the first-card tag', () => {
    expect(SORT_OPTIONS.map((option) => option.key)).toEqual(['monthlyPayment', 'apr', 'totalCost']);
    expect(SORT_OPTIONS.map((option) => option.tag)).toEqual([
      'Lowest monthly payment',
      'Lowest APR',
      'Lowest total cost',
    ]);
  });
});
