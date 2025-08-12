<template>
  <v-container>
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">Activity Hub</h1>
        <p class="text-subtitle-1 text-medium-emphasis">
          Découvrez l'activité gaming de vos amis
        </p>
      </div>

      <v-btn
        :loading="pending || notificationsPending"
        variant="outlined"
        prepend-icon="mdi-refresh"
        @click="refreshAll()"
      >
        Actualiser
      </v-btn>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4" dismissible>
      Erreur lors du chargement des données
    </v-alert>

    <template v-if="Data">
      <!-- Statistiques -->
      <v-row>
        <v-col cols="12" sm="4">
          <v-card class="text-center pa-4">
            <v-icon size="48" color="primary" class="mb-2"
              >mdi-account-group</v-icon
            >
            <div class="text-h4 font-weight-bold">
              {{ Data.stats.totalFriends }}
            </div>
            <div class="text-body-2 text-medium-emphasis">Amis connectés</div>
          </v-card>
        </v-col>

        <v-col cols="12" sm="4">
          <v-card class="text-center pa-4">
            <v-icon size="48" color="success" class="mb-2"
              >mdi-gamepad-variant</v-icon
            >
            <div class="text-h4 font-weight-bold">
              {{ Data.stats.activeFriendsThisWeek }}
            </div>
            <div class="text-body-2 text-medium-emphasis">
              Actifs cette semaine
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" sm="4">
          <v-card class="text-center pa-4">
            <v-icon size="48" color="info" class="mb-2"
              >mdi-library-shelves</v-icon
            >
            <div class="text-h4 font-weight-bold">
              {{ Data.stats.totalGamesInCircle }}
            </div>
            <div class="text-body-2 text-medium-emphasis">
              Jeux dans votre cercle
            </div>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <ActivityCardSection
            v-if="friendNotifications && friendNotifications.length > 0"
            title="Activités récente"
            :item-count="friendNotifications.length"
            icon="mdi-bell"
            empty-message="Aucun jeu récemment terminé"
          >
            <div class="notification-scroll-container">
              <div class="notification-scroll-content">
                <FriendNotificationCard
                  v-for="notification in friendNotifications"
                  :key="notification.notificationId"
                  :notification="notification"
                  class="notification-card-item"
                />
              </div>
            </div>
          </ActivityCardSection>
        </v-col>
        <!-- Notifications de jeux d'amis -->

        <!-- Mes jeux récemment terminés -->
        <v-col cols="12">
          <ActivityCardSection
            v-if="Data.myActivity.recentlyCompleted.length > 0"
            title="Vos derniers succès"
            icon="mdi-trophy-variant"
            :item-count="Data.myActivity.recentlyCompleted.length"
            item-label="jeu"
            item-label-plural="jeux"
            empty-message="Aucun jeu récemment terminé"
          >
            <GameCard
              v-for="game in Data.myActivity.recentlyCompleted"
              :key="game.id"
              :game="game"
              :show-friend="false"
              :show-completion-date="true"
              :show-last-played="false"
              :clickable="!!game.friendName"
              class="flex-grow-1"
              :style="`min-width: 280px; max-width: 350px;`"
              @click="handleGameClick"
            />
          </ActivityCardSection>
        </v-col>

        <!-- Activité récente des amis -->
        <v-col cols="6">
          <ActivityCardSection
            title="Récemment joués"
            icon="mdi-clock-outline"
            :item-count="Data.friendsActivity.recentlyPlayed.length"
            item-label="jeu"
            item-label-plural="jeux"
            empty-message="Aucune activité récente de vos amis"
          >
            <GameCard
              v-for="game in Data.friendsActivity.recentlyPlayed"
              :key="game.id"
              :game="game"
              :show-playtime="false"
              :clickable="!!game.friendName"
              class="flex-grow-1"
              :style="`min-width: 280px; max-width: 400px;`"
              @click="handleGameClick"
            />
          </ActivityCardSection>
        </v-col>

        <!-- Jeux récemment terminés -->
        <v-col cols="6">
          <ActivityCardSection
            title="Récemment terminés"
            icon="mdi-trophy"
            :item-count="Data.friendsActivity.recentlyCompleted.length"
            item-label="jeu"
            item-label-plural="jeux"
            card-min-width="280px"
            card-max-width="400px"
            empty-message="Aucun jeu récemment terminé par vos amis"
          >
            <GameCard
              v-for="game in Data.friendsActivity.recentlyCompleted"
              :key="game.id"
              :game="game"
              :show-playtime="false"
              :show-completion-date="true"
              :show-last-played="false"
              :clickable="!!game.friendName"
              class="flex-grow-1"
              :style="`min-width: 280px; max-width: 400px;`"
              @click="handleGameClick"
            />
          </ActivityCardSection>
        </v-col>
        <!-- Recommandations -->
        <v-col cols="12">
          <ActivityCardSection
            title="Recommandations pour vous"
            icon="mdi-lightbulb-outline"
            :item-count="Data.recommendations.basedOnFriends.length"
            item-label="jeu"
            item-label-plural="jeux"
            empty-message="Aucune recommandation disponible pour le moment"
          >
            <div class="notification-scroll-container">
              <div class="notification-scroll-content">
                <GameCard
                  v-for="game in Data.recommendations.basedOnFriends"
                  :key="game.id"
                  :game="game"
                  :show-last-played="false"
                  :clickable="!!game.friendName"
                  class="flex-grow-1"
                  :style="`min-width: 280px; max-width: 350px;`"
                  @click="handleGameClick"
                />
              </div>
            </div>
          </ActivityCardSection>
        </v-col>
      </v-row>
    </template>

    <!-- État de chargement -->
    <template v-else-if="pending">
      <div class="text-center py-12">
        <v-progress-circular indeterminate size="64" />
        <p class="mt-4 text-medium-emphasis">Chargement de l'activity...</p>
      </div>
    </template>

    <!-- Dialog de comparaison -->
    <GameComparisonDialog
      v-model="comparisonDialog"
      :game-data="comparisonData"
    />
  </v-container>
