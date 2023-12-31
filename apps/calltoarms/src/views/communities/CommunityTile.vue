<template>
<v-row>
    <v-col cols="12">
        <h3>{{ community.name }}</h3>
        <p class="text-end" >{{ community.membersIds.length }} members</p>
    </v-col>
</v-row>    
</template>

<script setup lang="ts">
import { CommunityDTO } from "@/models/CommunityDTO";

const props = defineProps<{
  community: CommunityDTO;
}>();
</script>
