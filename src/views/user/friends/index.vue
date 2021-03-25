<template>
  <div>
    <v-row dense>
      <v-text-field
        class="mr-5 ml-5"
        name="firendName"
        label="Add friend username"
        append-icon="mdi-plus"
        v-model="userToAdd"
        @keypress.enter="addFriend"
        @click:append="addFriend"
        :loading="loading"
        :error-messages="errorMessage"
      ></v-text-field>
    </v-row>
    <v-data-iterator :items="friendshipsSend" hide-default-footer color="primary" disable-pagination no-data-text="">
      <template v-slot:default="props">
        <Frienship v-for="fr in props.items" :key="fr.id" class="mt-3" :friendship="fr" />
      </template>
    </v-data-iterator>
    <v-data-iterator
      :items="friendshipsRequests"
      hide-default-footer
      color="primary"
      disable-pagination
      no-data-text=""
    >
      <template v-slot:default="props">
        <Frienship v-for="friendship in props.items" :key="friendship.id" class="mt-3" :friendship="friendship" />
      </template>
    </v-data-iterator>
    <v-data-iterator :items="friendships" hide-default-footer disable-pagination no-data-text="">
      <template v-slot:default="props">
        <Frienship v-for="friendship in props.items" :key="friendship.id" class="mt-3" :friendship="friendship" />
      </template>
    </v-data-iterator>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { UserModule } from '../../../store/modules/user';
import Frienship from './components/friendship.vue';

@Component({
  name: 'Friends',
  components: { Frienship }
})
export default class extends Vue {
  private userToAdd = '';
  private loading = false;
  private errorMessage = '';

  get frienshopsSend() {
    return UserModule.utilisateur.friendships.filter((f) => f.status == 'pending').sort((a, b) => b.id - a.id);
  }

  get friendships() {
    return UserModule.utilisateur.friendships.filter((f) => f.status != 'pending').sort((a, b) => b.id - a.id);
  }

  get frienshopsRequest() {
    return UserModule.utilisateur.friendships_requests.filter((f) => f.status == 'pending').sort((a, b) => b.id - a.id);
  }

  private async addFriend() {
    this.errorMessage = '';
    this.loading = true;
    UserModule.AddFriend(this.userToAdd.trim())
      .then(() => {
        this.loading = false;
        this.$gtag.event('AddFriend', {
          event_category: 'Friendship',
          event_label: 'Add',
          value: `${this.userToAdd} / UserModule.username`
        });
        this.userToAdd = '';
      })
      .catch((err) => {
        this.errorMessage = err.error;
      })
      .finally(() => {
        this.loading = false;
        this.userToAdd = '';
      });
  }
}
</script>
