import { defineEventHandler, createError } from "h3";
import prisma from "~~/lib/prisma";
import type { PlatformGameCardDTO } from "~~/shared/types/library";

// Fonction utilitaire pour formater le temps de jeu
function formatPlaytime(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours < 24) {
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}min`
      : `${hours} heures`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  if (remainingHours > 0) {
    return `${days} jours, ${remainingHours} heures`;
  }

  return `${days} jours`;
}

export default defineEventHandler(
  async (event): Promise<PlatformGameCardDTO[]> => {
    try {
      const currentUserId = event.context.user.id;

      const now = new Date();
      const dateFilter = new Date(
        now.getFullYear() - 1,
        now.getMonth(),
        now.getDate()
      );

      // Calculer les statistiques avec des requêtes optimisées
      const recentlyPlayedRaw = await prisma.platformGame.findMany({
        where: {
          platformAccount: {
            userId: currentUserId,
          },
          lastPlayed: {
            gt: dateFilter,
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
        orderBy: {
          lastPlayed: "desc",
        },
        take: 10,
      });

      const recentlyPlayedGames: PlatformGameCardDTO[] = recentlyPlayedRaw.map(
        (game) => {
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
            iconUrl: game.iconUrl,
            coverUrl: game.coverUrl,
            lastPlayed: game.lastPlayed,
            playtimeTotal: game.playtimeTotal,
            platformGameId: game.platformGameId,
            playtimeFormatted: formatPlaytime(game.playtimeTotal),
            platform: game.platformAccount.platform,
            achievementsCount: unlockedAchievements,
            totalAchievements: totalAchievements,
            achievementPercentage: achievementPercentage,
            isCompleted: game.isCompleted,
          };
        }
      );

      return recentlyPlayedGames;
    } catch (error) {
      console.error("Erreur lors de la récupération des jeux:", error);

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
