<template>
  <v-container fluid>
    <v-data-table :headers="headers" :items="games" class="elevation-1">
      <template v-slot:top>
        <v-toolbar flat>
          <v-toolbar-title>
            Games
          </v-toolbar-title>
          <v-divider class="mx-4" inset vertical></v-divider>
          <v-btn icon color="primary" @click="RefreshGames"><v-icon>mdi-refresh</v-icon></v-btn>
          <v-spacer></v-spacer>
          <v-btn color="primary" dark class="mb-2" @click.stop="addGame">Add games</v-btn>
        </v-toolbar>
      </template>
      <template v-slot:[`item.actions`]="{ item }">
        <v-icon small class="mr-2" @click="editGame(item)">
          mdi-pencil
        </v-icon>
        <v-icon small @click="deleteGame(item)">
          mdi-delete
        </v-icon>
      </template>
    </v-data-table>
    <v-snackbar v-model="snackbar" :timeout="snackbarTimeout" :color="snackbarColor">
      <v-icon dark class="mr-3">{{ snackbarColor == 'error' ? 'mdi-delete' : 'mdi-check' }}</v-icon>
      <span v-html="snackbarMessage"></span>
      <v-btn icon dark @click="snackbar = false"><v-icon>mdi-close</v-icon></v-btn>
    </v-snackbar>
    <GameVue ref="gameComponent"></GameVue>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue, Ref } from 'vue-property-decorator';
import { GameCrud } from '@/models/Game/gameCrud';
import { GamesApi } from '@/api/GamesApi';
import GameVue from './components/game.vue';

@Component({
  components: { GameVue }
})
export default class GamesCrud extends Vue {
  @Ref() gameComponent!: GameVue;

  private games: GameCrud[] = [];
  private headers = [
    { text: 'Id', value: 'id' },
    { text: 'Title', value: 'title' },
    { text: 'Img', value: 'image_url' },
    { text: 'Created', value: 'created_at' },
    { text: 'Updated', value: 'updated_at' },
    { text: 'Actions', value: 'actions', sortable: false }
  ];

  mounted() {
    this.RefreshGames();
  }

  private async RefreshGames() {
    this.games = await GamesApi.fetchGamesCrud();
  }

  private addGame() {
    this.gameComponent?.Open().then((game) => {
      this.games.push(game);
      this.notify(`${game.title} add success`, 'green');
    });
  }

  private editGame(gameEdited: GameCrud) {
    this.gameComponent?.Open(gameEdited).then((game) => {
      Vue.set(
        this.games,
        this.games.findIndex((e) => e == gameEdited),
        game
      );
      this.notify(`${game.title} update success`, 'green');
    });
  }

  private async deleteGame(editedItem: GameCrud) {
    try {
      await GamesApi.deleteGame(editedItem.id);
      this.games.splice(this.games.indexOf(editedItem), 1);
      this.notify(`${editedItem.title} remove success`, 'orange');
    } catch (error) {
      console.log(error);
    }
  }

  private snackbar = false;
  private snackbarTimeout = 5000;
  private snackbarMessage = '';
  private snackbarColor = '';

  private notify(message: string, color: string) {
    this.snackbarColor = color;
    this.snackbarMessage = message;
    this.snackbar = true;
  }
}
</script>

<style scoped></style>
