<template>
  <div>
    <v-navigation-drawer v-if="!mobile" rail floating permanent>
      <v-list density="compact" nav>
        <v-list-item
          width="50px"
          height="50px"
          prepend-icon="mdi-sword-cross"
          title="Friends"
          rounded
          color="white"
          @click="router.push({ name: 'Home' })"
        />
        <v-divider class="my-1" />
        <v-list-item
          prepend-icon="mdi-account-multiple"
          title="Friends"
          value="Friends"
          @click="selectComponent('Friends')"
        />
        <v-list-item
          prepend-icon="mdi-bell"
          title="Notifications"
          value="Notifications"
          @click="selectComponent('Notifications')"
        >
          <!-- <template #prepend>
            <v-badge
              v-model="notificationsStore.newNotification"
              :content="notificationsStore.count"
              color="error"
            >
              <v-icon>mdi-bell</v-icon>
            </v-badge>
          </template> -->
        </v-list-item>
        <v-divider />
        <!-- <v-list-item
        v-for="community in communitiesStore.userCommunities"
        :key="community.id"
        :title="community.name"
        :value="community.id"
        class="pa-0 mt-2"
        @click="
          router.push({ name: 'Community', params: { id: community.id } })
        "
      >
        <template #prepend>
          <v-avatar
            :color="generateColor(community.name)"
            size="40"
            class="lazy-badge"
          >
            <span class="text-h6">{{
              community.name.substring(0, 2).toUpperCase()
            }}</span>
          </v-avatar>
        </template>
      </v-list-item> -->
        <v-list-item
          title="Communities"
          value="Communities"
          class="pa-0 mt-2"
          @click="selectComponent('Communities')"
        >
          <template #prepend>
            <v-avatar
              icon="mdi-plus"
              size="40"
              class="lazy-badge"
              color="primary"
            />
          </template>
        </v-list-item>
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
      v-model="drawer"
      order="2"
      width="300"
      color="#171717"
      class="pa-2"
      :temporary="mobile"
      :permanent="!mobile"
      :location="mobile ? 'right' : 'left'"
    >
      <component :is="selectedItem" />
    </v-navigation-drawer>
  </div>
</template>
<script setup lang="ts">
// import NotificationsView from "@/views/notifications/Notifications.vue";
// import FriendsView from "@/views/friends/Friends.vue";
// import CommunitiesView from "@/views/communities/Communities.vue";
import { computed, shallowRef } from "vue";
import { useDisplay } from "vuetify";
// import { useCommunitiesStore } from "@/store/communities";
import { useRouter } from "vue-router";
import { useNotificationsStore } from "~/stores/notifications";

const notificationsStore = useNotificationsStore();
// const communitiesStore = useCommunitiesStore();
const router = useRouter();

const { mobile } = useDisplay();
// const { generateColor } = useColorGenerator();

const drawer = computed(() => {
  return selectedItem.value != null;
});

const selectedItem = shallowRef();
// const selectedItemTitle = ref("");

function selectComponent(componentToSelect: string) {
  // if (selectedItemTitle.value == componentToSelect) {
  //   selectedItem.value = null;
  //   selectedItemTitle.value = "";
  // } else if (componentToSelect == "Notifications") {
  //   notificationsStore.count = 0;
  //   selectedItem.value = NotificationsView;
  //   selectedItemTitle.value = componentToSelect;
  // } else if (componentToSelect == "Friends") {
  //   selectedItem.value = FriendsView;
  //   selectedItemTitle.value = componentToSelect;
  // } else if (componentToSelect == "Communities") {
  //   selectedItem.value = CommunitiesView;
  //   selectedItemTitle.value = componentToSelect;
  // }
}
</script>

<style scoped lang="scss">
.lazy-badge {
  border-radius: 50%;

  transition: all 0.2s;
  &:hover {
    border-radius: 20%;
  }
}
</style>
