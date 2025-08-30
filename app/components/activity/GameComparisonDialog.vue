<script setup lang="ts">
import type { PlatformGameCardDTO } from "~~/shared/types/library";

interface GameComparisonData {
  game: PlatformGameCardDTO;
  friend: {
    name: string;
    slug: string;
    stats: {
      playtimeTotal: number;
      achievementsCount: number;
      totalAchievements: number;
      achievementPercentage: number;
      isCompleted: boolean;
      lastPlayed?: Date;
    };
  };
  user: {
    stats?: {
      playtimeTotal: number;
      achievementsCount: number;
      totalAchievements: number;
      achievementPercentage: number;
      isCompleted: boolean;
      lastPlayed?: Date;
    };
    hasGame: boolean;
  };
}

interface Props {
  modelValue: boolean;
  gameData?: GameComparisonData;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const formatPlaytime = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  if (remainingHours > 0) {
    return `${days}j ${remainingHours}h`;
  }
  return `${days}j`;
};

const formatLastPlayed = (date: Date | undefined): string => {
  if (!date) return "Jamais joué";

  const played = new Date(date);
  const now = new Date();
  const diffInHours = Math.floor(
    (now.getTime() - played.getTime()) / (1000 * 60 * 60)
  );

  if (diffInHours < 24) return `Il y a ${diffInHours}h`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "Hier";
  if (diffInDays < 7) return `Il y a ${diffInDays} jours`;

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks === 1) return "La semaine dernière";
  if (diffInWeeks < 4) return `Il y a ${diffInWeeks} semaines`;

  return played.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
};

const getPlatformIcon = (platform: string): string => {
  switch (platform) {
    case "STEAM":
      return "mdi-steam";
    case "PLAYSTATION":
      return "mdi-sony-playstation";
    case "XBOX":
      return "mdi-microsoft-xbox";
    default:
      return "mdi-gamepad-variant";
  }
};

const getPlatformColor = (platform: string): string => {
  switch (platform) {
    case "STEAM":
      return "blue";
    case "PLAYSTATION":
      return "indigo";
    case "XBOX":
      return "green";
    default:
      return "grey";
  }
};

const getCompletionColor = (percentage: number): string => {
  if (percentage === 100) return "success";
  if (percentage >= 75) return "warning";
  if (percentage >= 50) return "info";
  return "primary";
};
</script>

