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
          userId: user.id,
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

    const recentlyPlayedGames = recentlyPlayedRaw.map((game) => {
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
      };
    });

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
});
