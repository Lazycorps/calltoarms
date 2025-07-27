import { defineStore } from "pinia";
import type { NotificationReceivedDTO } from "#shared/models/notificationReceived";

export const useNotificationsStore = defineStore("notifications", {
  state: () => ({
    count: 0,
    notificationsReceived: [] as NotificationReceivedDTO[],
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
  },
});
