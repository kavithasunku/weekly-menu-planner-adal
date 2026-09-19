# Roadmap

Feature ideas and future work. Not commitments or a sprint plan — just a place to park things so they don't get lost.

## Bugs

- After menu is generated, if I click on the "Log in" button on top, it logs in and takes me back to recipe generation page. At that point I might not get the same meu again.

## Evals

- No repeated menu items for 2 weeks in a row.
- Does it adhere to the instructions given in the free text section
- Do the prep suggestions make sense

## Ideas

- (add new ideas here as one-line bullets, dated)

- 2026-08-28: Personal recipe library to inspire AI generation (converging with favorites-as-library, below).
- 2026-08-28: Mobile-friendly redesign — stepper, results grid, touch alternative to drag-and-drop swap.
- 2026-08-28: Instacart checkout experience (Instacart's API integration exists - make it to work
- 2026-08-31: Name/rename saved menus — backend (`PATCH /api/menus/[id]`) already supports it, needs UI.
- 2026-09-01: For child meals, if the selection is Toddler (1-3), add additional feature to ask if AI should suggest separate menu for the toddler based on suggestion for the parents. Prompt needs to be adjusted for this.
- 2026-09-01: Make this app into an iPhone app.
- 2026-09-05: Evals for the various features built
- 2026-09-05: For the grocery list categorize it as items to purchase in walmart vs Indian store for example
- 2026-09-05: shareable grocery list and menu

## Planned

## In Progress

- Stripe checkout — no paid tier defined yet; the usage quota exists to gate against once there is one.

## Done

- Replace-a-meal from a previously saved menu ("Fetch from Saved Menus" in `MealModal`, `POST /api/menus/past-meals`): scans the 25 most recent `SavedMenu` records, pulls meals of the same type, and filters them against the current Preferences/Schedule selections using each source menu's own `plannerState` diets as tags. Cuisine deliberately does *not* filter — these are the user's own saved meals, so pulling an Italian dish into an Indian week is a valid choice. Diet matches permissively (overlap on one tag is enough, untagged menus count as unrestricted) since tagging coverage is patchy. Excludes the menu being edited, de-dupes dishes that recur week to week (most recent menu wins), and shows the source menu name + day on the candidate. Deterministic — no AI call. Signed-in only, preview/confirm before overwriting the slot.
- Weekly Prep Plan: global, AI-generated make-ahead task list (separate from and alongside the grocery list, not tied to individual meals) grouped into Chop & Prep / Marinate / Soak & Sprout / Ferment / Cook Ahead, each task with an estimated time and suggested day. Checkable in the UI (not yet persisted across reloads). Shown in `ResultsStep` and the `/sample-plan` marketing page.
- Replace-a-meal ("Fetch from Favorites" in `MealModal`): deterministic pull from the user's `FavoriteRecipe` library only, no AI call. Honours the current Schedule (cooking time/busy day) and diet selections; cuisine is not applied, so favorites from any cuisine stay pickable. Favorites are still tagged with cuisines/diets at save time. Signed-in only, preview/confirm before overwriting the slot. Filtering logic shared with "Fetch from Saved Menus" via `src/lib/meal-candidates.ts` and covered by tests.
- Monetization gating: lifetime cap of 7 free generations (guest cookie + signed-in DB count), `ADMIN_EMAILS` bypass, low-balance warning banner. Sign-in only required to save/favorite, not to generate.
- Current-menu + My Menus: `SavedMenu.isCurrent` (mutually exclusive), `/menus` list page, `/planner?menuId=` to reopen a saved menu.
- Secrets hardening: fixed `.env.example`/`.gitignore` drift, renamed `RESEND_API_KEY`→`AUTH_RESEND_KEY` (was silently broken), Vercel Sensitive tier for real secrets, confirmed GitHub secret scanning is on.
- Test suite + CI: Vitest unit/integration tests for the gating logic, GitHub Actions `test` (every push) + `smoke-test` (post-deploy, zero-AI-cost) workflows.
