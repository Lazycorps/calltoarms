<template>
    <v-card class="gameCard">
      <v-img
        @click="dialog = true"
        :src="game.image_url"
        class="white--text align-end"
        gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
        height="200px"
      >
        <v-card-title v-text="game.title"></v-card-title>
      </v-img>
      <v-dialog
        v-model="dialog"
        max-width="400"
        overlay-opacity=0.5
        overlay-color="black"
      >
      <v-card>
        <v-img
          :src="game.image_url"
          class="white--text align-end"
          gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
          height="180px"
        >
          <v-card-title>
            {{game.title}}
            <span v-if="isLoggin">
              <v-chip v-if="!game.is_favorited_by_user" class="ma-2" small @click="addToLibrary">
                <v-icon left>mdi-plus</v-icon>
                Library
              </v-chip>
              <v-icon v-else left color="green" class="ml-2">mdi-check-circle</v-icon>
            </span>
          </v-card-title>
        </v-img>
        <v-card-text class="mt-5 mb-0 pb-0" >
          <v-textarea v-model="message" label="Message" outlined counter="140" auto-grow rows="1" class="mb-0 pa-0"></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="primary"
            tile 
            block 
            large
            @click="notify"
            :loading="loading"
          >
          <v-icon class="mr-3 mt-0">mdi-bugle</v-icon>
            Call to arms
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    </v-card>
</template>

<script lang="ts">
import { Component, Vue, PropSync, Prop } from "vue-property-decorator";
import { Game } from "@/models/Game/game";
import { Notification } from "@/models/Notification/notification";
import { NotificationApi } from "@/api/NotificationApi";
import { UserModule } from '../../../store/modules/user';
import { UserRegisterDTO } from '../../../models/User/UserRegister';
import { GamesLibraryApi } from "@/api/GamesLibraryApi";

@Component({
  name: "GameCard"
})
export default class extends Vue {
  @Prop()
  private game!: Game;
  private dialog: boolean = false;
  private loading: boolean = false;
  private message: string = "I'm so noob, help me please !"
  private gameOnLibrary: boolean = false;

  get isLoggin(){
    return !!UserModule.token;
  }

  private async notify(){
    try {
      this.loading = true;
      let notification = new Notification();
      notification.title = `${UserModule.username} play ${this.game.title}`;
      notification.content = this.message;
      notification.notification_type = 'wanna_play';
      notification.game_id = this.game.id;
      await NotificationApi.sendNotification(notification);
      this.dialog = false;
    } catch (error) {
      console.log(error);
    }finally{
      this.loading = false;
    }
  }

  private async addToLibrary(){
    try {
      this.loading = true;
      await GamesLibraryApi.addGame(+this.game.id, UserModule.username);
      this.game.is_favorited_by_user = true;
    } catch (error) {
      console.log(error);
    }finally{
      this.loading = false;
    }
  }
}
</script>

<style scoped>
.gameCard{
  cursor: pointer;
  transition: 0.3s;
}

.gameCard:hover {
  filter: brightness(130%);
}
</style>