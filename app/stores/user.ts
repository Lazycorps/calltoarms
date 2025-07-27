// Utilities
import type { FriendDTO } from "#shared/models/friend";
import { FriendStatus } from "#shared/models/friend";
import { defineStore } from "pinia";
import { computed, onMounted, ref } from "vue";
import type { UserDTO } from "#shared/models/user";
import { useFirebaseMessaging } from "~/composables/firebase/useFirebaseMessaging";

export const useUserStore = defineStore("user", () => {
  const supabase = useSupabaseClient();
  const user = ref<UserDTO | null>(null);
  const friends = ref<FriendDTO[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed properties for different friend statuses
  const acceptedFriends = computed(() =>
    friends.value.filter((f) => f.status === FriendStatus.ACCEPTED)
  );

  const pendingFriendRequests = computed(() =>
    friends.value.filter(
      (f) => f.status === FriendStatus.PENDING && !f.isSender
    )
  );

  const sentFriendRequests = computed(() =>
    friends.value.filter((f) => f.status === FriendStatus.PENDING && f.isSender)
  );

  onMounted(async () => {
    await init();
  });

  async function init() {
    const supabaseUser = await supabase.auth.getUser();
    if (supabaseUser.data.user) {
      const { requestNotificationPermission } = useFirebaseMessaging();
      await fetchUser();
      await loadFriends();
      await requestNotificationPermission(supabaseUser.data.user?.id);
    }
  }

  async function fetchUser() {
    try {
      loading.value = true;
      const userConnected = await $fetch("/api/user/current");
      user.value = {
        id: userConnected?.id ?? "",
        name: userConnected?.name ?? "",
      };
    } finally {
      loading.value = false;
    }
  }

  // Load all friends
  async function loadFriends() {
    try {
      loading.value = true;
      error.value = null;
      const result = await $fetch<FriendDTO[]>("/api/user/friends");
      friends.value = result;
    } catch (err) {
      console.error("Error loading friends:", err);
      error.value = "Failed to load friends";
    } finally {
      loading.value = false;
    }
  }

  // Send a friend request
  async function sendFriendRequest(friendId: string) {
    try {
      loading.value = true;
      error.value = null;
      const result = await $fetch<FriendDTO>("/api/user/friends/add", {
        method: "POST",
        body: { friendId },
      });

      // Add the new friend request to the list
      friends.value.push(result);

      return result;
    } catch (err) {
      console.error("Error sending friend request:", err);
      error.value = "Failed to send friend request";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Respond to a friend request
  async function respondToFriendRequest(
    friendRequestId: number,
    status: FriendStatus
  ) {
    try {
      loading.value = true;
      error.value = null;
      const result = await $fetch<FriendDTO>("/api/user/friends/respond", {
        method: "POST",
        body: { friendRequestId, status },
      });

      // Update the friend request in the list
      const index = friends.value.findIndex((f) => f.id === friendRequestId);
      if (index !== -1) {
        friends.value[index] = result;
      }

      return result;
    } catch (err) {
      console.error("Error responding to friend request:", err);
      error.value = "Failed to respond to friend request";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Remove a friend
  async function removeFriend(friendId: string) {
    try {
      loading.value = true;
      error.value = null;
      await $fetch("/api/user/friends/remove", {
        method: "POST",
        body: { friendId },
      });

      // Remove the friend from the list
      friends.value = friends.value.filter(
        (f) => !(f.userId === friendId || f.friendId === friendId)
      );
    } catch (err) {
      console.error("Error removing friend:", err);
      error.value = "Failed to remove friend";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    const router = useRouter();
    user.value = null;
    friends.value = [];
    supabase.auth.signOut();
    router.push("login");
  }

  return {
    user,
    friends,
    acceptedFriends,
    pendingFriendRequests,
    sentFriendRequests,
    loading,
    error,
    loadFriends,
    sendFriendRequest,
    respondToFriendRequest,
    removeFriend,
    logout,
    init,
  };
});
