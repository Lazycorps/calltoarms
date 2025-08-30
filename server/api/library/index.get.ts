import { defineEventHandler, getQuery, createError } from "h3";
import prisma from "~~/lib/prisma";
import type { GamingPlatform, Prisma } from "@prisma/client";
import type {
  LibraryResponseDTO,
  PlatformGameCardDTO,
} from "~~/shared/types/library";

export default defineEventHandler(
  async (event): Promise<LibraryResponseDTO<PlatformGameCardDTO[]>> => {
    try {
      const currentUserId = event.context.user.id;

      // Récupérer les paramètres de la requête
      const query = getQuery(event);
      const platform = query.platform as GamingPlatform | undefined;
      const search = query.search as string | undefined;
      const sortBy = (query.sortBy as string) || "name";
      const sortOrder = (query.sortOrder as "asc" | "desc") || "asc";
      const limit = query.limit ? parseInt(query.limit as string) : 100;
      const offset = query.offset ? parseInt(query.offset as string) : 0;

      // Construire la requête de base
      const whereClause: Prisma.PlatformGameWhereInput = {
        platformAccount: {
          userId: currentUserId,
        },
      };

      // Ajouter le filtre de plateforme si spécifié
      if (platform) {
        whereClause.platformAccount = {
          userId: currentUserId,
          platform: platform,
        };
      }

      // Ajouter le filtre de recherche si spécifié
      if (search) {
        whereClause.name = {
          contains: search,
          mode: "insensitive",
        };
      }

      // Construire l'objet orderBy
      const orderByClause: Prisma.PlatformGameOrderByWithRelationInput = {};
      switch (sortBy) {
        case "playtime":
          orderByClause.playtimeTotal = sortOrder;
          break;
        case "lastPlayed":
          orderByClause.lastPlayed = sortOrder;
          whereClause.lastPlayed = {
            not: null,
          };
          break;
        case "name":
        default:
          orderByClause.name = sortOrder;
          break;
      }

      // Récupérer le nombre total de jeux
      const totalCount = await prisma.platformGame.count({
        where: whereClause,
      });

      // Récupérer les jeux avec pagination
      const games = await prisma.platformGame.findMany({
        where: whereClause,
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
        orderBy: orderByClause,
        take: limit,
        skip: offset,
      });

      // Mapper vers DTO
      const gamesDTO: PlatformGameCardDTO[] = games.map((game) => {
        const totalAchievements = game._count.achievements;
        const unlockedAchievements = game.achievements.filter(
          (a) => a.isUnlocked
        ).length;
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
          totalAchievements,
          achievementPercentage,
          isCompleted: game.isCompleted,
        };
      });

      return {
        success: true,
        data: gamesDTO,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
      };
    } catch (error) {
      console.error("Erreur lors de la récupération des jeux:", error);

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
