<template>
  <v-text-field
    v-model="friendsToAdd"
    label="Add friends"
    class="mt-2"
    @keyup.enter="addUser()"
    hide-details
  >
    <template #append-inner>
      <v-progress-circular
        v-if="loading"
        indeterminate
        color="grey"
      ></v-progress-circular>
      <v-icon v-else icon="mdi-plus" @click="addUser()"></v-icon>
    </template>
  </v-text-field>
  <v-list class="ma-1">
    <template v-for="friend in friends" :key="friend.name">
      <v-hover v-slot="{ isHovering, props }" open-delay="100">
        <v-list-item :value="friend.name" v-bind="props" class="pa-2">
          <div class="d-flex align-center">
            <v-icon icon="mdi-account-circle" size="30" class="mr-4"></v-icon>
            {{ friend.name }}
          </div>
          <template #append>
            <v-btn
              icon="mdi-close"
              v-if="isHovering"
              variant="text"
              size="30"
              @click="deletedFriend(friend.id)"
            ></v-btn>
          </template>
        </v-list-item>
      </v-hover>
    </template>
  </v-list>
</template>

<script setup lang="ts">
import { useUserFriendsDB } from "@/db/UserFriendsDB";
import { User } from "@/models/User";
import { onMounted } from "vue";
import { ref } from "vue";

const userFriendsDb = useUserFriendsDB();

const friendsToAdd = ref("");
const loading = ref(false);
const friends = ref<User[]>([]);

onMounted(() => {
  loadUser();
});

async function addUser() {
  try {
    loading.value = true;
    await userFriendsDb.addFriend(friendsToAdd.value);
    await loadUser();
  } finally {
    friendsToAdd.value = "";
    loading.value = false;
  }
}

async function deletedFriend(id: string) {
  try {
    loading.value = true;
    await userFriendsDb.deleteFriend(id);
    await loadUser();
  } finally {
    friendsToAdd.value = "";
    loading.value = false;
  }
}

async function loadUser() {
  const users = await userFriendsDb.getMyFriends();
  if (users) friends.value = users;
}
</script>
