<template>
  <v-row class="mt-3" no-gutters>
    <v-col cols="12">
      <v-card>
        <v-card-text class="pa-2">
          <v-row no-gutters justify-center>
            <v-col cols="auto" dense class="mr-5">
              <v-avatar v-if="friendship.status == 'pending'" color="blue">
                <v-icon>mdi-account-clock</v-icon>
              </v-avatar>
              <v-avatar v-if="friendship.status == 'accepted'" color="green">
                <v-icon>mdi-account-check</v-icon>
              </v-avatar>
              <v-avatar v-if="friendship.status == 'denied'" color="red">
                <v-icon>mdi-account-cancel</v-icon>
              </v-avatar>
            </v-col>
            <v-col>
              <v-row dense>
                <b>{{  friendship.user_username == userConnected ? friendship.friend_username : friendship.user_username }}</b>
              </v-row>
              <v-row dense class="overline">
                <!-- {{ friendship.id }} -->
              </v-row>
              <v-row dense>
                <span v-if="friendship.status == 'pending' &&  friendship.user_username != userConnected">Wants to be your comrade</span>
                <span v-if="friendship.status == 'pending' &&  friendship.user_username == userConnected">Waiting for response</span>
                <span v-if="friendship.status == 'accepted'">Is your comrade</span>
              </v-row>
            </v-col>
            <v-col cols="auto" v-if="friendship.user_username != userConnected">
              <v-btn v-if="friendship.status == 'pending'" outlined text rounded color="green" class="mr-5" @click="Accept()">Accept</v-btn>
            </v-col>
            <v-col cols="auto" v-if="friendship.user_username != userConnected">
              <v-btn v-if="friendship.status == 'pending'" outlined text rounded color="red" @click="Decline()">Decline</v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Vue, Prop, Emit } from "vue-property-decorator";
import { Friend } from "@/models/Friend/friend";
import { UserApi } from "@/api/UserApi";
import { UserModule } from "@/store/modules/user";
import { NotificationApi } from "@/api/NotificationApi";
import { Notification } from "@/models/Notification/notification";
import { Friendship } from '@/models/Friend/friendship';

@Component({
	name: "Friendship",
})
export default class extends Vue {
	@Prop()
	private friendship!: Friendship;

  get userConnected(){
    return UserModule.utilisateur.username;
  }

  private async Decline(){
    try {
      await UserModule.UpdateFriendship({id: this.friendship.id, status: "denied", subscribed: false});
      this.friendship.status = "denied";
		} catch (err) {
			
		}
  }

  private async Accept(){
    try {
      await UserModule.UpdateFriendship({id: this.friendship.id, status: "accepted", subscribed: true});
      this.friendship.status = "accepted";
		} catch (err) {
				
		}
  }
}
</script>

<style scoped>

</style>
