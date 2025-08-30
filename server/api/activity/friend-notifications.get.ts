import { defineEventHandler, createError } from "h3";
import { serverSupabaseUser } from "#supabase/server";
import prisma from "~~/lib/prisma";
import type { FriendGameNotificationDTO } from "~~/shared/types/activity";

export default defineEventHandler(async (event): Promise<{ success: boolean; data: FriendGameNotificationDTO[] }> => {
  try {
    // Authentification
    const user = await serverSupabaseUser(event);
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Authentification requise",
      });
    }
    const userId = user.id;

    // Récupérer les notifications reçues avec les informations de base
    const friendNotifications = await prisma.notificationReceiver.findMany({
      where: {
        receiverId: userId,
        notification: {
          gameId: {
            not: null, // Seulement les notifications liées à des jeux
          },
        },
      },
      include: {
        notification: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            game: {
              select: {
                id: true,
                imageUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 6,
    });

    // Transformer en DTO avec les informations de jeu enrichies
    const notificationDTOs: FriendGameNotificationDTO[] = [];

    for (const notifReceiver of friendNotifications) {
      const notification = notifReceiver.notification;
      if (!notification.game) continue;

      // Récupérer le jeu générique pour obtenir les informations de base
      const gameDetails = await prisma.game.findUnique({
        where: { id: notification.game.id },
        select: { 
          title: true,
          imageUrl: true,
        },
      });

      if (!gameDetails) continue;

      notificationDTOs.push({
        // Informations du jeu
        id: notification.game.id,
        name: gameDetails.title,
        iconUrl: undefined,
        coverUrl: gameDetails.imageUrl || undefined,
        
        // Informations de l'ami
        senderName: notification.sender.name || "Ami inconnu",
        friendName: notification.sender.name || undefined,
        friendSlug: notification.sender.slug || undefined,
        
        // Informations de la notification
        notificationId: notification.id,
        notificationTitle: notification.title,
        notificationBody: notification.body,
        sentAt: notifReceiver.createdAt,
      });
    }

    return {
      success: true,
      data: notificationDTOs,
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des notifications d'amis:", error);

    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Erreur interne du serveur",
    });
  }
});