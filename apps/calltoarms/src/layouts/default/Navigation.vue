<template>
  <v-navigation-drawer rail floating permanent return-object>
    <v-list density="compact" nav>
      <v-list-item
        prepend-icon="mdi-account-multiple"
        title="Friends"
        value="test"
        @click="selectedItem = FriendsView"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi-bell"
        title="Notifications"
        value="Notifications"
        @click="selectedItem = NotificationsView"
      ></v-list-item>
    </v-list>
  </v-navigation-drawer>
  <v-navigation-drawer
    permanent
    width="300"
    color="#171717"
    v-model="drawer"
    class="pa-2"
  >
    <component :is="selectedItem"></component>
  </v-navigation-drawer>
</template>
<script setup lang="ts">
import NotificationsView from "@/views/notifications/Notifications.vue";
import FriendsView from "@/views/friends/Friends.vue";
import { computed, shallowRef } from "vue";

const drawer = computed(() => {
  return selectedItem.value != null;
});

const selectedItem = shallowRef();
</script>
