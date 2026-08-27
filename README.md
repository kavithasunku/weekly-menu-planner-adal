# MenuMagic 🍽️

> **AI-powered weekly meal planner** — transforms your family's dietary needs, schedule, and preferences into a personalized, ready-to-shop menu in under 60 seconds.

**Team:** Kavita Sunku · `kavithasunku@gmail.com`
**Date:** February 2026

---

## Problem Statement

Busy families and individuals spend an average of 45 minutes per week just deciding what to cook — only to end up with wasted groceries, repeated meals, and the dreaded "what's for dinner?" question. Existing meal-planning tools are either too generic (ignoring dietary needs, family size, kids' preferences) or too complex to actually use.

MenuMagic solves this by combining AI menu generation with a hyper-personalized preference system. In three short steps — tell us your family composition, your weekly schedule, and your dietary preferences — and our AI (powered by GPT-4o) generates a complete, structured weekly menu with full recipes, calorie counts, and an auto-generated grocery list.

---

## Core Features

1. **Multi-Step Preference Wizard** — 3-step form capturing family size (adults + children with ages), scheduling constraints (busy days, preferred cooking time), and dietary/cuisine preferences with free-text notes.
2. **AI Menu Generation** — GPT-4o generates a 5-day structured weekly menu respecting all user preferences. Meals are ordered Breakfast → Lunch → Dinner → Snacks, displayed horizontally for easy scanning.
3. **Recipe Detail Modal** — Click any meal card to open a full recipe with scaled ingredient quantities, step-by-step instructions, and nutritional info (calories, protein, carbs, fat) per serving.
4. **Drag-and-Drop Rescheduling** — Swap meals between days by dragging. Time estimates update dynamically after every swap.
5. **Auto-Generated Grocery List** — Categorised grocery list rendered below the weekly menu.
6. **Favourite Dishes** — Heart icon on meal cards lets users save specific dishes for future personalisation.
7. **Progressive Save / Magic Link Auth** — Generate menus without signing in. When you choose to save, a magic link email is sent (NextAuth v5 + Resend). On return, your session is restored and the menu is saved to PostgreSQL via Prisma.
8. **Sample Plan** — `/sample-plan` route shows a fully-designed example menu so you can preview the product without generating a menu.
9. **Saved Menus Dashboard** — Authenticated users can retrieve and view previously saved menus.
10. **One-Click Instacart Shopping** — "Shop on Instacart" button opens a pre-filled Instacart cart with the full grocery list.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 |
| AI | Vercel AI SDK + OpenAI GPT-4o |
| Database | PostgreSQL via Supabase + Prisma ORM 7 |
| Auth | NextAuth v5 (Magic Link + Google OAuth) |
| Deployment | Vercel |

---

## Route Structure

```
/                           → Public landing page
/planner                    → Multi-step planner + AI-generated results
/sample-plan                → Static sample menu (no auth required)

/api/generate-menu          → POST  — AI menu generation (GPT-4o)
/api/menus                  → GET / POST — list or save menus
/api/menus/[id]             → GET / PATCH / DELETE — individual menu
/api/menus/[id]/swap        → PATCH — persist meal swap position
/api/recipes/favorites      → POST  — add favourite recipe
/api/recipes/favorites/[id] → DELETE — remove favourite recipe
/api/instacart              → POST  — generate Instacart shopping link
/api/users/profile          → GET / PUT — user profile management
/api/auth/[...nextauth]     → NextAuth v5 magic-link authentication
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Supabase recommended)
- OpenAI API key
- Resend API key (for magic link emails)

### Installation

```bash
git clone <repo-url>
cd weekly-menu-planner-adal
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
OPENAI_API_KEY=           # OpenAI API key for menu generation
DATABASE_URL=             # Supabase PostgreSQL pooled connection string (with ?pgbouncer=true)
DIRECT_URL=               # Supabase direct connection string (for Prisma migrations)
AUTH_SECRET=              # NextAuth secret (openssl rand -base64 32)
AUTH_RESEND_KEY=          # Resend API key for magic link emails
AUTH_GOOGLE_ID=           # Google OAuth client ID
AUTH_GOOGLE_SECRET=       # Google OAuth client secret
INSTACART_API_KEY=        # Instacart Developer Platform API key
NEXTAUTH_URL=             # Your deployment URL (e.g. https://menumagic.vercel.app)
```

### Database Setup

```bash
npx prisma migrate dev
npx prisma generate
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment (Vercel)

1. Push your repo to GitHub and import it into [Vercel](https://vercel.com).
2. Add all environment variables from above in the Vercel project settings.
3. Set `DATABASE_URL` to a **pooled** Supabase connection string with `?pgbouncer=true&connection_limit=1` appended.
4. Deploy — Vercel runs `prisma generate` and `next build` automatically.
5. Update `NEXTAUTH_URL` and your Google OAuth callback URLs to your production domain.

---

## Links

- **Live Demo:** *(Add your Vercel deployment URL)*
- **GitHub:** *(Add your GitHub repo URL — ensure it is Public)*
