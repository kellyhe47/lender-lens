import { describe, expect, it } from 'vitest';
import { PROCEDURES, procedureLabel, resolveProcedure, suggestProcedures } from '../src/procedures';

describe('PROCEDURES', () => {
  it('lists the 10 dental and 5 vision procedures from the PRD', () => {
    expect(PROCEDURES.filter((p) => p.category === 'Dental')).toHaveLength(10);
    expect(PROCEDURES.filter((p) => p.category === 'Vision')).toHaveLength(5);
  });

  it('sends lower-case values, each the lower-cased form of its label', () => {
    // resolveProcedure relies on this: picking a suggestion fills in the label.
    for (const procedure of PROCEDURES) {
      expect(procedure.label.toLowerCase()).toBe(procedure.value);
    }
  });
});

describe('procedureLabel', () => {
  it('returns the display label for a listed value', () => {
    expect(procedureLabel('root canal')).toBe('Root canal');
    expect(procedureLabel('lasik')).toBe('LASIK');
  });

  it('falls back to the value itself when it is not listed', () => {
    expect(procedureLabel('sedation')).toBe('sedation');
  });
});

describe('suggestProcedures', () => {
  const values = (text: string) => suggestProcedures(text).map((p) => p.value);

  it('returns procedures containing the typed text, anywhere in the name', () => {
    expect(values('cr')).toEqual(['crowns']);
    expect(values('ex')).toEqual(['extractions', 'eye exam']);
  });

  it('ignores case and surrounding spaces', () => {
    expect(values('  LAS ')).toEqual(['lasik', 'glasses']); // "glasses" contains "las"
  });

  it('returns every procedure for empty text and none for no match', () => {
    expect(values('')).toHaveLength(PROCEDURES.length);
    expect(values('sedation')).toEqual([]);
  });
});

describe('resolveProcedure', () => {
  it('accepts a listed procedure as its api value', () => {
    expect(resolveProcedure('general')).toBe('general');
    expect(resolveProcedure('root canal')).toBe('root canal');
  });

  it('trims and lower-cases what was typed, so a tapped label resolves too', () => {
    expect(resolveProcedure('  General ')).toBe('general');
    expect(resolveProcedure('LASIK')).toBe('lasik');
    expect(resolveProcedure('Cataract surgery')).toBe('cataract surgery');
  });

  it('rejects unlisted, partial, and empty values', () => {
    expect(resolveProcedure('sedation')).toBeNull(); // valid in the api, but not offered by the UI
    expect(resolveProcedure('crow')).toBeNull();
    expect(resolveProcedure('')).toBeNull();
    expect(resolveProcedure('   ')).toBeNull();
  });
});
