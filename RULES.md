# HIP Work Requirements — Product Rules

**Source of truth for this app.** Cursor / Claude / teammates must treat this file as
authoritative for Indiana HIP work-requirement behavior. **Do not invent thresholds,
exemptions, dates, or reporting rules** that are not written here or linked below.
If something is unclear, link to FSSA — do not guess.

> **Disclaimer:** 80 Hours is **not** an official FSSA tool. It helps people organize
> evidence. We never determine eligibility or say someone “is exempt.” Always report
> through official FSSA channels.

---

## Official sources (cite these)

| Source | URL |
|--------|-----|
| FSSA HIP Work Requirements hub | https://www.in.gov/fssa/hip/hip-work-requirements/ |
| Information for HIP Members (FAQs, $580 path, exemptions) | https://secure.in.gov/fssa/hip/hip-work-requirements/info-for-hip-members |
| FSSA press release (6 Jul 2026) — local copy | [`docs/sources/HIPWorkRequirementsPressRelease.pdf`](docs/sources/HIPWorkRequirementsPressRelease.pdf) |
| Same press release (official) | https://secure.in.gov/fssa/hip/files/HIPWorkRequirementsPressRelease.pdf |
| Benefits Portal | https://FSSABenefits.IN.gov |
| Member / partner info hub | https://myfssa.in.gov |
| Pre-screening tool (from member page) | Linked from the Information for HIP Members page |

When product copy or `lib/rules.ts` changes, update this file **and** log the change in
[`DECISIONS.md`](DECISIONS.md) if it overrides earlier AI or assumptions.

---

## Frozen product numbers (MVP)

These are the only numbers the app may hard-code for meeting a month:

| Constant | Value | Basis |
|----------|-------|--------|
| Hours path | **≥ 80 hours / calendar month** | Press release; FSSA hub |
| Earnings path | **≥ $580 / month** | Press release; member FAQ confirms `$7.25 × 80 = $580` |
| Min wage used for conversion | **$7.25 / hour** | Member FAQ: gross ÷ 7.25 → hour-equivalent |
| School path | **At least half-time** school or apprenticeship | Press release; FSSA hub |
| Lookback length | **3 consecutive months** before application month | Press release; Indiana law / member FAQ |
| Enforcement start | **January 1, 2027** | Press release; FSSA hub |
| Age band (subject if not exempt) | **19–64** | Press release; FSSA hub |

**Either/or:** meeting **80 hours** *or* **$580 earnings** satisfies the requirement
(member FAQ). Half-time school / apprenticeship also satisfies. Activities toward
80 hours **may be combined**.

---

## Who must meet requirements

Adults enrolled in HIP must meet work requirements if **all** are true (FSSA hub /
member page):

- Ages **19–64**
- **Not** pregnant
- **Not** enrolled in or eligible for Medicare

Limited benefits such as emergency-services-only or family-planning-only are **not**
subject to the requirements (member FAQ).

---

## Qualifying activities (count toward 80 hours)

From FSSA materials (combine freely within a month):

- Employment / work
- Volunteering / community service
- Job training / work programs
- Internships
- Part-time education / classes (in-person or online; accredited higher ed, high school, GED — member FAQ)
- Apprenticeship (half-time enrollment can meet the whole requirement)

### Explicitly does **not** count (member FAQ)

- Employment search conducted at a non-profit
- Informal help for family/friends’ chores as “volunteer” hours  
  (significant caregiving for a child under 14 or a disabled person may instead be an
  **exemption** or countable caregiving hours for a non-relative non-household
  caregiver — see FAQ; product must not invent edge cases)

### Income / hours nuances (member FAQ)

- **Paid time off** counts in the **income** calculation; **unpaid** leave does **not**
  add hours.
- To convert income → hour-equivalent: `gross / 7.25` (example: `$507.50 / 7.25 ≈ 70`
  hours toward the 80-hour path).
- MAGI-countable income (including taxable income and Social Security) can count toward
  the earnings path.
