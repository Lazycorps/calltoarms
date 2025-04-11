import { defineEventHandler, readBody } from "h3";
import { PrismaClient, FriendStatus } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { friendId, status } = body;
  const userId = event.context.user.id;

  if (!friendId) {
    return {
      status: 400,
      body: { message: "Friend ID is required" },
    };
  }

  // Check if user is trying to add themselves
  if (userId === friendId) {
    return {
      status: 400,
      body: { message: "You cannot add yourself as a friend" },
    };
  }

  try {
    // Check if friend request already exists
    const existingFriend = await prisma.friend.findFirst({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId },
        ],
      },
    });

    if (existingFriend) {
      // Update existing friend request
      const updatedFriend = await prisma.friend.update({
        where: { id: existingFriend.id },
        data: {
          status: status || FriendStatus.PENDING,
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
      });
      return { status: 200, body: updatedFriend };
    }

    // Create new friend request
    const friend = await prisma.friend.create({
      data: {
        userId,
        friendId,
        status: status || FriendStatus.PENDING,
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
    });

    return { status: 201, body: friend };
  } catch (error) {
    console.error(error);
    return { status: 500, body: { message: "Internal Server Error" } };
  }
});
