import { defineEventHandler, getRouterParam, createError } from "h3";
import { serverSupabaseUser } from "#supabase/server";
import prisma from "~~/lib/prisma";

interface GameComparisonDTO {
  game: {
    id: number;
    name: string;
    platform: string;
    iconUrl?: string;
    coverUrl?: string;
  };
  friend: {
    name: string;
    slug: string;
    stats: {
      playtimeTotal: number;
      achievementsCount: number;
      totalAchievements: number;
      achievementPercentage: number;
      isCompleted: boolean;
      lastPlayed?: Date;
    };
  };
  user: {
    stats?: {
      playtimeTotal: number;
      achievementsCount: number;
      totalAchievements: number;
      achievementPercentage: number;
      isCompleted: boolean;
      lastPlayed?: Date;
    };
    hasGame: boolean;
  };
}

export default defineEventHandler(async (event): Promise<GameComparisonDTO> => {
  try {
    const config = useRuntimeConfig();
    let userId: string;

    // Mode développement avec bypass d'auth
    if (config.devMode && config.devUserId) {
      userId = config.devUserId;
    } else {
      const user = await serverSupabaseUser(event);
      if (!user) {
        throw createError({
          statusCode: 401,
          statusMessage: "Authentification requise",
        });
      }
      userId = user.id;
    }

    const gameId = getRouterParam(event, "gameId");
    const friendId = getRouterParam(event, "friendId");

    if (!gameId || !friendId) {
      throw createError({
        statusCode: 400,
        statusMessage: "ID du jeu et ID de l'ami requis",
      });
    }

    // Vérifier que les utilisateurs sont amis
    const friendship = await prisma.friend.findFirst({
      where: {
        OR: [
          { userId: userId, friendId: friendId, status: "ACCEPTED" },
          { userId: friendId, friendId: userId, status: "ACCEPTED" },
        ],
      },
      include: {
        user: { select: { id: true, name: true, slug: true } },
        friend: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!friendship) {
      throw createError({
        statusCode: 403,
        statusMessage: "Vous n'êtes pas ami avec cet utilisateur",
      });
    }

    const friendInfo = friendship.userId === friendId ? friendship.user : friendship.friend;

    // Récupérer les données du jeu de l'ami
    const friendGameData = await prisma.platformGame.findFirst({
      where: {
        id: parseInt(gameId),
        platformAccount: {
          userId: friendId,
        },
      },
      include: {
        platformAccount: {
          select: {
            platform: true,
          },
        },
        achievements: {
          where: { isUnlocked: true },
          select: { id: true },
        },
        _count: {
          select: { achievements: true },
        },
      },
    });

    if (!friendGameData) {
      throw createError({
        statusCode: 404,
        statusMessage: "Jeu non trouvé pour cet ami",
      });
    }

    // Récupérer les données du jeu de l'utilisateur (si il l'a)
    const userGameData = await prisma.platformGame.findFirst({
      where: {
        name: friendGameData.name, // Même jeu par nom
        platformAccount: {
          userId: userId,
          platform: friendGameData.platformAccount.platform, // Même plateforme
        },
      },
      include: {
        achievements: {
          where: { isUnlocked: true },
          select: { id: true },
        },
        _count: {
          select: { achievements: true },
        },
      },
    });

    // Construire la réponse
    const friendAchievementsCount = friendGameData.achievements.length;
    const friendTotalAchievements = friendGameData._count.achievements;
    const friendAchievementPercentage = friendTotalAchievements > 0 
      ? Math.round((friendAchievementsCount / friendTotalAchievements) * 100)
      : 0;

    let userStats = undefined;
    if (userGameData) {
      const userAchievementsCount = userGameData.achievements.length;
      const userTotalAchievements = userGameData._count.achievements;
      const userAchievementPercentage = userTotalAchievements > 0
        ? Math.round((userAchievementsCount / userTotalAchievements) * 100)
        : 0;

      userStats = {
        playtimeTotal: userGameData.playtimeTotal,
        achievementsCount: userAchievementsCount,
        totalAchievements: userTotalAchievements,
        achievementPercentage: userAchievementPercentage,
        isCompleted: userGameData.isCompleted,
        lastPlayed: userGameData.lastPlayed || undefined,
      };
    }

    return {
      game: {
        id: friendGameData.id,
        name: friendGameData.name,
        platform: friendGameData.platformAccount.platform,
        iconUrl: friendGameData.iconUrl || undefined,
        coverUrl: friendGameData.coverUrl || undefined,
      },
      friend: {
        name: friendInfo.name,
        slug: friendInfo.slug,
        stats: {
          playtimeTotal: friendGameData.playtimeTotal,
          achievementsCount: friendAchievementsCount,
          totalAchievements: friendTotalAchievements,
          achievementPercentage: friendAchievementPercentage,
          isCompleted: friendGameData.isCompleted,
          lastPlayed: friendGameData.lastPlayed || undefined,
        },
      },
      user: {
        stats: userStats,
        hasGame: !!userGameData,
      },
    };
  } catch (error) {
    console.error("Erreur lors de la comparaison de jeu:", error);

    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Erreur interne du serveur",
    });
  }
});