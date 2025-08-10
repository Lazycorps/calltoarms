<template>
  <v-container fluid>
    <!-- En-tête -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Bibliothèques de jeux</h1>
        <p class="text-body-1 text-medium-emphasis mt-2">
          Connectez vos comptes de plateformes de jeux pour synchroniser vos
          bibliothèques
        </p>
      </div>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="showConnectDialog = true"
      >
        Connecter une plateforme
      </v-btn>
    </div>

    <!-- Statistiques globales -->
    <v-row class="mb-6">
      <v-col cols="6" sm="6" md="3">
        <v-card>
          <v-card-text class="text-center">
            <v-icon size="48" color="primary" class="mb-2"
              >mdi-gamepad-variant</v-icon
            >
            <div class="text-h4 text-primary">
              {{ stats.totalConnectedPlatforms }}
            </div>
            <div class="text-body-2 text-medium-emphasis">
              Plateformes connectées
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" sm="6" md="3">
        <v-card class="stat-card" hover @click="viewAllGames">
          <v-card-text class="text-center">
            <v-icon size="48" color="success" class="mb-2">mdi-library</v-icon>
            <div class="text-h4 text-success">{{ stats.totalGames }}</div>
            <div class="text-body-2 text-medium-emphasis">Jeux total</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" sm="6" md="3">
        <v-card>
          <v-card-text class="text-center">
            <v-icon size="48" color="info" class="mb-2">mdi-clock</v-icon>
            <div class="text-h4 text-info">
              {{ formatPlaytimeInDays(totalPlaytime) }}
            </div>
            <div class="text-body-2 text-medium-emphasis">Temps total</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" sm="6" md="3">
        <v-card>
          <v-card-text class="text-center">
            <v-icon size="48" color="warning" class="mb-2">mdi-trophy</v-icon>
            <div class="text-h4 text-warning">
              {{ stats.totalAchievements }}
            </div>
            <div class="text-body-2 text-medium-emphasis">Succès</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Plateformes connectées -->
    <v-card class="mb-6">
      <v-card-title>
        <v-icon class="me-2">mdi-link</v-icon>
        Plateformes Connectées
      </v-card-title>
      <v-card-text>
        <div v-if="connectedPlatforms.length === 0" class="text-center py-8">
          <v-icon size="64" color="grey-lighten-2" class="mb-4"
            >mdi-link-off</v-icon
          >
          <div class="text-h6 text-medium-emphasis mb-2">
            Aucune plateforme connectée
          </div>
          <div class="text-body-2 text-medium-emphasis mb-4">
            Connectez vos comptes pour synchroniser vos jeux
          </div>
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            @click="showConnectDialog = true"
          >
            Connecter une plateforme
          </v-btn>
        </div>

        <v-row v-else>
          <v-col
            v-for="platform in connectedPlatforms"
            :key="platform.id"
            cols="12"
            md="6"
            lg="4"
          >
            <v-card variant="tonal">
              <v-card-text>
                <div class="d-flex align-center mb-3">
                  <v-avatar size="48" class="me-3">
                    <v-img
                      v-if="platform.avatarUrl"
                      :src="platform.avatarUrl"
                      :alt="platform.displayName || platform.username || ''"
                    />
                    <v-icon v-else size="32">{{
                      getPlatformIcon(platform.platform)
                    }}</v-icon>
                  </v-avatar>
                  <div>
                    <div class="text-h6">
                      {{ platform.displayName || platform.username }}
                    </div>
                    <div class="text-body-2 text-medium-emphasis">
                      {{ platform.platform }}
                    </div>
                  </div>
                </div>

                <v-divider class="mb-3" />

                <div class="d-flex justify-space-between text-body-2 mb-2">
                  <span>Jeux :</span>
                  <span class="font-weight-medium">{{
                    platform._count.games
                  }}</span>
                </div>

                <div class="d-flex justify-space-between text-body-2 mb-3">
                  <span>Dernière sync :</span>
                  <span class="text-medium-emphasis">
                    {{
                      platform.lastSync
                        ? formatDate(platform.lastSync)
                        : "Jamais"
                    }}
                  </span>
                </div>

                <div class="d-flex gap-2">
                  <v-btn
                    size="small"
                    color="primary"
                    variant="outlined"
                    prepend-icon="mdi-sync"
                    :loading="syncingPlatforms.has(platform.id)"
                    class="mr-4"
                    @click="syncPlatform(platform)"
                  >
                    Sync
                  </v-btn>
                  <v-btn
                    size="small"
                    color="primary"
                    prepend-icon="mdi-eye"
                    @click="viewPlatformGames(platform)"
                  >
                    Voir les jeux
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Jeux récemment joués -->
    <v-card v-if="recentlyPlayedGames" class="mb-6">
      <v-card-title>
        <div class="d-flex align-center">
          <v-icon class="me-2">mdi-clock</v-icon>
          Jeux Récemment Joués
          <v-progress-circular
            v-if="recentlyPlayedGamesStatus == 'pending'"
            indeterminate
            size="small"
            class="ml-2"
          />
        </div>
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col
            v-for="game in recentlyPlayedGames.slice(0, 6)"
            :key="game.id"
            cols="12"
            sm="6"
            md="4"
            lg="2"
          >
            <GameCardVue :game="game" />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Jeux les plus joués -->
    <v-card v-if="mostPlayedGames">
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-icon class="me-2">mdi-trophy</v-icon>
          Jeux les Plus Joués
          <v-progress-circular
            v-if="mostPlayedGamesStatus == 'pending'"
            indeterminate
            size="small"
            class="ml-2"
          />
        </div>
        <v-select
          v-model="selectedPeriod"
          :items="periodItems"
          item-title="label"
          item-value="value"
          variant="outlined"
          density="compact"
          hide-details
          style="max-width: 200px"
        />
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col
            v-for="game in mostPlayedGames.slice(0, 6)"
            :key="game.id"
            cols="12"
            sm="6"
            md="4"
            lg="2"
          >
            <GameCardVue :game="game" />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Dialog de connexion -->
    <v-dialog v-model="showConnectDialog" max-width="600">
      <v-card>
        <v-card-title>
          <v-icon class="me-2">mdi-plus</v-icon>
          Connecter une Plateforme
        </v-card-title>
        <v-card-text>
          <v-tabs v-model="selectedPlatformTab" class="mb-4">
            <v-tab value="steam">
              <v-icon class="me-2">mdi-steam</v-icon>
              Steam
            </v-tab>
            <v-tab value="playstation">
              <v-icon class="me-2">mdi-sony-playstation</v-icon>
              PlayStation
            </v-tab>
            <v-tab value="xbox">
              <v-icon class="me-2">mdi-microsoft-xbox</v-icon>
              Xbox
            </v-tab>
          </v-tabs>

          <v-tabs-window v-model="selectedPlatformTab">
            <v-tabs-window-item value="steam">
              <SteamConnector :on-success="onPlatformConnected" />
            </v-tabs-window-item>
            <v-tabs-window-item value="playstation">
              <PlayStationConnector @connected="onPlatformConnected" />
            </v-tabs-window-item>
            <v-tabs-window-item value="xbox">
              <XboxConnector @connected="onPlatformConnected" />
            </v-tabs-window-item>
          </v-tabs-window>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showConnectDialog = false">
            Fermer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog des jeux d'une plateforme -->
    <v-dialog v-model="showGamesDialog" fullscreen>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="showGamesDialog = false"
          />
          <span class="ms-2">
            {{
              selectedPlatformForGames
                ? `Jeux ${selectedPlatformForGames.platform}`
                : "Tous les jeux"
            }}
          </span>
        </v-card-title>
        <v-card-text class="pa-0">
          <PlatformGamesList
            :platform="selectedPlatformForGames?.platform"
            :account-id="selectedPlatformForGames?.id"
          />
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useGamingPlatformsStore } from "~/stores/gaming-platforms";
import type { GamingPlatform } from "@prisma/client";

