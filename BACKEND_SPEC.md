# MenuMagic - Backend Specification Document

**Version:** 1.3  
**Date:** February 24, 2026  
**Status:** Active — Multi-Diet Support, Favourite Menu Toggle & UX Streamlining

---

## 1. Executive Summary

### 1.1 Purpose
This document outlines the backend architecture, database design, and API specifications for **MenuMagic** — a weekly menu planner web application that generates personalized meal plans based on family size, schedule, preferences, and dietary requirements.

### 1.2 Scope
- **Frontend:** Next.js 16 (App Router) with React 19 and Tailwind CSS
- **Backend:** Next.js API Routes (Serverless)
- **AI Integration:** OpenAI GPT-4o via Vercel AI SDK (one-shot generation)
- **Database:** PostgreSQL via Supabase
- **Authentication:** Auth.js (NextAuth v5) with Magic Link / Google OAuth
- **Core Interactions:** Interactive drag-and-drop meal swapping and one-click grocery export.

### 1.3 Current Frontend Data Structures

```typescript
// Current PlannerState from frontend
interface PlannerState {
  adults: number;
  kids: number;
  kidsAges: number[];
  meals: MealType[];        // "breakfast" | "lunch" | "dinner" | "snacks"
  cuisines: CuisineType[];  // "italian" | "mexican" | "asian" | "american" | "mediterranean" | "indian"
  diets: string[];          // ["none"] | ["vegetarian", "gluten-free", ...] — multi-select, defaults to ["none"]
  busyDays: string[];       // e.g., ["Monday", "Friday"]
  cookingTime: number;      // minutes (15, 30, 45, 60, 90)
  notes: string;            // free text
}

// AI Response Structure
interface AIGeneratedMenu {
  weeklyMenu: {
    day: string;
    meals: Record<string, MealRecipe>;
  }[];
  groceryList: {
    category: string;
    items: { amount: string; item: string }[];
  }[];
}
```

---

## 2. Features Specification

### 2.1 Authentication & Profile
- **Passwordless Magic Links:** Secure, one-time sign-in links sent via email (Auth.js + Resend).
- **Social Login:** One-click authentication with Google OAuth.
- **Smart Defaults:** User profiles store family size, diet, and cooking preferences for faster planning.
- **Short-Lived Sessions:** JWT sessions expire after 8 hours with hourly token rotation, minimising the window of exposure if a session token is compromised.

### 2.2 Menu Generation (AI-Powered)
- **Structured Planning:** GPT-4o generates full 7-day menus based on the user's specific schedule and constraints.
- **Constraint-Aware:** AI respects "Busy Days" by suggesting low-prep or quick-cook meals.
- **Nutritional Insights:** Each recipe includes calorie and macronutrient (P/C/F) estimates.

### 2.3 Safety Features
- **Input Validation:** Zod schemas validate all incoming data to prevent malformed requests.
- **Error Handling:** Graceful error responses with clear messages for frontend display.
- **Rate Limiting:** Users are limited to **3 menu generations per day** and **3 cart exports per day** to prevent abuse of AI and third-party API endpoints.

### 2.4 Recipe card with nutritional info and ingredient list (v1.0 MVP)
- **Recipe Modal:** Clicking a meal opens a detailed view with ingredients, preparation steps, and nutritional information.
- **Save to Favorites:** Users can save individual recipes to a "Favorites" list for future access, independent of the weekly menu.

### 2.5 Multi-Select Dietary Restrictions (v1.1)
- **Multi-Select:** Users can select one or more dietary restrictions simultaneously (e.g., Vegetarian + Gluten-free).
- **Mutual Exclusion:** Selecting "No restrictions" clears all other choices. Selecting any restriction automatically deselects "No restrictions."
- **AI Enforcement:** All selected restrictions are forwarded to GPT-4o in the prompt as a comma-separated list and enforced for every generated dish.
- **Default:** `["none"]` — no restrictions.

