import type { Evidence, MetBy, MonthStatus } from "@/lib/types";

/** HIP hours pathway threshold (RULES.md / FSSA). */
export const HOURS_THRESHOLD = 80;

/** HIP earnings pathway threshold in USD (RULES.md: $7.25 × 80). */
export const EARNINGS_THRESHOLD = 580;

/** Unmet + this many days left (or fewer) → atRisk. */
export const AT_RISK_DAYS = 7;

export type MonthAttribution = {
  hours: number;
  earnings: number;
  hasSchool: boolean;
};

function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfMonth(month: string): Date {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1);
}

function endOfMonth(month: string): Date {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m, 0);
}

function daysInclusive(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.floor(ms / 86_400_000) + 1;
}

function clampDate(date: Date, min: Date, max: Date): Date {
  if (date < min) return min;
  if (date > max) return max;
  return date;
}

/**
 * Attribute one evidence row's hours/pay into a calendar month by inclusive
 * day proportion across periodStart…periodEnd (cross-month safe).
 */
export function attributeEvidenceToMonth(
  evidence: Evidence,
  month: string,
): MonthAttribution {
  const empty: MonthAttribution = { hours: 0, earnings: 0, hasSchool: false };

  const periodStart = parseISODate(evidence.periodStart);
  const periodEnd = parseISODate(evidence.periodEnd);
  if (periodEnd < periodStart) return empty;

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);

  // No overlap if the whole period is outside the month (don't clamp first —
  // clamping endpoints independently can invent a false 1-day overlap).
  if (periodEnd < monthStart || periodStart > monthEnd) return empty;

  const overlapStart = clampDate(periodStart, monthStart, monthEnd);
  const overlapEnd = clampDate(periodEnd, monthStart, monthEnd);
  if (overlapEnd < overlapStart) return empty;

  const totalDays = daysInclusive(periodStart, periodEnd);
  const overlapDays = daysInclusive(overlapStart, overlapEnd);
  const fraction = overlapDays / totalDays;

  const hours = (evidence.hours ?? 0) * fraction;
  const earnings = (evidence.grossPay ?? 0) * fraction;
  const hasSchool = evidence.type === "school";

  return { hours, earnings, hasSchool };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Days remaining in `month` from `asOf` (date-only), inclusive of today.
 * 0 if `asOf` is after the month ends.
 */
export function computeDaysLeft(month: string, asOf: Date = new Date()): number {
  const asOfDay = parseISODate(toISODate(asOf));
  const monthEnd = endOfMonth(month);
  if (asOfDay > monthEnd) return 0;
  return daysInclusive(asOfDay, monthEnd);
}

function resolveMetBy(
  hours: number,
  earnings: number,
  hasSchool: boolean,
): MetBy {
  if (hasSchool) return "school";
  if (hours >= HOURS_THRESHOLD) return "hours";
  if (earnings >= EARNINGS_THRESHOLD) return "earnings";
  return "none";
}

/**
 * Monthly HIP progress: hours, $580 earnings, school, days left, at-risk.
 * Only `userConfirmed` evidence counts.
 */
export function computeMonthStatus(
  evidence: Evidence[],
  month: string,
  asOf: Date = new Date(),
): MonthStatus {
  let hours = 0;
  let earnings = 0;
  let hasSchool = false;

  for (const row of evidence) {
    if (!row.userConfirmed) continue;
    const attributed = attributeEvidenceToMonth(row, month);
    hours += attributed.hours;
    earnings += attributed.earnings;
    if (attributed.hasSchool) hasSchool = true;
  }

  hours = round2(hours);
  earnings = round2(earnings);

  const metBy = resolveMetBy(hours, earnings, hasSchool);
  const daysLeft = computeDaysLeft(month, asOf);
  const hoursRemaining = Math.max(0, round2(HOURS_THRESHOLD - hours));
  const atRisk =
    metBy === "none" && daysLeft > 0 && daysLeft <= AT_RISK_DAYS;

  return {
    month,
    hours,
    earnings,
    metBy,
    hoursRemaining,
    daysLeft,
    atRisk,
  };
}
