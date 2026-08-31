-- Reconciles migration history with manual, out-of-band index additions
-- discovered on the live database (confirmed via `prisma db pull` and a
-- direct pg_indexes query). These indexes already exist in production;
-- this migration is recorded via `prisma migrate resolve --applied`
-- rather than executed, so the CREATE INDEX statements below are for
-- history/documentation purposes and use IF NOT EXISTS defensively.
CREATE INDEX IF NOT EXISTS idx_grocery_items_gin ON "GroceryList" USING GIN ("items");

CREATE INDEX IF NOT EXISTS idx_menu_generated_gin ON "SavedMenu" USING GIN ("generatedMenu");

CREATE INDEX IF NOT EXISTS idx_menu_planner_gin ON "SavedMenu" USING GIN ("plannerState");
