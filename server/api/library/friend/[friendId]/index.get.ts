import { defineEventHandler, getRouterParam, getQuery, createError } from "h3";
import { serverSupabaseUser } from "#supabase/server";
import prisma from "~~/lib/prisma";
import type { GamingPlatform } from "@prisma/client";
import { getFriendGames, getUserPlatformAccounts } from "~~/server/services/libraryService";
import { requireFriendshipInfo } from "~~/server/services/friendService";

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

    // Vérifier que l'utilisateur et l'ami sont bien amis et récupérer les infos
    const { friendInfo } = await requireFriendshipInfo(
      user.id,
      friendId,
      "Vous n'êtes pas ami avec cet utilisateur"
    );

    // Récupérer un aperçu des jeux récents de l'ami (limité pour l'affichage du profil)
    const recentGamesResponse = await getFriendGames({
      userId: friendId,
      sortBy: "lastPlayed",
      sortOrder: "desc",
      limit: 20, // Limité pour l'aperçu du profil
      offset: 0,
    });

    // Récupérer les comptes de plateformes de l'ami (sans informations sensibles)
    const accounts = await getUserPlatformAccounts(friendId, false);

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
    const totalGames = recentGamesResponse.pagination.total;
    const totalPlaytime = recentGamesResponse.data.reduce(
      (sum, game) => sum + game.playtimeTotal,
      0
    );
    const recentlyPlayed = recentGamesResponse.data.filter(
      (game) =>
        game.lastPlayed &&
        new Date(game.lastPlayed).getTime() >
          Date.now() - 14 * 24 * 60 * 60 * 1000
    ).length;

    return {
      success: true,
      friendInfo,
      connectedPlatforms: accounts,
      games: recentGamesResponse.data,
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
