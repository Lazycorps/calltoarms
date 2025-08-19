<template>
  <v-card class="epic-connector">
    <v-card-title class="d-flex align-center">
      <v-icon color="primary" class="me-2">mdi-gamepad-variant</v-icon>
      Connexion Epic Games
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
          Connectez votre compte Epic Games de manière sécurisée via
          l'authentification officielle Epic Games.
        </p>

        <v-btn
          color="primary"
          size="large"
          :loading="loading"
          :disabled="loading"
          prepend-icon="mdi-gamepad-variant"
          class="mb-4"
          @click="connectWithEpicOAuth"
        >
          Se connecter avec Epic Games
        </v-btn>
      </div>

      <v-divider class="my-6" />

      <div class="text-body-2 text-medium-emphasis">
        <v-icon size="small" class="me-1">mdi-information</v-icon>
        <strong>Authentification sécurisée :</strong>
        <ul class="mt-2 ms-4">
          <li>Connexion via l'authentification officielle Epic Games</li>
          <li>Aucun mot de passe à saisir manuellement</li>
          <li>Vos identifiants restent sécurisés chez Epic Games</li>
          <li>
            Accès uniquement aux informations de votre bibliothèque de jeux
          </li>
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
async function connectWithEpicOAuth() {
  try {
    loading.value = true;
    error.value = null;
    success.value = null;

    // Rediriger vers l'endpoint d'authentification Epic Games OAuth
    window.location.href = "/api/library/platforms/epic/login";
  } catch (err) {
    console.error("Erreur lors de la connexion Epic Games OAuth:", err);
    error.value =
      "Impossible d'initier la connexion Epic Games. Veuillez réessayer.";
    loading.value = false;
  }
}

// Gérer les paramètres de retour (succès ou erreur)
onMounted(() => {
  const route = useRoute();

  if (route.query.epic_connected === "true") {
    success.value = "Compte Epic Games connecté avec succès !";
    props.onSuccess();

    // Nettoyer l'URL
    const router = useRouter();
    router.replace({ query: {} });
  } else if (route.query.epic_error) {
    error.value = decodeURIComponent(route.query.epic_error as string);

    // Nettoyer l'URL
    const router = useRouter();
    router.replace({ query: {} });
  }
});
</script>

<style scoped>
.epic-connector {
  max-width: 500px;
}

.epic-connector ul {
  padding-left: 1rem;
}

.epic-connector ul li {
  margin-bottom: 0.25rem;
}
</style>
