import { describe, expect, it } from "vitest";
import {
  AT_RISK_DAYS,
  attributeEvidenceToMonth,
  computeDaysLeft,
  computeMonthStatus,
  EARNINGS_THRESHOLD,
  HOURS_THRESHOLD,
} from "@/lib/rules";
import { mariaEvidence } from "@/lib/seed/maria";
import type { Evidence } from "@/lib/types";

function evidence(partial: Partial<Evidence> & Pick<Evidence, "id">): Evidence {
  return {
    type: "paystub",
    source: "Test Co",
    periodStart: "2026-11-01",
    periodEnd: "2026-11-15",
    confidence: 1,
    userConfirmed: true,
    ...partial,
  };
}

describe("attributeEvidenceToMonth", () => {
  it("splits a cross-month pay period by inclusive calendar days", () => {
    // Oct 28–Nov 10 = 14 days: Oct 28–31 = 4, Nov 1–10 = 10
    const row = evidence({
      id: "cross",
      periodStart: "2026-10-28",
      periodEnd: "2026-11-10",
      hours: 70,
      grossPay: 700,
    });

    const oct = attributeEvidenceToMonth(row, "2026-10");
    const nov = attributeEvidenceToMonth(row, "2026-11");

    expect(oct.hours).toBeCloseTo(20, 5); // 4/14 * 70
    expect(nov.hours).toBeCloseTo(50, 5); // 10/14 * 70
    expect(oct.earnings).toBeCloseTo(200, 5);
    expect(nov.earnings).toBeCloseTo(500, 5);
    expect(oct.hours + nov.hours).toBeCloseTo(70, 5);
  });

  it("attributes a single-day volunteer sheet fully to that month", () => {
    const row = evidence({
      id: "day",
      type: "volunteer",
      periodStart: "2026-11-08",
      periodEnd: "2026-11-08",
      hours: 8,
    });
    expect(attributeEvidenceToMonth(row, "2026-11").hours).toBe(8);
    expect(attributeEvidenceToMonth(row, "2026-10").hours).toBe(0);
  });
});

describe("computeMonthStatus", () => {
  it("sums combined activities toward 80 hours", () => {
    const status = computeMonthStatus(
      [
        evidence({ id: "a", hours: 40, periodEnd: "2026-11-15" }),
        evidence({
          id: "b",
          type: "gig",
          hours: 30,
          periodStart: "2026-11-01",
          periodEnd: "2026-11-30",
        }),
        evidence({
          id: "c",
          type: "volunteer",
          hours: 10,
          periodStart: "2026-11-20",
          periodEnd: "2026-11-20",
        }),
      ],
      "2026-11",
      new Date(2026, 10, 15),
    );

    expect(status.hours).toBe(80);
    expect(status.metBy).toBe("hours");
    expect(status.hoursRemaining).toBe(0);
    expect(status.atRisk).toBe(false);
  });

  it("meets via earnings path when gross >= 580 even with low hours", () => {
    const status = computeMonthStatus(
      [
        evidence({
          id: "earn",
          hours: 10,
          grossPay: EARNINGS_THRESHOLD,
          periodStart: "2026-11-01",
          periodEnd: "2026-11-30",
        }),
      ],
      "2026-11",
      new Date(2026, 10, 20),
    );

    expect(status.hours).toBe(10);
    expect(status.earnings).toBe(EARNINGS_THRESHOLD);
    expect(status.metBy).toBe("earnings");
    expect(status.atRisk).toBe(false);
  });

  it("meets via school path when type is school", () => {
    const status = computeMonthStatus(
      [
        evidence({
          id: "school",
          type: "school",
          source: "Ivy Tech",
          hours: 0,
          periodStart: "2026-11-01",
          periodEnd: "2026-11-30",
          notes: "half-time enrollment",
        }),
      ],
      "2026-11",
    );

    expect(status.metBy).toBe("school");
    expect(status.atRisk).toBe(false);
  });

  it("ignores unconfirmed evidence", () => {
    const status = computeMonthStatus(
      [
        evidence({
          id: "draft",
          hours: 80,
          userConfirmed: false,
          periodStart: "2026-11-01",
          periodEnd: "2026-11-30",
        }),
      ],
      "2026-11",
      new Date(2026, 10, 1),
    );

    expect(status.hours).toBe(0);
    expect(status.metBy).toBe("none");
    expect(status.hoursRemaining).toBe(HOURS_THRESHOLD);
  });

  it("flags atRisk when unmet and few days remain", () => {
    const status = computeMonthStatus(
      [evidence({ id: "low", hours: 20, periodEnd: "2026-11-15" })],
      "2026-11",
      new Date(2026, 10, 26), // Nov 26 → 5 days left (26..30)
    );

    expect(status.metBy).toBe("none");
    expect(status.daysLeft).toBe(5);
    expect(status.daysLeft).toBeLessThanOrEqual(AT_RISK_DAYS);
    expect(status.atRisk).toBe(true);
  });

  it("does not flag atRisk when already met", () => {
    const status = computeMonthStatus(
      [
        evidence({
          id: "ok",
          hours: 80,
          periodStart: "2026-11-01",
          periodEnd: "2026-11-30",
        }),
      ],
      "2026-11",
      new Date(2026, 10, 28),
    );

    expect(status.metBy).toBe("hours");
    expect(status.atRisk).toBe(false);
  });

  it("returns 0 daysLeft after the month ends", () => {
    expect(computeDaysLeft("2026-11", new Date(2026, 11, 1))).toBe(0);
  });

  it("Maria seed is about 62/80 hours in November 2026", () => {
    const status = computeMonthStatus(
      mariaEvidence,
      "2026-11",
      new Date(2026, 10, 7),
    );

    expect(status.hours).toBe(62);
    expect(status.metBy).toBe("none");
    expect(status.hoursRemaining).toBe(18);
    expect(status.daysLeft).toBe(24); // Nov 7..30 inclusive
    expect(status.atRisk).toBe(false);
  });
});
