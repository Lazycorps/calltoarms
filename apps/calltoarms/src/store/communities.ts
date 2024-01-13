import { communitiesDB } from "@/fireStore/CommunitiesDB";
import { Community } from "@/models/Community";
import { defineStore } from "pinia";
import { computed } from "vue";
import { onMounted } from "vue";
import { ref } from "vue";
import { useCollection } from "vuefire";

export const useCommunitiesStore = defineStore("communities", () => {
  const userCommunities = ref<Community[]>([]);

  const userCommunitiesIds = computed(() =>
    userCommunities.value.map((community) => community.id)
  );

  onMounted(() => {
    loadUserCommunities();
  });

  async function loadUserCommunities() {
    userCommunities.value = [];
    userCommunities.value = await communitiesDB.getUserCommunities();
  }
  async function joinCommunity(communityId: string) {
    await communitiesDB.joinCommunity(communityId);
    await loadUserCommunities();
  }
  async function leaveCommunity(communityId: string) {
    await communitiesDB.leaveCommunity(communityId);
    await loadUserCommunities();
  }

  return {
    userCommunities,
    userCommunitiesIds,
    loadUserCommunities,
    joinCommunity,
    leaveCommunity,
  };
});