### 2.6 Save Menu as Favourite (v1.1)
- **Heart Toggle:** After a menu is generated, users can tap the ❤️ button adjacent to "Save Menu" to mark the menu as a favourite.
- **Pre-save:** If toggled *before* saving, the `isFavorite: true` flag is included in the initial `POST /api/menus` request body.
- **Post-save:** If toggled *after* saving, a `PATCH /api/menus/[id]` request is issued immediately to update the stored record.
- **Persistence:** The `is_favorite` boolean on `SavedMenu` is indexed for fast favourite-list queries (`@@index([userId, isFavorite])`).

### 2.7 Streamlined Planner Flow (v1.1)
- **3-Step Wizard:** The planner now uses 3 steps only (Family → Schedule → Preferences). The former "Step 4: Generate" confirmation screen has been removed.
- **Inline Generation:** Clicking "Generate Menu" on Step 3 triggers menu generation directly, eliminating one unnecessary navigation click.
- **Loading State:** The button shows a spinner and becomes disabled while the AI call is in-flight; the "Back" button is also disabled during this period.

### 2.8 Interactive Weekly Planner (v1.2 "Wow Factor")
- **Drag-and-Drop Swapping:** Seamlessly move meals between days using a calendar UI.
- **Dynamic Grocery Sync:** The shopping list automatically recalculates in real-time when meals are rearranged.
- **Conflict Indicators:** Visual warnings if a complex recipe is moved to a day the user marked as "Busy."

### 2.9 One-Click Shopping via Instacart (v1.2 "Wow Factor and Optional")
- **Official OAuth Integration:** Uses the Instacart Developer Platform (`connect.instacart.com`) OAuth 2.0 flow. Permissions are scoped to `cart:write` only — no access to payment information or order history.
- **Server-Side Cart Construction:** The export handler builds the cart payload server-side using the Instacart API and returns a short-lived authorisation redirect URL to the client. The client never constructs or handles the cart URL directly.
- **Audit Trail:** Every export event is recorded in `shopping_exports` to enable anomaly detection (e.g., flagging >3 exports per hour from a single account).
- **Intelligent Mapping:** AI maps ingredient names to real-world store categories (e.g., "Dairy," "Produce") before passing the payload to Instacart.

---

## 3. Architecture Overview

### 3.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Next.js)                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Landing   │  │   Planner   │  │    Menu     │  │   Recipe Modal     │  │
│  │    Page     │──│   Wizard    │──│   Results   │  │   (Recipe Detail)  │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          NEXT.JS API ROUTES                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐   │
│  │ /api/auth    │  │ /api/menus   │  │ /api/users   │  │ /api/generate  │   │
│  │  (Auth.js)   │  │   (CRUD)     │  │  (Profile)   │  │   -menu        │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────────┘   │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              EXTERNAL SERVICES                               │
│  ┌─────────────────┐  ┌─────────────────────┐  ┌────────────────────────┐ │
│  │  OpenAI API     │  │   Supabase          │  │   Shopping APIs        │ │
│  │  (GPT-4o)       │  │   (PostgreSQL)      │  │   (Instacart OAuth)    │ │
│  └─────────────────┘  └─────────────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js | 16.x |
| Runtime | Node.js | 20.x |
| Database | PostgreSQL (Supabase) | 15.x |
| ORM | Prisma | 6.x |
| Authentication | Auth.js (NextAuth) | 5.x |
| AI SDK | Vercel AI SDK | 4.x |
| AI Model | OpenAI GPT-4o | - |
| Validation | Zod | 4.x |
| Email | Resend (Magic Links) | - |

### 3.3 Architectural Decisions

#### 3.3.1 Serverless API Routes
- **Decision:** Use Next.js App Router API routes over separate backend
- **Rationale:** 
  - Simplified deployment (Vercel)
  - Shared authentication context
  - Reduced infrastructure complexity for hackathon timeline
  - Frontend and backend in single codebase

#### 3.3.2 Database Choice
- **Decision:** PostgreSQL via Supabase
- **Rationale:**
  - Rich querying capabilities for menu analytics
  - Supabase provides ready-made auth, storage, and real-time features
  - Strong JSON support for flexible recipe/menu storage
  - Free tier sufficient for MVP/hackathon

