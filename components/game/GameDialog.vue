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
          item-value="friendId"
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
import { ref } from "vue";
import { useDisplay } from "vuetify";
import type { GameDTO } from "~/shared/models/game";
import type { MessageDTO } from "~/shared/models/message";
import { useFirebaseMessaging } from "~/composables/firebase/useFirebaseMessaging";

const usersStore = useUserStore();
const { sendPushNotification } = useFirebaseMessaging();
// const communiesStore = useCommunitiesStore();

const { mobile } = useDisplay();
const props = defineProps<{
  game: GameDTO;
}>();
const emits = defineEmits(["send"]);

const message = ref("Hey noob, wanna play ?");
const loading = ref(false);
const error = ref<string | null>(null);

const selectedUsers = ref<string[]>([]);
// const selectedCommunities = ref<string[]>([]);

async function sendNotification() {
  try {
    if (!usersStore.user) return;
    loading.value = true;
    error.value = null;

    const notif: MessageDTO = {
      body: message.value,
      title: `${usersStore.user.name} play ${props.game.title}`,
      users: selectedUsers.value,
      communities: [], // selectedCommunities.value,
    };

    // Send push notification
    await sendPushNotification(
      notif,
      usersStore.user.id,
      props.game.id,
      props.game.imageUrl || ""
    );

    emits("send");
  } catch (err) {
    console.error("Error sending notification:", err);
    error.value =
      err instanceof Error ? err.message : "Failed to send notification";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped></style>
