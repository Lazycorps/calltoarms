<template>
  <v-snackbar v-model="snackbar" color="info" :timeout="10000">
    {{ notificationText }}
    <v-btn color="orange" @click="refreshApp">
      <v-icon>mdi-refresh</v-icon>
      {{ refreshButtonText }}
    </v-btn>
  </v-snackbar>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component({
  name: 'ServiceWorkerUpdatePopup'
})
export default class extends Vue {
  private snackbar = false;
  private refreshing = false;
  private notificationText = 'New content is available! refresh to update';
  private refreshButtonText = 'Refresh';
  private registration: ServiceWorkerRegistration | null = null;

  created() {
    // Listen for swUpdated event and display refresh notification as required.
    document.addEventListener('swUpdated', this.showRefreshUI, { once: true });
    // Refresh all open app tabs when a new service worker is installed.
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (this.refreshing) return;
      this.refreshing = true;
    });
  }

  render() {
    // Avoid warning for missing template
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private showRefreshUI(e: Event) {
    // Display a notification inviting the user to refresh/reload the app due
    // to an app update being available.
    // The new service worker is installed, but not yet active.
    // Store the ServiceWorkerRegistration instance for later use.
    //TODO Uncomment to display notification refresh button
    // const h = this.$createElement;
    // this.registration = (e as CustomEvent).detail;
    // this.snackbar = true;
  }

  private refreshApp() {
    // Protect against missing registration.waiting.
    if (!this.registration || !this.registration.waiting) return;
    this.registration.waiting.postMessage('skipWaiting');
  }
}
</script>

<style lang="scss" scoped>
.sw-update-popup > button {
  margin-top: 0.5em;
  padding: 0.25em 1.5em;
}
</style>