#### 3.3.3 Authentication Strategy
- **Decision:** Auth.js with Magic Link + Google OAuth; JWT strategy with 8-hour session expiry and hourly token rotation
- **Rationale:**
  - Magic Link eliminates password fatigue (see user request)
  - Google OAuth provides quick sign-in option
  - Auth.js provides unified API across providers
  - Short-lived JWTs (8 h) with hourly rotation cap the window of exposure when sessions are used alongside third-party cart APIs
  - Stateless JWT rotation avoids a session database

#### 3.3.4 Shopping Integration
- **Decision:** Instacart Developer Platform OAuth 2.0 (`connect.instacart.com`), scoped to `cart:write`
- **Rationale:**
  - Official API is more secure than constructing deep-link cart URLs on the client
  - `cart:write` scope ensures the app cannot read payment info or order history
  - Server-side cart construction prevents client-side manipulation of the payload

#### 3.3.5 AI Response Handling
- **Decision:** One-shot `generateObject` with Zod validation (current)
- **Future Consideration:** Streaming UI for perceived performance
- **Rationale:**
  - Simpler implementation for hackathon
  - Structured output ensures UI compatibility
  - Prompt iteration is isolated in `prompt.ts`

---

## 4. Database Schema

### 4.1 Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      User       │       │     Profile     │       │   UserPreference│
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id              │──1:1──│ id              │       │ id              │
│ email           │       │ user_id         │──1:1──│ user_id         │
│ name            │       │ default_adults  │       │ busy_days       │
│ image           │       │ default_kids    │       │ cooking_time    │
│ created_at      │       │ gender          │       │ notes           │
│ email_verified  │       │ location        │       │ updated_at      │
│                 │       │ created_at      │       └─────────────────┘
│                 │       │ last_login_at   │
│                 │       │ updated_at      │
│                 │       └─────────────────┘
└─────────────────┘
        │
        │ 1:N
        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SavedMenu                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ id                                                                           │
│ user_id                                                                       │
│ name                        // e.g., "Week of Feb 23"                      │
│ planner_state (JSONB)       // Stores the PlannerState input                │
│ generated_menu (JSONB)      // Stores the AIGeneratedMenu output            │
│ is_favorite (BOOLEAN)       // Quick access toggle                          │
│ created_at                                                                           │
│ updated_at                                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
        │
        │
        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              GroceryList                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ id                                                                           │
│ saved_menu_id (FK)                                                          │
│ user_id (FK)                                                                │
│ items (JSONB)              // Array of {item, amount, category, checked}   │
│ created_at                                                                           │
│ updated_at                                                                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                            FavoriteRecipe                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ id                                                                           │
│ user_id                                                                       │
│ recipe_data (JSONB)       // Full MealRecipe from AI response              │
│ source_day (STRING)       // Which day this came from                      │
│ source_meal_type (STRING) // e.g., "Breakfast", "Dinner"                   │
│ created_at                                                                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                            ShoppingExport                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ id                                                                           │
│ user_id (FK)                                                                │
│ menu_id (FK)                                                                │
│ provider                    // 'instacart'                                  │
│ ip_address                                                                   │
│ user_agent                                                                   │
│ created_at                                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Detailed Table Definitions

