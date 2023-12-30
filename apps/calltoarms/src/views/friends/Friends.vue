<template>
  <v-text-field
    v-model="friendsToAdd"
    label="Add friends"
    class="mt-2"
  ></v-text-field>
  <v-list class="ma-1">
    <!-- <template v-for="notification in notifications" :key="notification.date">
      <v-list-item
        :title="notification.title"
        :subtitle="notification.body"
        :value="notification"
        prepend-icon="mdi-bell"
      >
      </v-list-item>
    </template> -->
  </v-list>
</template>

<script setup lang="ts">
import { ref } from "vue";

const friendsToAdd = ref("");
</script>
