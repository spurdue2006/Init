# Contributing

## Never push straight to `main`

1. Pull latest `main`.
2. Create a branch: `git checkout -b <type>/<short-name>`  
   Examples: `feat/extract-api`, `fix/rules-cross-month`, `chore/phase-0-scaffold`
3. Commit on the branch.
4. Push the branch and open a **Pull Request** into `main`.
5. Wait for CI (when present) + a quick look from the other teammate when touching
   shared files (`lib/types.ts`, `RULES.md`).
6. Merge via PR — do **not** `git push origin main` with local-only work.

If you accidentally committed on `main`, move the commits to a branch before pushing:

```bash
git branch backup/my-work
git checkout -b feat/my-work
# open PR from feat/my-work; reset local main to origin/main if needed
```

## Ownership (reduce merge conflicts)

| Area | Owner | Notes |
|------|--------|--------|
| `RULES.md`, `DECISIONS.md`, `lib/rules.ts`, Vitest rules tests, fixtures/eval, CI, `lib/pdf/**`, `lib/seed/**` | **Kanav** | Domain + proof packet |
| `app/**` UI screens, `/api/extract`, confirm/dashboard/exempt, device storage, `messages/**`, Twilio stretch | **Shlok** | Product UI + extract |
| `lib/types.ts` | **Both — freeze** | Change only with explicit agreement; update `DECISIONS.md` |

Prefer not to edit the other person’s files on the same day without a quick Slack/text
heads-up. If you must touch a shared file, keep the diff tiny and call it out in the PR.

## Agent / Cursor rules

Project rules live in [`.cursor/rules/`](.cursor/rules/). They tell Cursor agents to:

- Read `RULES.md` before changing HIP logic or legal copy
- Never invent thresholds or claim exemption/eligibility
- Use branches + PRs; respect ownership

## Before opening a PR

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Privacy

- Fake fixtures only in demos — never commit real pay stubs.
- Do not log or persist uploaded images on a server (MVP: in-memory extract + localStorage).
