/*
  Warnings:

  - You are about to drop the column `image` on the `cookbooks` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "cookbooks" DROP COLUMN "image",
ADD COLUMN     "imageUrl" TEXT;
