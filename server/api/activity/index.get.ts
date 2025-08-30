import { defineEventHandler, createError } from "h3";
import { serverSupabaseUser } from "#supabase/server";
import prisma from "~~/lib/prisma";
import type { activityDTO, PlatformGameCardDTO } from "~~/shared/types/library";

export default defineEventHandler(async (event): Promise<activityDTO> => {
  try {
    // Mode production avec authentification normale
    const user = await serverSupabaseUser(event);
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Authentification requise",
      });
    }
    const userId = user.id;

    // Récupérer la liste des amis acceptés
    const friends = await prisma.friend.findMany({
      where: {
        OR: [
          { userId: userId, status: "ACCEPTED" },
          { friendId: userId, status: "ACCEPTED" },
        ],
      },
      include: {
        user: { select: { id: true, name: true, slug: true } },
        friend: { select: { id: true, name: true, slug: true } },
      },
    });

    // Extraire les IDs des amis
    const friendIds = friends.map((f) =>
      f.userId === userId ? f.friendId : f.userId
    );

    const now = new Date();
    const threeMonthAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 jours

    // Fonction de transformation DTO
    const transformGameToDTO = (game: any): PlatformGameCardDTO => ({
      id: game.id,
      name: game.name,
      iconUrl: game.iconUrl || undefined,
      coverUrl: game.coverUrl || undefined,
      lastPlayed: game.lastPlayed || undefined,
      playtimeTotal: game.playtimeTotal,
      platform: game.platformAccount.platform,
      achievementsCount: game.achievements?.length || 0,
      totalAchievements: game._count?.achievements || 0,
      achievementPercentage:
        game._count?.achievements > 0
          ? Math.round(
              ((game.achievements?.length || 0) / game._count.achievements) *
                100
            )
          : 0,
      isCompleted: game.isCompleted,
      // Ajouter les informations de l'ami si disponibles
      friendName: game.platformAccount?.user?.name || undefined,
      friendSlug: game.platformAccount?.user?.slug || undefined,
    });

    if (friendIds.length === 0) {
      return {
        friendsActivity: {
          recentlyPlayed: [],
          recentlyCompleted: [],
        },
        popularInCircle: {
          games: [],
          totalFriendsPlaying: 0,
        },
        recommendations: {
          basedOnFriends: [],
        },
        stats: {
          totalFriends: 0,
          activeFriendsThisWeek: 0,
          totalGamesInCircle: 0,
        },
      };
    }

    // 1. Activité récente des amis - Jeux récemment joués
    const friendsRecentlyPlayed = await prisma.platformGame.findMany({
      where: {
        platformAccount: {
          userId: { in: friendIds },
        },
        lastPlayed: {
          gt: threeMonthAgo,
        },
      },
      select: {
        id: true,
        name: true,
        iconUrl: true,
        coverUrl: true,
        playtimeTotal: true,
        lastPlayed: true,
        isCompleted: true,
        platformAccount: {
          select: {
            platform: true,
            user: { select: { name: true, slug: true } },
          },
        },
        _count: { select: { achievements: true } },
        achievements: {
          where: { isUnlocked: true },
          select: { id: true },
        },
      },
      orderBy: { lastPlayed: "desc" },
      take: 10,
    });

    // D'abord, regardons tous les jeux terminés par les amis (sans filtre de date)
    const allCompletedByFriends = await prisma.platformGame.findMany({
      where: {
        platformAccount: {
          userId: { in: friendIds },
        },
        isCompleted: true,
      },
      select: { id: true, name: true, lastPlayed: true },
      take: 10,
    });
    console.log(
      "🎮 Tous les jeux terminés par les amis:",
      allCompletedByFriends.length
    );

    const friendsRecentlyCompleted = await prisma.platformGame.findMany({
      where: {
        platformAccount: {
          userId: { in: friendIds },
        },
        isCompleted: true,
        lastPlayed: {
          gt: threeMonthAgo,
        },
      },
      select: {
        id: true,
        name: true,
        iconUrl: true,
        coverUrl: true,
        playtimeTotal: true,
        lastPlayed: true,
        isCompleted: true,
        platformAccount: {
          select: {
            platform: true,
            user: { select: { name: true, slug: true } },
          },
        },
        _count: { select: { achievements: true } },
        achievements: {
          where: { isUnlocked: true },
          select: { id: true },
        },
      },
      orderBy: { lastPlayed: "desc" },
      take: 5,
    });

    // 3. Jeux populaires dans le cercle d'amis
    const popularGames = await prisma.platformGame.groupBy({
      by: ["name"],
      where: {
        platformAccount: {
          userId: { in: friendIds },
        },
        lastPlayed: {
          gt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 8,
    });

    // Récupérer les détails des jeux populaires
    const popularGameDetails = await Promise.all(
      popularGames.map(async (game) => {
        const gameDetail = await prisma.platformGame.findFirst({
          where: {
            name: game.name,
            platformAccount: {
              userId: { in: friendIds },
            },
          },
          select: {
            id: true,
            name: true,
            iconUrl: true,
            coverUrl: true,
            playtimeTotal: true,
            lastPlayed: true,
            isCompleted: true,
            platformAccount: {
              select: { platform: true },
            },
            _count: { select: { achievements: true } },
            achievements: {
              where: { isUnlocked: true },
              select: { id: true },
            },
          },
        });
        return gameDetail;
      })
    );

    // 4. Recommandations basées sur les amis
    const userGames = await prisma.platformGame.findMany({
      where: {
        platformAccount: {
          userId: userId,
        },
      },
      select: { name: true },
    });

    const userGameNames = new Set(userGames.map((g) => g.name));

    const recommendations = await prisma.platformGame.findMany({
      where: {
        platformAccount: {
          userId: { in: friendIds },
        },
        name: {
          notIn: Array.from(userGameNames),
        },
        OR: [{ isCompleted: true }, { playtimeTotal: { gt: 120 } }],
      },
      select: {
        id: true,
        name: true,
        iconUrl: true,
        coverUrl: true,
        playtimeTotal: true,
        lastPlayed: true,
        isCompleted: true,
        platformAccount: {
          select: {
            platform: true,
            user: { select: { name: true, slug: true } },
          },
        },
        _count: { select: { achievements: true } },
        achievements: {
          where: { isUnlocked: true },
          select: { id: true },
        },
      },
      orderBy: [{ isCompleted: "desc" }, { playtimeTotal: "desc" }],
      take: 6,
    });

    // 5. Statistiques
    const activeFriendsThisWeek = await prisma.platformGame.findMany({
      where: {
        platformAccount: {
          userId: { in: friendIds },
        },
        lastPlayed: {
          gt: threeMonthAgo,
        },
      },
      select: {
        platformAccount: {
          select: { userId: true },
        },
      },
      distinct: ["platformAccountId"],
    });

    const totalGamesInCircle = await prisma.platformGame.count({
      where: {
        platformAccount: {
          userId: { in: friendIds },
        },
      },
    });

    return {
      friendsActivity: {
        recentlyPlayed: friendsRecentlyPlayed.map(transformGameToDTO),
        recentlyCompleted: friendsRecentlyCompleted.map(transformGameToDTO),
      },
      popularInCircle: {
        games: popularGameDetails
          .filter((g) => g)
          .map(transformGameToDTO) as PlatformGameCardDTO[],
        totalFriendsPlaying: friendIds.length,
      },
      recommendations: {
        basedOnFriends: recommendations.map(transformGameToDTO),
      },
      stats: {
        totalFriends: friendIds.length,
        activeFriendsThisWeek: new Set(
          activeFriendsThisWeek.map((g) => g.platformAccount.userId)
        ).size,
        totalGamesInCircle,
      },
    };
  } catch (error) {
    console.error("Erreur lors de la récupération de l'activity:", error);

    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Erreur interne du serveur",
    });
  }
});
