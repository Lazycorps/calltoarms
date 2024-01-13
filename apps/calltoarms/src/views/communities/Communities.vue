<template>
  <h2>Your communities</h2>
  <CommunityTile
    :community="community"
    v-for="community in communitiesStore.userCommunities"
    :key="community.id"
  />
  <v-divider class="mt-2" />
  <CreateCommunityDialog />
  <v-text-field
    class="mt-6"
    label="Search.."
    v-model="searchTerm"
    @input="searchCommunities"
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
import { useCommunitiesStore } from "@/store/communities";

const searchTerm = ref("");
const matchingCommunities = ref<Community[]>([]);

const communitiesStore = useCommunitiesStore();

async function searchCommunities() {
  const communities = await communitiesDB.searchCommunities(searchTerm.value);
  if (communities) matchingCommunities.value = communities;
  else matchingCommunities.value = [];
}
</script>
