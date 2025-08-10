import { defineEventHandler, createError } from "h3";
import { serverSupabaseUser } from "#supabase/server";
import { PlayStationService } from "@@/server/utils/gaming-platforms/playstation/PlayStationService";
import prisma from "@@/lib/prisma";
import type { Prisma } from "@prisma/client";

type GameToUpdate = {
  where: { id: number };
  data: Prisma.PlatformGameUpdateInput;
};

type CreatedGame = {
  id: number;
  platformGameId: string;
};

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
    });

    if (!playstationAccount) {
      throw createError({
        statusCode: 404,
        statusMessage:
          "Compte PlayStation non trouvé. Veuillez d'abord connecter votre compte PlayStation.",
      });
    }

    // Créer une instance du service PlayStation
    const playStationService = new PlayStationService();

    // Vérifier si nous avons un token NPSSO stocké
    if (!playstationAccount.accessToken) {
      throw createError({
        statusCode: 400,
        statusMessage:
          "Token NPSSO manquant. Veuillez vous reconnecter à PlayStation Network.",
      });
    }

    // Réauthentifier avec le NPSSO stocké si nécessaire
    let currentAccount = playstationAccount;
    try {
      const reAuthResult = await playStationService.authenticate({
        npsso: playstationAccount.accessToken,
        username: playstationAccount.username || "",
      });

      if (reAuthResult.success && reAuthResult.data) {
        // Mettre à jour les informations du compte si elles ont changé
        currentAccount = await prisma.platformAccount.update({
          where: { id: playstationAccount.id },
          data: {
            username: reAuthResult.data.username,
            displayName: reAuthResult.data.displayName,
            avatarUrl: reAuthResult.data.avatarUrl,
            profileUrl: reAuthResult.data.profileUrl,
          },
        });
      }
    } catch (error) {
      console.log(error);
      throw createError({
        statusCode: 401,
        statusMessage:
          "Impossible de réauthentifier avec PlayStation Network. Veuillez vous reconnecter.",
      });
    }

    // Déterminer la stratégie de synchronisation
    const lastSync = currentAccount.lastSync;
    const isFullSync = true; //!lastSync;

    console.log(
      `Mode de synchronisation: ${
        isFullSync ? "COMPLET" : "INCREMENTAL"
      }, dernière sync: ${lastSync?.toISOString() || "jamais"}`
    );

    // Synchroniser les jeux
    const syncResult = await playStationService.syncGames();
    console.log(syncResult);
    if (!syncResult.success || !syncResult.data) {
      throw createError({
        statusCode: 500,
        statusMessage:
          syncResult.error || "Échec de la synchronisation des jeux",
      });
    }

    // Filtrer les jeux à synchroniser selon la stratégie
    let gamesToSync = syncResult.data;
    if (!isFullSync && lastSync) {
      // Ne garder que les jeux joués après la dernière synchronisation
      // avec une marge de 24h pour couvrir les décalages horaires
      const syncThreshold = new Date(lastSync.getTime() - 24 * 60 * 60 * 1000);

      gamesToSync = syncResult.data.filter((game) => {
        if (!game.lastPlayed) return false;
        const lastPlayedDate = new Date(game.lastPlayed);
        return lastPlayedDate > syncThreshold;
      });

      console.log(
        `Synchronisation incrémentale: ${gamesToSync.length} jeux modifiés sur ${syncResult.data.length} au total`
      );
    }

    // Si aucun jeu n'a été joué depuis la dernière sync, terminer ici
    if (gamesToSync.length === 0 && !isFullSync) {
      await prisma.platformAccount.update({
        where: { id: currentAccount.id },
        data: { lastSync: new Date() },
      });

      return {
        success: true,
        syncedGames: 0,
        syncedAchievements: 0,
        details: {
          gamesCreated: 0,
          gamesUpdated: 0,
          achievementsSynced: 0,
          message: "Aucun jeu n'a été joué depuis la dernière synchronisation",
        },
      };
    }

    // Récupérer uniquement les jeux qui nous intéressent
    const platformGameIds = gamesToSync.map((g) => g.platformGameId);
    const existingGames = await prisma.platformGame.findMany({
      where: {
        platformAccountId: currentAccount.id,
        platformGameId: { in: platformGameIds },
      },
      select: {
        id: true,
        platformGameId: true,
        name: true,
      },
    });

    // Créer des maps pour un accès rapide
    const existingGamesMap = new Map(
      existingGames.map((game) => [game.platformGameId, game])
    );

    // Préparer les données pour les batch operations
    const gamesToCreate: Prisma.PlatformGameCreateManyInput[] = [];
    const gamesToUpdate: GameToUpdate[] = [];
    const gameIdMapping = new Map<string, { id: number; isPs5Game: boolean }>();

    // Trier les jeux à créer ou mettre à jour
    for (const gameData of gamesToSync) {
      const existingGame = existingGamesMap.get(gameData.platformGameId);

      const gameInfo = {
        name: gameData.name,
        playtimeTotal: gameData.playtimeTotal,
        playtimeRecent: gameData.playtimeRecent,
        lastPlayed: gameData.lastPlayed,
        iconUrl: gameData.iconUrl,
        coverUrl: gameData.coverUrl,
        isInstalled: gameData.isInstalled,
      };

      if (existingGame) {
        gamesToUpdate.push({
          where: { id: existingGame.id },
          data: gameInfo,
        });
        gameIdMapping.set(gameData.platformGameId, {
          id: existingGame.id,
          isPs5Game: gameData.isPs5Game ?? false,
        });
      } else {
        gamesToCreate.push({
          ...gameInfo,
          platformAccountId: currentAccount.id,
          platformGameId: gameData.platformGameId,
        });
      }
    }

    // Créer les nouveaux jeux
    let createdGames: CreatedGame[] = [];
    if (gamesToCreate.length > 0) {
      await prisma.platformGame.createMany({
        data: gamesToCreate,
      });

      // Récupérer les IDs des jeux créés
      createdGames = await prisma.platformGame.findMany({
        where: {
          platformAccountId: currentAccount.id,
          platformGameId: {
            in: gamesToCreate.map((g) => g.platformGameId),
          },
        },
        select: {
          id: true,
          platformGameId: true,
        },
      });

      // Ajouter au mapping
      createdGames.forEach((game) => {
        const originalData = gamesToSync.find(
          (g) => g.platformGameId === game.platformGameId
        );
        gameIdMapping.set(game.platformGameId, {
          id: game.id,
          isPs5Game: originalData?.isPs5Game ?? false,
        });
      });
    }

    // Mettre à jour les jeux existants en batch
    const updatedGames = [];

    // Utiliser des promesses pour paralléliser les mises à jour
    const UPDATE_BATCH_SIZE = 10;
    for (let i = 0; i < gamesToUpdate.length; i += UPDATE_BATCH_SIZE) {
      const batch = gamesToUpdate.slice(i, i + UPDATE_BATCH_SIZE);
      const batchPromises = batch.map((updateData) =>
        prisma.platformGame.update(updateData)
      );
      const batchResults = await Promise.all(batchPromises);
      updatedGames.push(...batchResults);
    }

    // Synchroniser les trophées uniquement pour les jeux modifiés
    console.log(
      "Synchronisation des trophées pour",
      gameIdMapping.size,
      "jeux"
    );

    const BATCH_SIZE = 20; // Réduit encore pour éviter la surcharge
    const gameEntries = Array.from(gameIdMapping.entries());
    const allAchievements: Prisma.PlatformAchievementCreateManyInput[] = [];
    const gameIdsWithAchievements: number[] = [];

    // Récupérer les achievements existants pour comparaison
    const existingAchievementCounts = await prisma.platformAchievement.groupBy({
      by: ["platformGameId"],
      where: {
        platformGameId: {
          in: Array.from(gameIdMapping.values()).map((g) => g.id),
        },
      },
      _count: {
        id: true,
      },
    });

    const achievementCountMap = new Map(
      existingAchievementCounts.map((item) => [
        item.platformGameId,
        item._count.id,
      ])
    );

    for (let i = 0; i < gameEntries.length; i += BATCH_SIZE) {
      const batch = gameEntries.slice(i, i + BATCH_SIZE);

      const batchPromises = batch.map(async ([platformGameId, gameInfo]) => {
        try {
          const achievementsResult = await playStationService.syncAchievements(
            platformGameId,
            gameInfo.isPs5Game
          );
          if (
            achievementsResult.success &&
            achievementsResult.data &&
            achievementsResult.data.length > 0
          ) {
            // Vérifier si le nombre d'achievements a changé
            const currentCount = achievementCountMap.get(gameInfo.id) || 0;
            const newCount = achievementsResult.data.length;

            // Ne mettre à jour que si le nombre a changé ou si c'est un nouveau jeu
            if (
              currentCount !== newCount ||
              !achievementCountMap.has(gameInfo.id)
            ) {
              gameIdsWithAchievements.push(gameInfo.id);

              const achievements = achievementsResult.data.map(
                (achievement) => ({
                  platformGameId: gameInfo.id,
                  achievementId: achievement.achievementId,
                  name: achievement.name,
                  description: achievement.description,
                  iconUrl: achievement.iconUrl,
                  isUnlocked: achievement.isUnlocked,
                  unlockedAt: achievement.unlockedAt,
                  rarity: achievement.rarity,
                  earnedRate: achievement.earnedRate,
                  points: achievement.points,
                })
              );
              return achievements;
            }
          }
          return [];
        } catch (error) {
          console.error(
            `Erreur lors de la synchronisation des trophées pour ${platformGameId}:`,
            error
          );
          return [];
        }
      });

      const batchResults = await Promise.all(batchPromises);
      allAchievements.push(...batchResults.flat());
      console.log(allAchievements);
      // Pause entre les batches
      if (i + BATCH_SIZE < gameEntries.length) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    // Supprimer et recréer uniquement les achievements modifiés
    if (gameIdsWithAchievements.length > 0) {
      await prisma.platformAchievement.deleteMany({
        where: {
          platformGameId: {
            in: gameIdsWithAchievements,
          },
        },
      });
    }

    if (allAchievements.length > 0) {
      // Insérer par chunks pour éviter les limites de taille de requête
      const ACHIEVEMENT_CHUNK_SIZE = 500; // Réduit pour plus de sécurité
      for (let i = 0; i < allAchievements.length; i += ACHIEVEMENT_CHUNK_SIZE) {
        const chunk = allAchievements.slice(i, i + ACHIEVEMENT_CHUNK_SIZE);
        await prisma.platformAchievement.createMany({
          data: chunk,
          skipDuplicates: true,
        });
      }
    }

    // Mettre à jour la date de dernière synchronisation
    await prisma.platformAccount.update({
      where: { id: currentAccount.id },
      data: { lastSync: new Date() },
    });

    return {
      success: true,
      syncedGames: createdGames.length + updatedGames.length,
      syncedAchievements: allAchievements.length,
      details: {
        gamesCreated: createdGames.length,
        gamesUpdated: updatedGames.length,
        achievementsSynced: allAchievements.length,
        syncType: isFullSync ? "full" : "incremental",
        gamesChecked: gamesToSync.length,
        totalGames: syncResult.data.length,
      },
    };
  } catch (error) {
    console.error("Erreur lors de la synchronisation PlayStation:", error);

    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Erreur interne du serveur",
    });
  }
});
