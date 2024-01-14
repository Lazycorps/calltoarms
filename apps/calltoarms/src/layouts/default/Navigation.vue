<template>
  <v-navigation-drawer v-if="!mobile" rail floating permanent>
    <v-list density="compact" nav>
      <v-list-item
        width="50px"
        height="50px"
        prepend-icon="mdi-sword-cross"
        title="Friends"
        rounded
        color="white"
      ></v-list-item>
      <v-divider class="my-1"></v-divider>
      <v-list-item
        prepend-icon="mdi-account-multiple"
        title="Friends"
        value="Friends"
        @click="selectComponent('Friends')"
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
      <v-divider />
      <v-list-item
        prepend-icon="mdi-account-multiple-plus"
        title="Communities"
        value="Communities"
        @click="selectComponent('Communities')"
        class="mt-2"
      ></v-list-item>
      <template
        v-for="community in communitiesStore.userCommunities"
        :key="community.id"
      >
        <v-list-item
          :title="community.name"
          :value="community.id"
          @click="selectComponent('Community')"
          class="pa-0 mt-2"
        >
          <template #prepend>
            <v-avatar :color="generateColor(community.name)" size="40">
              <span class="text-h6">{{
                community.name.substring(0, 2).toUpperCase()
              }}</span>
            </v-avatar>
          </template>
        </v-list-item>
      </template>
    </v-list>
  </v-navigation-drawer>
  <v-bottom-navigation :active="mobile" grow absolute>
    <v-btn @click="selectComponent('Friends')">
      <v-icon>mdi-account-multiple</v-icon>
      <span>Friends</span>
    </v-btn>

    <v-btn @click="selectComponent('Notifications')">
      <v-badge
        v-model="notificationsStore.newNotification"
        :content="notificationsStore.count"
        color="error"
      >
        <v-icon>mdi-bell</v-icon>
      </v-badge>
      <span>Notifications</span>
    </v-btn>

    <v-btn @click="selectComponent('Communities')">
      <v-icon>mdi-account-group</v-icon>
      <span>Communities</span>
    </v-btn>
  </v-bottom-navigation>
  <v-navigation-drawer
    order="2"
    width="300"
    color="#171717"
    v-model="drawer"
    class="pa-2"
    :temporary="mobile"
    :permanent="!mobile"
    :location="mobile ? 'right' : 'left'"
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
import { useDisplay } from "vuetify";
import { useCommunitiesStore } from "@/store/communities";
import { useColorGenerator } from "@/utils/ColorGenerator";

const notificationsStore = useNotificationsStore();
const communitiesStore = useCommunitiesStore();
const { mobile } = useDisplay();
const { generateColor } = useColorGenerator();

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
    selectedItemTitle.value = componentToSelect;
  } else if (componentToSelect == "Friends") {
    selectedItem.value = FriendsView;
    selectedItemTitle.value = componentToSelect;
  } else if (componentToSelect == "Communities") {
    selectedItem.value = CommunitiesView;
    selectedItemTitle.value = componentToSelect;
  }
}
</script>
