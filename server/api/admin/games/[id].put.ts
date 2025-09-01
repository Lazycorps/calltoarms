import { defineEventHandler, getRouterParam, readBody } from "h3";
import prisma from "~~/lib/prisma";
import type { GameUpdateDTO } from "~~/shared/types/admin/gameMaintenance";
import { GameMaintenanceDTO } from "~~/shared/types/admin/gameMaintenance";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const body = (await readBody(event)) as GameUpdateDTO;

  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      message: "ID du jeu invalide",
    });
  }

  // Validation des données
  if (body.title !== undefined && (!body.title || body.title.trim() === "")) {
    throw createError({
      statusCode: 400,
      message: "Le titre du jeu ne peut pas être vide",
    });
  }

  try {
    // Vérifier que le jeu existe
    const existingGame = await prisma.game.findUnique({
      where: { id: Number(id) },
    });

    if (!existingGame) {
      throw createError({
        statusCode: 404,
        message: "Jeu non trouvé",
      });
    }

    // Préparer les données à mettre à jour
    const updateData: {
      title?: string;
      description?: string | null;
      releaseDate?: Date | null;
      imageUrl?: string | null;
    } = {};

    if (body.title !== undefined) {
      updateData.title = body.title.trim();
    }
    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null;
    }
    if (body.releaseDate !== undefined) {
      updateData.releaseDate = body.releaseDate
        ? new Date(body.releaseDate)
        : null;
    }
    if (body.imageUrl !== undefined) {
      updateData.imageUrl = body.imageUrl?.trim() || null;
    }

    // Mettre à jour le jeu
    const updatedGame = await prisma.game.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        _count: {
          select: {
            Notification: true,
          },
        },
      },
    });

    // Mapper vers GameMaintenanceDTO
    const dto = new GameMaintenanceDTO();
    dto.id = updatedGame.id;
    dto.title = updatedGame.title;
    dto.description = updatedGame.description || undefined;
    dto.releaseDate = updatedGame.releaseDate || undefined;
    dto.imageUrl = updatedGame.imageUrl || undefined;
    dto.createdAt = updatedGame.createdAt;
    dto.updatedAt = updatedGame.updatedAt;
    dto.notificationCount = updatedGame._count.Notification;

    return dto;
  } catch (error: unknown) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: "Erreur lors de la modification du jeu",
    });
  }
});
