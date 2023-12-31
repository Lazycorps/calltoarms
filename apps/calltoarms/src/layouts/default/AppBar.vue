<template>
  <v-app-bar flat title="Call to arms" order="1">
    <template v-slot:prepend>
      <v-app-bar-nav-icon
        v-if="mobile"
        icon="mdi-sword-cross"
      ></v-app-bar-nav-icon>
    </template>
    <template v-slot:append>
      <v-menu location="bottom" width="200px">
        <template v-slot:activator="{ props }">
          <v-btn class="text-none" stacked v-bind="props">
            <v-avatar>
              <v-icon size="40">mdi-account-circle</v-icon>
            </v-avatar>
          </v-btn>
        </template>
        <v-list>
          <v-list-item>
            <template #prepend>
              <v-icon size="40" class="mr-3">mdi-account-circle</v-icon>
              {{ auth.currentUser?.displayName ?? "" }}
            </template>
          </v-list-item>
          <v-divider class="mt-2"></v-divider>
          <v-list-item
            @click="logout"
            prepend-icon="mdi-logout"
            class="text-red"
            title="Logout"
          >
          </v-list-item>
        </v-list>
      </v-menu>
    </template>
  </v-app-bar>
</template>

<script lang="ts" setup>
import router from "@/router";
import { getAuth } from "firebase/auth";
import { useDisplay } from "vuetify";
const auth = getAuth();
const { mobile } = useDisplay();

function logout() {
  auth.signOut();
  router.push("SignIn");
}
</script>
