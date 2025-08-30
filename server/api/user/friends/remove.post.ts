import { defineEventHandler, readBody } from "h3";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { friendId } = body;
  const userId = event.context.user.id;

  if (!friendId) {
    return {
      status: 400,
      body: { message: "Friend ID is required" },
    };
  }

  try {
    // Find the friend relationship
    const friendRelation = await prisma.friend.findFirst({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId },
        ],
      },
    });

    if (!friendRelation) {
      return {
        status: 404,
        body: { message: "Friend relationship not found" },
      };
    }

    // Delete the friend relationship
    await prisma.friend.delete({
      where: { id: friendRelation.id },
    });

    return {
      status: 200,
      body: { message: "Friend removed successfully" },
    };
  } catch (error) {
    console.error(error);
    return { status: 500, body: { message: "Internal Server Error" } };
  }
});
