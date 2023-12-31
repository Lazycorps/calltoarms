<template>
  <v-card class="pa-5">
    <v-row>
      <v-col sm="6" cols="12">
        <v-img
          :src="`https:${game.cover.url}`"
          lazy-src="https://picsum.photos/id/11/100/60"
          :max-height="mobile ? 250 : 500"
          cover
        >
        </v-img>
      </v-col>
      <v-col sm="6" cols="12">
        <v-select
          v-model="selectedUsers"
          :items="usersStore.friends"
          item-title="name"
          item-value="id"
          label="Select friends to notify"
          variant="outlined"
          multiple
        >
          <template v-slot:selection="{ item, index }">
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
        </v-select>
        <v-textarea v-model="message" label="Message" />
        <v-btn
          block
          color="red"
          prepend-icon="mdi-bullhorn-variant"
          @click="sendNotification()"
          :loading="loading"
          >Call to arms !</v-btn
        >
      </v-col>
    </v-row>
  </v-card>
</template>

<script lang="ts" setup>
import { GameDTO } from "@/models/dto/GameDTO";
import { MessageDTO } from "@/models/dto/MessageDTO";
import { getAuth } from "firebase/auth";
import { defineProps, ref } from "vue";
import { MessageApi } from "@/api/MessageApi";
import { Message, notificationDB } from "@/fireStore/NotificationDB";
import { useUsersStore } from "@/store/users";
import { onMounted } from "vue";
import { useDisplay } from "vuetify/lib/framework.mjs";

const auth = getAuth();
const { mobile } = useDisplay();
const usersStore = useUsersStore();
const props = defineProps<{
  game: GameDTO;
}>();
const emits = defineEmits(["send"]);

const message = ref("Hey noob, wanna play ?");
const loading = ref(false);

const selectedUsers = ref<string[]>([]);

onMounted(() => {
  usersStore.loadFriends();
});

async function sendNotification() {
  try {
    if (!auth.currentUser?.uid) return;

    loading.value = true;
    const notif: MessageDTO = {
      body: message.value,
      title: `${auth.currentUser?.displayName} play ${props.game.name}`,
      users: selectedUsers.value,
    };

    const mess: Message = {
      senderId: auth.currentUser?.uid,
      body: message.value,
      title: `${auth.currentUser?.displayName} play ${props.game.name}`,
      receiverIds: selectedUsers.value,
      gameCover: props.game.cover.url ?? "",
      gameId: props.game.id ?? 0,
      date: new Date().toJSON(),
    };
    await notificationDB.addMessage(mess);
    await MessageApi.sendNotification(notif);
    emits("send");
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped></style>
