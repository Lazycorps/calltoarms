import { defineEventHandler, createError } from "h3";
import { serverSupabaseUser } from "#supabase/server";
import prisma from "~~/lib/prisma";
import type { PlatformGameCardDTO } from "~~/shared/types/library";

export default defineEventHandler(
  async (event): Promise<PlatformGameCardDTO[]> => {
    try {
      // Vérifier l'authentification
      const user = await serverSupabaseUser(event);
      if (!user) {
        throw createError({
          statusCode: 401,
          statusMessage: "Authentification requise",
        });
      }

      // Récupérer les jeux récemment terminés
      const recentlyCompletedRaw = await prisma.platformGame.findMany({
        where: {
          platformAccount: {
            userId: user.id,
          },
          isCompleted: true,
          completedAt: {
            not: null,
          },
        },
        select: {
          id: true,
          name: true,
          iconUrl: true,
          coverUrl: true,
          playtimeTotal: true,
          platformGameId: true,
          lastPlayed: true,
          isCompleted: true,
          completedAt: true,
          achievements: {
            select: {
              id: true,
              isUnlocked: true,
            },
          },
          platformAccount: {
            select: {
              platform: true,
            },
          },
          _count: {
            select: {
              achievements: true,
            },
          },
        },
        orderBy: [
          {
            completedAt: "desc",
          },
          {
            lastPlayed: "desc",
          },
        ],
        take: 10,
      });

      const recentlyCompletedGames: PlatformGameCardDTO[] =
        recentlyCompletedRaw.map((game) => {
          const unlockedAchievements = game.achievements.filter(
            (achievement) => achievement.isUnlocked
          ).length;
          const totalAchievements = game._count.achievements;
          const achievementPercentage =
            totalAchievements > 0
              ? Math.round((unlockedAchievements / totalAchievements) * 100)
              : 0;

          return {
            id: game.id,
            name: game.name,
            iconUrl: game.iconUrl || undefined,
            coverUrl: game.coverUrl || undefined,
            lastPlayed: game.lastPlayed || undefined,
            playtimeTotal: game.playtimeTotal,
            platform: game.platformAccount.platform,
            achievementsCount: unlockedAchievements,
            totalAchievements: totalAchievements,
            achievementPercentage: achievementPercentage,
            isCompleted: game.isCompleted,
            completedAt: game.completedAt || undefined,
          };
        });

      return recentlyCompletedGames;
    } catch (error) {
      console.error("Erreur lors de la récupération des jeux terminés:", error);

      if (error && typeof error === "object" && "statusCode" in error) {
        throw error;
      }

      throw createError({
        statusCode: 500,
        statusMessage: "Erreur interne du serveur",
      });
    }
  }
);
