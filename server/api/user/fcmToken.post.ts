import { defineEventHandler, readBody } from "h3";
import prisma from "../../../lib/prisma";

interface TokenRequest {
  userId: string;
  token: string;
}

export default defineEventHandler(async (event) => {
  try {
    const { userId, token } = await readBody<TokenRequest>(event);

    if (!userId || !token) {
      return {
        success: false,
        error: "User ID and token are required",
      };
    }

    // Check if token already exists
    const existingToken = await prisma.fcmToken.findUnique({
      where: {
        token: token,
      },
    });

    if (existingToken) {
      // Update token if user ID is different
      if (existingToken.userId !== userId) {
        const updatedToken = await prisma.fcmToken.update({
          where: {
            id: existingToken.id,
          },
          data: {
            userId: userId,
          },
        });

        return {
          success: true,
          id: updatedToken.id,
          updated: true,
        };
      }

      return {
        success: true,
        id: existingToken.id,
        updated: false,
      };
    }

    // Create new token
    const newToken = await prisma.fcmToken.create({
      data: {
        userId: userId,
        token: token,
      },
    });

    return {
      success: true,
      id: newToken.id,
      created: true,
    };
  } catch (error) {
    console.error("Error saving FCM token:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});
