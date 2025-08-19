import { defineEventHandler, createError, getQuery } from "h3";
import prisma from "~~/lib/prisma";
import { MostPlayedGamesPeriodes } from "~~/shared/constantes/constantes";
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

      // Récupérer le paramètre de période
      const query = getQuery(event);
      const period =
        (query.period as MostPlayedGamesPeriodes) ||
        MostPlayedGamesPeriodes.ALL_TIME;

      // Calculer la date de début selon la période
      let dateFilter: Date | undefined;
      const now = new Date();

      switch (period) {
        case MostPlayedGamesPeriodes.LAST_YEAR:
          dateFilter = new Date(
            now.getFullYear() - 1,
            now.getMonth(),
            now.getDate()
          );
          break;
        case MostPlayedGamesPeriodes.LAST_SIX_MONTH:
          dateFilter = new Date(
            now.getFullYear(),
            now.getMonth() - 6,
            now.getDate()
          );
          break;
        case MostPlayedGamesPeriodes.LAST_THREE_MONTH:
          dateFilter = new Date(
            now.getFullYear(),
            now.getMonth() - 3,
            now.getDate()
          );
          break;
        case MostPlayedGamesPeriodes.ALL_TIME:
        default:
          dateFilter = undefined;
          break;
      }

      // Construire les conditions de filtrage
      const whereConditions = {
        platformAccount: {
          userId: currentUserId,
          isActive: true,
        },
        playtimeTotal: {
          gt: 0,
        },
        ...(dateFilter && {
          lastPlayed: {
            gte: dateFilter,
          },
        }),
      };

      // Calculer les statistiques avec des requêtes optimisées
      const mostPlayedGamesRaw = await prisma.platformGame.findMany({
        where: whereConditions,
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
          playtimeTotal: "desc",
        },
        take: 10,
      });

      // Transformer les données pour calculer le pourcentage d'achievements
      const mostPlayedGames: PlatformGameCardDTO[] = mostPlayedGamesRaw.map(
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
            iconUrl: game.iconUrl || undefined,
            coverUrl: game.coverUrl || undefined,
            lastPlayed: game.lastPlayed || undefined,
            playtimeTotal: game.playtimeTotal,
            playtimeFormatted: formatPlaytime(game.playtimeTotal),
            platform: game.platformAccount.platform,
            achievementsCount: unlockedAchievements,
            totalAchievements: totalAchievements,
            achievementPercentage: achievementPercentage,
            isCompleted: game.isCompleted,
          };
        }
      );

      return mostPlayedGames;
    } catch (error) {
      console.error("Erreur lors de la récupération des plateformes:", error);

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
