import { defineEventHandler, getQuery, createError } from "h3";
import { serverSupabaseUser } from "#supabase/server";
import prisma from "../../../lib/prisma";
import type { GamingPlatform } from "@prisma/client";

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

    // Récupérer les paramètres de la requête
    const query = getQuery(event);
    const platform = query.platform as GamingPlatform | undefined;
    const search = query.search as string | undefined;
    const sortBy = (query.sortBy as string) || "name";
    const sortOrder = (query.sortOrder as "asc" | "desc") || "asc";
    const limit = query.limit ? parseInt(query.limit as string) : 100;
    const offset = query.offset ? parseInt(query.offset as string) : 0;

    // Construire la requête de base
    const whereClause: any = {
      platformAccount: {
        userId: user.id,
      },
    };

    // Ajouter le filtre de plateforme si spécifié
    if (platform) {
      whereClause.platformAccount.platform = platform;
    }

    // Ajouter le filtre de recherche si spécifié
    if (search) {
      whereClause.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    // Construire l'objet orderBy
    const orderByClause: any = {};
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
          userId: user.id,
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        playtimeTotal: true,
      },
    });

    // Récupérer les comptes pour mapper les stats
    const accounts = await prisma.platformAccount.findMany({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
        platform: true,
      },
    });

    const statsByPlatform = accounts.reduce((acc, account) => {
      const stat = platformStats.find(s => s.platformAccountId === account.id);
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
    const totalPlaytime = games.reduce((sum, game) => sum + game.playtimeTotal, 0);
    const recentlyPlayed = games.filter(
      (game) => game.lastPlayed && 
      new Date(game.lastPlayed).getTime() > Date.now() - 14 * 24 * 60 * 60 * 1000
    ).length;

    return {
      success: true,
      games: games.map(game => ({
        ...game,
        _count: {
          achievements: 0, // À implémenter si nécessaire
        },
      })),
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
});