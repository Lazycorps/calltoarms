<template>
  <v-dialog v-model="dialog" width="500">
    <template v-slot:activator="{ props }">
      <v-btn class="mt-4" v-bind="props" text="Create"> </v-btn>
    </template>

    <template v-slot:default="{ isActive }">
      <v-card title="Create community">
        <v-card-text>
          <v-form>
            <v-text-field label="Name" v-model="newCommunity.name" />
            <v-text-field
              label="Description"
              v-model="newCommunity.description"
            />
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" text="Cancel" @click="closeDialog"></v-btn>
          <v-btn
            color="success"
            text="Create"
            @click="createCommunity"
            :loading="loading"
          ></v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Community } from "@/models/Community";
import { FirestoreCommunity, communitiesDB } from "@/fireStore/CommunitiesDB";
import { getAuth } from "firebase/auth";

const auth = getAuth();
const dialog = ref(false);
const newCommunity = ref(new Community());
const loading = ref(false);

async function createCommunity() {
  try {
    if (!auth.currentUser?.uid) return;

    loading.value = true;
    const communityToCreate: FirestoreCommunity = {
      creatorId: auth.currentUser?.uid,
      name: newCommunity.value.name,
      name_insensitive: newCommunity.value.name.toLowerCase(),
      description: newCommunity.value.description,
    };
    await communitiesDB.addCommunity(communityToCreate);
    closeDialog();
  } finally {
    loading.value = false;
  }
}

function closeDialog() {
  dialog.value = false;
  newCommunity.value = new Community();
}
</script>
