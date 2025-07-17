import { serverSupabaseUser } from "#supabase/server";
import { defineEventHandler } from "h3";
import prisma from "../../../lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const userConnected = await serverSupabaseUser(event);
    if (userConnected == null) return;

    const received = await prisma.notificationReceiver.findMany({
      where: {
        receiverId: userConnected.id,
      },
      include: {
        notification: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    return received;
  } catch (error) {
    console.error("Error fetching notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});
