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
          <v-icon icon="mdi-bell" size="26" class="mr-2"></v-icon>
          <div class="message">
            <div class="title">
              {{ notification.title }}
            </div>
            <div class="body">{{ notification.body }}</div>
            <div class="date">
              {{ notification.date?.toDate().toLocaleString() }}
            </div>
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
<style scoped>
.message {
  max-width: 220px;
  white-space: nowrap;
  .date {
    font-size: 12px;
    color: gray;
  }
  .body {
    font-size: 14px;
    text-overflow: ellipsis;
    overflow: hidden;
  }
  .title {
    font-size: 16px;
    text-overflow: ellipsis;
    overflow: hidden;
  }
}
</style>
