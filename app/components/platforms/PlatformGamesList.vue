<template>
  <div class="platform-games-list">
    <!-- En-tête avec filtres -->
    <v-card class="mb-4">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" :md="props.platform ? 4 : 3">
            <v-text-field
              v-model="searchQuery"
              label="Rechercher un jeu"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              clearable
              @input="debouncedSearch"
            />
          </v-col>
          <v-col v-if="!props.platform" cols="12" md="2">
            <v-select
              v-model="selectedPlatform"
              label="Plateforme"
              :items="platformOptions"
              variant="outlined"
              density="compact"
              clearable
              @update:model-value="loadGames"
            />
          </v-col>
          <v-col cols="12" :md="props.platform ? 3 : 2">
            <v-select
              v-model="sortBy"
              label="Trier par"
              :items="sortOptions"
              variant="outlined"
              density="compact"
              @update:model-value="loadGames"
            />
          </v-col>
          <v-col cols="12" :md="props.platform ? 2 : 2">
            <v-select
              v-model="sortOrder"
              label="Ordre"
              :items="orderOptions"
              variant="outlined"
              density="compact"
              @update:model-value="loadGames"
            />
          </v-col>
          <v-col cols="12" :md="3" class="d-flex justify-end">
            <v-btn
              v-if="props.platform"
              color="primary"
              prepend-icon="mdi-sync"
              :loading="syncing"
              @click="syncGames"
            >
              Synchroniser
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Statistiques -->
    <v-row class="mb-4">
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text class="text-center">
            <div class="text-h4 text-primary">{{ games.length }}</div>
            <div class="text-body-2 text-medium-emphasis">Jeux</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text class="text-center">
            <div class="text-h4 text-success">
              {{ formatPlaytime(totalPlaytime) }}
            </div>
            <div class="text-body-2 text-medium-emphasis">Temps total</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text class="text-center">
            <div class="text-h4 text-info">{{ recentGamesCount }}</div>
            <div class="text-body-2 text-medium-emphasis">Joués récemment</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text class="text-center">
            <div class="text-h4 text-warning">{{ totalAchievements }}</div>
            <div class="text-body-2 text-medium-emphasis">Succès</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Liste des jeux -->
    <v-card>
      <v-card-title>
        <v-icon class="me-2">mdi-gamepad-variant</v-icon>
        Mes Jeux {{ platform }}
      </v-card-title>

      <v-card-text>
        <v-data-iterator
          :items="games"
          :loading="loading"
          :items-per-page="itemsPerPage"
          :page="page"
          hide-default-footer
        >
          <template #default="{ items }">
            <v-row>
              <v-col
                v-for="game in items"
                :key="game.raw.id"
                cols="12"
                sm="6"
                md="4"
                lg="3"
              >
                <v-card
                  class="game-card"
                  hover
                  @click="viewGameDetails(game.raw)"
                >
                  <div class="game-image-container">
                    <v-img
                      :src="game.raw.coverUrl || ''"
                      :alt="game.raw.name"
                      height="120"
                      cover
                      class="game-image"
                    >
                      <template #placeholder>
                        <div
                          class="d-flex align-center justify-center fill-height"
                        >
                          <v-icon size="48" color="grey-lighten-2"
                            >mdi-gamepad-variant</v-icon
                          >
                        </div>
                      </template>
                    </v-img>

                    <div class="game-overlay">
                      <v-chip
                        v-if="game.raw.playtimeTotal > 0"
                        size="small"
                        color="primary"
                        class="playtime-chip"
                      >
                        {{ formatPlaytime(game.raw.playtimeTotal) }}
                      </v-chip>
                    </div>
                  </div>

                  <v-card-title class="text-subtitle-1 pa-3">
                    {{ game.raw.name }}
                  </v-card-title>

                  <v-card-text class="pt-0 pb-2">
                    <div
                      class="d-flex align-center justify-space-between text-caption"
                    >
                      <span
                        v-if="game.raw.lastPlayed"
                        class="text-medium-emphasis"
                      >
                        <v-icon size="small" class="me-1"
                          >mdi-clock-outline</v-icon
                        >
                        {{ formatDate(game.raw.lastPlayed) }}
                      </span>
                      <span
                        v-if="game.raw._count.achievements > 0"
                        class="text-medium-emphasis"
                      >
                        <v-icon size="small" class="me-1">mdi-trophy</v-icon>
                        {{ game.raw._count.achievements }} succès
                      </span>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </template>

          <template #no-data>
            <div class="text-center py-8">
              <v-icon size="64" color="grey-lighten-2" class="mb-4"
                >mdi-gamepad-variant-outline</v-icon
              >
              <div class="text-h6 text-medium-emphasis mb-2">
                Aucun jeu trouvé
              </div>
              <div class="text-body-2 text-medium-emphasis">
                {{
                  searchQuery
                    ? "Essayez de modifier votre recherche"
                    : "Synchronisez vos jeux pour les voir apparaître ici"
                }}
              </div>
            </div>
          </template>
        </v-data-iterator>

        <!-- Pagination -->
        <div v-if="games.length > 0" class="d-flex justify-center mt-4">
          <v-pagination
            v-model="page"
            :length="Math.ceil(games.length / itemsPerPage)"
            :total-visible="7"
          />
        </div>
      </v-card-text>
    </v-card>
  </div>

  <!-- Dialog des détails du jeu -->
  <GameDetailsDialog
    v-model="showGameDetailsDialog"
    :game-id="selectedGameId"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useGamingPlatformsStore } from "~/stores/gaming-platforms";
