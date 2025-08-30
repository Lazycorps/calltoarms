<template>
  <v-dialog v-model="isOpen" max-width="900" scrollable>
    <v-card v-if="gameDetails">
      <v-img
        color="surface-variant"
        height="200"
        :src="gameDetails.game.coverUrl || undefined"
        cover
        class="d-flex align-end pa-2"
      >
        <v-card-title
          class="text-h4 font-weight-bold text-white d-flex align-center"
        >
          {{ gameDetails.game.name }}
          <v-icon
            v-if="gameDetails.game.isCompleted"
            color="success"
            size="28"
            class="ml-3"
          >
            mdi-check-circle
          </v-icon>
        </v-card-title>
        <v-card-subtitle class="text-white">
          <v-chip size="small" color="white" variant="outlined" class="mr-2">
            <v-icon start>{{
              getPlatformIcon(gameDetails.game.platformAccount.platform)
            }}</v-icon>
            {{ gameDetails.game.platformAccount.platform }}
          </v-chip>
          <span v-if="gameDetails.game.lastPlayed">
            Dernière session : {{ formatDate(gameDetails.game.lastPlayed) }}
          </span>
        </v-card-subtitle>
      </v-img>

      <v-card-text>
        <!-- Statistiques générales -->
        <v-row class="mt-4 mb-6 justify-center">
          <v-col v-if="gameDetails.game.playtimeTotal" cols="6" sm="3">
            <div class="text-center">
              <v-icon size="32" color="primary" class="mb-1">mdi-clock</v-icon>
              <div class="text-h6">
                {{ formatPlaytimeInHours(gameDetails.game.playtimeTotal) }}
              </div>
              <div class="text-caption text-medium-emphasis">Temps total</div>
            </div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="text-center">
              <v-icon size="32" color="success" class="mb-1">mdi-trophy</v-icon>
              <div class="text-h6">
                {{ gameDetails.stats.completionPercentage }}%
              </div>
              <div class="text-caption text-medium-emphasis">Progression</div>
            </div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="text-center">
              <v-icon size="32" color="warning" class="mb-1">mdi-medal</v-icon>
              <div class="text-h6">
                {{ gameDetails.stats.unlockedAchievements }}/{{
                  gameDetails.stats.totalAchievements
                }}
              </div>
              <div class="text-caption text-medium-emphasis">
                Succès débloqués
              </div>
            </div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="text-center">
              <v-btn
                :icon="
                  gameDetails.game.isCompleted
                    ? 'mdi-check-circle'
                    : 'mdi-check'
                "
                :variant="gameDetails.game.isCompleted ? 'text' : 'tonal'"
                :color="gameDetails.game.isCompleted ? 'success' : 'grey'"
                size="32"
                :loading="updatingCompletion"
                class="mb-1"
                @click="toggleCompletion"
              />
              <div class="text-h6">
                {{ gameDetails.game.isCompleted ? "Terminé" : "En cours" }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{
                  gameDetails.game.isCompleted && gameDetails.game.completedAt
                    ? formatDate(gameDetails.game.completedAt)
                    : "Cliquer pour terminé"
                }}
              </div>
            </div>
          </v-col>
          <!-- <v-col v-if="gameDetails.stats.totalPoints > 0" cols="6" sm="3">
            <div class="text-center">
              <v-icon size="32" color="info" class="mb-1">mdi-star</v-icon>
              <div class="text-h6">
                {{ gameDetails.stats.unlockedPoints }}/{{
                  gameDetails.stats.totalPoints
                }}
              </div>
              <div class="text-caption text-medium-emphasis">Points</div>
            </div>
          </v-col> -->
        </v-row>

        <!-- Barre de progression -->
        <v-progress-linear
          :model-value="gameDetails.stats.completionPercentage"
          height="20"
          rounded
          color="success"
          class="mb-4"
        >
          <template #default="{ value }">
            <strong class="text-white">{{ value }}%</strong>
          </template>
        </v-progress-linear>

        <!-- Tabs pour succès -->
        <v-tabs v-model="tab" class="mb-4">
          <v-tab value="all">
            Tous ({{ gameDetails.stats.totalAchievements }})
          </v-tab>
          <v-tab value="unlocked">
            Débloqués ({{ gameDetails.stats.unlockedAchievements }})
          </v-tab>
          <v-tab value="locked">
            Verrouillés ({{
              gameDetails.stats.totalAchievements -
              gameDetails.stats.unlockedAchievements
            }})
          </v-tab>
        </v-tabs>

        <!-- Filtre et tri -->
        <v-row class="mb-4">
          <v-col cols="12" md="6">
            <v-text-field
              v-model="searchQuery"
              label="Rechercher un succès"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              clearable
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-select
              v-model="sortBy"
              label="Trier par"
              :items="sortOptions"
              variant="outlined"
              density="compact"
            />
          </v-col>
        </v-row>

        <!-- Liste des succès -->
        <v-tabs-window v-model="tab">
          <v-tabs-window-item
            v-for="tabValue in ['all', 'unlocked', 'locked']"
            :key="tabValue"
            :value="tabValue"
          >
            <div
              v-if="filteredAchievements.length === 0"
              class="text-center py-8"
            >
              <v-icon size="64" color="grey-lighten-2" class="mb-4">
                mdi-trophy-outline
              </v-icon>
              <div class="text-h6 text-medium-emphasis">
                Aucun succès trouvé
              </div>
            </div>

            <v-list v-else>
              <v-list-item
                v-for="achievement in filteredAchievements"
                :key="achievement.id"
                class="achievement-item"
                :class="{ unlocked: achievement.isUnlocked }"
              >
                <template #prepend>
                  <v-avatar size="48" rounded>
                    <v-img
                      v-if="achievement.iconUrl"
                      :src="achievement.iconUrl"
                      :alt="achievement.name"
                    />
                    <v-icon v-else size="32">
                      {{
                        achievement.isUnlocked
                          ? "mdi-trophy"
                          : "mdi-trophy-outline"
                      }}
                    </v-icon>
                  </v-avatar>
                </template>

                <v-list-item-title>
                  {{ achievement.name }}
                  <v-chip
                    v-if="achievement.points"
                    size="x-small"
                    color="primary"
                    class="ml-2"
                  >
                    {{ achievement.points }} pts
                  </v-chip>
                  <v-chip
                    v-if="achievement.rarity"
                    size="x-small"
                    :color="getRarityColor(achievement.rarity)"
                    class="ml-2"
                  >
                    {{ getRarityLabel(achievement) }}
                  </v-chip>
                </v-list-item-title>

                <v-list-item-subtitle>
                  {{ achievement.description }}
                  <div
                    v-if="achievement.isUnlocked && achievement.unlockedAt"
                    class="text-caption mt-1"
                  >
                    Débloqué le {{ formatDate(achievement.unlockedAt) }}
                  </div>
                </v-list-item-subtitle>

                <template v-if="achievement.isUnlocked" #append>
                  <v-icon color="success">mdi-check-circle</v-icon>
                </template>
              </v-list-item>
            </v-list>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="close">Fermer</v-btn>
      </v-card-actions>
    </v-card>

    <!-- Loading state -->
    <v-card v-else-if="loading" class="pa-8">
      <div class="text-center">
        <v-progress-circular indeterminate color="primary" />
        <div class="mt-4">Chargement des détails...</div>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { GamingPlatform } from "@prisma/client";
