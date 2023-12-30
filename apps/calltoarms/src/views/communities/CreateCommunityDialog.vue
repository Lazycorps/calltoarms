<template>
  <v-dialog v-model="dialog" width="500">
    <template v-slot:activator="{ props }">
      <v-btn v-bind="props" text="Create"> </v-btn>
    </template>

    <template v-slot:default="{ isActive }">
      <v-card title="Create community">
        <v-card-text>
          <v-form>
            <v-text-field label="Name" v-model="newCommunity.name" />
            <v-text-field label="Description" v-model="newCommunity.description" />
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" text="Cancel" @click="closeDialog"></v-btn>
          <v-btn
            color="success"
            text="Create"
            @click="isActive.value = false"
          ></v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { CommunityDTO } from "@/models/CommunityDTO";

const dialog = ref(false);
const newCommunity = reactive(new CommunityDTO());

function closeDialog() {
  dialog.value = false;
  newCommunity.value = new CommunityDTO();
}
</script>
