// server/api/library/platforms/xbox/sync.ts
import { defineEventHandler, readBody, createError } from "h3";
import { serverSupabaseUser } from "#supabase/server";
import { XboxService } from "@@/server/utils/gaming-platforms/xbox/XboxService";
import prisma from "~~/lib/prisma";

interface XboxSyncRequest {
  accountId: number;
}

interface XboxTokens {
  userHash: string;
  xuid: string;
  xstsToken: string;
  xstsTokenExpiry: string;
  msAccessToken: string;
  msTokenExpiry: string;
  refreshToken: string;
}

interface XboxMetadata {
  userHash?: string;
  xuid?: string;
  xstsTokenExpiry?: string;
  msAccessToken?: string;
  msTokenExpiry?: string;
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

    const metadata = platformAccount.metadata as XboxMetadata;
    let tokens: XboxTokens = {
      userHash: metadata?.userHash || "",
      xuid: metadata?.xuid || "",
      xstsToken: platformAccount.accessToken || "",
      xstsTokenExpiry: metadata?.xstsTokenExpiry || "",
      msAccessToken: metadata?.msAccessToken || "",
      msTokenExpiry: metadata?.msTokenExpiry || "",
      refreshToken: platformAccount.refreshToken!,
    };

    // Vérifier si les tokens sont expirés et les renouveler si nécessaire
    const now = new Date();
    const xstsExpiry = new Date(tokens.xstsTokenExpiry);

    if (xstsExpiry <= now) {
      console.log("XSTS token expiré, renouvellement...");
      tokens = await xboxService.refreshXboxTokens(tokens, platformAccount.id);
    }

    // Synchroniser les jeux
    const gamesResult = await xboxService.syncGames(platformAccount, tokens);
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
    let syncError = false;
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
          tokens,
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
              syncError = true;
              // Continuer avec les autres succès
            }
          }
        }
      } catch (gameError) {
        console.error(
          `Erreur lors de la synchronisation du jeu ${gameData.platformGameId}:`,
          gameError
        );
        syncError = true;
        // Continuer avec les autres jeux
      }
    }

    // Mettre à jour la date de dernière synchronisation seulement en cas de succès
    if (syncError)
      throw createError({
        statusCode: 500,
        statusMessage:
          gamesResult.error ||
          "Erreur lors de la synchronisation des jeux Xbox",
      });

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

    // Ne pas mettre à jour lastSync en cas d'erreur
    let errorMessage = "Erreur lors de la synchronisation Xbox";

    if (error && typeof error === "object" && "statusMessage" in error) {
      errorMessage = String(error.statusMessage);
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    if (error && typeof error === "object" && "statusCode" in error) {
      throw createError({
        statusCode: error.statusCode as number,
        statusMessage: errorMessage,
        data: { platform: "Xbox", canRetry: true },
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: errorMessage,
      data: { platform: "Xbox", canRetry: true },
    });
  }
});
