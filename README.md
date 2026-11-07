# 80 Hours

**Proof builder for Indiana HIP (and eventually SNAP) work requirements.**

Snap a paystub, gig earnings screen, or volunteer sheet → Gemini turns it into structured evidence → see your monthly progress toward **80 hours** or **$580** → download a PDF packet to help you report through the FSSA Benefits Portal.

> This is **not** an official FSSA tool. It helps you organize and prepare evidence. Always confirm status and report through [FSSA](https://www.in.gov/fssa/hip/hip-work-requirements/).

## Live demo (judges)

**Primary URL:** [https://80-hrs.vercel.app](https://80-hrs.vercel.app) — Twilio SMS env configured for the stretch demo.

Scan the QR (phone) → same URL:

![QR code for live demo](public/qr-demo.png)

**Also live (same `main` / `spurdue2006/init`):** [https://init-kanavkhurana3737-4212s-projects.vercel.app](https://init-kanavkhurana3737-4212s-projects.vercel.app)

**Fake data only** in fixtures and the Maria demo. Never upload a real person’s pay stub.

---

## The problem

Starting **January 1, 2027**, Indiana will enforce work requirements for many Healthy Indiana Plan (HIP) members ages 19–64. The deadline is tighter than it looks: anyone applying in January 2027 must show compliance for **October, November, and December 2026**. That lookback window is open now.

Non-exempt members generally need **at least 80 hours per month** of qualifying activity (work, volunteering, training, etc.—activities can be combined), **or** earn the minimum-wage equivalent of **$580/month** ($7.25 × 80), **or** attend school / an apprenticeship at least half-time.

When Arkansas briefly ran Medicaid work rules, most people lost coverage **not because they didn’t work**, but because they **didn’t submit paperwork correctly in time**. Paperwork is what knocks people off.

Existing tools sit on one side of the problem:

- Employer timeclocks
- Nonprofit volunteer loggers
- The state’s own pre-screener

Nothing pulls **one person’s mixed evidence** into one place: a DoorDash screenshot, a part-time paystub, and pantry volunteer hours.

**80 Hours** fills that gap.

Official references:

- [FSSA HIP Work Requirements](https://www.in.gov/fssa/hip/hip-work-requirements/)
- [Information for HIP Members](https://secure.in.gov/fssa/hip/hip-work-requirements/info-for-hip-members) (confirms the $580 earnings pathway)

---

## What it does (MVP)

1. **Upload** — Phone camera or file picker for a paystub, gig screen, or volunteer sheet.
2. **Extract** — Gemini vision reads the image into structured data (hours, pay, dates, source).
3. **Confirm** — You review and fix any field before it counts. AI assists; you decide.
4. **Track** — Monthly dashboard: e.g. `62/80 hrs · November · 23 days left`, plus the earnings path toward `$580`.
5. **Exempt?** — Short quiz that may suggest you *might* be exempt, with a link to FSSA’s official pre-screener. We never say “you are exempt.”
6. **Proof packet** — One-click PDF: month summary, evidence table, totals, which rule was met, plus a clear disclaimer.
7. **Spanish** — EN / ES toggle in the app shell (`messages/en.json`, `messages/es.json`).
8. **SMS reminder (stretch)** — Dashboard → send a soft Twilio text via `/api/sms` (trial: verified To number + predefined template).

**Privacy by design:** images are processed in memory and not saved on a server. Evidence lives in **localStorage on your device**. You can delete all local data in one tap. Prompts + checks redact SSNs and account numbers from model output.

---

## Demo flow (Maria)

Judges can open the [live URL](https://80-hrs.vercel.app) on a phone and:

1. Tap **Load Maria demo** on the dashboard (home health + DoorDash + pantry ≈ **62/80 hours** in November 2026), **or** upload a **fake** image from `fixtures/*/document.png` (or `paystub-maria/document.jpg`).
2. On upload: review the confirm screen — fix any field the model misread, then save.
3. On the dashboard: watch month totals update; unmet + few days left shows **at-risk**.
4. Open **Exempt?** → soft suggestion only + link to FSSA’s official pre-screener (we never say “you are exempt”).
5. Download the **PDF proof packet** (prep evidence, not a filing).
6. Toggle **EN / ES** in the header (AppShell) to show Spanish copy.
7. **SMS reminder (stretch):** Dashboard → enter a Twilio-**verified** E.164 number → **Send reminder text**. On a Twilio trial the body is a predefined template (e.g. `sms_appointment_reminders`), not custom “hours left” copy — still a live phone ping for the pitch: *“Twilio trial only texts verified numbers — here’s a live reminder.”*

**Only fake data in fixtures and demos.**

---

## How it works

```text
Phone camera
    → Upload
    → POST /api/extract  (Gemini vision, JSON schema, Zod validation)
    → Confirm / edit     (userConfirmed)
    → localStorage
    → lib/rules.ts       (hours, $580 earnings, school, days left, at-risk)
    → Dashboard + PDF packet
         ↘ (stretch) POST /api/sms  → Twilio trial template to verified number
```

### Meeting the month (rules engine)

| Path | Met when |
|------|----------|
| Hours | Qualifying hours attributed to that calendar month ≥ **80** |
| Earnings | Gross pay attributed to that month ≥ **$580** |
| School | Evidence marked half-time school / apprenticeship |
| None | Otherwise; **at-risk** if unmet and few days remain |

Cross-month pay periods (e.g. Oct 28–Nov 10) are split across months by the rules engine.

See [`RULES.md`](RULES.md) for citations, exemptions list, and reporting timing.

---

## Tech stack

| Part | Choice | Why |
|------|--------|-----|
| Web app | Next.js (App Router) + TypeScript | UI + API routes in one repo |
| Styling | Tailwind + shadcn/ui | Fast, mobile-friendly UI |
| Hosting | Vercel | Live URL + QR for judges’ phones |
| Camera | `<input type="file" accept="image/*" capture="environment">` | Opens phone camera, no extra library |
| AI | Google Gemini API (Flash, vision, free tier) + structured JSON | Reads stubs, gig screens, handwritten sheets |
| Validation | Zod | Reject bad AI output before the tracker |
| Rules | Plain TypeScript (`lib/rules.ts`) | Pure functions, easy to test |
| Tests | Vitest | Unit tests + optional AI accuracy eval |
| CI | GitHub Actions | Lint, typecheck, test, build on every push |
| Storage | localStorage / IndexedDB | No server database of pay stubs |
| PDF | `@react-pdf/renderer` | Proof packet in the browser |
| i18n | `messages/en.json` + `es.json`, `lib/i18n.tsx`, AppShell toggle | EN / ES without a heavy i18n framework |
| Stretch SMS | Twilio Messages API via `/api/sms` | Trial: verified To + `TWILIO_TRIAL_TEMPLATE` (no paid upgrade) |

**We do not use Supabase, Firebase, or a server database for MVP.**

---

## Core data shape

```ts
Evidence {
  id, type: "paystub" | "gig" | "volunteer" | "school" | "other",
  source, periodStart, periodEnd, hours?, grossPay?,
  confidence, userConfirmed, notes
}

MonthStatus {
  month, hours, earnings,
  metBy: "hours" | "earnings" | "school" | "none",
  hoursRemaining, daysLeft, atRisk
}
```

---

## How AI was used

- **Document reading:** Gemini vision extracts structured fields from uploaded images via `/api/extract`.
- **Human check:** Confirm screen is required so bad extractions don’t silently corrupt the month total.
- **Guardrails:** Zod schema validation; SSN / account-number redaction; mistakes and overrides logged in [`DECISIONS.md`](DECISIONS.md).
- **Eval (optional):** `npm run eval` schema-checks each `fixtures/*/expected.json` and, with `npm run dev` + fixture images, live-scores Gemini via `/api/extract` (currently **4** fake fixtures).

---

## Project layout

```text
app/                 # Next.js App Router screens + API
  api/extract/       # Image in → structured Evidence out (no disk write)
  api/sms/           # Twilio stretch reminder (trial template support)
components/
  app-shell.tsx      # Shared chrome + EN/ES LanguageToggle
  providers.tsx      # LocaleProvider
lib/
  i18n.tsx           # Locale context + t()
  rules.ts           # Month totals, earnings path, at-risk
  types.ts           # Shared Evidence / MonthStatus
  pdf/               # ProofPacket (@react-pdf/renderer)
  seed/maria.ts      # Fake Maria demo evidence
messages/            # en.json + es.json UI copy
fixtures/            # Fake docs + images + expected JSON (extract eval)
tests/               # Vitest rules + redaction tests
scripts/eval.ts      # Optional AI accuracy harness
.github/workflows/   # CI: lint, typecheck, test, build
docs/sources/        # Official FSSA PDFs used for RULES.md citations
public/qr-demo.png   # QR → live demo URL
RULES.md             # HIP pathways, exemptions, links (anti-hallucination)
DECISIONS.md         # Where AI was wrong / we overrode it
CONTRIBUTING.md      # Branch/PR workflow — never push straight to main
.cursor/rules/       # Cursor agent project rules (HIP + git)
```

---

## Setup

### Prerequisites

- Node.js 20+
- Google AI Studio API key ([free](https://aistudio.google.com/apikey))
- (Optional) Vercel CLI for deploy; Twilio for SMS stretch

### Local

```bash
cp .env.example .env.local
# set GEMINI_API_KEY=...
# optional SMS: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER,
#               TWILIO_TRIAL_TEMPLATE=sms_appointment_reminders

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Restart `npm run dev` after changing `.env.local`.

### Twilio SMS stretch (optional, free trial)

1. Create a [Twilio trial](https://www.twilio.com/try-twilio) — **do not upgrade** for the hackathon demo.
2. Get a trial From number; copy Account SID + Auth Token.
3. **Verify** the phone that will receive texts (Verified Caller IDs). Trial can only text verified numbers.
4. Set env vars locally and on Vercel (Production + Preview), then **redeploy**.
5. New Twilio trials reject custom SMS bodies (error **572006**). Set `TWILIO_TRIAL_TEMPLATE` to a predefined name such as `sms_appointment_reminders`. Custom “X hours left” text needs a paid upgrade — skip that for demo.
6. Dashboard → SMS reminder → E.164 To number → Send.

Vercel must be connected to GitHub **`spurdue2006/init`** (not a separate empty/`80-hrs`-only repo), or Production will stay on stale “Initial commit” builds without Spanish/SMS UI.

### Scripts

```bash
npm run lint
npm run typecheck
npm test            # Vitest (rules + redaction)
npm run build
npm run eval        # optional AI fixture accuracy harness
```

### Environment

| Variable | Required | Purpose |
|----------|----------|---------|
| `GEMINI_API_KEY` | Yes | Gemini vision extraction (free tier) |
| `TWILIO_ACCOUNT_SID` | No | Twilio Account SID (`AC…`) |
| `TWILIO_AUTH_TOKEN` | No | Twilio Auth Token |
| `TWILIO_FROM_NUMBER` | No | Trial From number (`+1…`) |
| `TWILIO_TRIAL_TEMPLATE` | No* | Predefined trial Body name (e.g. `sms_appointment_reminders`) |

\*Required for SMS to work on **new** Twilio trials without upgrading. Omit only if the account can send custom Body text.

Secrets are write-only in the Vercel UI after save — that is normal. Wrong SID/token shows as Twilio “invalid username” / auth errors on `/api/sms`.

---

## Team

| Person | Focus |
|--------|--------|
| **Shlok** | Next.js UI, `/api/extract`, confirm/dashboard/exempt, device storage, Spanish / Twilio stretch |
| **Kanav** | `RULES.md`, `lib/rules.ts` + Vitest, fixtures/eval, CI, PDF packet, Maria seed, README / DECISIONS |

Workflow: see [`CONTRIBUTING.md`](CONTRIBUTING.md) — **branch → PR → merge**; never push straight to `main`. Domain rules for humans and Cursor: [`RULES.md`](RULES.md).

---

## What’s next

- Same 80-hour engine for **SNAP** reporting support
- Custom SMS body after Twilio upgrade (“18 hours to go, 9 days left”) — trial currently uses Twilio sample templates only
- Partner with clinics and benefits navigators for assisted intake

---

## Disclaimer

80 Hours is a hackathon prototype for educational / demo purposes. It does **not** determine eligibility, replace FSSA systems, or constitute legal or benefits advice. Always use official FSSA channels to check exemptions and report hours.
