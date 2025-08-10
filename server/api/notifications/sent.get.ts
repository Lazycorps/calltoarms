import { serverSupabaseUser } from "#supabase/server";
import { defineEventHandler } from "h3";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const userConnected = await serverSupabaseUser(event);
    if (userConnected == null) return;

    const sent = await prisma.notification.findMany({
      where: {
        senderId: userConnected.id,
      },
      include: {
        receivers: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    return sent;
  } catch (error) {
    console.error("Error fetching notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});
