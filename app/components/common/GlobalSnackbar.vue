<template>
  <v-snackbar
    v-model="snackbarStore.show"
    :color="snackbarStore.color"
    :timeout="snackbarStore.timeout"
    location="bottom right"
    variant="elevated"
  >
    {{ snackbarStore.message }}
    
    <template v-if="snackbarStore.action" #actions>
      <v-btn
        variant="text"
        @click="snackbarStore.executeAction"
      >
        {{ snackbarStore.action.text }}
      </v-btn>
    </template>
    
    <template #actions>
      <v-btn
        variant="text"
        icon="mdi-close"
        @click="snackbarStore.hide"
      />
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
import { useSnackbarStore } from "~/stores/snackbar";

const snackbarStore = useSnackbarStore();
</script>