import prisma from "~~/lib/prisma";
import type { GamingPlatform, Prisma } from "@prisma/client";
import type {
  LibraryResponseDTO,
  PlatformGameCardDTO,
} from "~~/shared/types/library";

export interface LibraryQueryOptions {
  userId: string;
  platform?: GamingPlatform;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export interface LibraryGameInclude {
  platformAccount: {
    select: {
      id: true;
      platform: true;
      platformId: true;
      username: true;
      displayName: true;
      avatarUrl: true;
      profileUrl?: true;
      isActive?: true;
      lastSync?: true;
      createdAt?: true;
      updatedAt?: true;
    };
  };
  achievements:
    | boolean
    | {
        select: {
          id: true;
          isUnlocked: true;
        };
      };
  _count: {
    select: {
      achievements: true;
    };
  };
}

/**
 * Construit la clause WHERE pour la requête Prisma
 */
function buildWhereClause(
  options: LibraryQueryOptions
): Prisma.PlatformGameWhereInput {
  const whereClause: Prisma.PlatformGameWhereInput = {
    platformAccount: {
      userId: options.userId,
    },
  };

  // Ajouter le filtre de plateforme si spécifié
  if (options.platform) {
    whereClause.platformAccount = {
      userId: options.userId,
      platform: options.platform,
    };
  }

  // Ajouter le filtre de recherche si spécifié
  if (options.search) {
    whereClause.name = {
      contains: options.search,
      mode: "insensitive",
    };
  }

  return whereClause;
}

/**
 * Construit la clause ORDER BY pour la requête Prisma
 */
function buildOrderByClause(
  sortBy: string = "name",
  sortOrder: "asc" | "desc" = "asc",
  whereClause: Prisma.PlatformGameWhereInput
): Prisma.PlatformGameOrderByWithRelationInput {
  const orderByClause: Prisma.PlatformGameOrderByWithRelationInput = {};

  switch (sortBy) {
    case "playtime":
      orderByClause.playtimeTotal = sortOrder;
      break;
    case "lastPlayed":
      orderByClause.lastPlayed = sortOrder;
      // Pour lastPlayed, ne montrer que les jeux qui ont été joués
      whereClause.lastPlayed = {
        not: null,
      };
      break;
    case "name":
    default:
      orderByClause.name = sortOrder;
      break;
  }

  return orderByClause;
}

/**
 * Construit l'objet include pour la requête Prisma
 */
function buildIncludeClause(
  includeFullAccount: boolean = true
): LibraryGameInclude {
  const baseAccountSelect = {
    id: true,
    platform: true,
    username: true,
    displayName: true,
    avatarUrl: true,
  };

  const fullAccountSelect = {
    ...baseAccountSelect,
    platformId: true,
    profileUrl: true,
    isActive: true,
    lastSync: true,
    createdAt: true,
    updatedAt: true,
  };

  return {
    platformAccount: {
      select: includeFullAccount ? fullAccountSelect : baseAccountSelect,
    },
    achievements: includeFullAccount
      ? true
      : {
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
  };
}

/**
 * Transforme un jeu Prisma en DTO
 */
function mapGameToDTO(game: any): PlatformGameCardDTO {
  const totalAchievements = game._count.achievements;

  // Gérer les achievements selon le type d'include
  let unlockedAchievements = 0;
  if (Array.isArray(game.achievements)) {
    if (
      game.achievements.length > 0 &&
      typeof game.achievements[0] === "object" &&
      "isUnlocked" in game.achievements[0]
    ) {
      // Format minimal avec select
      unlockedAchievements = game.achievements.filter(
        (a: any) => a.isUnlocked
      ).length;
    } else {
      // Format complet
      unlockedAchievements = game.achievements.filter(
        (a: any) => a.isUnlocked
      ).length;
    }
  }

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
}

/**
 * Récupère les jeux d'un utilisateur avec pagination et filtres
 */
export async function getGames(
  options: LibraryQueryOptions,
  includeFullAccount: boolean = true
): Promise<LibraryResponseDTO<PlatformGameCardDTO[]>> {
  const {
    sortBy = "name",
    sortOrder = "asc",
    limit = 100,
    offset = 0,
  } = options;

  // Construire les clauses de la requête
  const whereClause = buildWhereClause(options);
  const orderByClause = buildOrderByClause(sortBy, sortOrder, whereClause);
  const includeClause = buildIncludeClause(includeFullAccount);

  // Récupérer le nombre total de jeux
  const totalCount = await prisma.platformGame.count({
    where: whereClause,
  });

  // Récupérer les jeux avec pagination
  const games = await prisma.platformGame.findMany({
    where: whereClause,
    include: includeClause,
    orderBy: orderByClause,
    take: limit,
    skip: offset,
  });

  // Mapper vers DTO
  const gamesDTO = games.map(mapGameToDTO);

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
}

/**
 * Récupère les jeux d'un ami (version allégée sans informations sensibles)
 */
export async function getFriendGames(
  options: LibraryQueryOptions
): Promise<LibraryResponseDTO<PlatformGameCardDTO[]>> {
  return getGames(options, false);
}

/**
 * Récupère les comptes de plateformes d'un utilisateur
 */
export async function getUserPlatformAccounts(
  userId: string,
  includeSensitiveData: boolean = true
) {
  const baseSelect = {
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
  };

  const fullSelect = {
    ...baseSelect,
    platformId: true,
    profileUrl: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  };

  return prisma.platformAccount.findMany({
    where: {
      userId,
    },
    select: includeSensitiveData ? fullSelect : baseSelect,
  });
}
