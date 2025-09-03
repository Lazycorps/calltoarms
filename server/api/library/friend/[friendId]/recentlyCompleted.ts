import { defineEventHandler, getRouterParam, createError } from "h3";
import { serverSupabaseUser } from "#supabase/server";
import prisma from "~~/lib/prisma";
import type { PlatformGameCardDTO } from "~~/shared/types/library";
import { requireFriendship } from "~~/server/services/friendService";

export default defineEventHandler(
  async (event): Promise<PlatformGameCardDTO[]> => {
    try {
      // Vérifier l'authentification
      const user = await serverSupabaseUser(event);
      if (!user) {
        throw createError({
          statusCode: 401,
          statusMessage: "Authentification requise",
        });
      }

      // Récupérer l'ID de l'ami depuis l'URL
      const friendId = getRouterParam(event, "friendId");
      if (!friendId) {
        throw createError({
          statusCode: 400,
          statusMessage: "ID de l'ami manquant",
        });
      }

      // Vérifier que l'utilisateur et l'ami sont bien amis
      await requireFriendship(
        user.id,
        friendId,
        "Vous n'êtes pas ami avec cet utilisateur"
      );

      // Récupérer les jeux récemment terminés de l'ami
      const recentlyCompletedRaw = await prisma.platformGame.findMany({
        where: {
          platformAccount: {
            userId: friendId,
            isActive: true,
          },
          isCompleted: true,
        },
        select: {
          id: true,
          name: true,
          iconUrl: true,
          coverUrl: true,
          playtimeTotal: true,
          platformGameId: true,
          lastPlayed: true,
          isCompleted: true,
          completedAt: true,
          achievements: {
            select: {
              id: true,
              isUnlocked: true,
            },
          },
          platformAccount: {
            select: {
              platform: true,
            },
          },
          _count: {
            select: {
              achievements: true,
            },
          },
        },
        orderBy: [
          {
            completedAt: "desc",
          },
          {
            lastPlayed: "desc",
          },
        ],
        take: 10,
      });

      const recentlyCompletedGames: PlatformGameCardDTO[] =
        recentlyCompletedRaw.map((game) => {
          const unlockedAchievements = game.achievements.filter(
            (achievement) => achievement.isUnlocked
          ).length;
          const totalAchievements = game._count.achievements;
          const achievementPercentage =
            totalAchievements > 0
              ? Math.round((unlockedAchievements / totalAchievements) * 100)
              : 0;

          return {
            id: game.id,
            name: game.name,
            iconUrl: game.iconUrl,
            coverUrl: game.coverUrl,
            lastPlayed: game.lastPlayed,
            playtimeTotal: game.playtimeTotal,
            platform: game.platformAccount.platform,
            platformGameId: game.platformGameId,
            achievementsCount: unlockedAchievements,
            totalAchievements: totalAchievements,
            achievementPercentage: achievementPercentage,
            isCompleted: game.isCompleted,
            completedAt: game.completedAt,
          };
        });

      return recentlyCompletedGames;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des jeux terminés de l'ami:",
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
