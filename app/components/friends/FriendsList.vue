<template>
  <div class="fill-height">
    <v-col class="fill-height ma-0 pa-0" no-gutter style="width: 520px">
      <v-tabs v-model="activeTab">
        <v-tab value="all">
          <v-icon icon="mdi-account-multiple" class="mr-2" />Friends</v-tab
        >
        <v-tab value="pending" class="d-flex justify-center">
          Pending
          <v-badge
            v-if="userStore.pendingFriendRequests.length > 0"
            :content="userStore.pendingFriendRequests.length"
            color="error"
            inline
          />
        </v-tab>
        <v-tab value="sent">Sent</v-tab>
        <v-spacer />
        <v-btn
          title="Add Friend"
          class="my-auto mr-2"
          size="small"
          variant="tonal"
          @click="showAddFriendDialog = true"
          >Ajouter</v-btn
        >
      </v-tabs>

      <v-card-text>
        <v-progress-linear v-if="userStore.loading" indeterminate />

        <div v-if="userStore.error" class="text-error mb-4">
          {{ userStore.error }}
          <v-btn variant="text" @click="userStore.loadFriends">Retry</v-btn>
        </div>

        <!-- All Friends Tab -->
        <div v-if="activeTab === 'all'">
          <div
            v-if="userStore.acceptedFriends.length === 0"
            class="text-center py-4"
          >
            <v-icon icon="mdi-account-search" size="64" class="mb-2" />
            <div class="text-subtitle-1">No friends yet</div>
            <div class="text-caption">Add friends to see them here</div>
          </div>

          <v-list v-else>
            <v-list-item
              v-for="friend in userStore.acceptedFriends"
              :key="friend.id"
              :title="friend.friend?.name || ''"
              :subtitle="'@' + (friend.friend?.slug || '')"
            >
              <template #prepend>
                <v-avatar color="primary" class="text-uppercase">
                  {{ (friend.friend?.name || "").charAt(0) }}
                </v-avatar>
              </template>

              <template #append>
                <v-menu>
                  <template #activator="{ props }">
                    <v-btn
                      icon="mdi-dots-vertical"
                      variant="text"
                      v-bind="props"
                    />
                  </template>
                  <v-list>
                    <v-list-item
                      title="Remove Friend"
                      @click="removeFriend(friend.friend?.id || '')"
                    >
                      <template #prepend>
                        <v-icon icon="mdi-account-remove" />
                      </template>
                    </v-list-item>
                    <v-list-item title="Block">
                      <template #prepend>
                        <v-icon icon="mdi-account-cancel" />
                      </template>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </template>
            </v-list-item>
          </v-list>
        </div>

        <!-- Pending Friend Requests Tab -->
        <div v-if="activeTab === 'pending'">
          <div
            v-if="userStore.pendingFriendRequests.length === 0"
            class="text-center py-4"
          >
            <v-icon icon="mdi-account-clock" size="64" class="mb-2" />
            <div class="text-subtitle-1">No pending requests</div>
            <div class="text-caption">
              Friend requests you receive will appear here
            </div>
          </div>

          <v-list v-else>
            <v-list-item
              v-for="request in userStore.pendingFriendRequests"
              :key="request.id"
              :title="request.user?.name || ''"
              :subtitle="'@' + (request.user?.slug || '')"
            >
              <template #prepend>
                <v-avatar color="primary" class="text-uppercase">
                  {{ (request.user?.name || "").charAt(0) }}
                </v-avatar>
              </template>

              <template #append>
                <div class="d-flex">
                  <v-btn
                    icon="mdi-check"
                    variant="text"
                    color="success"
                    class="mr-1"
                    title="Accept"
                    @click="respondToRequest(request.id, FriendStatus.ACCEPTED)"
                  />
                  <v-btn
                    icon="mdi-close"
                    variant="text"
                    color="error"
                    title="Decline"
                    @click="respondToRequest(request.id, FriendStatus.DECLINED)"
                  />
                </div>
              </template>
            </v-list-item>
          </v-list>
        </div>

        <!-- Sent Friend Requests Tab -->
        <div v-if="activeTab === 'sent'">
          <div
            v-if="userStore.sentFriendRequests.length === 0"
            class="text-center py-4"
          >
            <v-icon icon="mdi-account-arrow-right" size="64" class="mb-2" />
            <div class="text-subtitle-1">No sent requests</div>
            <div class="text-caption">
              Friend requests you've sent will appear here
            </div>
          </div>

          <v-list v-else>
            <v-list-item
              v-for="request in userStore.sentFriendRequests"
              :key="request.id"
              :title="request.friend?.name || ''"
              :subtitle="'@' + (request.friend?.slug || '')"
            >
              <template #prepend>
                <v-avatar color="primary" class="text-uppercase">
                  {{ (request.friend?.name || "").charAt(0) }}
                </v-avatar>
              </template>

              <template #append>
                <v-btn
                  icon="mdi-close"
                  variant="text"
                  color="error"
                  title="Cancel Request"
                  @click="cancelRequest(request.friend?.id || '')"
                />
              </template>
            </v-list-item>
          </v-list>
        </div>
      </v-card-text>
    </v-col>
    <!-- Add Friend Dialog -->
    <v-dialog v-model="showAddFriendDialog" max-width="500px">
      <v-card>
        <v-card-title>
          <v-icon icon="mdi-account-plus" class="mr-2" />
          Add Friend
        </v-card-title>
        <v-card-text>
          <p class="text-body-2 mb-4">
            You can add friends by entering their username.
          </p>
          <v-text-field
            v-model="friendUsername"
            label="Username"
            placeholder="Enter a username"
            :error-messages="addFriendError"
            @keyup.enter="addFriend"
          >
            <template #prepend>
              <v-icon icon="mdi-account-search" />
            </template>
          </v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showAddFriendDialog = false">
            Cancel
          </v-btn>
          <v-btn color="primary" :loading="addingFriend" @click="addFriend">
            Send Friend Request
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useUserStore } from "~/stores/user";
import { FriendStatus } from "#shared/models/friend";

