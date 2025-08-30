import { defineStore } from "pinia";
import type { NotificationReceivedDTO } from "~~/shared/types/notificationReceived";
import type { NotificationDTO } from "~~/shared/types/notification";

export const useNotificationsStore = defineStore("notifications", {
  state: () => ({
    count: 0,
    notificationsReceived: [] as NotificationReceivedDTO[],
    notificationsSent: [] as NotificationDTO[],
  }),
  getters: {
    newNotification: (state) => state.count > 0,
  },
  actions: {
    increment() {
      this.count = this.count + 1;
    },
    async loadNotificationReceived() {
      const notif = await $fetch<NotificationReceivedDTO[]>(
        "/api/notifications/received"
      );
      if (notif) this.notificationsReceived = notif;
    },
    async loadNotificationSent() {
      const notif = await $fetch<NotificationDTO[]>("/api/notifications/sent");
      if (notif) this.notificationsSent = notif;
    },
  },
});