```sql
-- =============================================
-- USERS (Managed by Supabase Auth)
-- =============================================
-- Note: User table is managed by Supabase Auth.
-- We reference auth.users.id in our tables.

-- =============================================
-- PROFILES (Extended user information)
-- =============================================
CREATE TABLE user_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- User Details
    name TEXT,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    location TEXT,
    -- Default Planner Settings
    default_adults INT DEFAULT 2 CHECK (default_adults >= 1),
    default_kids INT DEFAULT 0 CHECK (default_kids >= 0),
    default_meals TEXT[] DEFAULT ARRAY['dinner']::TEXT[],
    default_cuisines TEXT[] DEFAULT ARRAY[]::TEXT[],
    default_diet TEXT DEFAULT 'none',
    avatar_url TEXT,
    -- Timestamps
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- USER_PREFERENCES (Quick access preferences)
-- =============================================
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    busy_days TEXT[] DEFAULT ARRAY[]::TEXT[],
    cooking_time INT DEFAULT 30,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SAVED_MENUS (User-generated weekly menus)
-- =============================================
CREATE TABLE saved_menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    -- Stores the complete PlannerState input
    planner_state JSONB NOT NULL DEFAULT '{}'::JSONB,
    -- Stores the complete AIGeneratedMenu output
    generated_menu JSONB NOT NULL DEFAULT '{}'::JSONB,
    is_favorite BOOLEAN DEFAULT FALSE,
    -- Metadata
    week_start_date DATE,
    week_end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user's menus
CREATE INDEX idx_saved_menus_user_id ON saved_menus(user_id);
CREATE INDEX idx_saved_menus_favorite ON saved_menus(user_id, is_favorite);

-- =============================================
-- GROCERY_LISTS (Shopping lists from menus)
-- =============================================
CREATE TABLE grocery_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    saved_menu_id UUID REFERENCES saved_menus(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    items JSONB NOT NULL DEFAULT '[]'::JSONB,
    -- Structure: [{item, amount, category, checked}]
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_grocery_lists_user ON grocery_lists(user_id);

-- GIN indexes for JSONB metadata searches
CREATE INDEX idx_saved_menus_generated_menu_gin ON saved_menus USING GIN (generated_menu);
CREATE INDEX idx_saved_menus_planner_state_gin ON saved_menus USING GIN (planner_state);
CREATE INDEX idx_grocery_lists_items_gin ON grocery_lists USING GIN (items);

-- =============================================
-- FAVORITE_RECIPES (Saved recipes from any menu)
-- =============================================
CREATE TABLE favorite_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipe_name VARCHAR(255) NOT NULL,
    recipe_data JSONB NOT NULL,
    source_menu_id UUID REFERENCES saved_menus(id) ON DELETE SET NULL,
    source_day VARCHAR(20),
    source_meal_type VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_favorite_recipes_user ON favorite_recipes(user_id);

-- =============================================
-- SHOPPING_EXPORTS (Audit log for cart exports)
-- =============================================
CREATE TABLE shopping_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    menu_id UUID REFERENCES saved_menus(id) ON DELETE SET NULL,
    provider VARCHAR(50) NOT NULL DEFAULT 'instacart',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shopping_exports_user ON shopping_exports(user_id);
CREATE INDEX idx_shopping_exports_user_day ON shopping_exports(user_id, created_at);

-- =============================================
-- MENU_HISTORY (Analytics tracking)
-- =============================================
CREATE TABLE menu_generation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    -- Anonymous if not logged in
    session_id UUID,
    planner_state JSONB,
    generation_time_ms INT,
    model_used VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for analytics
CREATE INDEX idx_menu_history_user ON menu_generation_history(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_menu_history_session ON menu_generation_history(session_id) WHERE session_id IS NOT NULL;
```

### 4.3 JSONB Schema Validation

The `planner_state` and `generated_menu` columns store complex nested objects:

```typescript
// planner_state JSONB structure (matches frontend PlannerState)
type PlannerStateJSONB = {
  adults: number;
  kids: number;
  kidsAges: number[];
  meals: string[];
  cuisines: string[];
  diets: string[];          // multi-select — replaces single `diet` field
  busyDays: string[];
  cookingTime: number;
  notes: string;
};

// generated_menu JSONB structure (matches frontend AIGeneratedMenu)
type GeneratedMenuJSONB = {
  weeklyMenu: {
    day: string;
    meals: Record<string, {
      name: string;
      description: string;
      prepTime: number;
      cookTime: number;
      caloriesPerServing: number;
      protein: number;
      carbs: number;
      fat: number;
      ingredients: { amount: string; item: string }[];
      steps: string[];
    }>;
  }[];
  groceryList: {
    category: string;
    items: { amount: string; item: string }[];
  }[];
};
```

---

## 5. API Specification

### 5.1 Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/api/auth/[...nextauth]` | Auth.js catch-all handler |
| `GET` | `/api/auth/callback/resend` | Magic link callback |
| `GET` | `/api/auth/callback/google` | Google OAuth callback |

### 5.2 User Profile Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users/profile` | Get current user's profile |
| `PATCH` | `/api/users/profile` | Update profile defaults |

