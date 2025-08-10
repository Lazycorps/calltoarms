import { defineEventHandler, createError, readBody } from "h3";
import { serverSupabaseUser } from "#supabase/server";
import prisma from "~~/lib/prisma";

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

    // Récupérer l'ID du jeu depuis l'URL
    const gameId = getRouterParam(event, "id");
    if (!gameId) {
      throw createError({
        statusCode: 400,
        statusMessage: "ID du jeu manquant",
      });
    }

    // Lire le body de la requête
    const body = await readBody(event);
    const { isCompleted } = body;

    if (typeof isCompleted !== "boolean") {
      throw createError({
        statusCode: 400,
        statusMessage: "Le statut de completion doit être un booléen",
      });
    }

    // Vérifier que le jeu appartient à l'utilisateur
    const existingGame = await prisma.platformGame.findFirst({
      where: {
        id: parseInt(gameId),
        platformAccount: {
          userId: user.id,
        },
      },
    });

    if (!existingGame) {
      throw createError({
        statusCode: 404,
        statusMessage: "Jeu non trouvé",
      });
    }

    // Mettre à jour le statut de completion
    const updatedGame = await prisma.platformGame.update({
      where: {
        id: parseInt(gameId),
      },
      data: {
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
        updatedAt: new Date(),
      },
      include: {
        platformAccount: {
          select: {
            id: true,
            platform: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      success: true,
      message: isCompleted
        ? "Jeu marqué comme terminé"
        : "Jeu marqué comme non terminé",
      game: updatedGame,
    };
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour du statut de completion:",
      error
    );

    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Erreur interne du serveur",
    });
  }
});
