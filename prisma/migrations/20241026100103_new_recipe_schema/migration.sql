/*
  Warnings:

  - You are about to drop the column `image` on the `recipes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "recipes" DROP COLUMN "image",
ADD COLUMN     "imagePath" TEXT,
ADD COLUMN     "imageUrl" TEXT;
