/*
  Warnings:

  - Added the required column `role` to the `users_on_cookbooks` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "users_on_cookbooks" ADD COLUMN     "role" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "users_on_recipes" (
    "recipeId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "addedBy" INTEGER NOT NULL,

    CONSTRAINT "users_on_recipes_pkey" PRIMARY KEY ("recipeId","userId")
);

-- CreateIndex
CREATE INDEX "users_on_recipes_userId_idx" ON "users_on_recipes"("userId");

-- AddForeignKey
ALTER TABLE "users_on_recipes" ADD CONSTRAINT "users_on_recipes_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_on_recipes" ADD CONSTRAINT "users_on_recipes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