</template>
<script setup lang="ts">
import type { activityDTO, PlatformGameCardDTO } from "~~/shared/types/library";
import type { FriendGameNotificationDTO } from "~~/shared/types/activity";
import GameCard from "~/components/activity/GameCard.vue";
import GameComparisonDialog from "~/components/activity/GameComparisonDialog.vue";
import ActivityCardSection from "~/components/activity/ActivityCardSection.vue";
import FriendNotificationCard from "~/components/activity/FriendNotificationCard.vue";

const {
  data: Data,
  pending,
  error,
  refresh,
} = await useFetch<activityDTO>("/api/activity");

// Récupérer les notifications d'amis
const {
  data: friendNotificationsData,
  pending: notificationsPending,
  refresh: refreshNotifications,
} = await useFetch<{ success: boolean; data: FriendGameNotificationDTO[] }>(
  "/api/activity/friend-notifications"
);

const friendNotifications = computed(
  () => friendNotificationsData.value?.data || []
);

// Fonction de refresh globale
const refreshAll = async () => {
  await Promise.all([refresh(), refreshNotifications()]);
};

// Dialog de comparaison
const comparisonDialog = ref(false);
const comparisonData = ref();

const handleGameClick = async (game: PlatformGameCardDTO) => {
  if (!game.friendName) {
    console.warn("Impossible de comparer: pas d'information sur l'ami");
    return;
  }

  try {
    // Trouver l'ID de l'ami - pour simplifier, on utilise le nom
    // Dans une vraie app, il faudrait stocker l'friendId dans le DTO
    const friends = Data.value?.stats
      ? await $fetch("/api/user/friends", { query: { status: "ACCEPTED" } })
      : [];

    const friend = friends.find((f: any) => f.friend?.name === game.friendName);
    if (!friend) {
      console.error("Ami non trouvé");
      return;
    }

    // Récupérer les données de comparaison
    const comparison = await $fetch(
      `/api/user/games/${game.id}/compare/${friend.friendId}`
    );

    comparisonData.value = comparison;
    comparisonDialog.value = true;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des données de comparaison:",
      error
    );
  }
};
</script>
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

/* Styles pour le scroll horizontal des notifications */
.notification-scroll-container {
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--v-theme-primary), 0.3) transparent;
}

.notification-scroll-container::-webkit-scrollbar {
  height: 8px;
}

.notification-scroll-container::-webkit-scrollbar-track {
  background: rgba(var(--v-theme-surface-variant), 0.1);
  border-radius: 4px;
}

.notification-scroll-container::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-primary), 0.3);
  border-radius: 4px;
}

.notification-scroll-container::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-theme-primary), 0.5);
}

.notification-scroll-content {
  display: flex;
  gap: 16px;
  padding-bottom: 8px;
  min-width: min-content;
}

.notification-card-item {
  flex: 0 0 320px;
  min-width: 320px;
  max-width: 320px;
}
</style>
