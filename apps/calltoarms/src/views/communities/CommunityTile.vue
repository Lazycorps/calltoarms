<template>
  <v-row>
    <v-col @click="openDialog" cols="12">
      <h3>{{ community.name }}</h3>
      <p class="text-end">{{ community.membersIds.length }} members</p>
    </v-col>
    <v-col cols="12">
      <v-btn v-if="community.membersIds.includes(auth.currentUser?.uid ?? '')"
        >Leave</v-btn
      >
      <v-btn v-else @click="joinCommunity">Join</v-btn>
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
        <v-btn
          @click="leaveCommunity"
          :loading="loading"
          >Leave</v-btn
        >
        <v-btn @click="joinCommunity" :loading="loading">Join</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { getAuth } from "firebase/auth";
import { ref } from "vue";
import { Community, communitiesDB } from "@/fireStore/CommunitiesDB";

const auth = getAuth();

const dialog = ref(false);
const loading = ref(false);

const props = defineProps<{
  community: Community;
}>();

function openDialog() {
  dialog.value = true;
}

function closeDialog() {
  dialog.value = false;
}

async function joinCommunity() {
  loading.value = true;
  try {
    await communitiesDB.joinCommunity(props.community.id);
  } catch (error) {
    console.log("error", error);
  } finally {
    loading.value = false;
  }
}
async function leaveCommunity() {
  loading.value = true;
  try {
    await communitiesDB.leaveCommunity(props.community.id);
  } catch (error) {
    console.log("error", error);
  } finally {
    loading.value = false;
  }
}
</script>