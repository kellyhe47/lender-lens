import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildRuleCheck, type RuleCheck } from './rules';

export interface LenderRule {
  reasonCode: string;
  passes: RuleCheck;
}

/** A lender from lenders.json, validated, with its rules ready to evaluate. */
export interface Lender {
  name: string;
  /** Not every band has an APR; a missing band is a credit decline (FR-B7). */
  aprByCreditBand: Partial<Record<string, number>>;
  termMonths: number;
  rules: LenderRule[];
  successReasonCodes: string[];
}

const LENDERS_FILE = fileURLToPath(new URL('../lenders.json', import.meta.url));
const CREDIT_BANDS = ['A', 'B', 'C', 'D'];

/** Reads and validates lenders.json. Called once, at startup (FR-B9). */
export function loadLenders(): Lender[] {
  try {
    return parseLenders(JSON.parse(readFileSync(LENDERS_FILE, 'utf8')));
  } catch (error) {
    throw new Error(`Invalid lenders.json: ${(error as Error).message}`);
  }
}

/** Validates the parsed file. Throws on the first problem, naming the lender. */
export function parseLenders(file: unknown): Lender[] {
  if (!isObject(file) || !Array.isArray(file.lenders)) {
    throw new Error('"lenders" must be an array');
  }
  return file.lenders.map(parseLender);
}

function parseLender(raw: unknown, index: number): Lender {
  if (!isObject(raw) || !isNonEmptyString(raw.name)) {
    throw new Error(`lender #${index + 1} must have a name`);
  }
  const { name, aprByCreditBand, termMonths, rules, successReasonCodes } = raw;
  const fail = (problem: string): never => {
    throw new Error(`lender "${name}": ${problem}`);
  };

  if (!isObject(aprByCreditBand)) {
    return fail('aprByCreditBand must be an object of APRs by credit band');
  }
  for (const [band, apr] of Object.entries(aprByCreditBand)) {
    if (!CREDIT_BANDS.includes(band)) fail(`aprByCreditBand has unknown credit band "${band}"`);
    if (typeof apr !== 'number' || !Number.isFinite(apr) || apr < 0) {
      fail(`APR for band ${band} must be a number of 0 or more`);
    }
  }

  if (typeof termMonths !== 'number' || !Number.isInteger(termMonths) || termMonths <= 0) {
    return fail('termMonths must be a positive whole number');
  }

  if (!Array.isArray(rules)) {
    return fail('rules must be an array');
  }
  const parsedRules = rules.map((rule: unknown, ruleIndex): LenderRule => {
    const label = `rule #${ruleIndex + 1}`;
    if (!isObject(rule) || typeof rule.type !== 'string') {
      return fail(`${label} must have a type`);
    }
    if (!isNonEmptyString(rule.reasonCode)) {
      return fail(`${label} (${rule.type}) must have a reasonCode`);
    }
    try {
      return { reasonCode: rule.reasonCode, passes: buildRuleCheck(rule.type, rule.value) };
    } catch (error) {
      return fail(`${label}: ${(error as Error).message}`);
    }
  });

  if (!Array.isArray(successReasonCodes) || !successReasonCodes.every(isNonEmptyString)) {
    return fail('successReasonCodes must be a list of strings');
  }

  return {
    name,
    aprByCreditBand: aprByCreditBand as Record<string, number>,
    termMonths,
    rules: parsedRules,
    successReasonCodes,
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}
