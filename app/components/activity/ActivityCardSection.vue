<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon class="me-2">{{ icon }}</v-icon>
      {{ title }}
      <v-spacer />
      <v-chip v-if="itemLabel && !loading" size="small" variant="tonal">
        {{ itemCount }} {{ itemCount <= 1 ? itemLabel : itemLabelPlural }}
      </v-chip>
      <v-progress-circular v-if="loading" indeterminate size="20" width="2" />
    </v-card-title>

    <v-card-text>
      <!-- Loading state -->
      <template v-if="loading">
        <div class="d-flex flex-wrap ga-3">
          <v-skeleton-loader
            v-for="n in 3"
            :key="n"
            type="card"
            :style="`min-width: 280px; max-width: 350px; flex-grow: 1;`"
          />
        </div>
      </template>

      <!-- Content grid -->
      <div v-else-if="itemCount > 0" class="d-flex flex-wrap ga-3">
        <slot />
      </div>

      <!-- Empty state -->
      <v-alert v-else variant="tonal" type="info" class="text-center">
        <div class="d-flex flex-column align-center">
          <v-icon size="48" class="mb-2" color="info">{{ icon }}</v-icon>
          <div>{{ emptyMessage }}</div>
        </div>
      </v-alert>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
interface Props {
  title: string;
  icon: string;
  itemCount?: number;
  emptyMessage?: string;
  itemLabel?: string;
  itemLabelPlural?: string;
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  emptyMessage: "Aucun élément trouvé",
  itemCount: undefined,
  itemLabel: undefined,
  itemLabelPlural: "éléments",
  cardMinWidth: "280px",
  cardMaxWidth: "350px",
  loading: false,
});
</script>

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
