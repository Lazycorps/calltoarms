<template>
  <v-card class="pa-5">
    <v-row>
      <v-col>
        <v-img
          :src="`https:${game.cover.url}`"
          lazy-src="https://picsum.photos/id/11/100/60"
          class="white--text align-end"
          gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
          cover
        >
        </v-img>
      </v-col>
      <v-col>
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
import { GameDTO } from "@/models/GameDTO";
import { MessageDTO } from "@/models/MessageDTO";
import { getAuth } from "firebase/auth";
import { defineProps, ref } from "vue";
import { MessageApi } from "@/api/MessageApi";
import { Message, notificationDB } from "@/fireStore/NotificationDB";
const auth = getAuth();

const props = defineProps<{
  game: GameDTO;
}>();

const message = ref("Hey noob, wanna play ?");
const loading = ref(false);

async function sendNotification() {
  try {
    if (!auth.currentUser?.uid) return;

    loading.value = true;
    const notif: MessageDTO = {
      body: message.value,
      title: `${auth.currentUser?.displayName} play ${props.game.name}`,
      users: [],
    };

    const mess: Message = {
      senderId: auth.currentUser?.uid,
      body: message.value,
      title: `${auth.currentUser?.displayName} play ${props.game.name}`,
      receiverIds: [],
      gameCover: props.game.cover.url ?? "",
      gameId: props.game.id ?? 0,
      date: new Date().toJSON()
    };
    await notificationDB.addMessage(mess);
    //await MessageApi.sendNotification(notif);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped></style>