// Composants
import SteamConnector from "~/components/library/SteamConnector.vue";
import PlayStationConnector from "~/components/library/PlayStationConnector.vue";
import XboxConnector from "~/components/library/XboxConnector.vue";
import PlatformGamesList from "~/components/library/PlatformGamesList.vue";
import GameCardVue from "~/components/library/GameCard.vue";
import type { GameCard } from "~~/shared/models/gameCard";
import { MostPlayedGamesPeriodes } from "~~/shared/constantes/constantes";

// Store
const gamingPlatformsStore = useGamingPlatformsStore();

// État local
const showConnectDialog = ref(false);
const showGamesDialog = ref(false);
const selectedPlatformTab = ref("steam");
const selectedPlatformForGames = ref<{
  id: number;
  platform: GamingPlatform;
} | null>(null);
const syncingPlatforms = ref(new Set<number>());

// Computed
const connectedPlatforms = computed(
  () => gamingPlatformsStore.connectedPlatforms
);
const stats = computed(() => gamingPlatformsStore.stats);
const periodItems = Object.values(MostPlayedGamesPeriodes);
const totalPlaytime = computed(() => gamingPlatformsStore.totalPlaytime);

const selectedPeriod = ref<MostPlayedGamesPeriodes>(
  MostPlayedGamesPeriodes.LAST_YEAR
);
const {
  status: mostPlayedGamesStatus,
  data: mostPlayedGames,
  refresh: refreshMostPlayedGames,
} = await useFetch<GameCard[]>("/api/user/library/mostPlayed", {
  query: computed(() => ({ period: selectedPeriod.value })),
});

const { status: recentlyPlayedGamesStatus, data: recentlyPlayedGames } =
  await useFetch<GameCard[]>("/api/user/library/recentlyPlayed");

async function syncPlatform(platform: {
  id: number;
  platform: GamingPlatform;
}) {
  try {
    syncingPlatforms.value.add(platform.id);
    await gamingPlatformsStore.syncPlatform(platform.id, platform.platform);
  } finally {
    syncingPlatforms.value.delete(platform.id);
  }
}

function viewPlatformGames(platform: { id: number; platform: GamingPlatform }) {
  selectedPlatformForGames.value = platform;
  showGamesDialog.value = true;
}

function viewAllGames() {
  selectedPlatformForGames.value = null;
  showGamesDialog.value = true;
}

function onPlatformConnected() {
  showConnectDialog.value = false;
}

// Watchers
watch(selectedPeriod, () => {
  refreshMostPlayedGames();
});

// Lifecycle
onMounted(() => {
  gamingPlatformsStore.init();
});

// Meta
definePageMeta({});

useSeoMeta({
  title: "Plateformes de Jeux",
  description:
    "Gérez vos comptes de plateformes de jeux et synchronisez vos bibliothèques",
});
</script>

<style scoped>
.recent-game-card,
.most-played-game-card {
  transition: transform 0.2s ease-in-out;
}

.recent-game-card:hover,
.most-played-game-card:hover {
  transform: translateY(-2px);
}

.playtime-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
}

.platform-icon-overlay {
  position: absolute;
  bottom: 8px;
  left: 8px;
}

.stat-card {
  cursor: pointer;
  transition: transform 0.2s ease-in-out;
}

.stat-card:hover {
  transform: translateY(-2px);
}
</style>
