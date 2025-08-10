import { defineEventHandler, createError } from "h3";
import { serverSupabaseUser } from "#supabase/server";
import prisma from "~~/lib/prisma";
import type { GameDetailsDTO } from "~~/shared/types/library";

export default defineEventHandler(async (event): Promise<GameDetailsDTO> => {
  try {
    // Vérifier l'authentification
    const user = await serverSupabaseUser(event);
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Authentification requise",
      });
    }

    // Récupérer l'ID du jeu depuis l'URL
    const gameId = getRouterParam(event, "id");
    if (!gameId) {
      throw createError({
        statusCode: 400,
        statusMessage: "ID du jeu manquant",
      });
    }

    // Récupérer le jeu avec ses succès
    const game = await prisma.platformGame.findFirst({
      where: {
        id: parseInt(gameId),
        platformAccount: {
          userId: user.id,
        },
      },
      include: {
        platformAccount: {
          select: {
            id: true,
            platform: true,
            platformId: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            profileUrl: true,
            isActive: true,
            lastSync: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        achievements: {
          orderBy: [
            { isUnlocked: "desc" },
            { unlockedAt: "desc" },
            { name: "asc" },
          ],
        },
      },
    });

    if (!game) {
      throw createError({
        statusCode: 404,
        statusMessage: "Jeu non trouvé",
      });
    }

    // Calculer les statistiques des succès
    const totalAchievements = game.achievements.length;
    const unlockedAchievements = game.achievements.filter(
      (a) => a.isUnlocked
    ).length;
    const completionPercentage =
      totalAchievements > 0
        ? Math.round((unlockedAchievements / totalAchievements) * 100)
        : 0;

    // Calculer la valeur totale des points (si disponible)
    const totalPoints = game.achievements.reduce(
      (sum, a) => sum + (a.points || 0),
      0
    );
    const unlockedPoints = game.achievements
      .filter((a) => a.isUnlocked)
      .reduce((sum, a) => sum + (a.points || 0), 0);

    // Calculer les statistiques de rareté
    const rarityStats = {
      common: game.achievements.filter((a) => a.rarity && a.rarity > 50).length,
      uncommon: game.achievements.filter(
        (a) => a.rarity && a.rarity > 20 && a.rarity <= 50
      ).length,
      rare: game.achievements.filter(
        (a) => a.rarity && a.rarity > 5 && a.rarity <= 20
      ).length,
      ultraRare: game.achievements.filter((a) => a.rarity && a.rarity <= 5)
        .length,
    };

    // Mapper vers DTO
    const gameDetailsDTO: GameDetailsDTO = {
      game: {
        id: game.id,
        platformGameId: game.platformGameId,
        name: game.name,
        playtimeTotal: game.playtimeTotal,
        playtimeRecent: game.playtimeRecent || undefined,
        lastPlayed: game.lastPlayed || undefined,
        iconUrl: game.iconUrl || undefined,
        coverUrl: game.coverUrl || undefined,
        isInstalled: game.isInstalled,
        isCompleted: game.isCompleted,
        completedAt: game.completedAt || undefined,
        platformAccount: {
          id: game.platformAccount.id,
          platform: game.platformAccount.platform,
          platformId: game.platformAccount.platformId,
          username: game.platformAccount.username || undefined,
          displayName: game.platformAccount.displayName || undefined,
          avatarUrl: game.platformAccount.avatarUrl || undefined,
          profileUrl: game.platformAccount.profileUrl || undefined,
          isActive: game.platformAccount.isActive,
          lastSync: game.platformAccount.lastSync || undefined,
          gamesCount: 0, // Non disponible dans ce contexte
          createdAt: game.platformAccount.createdAt,
          updatedAt: game.platformAccount.updatedAt,
        },
        achievementsCount: unlockedAchievements,
        totalAchievements,
        achievementPercentage: completionPercentage,
        createdAt: game.createdAt,
        updatedAt: game.updatedAt,
      },
      achievements: game.achievements.map((achievement) => ({
        id: achievement.id,
        achievementId: achievement.achievementId,
        name: achievement.name,
        description: achievement.description || undefined,
        iconUrl: achievement.iconUrl || undefined,
        isUnlocked: achievement.isUnlocked,
        unlockedAt: achievement.unlockedAt || undefined,
        earnedRate: achievement.earnedRate || undefined,
        rarity: achievement.rarity || undefined,
        points: achievement.points || undefined,
        createdAt: achievement.createdAt,
        updatedAt: achievement.updatedAt,
      })),
      stats: {
        totalAchievements,
        unlockedAchievements,
        completionPercentage,
        totalPoints,
        unlockedPoints,
        rarityStats,
      },
    };

    return gameDetailsDTO;
  } catch (error) {
    console.error("Erreur lors de la récupération des détails du jeu:", error);

    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Erreur interne du serveur",
    });
  }
});
