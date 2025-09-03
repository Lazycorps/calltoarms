<template>
  <v-app-bar title="Call to arms" flat order="1">
    <template #prepend>
      <v-app-bar-nav-icon v-if="mobile" icon="mdi-sword-cross" to="/" />
    </template>
    <template #append>
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
              v-if="notificationPermission != 'denied'"
              class="d-flex justify-end"
            >
              <v-btn color="primary" @click="enablePermission()"
                >Enable notifications</v-btn
              >
            </v-card-text>
          </v-card>
        </v-dialog>
      </v-btn>
      <v-menu location="bottom" width="200px">
        <template #activator="{ props }">
          <h3>{{ user.user?.username }}</h3>
          <v-btn class="text-none" stacked v-bind="props">
            <v-avatar>
              <v-img :src="user.user?.avatarUrl || '/avatar_placeholder.png'" />
            </v-avatar>
          </v-btn>
        </template>
        <v-list>
          <div v-if="user.user">
            <v-list-item to="/user/profile">
              <template #prepend>
                <v-icon size="40" class="mr-3">mdi-account</v-icon>
                Profil
              </template>
            </v-list-item>
            <v-divider class="mt-2" />
            <v-list-item
              prepend-icon="mdi-logout"
              class="text-red"
              title="Logout"
              @click="logout"
            />
          </div>
          <v-list-item
            v-else
            prepend-icon="mdi-login"
            class="text-green"
            title="login"
            @click="login"
          />
        </v-list>
      </v-menu>
    </template>
  </v-app-bar>
</template>

<script lang="ts" setup>
import { useDisplay } from "vuetify";
import { usePermission } from "@vueuse/core";
import { useFirebaseMessaging } from "~/composables/firebase/useFirebaseMessaging";

const user = useUserStore();
const { mobile } = useDisplay();
const notificationPermission = usePermission("notifications");

const avatar = ref('');

async function enablePermission() {
  const { requestNotificationPermission } = useFirebaseMessaging();
  if (user.user?.id) await requestNotificationPermission(user.user?.id);
}

function logout() {
  user.logout();
}

function login() {
  const router = useRouter();
  router.push("login");
}
</script>
