import { defineEventHandler, createError } from "h3";
import { serverSupabaseUser } from "#supabase/server";
import { SteamService } from "~~/server/services/library/SteamService";
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

    // Récupérer le compte Steam de l'utilisateur
    const steamAccount = await prisma.platformAccount.findUnique({
      where: {
        userId_platform: {
          userId: user.id,
          platform: "STEAM",
        },
      },
    });

    if (!steamAccount) {
      throw createError({
        statusCode: 404,
        statusMessage:
          "Compte Steam non trouvé. Veuillez d'abord connecter votre compte Steam.",
      });
    }

    // Créer une instance du service Steam
    const steamService = new SteamService();

    // Synchroniser les jeux
    const syncResult = await steamService.syncGames(steamAccount);
    if (!syncResult.success || !syncResult.data) {
      throw createError({
        statusCode: 500,
        statusMessage:
          syncResult.error || "Échec de la synchronisation des jeux",
      });
    }

    // Filtrer les jeux selon la date de dernière synchronisation
    let gamesToSync = syncResult.data;

    if (steamAccount.lastSync) {
      console.log(
        `Synchronisation incrémentale Steam depuis ${steamAccount.lastSync.toISOString()}`
      );

      // Ne garder que les jeux joués après la dernière synchronisation
      // Ajouter une marge de 1 heure pour couvrir les décalages
      const syncThreshold = new Date(
        steamAccount.lastSync.getTime() - 60 * 60 * 1000
      );

      const originalCount = gamesToSync.length;
      gamesToSync = syncResult.data.filter((game) => {
        // Inclure les jeux avec lastPlayed récent
        if (game.lastPlayed && new Date(game.lastPlayed) > syncThreshold) {
          return true;
        }

        // Inclure les jeux joués dans les 2 dernières semaines (même sans lastPlayed)
        if (game.playtimeRecent && game.playtimeRecent > 0) {
          return true;
        }

        return false;
      });

      console.log(
        `Filtré ${gamesToSync.length} jeux modifiés sur ${originalCount} au total`
      );
    } else {
      console.log(
        "Première synchronisation Steam, traitement de tous les jeux"
      );
    }

    // Si aucun jeu n'a été joué depuis la dernière sync ET que ce n'est pas la première sync, terminer ici
    if (gamesToSync.length === 0 && steamAccount.lastSync) {
      await prisma.platformAccount.update({
        where: { id: steamAccount.id },
        data: { lastSync: new Date() },
      });

      return {
        success: true,
        syncedGames: 0,
        syncedAchievements: 0,
        message:
          "Aucun jeu Steam n'a été joué depuis la dernière synchronisation",
      };
    }

    // Mettre à jour ou créer les jeux dans la base de données de façon séquentielle
    console.log("Synchronisation de", gamesToSync.length, "jeux");

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
              platformAccountId: steamAccount.id,
              platformGameId: gameData.platformGameId,
            },
          },
        });

        if (
          !gameData.lastPlayed &&
          gameData.playtimeRecent &&
          gameData.playtimeRecent > 0
        ) {
          // Si pas de lastPlayed mais que le jeu a été joué dans les 2 dernières semaines
          gameData.lastPlayed = new Date();
        }

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
              platformAccountId: steamAccount.id,
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

    // Synchroniser les succès pour chaque jeu de façon séquentielle
    console.log("Synchronisation des succès pour", games.length, "jeux");

    const achievementResults = [];

    for (let i = 0; i < games.length; i++) {
      const game = games[i];
      if (!game) continue;
      
      console.log(
        `Synchronisation des succès pour ${game.name} (${i + 1}/${
          games.length
        })`
      );

      try {
        // Récupérer les succès existants
        const existingAchievements = await prisma.platformAchievement.findMany({
          where: { platformGameId: game.id },
          select: { achievementId: true, isUnlocked: true },
        });

        const existingUnlockedSet = new Set(
          existingAchievements
            .filter((ach) => ach.isUnlocked)
            .map((ach) => ach.achievementId)
        );

        const achievementsResult = await steamService.syncAchievements(
          steamAccount,
          game.platformGameId,
          existingUnlockedSet
        );

        if (achievementsResult.success && achievementsResult.data) {
          const { achievements, mostRecentUnlock } = achievementsResult.data;

          // Mettre à jour lastPlayed du jeu si de nouveaux succès ont été débloqués
          if (mostRecentUnlock && !game.lastPlayed) {
            await prisma.platformGame.update({
              where: { id: game.id },
              data: { lastPlayed: mostRecentUnlock },
            });
          }

          // Supprimer les anciens succès
          await prisma.platformAchievement.deleteMany({
            where: { platformGameId: game.id },
          });

          // Créer les nouveaux succès
          if (achievements.length > 0) {
            await prisma.platformAchievement.createMany({
              data: achievements.map((achievement) => ({
                platformGameId: game.id,
                achievementId: achievement.achievementId,
                name: achievement.name,
                description: achievement.description,
                iconUrl: achievement.iconUrl,
                isUnlocked: achievement.isUnlocked,
                unlockedAt: achievement.unlockedAt,
                rarity: achievement.rarity,
                points: achievement.points,
              })),
            });
          }

          achievementResults.push({
            gameId: game.id,
            gameName: game.name,
            count: achievements.length,
            hasNewUnlocks: !!mostRecentUnlock,
          });
        } else {
          achievementResults.push({
            gameId: game.id,
            gameName: game.name,
            count: 0,
            hasNewUnlocks: false,
          });
        }
      } catch (error) {
        console.error(
          `Erreur lors de la synchronisation des succès pour ${game.name}:`,
          error
        );
        achievementResults.push({
          gameId: game.id,
          gameName: game.name,
          count: 0,
          error: true,
          hasNewUnlocks: false,
        });
      }
    }
    const totalAchievements = achievementResults.reduce(
      (sum, result) => sum + result.count,
      0
    );

    // Mettre à jour la date de dernière synchronisation seulement en cas de succès
    await prisma.platformAccount.update({
      where: { id: steamAccount.id },
      data: { lastSync: new Date() },
    });

    return {
      success: true,
      syncedGames: games.length,
      syncedAchievements: totalAchievements,
      games,
    };
  } catch (error) {
    console.error("Erreur lors de la synchronisation Steam:", error);

    // Ne pas mettre à jour lastSync en cas d'erreur
    let errorMessage = "Erreur lors de la synchronisation Steam";

    if (error && typeof error === "object" && "statusMessage" in error) {
      errorMessage = String(error.statusMessage);
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    if (error && typeof error === "object" && "statusCode" in error) {
      throw createError({
        statusCode: error.statusCode as number,
        statusMessage: errorMessage,
        data: { platform: "Steam", canRetry: true },
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: errorMessage,
      data: { platform: "Steam", canRetry: true },
    });
  }
});
