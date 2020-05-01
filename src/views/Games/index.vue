<template>
  <v-container fluid>
    <v-row dense>
      <v-text-field class="mr-5 ml-5" label="Filter games" append-icon="mdi-magnify" v-model="searchGame" ></v-text-field>
    </v-row>
    <v-data-iterator
      :items="games"
      :search="searchGame"
      hide-default-footer
    >
      <template v-slot:default="props">
        <v-row dense>
          <v-col
            v-for="game in props.items"
            :key="game.name"
            cols="12"
            xl="3"
            md="6"
            sm="12"
          >
            <GameCard :game="game"/>
          </v-col>
        </v-row>
      </template>
    </v-data-iterator>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { Game } from "@/models/Game/game";
import GameCard from "./components/gameCard.vue";
import { UserApi } from '../../api/UserApi';

@Component({
  name: "Games",
  components: { GameCard }
})
export default class extends Vue {
  private games: Game[] = [];

  private searchGame: string = "";

  mounted(){
    let valorant = new Game({name: "Valorant", img:"https://files.cults3d.com/uploaders/15024335/illustration-file/a86d53e4-2bd9-4a8f-9550-986686c3131a/gi0mAjIh_400x400.png", thumbnail: ""});
    let warzone = new Game({name: "Warzone", img:"https://www.jvfrance.com/wp-content/uploads/2020/03/Call-of-Duty-Warzone-890x459.jpg", thumbnail: ""});
    let ageof = new Game({name: "AEO2 DE", img:"https://img.gaming.gentside.com/article/1280/age-of-empires/age-of-empire-2-definitive-edition-date-de-sortie-trailer-gameplay-et-news_24334279f4729d7fb472194843e926af3b8c44e1.jpg", thumbnail: ""});
    let cs = new Game({name: "CSGO", img:"https://steamcdn-a.akamaihd.net/steam/subs/54029/header_586x192.jpg", thumbnail: ""});
    this.games.push(valorant);
    this.games.push(warzone);
    this.games.push(ageof);
    this.games.push(cs);
  }
}
</script>
