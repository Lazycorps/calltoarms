<template>
  <v-text-field v-model="search" label="Search" :loading="searchLoading">
    <template #append-inner>
      <v-progress-circular
        v-if="searchLoading"
        indeterminate
        color="grey"
      ></v-progress-circular>
    </template>
  </v-text-field>
  <v-progress-circular
    v-if="loading"
    indeterminate
    color="grey"
  ></v-progress-circular>
  <v-row>
    <v-col
      v-for="game in games"
      :key="game.id"
      class="gameCard d-flex child-flex"
      sm="6"
      md="3"
      lg="2"
      xl="1"
      xxl="1"
      cols="6"
    >
      <v-img
        :src="`https:${game.cover.url}`"
        lazy-src="https://picsum.photos/id/11/100/60"
        class="white--text align-end"
        gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
        cover
        @click="showGame(game)"
      >
      </v-img>
    </v-col>
  </v-row>
  <v-dialog v-model="dialog" width="600px" scrim="black">
    <game-vue :game="selectedGame"></game-vue>
  </v-dialog>
</template>

<script lang="ts" setup>
import { GamesApi } from "@/api/GamesApi";
import { GameDTO } from "@/models/GameDTO";
import { onMounted, ref, watch } from "vue";
import { watchDebounced } from "@vueuse/core";
import GameVue from "./games/Game.vue";

const games = ref<GameDTO[]>([]);
const search = ref("");
const loading = ref(false);
const searchLoading = ref(false);
const dialog = ref(false);
const selectedGame = ref<GameDTO>(new GameDTO());

onMounted(() => {
  fetchGames();
});

async function fetchGames() {
  try {
    loading.value = true;
    const result = await GamesApi.getGames("");
    games.value = result;
  } finally {
    loading.value = false;
  }
}

function showGame(game: GameDTO) {
  dialog.value = true;
  selectedGame.value = game;
}

watch(search, () => {
  searchLoading.value = true;
});
watchDebounced(
  search,
  async () => {
    try {
      const result = await GamesApi.getGames(search.value);
      if (result) games.value = result;
    } finally {
      searchLoading.value = false;
    }
  },
  { debounce: 500, maxWait: 1000 }
);
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
