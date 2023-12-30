<template>
  <v-navigation-drawer rail>
    <v-list density="compact" nav>
      <v-list-item prepend-icon="mdi-account-multiple" title="Friends" value="friends"></v-list-item>
      <v-list-item prepend-icon="mdi-bell" title="Notifications" value="notifications"></v-list-item>
    </v-list>
  </v-navigation-drawer>
  <v-navigation-drawer permanent width="300">
    <Notifications></Notifications>
  </v-navigation-drawer>
</template>
<script setup lang="ts">
import Notifications from "@/views/notifications/Notifications.vue"
</script>
