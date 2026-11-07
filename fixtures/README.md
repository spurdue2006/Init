# Fake extract fixtures (Gemini-ready)

Offline fixtures for future `npm run eval` / Gemini `/api/extract` accuracy checks.

- **Provider:** Google Gemini (`@google/genai`, `GEMINI_API_KEY`) — not Anthropic.
- **FAKE ONLY.** Never put real pay stubs, SSNs, or account numbers here.
- Each folder has a text stand-in document + `expected.json` shaped like `Evidence`.
- Validate expected rows with Zod `EvidenceSchema` from `lib/types.ts`.

Eval wiring lives in `scripts/eval.ts` (stub until extract API exists).
