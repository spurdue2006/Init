import type { Evidence } from "@/lib/types";

/**
 * Fake demo seed — Maria (home health + DoorDash + pantry) ≈ 62/80 hrs
 * in November 2026. Not a real person; for judges / local demo only.
 */
export const mariaEvidence: Evidence[] = [
  {
    id: "maria-paystub-nov1",
    type: "paystub",
    source: "CareBridge Home Health",
    periodStart: "2026-11-01",
    periodEnd: "2026-11-15",
    hours: 40,
    grossPay: 400,
    confidence: 0.95,
    userConfirmed: true,
    notes: "FAKE biweekly aide paystub",
  },
  {
    id: "maria-gig-doordash",
    type: "gig",
    source: "DoorDash",
    periodStart: "2026-11-01",
    periodEnd: "2026-11-30",
    hours: 14,
    grossPay: 150,
    confidence: 0.9,
    userConfirmed: true,
    notes: "FAKE November gig earnings screen",
  },
  {
    id: "maria-volunteer-pantry",
    type: "volunteer",
    source: "Neighborhood Food Pantry",
    periodStart: "2026-11-08",
    periodEnd: "2026-11-08",
    hours: 8,
    confidence: 0.88,
    userConfirmed: true,
    notes: "FAKE pantry volunteer sheet — one Saturday",
  },
];
