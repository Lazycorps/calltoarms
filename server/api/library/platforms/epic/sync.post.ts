import { defineEventHandler, createError } from "h3";
import { serverSupabaseUser } from "#supabase/server";
import { EpicService } from "@@/server/utils/gaming-platforms/epic/EpicService";
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

    // Récupérer le compte Epic Games de l'utilisateur
    const epicAccount = await prisma.platformAccount.findUnique({
      where: {
        userId_platform: {
          userId: user.id,
          platform: "EPIC_GAMES",
        },
      },
    });

    if (!epicAccount) {
      throw createError({
        statusCode: 404,
        statusMessage:
          "Compte Epic Games non trouvé. Veuillez d'abord connecter votre compte Epic Games.",
      });
    }

    console.log("Epic account found:", {
      id: epicAccount.id,
      platformId: epicAccount.platformId,
      hasAccessToken: !!epicAccount.accessToken,
      hasRefreshToken: !!epicAccount.refreshToken,
      lastSync: epicAccount.lastSync
    });

    // Créer une instance du service Epic Games
    const epicService = new EpicService();

    // Vérifier si on a un token d'accès ou un refresh token
    if (!epicAccount.accessToken && !epicAccount.refreshToken) {
      throw createError({
        statusCode: 401,
        statusMessage: "Tokens Epic Games manquants. Veuillez reconnecter votre compte Epic Games.",
      });
    }

    // Vérifier si le token d'accès est encore valide, sinon le rafraîchir
    let workingAccount = epicAccount;
    if (!epicAccount.accessToken && epicAccount.refreshToken) {
      console.log("Refreshing Epic Games token...");
      const refreshResult = await epicService.refreshToken(epicAccount);
      if (refreshResult.success && refreshResult.data) {
        // Mettre à jour les tokens en base de données
        workingAccount = await prisma.platformAccount.update({
          where: { id: epicAccount.id },
          data: {
            accessToken: refreshResult.data.accessToken,
            refreshToken: refreshResult.data.refreshToken,
          },
        });
        console.log("Epic Games token refreshed successfully");
      } else {
        console.error("Failed to refresh Epic Games token:", refreshResult.error);
        throw createError({
          statusCode: 401,
          statusMessage: "Impossible de rafraîchir le token Epic Games. Veuillez reconnecter votre compte.",
        });
      }
    } else if (epicAccount.accessToken && epicAccount.refreshToken) {
      // Essayer de rafraîchir de manière proactive si on a les deux tokens
      const refreshResult = await epicService.refreshToken(epicAccount);
      if (refreshResult.success && refreshResult.data) {
        workingAccount = await prisma.platformAccount.update({
          where: { id: epicAccount.id },
          data: {
            accessToken: refreshResult.data.accessToken,
            refreshToken: refreshResult.data.refreshToken,
          },
        });
        console.log("Epic Games token proactively refreshed");
      }
    }

    // Vérifier une dernière fois qu'on a bien un access token
    if (!workingAccount.accessToken) {
      throw createError({
        statusCode: 401,
        statusMessage: "Token d'accès Epic Games manquant. Veuillez reconnecter votre compte Epic Games.",
      });
    }

    // Synchroniser les jeux
    const syncResult = await epicService.syncGames(workingAccount);
    if (!syncResult.success) {
      console.error("Epic Games sync error:", syncResult.error);
      throw createError({
        statusCode: 500,
        statusMessage:
          syncResult.error || "Échec de la synchronisation des jeux Epic Games",
      });
    }
    
    if (!syncResult.data) {
      console.warn("Epic Games sync returned empty data");
      syncResult.data = []; // Traiter comme une liste vide
    }

    // Filtrer les jeux selon la date de dernière synchronisation
    let gamesToSync = syncResult.data;
    
    if (epicAccount.lastSync) {
      console.log(`Synchronisation incrémentale Epic Games depuis ${epicAccount.lastSync.toISOString()}`);
      
      // Ne garder que les jeux joués après la dernière synchronisation
      // Ajouter une marge de 1 heure pour couvrir les décalages
      const syncThreshold = new Date(epicAccount.lastSync.getTime() - 60 * 60 * 1000);
      
      const originalCount = gamesToSync.length;
      gamesToSync = syncResult.data.filter((game) => {
        // Inclure les jeux avec lastPlayed récent
        if (game.lastPlayed && new Date(game.lastPlayed) > syncThreshold) {
          return true;
        }
        
        // Pour Epic Games, inclure les jeux installés (indicateur d'activité récente)
        if (game.isInstalled) {
          return true;
        }
        
        return false;
      });
      
      console.log(`Filtré ${gamesToSync.length} jeux modifiés sur ${originalCount} au total`);
    } else {
      console.log("Première synchronisation Epic Games, traitement de tous les jeux");
    }

    // Si aucun jeu n'a été joué depuis la dernière sync ET que ce n'est pas la première sync, terminer ici
    if (gamesToSync.length === 0 && epicAccount.lastSync) {
      await prisma.platformAccount.update({
        where: { id: epicAccount.id },
        data: { lastSync: new Date() },
      });

      return {
        success: true,
        syncedGames: 0,
        syncedAchievements: 0,
        message: "Aucun jeu Epic Games n'a été joué depuis la dernière synchronisation",
      };
    }

    // Mettre à jour ou créer les jeux dans la base de données
    const gamePromises = gamesToSync.map(async (gameData) => {
      const existingGame = await prisma.platformGame.findUnique({
        where: {
          platformAccountId_platformGameId: {
            platformAccountId: epicAccount.id,
            platformGameId: gameData.platformGameId,
          },
        },
      });

      if (existingGame) {
        // Mettre à jour le jeu existant
        return prisma.platformGame.update({
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
        return prisma.platformGame.create({
          data: {
            platformAccountId: epicAccount.id,
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
    });

    const games = await Promise.all(gamePromises);

    // Synchroniser les succès pour chaque jeu
    console.log("Synchronisation des succès Epic Games pour", games.length, "jeux");
    const achievementPromises = games.map(async (game) => {
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

        const achievementsResult = await epicService.syncAchievements(
          workingAccount,
          game.platformGameId,
          existingUnlockedSet
        );

        if (achievementsResult.success && achievementsResult.data) {
          const { achievements, mostRecentUnlock } = achievementsResult.data;
          
          // Mettre à jour lastPlayed du jeu si de nouveaux succès ont été débloqués
          if (mostRecentUnlock && (!game.lastPlayed || mostRecentUnlock > game.lastPlayed)) {
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
          return { gameId: game.id, count: achievements.length, hasNewUnlocks: !!mostRecentUnlock };
        }
        return { gameId: game.id, count: 0, hasNewUnlocks: false };
      } catch (error) {
        console.error(
          `Erreur lors de la synchronisation des succès Epic Games pour ${game.name}:`,
          error
        );
        return { gameId: game.id, count: 0, error: true, hasNewUnlocks: false };
      }
    });

    const achievementResults = await Promise.all(achievementPromises);
    const totalAchievements = achievementResults.reduce(
      (sum, result) => sum + result.count,
      0
    );

    // Mettre à jour la date de dernière synchronisation seulement en cas de succès
    await prisma.platformAccount.update({
      where: { id: epicAccount.id },
      data: { lastSync: new Date() },
    });

    return {
      success: true,
      syncedGames: games.length,
      syncedAchievements: totalAchievements,
      games,
    };
  } catch (error) {
    console.error("Erreur lors de la synchronisation Epic Games:", error);

    // Ne pas mettre à jour lastSync en cas d'erreur
    let errorMessage = "Erreur lors de la synchronisation Epic Games";
    
    if (error && typeof error === "object" && "statusMessage" in error) {
      errorMessage = String(error.statusMessage);
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    if (error && typeof error === "object" && "statusCode" in error) {
      throw createError({
        statusCode: error.statusCode as number,
        statusMessage: errorMessage,
        data: { platform: "Epic Games", canRetry: true }
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: errorMessage,
      data: { platform: "Epic Games", canRetry: true }
    });
  }
});