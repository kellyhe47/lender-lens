import { describe, expect, it } from 'vitest';
import { loadLenders, type Lender } from '../src/lenders';
import { quoteLender } from '../src/quote';
import { buildServer } from '../src/server';
import type { Offer, QuoteRequest } from '../src/types';

// The acceptance cases run against the real lenders.json, through the real route.
const server = buildServer(loadLenders());

async function postQuote(body: unknown) {
  const response = await server.inject({ method: 'POST', url: '/quote', payload: body as object });
  return { status: response.statusCode, body: response.json() };
}

/** Posts a request that must succeed and returns its offers keyed by lender name. */
async function quote(amount: number, creditBand: string, state: string, procedure: string) {
  const { status, body } = await postQuote({ amount, creditBand, state, procedure });
  expect(status).toBe(200);
  const offers = body.offers as Offer[];
  expect(offers.map((offer) => offer.lender)).toEqual(['Alpha', 'Bravo', 'Charlie']); // file order (FR-B1)
  const [alpha, bravo, charlie] = offers;
  return { alpha, bravo, charlie };
}

const OK_CODES = {
  Alpha: ['OK_AMOUNT', 'OK_CREDIT'],
  Bravo: ['OK_AMOUNT', 'OK_PROCEDURE', 'OK_STATE'],
  Charlie: ['OK_AMOUNT', 'OK_CREDIT', 'OK_STATE'],
};

function approved(
  lender: keyof typeof OK_CODES,
  apr: number,
  termMonths: number,
  monthlyPayment: number,
  totalCost: number,
  totalInterest: number,
): Offer {
  return {
    lender,
    approved: true,
    apr,
    termMonths,
    monthlyPayment,
    totalInterest,
    totalCost,
    reasonCodes: OK_CODES[lender],
  };
}

function declined(lender: string, ...reasonCodes: string[]): Offer {
  return { lender, approved: false, reasonCodes };
}

// Expected values are copied from PRD section 6. toStrictEqual also proves a
// declined offer has no loan-term keys (FR-B2).
const G1 = {
  alpha: approved('Alpha', 11.9, 36, 398.0, 14328.0, 2328.0),
  bravo: approved('Bravo', 14.9, 24, 581.27, 13950.48, 1950.48),
  charlie: approved('Charlie', 12.9, 48, 321.33, 15423.84, 3423.84),
};

describe('POST /quote acceptance cases', () => {
  it('G1: 12000 / B / TX / general approves all three', async () => {
    expect(await quote(12000, 'B', 'TX', 'general')).toStrictEqual(G1);
  });

  it('G2: implants is declined by Bravo only', async () => {
    expect(await quote(12000, 'B', 'TX', 'implants')).toStrictEqual({
      ...G1,
      bravo: declined('Bravo', 'DECLINE_PROCEDURE'),
    });
  });

  it('G3: 20000 / A / CA returns both of Bravo’s failing rules', async () => {
    expect(await quote(20000, 'A', 'CA', 'general')).toStrictEqual({
      alpha: approved('Alpha', 7.9, 36, 625.81, 22529.16, 2529.16),
      bravo: declined('Bravo', 'DECLINE_AMOUNT', 'DECLINE_STATE'),
      charlie: approved('Charlie', 8.9, 48, 496.75, 23844.0, 3844.0),
    });
  });

  it('G4: band D is declined by every lender, Bravo via the missing APR (FR-B7)', async () => {
    expect(await quote(12000, 'D', 'TX', 'general')).toStrictEqual({
      alpha: declined('Alpha', 'DECLINE_CREDIT'),
      bravo: declined('Bravo', 'DECLINE_CREDIT'),
      charlie: declined('Charlie', 'DECLINE_CREDIT'),
    });
  });

  it('G5: every failing rule is reported, and Bravo gets no DECLINE_CREDIT', async () => {
    expect(await quote(40000, 'D', 'WA', 'implants')).toStrictEqual({
      alpha: declined('Alpha', 'DECLINE_AMOUNT', 'DECLINE_CREDIT'),
      bravo: declined('Bravo', 'DECLINE_AMOUNT', 'DECLINE_PROCEDURE', 'DECLINE_STATE'),
      charlie: declined('Charlie', 'DECLINE_AMOUNT', 'DECLINE_CREDIT', 'DECLINE_STATE'),
    });
  });

  it('G6: 15000 is exactly Bravo’s maximum and is approved', async () => {
    expect(await quote(15000, 'B', 'TX', 'general')).toStrictEqual({
      alpha: approved('Alpha', 11.9, 36, 497.5, 17910.0, 2910.0),
      bravo: approved('Bravo', 14.9, 24, 726.59, 17438.16, 2438.16),
      charlie: approved('Charlie', 12.9, 48, 401.67, 19280.16, 4280.16),
    });
  });

  it('G7: 15000.01 is one cent over Bravo’s maximum', async () => {
    const { alpha, bravo, charlie } = await quote(15000.01, 'B', 'TX', 'general');
    expect(alpha).toMatchObject({ approved: true });
    expect(bravo).toStrictEqual(declined('Bravo', 'DECLINE_AMOUNT'));
    expect(charlie).toMatchObject({ approved: true });
  });

  it('G8: 25000 / C / NY is exactly Alpha’s maximum', async () => {
    expect(await quote(25000, 'C', 'NY', 'general')).toStrictEqual({
      alpha: approved('Alpha', 17.9, 36, 902.56, 32492.16, 7492.16),
      bravo: declined('Bravo', 'DECLINE_AMOUNT', 'DECLINE_STATE'),
      charlie: approved('Charlie', 18.9, 48, 746.18, 35816.64, 10816.64),
    });
  });

  it('G9: input is normalized before rules run', async () => {
    expect(await quote(12000, 'b', 'tx', ' General ')).toStrictEqual(G1);
  });

  it('G10: an unknown procedure is valid and approved where not disallowed', async () => {
    expect(await quote(12000, 'B', 'TX', 'sedation')).toStrictEqual(G1);
  });

  it('normalizes the procedure before the disallowed check', async () => {
    const { bravo } = await quote(12000, 'B', 'TX', '  IMPLANTS ');
    expect(bravo).toStrictEqual(declined('Bravo', 'DECLINE_PROCEDURE'));
  });
});

