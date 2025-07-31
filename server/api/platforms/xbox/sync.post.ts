import { defineEventHandler, readBody, createError } from "h3";
import { serverSupabaseUser } from "#supabase/server";
import { XboxService } from "../../../utils/gaming-platforms/xbox/XboxService";
import prisma from "../../../../lib/prisma";

interface XboxSyncRequest {
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

    // Lire les données de la requête
    const body = await readBody<XboxSyncRequest>(event);
    if (!body.accountId) {
      throw createError({
        statusCode: 400,
        statusMessage: "ID du compte Xbox requis",
      });
    }

    // Vérifier que le compte appartient à l'utilisateur
    const platformAccount = await prisma.platformAccount.findFirst({
      where: {
        id: body.accountId,
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

    // Créer une instance du service Xbox
    const xboxService = new XboxService();

    // Synchroniser les jeux
    const gamesResult = await xboxService.syncGames(platformAccount);
    if (!gamesResult.success) {
      throw createError({
        statusCode: 500,
        statusMessage:
          gamesResult.error ||
          "Erreur lors de la synchronisation des jeux Xbox",
      });
    }

    const games = gamesResult.data || [];
    let syncedGamesCount = 0;
    let syncedAchievementsCount = 0;

    // Traiter chaque jeu
    for (const gameData of games) {
      try {
        // Créer ou mettre à jour le jeu
        const game = await prisma.platformGame.upsert({
          where: {
            platformAccountId_platformGameId: {
              platformAccountId: platformAccount.id,
              platformGameId: gameData.platformGameId,
            },
          },
          update: {
            name: gameData.name,
            playtimeTotal: gameData.playtimeTotal,
            playtimeRecent: gameData.playtimeRecent,
            lastPlayed: gameData.lastPlayed,
            iconUrl: gameData.iconUrl,
            coverUrl: gameData.coverUrl,
            isInstalled: gameData.isInstalled,
            updatedAt: new Date(),
          },
          create: {
            platformAccountId: platformAccount.id,
            platformGameId: gameData.platformGameId,
            name: gameData.name,
            playtimeTotal: gameData.playtimeTotal || 0,
            playtimeRecent: gameData.playtimeRecent,
            lastPlayed: gameData.lastPlayed,
            iconUrl: gameData.iconUrl,
            coverUrl: gameData.coverUrl,
            isInstalled: gameData.isInstalled || false,
          },
        });

        syncedGamesCount++;

        //Synchroniser les succès pour ce jeu
        const achievementsResult = await xboxService.syncAchievements(
          platformAccount,
          gameData.platformGameId
        );

        if (achievementsResult.success && achievementsResult.data) {
          const achievements = achievementsResult.data;

          // Traiter chaque succès
          for (const achievementData of achievements) {
            try {
              await prisma.platformAchievement.upsert({
                where: {
                  platformGameId_achievementId: {
                    platformGameId: game.id,
                    achievementId: achievementData.achievementId,
                  },
                },
                update: {
                  name: achievementData.name,
                  description: achievementData.description,
                  iconUrl: achievementData.iconUrl,
                  isUnlocked: achievementData.isUnlocked,
                  unlockedAt: achievementData.unlockedAt,
                  rarity: achievementData.rarity,
                  points: achievementData.points,
                  updatedAt: new Date(),
                },
                create: {
                  platformGameId: game.id,
                  achievementId: achievementData.achievementId,
                  name: achievementData.name,
                  description: achievementData.description,
                  iconUrl: achievementData.iconUrl,
                  isUnlocked: achievementData.isUnlocked || false,
                  unlockedAt: achievementData.unlockedAt,
                  rarity: achievementData.rarity,
                  points: achievementData.points,
                },
              });

              syncedAchievementsCount++;
            } catch (achievementError) {
              console.error(
                `Erreur lors de la synchronisation du succès ${achievementData.achievementId}:`,
                achievementError
              );
              // Continuer avec les autres succès
            }
          }
        }
      } catch (gameError) {
        console.error(
          `Erreur lors de la synchronisation du jeu ${gameData.platformGameId}:`,
          gameError
        );
        // Continuer avec les autres jeux
      }
    }

    // Mettre à jour la date de dernière synchronisation
    await prisma.platformAccount.update({
      where: { id: platformAccount.id },
      data: { lastSync: new Date() },
    });

    return {
      success: true,
      message: "Synchronisation Xbox terminée avec succès",
      stats: {
        syncedGames: syncedGamesCount,
        syncedAchievements: syncedAchievementsCount,
        totalGames: games.length,
      },
    };
  } catch (error) {
    console.error("Erreur lors de la synchronisation Xbox:", error);

    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Erreur interne du serveur",
    });
  }
});
