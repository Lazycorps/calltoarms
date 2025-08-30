import { defineEventHandler, getRouterParam, createError } from "h3";
import { serverSupabaseUser } from "#supabase/server";
import prisma from "~~/lib/prisma";
import type { GamingPlatform, Prisma } from "@prisma/client";

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

    // Récupérer l'ID de l'ami depuis l'URL
    const friendId = getRouterParam(event, "friendId");
    if (!friendId) {
      throw createError({
        statusCode: 400,
        statusMessage: "ID de l'ami manquant",
      });
    }

    // Vérifier que l'utilisateur et l'ami sont bien amis
    const friendship = await prisma.friend.findFirst({
      where: {
        OR: [
          {
            userId: user.id,
            friendId: friendId,
            status: "ACCEPTED",
          },
          {
            userId: friendId,
            friendId: user.id,
            status: "ACCEPTED",
          },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        friend: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!friendship) {
      throw createError({
        statusCode: 403,
        statusMessage: "Vous n'êtes pas ami avec cet utilisateur",
      });
    }

    // Déterminer les informations de l'ami
    const friendInfo =
      friendship.userId === friendId ? friendship.user : friendship.friend;

    // Récupérer les paramètres de la requête
    const query = getQuery(event);
    const platform = query.platform as GamingPlatform | undefined;
    const search = query.search as string | undefined;
    const sortBy = (query.sortBy as string) || "name";
    const sortOrder = (query.sortOrder as "asc" | "desc") || "asc";
    const limit = query.limit ? parseInt(query.limit as string) : 100;
    const offset = query.offset ? parseInt(query.offset as string) : 0;

    // Construire la requête de base pour l'ami
    const whereClause: Prisma.PlatformGameWhereInput = {
      platformAccount: {
        userId: friendId,
      },
    };

    // Ajouter le filtre de plateforme si spécifié
    if (platform) {
      whereClause.platformAccount = {
        userId: friendId,
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
            username: true,
            displayName: true,
            avatarUrl: true,
            // Ne pas exposer les tokens et informations sensibles
          },
        },
        achievements: {
          select: {
            id: true,
            isUnlocked: true,
          },
        },
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

    // Calculer les statistiques par plateforme
    const platformStats = await prisma.platformGame.groupBy({
      by: ["platformAccountId"],
      where: {
        platformAccount: {
          userId: friendId,
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        playtimeTotal: true,
      },
    });

    // Récupérer les comptes pour mapper les stats (sans informations sensibles)
    const accounts = await prisma.platformAccount.findMany({
      where: {
        userId: friendId,
      },
      select: {
        id: true,
        platform: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        lastSync: true,
        _count: {
          select: {
            games: true,
          },
        },
      },
    });

    const statsByPlatform = accounts.reduce((acc, account) => {
      const stat = platformStats.find(
        (s) => s.platformAccountId === account.id
      );
      if (!acc[account.platform]) {
        acc[account.platform] = {
          totalGames: 0,
          totalPlaytime: 0,
        };
      }
      if (stat) {
        acc[account.platform].totalGames += stat._count.id;
        acc[account.platform].totalPlaytime += stat._sum.playtimeTotal || 0;
      }
      return acc;
    }, {} as Record<GamingPlatform, { totalGames: number; totalPlaytime: number }>);

    // Calculer les statistiques globales
    const totalGames = totalCount;
    const totalPlaytime = games.reduce(
      (sum, game) => sum + game.playtimeTotal,
      0
    );
    const recentlyPlayed = games.filter(
      (game) =>
        game.lastPlayed &&
        new Date(game.lastPlayed).getTime() >
          Date.now() - 14 * 24 * 60 * 60 * 1000
    ).length;

    return {
      success: true,
      friendInfo,
      connectedPlatforms: accounts,
      games: games.map((game) => {
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
          platformGameId: game.platformGameId,
          platform: game.platformAccount.platform,
          achievementsCount: unlockedAchievements,
          totalAchievements: totalAchievements,
          achievementPercentage: achievementPercentage,
          isCompleted: game.isCompleted,
        };
      }),
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
      stats: {
        totalGames,
        totalPlaytime,
        recentlyPlayed,
        byPlatform: statsByPlatform,
        totalConnectedPlatforms: accounts.length,
      },
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des jeux de l'ami:", error);

    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Erreur interne du serveur",
    });
  }
});
