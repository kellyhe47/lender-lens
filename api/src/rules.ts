import type { QuoteRequest } from './types';

/** Answers one question: does this request pass the rule? */
export type RuleCheck = (request: QuoteRequest) => boolean;

/**
 * Turns a rule's `value` from lenders.json into a check. It throws if the value
 * has the wrong shape, so a bad rule fails at startup, not on a request (FR-B9).
 */
type RuleBuilder = (value: unknown) => RuleCheck;

/**
 * The rule registry (FR-B4). Supporting a new rule type is one entry here.
 * Values are compared as-is: requests are normalized (FR-B11) and lenders.json
 * is assumed to use the same form (upper-case states and bands, lower-case
 * procedures).
 */
export const ruleTypes = {
  maxAmount: (value) => {
    const max = asNumber(value);
    return (request) => request.amount <= max; // inclusive (FR-B6)
  },
  allowedCreditBands: (value) => {
    const bands = asStringList(value);
    return (request) => bands.includes(request.creditBand);
  },
  allowedStates: (value) => {
    const states = asStringList(value);
    return (request) => states.includes(request.state);
  },
  disallowedProcedures: (value) => {
    const procedures = asStringList(value);
    return (request) => !procedures.includes(request.procedure);
  },
} satisfies Record<string, RuleBuilder>;

export function buildRuleCheck(type: string, value: unknown): RuleCheck {
  // hasOwn, so that a type like "toString" is not found on the prototype.
  if (!Object.hasOwn(ruleTypes, type)) {
    throw new Error(`unknown rule type "${type}"`);
  }
  const build: RuleBuilder = ruleTypes[type as keyof typeof ruleTypes];
  try {
    return build(value);
  } catch (error) {
    throw new Error(`${type} ${(error as Error).message}`);
  }
}

function asNumber(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error('value must be a number');
  }
  return value;
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    throw new Error('value must be a list of strings');
  }
  return value;
}
