import type { Evidence, MonthStatus } from "@/lib/types";

/**
 * Stub — Kanav implements the real month totals / pathways / at-risk logic.
 * Signature is frozen so Shlok can import against it.
 */
export function computeMonthStatus(
  evidence: Evidence[],
  month: string,
  asOf: Date = new Date(),
): MonthStatus {
  void evidence;
  void asOf;

  return {
    month,
    hours: 0,
    earnings: 0,
    metBy: "none",
    hoursRemaining: 80,
    daysLeft: 0,
    atRisk: false,
  };
}
