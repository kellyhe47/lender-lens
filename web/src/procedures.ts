export interface Procedure {
  /** Lower-case; this is what is sent to the api. */
  value: string;
  /** What the user sees. Always the value with display capitalization. */
  label: string;
  category: 'Dental' | 'Vision';
}

/**
 * The procedures the UI offers (FR-F2). This is a frontend constant because the
 * api has one endpoint and so cannot serve the list. The api itself accepts any
 * procedure string; restricting staff to a known list is a UI decision.
 */
export const PROCEDURES: Procedure[] = [
  { value: 'general', label: 'General', category: 'Dental' },
  { value: 'implants', label: 'Implants', category: 'Dental' },
  { value: 'ortho', label: 'Ortho', category: 'Dental' },
  { value: 'crowns', label: 'Crowns', category: 'Dental' },
  { value: 'veneers', label: 'Veneers', category: 'Dental' },
  { value: 'root canal', label: 'Root canal', category: 'Dental' },
  { value: 'dentures', label: 'Dentures', category: 'Dental' },
  { value: 'extractions', label: 'Extractions', category: 'Dental' },
  { value: 'periodontal', label: 'Periodontal', category: 'Dental' },
  { value: 'whitening', label: 'Whitening', category: 'Dental' },
  { value: 'lasik', label: 'LASIK', category: 'Vision' },
  { value: 'cataract surgery', label: 'Cataract surgery', category: 'Vision' },
  { value: 'eye exam', label: 'Eye exam', category: 'Vision' },
  { value: 'glasses', label: 'Glasses', category: 'Vision' },
  { value: 'contact lenses', label: 'Contact lenses', category: 'Vision' },
];

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

/** Known procedures containing the typed text. Empty text matches them all. */
export function suggestProcedures(text: string): Procedure[] {
  const query = normalize(text);
  return PROCEDURES.filter((procedure) => procedure.value.includes(query));
}

/**
 * The api value for what the user typed, or null if it is not a listed
 * procedure. Typed text must equal a procedure exactly, ignoring case and
 * surrounding spaces; a partial match like "crow" is not accepted.
 */
export function resolveProcedure(text: string): string | null {
  const typed = normalize(text);
  return PROCEDURES.find((procedure) => procedure.value === typed)?.value ?? null;
}