import type {
  GameDetailsDTO,
  PlatformAchievementDTO,
} from "~~/shared/types/library";

const props = defineProps<{
  modelValue: boolean;
  gameId: number | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

// État local
const loading = ref(false);
const gameDetails = ref<GameDetailsDTO | null>(null);
const tab = ref("all");
const searchQuery = ref("");
const sortBy = ref("name");
const updatingCompletion = ref(false);

const sortOptions = [
  { title: "Nom", value: "name" },
  { title: "Date de déblocage", value: "date" },
  { title: "Rareté", value: "rarity" },
  { title: "Points", value: "points" },
];

// Computed
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const filteredAchievements = computed(() => {
  if (!gameDetails.value) {
    return [];
  }

  let achievements = [...gameDetails.value.achievements];

  // Filtrer par tab
  if (tab.value === "unlocked") {
    achievements = achievements.filter((a) => a.isUnlocked);
  } else if (tab.value === "locked") {
    achievements = achievements.filter((a) => !a.isUnlocked);
  }

  // Filtrer par recherche
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    achievements = achievements.filter(
      (a) =>
        a.name.toLowerCase().includes(query) ||
        (a.description && a.description.toLowerCase().includes(query))
    );
  }

  // Trier
  achievements.sort((a, b) => {
    switch (sortBy.value) {
      case "date":
        if (!a.unlockedAt && !b.unlockedAt) return 0;
        if (!a.unlockedAt) return 1;
        if (!b.unlockedAt) return -1;
        return (
          new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime()
        );
      case "rarity":
        return (a.rarity || 100) - (b.rarity || 100);
      case "points":
        return (b.points || 0) - (a.points || 0);
      case "name":
      default:
        return a.name.localeCompare(b.name);
    }
  });

  return achievements;
});

