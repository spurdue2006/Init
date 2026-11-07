# Decisions log

Record product / AI overrides here so Kanav and Shlok stay aligned and Cursor does not
re-hallucinate old mistakes.

Format:

```md
## YYYY-MM-DD — short title
- **Context:** …
- **Decision:** …
- **Source / why:** link to RULES.md section or FSSA URL
- **Owners:** Kanav / Shlok
```

---

## 2026-11-07 — Experimental UI shell on `KANAV-UI` branch

- **Context:** Product UI felt prototype-heavy (ad-hoc nav, Maria + delete on
  dashboard, duplicated evidence lists). Wanted a calmer, easier-to-manage layout
  without risking `main`.
- **Decision:** Isolate a quieter shell on branch **`KANAV-UI`**: sticky brand +
  Home/Proof/Progress nav, shared FSSA disclaimer footer, home as router (sample
  data only when empty), dashboard status-first with delete behind a disclosure,
  softer “estimate / on track” copy. Discard the branch if we keep the old UI.
  After Shlok’s Phase 3 i18n/SMS landed on `main`, rebased merge kept AppShell
  and wired `useI18n` / LanguageToggle / Twilio SMS card + `suppressHydrationWarning`
  on `<body>` (browser-extension attribute noise).
- **Source / why:** Trust / clarity for HIP prep tool; ownership note — Shlok
  owns `app/**`; this is an optional Kanav experiment, merge only if both agree.
- **Owners:** Kanav (experiment); Shlok (product UI owner)

## AI extract mistakes / overrides

Log Gemini `/api/extract` misses here so we do not silently “fix” bad totals.
Fixtures under `fixtures/*/expected.json` are the oracle for offline checks;
`npm run eval` prints mismatches to paste below.

Format:

```md
### YYYY-MM-DD — fixture-name / field
- **Got:** …
- **Expected:** …
- **Override / fix:** user confirmed edit | prompt change | ignore for MVP
- **Owners:** Kanav / Shlok
```

### 2026-11-07 — Phase 3 fixtures image-ready (live score pending key)

- **Got:** Schema score **4/4** (`gig-doordash`, `paystub-acme`, `paystub-maria`,
  `volunteer-pantry`). Live Gemini field score skipped locally until
  `GEMINI_API_KEY` is set in `.env.local` and `npm run dev` is running.
- **Expected:** Live field rows per fixture after extract is exercised.
- **Override / fix:** Append Got/Expected field rows below as soon as live eval
  prints mismatches (or note “clean” if all fields match).
- **Owners:** Kanav

### 2026-11-07 — Eval harness ready (Phase 2; images added in Phase 3)

- **Context:** Phase 2 K8/K9. Extract route needs multipart `image`; early fixtures
  were text-only.
- **Decision:** `npm run eval` always schema-validates `expected.json`. Live
  Gemini scoring runs when extract is up **and** the fixture folder has an image.
  Phase 3 added images for all four fixture folders; field-level rows are logged
  below after live runs.
- **Source / why:** Parallel Phase 2 → Phase 3 K11; fake fixtures only.
- **Owners:** Kanav

## 2026-11-07 — Rules engine algorithm (Phase 1)

- **Context:** Implement `computeMonthStatus` for parallel UI work without
  inventing HIP thresholds.
- **Decision:** Only `userConfirmed` evidence counts. Cross-month periods split by
  inclusive calendar-day proportion. `metBy` priority: school → hours (≥80) →
  earnings (≥$580) → none. `atRisk` when unmet and `daysLeft` is 1–7. Maria demo
  seed ≈ **62 hours** / **$550** earnings in November 2026 (40+14+8 hrs) so the
  demo shows an unmet hours path without accidentally meeting via $580.
- **Source / why:** [`RULES.md`](RULES.md) “Rules engine algorithm”; FSSA 80 / $580.
- **Owners:** Kanav

## 2026-11-07 — Use Gemini (free) instead of Anthropic for extract

- **Context:** Anthropic Claude API is paid; hackathon budget prefers $0.
- **Decision:** Document vision for `/api/extract` uses **Google Gemini** via
  `@google/genai` and `GEMINI_API_KEY` (AI Studio free tier). Removed
  `@anthropic-ai/sdk` / `ANTHROPIC_API_KEY`. Fake fixtures only — do not upload
  real pay stubs to free-tier APIs.
- **Source / why:** Team cost constraint; Gemini free-tier vision is sufficient for MVP.
- **Owners:** Shlok

## 2026-11-07 — Freeze Phase 0 contract

- **Context:** Parallel work starting after scaffold.
- **Decision:** `Evidence` / `MonthStatus` / `EvidenceSchema` in `lib/types.ts` are the
  shared contract. Import surfaces (`computeMonthStatus`, `mariaEvidence`,
  `<ProofPacket />`) kept stable so Shlok’s UI can land in parallel. **Phase 1–2
  filled the bodies** (rules engine, Maria seed, real ProofPacket); signatures
  unchanged.
- **Source / why:** Phase 0 plan; README core data shape.
- **Owners:** Kanav

## 2026-11-07 — Phase 3 judge URL + QR (K10)

- **Context:** Hackathon judges need a phone-openable production link and QR.
- **Decision (updated):** Primary production demo is
  `https://80-hrs.vercel.app` with [`public/qr-demo.png`](public/qr-demo.png)
  (Twilio SMS env configured; GitHub `spurdue2006/init` → Vercel project `80-hrs`).
  Keep Deployment Protection off (or shareable) so judges are not blocked by
  Vercel login. `GEMINI_API_KEY` + Twilio vars must be set on Vercel **Production**.
  Earlier Kanav-team Vercel URL is retired from README / judge materials.
- **Source / why:** Phase 3 K10; README live demo section; Twilio stretch on 80-hrs.
- **Owners:** Kanav (original); Shlok (URL switch for Twilio-ready deploy)

## 2026-11-07 — Authoritative HIP numbers from FSSA

- **Context:** Need a single anti-hallucination doc for agents and teammates.
- **Decision:** `RULES.md` is authoritative. Hard-coded MVP thresholds are **80 hours**,
  **$580** (`$7.25 × 80`), half-time school/apprenticeship, ages **19–64**, enforcement
  **2027-01-01**, three-month lookback (Jan 2027 → Oct/Nov/Dec 2026). Exemptions UI
  may only suggest + link FSSA; never assert exemption or eligibility.
- **Source / why:**
  - [`docs/sources/HIPWorkRequirementsPressRelease.pdf`](docs/sources/HIPWorkRequirementsPressRelease.pdf)
  - https://www.in.gov/fssa/hip/hip-work-requirements/
  - https://secure.in.gov/fssa/hip/hip-work-requirements/info-for-hip-members
- **Owners:** Kanav
