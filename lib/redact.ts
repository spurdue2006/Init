import type { Evidence } from "@/lib/types";

/** SSN with optional dashes: 123-45-6789 or 123456789 */
const SSN_PATTERN = /\b\d{3}-?\d{2}-?\d{4}\b/g;

/**
 * Likely bank / payroll account numbers: 8–17 digit runs.
 * Skips shorter sequences (hours, zip-ish) by requiring length ≥ 8.
 */
const ACCOUNT_PATTERN = /\b\d{8,17}\b/g;

const REDACTED = "[REDACTED]";

/** Scrub SSN and long account-number digit runs from free text. */
export function redactText(value: string): string {
  return value
    .replace(SSN_PATTERN, REDACTED)
    .replace(ACCOUNT_PATTERN, REDACTED);
}

/** Returns true if the string still looks like it contains SSN/account digits. */
export function containsSensitiveDigits(value: string): boolean {
  SSN_PATTERN.lastIndex = 0;
  ACCOUNT_PATTERN.lastIndex = 0;
  return SSN_PATTERN.test(value) || ACCOUNT_PATTERN.test(value);
}

/** Redact string fields on an Evidence draft (source + notes). */
export function redactEvidence<T extends Pick<Evidence, "source" | "notes">>(
  evidence: T,
): T {
  return {
    ...evidence,
    source: redactText(evidence.source),
    notes:
      evidence.notes === undefined ? undefined : redactText(evidence.notes),
  };
}
