import { defineEventHandler, getRouterParam, getQuery, createError } from "h3";
import { serverSupabaseUser } from "#supabase/server";
import prisma from "~~/lib/prisma";
import type { GameDetailsDTO } from "~~/shared/types/library";
import { requireFriendship } from "~~/server/services/friendService";

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

    // Récupérer l'ID du propriétaire du jeu depuis la query (optionnel)
    const query = getQuery(event);
    const targetUserId = (query.userId as string) || user.id;

    // Si un userId est spécifié et qu'il n'est pas celui de l'utilisateur connecté,
    // vérifier d'abord qu'ils sont amis
    if (targetUserId !== user.id) {
      await requireFriendship(
        user.id,
        targetUserId,
        "Vous n'avez pas accès aux jeux de cet utilisateur"
      );
    }

    // Récupérer le jeu avec ses succès directement depuis le bon utilisateur
    const game = await prisma.platformGame.findFirst({
      where: {
        id: parseInt(gameId),
        platformAccount: {
          userId: targetUserId,
        },
      },
      include: {
        platformAccount: {
          select: {
            userId: true,
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

    // Déterminer si c'est le jeu de l'utilisateur connecté ou d'un ami
    const isOwnGame = targetUserId === user.id;

    // Mapper vers DTO
    const gameDetailsDTO: GameDetailsDTO = {
      isOwnGame,
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