describe('POST /quote validation', () => {
  const valid = { amount: 12000, creditBand: 'B', state: 'TX', procedure: 'general' };

  function without(field: keyof typeof valid) {
    const { [field]: _removed, ...rest } = valid;
    return rest;
  }

  it.each([
    ['amount of 0', { ...valid, amount: 0 }, 'amount'],
    ['negative amount', { ...valid, amount: -5 }, 'amount'],
    ['non-numeric amount', { ...valid, amount: 'abc' }, 'amount'],
    ['numeric string amount', { ...valid, amount: '12000' }, 'amount'],
    ['missing amount', without('amount'), 'amount'],
    ['amount with 3 decimal places', { ...valid, amount: 100.999 }, 'amount'],
    ['credit band E', { ...valid, creditBand: 'E' }, 'creditBand'],
    ['missing credit band', without('creditBand'), 'creditBand'],
    ['state ZZ', { ...valid, state: 'ZZ' }, 'state'],
    ['state spelled out', { ...valid, state: 'Texas' }, 'state'],
    ['missing state', without('state'), 'state'],
    ['empty procedure', { ...valid, procedure: '' }, 'procedure'],
    ['whitespace-only procedure', { ...valid, procedure: '   ' }, 'procedure'],
    ['missing procedure', without('procedure'), 'procedure'],
    ['procedure over 100 characters', { ...valid, procedure: 'x'.repeat(101) }, 'procedure'],
  ])('%s -> 400 naming %s', async (_name, payload, field) => {
    const { status, body } = await postQuote(payload);
    expect(status).toBe(400);
    expect(body.error).toBe('VALIDATION_ERROR');
    expect(body.details).toHaveLength(1);
    expect(body.details[0].field).toBe(field);
    expect(body.details[0].message).toEqual(expect.any(String));
  });

  it('accepts a procedure of exactly 100 characters', async () => {
    const { status } = await postQuote({ ...valid, procedure: 'x'.repeat(100) });
    expect(status).toBe(200);
  });

  it('two bad fields at once return two details', async () => {
    const { status, body } = await postQuote({ ...valid, amount: 0, state: 'ZZ' });
    expect(status).toBe(400);
    expect(body.details.map((detail: { field: string }) => detail.field)).toEqual(['amount', 'state']);
  });

  it('an empty object reports all four fields', async () => {
    const { status, body } = await postQuote({});
    expect(status).toBe(400);
    expect(body.details.map((detail: { field: string }) => detail.field)).toEqual([
      'amount',
      'creditBand',
      'state',
      'procedure',
    ]);
  });

  it('a body that is not valid JSON is a 400, not a 500', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/quote',
      headers: { 'content-type': 'application/json' },
      payload: '{ not json',
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe('VALIDATION_ERROR');
  });

  it('an amount too large for a number (parsed as Infinity) is rejected', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/quote',
      headers: { 'content-type': 'application/json' },
      payload: '{"amount":1e999,"creditBand":"B","state":"TX","procedure":"general"}',
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().details[0].field).toBe('amount');
  });
});

