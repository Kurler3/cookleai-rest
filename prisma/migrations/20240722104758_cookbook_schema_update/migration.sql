/*
  Warnings:

  - You are about to drop the column `isPrivate` on the `cookbooks` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "cookbooks" DROP COLUMN "isPrivate",
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "image" DROP NOT NULL;
