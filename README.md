# 80 Hours

**Proof builder for Indiana HIP (and eventually SNAP) work requirements.**

Snap a paystub, gig earnings screen, or volunteer sheet → Gemini turns it into structured evidence → see your monthly progress toward **80 hours** or **$580** → download a PDF packet to help you report through the FSSA Benefits Portal.

> This is **not** an official FSSA tool. It helps you organize and prepare evidence. Always confirm status and report through [FSSA](https://www.in.gov/fssa/hip/hip-work-requirements/).

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

**Privacy by design:** images are processed in memory and not saved on a server. Evidence lives in **localStorage on your device**. You can delete all local data in one tap. Prompts + checks redact SSNs and account numbers from model output.

---

## Demo flow (Maria)

Judges can open the live URL on a phone and:

1. Load **Maria** demo data (home health aide + DoorDash + pantry volunteering ≈ **62/80 hours** in November), or upload a **fake** fixture document.
2. Confirm what the AI read.
3. Watch the tracker update; see at-risk state if behind with few days left.
4. Run the exemption check → FSSA pre-screener link.
5. Download the PDF proof packet.
6. (Stretch) Switch to Spanish / receive an SMS reminder on a Twilio trial number.

**Only fake data in fixtures and demos. Never upload a real person’s pay stub.**

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
| i18n | `en.json` / `es.json` | Simple Spanish toggle |
| Stretch SMS | Twilio trial | Demo to a verified number only |

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
- **Eval (optional):** `npm run eval` runs fixtures through extract and reports a score (e.g. `14/16 docs correct`).

---

## Project layout (target)

```text
app/                 # Next.js App Router screens + API
  api/extract/       # Image in → structured Evidence out (no disk write)
lib/
  rules.ts           # Month totals, earnings path, at-risk
  types.ts           # Shared Evidence / MonthStatus
fixtures/            # Fake documents + expected JSON (Gemini extract eval)
tests/               # Vitest rules engine tests
.github/workflows/   # CI: lint, typecheck, test, build
messages/            # en.json, es.json
docs/sources/        # Official FSSA PDFs used for RULES.md citations
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

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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
| Twilio vars | No | Stretch SMS reminders |

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
- SMS reminders (“18 hours to go, 9 days left”)
- Partner with clinics and benefits navigators for assisted intake

---

## Disclaimer

80 Hours is a hackathon prototype for educational / demo purposes. It does **not** determine eligibility, replace FSSA systems, or constitute legal or benefits advice. Always use official FSSA channels to check exemptions and report hours.
