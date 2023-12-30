<template>
  <v-navigation-drawer rail floating permanent return-object>
    <v-list density="compact" nav>
      <v-list-item
        prepend-icon="mdi-account-multiple"
        title="Friends"
        value="Friends"
        @click="selectComponent('Friends')"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi-account-group"
        title="Communities"
        value="Communities"
        @click="selectComponent('Communities')"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi-bell"
        title="Notifications"
        value="Notifications"
        @click="selectComponent('Notifications')"
      >
        <template #prepend>
          <v-badge
            v-model="notificationsStore.newNotification"
            :content="notificationsStore.count"
            color="error"
          >
            <v-icon>mdi-bell</v-icon>
          </v-badge>
        </template>
      </v-list-item>
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
import CommunitiesView from "@/views/communities/Communities.vue";
import { computed, ref, shallowRef } from "vue";
import { useNotificationsStore } from "@/store/notifications";

const notificationsStore = useNotificationsStore();

const drawer = computed(() => {
  return selectedItem.value != null;
});

const selectedItem = shallowRef();
const selectedItemTitle = ref("");

function selectComponent(componentToSelect: string) {
  if (selectedItemTitle.value == componentToSelect) {
    selectedItem.value = null;
    selectedItemTitle.value = "";
  } else if (componentToSelect == "Notifications") {
    notificationsStore.count = 0;
    selectedItem.value = NotificationsView;
  } else if (componentToSelect == "Friends") {
    selectedItem.value = FriendsView;
  } else if (componentToSelect == "Communities") {
    selectedItem.value = CommunitiesView;
  }
  selectedItemTitle.value = componentToSelect;
}
</script>
