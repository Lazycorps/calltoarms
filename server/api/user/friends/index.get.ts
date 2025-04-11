import { defineEventHandler, getQuery } from "h3";
import type { FriendStatus } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const userId = event.context.user.id;
  const query = getQuery(event);
  const status = query.status as FriendStatus | undefined;

  // Build the where clause with proper typing
  const whereClause: {
    OR: Array<{ userId?: string; friendId?: string }>;
    status?: FriendStatus;
  } = {
    OR: [{ userId }, { friendId: userId }],
  };

  // Add status filter if provided
  if (status) {
    whereClause.status = status;
  }

  const friends = await prisma.friend.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      friend: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  // Transform the response to make it easier to use on the frontend
  const transformedFriends = friends.map((friend) => {
    const isSender = friend.userId === userId;
    return {
      id: friend.id,
      userId: friend.userId,
      friendId: friend.friendId,
      status: friend.status,
      createdAt: friend.createdAt,
      updatedAt: friend.updatedAt,
      user: friend.user,
      friend: friend.friend,
      isSender,
    };
  });

  return transformedFriends;
});
