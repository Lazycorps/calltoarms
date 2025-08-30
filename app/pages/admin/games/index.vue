<template>
  <div class="pa-4">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span class="text-h5">Maintenance des Jeux</span>
        <v-btn color="primary" @click="openCreateDialog">
          <v-icon left>mdi-plus</v-icon>
          Nouveau Jeu
        </v-btn>
      </v-card-title>

      <v-card-text>
        <!-- Barre de recherche -->
        <v-text-field
          v-model="search"
          label="Rechercher un jeu..."
          prepend-inner-icon="mdi-magnify"
          clearable
          class="mb-4"
        />

        <!-- Tableau des jeux -->
        <v-data-table
          :headers="headers"
          :items="games"
          :loading="loading"
          :search="search"
          :items-per-page="itemsPerPage"
          :page="currentPage"
          :server-items-length="totalItems"
          @update:page="handlePageChange"
          @update:items-per-page="handleItemsPerPageChange"
        >
          <template #[`item.imageUrl`]="{ item }">
            <v-avatar size="40" class="ma-1">
              <v-img
                v-if="item.imageUrl"
                :src="item.imageUrl"
                :alt="item.title"
              />
              <v-icon v-else>mdi-gamepad-variant</v-icon>
            </v-avatar>
          </template>

          <template #[`item.releaseDate`]="{ item }">
            <span v-if="item.releaseDate">
              {{ formatDate(item.releaseDate) }}
            </span>
            <span v-else class="text-grey">Non définie</span>
          </template>

          <template #[`item.notificationCount`]="{ item }">
            <v-chip
              :color="(item.notificationCount || 0) > 0 ? 'primary' : 'grey'"
              size="small"
            >
              {{ item.notificationCount || 0 }}
            </v-chip>
          </template>

          <template #[`item.actions`]="{ item }">
            <v-btn
              icon="mdi-pencil"
              size="small"
              variant="text"
              @click="editGame(item)"
            />
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              @click="confirmDelete(item)"
            />
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Dialog de création/édition -->
    <v-dialog v-model="dialog" max-width="600px" persistent>
      <v-card>
        <v-card-title>
          {{ isEditing ? "Modifier le jeu" : "Nouveau jeu" }}
        </v-card-title>
        <v-card-text>
          <v-form ref="form" v-model="formValid">
            <v-text-field
              v-model="gameForm.title"
              label="Titre *"
              :rules="titleRules"
              required
            />
            <v-textarea
              v-model="gameForm.description"
              label="Description"
              rows="3"
            />
            <v-text-field
              v-model="gameForm.releaseDate"
              label="Date de sortie"
              type="date"
            />
            <v-text-field
              v-model="gameForm.imageUrl"
              label="URL de l'image"
              :rules="urlRules"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="closeDialog">Annuler</v-btn>
          <v-btn
            color="primary"
            :disabled="!formValid"
            :loading="saving"
            @click="saveGame"
          >
            {{ isEditing ? "Modifier" : "Créer" }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de confirmation de suppression -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title>Confirmer la suppression</v-card-title>
        <v-card-text>
          Êtes-vous sûr de vouloir supprimer le jeu "{{ gameToDelete?.title }}"
          ?
          <div
            v-if="gameToDelete && (gameToDelete.notificationCount || 0) > 0"
            class="mt-2"
          >
            <v-alert type="warning" density="compact">
              Ce jeu a {{ gameToDelete.notificationCount || 0 }} notification(s)
              associée(s). La suppression sera impossible tant que ces
              notifications existent.
            </v-alert>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="deleteDialog = false">Annuler</v-btn>
          <v-btn color="error" :loading="deleting" @click="deleteGame">
            Supprimer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar pour les messages -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { watchDebounced } from "@vueuse/core";
import type {
  GameMaintenanceDTO,
  GameCreateDTO,
  GameUpdateDTO,
} from "~~/shared/types/admin/gameMaintenance";

// Données réactives
const games = ref<GameMaintenanceDTO[]>([]);
const loading = ref(false);
const search = ref("");
const currentPage = ref(1);
const itemsPerPage = ref(10);
const totalItems = ref(0);

// Dialog states
const dialog = ref(false);
const deleteDialog = ref(false);
const isEditing = ref(false);
const formValid = ref(false);
const saving = ref(false);
const deleting = ref(false);

// Form data
const gameForm = ref<{
  id?: number;
  title: string;
  description?: string;
  releaseDate?: string;
  imageUrl?: string;
}>({
  title: "",
  description: "",
  releaseDate: undefined,
  imageUrl: "",
});

const gameToDelete = ref<GameMaintenanceDTO | null>(null);

// Snackbar
const snackbar = ref({
  show: false,
  message: "",
  color: "success",
});

// Headers du tableau
const headers = [
  { title: "Image", key: "imageUrl", sortable: false },
  { title: "Titre", key: "title" },
  { title: "Description", key: "description" },
  { title: "Date de sortie", key: "releaseDate" },
  { title: "Notifications", key: "notificationCount" },
  { title: "Actions", key: "actions", sortable: false },
];

// Règles de validation
const titleRules = [
  (v: string) => !!v || "Le titre est obligatoire",
  (v: string) =>
    v.length <= 255 || "Le titre ne peut pas dépasser 255 caractères",
];

const urlRules = [
  (v: string) =>
    !v ||
    /^https?:\/\/.+/.test(v) ||
    "URL invalide (doit commencer par http:// ou https://)",
];

// Méthodes
const fetchGames = async () => {
  try {
    loading.value = true;
    const response = await $fetch<{
      games: GameMaintenanceDTO[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>("/api/admin/games", {
      params: {
        search: search.value,
        page: currentPage.value,
        limit: itemsPerPage.value,
      },
    });

    games.value = response.games;
    totalItems.value = response.pagination.total;
  } catch {
    showSnackbar("Erreur lors du chargement des jeux", "error");
  } finally {
    loading.value = false;
  }
};

const openCreateDialog = () => {
  isEditing.value = false;
  gameForm.value = {
    title: "",
    description: "",
    releaseDate: undefined,
    imageUrl: "",
  };
  dialog.value = true;
};

const editGame = (game: GameMaintenanceDTO) => {
  isEditing.value = true;
  gameForm.value = {
    id: game.id,
    title: game.title,
    description: game.description || "",
    releaseDate: game.releaseDate
      ? formatDateForInput(game.releaseDate)
      : undefined,
    imageUrl: game.imageUrl || "",
  };
  dialog.value = true;
};

const closeDialog = () => {
  dialog.value = false;
  gameForm.value = {
    title: "",
    description: "",
    releaseDate: undefined,
    imageUrl: "",
  };
};

const saveGame = async () => {
  try {
    saving.value = true;

    if (isEditing.value) {
      const updateData: GameUpdateDTO = {
        id: gameForm.value.id!,
        title: gameForm.value.title,
        description: gameForm.value.description || undefined,
        releaseDate: gameForm.value.releaseDate
          ? new Date(gameForm.value.releaseDate)
          : undefined,
        imageUrl: gameForm.value.imageUrl || undefined,
      };

      await $fetch(`/api/admin/games/${gameForm.value.id}`, {
        method: "PUT",
        body: updateData,
      });

      showSnackbar("Jeu modifié avec succès", "success");
    } else {
      const createData: GameCreateDTO = {
        title: gameForm.value.title,
        description: gameForm.value.description || undefined,
        releaseDate: gameForm.value.releaseDate
          ? new Date(gameForm.value.releaseDate)
          : undefined,
        imageUrl: gameForm.value.imageUrl || undefined,
      };

      await $fetch("/api/admin/games", {
        method: "POST",
        body: createData,
      });

      showSnackbar("Jeu créé avec succès", "success");
    }

    closeDialog();
    await fetchGames();
  } catch (error: unknown) {
    const errorMessage =
      error &&
      typeof error === "object" &&
      "data" in error &&
      error.data &&
      typeof error.data === "object" &&
      "message" in error.data
        ? String(error.data.message)
        : "Erreur lors de la sauvegarde";
    showSnackbar(errorMessage, "error");
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (game: GameMaintenanceDTO) => {
  gameToDelete.value = game;
  deleteDialog.value = true;
};

const deleteGame = async () => {
  if (!gameToDelete.value) return;

  try {
    deleting.value = true;
    await $fetch(`/api/admin/games/${gameToDelete.value.id}`, {
      method: "DELETE",
    });

    showSnackbar("Jeu supprimé avec succès", "success");
    deleteDialog.value = false;
    gameToDelete.value = null;
    await fetchGames();
  } catch (error: unknown) {
    const errorMessage =
      error &&
      typeof error === "object" &&
      "data" in error &&
      error.data &&
      typeof error.data === "object" &&
      "message" in error.data
        ? String(error.data.message)
        : "Erreur lors de la suppression";
    showSnackbar(errorMessage, "error");
  } finally {
    deleting.value = false;
  }
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  fetchGames();
};

const handleItemsPerPageChange = (items: number) => {
  itemsPerPage.value = items;
  currentPage.value = 1;
  fetchGames();
};

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString("fr-FR");
};

const formatDateForInput = (date: Date | string) => {
  return new Date(date).toISOString().split("T")[0];
};

const showSnackbar = (message: string, color: string = "success") => {
  snackbar.value = {
    show: true,
    message,
    color,
  };
};

// Watchers
watchDebounced(
  search,
  () => {
    currentPage.value = 1;
    fetchGames();
  },
  { debounce: 500 }
);

// Lifecycle
onMounted(() => {
  fetchGames();
});
</script>
