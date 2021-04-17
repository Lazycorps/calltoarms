<template>
  <v-app id="inspire">
    <v-navigation-drawer
      v-model="drawer"
      :mini-variant.sync="mini"
      v-if="$vuetify.breakpoint.mdAndUp && isLogin"
      mobile-break-point="960"
      clipped
      app
    >
      <v-list>
        <v-list-item>
          <v-list-item-action @click="mini = !mini">
            <v-icon v-if="mini">mdi-arrow-expand-right</v-icon>
            <v-icon v-if="!mini">mdi-arrow-expand-left</v-icon>
          </v-list-item-action>
        </v-list-item>
        <v-divider class="ma-1"></v-divider>
        <v-list-item value="true" v-for="(item, i) in menu" :key="i" :to="item.link">
          <v-list-item-action>
            <v-icon v-html="item.icon"></v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title v-text="item.title"></v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-app-bar app color="primary" dark clipped-left>
      <v-toolbar-title class="d-flex justify-start align-center">
        <v-btn icon to="/" large class="mr-2"><v-icon large>mdi-sword-cross</v-icon></v-btn>
        <h2>Call To Arms</h2>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn text color="white" class="mr-2" v-if="!token" @click="logout">
        <b>Sign-in</b>
      </v-btn>
      <b class="mr-2" v-if="$vuetify.breakpoint.mdAndUp && isLogin">{{ username }}</b>
      <v-menu bottom offset-y v-if="token">
        <template v-slot:activator="{ on }">
          <v-badge
            :value.sync="updateAvailable"
            color="green"
            icon="mdi-arrow-up-thick"
            overlap
            offset-y="18"
            offset-x="18"
          >
            <v-btn icon color="white" v-on="on" class="pa-0 ma-0">
              <v-avatar color="grey darken-2" size="36" class="pa-0 ma-0">
                <v-icon size="36" color="grey lighten-1">mdi-account-circle</v-icon>
              </v-avatar>
            </v-btn>
          </v-badge>
        </template>
        <v-list>
          <v-list-item v-if="updateAvailable" @click="refreshApp">
            <v-list-item-title
              ><v-icon class="mr-2" color="green">mdi-arrow-up-bold-circle-outline</v-icon> Update
              app</v-list-item-title
            >
          </v-list-item>
          <v-list-item to="/user/profile">
            <v-list-item-title><v-icon class="mr-2">mdi-account</v-icon> Profile</v-list-item-title>
          </v-list-item>
          <v-list-item to="/help">
            <v-list-item-title><v-icon class="mr-2">mdi-help-circle</v-icon> Help</v-list-item-title>
          </v-list-item>
          <v-divider></v-divider>
          <v-list-item @click="logout">
            <v-list-item-title><v-icon class="mr-2">mdi-logout</v-icon> Logout</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>
    <v-content>
      <v-container fluid>
        <v-alert v-if="!pushEnabled" border="left" text outlined prominent type="warning">
          <v-row align="center">
            <v-col class="grow"
              >Oh noo, i play bitch can't work correctly without notifications enabled
              <v-icon color="warning">mdi-emoticon-cry-outline</v-icon>, try a refresh ?</v-col
            >
            <v-col class="shrink">
              <v-btn to="/help" color="primary"><v-icon left>mdi-help-circle</v-icon>Help</v-btn>
            </v-col>
          </v-row>
        </v-alert>
        <app-main />
      </v-container>
    </v-content>
    <v-bottom-navigation v-if="$vuetify.breakpoint.smAndDown && isLogin" color="primary" grow app>
      <v-btn to="/games">
        <span>Games</span>
        <v-icon>mdi-gamepad-square</v-icon>
      </v-btn>
      <v-btn to="/user/friends">
        <span>Comrades</span>
        <v-icon>mdi-account-multiple</v-icon>
      </v-btn>
      <v-btn to="/user/notifications" @click="refreshUser">
        <span>Calls</span>
        <v-badge :value="newNotification" color="blue" overlap dot>
          <v-icon>mdi-bell</v-icon>
        </v-badge>
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Watch } from 'vue-property-decorator';
import { AppMain } from './components';
import { UserModule } from '@/store/modules/user';
import { AppModule } from '@/store/modules/app';

@Component({
  name: 'Layout',
  components: {
    AppMain
  }
})
export default class extends Vue {
  private drawer = true;
  private mini = true;
  private source = '';
  private menu: { title: string; icon: string; link: string }[] = [];
  private bottom!: boolean;
  private refreshing = false;
  private refreshButtonText = 'Refresh';
  private registration: ServiceWorkerRegistration | null = null;
  private updateAvailable = false;

  get pushEnabled() {
    return AppModule.pushNotificationEnabled;
  }

  get isAdmin(): boolean {
    return !!UserModule.isAdmin;
  }

  get isLogin(): boolean {
    return !!UserModule.token;
  }

  get newNotification() {
    return AppModule.newNotification;
  }

  created() {
    // Listen for swUpdated event and display refresh notification as required.
    document.addEventListener('swUpdated', this.showRefreshUI, { once: true });
    // Refresh all open app tabs when a new service worker is installed.
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (this.refreshing) return;
      this.refreshing = true;
      window.location.reload();
    });
  }

  mounted() {
    this.routeChanged();
  }

  @Watch('isAdmin')
  @Watch('isLogin')
  private routeChanged() {
    this.menu = [];
    this.menu.push({
      title: 'Games',
      icon: 'mdi-gamepad-square',
      link: '/games'
    });
    this.menu.push({
      title: 'Comrades',
      icon: 'mdi-account-multiple',
      link: '/user/friends'
    });
    this.menu.push({
      title: 'Calls',
      icon: 'mdi-bell',
      link: '/user/notifications'
    });
    if (this.isAdmin) {
      this.menu.push({
        title: 'CRUD games',
        icon: 'mdi-gamepad-round-outline',
        link: '/admin/games'
      });
    }
  }

  get username() {
    return UserModule.username;
  }

  get token() {
    return UserModule.token;
  }

  private async refreshUser() {
    await UserModule.LoadUtilisateur();
    AppModule.NewNotificationReceived(false);
  }

  private logout() {
    UserModule.Logout();
    this.$router.push('/login');
  }

  private goHome() {
    this.$router.push('/');
  }

  private showRefreshUI(e: Event) {
    // Display a notification inviting the user to refresh/reload the app due
    // to an app update being available.
    // The new service worker is installed, but not yet active.
    // Store the ServiceWorkerRegistration instance for later use.
    this.registration = (e as CustomEvent).detail;
    this.updateAvailable = true;
  }

  private refreshApp() {
    // Protect against missing registration.waiting.
    console.log(this.registration);
    if (!this.registration || !this.registration.waiting) return;
    this.registration.waiting.postMessage({ type: 'skipWaiting' });
  }
}
</script>

<style>
.v-item-group.v-bottom-navigation .v-btn {
  height: inherit !important;
}
</style>
