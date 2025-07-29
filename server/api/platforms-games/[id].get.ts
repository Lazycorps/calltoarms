import { defineEventHandler, createError } from "h3";
import { serverSupabaseUser } from "#supabase/server";
import prisma from "../../../lib/prisma";

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
            username: true,
            displayName: true,
            avatarUrl: true,
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

    // Formater le temps de jeu
    const formatPlaytime = (minutes: number) => {
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
    };

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

    return {
      success: true,
      game: {
        ...game,
        playtimeFormatted: formatPlaytime(game.playtimeTotal),
        recentPlaytimeFormatted: game.playtimeRecent
          ? formatPlaytime(game.playtimeRecent)
          : null,
      },
      stats: {
        totalAchievements,
        unlockedAchievements,
        completionPercentage,
        totalPoints,
        unlockedPoints,
        rarityStats,
      },
    };
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
