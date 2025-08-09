/*
  Warnings:

  - You are about to drop the column `metadata` on the `PlatformAchievement` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PlatformAccount" ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "PlatformAchievement" DROP COLUMN "metadata";