describe('server behaviour (FR-B15)', () => {
  it('unknown route -> 404', async () => {
    const response = await server.inject({ method: 'GET', url: '/lenders' });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: 'NOT_FOUND' });
  });

  it('GET /quote -> 404: the only endpoint is POST', async () => {
    const response = await server.inject({ method: 'GET', url: '/quote' });
    expect(response.statusCode).toBe(404);
  });

  it('unexpected error -> 500 with no stack trace or message', async () => {
    const brokenLender: Lender = {
      name: 'Broken',
      aprByCreditBand: {},
      termMonths: 12,
      rules: [
        {
          reasonCode: 'DECLINE_AMOUNT',
          passes: () => {
            throw new Error('secret internal detail');
          },
        },
      ],
      successReasonCodes: [],
    };
    const response = await buildServer([brokenLender]).inject({
      method: 'POST',
      url: '/quote',
      payload: { amount: 12000, creditBand: 'B', state: 'TX', procedure: 'general' },
    });
    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({ error: 'INTERNAL_ERROR' });
    expect(response.body).not.toContain('secret');
  });

  it('allows the web dev origin via CORS, including the preflight', async () => {
    const preflight = await server.inject({
      method: 'OPTIONS',
      url: '/quote',
      headers: {
        origin: 'http://localhost:5173',
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'content-type',
      },
    });
    expect(preflight.statusCode).toBe(204);
    expect(preflight.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('never echoes another origin, so a browser on it is refused', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/quote',
      headers: { origin: 'http://other.example' },
      payload: { amount: 12000, creditBand: 'B', state: 'TX', procedure: 'general' },
    });
    // The header always names the one allowed origin; it does not match the caller's.
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });
});

describe('quoteLender (rule evaluation order)', () => {
  const request: QuoteRequest = { amount: 12000, creditBand: 'B', state: 'TX', procedure: 'general' };
  const fail = (reasonCode: string) => ({ reasonCode, passes: () => false });
  const pass = (reasonCode: string) => ({ reasonCode, passes: () => true });

  function lender(overrides: Partial<Lender>): Lender {
    return {
      name: 'Test',
      aprByCreditBand: { B: 10 },
      termMonths: 12,
      rules: [],
      successReasonCodes: ['OK_TEST'],
      ...overrides,
    };
  }

  it('returns failing codes in rule order, skipping rules that pass (FR-B5)', () => {
    const rules = [fail('DECLINE_STATE'), pass('DECLINE_CREDIT'), fail('DECLINE_AMOUNT')];
    expect(quoteLender(lender({ rules }), request)).toStrictEqual(
      declined('Test', 'DECLINE_STATE', 'DECLINE_AMOUNT'),
    );
  });

  it('de-duplicates codes when two failing rules share one (FR-B5)', () => {
    const rules = [fail('DECLINE_AMOUNT'), fail('DECLINE_STATE'), fail('DECLINE_AMOUNT')];
    expect(quoteLender(lender({ rules }), request)).toStrictEqual(
      declined('Test', 'DECLINE_AMOUNT', 'DECLINE_STATE'),
    );
  });

  it('declines with DECLINE_CREDIT when all rules pass but the band has no APR (FR-B7)', () => {
    const offer = quoteLender(lender({ aprByCreditBand: { A: 5 }, rules: [pass('X')] }), request);
    expect(offer).toStrictEqual(declined('Test', 'DECLINE_CREDIT'));
  });

  it('never adds DECLINE_CREDIT for a missing APR once an explicit rule has failed (FR-B7)', () => {
    const offer = quoteLender(lender({ aprByCreditBand: {}, rules: [fail('DECLINE_STATE')] }), request);
    expect(offer).toStrictEqual(declined('Test', 'DECLINE_STATE'));
  });

  it('approves with the lender’s success codes unchanged (FR-B8)', () => {
    expect(quoteLender(lender({ rules: [pass('X')] }), request)).toMatchObject({
      approved: true,
      apr: 10,
      termMonths: 12,
      reasonCodes: ['OK_TEST'],
    });
  });
});
