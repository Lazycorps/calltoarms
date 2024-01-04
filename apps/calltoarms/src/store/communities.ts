import { communitiesDB } from "@/fireStore/CommunitiesDB";
import { Community } from "@/models/Community";
import { defineStore } from "pinia";

export const useCommunitiesStore = defineStore("communities", {
  state: () => ({
    userCommunities: [] as Community[],
  }),
  getters: {
    userCommunitiesIds: (state) =>
      state.userCommunities.map((community) => community.id),
  },
  actions: {
    async getUserCommunities() {
      this.userCommunities = [];
      this.userCommunities = await communitiesDB.getUserCommunities();
    },
    async joinCommunity(communityId: string) {
      await communitiesDB.joinCommunity(communityId);
      await this.getUserCommunities();
    },
    async leaveCommunity(communityId: string) {
      await communitiesDB.leaveCommunity(communityId);
      await this.getUserCommunities();
    },
  },
});
