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
                <b>{{
                  friendship.user_username == userConnected ? friendship.friend_username : friendship.user_username
                }}</b>
              </v-row>
              <v-row dense class="overline">
                <!-- {{ friendship.id }} -->
              </v-row>
              <v-row dense>
                <span v-if="friendship.status == 'pending' && friendship.user_username != userConnected"
                  >Wants to be your comrade</span
                >
                <span v-if="friendship.status == 'pending' && friendship.user_username == userConnected"
                  >Waiting for response</span
                >
                <span v-if="friendship.status == 'accepted'">Is your comrade</span>
              </v-row>
            </v-col>
            <v-col cols="auto" v-if="friendship.user_username != userConnected">
              <v-btn
                v-if="friendship.status == 'pending'"
                outlined
                text
                rounded
                color="green"
                class="mr-5"
                @click="Accept()"
                >Accept</v-btn
              >
            </v-col>
            <v-col cols="auto" v-if="friendship.user_username != userConnected">
              <v-btn v-if="friendship.status == 'pending'" outlined text rounded color="red" @click="Decline()"
                >Decline</v-btn
              >
            </v-col>
            <v-col cols="auto" v-if="friendship.status == 'accepted'">
              <v-switch
                class="pa-0 ma-0 mr-3 v-input--reverse v-input--expand"
                v-model="friendship.subscribed"
                :hint="friendship.subscribed ? 'Notification enabled' : 'Notification disabled'"
                persistent-hint
                @change="ChangeNotification"
              >
              </v-switch>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import { UserModule } from '@/store/modules/user';
import { Friendship } from '@/models/Friend/friendship';

@Component({
  name: 'Friendship'
})
export default class extends Vue {
  @Prop()
  private friendship!: Friendship;
  private notification = false;

  get userConnected() {
    return UserModule.utilisateur.username;
  }

  private async Decline() {
    try {
      await UserModule.UpdateFriendship({
        id: this.friendship.id,
        status: 'denied',
        subscribed: false
      });
      this.friendship.status = 'denied';
      this.$gtag.event('DeclineFriend', {
        event_category: 'Friendship',
        event_label: 'decline',
        value: this.friendship.id
      });
    } catch (err) {
      console.log(err);
    }
  }

  private async Accept() {
    try {
      await UserModule.UpdateFriendship({
        id: this.friendship.id,
        status: 'accepted',
        subscribed: true
      });
      this.friendship.status = 'accepted';
      this.$gtag.event('AcceptFriend', {
        event_category: 'Friendship',
        event_label: 'accept',
        value: this.friendship.id
      });
    } catch (err) {
      console.log(err);
    }
  }

  private async ChangeNotification() {
    try {
      await UserModule.UpdateFriendship({
        id: this.friendship.id,
        status: 'accepted',
        subscribed: this.notification
      });
      this.friendship.status = 'accepted';
      this.$gtag.event('AcceptFriend', {
        event_category: 'Friendship',
        event_label: 'accept',
        value: this.friendship.id
      });
    } catch (err) {
      console.log(err);
    }
  }
}
</script>

<style lang="scss">
.v-input--reverse .v-input__slot {
  flex-direction: row-reverse;
  justify-content: flex-end;
  .v-application--is-ltr & {
    .v-input--selection-controls__input {
      margin-right: 0;
      margin-left: 70px;
    }
  }
  .v-application--is-rtl & {
    .v-input--selection-controls__input {
      margin-left: 0;
      margin-right: 70px;
    }
  }
}

// Bonus "expand" variant
.v-input--expand .v-input__slot {
  // justify-content: space-between;
  .v-label {
    display: block;
    flex: 1;
  }
}
</style>