### 5.3 Menu Management Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/menus` | List user's saved menus |
| `POST` | `/api/menus` | Save a new menu (supports `isFavorite` flag) |
| `GET` | `/api/menus/[id]` | Get specific menu |
| `PATCH` | `/api/menus/[id]` | Update menu (name, favorite) |
| `DELETE` | `/api/menus/[id]` | Delete saved menu |
| `PATCH` | `/api/menus/[id]/swap` | **(NEW)** Swap two meals or move a meal |

**Swap Request:**
```typescript
type SwapMealRequest = {
  source: { day: string; mealType: string };
  destination: { day: string; mealType: string };
};
```

### 5.4 Grocery & Shopping Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/grocery/[menuId]` | Get grocery list for a menu |
| `PATCH` | `/api/grocery/[menuId]` | Update checked items |
| `POST` | `/api/grocery/[menuId]/export` | **(NEW)** Generate external shopping cart link |

> **Rate limit:** 3 exports per user per day. The handler builds the cart payload server-side via the Instacart OAuth API and returns a short-lived authorisation redirect URL. The client never constructs or handles this URL directly.

**Export Response:**
```typescript
type GroceryExportResponse = {
  provider: "instacart";
  redirect_url: string; // Short-lived Instacart OAuth authorisation URL (cart:write scope)
};
```

### 5.5 Recipe/Favorites Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/recipes/favorites` | List all favorite recipes |
| `POST` | `/api/recipes/favorites` | Add recipe to favorites |
| `DELETE` | `/api/recipes/favorites/[id]` | Remove from favorites |

### 5.6 Menu Generation Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/generate-menu` | Generate new weekly menu |

**Generation Request Body** (`PlannerState`):
```typescript
{
  adults: number;
  kids: number;
  kidsAges: number[];
  meals: string[];
  cuisines: string[];
  diets: string[];       // e.g. ["vegetarian", "gluten-free"]
  busyDays: string[];
  cookingTime: number;
  notes: string;
}
```

> The `diets` array is joined as a comma-separated string in the AI prompt. GPT-4o is instructed to strictly enforce **all** listed restrictions for every dish. Selecting `"none"` generates unrestricted meals.

---

## 6. Security & Performance

### 6.1 Security Considerations
- **Authentication**: Auth.js with secure session cookies.
- **Session Management**: JWT sessions expire after 8 hours (`maxAge: 28800`) with hourly token rotation (`updateAge: 3600`).
- **Step-Up Authentication**: The cart export endpoint validates that the session was issued or refreshed within the last 10 minutes before building the Instacart cart payload.
- **Data Privacy**: Row-level security (RLS) in Supabase (see §6.3 for full policy definitions).
- **Input Validation**: Zod schemas on all endpoints.
- **Audit Logging**: All cart export events are recorded in `shopping_exports` for anomaly detection.

### 6.2 Performance Optimizations
- **Database Indexing**: Optimized for user-specific queries and favorites.
- **JSONB Indexing**: GIN indexing for flexible metadata searches.

### 6.3 Supabase Row-Level Security (RLS)

RLS is enabled on all user-owned tables. These policies must be applied after running the DDL in §4.2.

```sql
-- =============================================
-- ENABLE RLS ON ALL USER-OWNED TABLES
-- =============================================
ALTER TABLE user_profile       ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences   ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_menus        ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_lists      ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_recipes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_exports   ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLICIES
-- Each table: authenticated users may only access their own rows.
-- =============================================

-- user_profile
CREATE POLICY "user_profile_owner" ON user_profile
  FOR ALL USING (auth.uid() = user_id);

-- user_preferences
CREATE POLICY "user_preferences_owner" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- saved_menus
CREATE POLICY "saved_menus_owner" ON saved_menus
  FOR ALL USING (auth.uid() = user_id);

-- grocery_lists
CREATE POLICY "grocery_lists_owner" ON grocery_lists
  FOR ALL USING (auth.uid() = user_id);

-- favorite_recipes
CREATE POLICY "favorite_recipes_owner" ON favorite_recipes
  FOR ALL USING (auth.uid() = user_id);

-- shopping_exports: read-only for the owner; writes use the service role key
-- (exports are always written server-side, never directly by the client)
CREATE POLICY "shopping_exports_owner_read" ON shopping_exports
  FOR SELECT USING (auth.uid() = user_id);

-- Note: INSERT is performed by the API route using the Supabase service role key,
-- which bypasses RLS. No INSERT policy is needed for the authenticated role.
```

