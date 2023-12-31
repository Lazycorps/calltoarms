<template>
  <p>Your communities</p>
  <CommunityTile
    :community="community"
    v-for="community in userCommunities"
    :key="community.name"
  />
  <CreateCommunityDialog />
  <v-text-field
    label="Search.."
    v-model="searchTerm"
    @input="searchCommunities"
  />
  <CommunityTile
    :community="community"
    v-for="community in matchingCommunities"
    :key="community.name"
  />
</template>

<script lang="ts" setup>
import CreateCommunityDialog from "@/views/communities/CreateCommunityDialog.vue";
import CommunityTile from "./CommunityTile.vue";

import { Community, communitiesDB } from "@/fireStore/CommunitiesDB";
import { ref } from "vue";
import { onMounted } from "vue";

const userCommunities = ref<Community[]>([]);
const searchTerm = ref("");
const matchingCommunities = ref<Community[]>([]);

onMounted(() => {
  loadUserCommunities();
});

async function loadUserCommunities() {
  const communities = await communitiesDB.getUserCommunities();
  if (communities) userCommunities.value = communities;
}

async function searchCommunities() {
  const communities = await communitiesDB.searchCommunities(searchTerm.value);
  if (communities) matchingCommunities.value = communities;
  else matchingCommunities.value = [];
}
</script>
