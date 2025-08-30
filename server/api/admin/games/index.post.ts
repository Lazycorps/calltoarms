import { defineEventHandler, readBody } from "h3";
import prisma from "~~/lib/prisma";
import type { GameCreateDTO } from "#shared/models/maintenance/gameMaintenance";
import { GameMaintenanceDTO } from "#shared/models/maintenance/gameMaintenance";

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as GameCreateDTO;

  // Validation des données
  if (!body.title || body.title.trim() === "") {
    throw createError({
      statusCode: 400,
      message: "Le titre du jeu est obligatoire",
    });
  }

  try {
    // Créer le jeu
    const newGame = await prisma.game.create({
      data: {
        title: body.title.trim(),
        description: body.description?.trim() || null,
        releaseDate: body.releaseDate ? new Date(body.releaseDate) : null,
        imageUrl: body.imageUrl?.trim() || null,
      },
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
    dto.id = newGame.id;
    dto.title = newGame.title;
    dto.description = newGame.description || undefined;
    dto.releaseDate = newGame.releaseDate || undefined;
    dto.imageUrl = newGame.imageUrl || undefined;
    dto.createdAt = newGame.createdAt;
    dto.updatedAt = newGame.updatedAt;
    dto.notificationCount = newGame._count.Notification;

    return dto;
  } catch {
    throw createError({
      statusCode: 500,
      message: "Erreur lors de la création du jeu",
    });
  }
});
