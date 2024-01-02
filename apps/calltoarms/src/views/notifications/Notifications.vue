<template>
  <div class="d-flex align-stretch flex-column">
    <v-btn-toggle v-model="notificationsDisplay" divided>
      <v-btn
        @click="getNotification('Received')"
        class="flex-1-0"
        variant="flat"
        value="Received"
        >Received</v-btn
      >
      <v-btn
        @click="getNotification('Sent')"
        class="flex-1-0"
        variant="flat"
        value="Sent"
        >Sent</v-btn
      >
    </v-btn-toggle>
  </div>
  <v-list>
    <template v-for="notification in notifications" :key="notification.date">
      <v-list-item rounded :value="notification">
        <div class="d-flex align-center">
          <v-icon icon="mdi-bell" size="30" class="mr-4"></v-icon>
          <div>
            <h4 class="text-truncate" style="max-width: 210px">
              {{ notification.title }}
            </h4>
            {{ notification.body }}
          </div>
        </div>
      </v-list-item>
    </template>
  </v-list>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Message, notificationDB } from "../../fireStore/NotificationDB";

const notifications = ref<Message[]>();
const notificationsDisplay = ref("Received");
const loading = ref(false);

onMounted(async () => {
  getNotification("Received");
});

async function getNotification(type: "Sent" | "Received") {
  try {
    loading.value = true;
    if (type == "Received")
      notifications.value = await notificationDB.getReceived();
    else notifications.value = await notificationDB.getSent();
  } finally {
    loading.value = false;
  }
}
</script>
