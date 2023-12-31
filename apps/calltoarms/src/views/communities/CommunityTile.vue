<template>
  <v-row @click="openDialog">
    <v-col cols="12">
      <h3>{{ community.name }}</h3>
      <p class="text-end">{{ community.membersIds.length }} members</p>
    </v-col>
  </v-row>
  <v-dialog v-model="dialog">
    <v-card :title="community.name">
      <v-card-text>
        <p>{{ community.description }}</p>
        <p>{{ community.membersIds.length }} members</p>
        </v-card-text>

      <v-card-actions>
        <v-btn color="error" text="Close" @click="closeDialog"></v-btn>
        <v-btn v-if="community.membersIds.includes(auth.currentUser?.uid ?? '')"
          >Leave</v-btn
        >
        <v-btn v-else>Join</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { CommunityDTO } from "@/models/CommunityDTO";
import { getAuth } from "firebase/auth";
import { ref } from "vue";

const auth = getAuth();

const dialog = ref(false);

const props = defineProps<{
  community: CommunityDTO;
}>();

function openDialog() {
  dialog.value = true;
}

function closeDialog() {
  dialog.value = false;
}
</script>
