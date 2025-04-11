<template>
  <v-card class="pa-5">
    <v-row>
      <v-col sm="6" cols="12">
        <v-img
          :src="game.imageUrl"
          lazy-src="https://picsum.photos/id/11/100/60"
          :max-height="mobile ? 250 : 500"
          cover
        />
      </v-col>
      <v-col sm="6" cols="12">
        <!-- <v-select
          v-model="selectedCommunities"
          :items="communiesStore.userCommunities"
          item-title="name"
          item-value="id"
          label="Select communities to notify"
          variant="outlined"
          multiple
        >
          <template #selection="{ item, index }">
            <v-chip v-if="index < 3">
              <span>{{ item.raw.name }}</span>
            </v-chip>
            <span
              v-if="index === 3"
              class="text-grey text-caption align-self-center"
            >
              (+{{ selectedUsers.length - 3 }} others)
            </span>
          </template>
        </v-select> -->
        <v-select
          v-model="selectedUsers"
          :items="usersStore.acceptedFriends"
          :item-title="(item) => item.friend?.name || ''"
          item-value="id"
          label="Select friends to notify"
          variant="outlined"
          multiple
        >
          <template #selection="{ item, index }">
            <v-chip v-if="index < 3">
              <span>{{ item.raw.friend?.name }}</span>
            </v-chip>
            <span
              v-if="index === 3"
              class="text-grey text-caption align-self-center"
            >
              (+{{ selectedUsers.length - 3 }} others)
            </span>
          </template>
        </v-select>
        <v-textarea v-model="message" label="Message" />
        <v-btn
          block
          color="red"
          prepend-icon="mdi-bullhorn-variant"
          :loading="loading"
          @click="sendNotification()"
          >Call to arms !</v-btn
        >
      </v-col>
    </v-row>
  </v-card>
</template>

<script lang="ts" setup>
// import type { GameDTO } from "@/shared/models/game";
// import type { MessageDTO } from "@/shared/models/message";
// import { getAuth } from "firebase/auth";
import { ref } from "vue";
import { useDisplay } from "vuetify";
import type { GameDTO } from "~/shared/models/game";
// import { useNotificationsApi } from "@/api/NotificationsApi";
// import type { Message } from "@/db/NotificationDB";
// import { useNotificationsDb } from "@/db/NotificationDB";
// import { useUserStore } from "@/store/user";
// import { useDisplay } from "vuetify/lib/framework.mjs";
// import { Timestamp } from "firebase/firestore";
// import { useCommunitiesStore } from "@/store/communities";

// const auth = getAuth();
// const notificationApi = useNotificationsApi();
// const notificationDb = useNotificationsDb();
const usersStore = useUserStore();
// const communiesStore = useCommunitiesStore();

const { mobile } = useDisplay();
defineProps<{
  game: GameDTO;
}>();
// const emits = defineEmits(["send"]);

const message = ref("Hey noob, wanna play ?");
const loading = ref(false);

const selectedUsers = ref<string[]>([]);
// const selectedCommunities = ref<string[]>([]);

async function sendNotification() {
  try {
    // if (!auth.currentUser?.uid) return;
    // loading.value = true;
    // const notif: MessageDTO = {
    //   body: message.value,
    //   title: `${auth.currentUser?.displayName} play ${props.game.name}`,
    //   users: selectedUsers.value,
    //   communities: selectedCommunities.value,
    // };
    // const mess: Message = {
    //   senderId: auth.currentUser?.uid,
    //   body: message.value,
    //   title: `${auth.currentUser?.displayName} play ${props.game.name}`,
    //   receiverIds: selectedUsers.value,
    //   receiverCommunitiesIds: selectedCommunities.value,
    //   gameCover: props.game.cover.url ?? "",
    //   gameId: props.game.id ?? 0,
    //   date: Timestamp.fromDate(new Date()),
    // };
    // await notificationDb.addMessage(mess);
    // await notificationApi.sendNotification(notif);
    // emits("send");
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped></style>
