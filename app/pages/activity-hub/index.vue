<script setup lang="ts">
import type { ActivityHubDTO, PlatformGameCardDTO } from "~~/shared/types/library";
import GameCard from "~/components/activityhub/GameCard.vue";
import GameComparisonDialog from "~/components/activityhub/GameComparisonDialog.vue";
import GameCardSection from "~/components/activityhub/GameCardSection.vue";

// Bypass auth middleware en mode développement
definePageMeta({
  middleware: process.env.NODE_ENV === 'production' ? "auth" : undefined,
});

const { data: hubData, pending, error, refresh } = await useFetch<ActivityHubDTO>('/api/user/activity-hub');

// Debug logs
watchEffect(() => {
  console.log('🔍 ActivityHub Data:', hubData.value);
  console.log('⏳ Pending:', pending.value);
  console.log('❌ Error:', error.value);
});

// Dialog de comparaison
const comparisonDialog = ref(false);
const comparisonData = ref();

const handleGameClick = async (game: PlatformGameCardDTO) => {
  if (!game.friendName) {
    console.warn('Impossible de comparer: pas d\'information sur l\'ami');
    return;
  }

  try {
    // Trouver l'ID de l'ami - pour simplifier, on utilise le nom
    // Dans une vraie app, il faudrait stocker l'friendId dans le DTO
    const friends = hubData.value?.stats ? 
      await $fetch('/api/user/friends', { query: { status: 'ACCEPTED' } }) : 
      [];
    
    const friend = friends.find((f: any) => f.friend?.name === game.friendName);
    if (!friend) {
      console.error('Ami non trouvé');
      return;
    }

    // Récupérer les données de comparaison
    const comparison = await $fetch(`/api/user/games/${game.id}/compare/${friend.friendId}`);
    
    comparisonData.value = comparison;
    comparisonDialog.value = true;
  } catch (error) {
    console.error('Erreur lors de la récupération des données de comparaison:', error);
  }
};

</script>

<template>
  <v-container>
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">ActivityHub</h1>
        <p class="text-subtitle-1 text-medium-emphasis">
          Découvrez l'activité gaming de vos amis
        </p>
      </div>
      
      <v-btn
        @click="refresh()"
        :loading="pending"
        variant="outlined"
        prepend-icon="mdi-refresh"
      >
        Actualiser
      </v-btn>
    </div>

    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      class="mb-4"
      dismissible
    >
      Erreur lors du chargement des données
    </v-alert>

    <template v-if="hubData">
      <!-- Statistiques -->
      <v-row class="mb-6">
        <v-col cols="12" sm="4">
          <v-card class="text-center pa-4">
            <v-icon size="48" color="primary" class="mb-2">mdi-account-group</v-icon>
            <div class="text-h4 font-weight-bold">{{ hubData.stats.totalFriends }}</div>
            <div class="text-body-2 text-medium-emphasis">Amis connectés</div>
          </v-card>
        </v-col>
        
        <v-col cols="12" sm="4">
          <v-card class="text-center pa-4">
            <v-icon size="48" color="success" class="mb-2">mdi-gamepad-variant</v-icon>
            <div class="text-h4 font-weight-bold">{{ hubData.stats.activeFriendsThisWeek }}</div>
            <div class="text-body-2 text-medium-emphasis">Actifs cette semaine</div>
          </v-card>
        </v-col>
        
        <v-col cols="12" sm="4">
          <v-card class="text-center pa-4">
            <v-icon size="48" color="info" class="mb-2">mdi-library-shelves</v-icon>
            <div class="text-h4 font-weight-bold">{{ hubData.stats.totalGamesInCircle }}</div>
            <div class="text-body-2 text-medium-emphasis">Jeux dans votre cercle</div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Jeux populaires dans votre cercle -->
      <GameCardSection 
        title="Populaires dans votre cercle"
        icon="mdi-trending-up"
        :games="hubData.popularInCircle.games"
        :show-friend="false"
        :show-last-played="false"
        card-min-width="250px"
        card-max-width="300px"
        empty-message="Aucun jeu populaire trouvé dans votre cercle d'amis"
        @game-click="handleGameClick"
      />

      <!-- Mes jeux récemment terminés -->
      <GameCardSection 
        v-if="hubData.myActivity.recentlyCompleted.length > 0"
        title="Vos derniers succès"
        icon="mdi-trophy-variant"
        :games="hubData.myActivity.recentlyCompleted"
        :show-friend="false"
        :show-completion-date="true"
        :show-last-played="false"
        card-min-width="280px"
        card-max-width="350px"
        @game-click="handleGameClick"
      />

      <!-- Activité récente des amis -->
      <div class="d-flex flex-column flex-lg-row ga-4 mb-6">
        <!-- Jeux récemment joués -->
        <div class="flex-grow-1">
          <GameCardSection 
            title="Récemment joués"
            icon="mdi-clock-outline"
            :games="hubData.friendsActivity.recentlyPlayed"
            :show-playtime="false"
            card-min-width="280px"
            card-max-width="400px"
            empty-message="Aucune activité récente de vos amis"
            @game-click="handleGameClick"
          />
        </div>

        <!-- Jeux récemment terminés -->
        <div class="flex-grow-1">
          <GameCardSection 
            title="Récemment terminés"
            icon="mdi-trophy"
            :games="hubData.friendsActivity.recentlyCompleted"
            :show-playtime="false"
            :show-completion-date="true"
            :show-last-played="false"
            card-min-width="280px"
            card-max-width="400px"
            empty-message="Aucun jeu récemment terminé par vos amis"
            @game-click="handleGameClick"
          />
        </div>
      </div>

      <!-- Recommandations -->
      <GameCardSection 
        title="Recommandations pour vous"
        icon="mdi-lightbulb-outline"
        :games="hubData.recommendations.basedOnFriends"
        :show-last-played="false"
        card-min-width="280px"
        card-max-width="350px"
        empty-message="Aucune recommandation disponible pour le moment"
        @game-click="handleGameClick"
      />
    </template>

    <!-- État de chargement -->
    <template v-else-if="pending">
      <div class="text-center py-12">
        <v-progress-circular indeterminate size="64" />
        <p class="mt-4 text-medium-emphasis">Chargement de l'ActivityHub...</p>
      </div>
    </template>

    <!-- Dialog de comparaison -->
    <GameComparisonDialog 
      v-model="comparisonDialog"
      :game-data="comparisonData"
    />
  </v-container>
</template>

<style scoped>
/* Force les images à s'afficher même avec CORS */
.v-avatar img {
  object-fit: cover;
  width: 100%;
  height: 100%;
}

/* Debug pour voir les avatars sans images */
.v-avatar {
  background-color: rgba(var(--v-theme-surface-variant)) !important;
}
</style>