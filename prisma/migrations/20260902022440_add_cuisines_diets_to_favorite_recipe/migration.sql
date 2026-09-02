-- AlterTable
ALTER TABLE "FavoriteRecipe" ADD COLUMN     "cuisines" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "diets" TEXT[] DEFAULT ARRAY[]::TEXT[];