// Méthodes
async function loadGameDetails() {
  if (!props.gameId) return;

  loading.value = true;
  try {
    const response = await $fetch<GameDetailsDTO>(
      `/api/library/game/${props.gameId}`
    );

    gameDetails.value = response;
  } catch (error) {
    console.error("Erreur lors du chargement des détails du jeu:", error);
  } finally {
    loading.value = false;
  }
}

function close() {
  isOpen.value = false;
  // Réinitialiser l'état
  tab.value = "all";
  searchQuery.value = "";
  sortBy.value = "name";
  gameDetails.value = null;
}

function getPlatformIcon(platform: GamingPlatform): string {
  const icons: Record<GamingPlatform, string> = {
    STEAM: "mdi-steam",
    PLAYSTATION: "mdi-sony-playstation",
    XBOX: "mdi-microsoft-xbox",
    NINTENDO: "mdi-nintendo-switch",
    GOG: "mdi-gamepad-variant",
    EPIC_GAMES: "mdi-gamepad-variant",
    RIOT: "mdi-gamepad-variant",
  };
  return icons[platform] || "mdi-gamepad-variant";
}

function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getRarityColor(rarity: number): string {
  if (rarity == 0) return "purple";
  if (rarity == 1) return "orange";
  if (rarity == 2) return "blue";
  return "grey";
}

function getRarityLabel(achievement: PlatformAchievementDTO): string {
  if (achievement.rarity == 0) return `Ultra rare (${achievement.earnedRate}%)`;
  if (achievement.rarity == 1) return `Très rare (${achievement.earnedRate}%)`;
  if (achievement.rarity == 2) return `Rare (${achievement.earnedRate}%)`;
  return `Commun (${achievement.earnedRate}%)`;
}

async function toggleCompletion() {
  if (!gameDetails.value || !props.gameId) return;

  updatingCompletion.value = true;
  try {
    const response = await $fetch(
      `/api/library/game/${props.gameId}/completion`,
      {
        method: "PATCH",
        body: {
          isCompleted: !gameDetails.value.game.isCompleted,
        },
      }
    );

    if (response.success && response.data) {
      // Mettre à jour les données locales
      gameDetails.value.game.isCompleted = response.data.game.isCompleted;
      gameDetails.value.game.completedAt = response.data.game.completedAt
        ? new Date(response.data.game.completedAt)
        : undefined;
    }
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour du statut de completion:",
      error
    );
  } finally {
    updatingCompletion.value = false;
  }
}

// Watchers
watch(
  () => props.gameId,
  (newValue) => {
    if (newValue && isOpen.value) {
      loadGameDetails();
    }
  }
);

watch(isOpen, (newValue) => {
  if (newValue && props.gameId) {
    loadGameDetails();
  }
});
</script>

<style scoped>
.game-header {
  position: relative;
  overflow: hidden;
}

.game-header-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent);
}

.achievement-item {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
  padding: 16px;
}

.achievement-item:last-child {
  border-bottom: none;
}

.achievement-item:not(.unlocked) {
  opacity: 0.7;
}

.achievement-item.unlocked {
  background-color: rgba(var(--v-theme-success), 0.05);
}
</style>