- Self-employment: document hours and/or earnings via tax returns or other business docs.

---

## Three-month lookback

From press release + member FAQ:

- Apply in **January 2027** → must show compliance for **October, November, December 2026**.
- Apply in a later month → three consecutive months **immediately prior** to the
  application month.
- Members already on HIP before 1/1/2027: lookback relative to last redetermination
  (any 3 months since last redetermination — see official FAQ examples). **MVP UI
  may focus on monthly progress for a selected month; do not invent household-level
  redetermination logic.**

---

## Exemptions (suggest only — never assert)

FSSA lists month-level exemptions when, **for at least one day that month**, the person:

- Is under 26 and formerly in foster care
- Is a member of a federally recognized Tribe
- Is a parent/caregiver of a child age **13 or younger**
- Is a caregiver of a person with a disability
- Is a veteran with a **100%** disability rating
- Is pregnant, or ≤ **12 months** since pregnancy ended
- Is in jail/prison or was released in the last **90 days**
- Is following SNAP or TANF work rules
- Is in a drug or alcohol treatment program
- Is medically frail / special medical needs (blind/disability, SUD, serious mental
  health condition, serious physical/intellectual/developmental disability, or other
  serious/complex medical condition)
- Other exemptions may also apply (FSSA may update)

Press release also summarizes: pregnancy, caregiving, medical frailty, SUD treatment,
recent release from incarceration — keep contact info updated for verification.

### Product language (hard rule)

- UI copy may say someone **might** be exempt / **should check** FSSA.
- **Never** say: “You are exempt,” “You meet HIP requirements,” or “You will keep coverage.”
- Always deep-link the official **Pre-Screening Tool** and FSSA pages.
- Medically frail is determined by the **State**, not by this app (member FAQ).

---

## Reporting & verification (context for PDF packet)

- Compliance reviewed **quarterly**; state starts with wage/program data; if unverifiable,
  member gets a notice asking for documentation (press release / FAQ).
- Report changes in work, school, health, or family within **10 days** via Benefits
  Portal, phone, mail, or DFR office (member FAQ).
- Non-compliance: coverage can stop; member must reapply; Marketplace financial help
  may be unavailable during that time (member FAQ wording).
- Our PDF is a **prep packet** for the member to use with FSSA — not a filing.

Contacts for reporting (cite, don’t scrape secrets):

- Benefits Portal: https://FSSABenefits.IN.gov  
- Mail: FSSA Document Center, PO Box 1810, Marion, IN 46952  
- Phone: DFR 1-800-403-0864  

---

## How this maps into code

| Concern | Location |
|---------|----------|
| Evidence shape (frozen) | `lib/types.ts` |
| Month totals, pathways, at-risk | `lib/rules.ts` → `computeMonthStatus()` |
| Demo seed | `lib/seed/maria.ts` |
| Proof packet PDF | `lib/pdf/ProofPacket.tsx` |
| Extract validation | Zod `EvidenceSchema` + `/api/extract` |

### `metBy` values (app)

- `"hours"` — attributed qualifying hours for the month ≥ 80  
- `"earnings"` — attributed gross for the month ≥ 580  
- `"school"` — evidence marked half-time school / apprenticeship  
- `"none"` — otherwise; `atRisk` if unmet and few days remain in the month  

Cross-month pay periods (e.g. Oct 28–Nov 10) are **split by calendar month** in the
rules engine (product decision; document overrides in `DECISIONS.md`).

---

## Agent / teammate checklist

Before changing rules, thresholds, exemptions UI, or proof-packet legal copy:

1. Re-read this file and the linked FSSA sources.  
2. Prefer quoting FSSA over paraphrasing.  
3. If FSSA and this file disagree, **update this file from FSSA** and note it in
   `DECISIONS.md` — do not silently code a third number.  
4. Add / update Vitest coverage for any numeric change in `lib/rules.ts`.  
5. Keep privacy: no server storage of pay stubs; redact SSN / account numbers from model output.
