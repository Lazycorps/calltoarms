import { defineEventHandler, readBody } from "h3";
import prisma from "~/lib/prisma";
import { getFirebaseMessaging } from "~/server/utils/firebase-admin";
import type { MessageDTO } from "~/shared/models/message";

interface CreateNotificationRequest {
  notification: MessageDTO;
  senderId: string;
  gameId?: number;
  gameCover?: string;
}

export default defineEventHandler(async (event) => {
  try {
    const { notification, senderId, gameId, gameCover } =
      await readBody<CreateNotificationRequest>(event);

    if (!notification || !senderId) {
      return {
        success: false,
        error: "Notification and sender ID are required",
      };
    }
    console.log(notification.users);
    // Create notification in database
    const newNotification = await prisma.notification.create({
      data: {
        title: notification.title,
        body: notification.body,
        senderId: senderId,
        gameId: gameId,
        gameCover: gameCover,
        receivers: {
          create: notification.users.map((userId) => ({
            receiverId: userId,
            read: false,
          })),
        },
      },
      include: {
        receivers: true,
      },
    });

    // Get FCM tokens for all receivers
    const fcmTokens = await prisma.fcmToken.findMany({
      where: {
        userId: {
          in: notification.users,
        },
      },
    });

    if (fcmTokens.length === 0) {
      console.log("No FCM tokens found for users");
      return {
        success: true,
        notificationId: newNotification.id,
        message: "Notification created but no FCM tokens found for users",
      };
    }

    // Get Firebase messaging instance
    const messaging = getFirebaseMessaging();

    // Process each token individually
    const sendPromises = fcmTokens.map((tokenObj) =>
      messaging.send({
        token: tokenObj.token,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: {
          notificationId: String(newNotification.id),
          gameId: gameId ? String(gameId) : "",
          gameCover: gameCover || "",
          senderId: senderId,
        },
      })
    );

    // Wait for all messages to be sent
    const results = await Promise.allSettled(sendPromises);

    // Count successes and failures
    const successCount = results.filter((r) => r.status === "fulfilled").length;
    const failureCount = results.filter((r) => r.status === "rejected").length;

    return {
      success: true,
      notificationId: newNotification.id,
      messagingResults: {
        successCount,
        failureCount,
        total: fcmTokens.length,
      },
    };
  } catch (error) {
    console.error("Error creating and sending notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});
