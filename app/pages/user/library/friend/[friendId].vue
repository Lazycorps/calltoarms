<template>
  <v-container fluid>
    <!-- En-tête avec informations de l'ami -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <div class="d-flex align-center mb-2">
          <v-btn
            icon="mdi-arrow-left"
            variant="text"
            class="mr-2"
            @click="$router.back()"
          />
          <v-avatar color="primary" class="text-uppercase mr-3">
            {{ (friendData?.friendInfo?.name || "").charAt(0) }}
          </v-avatar>
          <div>
            <h1 class="text-h4 font-weight-bold">
              Bibliothèque de {{ friendData?.friendInfo?.name }}
            </h1>
            <p class="text-body-1 text-medium-emphasis">
              @{{ friendData?.friendInfo?.slug }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Message de chargement -->
    <div v-if="pending" class="text-center py-8">
      <v-progress-circular indeterminate size="64" />
      <div class="text-h6 mt-4">Chargement de la bibliothèque...</div>
    </div>

    <!-- Message d'erreur -->
    <div v-else-if="error" class="text-center py-8">
      <v-icon size="64" color="error" class="mb-4">mdi-alert-circle</v-icon>
      <div class="text-h6 text-error mb-2">Erreur</div>
      <div class="text-body-1 text-medium-emphasis mb-4">
        {{ error.data?.message || "Impossible de charger la bibliothèque" }}
      </div>
      <v-btn color="primary" @click="refresh()">Réessayer</v-btn>
    </div>

    <!-- Contenu principal -->
    <div v-else-if="friendData">
      <!-- Statistiques globales -->
      <v-row class="mb-6">
        <v-col cols="6" sm="6" md="3">
          <v-card>
            <v-card-text class="text-center">
              <v-icon size="48" color="primary" class="mb-2"
                >mdi-gamepad-variant</v-icon
              >
              <div class="text-h4 text-primary">
                {{ friendData.stats.totalConnectedPlatforms }}
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
              <v-icon size="48" color="success" class="mb-2"
                >mdi-library</v-icon
              >
              <div class="text-h4 text-success">
                {{ friendData.stats.totalGames }}
              </div>
              <div class="text-body-2 text-medium-emphasis">Jeux total</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6" sm="6" md="3">
          <v-card>
            <v-card-text class="text-center">
              <v-icon size="48" color="info" class="mb-2">mdi-clock</v-icon>
              <div class="text-h4 text-info">
                {{ formatPlaytimeInDays(friendData.stats.totalPlaytime) }}
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
                {{ friendData.stats.recentlyPlayed }}
              </div>
              <div class="text-body-2 text-medium-emphasis">Jeux récents</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Plateformes connectées (lecture seule) -->
      <v-card class="mb-6">
        <v-card-title>
          <v-icon class="me-2">mdi-link</v-icon>
          Plateformes Connectées
        </v-card-title>
        <v-card-text>
          <div
            v-if="friendData.connectedPlatforms.length === 0"
            class="text-center py-8"
          >
            <v-icon size="64" color="grey-lighten-2" class="mb-4"
              >mdi-link-off</v-icon
            >
            <div class="text-h6 text-medium-emphasis mb-2">
              Aucune plateforme connectée
            </div>
            <div class="text-body-2 text-medium-emphasis">
              Cet utilisateur n'a connecté aucune plateforme
            </div>
          </div>

          <v-row v-else>
            <v-col
              v-for="platform in friendData.connectedPlatforms"
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
      <v-card v-if="recentlyPlayedGames.length > 0" class="mb-6">
        <v-card-title>
          <v-icon class="me-2">mdi-clock</v-icon>
          Jeux Récemment Joués
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
              <GameCardVue :game="game" :read-only="true" />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Jeux les plus joués -->
      <v-card v-if="mostPlayedGames && mostPlayedGames.length > 0">
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
              <GameCardVue :game="game" :read-only="true" />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

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
                  ? `Jeux ${selectedPlatformForGames.platform} de ${friendData.friendInfo.name}`
                  : `Tous les jeux de ${friendData.friendInfo.name}`
              }}
            </span>
          </v-card-title>
          <v-card-text class="pa-0">
            <PlatformGamesList
              :platform="selectedPlatformForGames?.platform"
              :account-id="selectedPlatformForGames?.id"
              :friend-id="friendId"
              :read-only="true"
            />
          </v-card-text>
        </v-card>
      </v-dialog>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { GamingPlatform } from "@prisma/client";
import GameCardVue from "~/components/library/GameCard.vue";
import PlatformGamesList from "~/components/library/PlatformGamesList.vue";
import type { GameCard } from "~~/shared/models/gameCard";
import { MostPlayedGamesPeriodes } from "~~/shared/constantes/constantes";
import {
  formatPlaytimeInDays,
  formatDate,
  getPlatformIcon,
} from "~/utils/gameUtils";

// Récupérer l'ID de l'ami depuis la route
const route = useRoute();
const friendId = route.params.friendId as string;

// État local
const showGamesDialog = ref(false);
const selectedPlatformForGames = ref<{
  id: number;
  platform: GamingPlatform;
} | null>(null);

// Récupérer les données de l'ami
const {
  data: friendData,
  pending,
  error,
  refresh,
} = await useFetch(`/api/user/library/friend/${friendId}`);

// Computed
const recentlyPlayedGames = computed<GameCard[]>(() => {
  if (!friendData.value?.games) return [];
  return friendData.value.games
    .filter(
      (game: any) =>
        game.lastPlayed &&
        new Date(game.lastPlayed).getTime() >
          Date.now() - 14 * 24 * 60 * 60 * 1000
    )
    .slice(0, 6) as GameCard[];
});

const periodItems = Object.values(MostPlayedGamesPeriodes);
const selectedPeriod = ref<MostPlayedGamesPeriodes>(
  MostPlayedGamesPeriodes.LAST_YEAR
);

// API pour les jeux les plus joués de l'ami
const {
  status: mostPlayedGamesStatus,
  data: mostPlayedGames,
  refresh: refreshMostPlayedGames,
} = await useFetch<GameCard[]>(
  `/api/user/library/friend/${friendId}/mostPlayed`,
  {
    query: computed(() => ({ period: selectedPeriod.value })),
    default: () => [],
  }
);

function viewPlatformGames(platform: { id: number; platform: GamingPlatform }) {
  selectedPlatformForGames.value = platform;
  showGamesDialog.value = true;
}

function viewAllGames() {
  selectedPlatformForGames.value = null;
  showGamesDialog.value = true;
}

// Watchers
watch(selectedPeriod, () => {
  refreshMostPlayedGames();
});

// Meta
definePageMeta({});

useSeoMeta({
  title: computed(() =>
    friendData.value
      ? `Bibliothèque de ${friendData.value.friendInfo.name}`
      : "Bibliothèque d'ami"
  ),
  description: "Consultez la bibliothèque de jeux de votre ami",
});
</script>

<style scoped>
.stat-card {
  cursor: pointer;
  transition: transform 0.2s ease-in-out;
}

.stat-card:hover {
  transform: translateY(-2px);
}
</style>
