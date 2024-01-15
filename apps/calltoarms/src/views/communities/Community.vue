<template>
  <v-row>
    <v-col cols="2">
      <h3>{{ community.name }}</h3>
      <v-list class="ma-1">
        <template v-for="member in members" :key="member.id">
          <v-hover v-slot="{ isHovering, props }" open-delay="100">
            <v-list-item :value="member.name" v-bind="props" class="pa-2">
              <div class="d-flex align-center">
                <v-icon
                  icon="mdi-account-circle"
                  size="30"
                  class="mr-4"
                ></v-icon>
                {{ member.name }}
              </div>
            </v-list-item>
          </v-hover>
        </template>
      </v-list></v-col
    >
    <v-col cols="10"></v-col>
  </v-row>
</template>

<script setup lang="ts">
import { useUserDB } from "@/db/UserDB";
import { communitiesDB } from "@/fireStore/CommunitiesDB";
import { onMounted, ref, watch } from "vue";
import { User } from "@/models/User";
import { useRoute } from "vue-router";
import { Community } from "@/models/Community";
const userDB = useUserDB();
const route = useRoute();

const members = ref<User[]>([]);
const community = ref<Community>(new Community());

onMounted(() => {
  loadCommunity();
  loadMembers();
});

watch(route, async () => {
  await loadCommunity();
  await loadMembers();
});

async function loadCommunity() {
  if (route.params.id) {
    const commu = await communitiesDB.getCommunity(route.params.id as string);
    community.value = commu ?? new Community();
  }
}

async function loadMembers() {
  if (route.params.id) {
    const membersId = await communitiesDB.getCommunityMembers(
      route.params.id as string
    );
    console.log(membersId);
    members.value = (await userDB.getUsers(membersId)) ?? [];
  }
}
</script>
