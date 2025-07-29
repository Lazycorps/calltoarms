import { defineEventHandler, createError } from "h3";
import { serverSupabaseUser } from "#supabase/server";
import prisma from "../../../../lib/prisma";

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

    // Récupérer le compte PlayStation de l'utilisateur
    const playstationAccount = await prisma.platformAccount.findUnique({
      where: {
        userId_platform: {
          userId: user.id,
          platform: "PLAYSTATION",
        },
      },
      include: {
        games: {
          orderBy: [
            { playtimeTotal: "desc" },
            { name: "asc" },
          ],
        },
      },
    });

    if (!playstationAccount) {
      return {
        success: true,
        account: null,
        games: [],
      };
    }

    // Calculer les statistiques
    const totalGames = playstationAccount.games.length;
    const totalPlaytime = playstationAccount.games.reduce(
      (sum, game) => sum + game.playtimeTotal,
      0
    );
    const recentlyPlayed = playstationAccount.games.filter(
      (game) => game.lastPlayed && 
      new Date(game.lastPlayed).getTime() > Date.now() - 14 * 24 * 60 * 60 * 1000
    ).length;

    // Filtrer les jeux PS5, PS4, etc.
    const ps5Games = playstationAccount.games.filter(
      (game) => game.platformGameId.includes("PS5")
    ).length;
    const ps4Games = playstationAccount.games.filter(
      (game) => game.platformGameId.includes("PS4")
    ).length;

    return {
      success: true,
      account: {
        id: playstationAccount.id,
        platformId: playstationAccount.platformId,
        username: playstationAccount.username,
        displayName: playstationAccount.displayName,
        avatarUrl: playstationAccount.avatarUrl,
        profileUrl: playstationAccount.profileUrl,
        lastSync: playstationAccount.lastSync,
      },
      games: playstationAccount.games,
      stats: {
        totalGames,
        totalPlaytime,
        recentlyPlayed,
        ps5Games,
        ps4Games,
      },
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des jeux PlayStation:", error);

    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Erreur interne du serveur",
    });
  }
});