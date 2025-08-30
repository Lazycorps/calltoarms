import { defineEventHandler, createError } from "h3";
import { serverSupabaseUser } from "#supabase/server";
import { RiotService } from "~~/server/services/library/RiotService";
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
        statusMessage:
          "Compte Riot Games non trouvé. Veuillez d'abord connecter votre compte Riot Games.",
      });
    }

    // Créer une instance du service Riot
    const riotService = new RiotService();

    // Synchroniser les jeux
    const syncResult = await riotService.syncGames(riotAccount);
    if (!syncResult.success || !syncResult.data) {
      throw createError({
        statusCode: 500,
        statusMessage:
          syncResult.error || "Échec de la synchronisation des jeux Riot Games",
      });
    }

    // Synchroniser tous les jeux sans filtrage
    const gamesToSync = syncResult.data;
    console.log("Synchronisation de", gamesToSync.length, "jeux Riot Games");

    const games = [];

    for (let i = 0; i < gamesToSync.length; i++) {
      const gameData = gamesToSync[i];
      if (!gameData) continue;
      
      console.log(
        `Synchronisation du jeu ${gameData.name} (${i + 1}/${
          gamesToSync.length
        })`
      );

      try {
        const existingGame = await prisma.platformGame.findUnique({
          where: {
            platformAccountId_platformGameId: {
              platformAccountId: riotAccount.id,
              platformGameId: gameData.platformGameId,
            },
          },
        });

        // Pas de logique de modification des données - synchroniser tel quel

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
              isInstalled: gameData.isInstalled,
            },
          });
        } else {
          // Créer un nouveau jeu
          game = await prisma.platformGame.create({
            data: {
              platformAccountId: riotAccount.id,
              platformGameId: gameData.platformGameId,
              name: gameData.name,
              playtimeTotal: gameData.playtimeTotal,
              playtimeRecent: gameData.playtimeRecent,
              lastPlayed: gameData.lastPlayed,
              iconUrl: gameData.iconUrl,
              coverUrl: gameData.coverUrl,
              isInstalled: gameData.isInstalled,
            },
          });
        }

        games.push(game);
      } catch (error) {
        console.error(
          `Erreur lors de la synchronisation du jeu ${gameData.name}:`,
          error
        );
        // Continuer avec les autres jeux même en cas d'erreur
      }
    }

    // Riot Games ne propose pas d'API publique pour les succès/achievements
    // Les succès ne sont donc pas synchronisés

    // Mettre à jour la date de dernière synchronisation seulement en cas de succès
    await prisma.platformAccount.update({
      where: { id: riotAccount.id },
      data: { lastSync: new Date() },
    });

    return {
      success: true,
      syncedGames: games.length,
      syncedAchievements: 0, // Pas de succès disponibles via l'API Riot
      games,
      message: `${games.length} jeux Riot Games synchronisés avec succès`,
    };
  } catch (error) {
    console.error("Erreur lors de la synchronisation Riot Games:", error);

    // Ne pas mettre à jour lastSync en cas d'erreur
    let errorMessage = "Erreur lors de la synchronisation Riot Games";

    if (error && typeof error === "object" && "statusMessage" in error) {
      errorMessage = String(error.statusMessage);
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    if (error && typeof error === "object" && "statusCode" in error) {
      throw createError({
        statusCode: error.statusCode as number,
        statusMessage: errorMessage,
        data: { platform: "Riot Games", canRetry: true },
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: errorMessage,
      data: { platform: "Riot Games", canRetry: true },
    });
  }
});
