<template>
  <div>
    <v-card class="most-played-game-card" hover @click="viewGameDetails()">
      <v-img :src="game.coverUrl || ''" :alt="game.name" height="140" cover>
        <template #placeholder>
          <div class="d-flex align-center justify-center fill-height">
            <v-icon size="32" color="grey-lighten-2"
              >mdi-gamepad-variant</v-icon
            >
          </div>
        </template>
        <div class="playtime-overlay">
          <v-chip color="white" size="small" class="platform-chip">
            <v-icon size="18" class="me-1">{{
              getPlatformIcon(game.platform)
            }}</v-icon>
            {{ game.platform }}
          </v-chip>
        </div>
        <div class="platform-icon-overlay">
          <v-chip
            v-if="game.isCompleted"
            color="success"
            size="small"
            class="mr-1"
          >
            <v-icon size="14" class="me-1">mdi-check-circle</v-icon>
            Terminé
          </v-chip>
          <v-chip
            v-if="game.totalAchievements > 0"
            :color="getAchievementColor(game.achievementPercentage)"
            size="small"
            class="mr-1"
          >
            <v-icon size="14" class="me-1">mdi-trophy</v-icon>
            {{ game.achievementPercentage }}%
          </v-chip>
          <v-chip prepend-icon="mdi-clock-outline" size="small">
            {{ formatPlaytime(game.playtimeTotal) }}
          </v-chip>
        </div>
      </v-img>
      <v-card-title class="text-subtitle-2 pa-2">
        {{ game.name }}
      </v-card-title>
    </v-card>
    <!-- Dialog des détails du jeu -->
    <GameDetailsDialog 
      v-model="showGameDetailsDialog" 
      :game-id="game.id" 
      :user-id="userId"
    />
  </div>
</template>

<script lang="ts" setup>
import type { GameCard } from "~~/shared/types/gameCard";
import GameDetailsDialog from "./GameDetailsDialog.vue";

const showGameDetailsDialog = ref(false);
const { game, userId } = defineProps<{
  game: GameCard;
  readOnly?: boolean;
  userId?: string;
}>();

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

function getAchievementColor(percentage: number): string {
  if (percentage === 100) return "success";
  if (percentage >= 75) return "info";
  if (percentage >= 50) return "warning";
  if (percentage >= 25) return "orange";
  return "error";
}

function viewGameDetails() {
  // Permettre la consultation des détails même en mode readOnly
  showGameDetailsDialog.value = true;
}
</script>

<style scoped>
.achievement-overlay {
  position: absolute;
  top: 8px;
  left: 8px;
}

.playtime-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
}

.platform-icon-overlay {
  position: absolute;
  bottom: 4px;
  left: 8px;
}

/* Réduire l'opacité du fond des chips pour améliorer la visibilité */
:deep(.v-chip--variant-tonal) {
  background-color: rgba(var(--v-theme-surface), 0.5) !important;
  backdrop-filter: blur(4px);
}

:deep(.v-chip--variant-tonal.v-chip--color-white) {
  background-color: rgba(255, 255, 255, 0.8) !important;
}
</style>
