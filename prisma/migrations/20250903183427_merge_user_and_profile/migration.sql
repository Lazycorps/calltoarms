/*
  Warnings:

  - You are about to drop the `Profile` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Profile" DROP CONSTRAINT "Profile_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "bnetID" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "epicID" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "riotID" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "steamID" TEXT NOT NULL DEFAULT '';

-- DropTable
DROP TABLE "Profile";
