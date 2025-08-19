<template>
  <v-card class="steam-connector">
    <v-card-title class="d-flex align-center">
      <v-icon color="primary" class="me-2">mdi-steam</v-icon>
      Connexion Steam
    </v-card-title>

    <v-card-text>
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

      <div class="d-flex flex-column align-center">
        <p class="text-body-1 mb-4 text-center">
          Connectez votre compte Steam de manière sécurisée via
          l'authentification officielle Steam.
        </p>

        <v-btn
          color="primary"
          size="large"
          :loading="loading"
          :disabled="loading"
          prepend-icon="mdi-steam"
          class="mb-4"
          @click="connectWithSteamOAuth"
        >
          Se connecter avec Steam
        </v-btn>
      </div>

      <v-divider class="my-6" />

      <div class="text-body-2 text-medium-emphasis">
        <v-icon size="small" class="me-1">mdi-information</v-icon>
        <strong>Authentification sécurisée :</strong>
        <ul class="mt-2 ms-4">
          <li>Connexion via l'authentification officielle Steam</li>
          <li>Aucun mot de passe ou Steam ID à saisir manuellement</li>
          <li>Vos identifiants restent sécurisés chez Steam</li>
          <li>Accès uniquement aux informations publiques de votre profil</li>
        </ul>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

// Props
interface Props {
  onSuccess?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  onSuccess: () => {},
});

// État local
const loading = ref(false);
const error = ref<string | null>(null);
const success = ref<string | null>(null);

// Méthodes
async function connectWithSteamOAuth() {
  try {
    loading.value = true;
    error.value = null;
    success.value = null;

    // Rediriger vers l'endpoint d'authentification Steam OAuth
    window.location.href = "/api/library/platforms/steam/auth";
  } catch (err) {
    console.error("Erreur lors de la connexion Steam OAuth:", err);
    error.value =
      "Impossible d'initier la connexion Steam. Veuillez réessayer.";
    loading.value = false;
  }
}

// Gérer les paramètres de retour (succès ou erreur)
onMounted(() => {
  const route = useRoute();

  if (route.query.steam_connected === "true") {
    success.value = "Compte Steam connecté avec succès !";
    props.onSuccess();

    // Nettoyer l'URL
    const router = useRouter();
    router.replace({ query: {} });
  } else if (route.query.steam_error) {
    error.value = decodeURIComponent(route.query.steam_error as string);

    // Nettoyer l'URL
    const router = useRouter();
    router.replace({ query: {} });
  }
});
</script>

<style scoped>
.steam-connector {
  max-width: 500px;
}

.steam-connector ul {
  padding-left: 1rem;
}

.steam-connector ul li {
  margin-bottom: 0.25rem;
}
</style>
