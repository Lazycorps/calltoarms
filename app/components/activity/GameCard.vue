<script setup lang="ts">
import type { PlatformGameCardDTO } from "~~/shared/types/library";

interface Props {
  game: PlatformGameCardDTO;
  showPlaytime?: boolean;
  showLastPlayed?: boolean;
  showFriend?: boolean;
  showCompletionDate?: boolean; // Pour afficher "Terminé le X" au lieu de "Dernière partie"
  clickable?: boolean;
}

const emit = defineEmits<{
  click: [game: PlatformGameCardDTO]
}>();

const props = withDefaults(defineProps<Props>(), {
  showPlaytime: true,
  showLastPlayed: true,
  showFriend: true,
  showCompletionDate: false,
  clickable: false,
});

const handleClick = () => {
  if (props.clickable) {
    emit('click', props.game);
  }
};

const formatPlaytime = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  if (remainingHours > 0) {
    return `${days}j ${remainingHours}h`;
  }
  
  return `${days}j`;
};

const formatLastPlayed = (date: string | undefined): string => {
  if (!date) return 'Jamais joué';
  
  const played = new Date(date);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - played.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 24) return `Il y a ${diffInHours}h`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Hier';
  if (diffInDays < 7) return `Il y a ${diffInDays} jours`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks === 1) return 'La semaine dernière';
  if (diffInWeeks < 4) return `Il y a ${diffInWeeks} semaines`;
  
  return played.toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'short' 
  });
};

const getPlatformColor = (platform: string): string => {
  switch (platform) {
    case 'STEAM': return 'blue';
    case 'PLAYSTATION': return 'indigo';
    case 'XBOX': return 'green';
    default: return 'grey';
  }
};

const getPlatformIcon = (platform: string): string => {
  switch (platform) {
    case 'STEAM': return 'mdi-steam';
    case 'PLAYSTATION': return 'mdi-sony-playstation';
    case 'XBOX': return 'mdi-microsoft-xbox';
    default: return 'mdi-gamepad-variant';
  }
};
</script>

<template>
  <v-card 
    class="game-card" 
    elevation="2"
    hover
    :style="clickable ? 'cursor: pointer;' : ''"
    @click="handleClick"
  >
    <!-- Image de cover comme header -->
    <div class="cover-container">
      <v-img
        v-if="game.coverUrl"
        :src="game.coverUrl"
        height="120"
        cover
        class="cover-image"
      >
        <template v-slot:error>
          <div class="cover-fallback d-flex align-center justify-center">
            <v-icon size="48" color="white">mdi-gamepad-variant</v-icon>
          </div>
        </template>
        
        <!-- Overlay avec pourcentage de complétion -->
        <div class="cover-overlay">
          <v-chip
            v-if="game.achievementPercentage > 0"
            :color="game.isCompleted ? 'success' : 'primary'"
            size="small"
            class="completion-chip"
          >
            <v-icon start size="16">
              {{ game.isCompleted ? 'mdi-trophy' : 'mdi-progress-check' }}
            </v-icon>
            {{ game.achievementPercentage }}%
          </v-chip>
        </div>
      </v-img>
      
      <!-- Fallback si pas d'image cover -->
      <div v-else class="cover-fallback d-flex align-center justify-center">
        <v-icon size="48" color="white">mdi-gamepad-variant</v-icon>
      </div>
    </div>

    <!-- Contenu de la card -->
    <v-card-text class="pa-3 pb-2">
      <!-- Nom du jeu -->
      <h3 class="text-subtitle-1 font-weight-bold mb-2 text-truncate">
        {{ game.name }}
      </h3>
      
      <!-- Informations principales -->
      <div class="d-flex align-center justify-space-between mb-2">
        <!-- Plateforme -->
        <v-chip
          :color="getPlatformColor(game.platform)"
          :prepend-icon="getPlatformIcon(game.platform)"
          size="small"
          variant="tonal"
          class="platform-chip"
        >
          {{ game.platform }}
        </v-chip>
        
        <!-- Statut terminé si applicable -->
        <v-chip
          v-if="game.isCompleted"
          color="success"
          size="small"
          variant="tonal"
        >
          <v-icon start size="16">mdi-trophy</v-icon>
          Terminé
        </v-chip>
      </div>
      
      <!-- Nom de l'ami -->
      <div 
        v-if="showFriend && game.friendName" 
        class="d-flex align-center mb-2"
      >
        <v-icon size="16" class="me-1">mdi-account</v-icon>
        <span class="text-body-2 text-medium-emphasis">
          {{ game.friendName }}
        </span>
      </div>
      
      <!-- Informations de jeu -->
      <div v-if="showPlaytime && game.playtimeTotal > 0">
        <div class="d-flex align-center mb-1">
          <v-icon size="16" class="me-1">mdi-clock-outline</v-icon>
          <span class="text-body-2">{{ formatPlaytime(game.playtimeTotal) }}</span>
        </div>
        
        <div 
          v-if="(showLastPlayed || showCompletionDate) && game.lastPlayed" 
          class="d-flex align-center"
        >
          <v-icon size="16" class="me-1">
            {{ showCompletionDate && game.isCompleted ? 'mdi-trophy-outline' : 'mdi-calendar-clock' }}
          </v-icon>
          <span class="text-body-2 text-medium-emphasis">
            {{ showCompletionDate && game.isCompleted 
               ? `Terminé ${formatLastPlayed(game.lastPlayed)}` 
               : formatLastPlayed(game.lastPlayed) 
            }}
          </span>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.game-card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  max-width: 300px;
  background-color: rgba(var(--v-theme-surface), 1) !important;
  border: 1px solid rgba(var(--v-border-color), 0.1);
}

.game-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3) !important;
}

.cover-container {
  position: relative;
  height: 120px;
  overflow: hidden;
}

.cover-image {
  border-radius: 4px 4px 0 0;
}

.cover-fallback {
  height: 120px;
  background: linear-gradient(45deg, 
    rgba(var(--v-theme-primary), 0.8), 
    rgba(var(--v-theme-secondary), 0.6)
  );
  border-radius: 4px 4px 0 0;
}

.cover-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
}

.completion-chip {
  backdrop-filter: blur(4px);
  background-color: rgba(0, 0, 0, 0.7) !important;
}

.platform-chip {
  flex-shrink: 0;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .game-card {
    max-width: 100%;
  }
  
  .cover-container {
    height: 100px;
  }
}
</style>