<template>
  <v-app>
    <v-app-bar
      app
      color="primary"
      dark
    >
      <div class="d-flex align-center">
        <v-icon x-large class="mr-5">mdi-gamepad-variant</v-icon>
        <h2>I Play <b>BITCH</b></h2>
      </div>

      <v-spacer></v-spacer>
      <v-btn tile color="blue" @click="login()">Sign-in</v-btn>
    </v-app-bar>

    <v-content>
      <router-view />
    </v-content>
  </v-app>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component({
  name: "Home"
})
export default class extends Vue {
  private login(){
    this.$router.push('/login');
  }
}
</script>
