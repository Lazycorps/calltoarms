import { defineEventHandler, getQuery } from "h3";
import { serverSupabaseUser } from "#supabase/server";
import prisma from "../../../lib/prisma";

interface GameFilters {
  search?: string;
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event) as GameFilters;
  const { search } = query;

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

  // Get the current authenticated user
  const userConnected = await serverSupabaseUser(event);

  if (userConnected) {
    const games = await prisma.game.findMany({
      where: filters,
      include: {
        _count: {
          select: {
            Notification: true,
          },
        },
      },
    });

    const gamesWithNotificationCounts = await Promise.all(
      games.map(async (game) => {
        const receivedCount = await prisma.notificationReceiver.count({
          where: {
            receiverId: userConnected.id,
            notification: {
              gameId: game.id,
            },
          },
        });

        const sentCount = await prisma.notification.count({
          where: {
            senderId: userConnected.id,
            gameId: game.id,
          },
        });

        const totalNotifications = receivedCount + sentCount;

        return {
          ...game,
          userNotificationCount: totalNotifications,
        };
      })
    );

    gamesWithNotificationCounts.sort(
      (a, b) => b.userNotificationCount - a.userNotificationCount
    );

    return gamesWithNotificationCounts;
  } else {
    const games = await prisma.game.findMany({
      where: filters,
    });

    return games;
  }
});
