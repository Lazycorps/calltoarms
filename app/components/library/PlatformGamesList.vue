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
              v-if="props.platform && !props.readOnly"
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
                sm="4"
                md="3"
                lg="2"
              >
                <GameCardVue :game="game.raw" />
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
import { useSnackbarStore } from "~/stores/snackbar";
import type { GamingPlatform } from "@prisma/client";
import type { PlatformGameWithAccount } from "~~/shared/types/gamingPlatform";
import type { PlatformGameCardDTO } from "~~/shared/types/library/platformGameCardDTO";
import GameDetailsDialog from "~/components/library/GameDetailsDialog.vue";
import GameCardVue from "~/components/library/GameCard.vue";

// Props
interface Props {
  platform?: GamingPlatform;
  accountId?: number;
  friendId?: string;
  readOnly?: boolean;
}

const props = defineProps<Props>();

// Store
const gamingPlatformsStore = useGamingPlatformsStore();

// État local
const searchQuery = ref("");
const sortBy = ref("name");
const sortOrder = ref("asc");
const page = ref(1);
const itemsPerPage = ref(24);
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
    { title: "Xbox", value: "XBOX" },
  ];

  // Si on est déjà sur une plateforme spécifique, on ne montre pas le filtre
  if (props.platform) {
    return [];
  }

  return platforms;
});

// Fonction de transformation des données
function transformGameToCardDTO(
  game: PlatformGameWithAccount
): PlatformGameCardDTO {
  const achievementsCount = game._count?.achievements || 0;
  // Pour le moment, on utilise le nombre total d'achievements comme totalAchievements
  // Cela devra être ajusté quand on aura les données complètes des achievements
  const totalAchievements = achievementsCount;

  return {
    id: game.id,
    name: game.name,
    iconUrl: game.iconUrl || null,
    coverUrl: game.coverUrl || null,
    lastPlayed: game.lastPlayed || null,
    playtimeTotal: game.playtimeTotal || 0,
    platformGameId: game.platformGameId,
    platform: game.platformAccount.platform,
    achievementsCount,
    totalAchievements,
    achievementPercentage:
      totalAchievements > 0
        ? Math.round((achievementsCount / totalAchievements) * 100)
        : 0,
    isCompleted: game.completedAt !== null,
  };
}

// Computed
const games = computed(() =>
  gamingPlatformsStore.allGames.map(transformGameToCardDTO)
);
const loading = computed(() => gamingPlatformsStore.loading);

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
    limit: 1000, // Charger plus de jeux pour la pagination côté client
  });
}

async function syncGames() {
  if (!props.accountId || !props.platform) return;

  const snackbarStore = useSnackbarStore();

  try {
    syncing.value = true;
    const result = await gamingPlatformsStore.syncPlatform(
      props.accountId,
      props.platform
    );

    if (result && result.success) {
      snackbarStore.showSuccess(`Synchronisation ${props.platform} réussie`);
      await loadGames(); // Recharger les jeux après synchronisation
    } else if (result && result.error) {
      snackbarStore.showError(result.error);
    } else {
      snackbarStore.showError("Erreur lors de la synchronisation");
    }
  } catch (error) {
    console.error("Erreur lors de la synchronisation:", error);
    snackbarStore.showError("Erreur lors de la synchronisation");
  } finally {
    syncing.value = false;
  }
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
