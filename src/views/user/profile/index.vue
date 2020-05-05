<template>
  <v-content>
    <v-container class="fill-height" fluid>
      <v-row align="center" justify="center">
        <v-col cols="12" sm="8" md="4">
          <v-card>
            <v-card-title class="red--text">
              <h3>{{ user.username}}</h3>
            </v-card-title>
            <v-card-text>
              <v-switch value input-value="true" label="Notification"></v-switch>
            </v-card-text>
            <v-card-text v-if="errorMessage != ''">
              <v-alert type="warning">{{ errorMessage }}</v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
            <v-row align="center" justify="center">
        <v-col cols="12" sm="8" md="4">
          <v-card>
            <v-card-title class="red--text">
              <h3>{{ user.username}}</h3>
            </v-card-title>
            <v-card-text>
              <v-switch value input-value="true" label="Notification"></v-switch>
            </v-card-text>
            <v-card-text v-if="errorMessage != ''">
              <v-alert type="warning">{{ errorMessage }}</v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-content>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { UserModule } from "@/store/modules/user";
import { Utilisateur } from '../../../models/Login/utilisateur';
import { UserApi } from '../../../api/UserApi';

@Component({
  name: "UserProfile"
})
export default class extends Vue {
  private user: Utilisateur = new Utilisateur();
  public username: string = "";
  public loading: Boolean = false;
  public errorMessage: string = "";

  mounted(){
    this.loadUserConnected();
  }

  private async loadUserConnected(){
    try{
      let user: Utilisateur = await UserApi.getConnected();
    }catch(err){
      this.errorMessage = err;
    }
  }
}
</script>
