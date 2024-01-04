<template>
  <v-row>
    <v-col @click="openDialog" cols="12">
      <h3>{{ community.name }}</h3>
      <!-- <p class="text-end">{{ community.membersIds.length }} members</p> -->
    </v-col>
    <v-col cols="12">
      <v-btn v-if="communitiesStore.userCommunitiesIds.includes(community.id)" @click="leaveCommunity">Leave</v-btn>
      <v-btn v-else @click="joinCommunity">Join</v-btn>
    </v-col>
  </v-row>
  <v-dialog v-model="dialog">
    <v-card :title="community.name">
      <v-card-text>
        <p>{{ community.description }}</p>
        <!-- <p>{{ community.membersIds.length }} members</p> -->
      </v-card-text>

      <v-card-actions>
        <v-btn color="error" text="Close" @click="closeDialog"></v-btn>
        <v-btn v-if="communitiesStore.userCommunitiesIds.includes(community.id)" @click="leaveCommunity" :loading="loading">Leave</v-btn>
        <v-btn v-else @click="joinCommunity" :loading="loading">Join</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Community } from "@/models/Community";
import { useCommunitiesStore } from "@/store/communities";

const dialog = ref(false);
const loading = ref(false);

const props = defineProps<{
  community: Community;
}>();

const communitiesStore = useCommunitiesStore();

function openDialog() {
  dialog.value = true;
}

function closeDialog() {
  dialog.value = false;
}

async function joinCommunity() {
  loading.value = true;
  try {
    await communitiesStore.joinCommunity(props.community.id);
  } catch (error) {
    console.log("error", error);
  } finally {
    loading.value = false;
  }
}
async function leaveCommunity() {
  loading.value = true;
  try {
    await communitiesStore.leaveCommunity(props.community.id);
  } catch (error) {
    console.log("error", error);
  } finally {
    loading.value = false;
  }
}
</script>
