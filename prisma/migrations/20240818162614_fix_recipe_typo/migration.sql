/*
  Warnings:

  - You are about to drop the column `preTime` on the `recipes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "recipes" DROP COLUMN "preTime",
ADD COLUMN     "prepTime" INTEGER;
