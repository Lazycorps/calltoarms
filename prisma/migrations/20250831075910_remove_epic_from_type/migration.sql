/*
  Warnings:

  - The values [EPIC_GAMES] on the enum `GamingPlatform` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "GamingPlatform_new" AS ENUM ('STEAM', 'PLAYSTATION', 'XBOX', 'NINTENDO', 'GOG', 'RIOT');
ALTER TABLE "PlatformAccount" ALTER COLUMN "platform" TYPE "GamingPlatform_new" USING ("platform"::text::"GamingPlatform_new");
ALTER TYPE "GamingPlatform" RENAME TO "GamingPlatform_old";
ALTER TYPE "GamingPlatform_new" RENAME TO "GamingPlatform";
DROP TYPE "GamingPlatform_old";
COMMIT;