<template>
  <v-dialog v-model="isOpen" max-width="1000" scrollable>
    <v-card v-if="gameData">
      <!-- Header avec cover -->
      <v-img
        color="surface-variant"
        height="200"
        :src="gameData.game.coverUrl || undefined"
        cover
        class="d-flex align-end pa-4"
      >
        <v-card-title class="text-h4 font-weight-bold text-white">
          {{ gameData.game.name }}
          <v-chip
            :color="getPlatformColor(gameData.game.platform)"
            :prepend-icon="getPlatformIcon(gameData.game.platform)"
            size="small"
            variant="tonal"
            class="ml-3"
          >
            {{ gameData.game.platform }}
          </v-chip>
        </v-card-title>
      </v-img>

      <!-- Actions dans le header -->
      <v-card-text class="pa-6">
        <!-- Titre de comparaison -->
        <div class="text-h5 font-weight-bold mb-6 text-center">
          Comparaison avec {{ gameData.friend.name }}
        </div>

        <!-- Comparaison des statistiques -->
        <v-row>
          <!-- Colonne ami -->
          <v-col cols="12" md="6">
            <v-card variant="outlined" class="h-100">
              <v-card-title class="d-flex align-center">
                <v-icon class="me-2">mdi-account</v-icon>
                {{ gameData.friend.name }}
                <v-spacer />
                <v-chip
                  v-if="gameData.friend.stats.isCompleted"
                  color="success"
                  size="small"
                  variant="tonal"
                >
                  <v-icon start size="16">mdi-trophy</v-icon>
                  Terminé
                </v-chip>
              </v-card-title>

              <v-card-text>
                <!-- Temps de jeu -->
                <div class="stat-item mb-4">
                  <div class="d-flex align-center mb-2">
                    <v-icon class="me-2" color="primary"
                      >mdi-clock-outline</v-icon
                    >
                    <span class="text-subtitle-2">Temps de jeu</span>
                  </div>
                  <div class="text-h6">
                    {{ formatPlaytime(gameData.friend.stats.playtimeTotal) }}
                  </div>
                </div>

                <!-- Progression -->
                <div class="stat-item mb-4">
                  <div class="d-flex align-center mb-2">
                    <v-icon class="me-2" color="info"
                      >mdi-progress-check</v-icon
                    >
                    <span class="text-subtitle-2">Progression</span>
                  </div>
                  <v-progress-linear
                    :model-value="gameData.friend.stats.achievementPercentage"
                    :color="
                      getCompletionColor(
                        gameData.friend.stats.achievementPercentage
                      )
                    "
                    height="20"
                    rounded
                    class="mb-1"
                  >
                    <template #default="{ value }">
                      <strong class="text-white text-caption"
                        >{{ Math.round(value) }}%</strong
                      >
                    </template>
                  </v-progress-linear>
                  <div class="text-caption text-medium-emphasis">
                    {{ gameData.friend.stats.achievementsCount }}/{{
                      gameData.friend.stats.totalAchievements
                    }}
                    succès
                  </div>
                </div>

                <!-- Dernière partie -->
                <div class="stat-item">
                  <div class="d-flex align-center mb-2">
                    <v-icon class="me-2" color="warning"
                      >mdi-calendar-clock</v-icon
                    >
                    <span class="text-subtitle-2">Dernière partie</span>
                  </div>
                  <div class="text-body-2">
                    {{ formatLastPlayed(gameData.friend.stats.lastPlayed) }}
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Colonne utilisateur -->
          <v-col cols="12" md="6">
            <v-card variant="outlined" class="h-100">
              <v-card-title class="d-flex align-center">
                <v-icon class="me-2">mdi-account-circle</v-icon>
                Vous
                <v-spacer />
                <v-chip
                  v-if="
                    gameData.user.hasGame && gameData.user.stats?.isCompleted
                  "
                  color="success"
                  size="small"
                  variant="tonal"
                >
                  <v-icon start size="16">mdi-trophy</v-icon>
                  Terminé
                </v-chip>
              </v-card-title>

              <v-card-text>
                <template v-if="gameData.user.hasGame && gameData.user.stats">
                  <!-- Temps de jeu -->
                  <div class="stat-item mb-4">
                    <div class="d-flex align-center mb-2">
                      <v-icon class="me-2" color="primary"
                        >mdi-clock-outline</v-icon
                      >
                      <span class="text-subtitle-2">Temps de jeu</span>
                    </div>
                    <div class="text-h6">
                      {{ formatPlaytime(gameData.user.stats.playtimeTotal) }}
                    </div>

                    <!-- Comparaison -->
                    <div class="text-caption mt-1">
                      <template
                        v-if="
                          gameData.user.stats.playtimeTotal >
                          gameData.friend.stats.playtimeTotal
                        "
                      >
                        <v-icon size="16" color="success">mdi-arrow-up</v-icon>
                        <span class="text-success">
                          +{{
                            formatPlaytime(
                              gameData.user.stats.playtimeTotal -
                                gameData.friend.stats.playtimeTotal
                            )
                          }}
                          de plus
                        </span>
                      </template>
                      <template
                        v-else-if="
                          gameData.user.stats.playtimeTotal <
                          gameData.friend.stats.playtimeTotal
                        "
                      >
                        <v-icon size="16" color="error">mdi-arrow-down</v-icon>
                        <span class="text-error">
                          -{{
                            formatPlaytime(
                              gameData.friend.stats.playtimeTotal -
                                gameData.user.stats.playtimeTotal
                            )
                          }}
                          de moins
                        </span>
                      </template>
                      <template v-else>
                        <v-icon size="16" color="info">mdi-equal</v-icon>
                        <span class="text-info">Temps identique</span>
                      </template>
                    </div>
                  </div>

                  <!-- Progression -->
                  <div class="stat-item mb-4">
                    <div class="d-flex align-center mb-2">
                      <v-icon class="me-2" color="info"
                        >mdi-progress-check</v-icon
                      >
                      <span class="text-subtitle-2">Progression</span>
                    </div>
                    <v-progress-linear
                      :model-value="gameData.user.stats.achievementPercentage"
                      :color="
                        getCompletionColor(
                          gameData.user.stats.achievementPercentage
                        )
                      "
                      height="20"
                      rounded
                      class="mb-1"
                    >
                      <template #default="{ value }">
                        <strong class="text-white text-caption"
                          >{{ Math.round(value) }}%</strong
                        >
                      </template>
                    </v-progress-linear>
                    <div class="text-caption text-medium-emphasis mb-1">
                      {{ gameData.user.stats.achievementsCount }}/{{
                        gameData.user.stats.totalAchievements
                      }}
                      succès
                    </div>

                    <!-- Comparaison -->
                    <div class="text-caption">
                      <template
                        v-if="
                          gameData.user.stats.achievementPercentage >
                          gameData.friend.stats.achievementPercentage
                        "
                      >
                        <v-icon size="16" color="success">mdi-arrow-up</v-icon>
                        <span class="text-success">
                          +{{
                            Math.round(
                              gameData.user.stats.achievementPercentage -
                                gameData.friend.stats.achievementPercentage
                            )
                          }}% d'avance
                        </span>
                      </template>
                      <template
                        v-else-if="
                          gameData.user.stats.achievementPercentage <
                          gameData.friend.stats.achievementPercentage
                        "
                      >
                        <v-icon size="16" color="error">mdi-arrow-down</v-icon>
                        <span class="text-error">
                          -{{
                            Math.round(
                              gameData.friend.stats.achievementPercentage -
                                gameData.user.stats.achievementPercentage
                            )
                          }}% de retard
                        </span>
                      </template>
                      <template v-else>
                        <v-icon size="16" color="info">mdi-equal</v-icon>
                        <span class="text-info">Progression identique</span>
                      </template>
                    </div>
                  </div>

                  <!-- Dernière partie -->
                  <div class="stat-item">
                    <div class="d-flex align-center mb-2">
                      <v-icon class="me-2" color="warning"
                        >mdi-calendar-clock</v-icon
                      >
                      <span class="text-subtitle-2">Dernière partie</span>
                    </div>
                    <div class="text-body-2">
                      {{ formatLastPlayed(gameData.user.stats.lastPlayed) }}
                    </div>
                  </div>
                </template>

                <!-- Si l'utilisateur n'a pas le jeu -->
                <template v-else>
                  <div class="text-center py-8">
                    <v-icon size="64" color="surface-variant" class="mb-4"
                      >mdi-gamepad-variant-outline</v-icon
                    >
                    <div class="text-h6 mb-2">Vous ne possédez pas ce jeu</div>
                    <div class="text-body-2 text-medium-emphasis">
                      Votre ami {{ gameData.friend.name }} a joué
                      {{
                        formatPlaytime(gameData.friend.stats.playtimeTotal)
                      }}
                      avec {{ gameData.friend.stats.achievementPercentage }}% de
                      progression
                    </div>
                  </div>
                </template>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.stat-item {
  padding: 12px;
  border-radius: 8px;
  background-color: rgba(var(--v-theme-surface-variant), 0.1);
}

.stat-item:hover {
  background-color: rgba(var(--v-theme-surface-variant), 0.2);
  transition: background-color 0.2s ease;
}
</style>
