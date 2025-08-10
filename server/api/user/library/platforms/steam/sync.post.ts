import { defineEventHandler, createError } from "h3";
import { serverSupabaseUser } from "#supabase/server";
import { SteamService } from "@@/server/utils/gaming-platforms/steam/SteamService";
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

    // Mettre à jour ou créer les jeux dans la base de données
    const gamePromises = syncResult.data.map(async (gameData) => {
      const existingGame = await prisma.platformGame.findUnique({
        where: {
          platformAccountId_platformGameId: {
            platformAccountId: steamAccount.id,
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
    });

    const games = await Promise.all(gamePromises);

    // Synchroniser les succès pour chaque jeu
    console.log("Synchronisation des succès pour", games.length, "jeux");
    const achievementPromises = games.map(async (game) => {
      try {
        const achievementsResult = await steamService.syncAchievements(
          steamAccount,
          game.platformGameId
        );

        if (achievementsResult.success && achievementsResult.data) {
          // Supprimer les anciens succès
          await prisma.platformAchievement.deleteMany({
            where: { platformGameId: game.id },
          });

          // Créer les nouveaux succès
          if (achievementsResult.data.length > 0) {
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
          }
          return { gameId: game.id, count: achievementsResult.data.length };
        }
        return { gameId: game.id, count: 0 };
      } catch (error) {
        console.error(
          `Erreur lors de la synchronisation des succès pour ${game.name}:`,
          error
        );
        return { gameId: game.id, count: 0, error: true };
      }
    });

    const achievementResults = await Promise.all(achievementPromises);
    const totalAchievements = achievementResults.reduce(
      (sum, result) => sum + result.count,
      0
    );

    // Mettre à jour la date de dernière synchronisation
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

    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Erreur interne du serveur",
    });
  }
});
