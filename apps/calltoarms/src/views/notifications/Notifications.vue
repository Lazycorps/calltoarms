<template>
  <v-list item-props lines="three">
    <template v-for="notification in notifications" :key="notification.date">
      <v-list-item :title="notification.title" :subtitle="notification.body">
        <template v-slot:prepend>
          <v-icon icon="mdi-bell"></v-icon>
        </template>
      </v-list-item>
      <v-devider />
    </template>

  </v-list>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Message, notificationDB } from "../../fireStore/NotificationDB"

const notifications = ref<Message[]>();

onMounted(async () => {
  notifications.value = await notificationDB.getSend();
});
</script>
