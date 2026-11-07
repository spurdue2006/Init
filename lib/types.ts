import { z } from "zod";

/**
 * Shared contract between Kanav (rules/PDF/seed) and Shlok (UI/API).
 * Freeze this shape before parallel work — change only with team agreement.
 */

export const EvidenceTypeSchema = z.enum([
  "paystub",
  "gig",
  "volunteer",
  "school",
  "other",
]);

export type EvidenceType = z.infer<typeof EvidenceTypeSchema>;

export const EvidenceSchema = z.object({
  id: z.string().min(1),
  type: EvidenceTypeSchema,
  source: z.string().min(1),
  periodStart: z.string().min(1), // ISO date YYYY-MM-DD
  periodEnd: z.string().min(1), // ISO date YYYY-MM-DD
  hours: z.number().nonnegative().optional(),
  grossPay: z.number().nonnegative().optional(),
  confidence: z.number().min(0).max(1),
  userConfirmed: z.boolean(),
  notes: z.string().optional(),
});

export type Evidence = z.infer<typeof EvidenceSchema>;

export const MetBySchema = z.enum(["hours", "earnings", "school", "none"]);

export type MetBy = z.infer<typeof MetBySchema>;

export const MonthStatusSchema = z.object({
  month: z.string().min(1), // YYYY-MM
  hours: z.number().nonnegative(),
  earnings: z.number().nonnegative(),
  metBy: MetBySchema,
  hoursRemaining: z.number(),
  daysLeft: z.number().int(),
  atRisk: z.boolean(),
});

export type MonthStatus = z.infer<typeof MonthStatusSchema>;
