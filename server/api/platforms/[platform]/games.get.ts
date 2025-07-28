import { defineEventHandler, getQuery, createError } from "h3";
import { serverSupabaseUser } from "#supabase/server";
import type { GamingPlatform } from "@prisma/client";
import prisma from "../../../../lib/prisma";

interface GamesQuery {
  accountId?: string;
  search?: string;
  sortBy?: "name" | "playtime" | "lastPlayed";
  sortOrder?: "asc" | "desc";
  limit?: string;
  offset?: string;
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

    // Récupérer la plateforme depuis l'URL
    const platform = getRouterParam(
      event,
      "platform"
    )?.toUpperCase() as GamingPlatform;
    if (!platform) {
      throw createError({
        statusCode: 400,
        statusMessage: "Plateforme non spécifiée",
      });
    }

    // Récupérer les paramètres de requête
    const query = getQuery(event) as GamesQuery;
    const accountId = query.accountId ? parseInt(query.accountId) : undefined;
    const search = query.search;
    const sortBy = query.sortBy || "name";
    const sortOrder = query.sortOrder || "asc";
    const limit = query.limit ? parseInt(query.limit) : 50;
    const offset = query.offset ? parseInt(query.offset) : 0;

    // Construire les filtres
    const where: {
      platformAccount: {
        userId: string;
        platform: GamingPlatform;
        isActive: boolean;
      };
      platformAccountId?: number;
      name?: {
        contains: string;
        mode: "insensitive";
      };
    } = {
      platformAccount: {
        userId: user.id,
        platform,
        isActive: true,
      },
    };

    if (accountId) {
      where.platformAccountId = accountId;
    }

    if (search) {
      where.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    // Construire l'ordre de tri
    let orderBy: Record<string, "asc" | "desc"> = {};
    switch (sortBy) {
      case "playtime":
        orderBy = { playtimeTotal: sortOrder };
        break;
      case "lastPlayed":
        orderBy = { lastPlayed: sortOrder };
        break;
      default:
        orderBy = { name: sortOrder };
    }

    // Récupérer les jeux
    const games = await prisma.platformGame.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
      include: {
        platformAccount: {
          select: {
            id: true,
            platform: true,
            username: true,
            displayName: true,
          },
        },
        _count: {
          select: {
            achievements: true,
          },
        },
      },
    });

    // Compter le total pour la pagination
    const total = await prisma.platformGame.count({ where });

    return {
      success: true,
      games,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
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
