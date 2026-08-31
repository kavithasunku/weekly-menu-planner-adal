-- AlterTable
ALTER TABLE "SavedMenu" ADD COLUMN     "isCurrent" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "SavedMenu_userId_isCurrent_idx" ON "SavedMenu"("userId", "isCurrent");
