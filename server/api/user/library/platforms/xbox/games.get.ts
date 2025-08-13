// server/api/user/library/platforms/xbox/games.ts

import { defineEventHandler, getQuery, createError } from "h3";
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

    // Récupérer les paramètres de requête
    const query = getQuery(event);
    const accountId = query.accountId as string;

    if (!accountId) {
      throw createError({
        statusCode: 400,
        statusMessage: "ID du compte Xbox requis",
      });
    }

    // Vérifier que le compte appartient à l'utilisateur
    const platformAccount = await prisma.platformAccount.findFirst({
      where: {
        id: parseInt(accountId),
        userId: user.id,
        platform: "XBOX",
        isActive: true,
      },
    });

    if (!platformAccount) {
      throw createError({
        statusCode: 404,
        statusMessage: "Compte Xbox non trouvé",
      });
    }

    // Récupérer les jeux Xbox avec leurs succès
    const games = await prisma.platformGame.findMany({
      where: {
        platformAccountId: platformAccount.id,
      },
      include: {
        achievements: {
          select: {
            id: true,
            achievementId: true,
            name: true,
            description: true,
            iconUrl: true,
            isUnlocked: true,
            unlockedAt: true,
            rarity: true,
            points: true,
          },
          orderBy: {
            unlockedAt: "desc",
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
          lastPlayed: "desc",
        },
        {
          name: "asc",
        },
      ],
    });

    // Calculer les statistiques pour chaque jeu
    const gamesWithStats = games.map((game) => {
      const totalAchievements = game._count.achievements;
      const unlockedAchievements = game.achievements.filter(
        (achievement) => achievement.isUnlocked
      ).length;
      const completionPercentage =
        totalAchievements > 0
          ? Math.round((unlockedAchievements / totalAchievements) * 100)
          : 0;

      const totalPoints = game.achievements.reduce(
        (sum, achievement) => sum + (achievement.points || 0),
        0
      );
      const earnedPoints = game.achievements
        .filter((achievement) => achievement.isUnlocked)
        .reduce((sum, achievement) => sum + (achievement.points || 0), 0);

      return {
        ...game,
        stats: {
          totalAchievements,
          unlockedAchievements,
          completionPercentage,
          totalPoints,
          earnedPoints,
        },
        // Nettoyer les propriétés internes
        _count: undefined,
      };
    });

    return {
      success: true,
      games: gamesWithStats,
      account: {
        id: platformAccount.id,
        platform: platformAccount.platform,
        username: platformAccount.username,
        displayName: platformAccount.displayName,
        avatarUrl: platformAccount.avatarUrl,
        lastSync: platformAccount.lastSync,
      },
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des jeux Xbox:", error);

    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Erreur interne du serveur",
    });
  }
});
