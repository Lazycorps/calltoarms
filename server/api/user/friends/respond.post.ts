import { defineEventHandler, readBody } from "h3";
import { PrismaClient, FriendStatus } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { friendRequestId, status } = body;
  const userId = event.context.user.id;

  if (!friendRequestId || !status) {
    return {
      status: 400,
      body: { message: "Friend request ID and status are required" },
    };
  }

  try {
    // Find the friend request
    const friendRequest = await prisma.friend.findUnique({
      where: { id: friendRequestId },
    });

    if (!friendRequest) {
      return {
        status: 404,
        body: { message: "Friend request not found" },
      };
    }

    // Check if the user is authorized to respond to this request
    // Only the recipient of the request can respond
    if (friendRequest.friendId !== userId) {
      return {
        status: 403,
        body: { message: "You are not authorized to respond to this request" },
      };
    }

    // Update the friend request status
    const updatedFriend = await prisma.friend.update({
      where: { id: friendRequestId },
      data: {
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
    });

    return { status: 200, body: updatedFriend };
  } catch (error) {
    console.error(error);
    return { status: 500, body: { message: "Internal Server Error" } };
  }
});
