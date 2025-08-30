import { defineEventHandler, getRouterParam, getQuery, createError } from "h3";
import { serverSupabaseUser } from "#supabase/server";
import prisma from "~~/lib/prisma";
import { MostPlayedGamesPeriodes } from "~~/shared/constantes/constantes";

export default defineEventHandler(async (event) => {
  try {
    // Vérifier l'authentification
    const user = await serverSupabaseUser(event);
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Authentification requise",
      });
    }

    // Récupérer l'ID de l'ami depuis l'URL
    const friendId = getRouterParam(event, "friendId");
    if (!friendId) {
      throw createError({
        statusCode: 400,
        statusMessage: "ID de l'ami manquant",
      });
    }

    // Vérifier que l'utilisateur et l'ami sont bien amis
    const friendship = await prisma.friend.findFirst({
      where: {
        OR: [
          {
            userId: user.id,
            friendId: friendId,
            status: "ACCEPTED",
          },
          {
            userId: friendId,
            friendId: user.id,
            status: "ACCEPTED",
          },
        ],
      },
    });

    if (!friendship) {
      throw createError({
        statusCode: 403,
        statusMessage: "Vous n'êtes pas ami avec cet utilisateur",
      });
    }

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

    // Construire les conditions de filtrage pour l'ami
    const whereConditions = {
      platformAccount: {
        userId: friendId,
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
    const mostPlayedGames = mostPlayedGamesRaw.map((game) => {
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
        platform: game.platformAccount.platform,
        achievementsCount: unlockedAchievements,
        totalAchievements: totalAchievements,
        achievementPercentage: achievementPercentage,
        isCompleted: game.isCompleted,
      };
    });

    return mostPlayedGames;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des jeux les plus joués de l'ami:",
      error
    );

    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Erreur interne du serveur",
    });
  }
});
