import { describe, expect, it } from "vitest";
import { EvidenceSchema, MonthStatusSchema } from "@/lib/types";

describe("EvidenceSchema contract", () => {
  it("accepts a valid evidence record", () => {
    const result = EvidenceSchema.safeParse({
      id: "ev-1",
      type: "paystub",
      source: "Acme Home Health",
      periodStart: "2026-11-01",
      periodEnd: "2026-11-15",
      hours: 40,
      grossPay: 580,
      confidence: 0.92,
      userConfirmed: true,
      notes: "biweekly",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an unknown evidence type", () => {
    const result = EvidenceSchema.safeParse({
      id: "ev-2",
      type: "internship",
      source: "Clinic",
      periodStart: "2026-11-01",
      periodEnd: "2026-11-30",
      confidence: 0.5,
      userConfirmed: false,
    });

    expect(result.success).toBe(false);
  });
});

describe("MonthStatusSchema contract", () => {
  it("accepts a valid month status", () => {
    const result = MonthStatusSchema.safeParse({
      month: "2026-11",
      hours: 62,
      earnings: 410,
      metBy: "none",
      hoursRemaining: 18,
      daysLeft: 23,
      atRisk: false,
    });

    expect(result.success).toBe(true);
  });
});
