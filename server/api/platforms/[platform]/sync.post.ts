import { defineEventHandler, readBody, createError } from "h3";
import { serverSupabaseUser } from "#supabase/server";
import { getPlatformService } from "../../../utils/gaming-platforms";
import type { GamingPlatform } from "@prisma/client";
import prisma from "../../../../lib/prisma";

interface SyncRequest {
  accountId: number;
}

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

    // Récupérer la plateforme depuis l'URL
    const platform = getRouterParam(
      event,
      "platform"
    )?.toUpperCase() as GamingPlatform;
    if (!platform) {
      throw createError({
        statusCode: 400,
        statusMessage: "Plateforme non spécifiée",
      });
    }

    // Lire les données de la requête
    const body = await readBody<SyncRequest>(event);
    if (!body.accountId) {
      throw createError({
        statusCode: 400,
        statusMessage: "ID du compte manquant",
      });
    }

    // Vérifier que le compte appartient à l'utilisateur
    const platformAccount = await prisma.platformAccount.findFirst({
      where: {
        id: body.accountId,
        userId: user.id,
        platform,
        isActive: true,
      },
    });

    if (!platformAccount) {
      throw createError({
        statusCode: 404,
        statusMessage: "Compte de plateforme non trouvé",
      });
    }

    // Obtenir le service de la plateforme
    const platformService = getPlatformService(platform);

    // Synchroniser les jeux
    const gamesResult = await platformService.syncGames(platformAccount);
    if (!gamesResult.success || !gamesResult.data) {
      throw createError({
        statusCode: 400,
        statusMessage:
          gamesResult.error || "Échec de la synchronisation des jeux",
      });
    }

    // Sauvegarder les jeux en base de données
    const savedGames = [];
    console.log(gamesResult);
    for (const gameData of gamesResult.data) {
      const existingGame = await prisma.platformGame.findUnique({
        where: {
          platformAccountId_platformGameId: {
            platformAccountId: platformAccount.id,
            platformGameId: gameData.platformGameId,
          },
        },
      });

      let game;
      if (existingGame) {
        // Mettre à jour le jeu existant
        game = await prisma.platformGame.update({
          where: { id: existingGame.id },
          data: {
            name: gameData.name,
            playtimeTotal: gameData.playtimeTotal,
            playtimeRecent: gameData.playtimeRecent,
            lastPlayed: gameData.lastPlayed,
            iconUrl: gameData.iconUrl,
            coverUrl: gameData.coverUrl,
            isInstalled: gameData.isInstalled || false,
          },
        });
      } else {
        // Créer un nouveau jeu
        game = await prisma.platformGame.create({
          data: {
            platformAccountId: platformAccount.id,
            platformGameId: gameData.platformGameId,
            name: gameData.name,
            playtimeTotal: gameData.playtimeTotal,
            playtimeRecent: gameData.playtimeRecent,
            lastPlayed: gameData.lastPlayed,
            iconUrl: gameData.iconUrl,
            coverUrl: gameData.coverUrl,
            isInstalled: gameData.isInstalled || false,
          },
        });
      }
      savedGames.push(game);
    }

    // Mettre à jour la date de dernière synchronisation
    await prisma.platformAccount.update({
      where: { id: platformAccount.id },
      data: { lastSync: new Date() },
    });

    return {
      success: true,
      gamesCount: savedGames.length,
      games: savedGames,
    };
  } catch (error) {
    console.error("Erreur lors de la synchronisation:", error);

    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Erreur interne du serveur",
    });
  }
});
