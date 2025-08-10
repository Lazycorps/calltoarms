import { defineEventHandler, createError } from "h3";
import { serverSupabaseUser } from "#supabase/server";
import prisma from "~~/lib/prisma";
import type {
  PlatformAccountDTO,
  LibraryStatsDTO,
} from "~~/shared/types/library";

export default defineEventHandler(
  async (
    event
  ): Promise<{
    connectedPlatforms: PlatformAccountDTO[];
    supportedPlatforms: string[];
    stats: LibraryStatsDTO;
  }> => {
    try {
      // Vérifier l'authentification
      const user = await serverSupabaseUser(event);
      if (!user) {
        throw createError({
          statusCode: 401,
          statusMessage: "Authentification requise",
        });
      }

      // Récupérer les comptes de plateformes de l'utilisateur
      const platformAccounts = await prisma.platformAccount.findMany({
        where: {
          userId: user.id,
          isActive: true,
        },
        include: {
          _count: {
            select: {
              games: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Mapper vers DTO
      const connectedPlatforms: PlatformAccountDTO[] = platformAccounts.map(
        (account) => ({
          id: account.id,
          platform: account.platform,
          platformId: account.platformId,
          username: account.username || undefined,
          displayName: account.displayName || undefined,
          avatarUrl: account.avatarUrl || undefined,
          profileUrl: account.profileUrl || undefined,
          isActive: account.isActive,
          lastSync: account.lastSync || undefined,
          gamesCount: account._count.games,
          createdAt: account.createdAt,
          updatedAt: account.updatedAt,
        })
      );

      // Récupérer les plateformes supportées
      const supportedPlatforms = ["STEAM", "PLAYSTATION", "XBOX"];

      // Calculer les statistiques avec des requêtes optimisées
      const baseWhere = {
        platformAccount: {
          userId: user.id,
          isActive: true,
        },
      };

      // 1. Statistiques globales avec agrégation
      const [totalGamesCount, totalPlaytimeResult, totalAchievementsResult] =
        await Promise.all([
          // Nombre total de jeux
          prisma.platformGame.count({
            where: baseWhere,
          }),

          // Temps total de jeu (agrégation)
          prisma.platformGame.aggregate({
            where: baseWhere,
            _sum: {
              playtimeTotal: true,
            },
          }),

          // Total des succès (agrégation)
          prisma.platformAchievement.count({
            where: {
              game: baseWhere,
              isUnlocked: true,
            },
          }),
        ]);

      const stats: LibraryStatsDTO = {
        totalConnectedPlatforms: platformAccounts.length,
        totalGames: totalGamesCount,
        totalPlaytime: totalPlaytimeResult._sum.playtimeTotal || 0,
        totalAchievements: totalAchievementsResult,
      };

      return {
        connectedPlatforms,
        supportedPlatforms,
        stats,
      };
    } catch (error) {
      console.error("Erreur lors de la récupération des plateformes:", error);

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
