<template>
  <v-container class="ma-0 pa-0" fluid>
    <v-row >
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <h3>{{ user.username }}</h3>
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
    <v-row>
      <v-col cols="12" sm="12" md="6">
        <v-card>
          <v-card-title>
            Followers
          </v-card-title>
          <v-card-text>
            <v-data-iterator :items="user.followers" hide-default-footer class="ml-5 mr-5" no-data-text="No friends found">
              <template v-slot:default="props">
                <v-row v-for="user in props.items" :key="user.username" class="mt-3">
                  <span>
                    <v-avatar color="red" class="mr-2">
                      <img v-if="user.avatar" alt="Avatar" :src="user.avatar" />
                      <span v-else class="white--text headline text-uppercase">{{ user.username.substring(0, 2) }}</span>
                    </v-avatar>
                    {{ user.username }}
                  </span>
                </v-row>
              </template>
            </v-data-iterator>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="12" md="6">
        <v-card>
          <v-card-title>
            Friends
          </v-card-title>
          <v-card-text>
        <v-data-iterator :items="user.friends" hide-default-footer class="ml-5 mr-5" no-data-text="No friends found">
          <template v-slot:default="props">
            <v-row v-for="user in props.items" :key="user.username" class="mt-3">
              <span>
                <v-avatar color="blue" class="mr-2">
                  <img v-if="user.avatar" alt="Avatar" :src="user.avatar" />
                  <span v-else class="white--text headline text-uppercase">{{ user.username.substring(0, 2) }}</span>
                </v-avatar>
                {{ user.username }}
              </span>
            </v-row>
          </template>
        </v-data-iterator>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
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
      this.user = await UserApi.getConnected();
    }catch(err){
      this.errorMessage = err;
    }
  }
}
</script>
