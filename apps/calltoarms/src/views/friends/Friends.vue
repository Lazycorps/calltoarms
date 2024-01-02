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
      <v-list-item :value="friend.name">
        <div class="d-flex align-center">
          <v-icon icon="mdi-account-circle" size="30" class="mr-4"></v-icon>
          {{ friend.name }}
        </div>
      </v-list-item>
    </template>
  </v-list>
</template>

<script setup lang="ts">
import { usersDB } from "@/fireStore/UsersDB";
import { User } from "@/models/User";
import { onMounted } from "vue";
import { ref } from "vue";

const friendsToAdd = ref("");
const loading = ref(false);
const friends = ref<User[]>([]);

onMounted(() => {
  loadUser();
});

async function addUser() {
  try {
    loading.value = true;
    await usersDB.addFriends(friendsToAdd.value);
    await loadUser();
  } finally {
    friendsToAdd.value = "";
    loading.value = false;
  }
}

async function loadUser() {
  const users = await usersDB.getMyFriends();
  if (users) friends.value = users;
}
</script>
