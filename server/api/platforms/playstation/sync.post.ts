import { defineEventHandler, createError } from "h3";
import { serverSupabaseUser } from "#supabase/server";
import { PlayStationService } from "../../../utils/gaming-platforms/playstation/PlayStationService";
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
    });

    if (!playstationAccount) {
      throw createError({
        statusCode: 404,
        statusMessage: "Compte PlayStation non trouvé. Veuillez d'abord connecter votre compte PlayStation.",
      });
    }

    // Créer une instance du service PlayStation
    const playStationService = new PlayStationService();

    // Vérifier si nous avons un token NPSSO stocké
    if (!playstationAccount.accessToken) {
      throw createError({
        statusCode: 400,
        statusMessage: "Token NPSSO manquant. Veuillez vous reconnecter à PlayStation Network.",
      });
    }

    // Réauthentifier avec le NPSSO stocké si nécessaire
    let currentAccount = playstationAccount;
    try {
      const reAuthResult = await playStationService.authenticate({ 
        npsso: playstationAccount.accessToken,
        username: playstationAccount.username || ""
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
      throw createError({
        statusCode: 401,
        statusMessage: "Impossible de réauthentifier avec PlayStation Network. Veuillez vous reconnecter.",
      });
    }

    // Synchroniser les jeux
    const syncResult = await playStationService.syncGames(currentAccount);
    if (!syncResult.success || !syncResult.data) {
      throw createError({
        statusCode: 500,
        statusMessage: syncResult.error || "Échec de la synchronisation des jeux",
      });
    }

    // Mettre à jour ou créer les jeux dans la base de données
    const gamePromises = syncResult.data.map(async (gameData) => {
      const existingGame = await prisma.platformGame.findUnique({
        where: {
          platformAccountId_platformGameId: {
            platformAccountId: currentAccount.id,
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
            platformAccountId: currentAccount.id,
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

    // Synchroniser les trophées pour chaque jeu
    console.log("Synchronisation des trophées pour", games.length, "jeux");
    const achievementPromises = games.map(async (game) => {
      try {
        const achievementsResult = await playStationService.syncAchievements(
          game.platformGameId,
          syncResult.data?.find(g => g.platformGameId == game.platformGameId)?.isPs5Game ?? false
        );

        if (achievementsResult.success && achievementsResult.data) {
          // Supprimer les anciens trophées
          await prisma.platformAchievement.deleteMany({
            where: { platformGameId: game.id },
          });

          // Créer les nouveaux trophées
          if (achievementsResult.data.length > 0) {
            console.log(`Creating ${achievementsResult.data.length} achievements for game ${game.name}:`, 
              achievementsResult.data.slice(0, 2).map(a => ({ id: a.achievementId, name: a.name })));
            
            await prisma.platformAchievement.createMany({
              data: achievementsResult.data.map((achievement) => ({
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
          } else {
            console.log(`No achievements to create for game ${game.name}`);
          }
          return { gameId: game.id, count: achievementsResult.data.length };
        }
        return { gameId: game.id, count: 0 };
      } catch (error) {
        console.error(`Erreur lors de la synchronisation des trophées pour ${game.name}:`, error);
        return { gameId: game.id, count: 0, error: true };
      }
    });

    const achievementResults = await Promise.all(achievementPromises);
    const totalAchievements = achievementResults.reduce((sum, result) => sum + result.count, 0);

    // Mettre à jour la date de dernière synchronisation
    await prisma.platformAccount.update({
      where: { id: currentAccount.id },
      data: { lastSync: new Date() },
    });

    return {
      success: true,
      syncedGames: games.length,
      syncedAchievements: totalAchievements,
      games,
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