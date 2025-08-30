-- CreateEnum
CREATE TYPE "GamingPlatform" AS ENUM ('STEAM', 'PLAYSTATION', 'XBOX', 'NINTENDO', 'EPIC_GAMES', 'GOG');

-- CreateTable
CREATE TABLE "PlatformAccount" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "GamingPlatform" NOT NULL,
    "platformId" TEXT NOT NULL,
    "username" TEXT,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "profileUrl" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSync" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformGame" (
    "id" SERIAL NOT NULL,
    "platformAccountId" INTEGER NOT NULL,
    "platformGameId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "playtimeTotal" INTEGER NOT NULL DEFAULT 0,
    "playtimeRecent" INTEGER,
    "lastPlayed" TIMESTAMP(3),
    "iconUrl" TEXT,
    "coverUrl" TEXT,
    "isInstalled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformAchievement" (
    "id" SERIAL NOT NULL,
    "platformGameId" INTEGER NOT NULL,
    "achievementId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "iconUrl" TEXT,
    "isUnlocked" BOOLEAN NOT NULL DEFAULT false,
    "unlockedAt" TIMESTAMP(3),
    "rarity" DOUBLE PRECISION,
    "points" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformAccount_userId_platform_key" ON "PlatformAccount"("userId", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformGame_platformAccountId_platformGameId_key" ON "PlatformGame"("platformAccountId", "platformGameId");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformAchievement_platformGameId_achievementId_key" ON "PlatformAchievement"("platformGameId", "achievementId");

-- AddForeignKey
ALTER TABLE "PlatformAccount" ADD CONSTRAINT "PlatformAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformGame" ADD CONSTRAINT "PlatformGame_platformAccountId_fkey" FOREIGN KEY ("platformAccountId") REFERENCES "PlatformAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformAchievement" ADD CONSTRAINT "PlatformAchievement_platformGameId_fkey" FOREIGN KEY ("platformGameId") REFERENCES "PlatformGame"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
