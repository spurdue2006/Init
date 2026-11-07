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
