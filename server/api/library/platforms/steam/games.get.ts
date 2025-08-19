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

    // Récupérer le compte Steam de l'utilisateur
    const steamAccount = await prisma.platformAccount.findUnique({
      where: {
        userId_platform: {
          userId: user.id,
          platform: "STEAM",
        },
      },
      include: {
        games: {
          orderBy: [{ playtimeTotal: "desc" }, { name: "asc" }],
        },
      },
    });

    if (!steamAccount) {
      return {
        success: true,
        account: null,
        games: [],
      };
    }

    // Calculer les statistiques
    const totalGames = steamAccount.games.length;
    const totalPlaytime = steamAccount.games.reduce(
      (sum, game) => sum + game.playtimeTotal,
      0
    );
    const recentlyPlayed = steamAccount.games.filter(
      (game) =>
        game.lastPlayed &&
        new Date(game.lastPlayed).getTime() >
          Date.now() - 14 * 24 * 60 * 60 * 1000
    ).length;

    return {
      success: true,
      account: {
        id: steamAccount.id,
        platformId: steamAccount.platformId,
        username: steamAccount.username,
        displayName: steamAccount.displayName,
        avatarUrl: steamAccount.avatarUrl,
        profileUrl: steamAccount.profileUrl,
        lastSync: steamAccount.lastSync,
      },
      games: steamAccount.games,
      stats: {
        totalGames,
        totalPlaytime,
        recentlyPlayed,
      },
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des jeux Steam:", error);

    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Erreur interne du serveur",
    });
  }
});
