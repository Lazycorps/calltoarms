<template>
  <v-app-bar title="Call to arms" flat order="1">
    <template v-slot:prepend>
      <v-app-bar-nav-icon
        v-if="mobile"
        icon="mdi-sword-cross"
      ></v-app-bar-nav-icon>
    </template>
    <template v-slot:append>
      <v-btn v-if="notificationPermission != 'granted'" color="orange">
        <v-icon size="35">mdi-alert-outline</v-icon>
        <v-dialog activator="parent" width="auto">
          <v-card>
            <v-card-text class="ma-0">
              <v-alert type="warning" variant="tonal">
                Notifications must be enabled on your device.
              </v-alert>
            </v-card-text>
            <v-card-text v-if="notificationPermission == 'denied'" class="ma-0">
              <v-alert type="error" variant="tonal">
                Notifications are blocked on your device. Please manually
                authorize notifications.
              </v-alert>
            </v-card-text>
            <v-card-text
              class="d-flex justify-end"
              v-if="notificationPermission != 'denied'"
            >
              <v-btn color="primary" @click="enablePermission()"
                >Enable notifications</v-btn
              >
            </v-card-text>
          </v-card>
        </v-dialog>
      </v-btn>
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
import { usePermission } from "@vueuse/core";
import { useWebNotification } from "@/plugins/firebase";

const auth = getAuth();
const { mobile } = useDisplay();
const notificationPermission = usePermission("notifications");
const webNotification = useWebNotification();

async function enablePermission() {
  await webNotification.enableWebNotification();
}

function logout() {
  auth.signOut();
  router.push("SignIn");
}
</script>
