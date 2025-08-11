import { defineEventHandler, getRouterParam } from "h3";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      message: "ID du jeu invalide",
    });
  }

  try {
    // Vérifier que le jeu existe
    const existingGame = await prisma.game.findUnique({
      where: { id: Number(id) },
      include: {
        _count: {
          select: {
            Notification: true,
          },
        },
      },
    });

    if (!existingGame) {
      throw createError({
        statusCode: 404,
        message: "Jeu non trouvé",
      });
    }

    // Vérifier s'il y a des notifications liées
    if (existingGame._count.Notification > 0) {
      throw createError({
        statusCode: 409,
        message: `Impossible de supprimer ce jeu car il est lié à ${existingGame._count.Notification} notification(s). Supprimez d'abord les notifications associées.`,
      });
    }

    // Supprimer le jeu
    await prisma.game.delete({
      where: { id: Number(id) },
    });

    return {
      success: true,
      message: "Jeu supprimé avec succès",
    };
  } catch (error: unknown) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: "Erreur lors de la suppression du jeu",
    });
  }
});
