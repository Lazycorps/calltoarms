import { defineEventHandler, createError } from "h3";
import { serverSupabaseUser } from "#supabase/server";
import prisma from "@@/lib/prisma";

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

    // Récupérer le compte Riot de l'utilisateur
    const riotAccount = await prisma.platformAccount.findUnique({
      where: {
        userId_platform: {
          userId: user.id,
          platform: "RIOT",
        },
      },
    });

    if (!riotAccount) {
      throw createError({
        statusCode: 404,
        statusMessage: "Compte Riot Games non trouvé",
      });
    }

    // Récupérer les jeux Riot Games de l'utilisateur
    const games = await prisma.platformGame.findMany({
      where: {
        platformAccountId: riotAccount.id,
      },
      orderBy: [
        { lastPlayed: "desc" },
        { playtimeTotal: "desc" },
      ],
    });

    return {
      account: {
        id: riotAccount.id,
        platform: riotAccount.platform,
        displayName: riotAccount.displayName,
        username: riotAccount.username,
        avatarUrl: riotAccount.avatarUrl,
        lastSync: riotAccount.lastSync,
      },
      games,
      totalGames: games.length,
      totalPlaytime: games.reduce((sum, game) => sum + game.playtimeTotal, 0),
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des jeux Riot Games:", error);

    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Erreur interne du serveur",
    });
  }
});