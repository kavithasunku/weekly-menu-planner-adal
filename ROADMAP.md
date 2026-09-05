# Roadmap

Feature ideas and future work. Not commitments or a sprint plan — just a place to park things so they don't get lost.

## Bugs

- After menu is generated, if I click on the "Log in" button on top, it logs in and takes me back to recipe generation page. At that point I might not get the same meu again.


## Ideas

- (add new ideas here as one-line bullets, dated)

- 2026-08-28: Personal recipe library to inspire AI generation (converging with favorites-as-library, below).
- 2026-08-28: Mobile-friendly redesign — stepper, results grid, touch alternative to drag-and-drop swap.
- 2026-08-28: Instacart checkout experience (Instacart's API integration exists - make it to work
- 2026-08-31: Name/rename saved menus — backend (`PATCH /api/menus/[id]`) already supports it, needs UI.
- 2026-09-01: For child meals, if the selection is Toddler (1-3), add additional feature to ask if AI should suggest separate menu for the toddler based on suggestion for the parents. Prompt needs to be adjusted for this.
- 2026-09-01: Replace any of the menu items by items from a previously saved menu item.
- 2026-09-01: Make this app into an iPhone app.
- 2026-09-05: Evals for the various features built

## Planned

## In Progress

- Stripe checkout — no paid tier defined yet; the usage quota exists to gate against once there is one.

## Done

- Weekly Prep Plan: global, AI-generated make-ahead task list (separate from and alongside the grocery list, not tied to individual meals) grouped into Chop & Prep / Marinate / Soak & Sprout / Ferment / Cook Ahead, each task with an estimated time and suggested day. Checkable in the UI (not yet persisted across reloads). Shown in `ResultsStep` and the `/sample-plan` marketing page.
- Replace-a-meal ("Fetch from Favorites" in `MealModal`): deterministic pull from the user's `FavoriteRecipe` library only, no AI call. Matches current Preferences (cuisine, diet) and Schedule (cooking time/busy day) selections; favorites are tagged with cuisines/diets at save time. Signed-in only, preview/confirm before overwriting the slot. Not yet covered by tests.
- Monetization gating: lifetime cap of 7 free generations (guest cookie + signed-in DB count), `ADMIN_EMAILS` bypass, low-balance warning banner. Sign-in only required to save/favorite, not to generate.
- Current-menu + My Menus: `SavedMenu.isCurrent` (mutually exclusive), `/menus` list page, `/planner?menuId=` to reopen a saved menu.
- Secrets hardening: fixed `.env.example`/`.gitignore` drift, renamed `RESEND_API_KEY`→`AUTH_RESEND_KEY` (was silently broken), Vercel Sensitive tier for real secrets, confirmed GitHub secret scanning is on.
- Test suite + CI: Vitest unit/integration tests for the gating logic, GitHub Actions `test` (every push) + `smoke-test` (post-deploy, zero-AI-cost) workflows.
