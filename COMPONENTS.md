# MenuMagic — Next.js Component Reference
**Date:** February 2026 | **Framework:** Next.js 16 (App Router) | **Styling:** Tailwind CSS v4

---

## Overview

MenuMagic is a full-stack AI-powered weekly meal planner. All UI is built with Next.js App Router, React Server and Client Components, and a warm earth-tone design system (`#FDFBF7`, `#AF8F7C`, `#3A332C`).

---

## Pages (`src/app/`)

### `page.tsx` — Landing Page
**Type:** Server Component

The public-facing marketing page.

| Section | Description |
|---------|-------------|
| **Navigation** | Sticky glassmorphism nav with `UserMenu` and Features anchor link |
| **Hero** | Full-width headline, tagline, dual CTAs ("Get Started For Free" / "View Sample Plan"), and trust signal copy |
| **Features Grid** | 5 feature cards (Family, Schedule, Meal Structure, Dietary, Kid-Approved) + 1 CTA card using gradient styling |
| **Footer** | Dark minimal footer with Privacy, Terms, Contact links |

---

### `planner/page.tsx` — Planner Page
**Type:** Client Component (`"use client"`)

The core user journey — a 3-step wizard that collects preferences and generates a personalized weekly menu.

**State managed:**
- `currentStep` (1–3), `formData: PlannerState`, `generatedMenu: AIGeneratedMenu`
- `isGenerating`, `isSaving`, `saveSuccess`, `isFavorite`, `savedMenuId`
- `generateError` — typed error object (`rate_limit | sign_in_required | generic`)

**Key behaviors:**
- **Guest support:** Generates menus without login; stores `pendingMenu` in `localStorage`
- **Auto-save:** When user authenticates after guest generation, auto-saves pending menu to DB
- **Multi-select diets:** `toggleDiet()` handles "none" exclusivity and array-based multi-select
- **Merged generate step:** Step 3 "Continue" button becomes "Generate Menu" — no extra click
- **Error banners:** Styled per error type (rate limit = amber, sign-in prompt = warm, generic = red)

**Step rendering:**
```
Step 1 → FamilyStep
Step 2 → ScheduleStep
Step 3 → PreferencesStep  (Next = Generate Menu)
Complete → ResultsStep
```

---

### `login/page.tsx` — Login Page
**Type:** Client Component

Dedicated authentication page with two sign-in methods.

| Method | Implementation |
|--------|---------------|
| **Google OAuth** | `signIn("google", { callbackUrl: "/planner" })` via Auth.js v5 |
| **Magic Link** | `signIn("resend", { email, redirect: false })` — shows "check inbox" state on success |

Design: centered card on soft background with animated loading states per button, error handling, and email confirmation screen.

---

### `sample-plan/page.tsx` — Sample Plan Page
**Type:** Server Component

Static showcase of a pre-generated menu, used as a demo for unauthenticated visitors.

---

## Planner Components (`src/components/planner/`)

### `FamilyStep.tsx`
**Step 1** — Collects household composition.

| Input | Control |
|-------|---------|
| Adults | `+`/`-` counter (min 1) |
| Children | `+`/`-` counter (min 0) |
| Kids' ages | Per-child dropdown (Toddler / Young / Pre-teen / Teen) — shown only if kids > 0 |
| Total servings | Live-calculated summary card |

Props: `formData`, `updateForm`, `updateKidsCount`, `updateKidAge`, `totalServings`

---

### `ScheduleStep.tsx`
**Step 2** — Captures weekly schedule constraints.

| Input | Control |
|-------|---------|
| Busy days | 7 pill toggle buttons (Mon–Sun), multi-select |
| Cooking time | 5-option grid (15 / 30 / 45 / 60 / 90 min), single-select |

Props: `formData`, `toggleBusyDay`, `updateForm`

---

### `PreferencesStep.tsx`
**Step 3** — Taste preferences and dietary requirements.

| Input | Control |
|-------|---------|
| Meals to plan | Pill toggles: Breakfast, Lunch, Dinner, Snacks (multi-select) |
| Favorite cuisines | Pill toggles: Italian, Mexican, Asian, American, Mediterranean, Indian (multi-select) |
| Dietary restrictions | 2-column grid: None, Vegetarian, Vegan, Gluten-free, Keto, Low-carb (multi-select, "None" resets others) |
| Notes | Free-text textarea for allergies, preferences, budget constraints |

Props: `formData`, `toggleMeal`, `toggleCuisine`, `toggleDiet`, `updateForm`

---

### `ResultsStep.tsx`
**Step 4 (Results)** — Displays the AI-generated weekly menu with full interactivity.

**Features:**

| Feature | Description |
|---------|-------------|
| **Weekly Calendar Grid** | CSS Grid with days as rows, meal types as columns. Horizontally scrollable on mobile |
| **Drag & Drop** | Native HTML5 drag API — drag meals between any day/slot to rearrange. Visual drop target highlight |
| **Busy Day Conflict Detection** | Flags meals on busy days that exceed the cooking time budget with `AlertTriangle` indicator |
| **Meal Detail Modal** | Click any meal to open `MealModal` with full recipe, scaled nutrition, and ingredients |
| **Grocery List** | Categorized shopping list grouped by food category |
| **Instacart Integration** | "Shop on Instacart" button calls `/api/instacart` to generate a pre-filled cart URL |
| **Save Menu** | Persists to DB via `POST /api/menus`; shows spinner → "Saved!" confirmation |
| **Favorite Toggle** | Heart button — marks menu as favorite via `PATCH /api/menus/:id` |
| **Auth Modal** | Inline sign-in prompt (Google + magic link) when unauthenticated user tries to save |
| **Start Over** | Resets all state back to Step 1 |

