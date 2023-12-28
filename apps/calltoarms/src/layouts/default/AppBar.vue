<template>
  <v-app-bar flat>
    <v-app-bar-title>
      <v-icon size="40" icon="mdi-sword-cross" />
      Call to arms
    </v-app-bar-title>
    <v-spacer></v-spacer>
    <div class="mr-3" style="font-size: 25px">
      {{ auth.currentUser?.displayName }}
    </div>
    <v-menu location="bottom">
      <template v-slot:activator="{ props }">
        <v-btn class="text-none" stacked v-bind="props">
          <v-avatar>
            <v-icon size="40">mdi-account</v-icon>
          </v-avatar>
        </v-btn>
      </template>
      <v-list>
        <v-list-item @click="logout">
          <v-list-item-title class="text-red">Logout</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-app-bar>
</template>

<script lang="ts" setup>
import router from "@/router";
import { getAuth } from "firebase/auth";

const auth = getAuth();

function logout() {
  auth.signOut();
  router.push("SignIn");
}
</script>
