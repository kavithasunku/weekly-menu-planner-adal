# Roadmap

Feature ideas and future work. Not commitments or a sprint plan — just a place to park things so they don't get lost.

## Ideas

- (add new ideas here as one-line bullets, dated)

- 2026-08-27: Weekend prep tips section alongside the shopping list.
- 2026-08-28: Personal recipe library to inspire AI generation (converging with favorites-as-library, below).
- 2026-08-28: Mobile-friendly redesign — stepper, results grid, touch alternative to drag-and-drop swap.
- 2026-08-28: Walmart + Instacart checkout experience (Instacart's API integration exists; Walmart doesn't).
- 2026-08-31: Name/rename saved menus — backend (`PATCH /api/menus/[id]`) already supports it, needs UI.

## Planned

## In Progress

- Stripe checkout — no paid tier defined yet; the usage quota exists to gate against once there is one.

## Done

- Replace-a-meal ("Try Something Else" in `MealModal`): checks the user's `FavoriteRecipe` library first (free), falls back to a metered AI call with preview/confirm before overwriting the slot. Not yet covered by tests.
- Monetization gating: lifetime cap of 7 free generations (guest cookie + signed-in DB count), `ADMIN_EMAILS` bypass, low-balance warning banner. Sign-in only required to save/favorite, not to generate.
- Current-menu + My Menus: `SavedMenu.isCurrent` (mutually exclusive), `/menus` list page, `/planner?menuId=` to reopen a saved menu.
- Secrets hardening: fixed `.env.example`/`.gitignore` drift, renamed `RESEND_API_KEY`→`AUTH_RESEND_KEY` (was silently broken), Vercel Sensitive tier for real secrets, confirmed GitHub secret scanning is on.
- Test suite + CI: Vitest unit/integration tests for the gating logic, GitHub Actions `test` (every push) + `smoke-test` (post-deploy, zero-AI-cost) workflows.
