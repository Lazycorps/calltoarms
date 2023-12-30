// Utilities
import { defineStore } from "pinia";

export const useNotificationsStore = defineStore("notifications", {
  state: () => ({
    count: 0,
  }),
  getters: {
    newNotification: (state) => state.count > 0,
  },
  actions: {
    increment() {
      this.count = this.count + 1;
    },
  },
});
