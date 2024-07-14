/*
  Warnings:

  - You are about to drop the `ingredients` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `image` to the `cookbooks` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ingredients" DROP CONSTRAINT "ingredients_recipeId_fkey";

-- AlterTable
ALTER TABLE "cookbooks" ADD COLUMN     "image" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "recipes" ADD COLUMN     "cookTime" INTEGER,
ADD COLUMN     "cuisine" TEXT,
ADD COLUMN     "difficulty" TEXT,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "ingredients" JSONB[] DEFAULT ARRAY[]::JSONB[],
ADD COLUMN     "language" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "nutrients" JSONB,
ADD COLUMN     "preTime" INTEGER,
ADD COLUMN     "rating" INTEGER,
ADD COLUMN     "servings" TEXT,
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "instructions" SET DEFAULT ARRAY[]::TEXT[];

-- DropTable
DROP TABLE "ingredients";
