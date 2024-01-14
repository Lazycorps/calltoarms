<template>
  <CreateCommunityDialog />
  <v-text-field
    label="Search communities"
    v-model="searchTerm"
    @input="searchCommunities"
    class="mt-2"
    hide-details
  />
  <CommunityTile
    :community="community"
    v-for="community in matchingCommunities"
    :key="community.id"
  />
</template>

<script lang="ts" setup>
import CreateCommunityDialog from "@/views/communities/CreateCommunityDialog.vue";
import CommunityTile from "./CommunityTile.vue";

import { communitiesDB } from "@/fireStore/CommunitiesDB";
import { ref } from "vue";
import { Community } from "@/models/Community";
import { onMounted } from "vue";

const searchTerm = ref("");
const matchingCommunities = ref<Community[]>([]);

onMounted(() => {
  searchCommunities();
});

async function searchCommunities() {
  const communities = await communitiesDB.searchCommunities(searchTerm.value);
  if (communities) matchingCommunities.value = communities;
  else matchingCommunities.value = [];
}
</script>
