<template>
  <div class="d-flex align-stretch flex-column">
    <v-btn-toggle v-model="notificationsDisplay" divided>
      <v-btn
        @click="notificationsDisplay = 'Received'"
        class="flex-1-0"
        variant="flat"
        value="Received"
        >Received</v-btn
      >
      <v-btn
        @click="notificationsDisplay = 'Sent'"
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
import { ref } from "vue";
import { useNotificationsDb } from "@/composables/NotificationDB";
import { computed } from "vue";

const { notificationsReceived, notificationsSend } = useNotificationsDb();

const notificationsDisplay = ref("Received");

const notifications = computed(() => {
  if (notificationsDisplay.value == "Received")
    return notificationsReceived.value;
  else return notificationsSend.value;
});
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
