import { defineEventHandler, createError } from "h3";
import { serverSupabaseUser } from "#supabase/server";
import prisma from "~~/lib/prisma";

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

    // Récupérer les comptes de plateformes de l'utilisateur
    const platformAccounts = await prisma.platformAccount.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            games: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Récupérer les plateformes supportées
    const supportedPlatforms = ["STEAM", "PLAYSTATION", "XBOX"];

    // Calculer les statistiques avec des requêtes optimisées
    const baseWhere = {
      platformAccount: {
        userId: user.id,
        isActive: true,
      },
    };

    // 1. Statistiques globales avec agrégation
    const [totalGamesCount, totalPlaytimeResult, totalAchievementsResult] =
      await Promise.all([
        // Nombre total de jeux
        prisma.platformGame.count({
          where: baseWhere,
        }),

        // Temps total de jeu (agrégation)
        prisma.platformGame.aggregate({
          where: baseWhere,
          _sum: {
            playtimeTotal: true,
          },
        }),

        // Total des succès (agrégation)
        prisma.platformAchievement.count({
          where: {
            game: baseWhere,
          },
        }),
      ]);

    // 2. Jeux récemment joués (limité à 10, optimisé)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 360);

    const recentlyPlayedGames = await prisma.platformGame.findMany({
      where: {
        ...baseWhere,
        lastPlayed: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        id: true,
        name: true,
        iconUrl: true,
        coverUrl: true,
        lastPlayed: true,
        playtimeTotal: true,
        platformGameId: true,
        achievements: true,
        platformAccount: {
          select: {
            platform: true,
          },
        },
      },
      orderBy: {
        lastPlayed: "desc",
      },
      take: 10,
    });

    // 3. Jeux les plus joués (limité à 10, optimisé)
    const mostPlayedGames = await prisma.platformGame.findMany({
      where: {
        ...baseWhere,
        playtimeTotal: {
          gt: 0,
        },
      },
      select: {
        id: true,
        name: true,
        iconUrl: true,
        coverUrl: true,
        playtimeTotal: true,
        platformGameId: true,
        achievements: true,
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

    return {
      success: true,
      connectedPlatforms: platformAccounts,
      supportedPlatforms,
      stats: {
        totalConnectedPlatforms: platformAccounts.length,
        totalGames: totalGamesCount,
        totalPlaytime: totalPlaytimeResult._sum.playtimeTotal || 0,
        totalAchievements: totalAchievementsResult,
      },
      recentlyPlayedGames: recentlyPlayedGames.map((game) => ({
        ...game,
        platform: game.platformAccount.platform,
        platformAccount: undefined, // Nettoyer la propriété platformAccount
      })),
      mostPlayedGames: mostPlayedGames.map((game) => ({
        ...game,
        platform: game.platformAccount.platform,
        achievementsCount: game._count.achievements,
        platformAccount: undefined, // Nettoyer la propriété platformAccount
        _count: undefined, // Nettoyer la propriété _count
      })),
    };
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
});
