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
            isUnlocked: true,
          },
        }),
      ]);

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
