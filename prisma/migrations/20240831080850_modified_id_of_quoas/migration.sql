/*
  Warnings:

  - The primary key for the `UserQuota` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `UserQuota` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserQuota" DROP CONSTRAINT "UserQuota_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "UserQuota_pkey" PRIMARY KEY ("userId", "type");
