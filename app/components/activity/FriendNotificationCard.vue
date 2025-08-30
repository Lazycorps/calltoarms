<template>
  <v-card
    class="friend-notification-card h-100"
    :style="{ minWidth, maxWidth }"
    hover
    @click="$emit('click')"
  >
    <!-- Image du jeu -->
    <div class="position-relative">
      <v-img
        :src="
          notification.coverUrl ||
          notification.iconUrl ||
          '/images/game-placeholder.png'
        "
        :alt="notification.name"
        height="160"
        cover
        class="game-cover"
      >
        <!-- Badge de plateforme (masqué pour les notifications) -->

        <!-- Indicateur de notification -->
        <div class="position-absolute notification-indicator">
          <v-chip color="primary" size="small">
            <v-icon icon="mdi-bell" start />
            Nouveau
          </v-chip>
        </div>
      </v-img>
    </div>

    <!-- Contenu de la carte -->
    <v-card-text class="pa-3">
      <!-- Nom du jeu -->
      <h3 class="text-subtitle-1 font-weight-bold text-truncate mb-2">
        {{ notification.name }}
      </h3>

      <!-- Informations de la notification -->
      <div class="notification-info mb-3">
        <div class="d-flex align-center mb-1">
          <v-avatar size="20" class="me-2">
            <v-icon icon="mdi-account" size="14" />
          </v-avatar>
          <span class="text-body-2 font-weight-medium">{{
            notification.senderName
          }}</span>
        </div>

        <p class="text-body-2 text-medium-emphasis mb-2 notification-body">
          {{ notification.notificationBody }}
        </p>

        <div class="d-flex align-center">
          <v-icon
            icon="mdi-clock-outline"
            size="14"
            class="me-1 text-medium-emphasis"
          />
          <span class="text-caption text-medium-emphasis">
            {{ formatDate(notification.sentAt) }}
          </span>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { FriendGameNotificationDTO } from "~~/shared/types/activity";

interface Props {
  notification: FriendGameNotificationDTO;
  minWidth?: string;
  maxWidth?: string;
}

defineProps<Props>();

defineEmits<{
  click: [];
}>();

const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes <= 1 ? "À l'instant" : `Il y a ${diffMinutes}m`;
    }
    return `Il y a ${diffHours}h`;
  } else if (diffDays === 1) {
    return "Hier";
  } else if (diffDays < 7) {
    return `Il y a ${diffDays}j`;
  } else {
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  }
};
</script>

<style scoped>
.friend-notification-card {
  cursor: pointer;
  transition: transform 0.2s ease-in-out;
  border: 2px solid transparent;
}

.friend-notification-card:hover {
  transform: translateY(-2px);
  border-color: rgb(var(--v-theme-primary));
}

.platform-badge {
  top: 8px;
  left: 8px;
}

.notification-indicator {
  top: 8px;
  right: 8px;
}

.game-cover {
  position: relative;
}

.notification-info {
  border-left: 3px solid rgb(var(--v-theme-primary));
  padding-left: 12px;
  background: rgba(var(--v-theme-primary), 0.05);
  border-radius: 4px;
  padding: 8px 12px;
}

.notification-body {
  font-style: italic;
  max-height: 40px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.game-stats {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  padding-top: 8px;
}
</style>
