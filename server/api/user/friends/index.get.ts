import { defineEventHandler, getQuery } from "h3";
import type { FriendStatus } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const userId = event.context.user.id;
  const query = getQuery(event);
  const status = query.status as FriendStatus | undefined;

  const friends = await prisma.friend.findMany({
    where: {
      OR: [{ friendId: userId }, { userId: userId }],
      status,
    },
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
      friendId: isSender ? friend.friendId : friend.userId,
      friend: isSender ? friend.friend : friend.user,
      status: friend.status,
      createdAt: friend.createdAt,
      updatedAt: friend.updatedAt,
      isSender,
    };
  });

  return transformedFriends;
});
