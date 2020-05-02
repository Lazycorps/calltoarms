<template>
  <div>
    <v-row dense>
      <v-text-field class="mr-5 ml-5" name="firendName" label="Add friend username" append-icon="mdi-plus" v-model="userToAdd" @keypress.enter="addFriend" ></v-text-field>
    </v-row>
    <v-data-iterator
      :items="friends"
      hide-default-footer
      class="ml-5 mr-5"
    >
      <template v-slot:default="props">
        <v-row>
          <span v-for="user in props.items" :key="user.username">
            <v-avatar color="red" class="mr-2">
              <img
                v-if="user.avatar"
                alt="Avatar"
                :src="user.avatar"
              >
              <span v-else class="white--text headline text-uppercase">{{ user.username.substring(0, 2) }}</span>
            </v-avatar>
            {{ user.username }}
          </span>
        </v-row>
      </template>
    </v-data-iterator>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { Game } from "@/models/Game/game";
import { Friend } from "@/models/Friend/friend";
import { UserApi } from '@/api/UserApi';

@Component({
  name: "Friends"
})
export default class extends Vue {
  private friends: Friend[] = [];
  private userToAdd: string = "";
  private loading: boolean = false;

  mounted(){
    this.getUserConnected();
  }

  private async getUserConnected(){
    try {
      let userConnected = await UserApi.getConnected();
      this.friends = userConnected.friends;
    } catch (error) {
       console.log(error);
    }
  }

  private async addFriend(){
    try {
      this.loading = true;
      let user = await UserApi.addFriend(this.userToAdd);
      this.friends = user.friends;
    } catch (error) {
      console.log(error);
    }finally{
      this.loading = false;
    }
  }
}
</script>
