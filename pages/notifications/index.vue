<template>
  <div>
    <div class="d-flex align-stretch flex-column">
      <v-btn-toggle v-model="notificationsDisplay" divided>
        <v-btn
          class="flex-1-0"
          variant="flat"
          value="Received"
          @click="notificationsDisplay = 'Received'"
          >Received</v-btn
        >
        <v-btn
          class="flex-1-0"
          variant="flat"
          value="Sent"
          @click="notificationsDisplay = 'Sent'"
          >Sent</v-btn
        >
      </v-btn-toggle>
    </div>
    <v-list>
      <template
        v-for="notification in notificationsStore.notificationsReceived"
        :key="notification.date"
      >
        <v-list-item rounded :value="notification">
          <div class="d-flex align-center">
            <v-icon icon="mdi-bell" size="26" class="mr-2" />
            <div class="message">
              <div class="title">
                {{ notification.notification.title }}
              </div>
              <div class="body">{{ notification.notification.body }}</div>
              <div class="date">
                {{
                  useDateFormat(notification.createdAt, "YYYY-MM-DD HH:mm:ss")
                }}
              </div>
            </div>
          </div>
        </v-list-item>
      </template>
    </v-list>
  </div>
</template>

<script setup lang="ts">
import { useDateFormat } from "@vueuse/core";

const notificationsDisplay = ref("Received");
const notificationsStore = useNotificationsStore();

onMounted(() => {
  notificationsStore.loadNotificationReceived();
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
