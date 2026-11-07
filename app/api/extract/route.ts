import { randomUUID } from "node:crypto";
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { containsSensitiveDigits, redactEvidence } from "@/lib/redact";
import { EvidenceSchema, EvidenceTypeSchema, type Evidence } from "@/lib/types";

/**
 * Free-tier Flash-Lite — do not switch to paid-only models.
 * Note: gemini-3.8-flash currently hangs for new free-tier keys on generateContent;
 * gemini-3.5-flash-lite is reliable and fast for vision JSON extract.
 */
const DEFAULT_MODEL = "gemini-3.5-flash-lite";
const GEMINI_TIMEOUT_MS = 25_000;

const ExtractedFieldsSchema = z.object({
  type: EvidenceTypeSchema,
  source: z.string().min(1),
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
  hours: z.number().nonnegative().optional().nullable(),
  grossPay: z.number().nonnegative().optional().nullable(),
  confidence: z.number().min(0).max(1),
  notes: z.string().optional().nullable(),
});

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/gif",
]);

const EXTRACT_PROMPT = `You read Indiana HIP work-requirement proof documents (pay stubs, gig earnings screens, volunteer sheets).
Return ONLY valid JSON with these fields:
- type: one of "paystub" | "gig" | "volunteer" | "school" | "other"
- source: employer, app, or organization name
- periodStart: YYYY-MM-DD (best estimate if partial)
- periodEnd: YYYY-MM-DD
- hours: number of hours if shown, else null
- grossPay: gross pay/earnings for the period if shown, else null
- confidence: 0 to 1 how sure you are
- notes: short optional note (null if none)

Privacy rules:
- Never include SSN, full account numbers, routing numbers, or bank details.
- If those appear on the image, omit them or replace with [REDACTED].
- Use only fake-looking values you read; do not invent a real person's identity.

If the image is not a work/volunteer/earnings document, still return best-effort JSON with low confidence and type "other".`;

function optionalNumber(
  value: number | null | undefined,
): number | undefined {
  return value === null || value === undefined ? undefined : value;
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart form data with an image file." },
      { status: 400 },
    );
  }

  const file = form.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: 'Missing image file field named "image".' },
      { status: 400 },
    );
  }

  const mimeType = file.type || "image/jpeg";
  if (!ALLOWED_MIME.has(mimeType)) {
    return NextResponse.json(
      { error: `Unsupported image type: ${mimeType}` },
      { status: 400 },
    );
  }

  // Hard cap to keep free-tier requests small (no disk writes — memory only).
  const MAX_BYTES = 8 * 1024 * 1024;
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image too large (max 8MB). Take a clearer, smaller photo." },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");

  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  const ai = new GoogleGenAI({ apiKey });

  let rawText: string;
  try {
    const response = await Promise.race([
      ai.models.generateContent({
        model,
        contents: [
          {
            inlineData: {
              mimeType,
              data: base64,
            },
          },
          { text: EXTRACT_PROMPT },
        ],
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      }),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(
            new Error(
              `Gemini timed out after ${GEMINI_TIMEOUT_MS / 1000}s (model=${model}). Try again or set GEMINI_MODEL=gemini-3.5-flash-lite.`,
            ),
          );
        }, GEMINI_TIMEOUT_MS);
      }),
    ]);
    rawText = response.text ?? "";
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gemini request failed";
    return NextResponse.json(
      { error: `Extract failed: ${message}` },
      { status: 502 },
    );
  }

  let json: unknown;
  try {
    json = JSON.parse(rawText);
  } catch {
    return NextResponse.json(
      { error: "Model returned non-JSON output.", raw: rawText.slice(0, 500) },
      { status: 502 },
    );
  }

  const extracted = ExtractedFieldsSchema.safeParse(json);
  if (!extracted.success) {
    return NextResponse.json(
      {
        error: "Model JSON failed schema validation.",
        details: extracted.error.flatten(),
      },
      { status: 502 },
    );
  }

  const draft: Evidence = redactEvidence({
    id: randomUUID(),
    type: extracted.data.type,
    source: extracted.data.source,
    periodStart: extracted.data.periodStart,
    periodEnd: extracted.data.periodEnd,
    hours: optionalNumber(extracted.data.hours),
    grossPay: optionalNumber(extracted.data.grossPay),
    confidence: extracted.data.confidence,
    userConfirmed: false,
    notes: extracted.data.notes ?? undefined,
  });

  // Second-pass regex guard after model output.
  if (
    containsSensitiveDigits(draft.source) ||
    (draft.notes !== undefined && containsSensitiveDigits(draft.notes))
  ) {
    return NextResponse.json(
      { error: "Extract blocked: sensitive digits remained after redaction." },
      { status: 502 },
    );
  }

  const validated = EvidenceSchema.safeParse(draft);
  if (!validated.success) {
    return NextResponse.json(
      {
        error: "Redacted draft failed EvidenceSchema.",
        details: validated.error.flatten(),
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ evidence: validated.data });
}