Props: `formData`, `generatedMenu`, `onMenuSwap`, `savedMenuId`, `onReset`, `isSaving`, `saveSuccess`, `sessionStatus`, `onSaveClick`, `isFavorite`, `onFavoriteToggle`

---

### `MealModal.tsx`
**Recipe Detail Modal** — Full-screen overlay with complete recipe information.

| Section | Content |
|---------|---------|
| **Header** | Meal type icon + name, sticky on scroll |
| **Favorite button** | Saves/removes individual recipe via `POST/DELETE /api/recipes/favorites` |
| **Replace this meal** | Two deterministic (no-AI) sources for swapping the slot — *Fetch from Favorites* (`POST /api/menus/replace-meal`, the user's `FavoriteRecipe` library) and *Fetch from Saved Menus* (`POST /api/menus/past-meals`, meals inside previously saved menus, attributed with source menu name + day). Both honour the current diet, cooking-time and busy-day selections but deliberately ignore cuisine, so the user's own saved meals stay pickable in any week; candidates are browsed in a carousel and previewed before confirming |
| **Timing** | Prep time + cook time |
| **Nutrition panel** | Calories, protein, carbs, fat — **scaled to the number of adults** |
| **Ingredients** | Scaled amounts (multiplied by adult count) |
| **Method** | Numbered step-by-step cooking instructions |

**Auth-aware:** Prompts sign-in if an unauthenticated user tries to favorite a recipe or fetch a replacement.

Props: `recipe`, `adults`, `onClose`, `sessionStatus`, `sourceMenuId`, `sourceDay`, `onRequestAuth`, `isDiabeticFriendly`, `replaceContext`, `onReplace`

---

## Auth Components (`src/components/auth/`)

### `UserMenu.tsx`
**Navigation authentication widget** — used in both Landing and Planner navbars.

| State | Rendered output |
|-------|----------------|
| Loading | Pulsing skeleton circle |
| Unauthenticated | "Log In" pill button → `/login` |
| Authenticated | Avatar circle with user initials, opens dropdown |

**Dropdown menu:** User name + email, "My Plans" link, "Log Out" button (with `signOut({ callbackUrl: "/" })`). Closes on outside click via `useRef` + `mousedown` listener.

---

## API Routes (`src/app/api/`)

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/generate-menu` | POST | Optional (guest allowed) | Calls OpenAI to generate a full weekly menu from `PlannerState` |
| `/api/menus` | GET | Required | List all saved menus for current user |
| `/api/menus` | POST | Required | Save a new generated menu |
| `/api/menus/[id]` | GET | Required | Get a specific saved menu |
| `/api/menus/[id]` | PATCH | Required | Update menu (name, isFavorite) |
| `/api/menus/[id]` | DELETE | Required | Delete a saved menu |
| `/api/menus/[id]/swap` | PATCH | Required | Swap two meals within a saved menu |
| `/api/recipes/favorites` | GET | Required | List user's favorite recipes |
| `/api/recipes/favorites` | POST | Required | Save a recipe as favorite |
| `/api/recipes/favorites/[id]` | DELETE | Required | Remove a recipe from favorites |
| `/api/users/profile` | GET/PATCH | Required | Get or update user profile |
| `/api/instacart` | POST | Optional | Generate Instacart shopping cart URL from grocery list |
| `/api/auth/[...nextauth]` | ALL | — | Auth.js v5 handler (Google OAuth + Resend magic link) |

---

## Lib & Config (`src/lib/`)

| File | Purpose |
|------|---------|
| `prisma.ts` | Prisma client singleton using `@prisma/adapter-pg` + PgBouncer-compatible pool. Strips `?pgbouncer=true` before passing to `pg.Pool` |
| `rate-limit.ts` | DB-based rate limiting utility — checks/increments `MenuGenerationHistory` counts |
| `prompts/menu-generation.ts` | OpenAI system prompt template for structured menu generation |

---

## Types (`src/types/planner.ts`)

Core domain types:

```typescript
PlannerState       // User inputs (adults, kids, meals, cuisines, diets, schedule, notes)
AIGeneratedMenu    // Full weekly menu from OpenAI (weeklyMenu[], groceryList[])
MealRecipe         // Individual recipe (name, ingredients, steps, nutrition, timing)
MealType           // "breakfast" | "lunch" | "dinner" | "snacks"
CuisineType        // "italian" | "mexican" | "asian" | "american" | "mediterranean" | "indian"
DietType           // "none" | "vegetarian" | "vegan" | "gluten-free" | "keto" | "low-carb"
```

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL via Supabase |
| ORM | Prisma 7 + `@prisma/adapter-pg` (driver adapters, PgBouncer-compatible) |
| Auth | Auth.js v5 (Google OAuth + Resend magic link) |
| AI | OpenAI GPT-4o |
| Deployment | Vercel |
| Icons | Lucide React |
