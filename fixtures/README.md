# Fake extract fixtures (Gemini-ready)

Offline fixtures for `npm run eval` / Gemini `/api/extract` accuracy checks.

- **Provider:** Google Gemini (`@google/genai`, `GEMINI_API_KEY`) — not Anthropic.
- **FAKE ONLY.** Never put real pay stubs, SSNs, or account numbers here.
- Each folder under `fixtures/*/` has:
  - `expected.json` — oracle shaped like `Evidence` (Zod `EvidenceSchema`)
  - `document.txt` — human-readable stand-in
  - **image** (`document.png` / `document.jpg`) — required for **live** Gemini scoring
- Schema validation always runs. Live POST to `/api/extract` runs only when the
  dev server is up **and** the fixture folder contains an image.

```bash
npm run dev          # terminal 1
npm run eval         # terminal 2 — schema + live field compare
```
