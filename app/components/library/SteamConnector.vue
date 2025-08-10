<template>
  <v-card class="steam-connector">
    <v-card-title class="d-flex align-center">
      <v-icon color="primary" class="me-2">mdi-steam</v-icon>
      Connexion Steam
    </v-card-title>

    <v-card-text>
      <v-form v-model="valid" @submit.prevent="connectSteam">
        <v-text-field
          v-model="steamId"
          label="Steam ID"
          placeholder="76561198000000000"
          hint="Votre Steam ID (17 chiffres)"
          persistent-hint
          :rules="steamIdRules"
          :loading="loading"
          :disabled="loading"
          prepend-inner-icon="mdi-account"
          variant="outlined"
          class="mb-4"
        />

        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          class="mb-4"
          closable
          @click:close="error = null"
        >
          {{ error }}
        </v-alert>

        <v-alert
          v-if="success"
          type="success"
          variant="tonal"
          class="mb-4"
          closable
          @click:close="success = null"
        >
          {{ success }}
        </v-alert>

        <div class="d-flex justify-end">
          <v-btn
            type="submit"
            color="primary"
            :loading="loading"
            :disabled="!valid || loading"
            prepend-icon="mdi-link"
          >
            Connecter Steam
          </v-btn>
        </div>
      </v-form>

      <v-divider class="my-6" />

      <div class="text-body-2 text-medium-emphasis">
        <v-icon size="small" class="me-1">mdi-information</v-icon>
        <strong>Comment trouver votre Steam ID :</strong>
        <ol class="mt-2 ms-4">
          <li>Ouvrez Steam et allez dans votre profil</li>
          <li>Cliquez sur "Modifier le profil"</li>
          <li>Dans l'URL personnalisée, vous verrez votre Steam ID</li>
          <li>Ou utilisez un site comme steamid.io pour le convertir</li>
        </ol>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useGamingPlatformsStore } from "~/stores/gaming-platforms";

// Props
interface Props {
  onSuccess?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  onSuccess: () => {},
});

// Store
const gamingPlatformsStore = useGamingPlatformsStore();

// État local
const valid = ref(false);
const steamId = ref("");
const loading = ref(false);
const error = ref<string | null>(null);
const success = ref<string | null>(null);

// Règles de validation
const steamIdRules = [
  (v: string) => !!v || "Steam ID requis",
  (v: string) =>
    /^\d{17}$/.test(v) || "Steam ID doit contenir exactement 17 chiffres",
];

// Méthodes
async function connectSteam() {
  if (!valid.value) return;

  try {
    loading.value = true;
    error.value = null;
    success.value = null;

    await gamingPlatformsStore.connectPlatform("STEAM", {
      steamId: steamId.value,
    });

    success.value = "Compte Steam connecté avec succès !";
    steamId.value = "";
    props.onSuccess();
  } catch (err) {
    console.error("Erreur lors de la connexion Steam:", err);
    error.value =
      "Impossible de connecter le compte Steam. Vérifiez votre Steam ID.";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.steam-connector {
  max-width: 500px;
}

.steam-connector ol {
  padding-left: 1rem;
}

.steam-connector ol li {
  margin-bottom: 0.25rem;
}
</style>