const userStore = useUserStore();
const activeTab = ref("all");
const showAddFriendDialog = ref(false);
const friendUsername = ref("");
const addFriendError = ref("");
const addingFriend = ref(false);

// Search for a user by username using the API
async function searchUserByUsername(username: string) {
  try {
    const users = await $fetch<
      Array<{ id: string; name: string; slug: string }>
    >("/api/user/search", {
      method: "GET",
      params: { username },
    });

    if (users.length === 0) {
      throw new Error("No users found with that username");
    }

    // Return the first matching user
    return users[0];
  } catch (error) {
    console.error("Error searching for user:", error);
    throw error;
  }
}

async function addFriend() {
  if (!friendUsername.value.trim()) {
    addFriendError.value = "Please enter a username";
    return;
  }

  try {
    addingFriend.value = true;
    addFriendError.value = "";

    // In a real app, you would search for the user first
    const user = await searchUserByUsername(friendUsername.value);

    // Then send the friend request
    if (!user) return;
    await userStore.sendFriendRequest(user.id);

    // Close the dialog and reset
    showAddFriendDialog.value = false;
    friendUsername.value = "";

    // Switch to the sent tab
    activeTab.value = "sent";
  } catch (error) {
    console.error("Error adding friend:", error);
    addFriendError.value = "Failed to add friend. Please try again.";
  } finally {
    addingFriend.value = false;
  }
}

async function respondToRequest(requestId: number, status: FriendStatus) {
  try {
    await userStore.respondToFriendRequest(requestId, status);
    if (status === FriendStatus.ACCEPTED) {
      // Switch to the all tab to show the new friend
      activeTab.value = "all";
    }
  } catch (error) {
    console.error("Error responding to request:", error);
  }
}

async function cancelRequest(friendId: string) {
  try {
    await userStore.removeFriend(friendId);
  } catch (error) {
    console.error("Error canceling request:", error);
  }
}

async function removeFriend(friendId: string) {
  try {
    await userStore.removeFriend(friendId);
  } catch (error) {
    console.error("Error removing friend:", error);
  }
}
</script>
