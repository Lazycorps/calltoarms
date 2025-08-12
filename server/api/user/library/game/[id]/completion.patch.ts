import { defineEventHandler, createError, readBody } from "h3";
import { serverSupabaseUser } from "#supabase/server";
import prisma from "~~/lib/prisma";
import type {
  LibraryResponseDTO,
  PlatformGameDTO,
} from "~~/shared/types/library";

export default defineEventHandler(
  async (
    event
  ): Promise<
    LibraryResponseDTO<{ message: string; game: PlatformGameDTO }>
  > => {
    try {
      // Vérifier l'authentification
      const user = await serverSupabaseUser(event);
      if (!user) {
        throw createError({
          statusCode: 401,
          statusMessage: "Authentification requise",
        });
      }

      // Récupérer l'ID du jeu depuis l'URL
      const gameId = getRouterParam(event, "id");
      console.log(gameId);
      if (!gameId) {
        throw createError({
          statusCode: 400,
          statusMessage: "ID du jeu manquant",
        });
      }

      // Lire le body de la requête
      const body = await readBody(event);
      const { isCompleted } = body;

      if (typeof isCompleted !== "boolean") {
        throw createError({
          statusCode: 400,
          statusMessage: "Le statut de completion doit être un booléen",
        });
      }

      // Vérifier que le jeu appartient à l'utilisateur
      const existingGame = await prisma.platformGame.findFirst({
        where: {
          id: parseInt(gameId),
          platformAccount: {
            userId: user.id,
          },
        },
        include: {
          achievements: {
            where: {
              isUnlocked: true,
            },
            orderBy: {
              unlockedAt: 'desc',
            },
            take: 1,
          },
        },
      });

      if (!existingGame) {
        throw createError({
          statusCode: 404,
          statusMessage: "Jeu non trouvé",
        });
      }

      // Déterminer la date de completion :
      // - Date du dernier succès débloqué si disponible
      // - Sinon date de dernière session (lastPlayed)
      let completedDate = existingGame.lastPlayed;
      
      if (existingGame.achievements.length > 0) {
        const latestAchievementDate = existingGame.achievements[0].unlockedAt;
        if (latestAchievementDate) {
          completedDate = latestAchievementDate;
        }
      }
      // Mettre à jour le statut de completion
      const updatedGame = await prisma.platformGame.update({
        where: {
          id: parseInt(gameId),
        },
        data: {
          isCompleted,
          completedAt: completedDate ? completedDate : null,
          updatedAt: new Date(),
        },
        include: {
          platformAccount: {
            select: {
              id: true,
              platform: true,
              platformId: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              profileUrl: true,
              isActive: true,
              lastSync: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          achievements: true,
          _count: {
            select: {
              achievements: true,
            },
          },
        },
      });

      // Mapper vers DTO
      const totalAchievements = updatedGame._count.achievements;
      const unlockedAchievements = updatedGame.achievements.filter(
        (a) => a.isUnlocked
      ).length;
      const achievementPercentage =
        totalAchievements > 0
          ? Math.round((unlockedAchievements / totalAchievements) * 100)
          : 0;

      const gameDTO: PlatformGameDTO = {
        id: updatedGame.id,
        platformGameId: updatedGame.platformGameId,
        name: updatedGame.name,
        playtimeTotal: updatedGame.playtimeTotal,
        playtimeRecent: updatedGame.playtimeRecent || undefined,
        lastPlayed: updatedGame.lastPlayed || undefined,
        iconUrl: updatedGame.iconUrl || undefined,
        coverUrl: updatedGame.coverUrl || undefined,
        isInstalled: updatedGame.isInstalled,
        isCompleted: updatedGame.isCompleted,
        completedAt: updatedGame.completedAt || undefined,
        platformAccount: {
          id: updatedGame.platformAccount.id,
          platform: updatedGame.platformAccount.platform,
          platformId: updatedGame.platformAccount.platformId,
          username: updatedGame.platformAccount.username || undefined,
          displayName: updatedGame.platformAccount.displayName || undefined,
          avatarUrl: updatedGame.platformAccount.avatarUrl || undefined,
          profileUrl: updatedGame.platformAccount.profileUrl || undefined,
          isActive: updatedGame.platformAccount.isActive,
          lastSync: updatedGame.platformAccount.lastSync || undefined,
          gamesCount: 0, // Non disponible dans ce contexte
          createdAt: updatedGame.platformAccount.createdAt,
          updatedAt: updatedGame.platformAccount.updatedAt,
        },
        achievementsCount: unlockedAchievements,
        totalAchievements,
        achievementPercentage,
        createdAt: updatedGame.createdAt,
        updatedAt: updatedGame.updatedAt,
      };

      return {
        success: true,
        data: {
          message: isCompleted
            ? "Jeu marqué comme terminé"
            : "Jeu marqué comme non terminé",
          game: gameDTO,
        },
      };
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour du statut de completion:",
        error
      );

      if (error && typeof error === "object" && "statusCode" in error) {
        throw error;
      }

      throw createError({
        statusCode: 500,
        statusMessage: "Erreur interne du serveur",
      });
    }
  }
);
