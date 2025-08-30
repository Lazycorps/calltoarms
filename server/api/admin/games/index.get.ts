import { defineEventHandler, getQuery } from "h3";
import prisma from "~~/lib/prisma";
import { GameMaintenanceDTO } from "~~/shared/types/admin/gameMaintenance";

interface GameFilters {
  search?: string;
  page?: string;
  limit?: string;
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event) as GameFilters;
  const { search, page = "1", limit = "20" } = query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const filters: {
    OR?: {
      title?: {
        contains: string;
        mode: "insensitive";
      };
      description?: {
        contains: string;
        mode: "insensitive";
      };
    }[];
  } = {};

  if (search) {
    filters.OR = [
      {
        title: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  // Récupérer les jeux avec pagination
  const [games, totalCount] = await Promise.all([
    prisma.game.findMany({
      where: filters,
      include: {
        _count: {
          select: {
            Notification: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      skip,
      take: limitNum,
    }),
    prisma.game.count({
      where: filters,
    }),
  ]);

  // Mapper vers GameMaintenanceDTO
  const gamesMaintenanceDTO = games.map((game) => {
    const dto = new GameMaintenanceDTO();
    dto.id = game.id;
    dto.title = game.title;
    dto.description = game.description || undefined;
    dto.releaseDate = game.releaseDate || undefined;
    dto.imageUrl = game.imageUrl || undefined;
    dto.createdAt = game.createdAt;
    dto.updatedAt = game.updatedAt;
    dto.notificationCount = game._count.Notification;
    return dto;
  });

  return {
    games: gamesMaintenanceDTO,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
    },
  };
});
