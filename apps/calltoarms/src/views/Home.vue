<template>
  <v-row class="ma-2">
    <v-col
      v-for="game in games"
      :key="game.id"
      class="gameCard d-flex child-flex"
      md="3"
      sm="6"
      lg="1"
      cols="3"
    >
      <v-img
        :src="`https:${game.coverUrl}`"
        class="white--text align-end"
        gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
        height="352px"
        aspect-ratio="1"
        cover
      >
      </v-img>
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import { GamesApi } from "@/api/GamesApi";
import { GameDTO } from "@/models/GameDTO";
import { onMounted, ref } from "vue";

const games = ref<GameDTO[]>([]);

onMounted(() => {
  fetchGames();
});

async function fetchGames() {
  const result = await GamesApi.getGames();
  games.value = result;
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
