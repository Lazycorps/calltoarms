<template>
  <div>
    <v-row dense>
      <v-text-field
        class="mr-5 ml-5"
        label="Filter games"
        append-icon="mdi-magnify"
        v-model="searchGame"
      ></v-text-field>
    </v-row>
    <v-data-iterator :items="games" :search="searchGame" hide-default-footer disable-pagination>
      <template v-slot:default="props">
        <v-row dense>
          <v-col v-for="game in props.items" :key="game.tilte" cols="12" xl="3" md="6" sm="12">
            <GameCard :game="game" />
          </v-col>
        </v-row>
      </template>
    </v-data-iterator>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { Game } from '@/models/Game/game';
import GameCard from './components/gameCard.vue';
import { GamesApi } from '../../api/GamesApi';

@Component({
  name: 'Home',
  components: { GameCard }
})
export default class extends Vue {
  private games: Game[] = [];
  private searchGame = '';

  mounted() {
    this.fetchGames();
  }

  private async fetchGames() {
    this.games = await GamesApi.fetchGames();
  }

  // private filterGames(items: any[], search: string) {}
}
</script>