---

## 7. Open Questions for Iteration

1. ~~**Shopping Integration:** Which provider has the best free-tier API for a hackathon (Whisk vs. Instacart)?~~ **Resolved:** Using Instacart Developer Platform OAuth 2.0 (`connect.instacart.com`), scoped to `cart:write`.
2. **Swap Persistence:** Should swaps be saved to the DB immediately, or only when the user hits a global "Save Changes" button?
3. **Vision Integration:** How do we handle image processing for the "Fridge Scan" if implemented as a secondary wow-factor?
4. ~~**Single Diet Restriction:** Only one dietary restriction could be selected at a time.~~ **Resolved:** `diets` is now a `string[]` with multi-select and mutual-exclusion logic for `"none"`.
5. ~~**Redundant Generation Step:** Users had to navigate to a confirmation screen before generating.~~ **Resolved:** Step 4 removed. Generation triggers directly from Step 3 via the "Generate Menu" button.
6. ~~**Favourite menus not toggleable:** No UI existed to mark a saved menu as a favourite.~~ **Resolved:** Heart (❤️) button added to the results screen; toggles `isFavorite` via `POST` on first save or `PATCH` afterward.

---

## 8. Appendix

### A. Prisma Schema (Complete)

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  profile       Profile?
  preferences   UserPreference?
  menus         SavedMenu[]
  groceryLists  GroceryList[]
  favorites     FavoriteRecipe[]
  shoppingExports ShoppingExport[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Profile {
  id              String   @id @default(cuid())
  userId          String   @unique
  // User Details
  name            String?
  gender          String?  // 'male', 'female', 'other', 'prefer_not_to_say'
  location        String?  // Where user is logging in from
  // Default Planner Settings
  defaultAdults   Int      @default(2)
  defaultKids     Int      @default(0)
  defaultMeals    String[] @default(["dinner"])
  defaultCuisines String[] @default([])
  defaultDiet     String   @default("none")
  avatarUrl       String?
  // Timestamps
  lastLoginAt     DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model UserPreference {
  id          String   @id @default(cuid())
  userId      String   @unique
  busyDays    String[] @default([])
  cookingTime Int      @default(30)
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model SavedMenu {
  id              String   @id @default(cuid())
  userId          String
  name            String
  plannerState    Json
  generatedMenu   Json
  isFavorite      Boolean  @default(false)
  weekStartDate   DateTime?
  weekEndDate     DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  groceryLists    GroceryList[]
  favoriteRecipes FavoriteRecipe[]
  shoppingExports ShoppingExport[]
  
  @@index([userId])
  @@index([userId, isFavorite])
}

model GroceryList {
  id           String   @id @default(cuid())
  savedMenuId  String?
  userId       String
  items        Json     @default("[]")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  savedMenu    SavedMenu? @relation(fields: [savedMenuId], references: [id], onDelete: Cascade)
  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
}

model FavoriteRecipe {
  id             String   @id @default(cuid())
  userId         String
  recipeName     String
  recipeData     Json
  sourceMenuId   String?
  sourceDay      String?
  sourceMealType String?
  createdAt      DateTime @default(now())
  
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  sourceMenu SavedMenu? @relation(fields: [sourceMenuId], references: [id], onDelete: SetNull)
  
  @@index([userId])
}

model MenuGenerationHistory {
  id              String   @id @default(cuid())
  userId          String?
  sessionId       String?
  plannerState    Json?
  generationTimeMs Int?
  modelUsed       String?
  createdAt       DateTime @default(now())
  
  @@index([userId])
  @@index([sessionId])
}

model ShoppingExport {
  id        String   @id @default(cuid())
  userId    String
  menuId    String?
  provider  String   @default("instacart")
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())

  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  savedMenu SavedMenu? @relation(fields: [menuId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([userId, createdAt])
}
```

---

*End of Specification Document*  
*Last Updated: February 24, 2026*
