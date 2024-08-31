/*
  Warnings:

  - Added the required column `isResettable` to the `UserQuota` table without a default value. This is not possible if the table is not empty.
  - Added the required column `resetFrequency` to the `UserQuota` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserQuota" ADD COLUMN     "isResettable" BOOLEAN NOT NULL,
ADD COLUMN     "resetFrequency" TEXT NOT NULL;
