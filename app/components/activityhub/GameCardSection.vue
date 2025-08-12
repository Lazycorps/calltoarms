<script setup lang="ts">
import type { PlatformGameCardDTO } from "~~/shared/types/library";
import GameCard from "./GameCard.vue";

interface Props {
  title: string;
  icon: string;
  games: PlatformGameCardDTO[];
  emptyMessage?: string;
  showPlaytime?: boolean;
  showLastPlayed?: boolean;
  showFriend?: boolean;
  showCompletionDate?: boolean;
  cardMinWidth?: string;
  cardMaxWidth?: string;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  emptyMessage: "Aucun jeu trouvé",
  showPlaytime: true,
  showLastPlayed: true,
  showFriend: true,
  showCompletionDate: false,
  cardMinWidth: "280px",
  cardMaxWidth: "350px",
  loading: false,
});

const emit = defineEmits<{
  gameClick: [game: PlatformGameCardDTO]
}>();

const handleGameClick = (game: PlatformGameCardDTO) => {
  emit('gameClick', game);
};
</script>

<template>
  <v-card class="mb-6">
    <v-card-title class="d-flex align-center">
      <v-icon class="me-2">{{ icon }}</v-icon>
      {{ title }}
      <v-spacer />
      <v-chip size="small" variant="tonal" v-if="!loading">
        {{ games.length }} {{ games.length <= 1 ? 'jeu' : 'jeux' }}
      </v-chip>
      <v-progress-circular 
        v-else
        indeterminate 
        size="20" 
        width="2"
      />
    </v-card-title>
    
    <v-card-text>
      <!-- Loading state -->
      <template v-if="loading">
        <div class="d-flex flex-wrap ga-3">
          <v-skeleton-loader
            v-for="n in 3"
            :key="n"
            type="card"
            :style="`min-width: ${cardMinWidth}; max-width: ${cardMaxWidth}; flex-grow: 1;`"
          />
        </div>
      </template>
      
      <!-- Games grid -->
      <div 
        v-else-if="games.length > 0" 
        class="d-flex flex-wrap ga-3"
      >
        <GameCard 
          v-for="game in games"
          :key="game.id"
          :game="game"
          :show-playtime="showPlaytime"
          :show-last-played="showLastPlayed"
          :show-friend="showFriend"
          :show-completion-date="showCompletionDate"
          :clickable="!!game.friendName"
          class="flex-grow-1"
          :style="`min-width: ${cardMinWidth}; max-width: ${cardMaxWidth};`"
          @click="handleGameClick"
        />
      </div>
      
      <!-- Empty state -->
      <v-alert 
        v-else 
        variant="tonal" 
        type="info"
        class="text-center"
      >
        <div class="d-flex flex-column align-center">
          <v-icon size="48" class="mb-2" color="info">{{ icon }}</v-icon>
          <div>{{ emptyMessage }}</div>
        </div>
      </v-alert>
    </v-card-text>
  </v-card>
</template>

<style scoped>
/* Animations pour les skeleton loaders */
.v-skeleton-loader {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}
</style>