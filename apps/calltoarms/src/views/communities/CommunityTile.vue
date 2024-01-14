<template>
  <v-list-item
    :value="community"
    v-bind="props"
    @click="openDialog"
    class="pa-2"
  >
    <div class="d-flex align-center">
      <v-avatar :color="generateColor(community.name)" size="34" class="mr-2">
        <span class="text-h6">{{
          community.name.substring(0, 2).toUpperCase()
        }}</span>
      </v-avatar>
      {{ community.name }}
    </div>
    <template #append>
      <!-- <v-btn
        v-if="communitiesStore.userCommunitiesIds.includes(community.id)"
        text="join"
        variant="text"
        size="30"
        @click="leaveCommunity"
      ></v-btn>
      <v-btn
        v-else
        icon="mdi-logout"
        color="red"
        variant="text"
        size="30"
        @click="joinCommunity"
      ></v-btn> -->
    </template>
  </v-list-item>
  <v-dialog v-model="dialog" width="500px">
    <v-card :title="community.name">
      <v-card-text>
        <p>{{ community.description }}</p>
        <!-- <p>{{ community.membersIds.length }} members</p> -->
      </v-card-text>

      <v-card-actions>
        <v-btn color="error" text="Close" @click="closeDialog"></v-btn>
        <v-btn
          v-if="communitiesStore.userCommunitiesIds.includes(community.id)"
          @click="leaveCommunity"
          :loading="loading"
          >Leave</v-btn
        >
        <v-btn v-else @click="joinCommunity" :loading="loading">Join</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Community } from "@/models/Community";
import { useCommunitiesStore } from "@/store/communities";
import { useColorGenerator } from "@/utils/ColorGenerator";

const { generateColor } = useColorGenerator();

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

const normalizeHash = (hash: number, min: number, max: number) => {
  return Math.floor((hash % (max - min)) + min);
};
</script>
