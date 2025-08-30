import { defineEventHandler, getRouterParam } from "h3";
import prisma from "~~/lib/prisma";
import { GameMaintenanceDTO } from "~~/shared/types/admin/gameMaintenance";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      message: "ID du jeu invalide",
    });
  }

  try {
    const game = await prisma.game.findUnique({
      where: { id: Number(id) },
      include: {
        _count: {
          select: {
            Notification: true,
          },
        },
      },
    });

    if (!game) {
      throw createError({
        statusCode: 404,
        message: "Jeu non trouvé",
      });
    }

    // Mapper vers GameMaintenanceDTO
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
  } catch (error: unknown) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: "Erreur lors de la récupération du jeu",
    });
  }
});
