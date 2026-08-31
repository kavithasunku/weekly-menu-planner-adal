# CLAUDE.md

Guidance for working in this repo. This is a real, deployed product (not a demo) — treat the database and production deploys accordingly.

## Database / Prisma

- Before running `prisma migrate dev` or anything that touches the schema, run `npx prisma migrate status` first. If it reports drift, **do not** let `migrate dev` resolve it — it will offer to reset the entire `public` schema, which drops all data.
- To reconcile drift safely (schema/DB out of sync with migration history, e.g. from a manual `ALTER TABLE`/`CREATE INDEX` run outside Prisma): use `prisma db pull` to see the DB's real state, hand-write a migration matching it, then `prisma migrate resolve --applied <name>` to record it in history without re-executing SQL that's already true. Only add genuinely new changes as a normal `migrate dev` once `migrate status` is clean again.
- Never run `prisma migrate reset` against this database without explicit user confirmation — it drops all data.

## Testing

- `npm test` runs the Vitest suite (mocked, no real DB/OpenAI calls). Test files live in colocated `__tests__/` folders next to the code they cover.
- CI: `.github/workflows/test.yml` runs the suite on every push/PR. `.github/workflows/smoke-test.yml` fires on Vercel deployment and hits the live URL with two free requests (a guest over the free-generation limit, and an unauthenticated `/api/menus` call) expecting fast `429`/`401` responses — deliberately designed to never trigger a real OpenAI call.
- Vercel's Deployment Protection sits in front of every deployment URL; the smoke test authenticates past it using the `VERCEL_AUTOMATION_BYPASS_SECRET` GitHub secret sent as an `x-vercel-protection-bypass` header.

## Secrets

- Real secrets live in `.env` locally (git-ignored) and Vercel's Environment Variables in production — never in code or committed files.
- `.env.example` is the template and *is* tracked in git (`.gitignore` has an explicit `!.env.example` exception to the `.env*` rule) — keep it in sync with whatever vars the app actually reads.
