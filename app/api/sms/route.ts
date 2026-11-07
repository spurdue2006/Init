import { NextResponse } from "next/server";
import twilio from "twilio";
import { z } from "zod";

const BodySchema = z.object({
  to: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{7,14}$/, "Phone must be E.164, e.g. +15551234567"),
  hoursRemaining: z.number().nonnegative().optional(),
  daysLeft: z.number().int().nonnegative().optional(),
  month: z.string().min(1).optional(),
  locale: z.enum(["en", "es"]).optional(),
});

function buildMessage(input: {
  hoursRemaining: number;
  daysLeft: number;
  month: string;
  locale: "en" | "es";
}): string {
  if (input.locale === "es") {
    return `Demo 80 Hours: unas ${input.hoursRemaining} hora(s) hacia 80 y ${input.daysLeft} día(s) restantes en ${input.month}. Solo estimación suave — confirme con FSSA. No es un aviso oficial.`;
  }
  return `80 Hours demo: about ${input.hoursRemaining} hour(s) toward 80 and ${input.daysLeft} day(s) left in ${input.month}. Soft estimate only — confirm with FSSA. Not an official notice.`;
}

export async function POST(request: Request) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM_NUMBER?.trim();

  if (!accountSid || !authToken || !from) {
    return NextResponse.json(
      {
        error:
          "Twilio is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER (trial: verified numbers only).",
      },
      { status: 503 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected JSON body." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid SMS request.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const locale = parsed.data.locale ?? "en";
  const hoursRemaining = parsed.data.hoursRemaining ?? 0;
  const daysLeft = parsed.data.daysLeft ?? 0;
  const month = parsed.data.month ?? "this month";
  // New Twilio trials reject custom Body text (error 572006). Set
  // TWILIO_TRIAL_TEMPLATE to a predefined name, e.g. sms_appointment_reminders.
  const trialTemplate = process.env.TWILIO_TRIAL_TEMPLATE?.trim();
  const body =
    trialTemplate ||
    buildMessage({ hoursRemaining, daysLeft, month, locale });

  try {
    const client = twilio(accountSid, authToken);
    const message = await client.messages.create({
      to: parsed.data.to,
      from,
      body,
    });
    return NextResponse.json({
      ok: true,
      sid: message.sid,
      preview: body,
      trialTemplate: Boolean(trialTemplate),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Twilio send failed";
    return NextResponse.json(
      {
        error: `SMS failed: ${message}. Trial: verified To number + TWILIO_TRIAL_TEMPLATE (e.g. sms_appointment_reminders), or upgrade for custom text.`,
      },
      { status: 502 },
    );
  }
}
