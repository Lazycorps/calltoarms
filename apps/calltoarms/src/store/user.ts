// Utilities
import { useUserFriendsDB } from "@/db/UserFriendsDB";
import { User } from "@/models/User";
import { defineStore } from "pinia";
import { onMounted, ref } from "vue";

export const useUserStore = defineStore("user", () => {
  const userFriendsDb = useUserFriendsDB();
  const friends = ref<User[]>();

  onMounted(async () => {
    friends.value = (await userFriendsDb.getMyFriends()) ?? [];
  });

  return {
    friends,
  };
});
