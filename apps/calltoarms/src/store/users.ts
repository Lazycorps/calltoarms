// Utilities
import { usersDB } from "@/fireStore/UsersDB";
import { User } from "@/models/User";
import { defineStore } from "pinia";

export const useUsersStore = defineStore("users", {
  state: () => ({
    friends: [] as User[],
  }),
  getters: {},
  actions: {
    async loadFriends() {
      this.friends = (await usersDB.getMyFriends()) ?? [];
    },
  },
});
