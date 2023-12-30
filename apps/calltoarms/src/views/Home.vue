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

  <div class="d-flex flex-wrap">
    <template v-for="game in games" :key="game.id">
      <v-img
        :src="`https:${game.cover.url}`"
        lazy-src="https://picsum.photos/id/11/100/60"
        @click="showGame(game)"
        cover
        min-width="170px"
        max-width="200px"
        class="gameCard ma-2"
      >
      </v-img>
    </template>
  </div>
  <v-dialog v-model="dialog" width="600px" scrim="black">
    <game-vue :game="selectedGame"></game-vue>
  </v-dialog>
</template>

<script lang="ts" setup>
import { GamesApi } from "@/api/GamesApi";
import { GameDTO } from "@/models/dto/GameDTO";
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
  transform: scale(1.03);
}
</style>