import type { GamingPlatform } from "@prisma/client";
import GameDetailsDialog from "~/components/game/GameDetailsDialog.vue";

// Props
interface Props {
  platform?: GamingPlatform;
  accountId?: number;
}

const props = defineProps<Props>();

// Store
const gamingPlatformsStore = useGamingPlatformsStore();

// État local
const searchQuery = ref("");
const sortBy = ref("name");
const sortOrder = ref("asc");
const page = ref(1);
const itemsPerPage = ref(12);
const syncing = ref(false);
const selectedPlatform = ref<GamingPlatform | null>(null);
const showGameDetailsDialog = ref(false);
const selectedGameId = ref<number | null>(null);

// Options de tri
const sortOptions = [
  { title: "Nom", value: "name" },
  { title: "Temps de jeu", value: "playtime" },
  { title: "Dernière fois joué", value: "lastPlayed" },
];

const orderOptions = [
  { title: "Croissant", value: "asc" },
  { title: "Décroissant", value: "desc" },
];

const platformOptions = computed(() => {
  const platforms = [
    { title: "Toutes les plateformes", value: null },
    { title: "Steam", value: "STEAM" },
    { title: "PlayStation", value: "PLAYSTATION" },
  ];

  // Si on est déjà sur une plateforme spécifique, on ne montre pas le filtre
  if (props.platform) {
    return [];
  }

  return platforms;
});

// Computed
const games = computed(() => gamingPlatformsStore.allGames);
const loading = computed(() => gamingPlatformsStore.loading);

const totalPlaytime = computed(() => {
  return games.value.reduce((total, game) => total + game.playtimeTotal, 0);
});

const recentGamesCount = computed(() => {
  return games.value.filter(
    (game) => game.playtimeRecent && game.playtimeRecent > 0
  ).length;
});

const totalAchievements = computed(() => {
  return games.value.reduce(
    (total, game) => total + game._count.achievements,
    0
  );
});

// Méthodes
let searchTimeout: NodeJS.Timeout;

function debouncedSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    loadGames();
  }, 500);
}

async function loadGames() {
  await gamingPlatformsStore.loadAllGames({
    platform: props.platform || selectedPlatform.value || undefined,
    search: searchQuery.value || undefined,
    sortBy: sortBy.value as "name" | "playtime" | "lastPlayed",
    sortOrder: sortOrder.value as "asc" | "desc",
    limit: 100, // Charger plus de jeux pour la pagination côté client
  });
}

async function syncGames() {
  if (!props.accountId || !props.platform) return;

  try {
    syncing.value = true;
    await gamingPlatformsStore.syncPlatform(props.accountId, props.platform);
  } finally {
    syncing.value = false;
  }
}

function formatPlaytime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}j ${remainingHours}h` : `${days}j`;
}

function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function viewGameDetails(game: {
  id: number;
  name: string;
  playtimeTotal: number;
  _count: { achievements: number };
}) {
  console.log("Opening game details for:", { id: game.id, name: game.name });
  selectedGameId.value = game.id;
  showGameDetailsDialog.value = true;
}

// Lifecycle
onMounted(() => {
  loadGames();
});

// Watchers
watch(
  () => props.accountId,
  () => {
    if (props.accountId) {
      loadGames();
    }
  }
);
</script>

<style scoped>
.platform-games-list {
  width: 100%;
}

.game-card {
  height: 100%;
  transition: transform 0.2s ease-in-out;
}

.game-card:hover {
  transform: translateY(-2px);
}

.game-image-container {
  position: relative;
  overflow: hidden;
}

.game-image {
  transition: transform 0.3s ease-in-out;
}

.game-card:hover .game-image {
  transform: scale(1.05);
}

.game-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
}

.playtime-chip {
  backdrop-filter: blur(4px);
  background-color: rgba(var(--v-theme-primary), 0.8) !important;
  color: white;
}
</style>
