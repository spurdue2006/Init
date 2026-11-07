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

### 2026-11-07 — Eval harness ready (no live misses yet)

- **Context:** Phase 2 K8/K9. Extract route lives on Shlok’s branch; main fixtures
  are text stand-ins (`document.txt`), while `/api/extract` requires multipart
  `image`.
- **Decision:** `npm run eval` always schema-validates `expected.json`. Live
  Gemini scoring runs only when the extract URL is up **and** the fixture folder
  has an image. Until then, no field-level AI mistakes to log — start appending
  rows above when live eval reports mismatches.
- **Source / why:** Parallel Phase 2; fake fixtures only (never real pay stubs).
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
  shared contract. Stub signatures for `computeMonthStatus`, `mariaEvidence`, and
  `<ProofPacket />` are importable but unimplemented.
- **Source / why:** Phase 0 plan; README core data shape.
- **Owners:** Kanav

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
