<template>
  <p>Your communities</p>
  <ul>
    <li v-for="community in userCommunities" :key="community.name">
      {{ community.name }}
    </li>
  </ul>
  <CreateCommunityDialog />
</template>

<script lang="ts" setup>
import CreateCommunityDialog from "@/views/communities/CreateCommunityDialog.vue";

import { Community, communitiesDB } from "@/fireStore/CommunitiesDB";
import { ref } from "vue";
import { onMounted } from "vue";

const userCommunities = ref<Community[]>([]);

onMounted(() => {
  loadUserCommunities();
});

async function loadUserCommunities() {
  const communities = await communitiesDB.getUserCommunities();
  if (communities) userCommunities.value = communities;
}
</script>
