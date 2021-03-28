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
    <v-dialog v-model="dialog" max-width="450" overlay-opacity="0.5" overlay-color="black">
      <v-card>
        <v-img
          :src="game.image_url"
          class="white--text align-end"
          gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
          height="180px"
        >
          <v-card-title>
            {{ game.title }}
            <span v-if="isLoggin">
              <v-chip v-if="!gameOnLibrary" class="ma-2" small @click="addToLibrary">
                <v-icon left>mdi-plus</v-icon>
                Library
              </v-chip>
              <v-icon v-else left color="green" class="ml-2">mdi-check-circle</v-icon>
            </span>
          </v-card-title>
        </v-img>
        <v-card-text class="pa-2 mt-4">
          <v-textarea
            v-model="message"
            label="Message"
            outlined
            counter="140"
            auto-grow
            rows="1"
            class="mb-0 pa-0"
          ></v-textarea>
          <v-select
            label="Notify"
            v-model="friendsSelect"
            :items="friends"
            multiple
            hide-selected
            item-text="friend_username"
            chips
            deletable-chips
            placeholder="All comrades"
            hide-details
            return-object
            outlined
          ></v-select>
        </v-card-text>
        <v-card-actions>
          <v-btn v-if="isLoggin" color="primary" tile block large @click="notify" :loading="loading">
            <v-icon class="mr-3 mt-0">mdi-bugle</v-icon> Call To arms
          </v-btn>
          <v-btn v-else color="primary" tile block large to="/login">
            <v-icon class="mr-3 mt-0">mdi-login</v-icon>Need login to call
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import { Game } from '@/models/Game/game';
import { Notification } from '@/models/Notification/notification';
import { NotificationApi } from '@/api/NotificationApi';
import { UserModule } from '@/store/modules/user';
import { Friendship } from '@/models/Friend/friendship';

@Component({
  name: 'GameCard'
})
export default class extends Vue {
  @Prop()
  private game!: Game;
  private dialog = false;
  private loading = false;
  private message = "I'm so noob, help me please !";
  private friendsSelect: Friendship[] = [];

  get isLoggin() {
    return !!UserModule.token;
  }

  get gameOnLibrary(): boolean {
    return UserModule.utilisateur?.games.some((g) => g.id == this.game.id);
  }

  get friends(): Friendship[] {
    return UserModule.utilisateur.friendships
      .filter((f) => f.status != 'pending')
      .sort((one, two) => (two.friend_username > one.friend_username ? -1 : 1));
  }

  private async notify() {
    try {
      this.loading = true;
      const notification = new Notification();
      notification.title = `${UserModule.username} play ${this.game.title}`;
      notification.content = this.message;
      notification.notification_type = 'wanna_play';
      notification.game_id = this.game.id;
      notification.validity = 20;
      console.log(this.friendsSelect);
      if (this.friendsSelect && this.friendsSelect.length > 0)
        notification.user_ids = [...this.friendsSelect.map((f) => f.friend_id)];
      await NotificationApi.sendNotification(notification);
      this.dialog = false;
      this.$gtag.event('CallToArms', {
        event_category: 'Notify',
        event_label: 'Game',
        value: notification.game_id
      });
    } catch (error) {
      console.log(error);
    } finally {
      this.loading = false;
    }
  }

  private async addToLibrary() {
    try {
      this.loading = true;
      await UserModule.AddGameLibrary(this.game);
      this.game.is_favorited_by_user = true;
      this.$gtag.event('AddGame', {
        event_category: 'AddLibrary',
        event_label: 'Game',
        value: this.game.id
      });
    } catch (error) {
      console.log(error);
    } finally {
      this.loading = false;
    }
  }
}
</script>

<style scoped>
.gameCard {
  cursor: pointer;
  transition: 0.3s;
}

.gameCard:hover {
  filter: brightness(130%);
}
</style>
