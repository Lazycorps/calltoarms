import { useFirebase } from "./useFirebase";
import { getToken, onMessage, type MessagePayload } from "firebase/messaging";
import type { MessageDTO } from "~~/shared/types/message";
export const useFirebaseMessaging = () => {
  /**
   * Send a push notification to selected users
   * @param notification The notification data to send
   * @returns Promise that resolves when the notification is sent
   */
  async function sendPushNotification(
    notification: MessageDTO,
    senderId: string,
    gameId?: number,
    gameCover?: string
  ) {
    try {
      // Send notification via API
      const response = await fetch("/api/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notification,
          senderId,
          gameId,
          gameCover,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send notification: ${response.statusText}`);
      }

      const result = await response.json();
      return result.notificationId;
    } catch (error) {
      console.error("Error sending push notification:", error);
      throw error;
    }
  }

  /**
   * Request notification permission and save token
   * @param userId The user ID
   * @returns Promise that resolves with the token
   */
  async function requestNotificationPermission(userId: string) {
    try {
      const { messaging } = useFirebase();
      if (!messaging) return null;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.log("Notification permission denied");
        return null;
      }

      // Get token
      const config = useRuntimeConfig();
      const token = await getToken(messaging, {
        vapidKey: config.public.firebaseVapidKey || "",
      });

      if (token) {
        // Save token to database via API
        const response = await fetch("/api/user/fcmToken", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            token,
          }),
        });

        if (!response.ok) {
          console.error("Failed to save FCM token:", await response.text());
        }
      }

      return token;
    } catch (error) {
      console.error("Error getting notification token:", error);
      return null;
    }
  }

  function onForegroundMessage(callback: (payload: MessagePayload) => void) {
    const { messaging } = useFirebase();
    if (!messaging) return () => {};

    return onMessage(messaging, (payload) => {
      console.log("Message received in foreground:", payload);
      callback(payload);
    });
  }

  return {
    sendPushNotification,
    requestNotificationPermission,
    onForegroundMessage,
  };
};
