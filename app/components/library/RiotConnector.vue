<template>
  <v-card class="riot-connector">
    <v-card-title class="d-flex align-center">
      <v-icon color="primary" class="me-2">mdi-sword-cross</v-icon>
      Connexion Riot Games
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
          Connectez votre compte Riot Games pour synchroniser vos jeux 
          League of Legends, VALORANT, Teamfight Tactics et votre temps de jeu.
        </p>

        <v-form @submit.prevent="connectWithRiotId" class="w-100">
          <v-text-field
            v-model="riotId"
            label="Riot ID"
            placeholder="VotreNom#Tag"
            hint="Format requis: GameName#TagLine (ex: Player#NA1)"
            persistent-hint
            variant="outlined"
            class="mb-4"
            :disabled="loading"
            :error-messages="riotIdError"
            prepend-inner-icon="mdi-sword-cross"
          />
          
          <v-select
            v-model="selectedRegion"
            :items="regionOptions"
            label="Région"
            variant="outlined"
            class="mb-4"
            :disabled="loading"
            hint="Sélectionnez votre région principale"
            persistent-hint
          />

          <v-btn
            type="submit"
            color="primary"
            size="large"
            :loading="loading"
            :disabled="loading || !isValidRiotId"
            prepend-icon="mdi-sword-cross"
            class="w-100 mb-4"
          >
            Se connecter avec Riot Games
          </v-btn>
        </v-form>
      </div>

      <v-divider class="my-6" />

      <div class="text-body-2 text-medium-emphasis">
        <v-icon size="small" class="me-1">mdi-information</v-icon>
        <strong>Jeux supportés :</strong>
        <ul class="mt-2 ms-4">
          <li>League of Legends - Temps de jeu et historique des matchs</li>
          <li>VALORANT - Statistiques de jeu et temps de jeu</li>
          <li>Teamfight Tactics - Historique et temps de jeu</li>
          <li>Legends of Runeterra - Données de jeu (si disponibles)</li>
        </ul>
        
        <div class="mt-4">
          <v-icon size="small" class="me-1">mdi-shield-check</v-icon>
          <strong>Sécurité :</strong>
          <ul class="mt-2 ms-4">
            <li>Connexion via l'API officielle Riot Games</li>
            <li>Aucun mot de passe requis</li>
            <li>Accès uniquement aux données publiques de votre profil</li>
            <li>Synchronisation sécurisée des temps de jeu</li>
          </ul>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";

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
const riotId = ref("");
const selectedRegion = ref("americas");

// Options de région
const regionOptions = [
  { title: "Amériques (NA, BR, LAN, LAS)", value: "americas" },
  { title: "Asie (KR, JP, OCE, etc.)", value: "asia" },
  { title: "Europe (EUW, EUNE, TR, RU)", value: "europe" },
];

// Validation du Riot ID
const riotIdError = computed(() => {
  if (!riotId.value) return [];
  if (!/^.+#.+$/.test(riotId.value)) {
    return ["Format invalide. Utilisez: GameName#TagLine"];
  }
  return [];
});

const isValidRiotId = computed(() => {
  return riotId.value && /^.+#.+$/.test(riotId.value);
});

// Méthodes
async function connectWithRiotId() {
  try {
    loading.value = true;
    error.value = null;
    success.value = null;

    if (!isValidRiotId.value) {
      error.value = "Veuillez entrer un Riot ID valide au format GameName#TagLine";
      return;
    }

    // Appeler l'API d'authentification Riot
    const response = await $fetch("/api/library/platforms/riot/auth", {
      method: "POST",
      body: {
        riotId: riotId.value,
        region: selectedRegion.value,
      },
    });

    if (response.success) {
      success.value = response.message || "Compte Riot Games connecté avec succès !";
      props.onSuccess();
      
      // Réinitialiser le formulaire
      riotId.value = "";
      selectedRegion.value = "americas";
    } else {
      error.value = "Échec de la connexion au compte Riot Games";
    }
  } catch (err: any) {
    console.error("Erreur lors de la connexion Riot Games:", err);
    
    if (err.data?.message) {
      error.value = err.data.message;
    } else if (err.message) {
      error.value = err.message;
    } else {
      error.value = "Impossible de connecter le compte Riot Games. Vérifiez votre Riot ID et réessayez.";
    }
  } finally {
    loading.value = false;
  }
}

// Gérer les paramètres de retour (succès ou erreur)
onMounted(() => {
  const route = useRoute();

  if (route.query.riot_connected === "true") {
    success.value = "Compte Riot Games connecté avec succès !";
    props.onSuccess();

    // Nettoyer l'URL
    const router = useRouter();
    router.replace({ query: {} });
  } else if (route.query.riot_error) {
    error.value = decodeURIComponent(route.query.riot_error as string);

    // Nettoyer l'URL
    const router = useRouter();
    router.replace({ query: {} });
  }
});
</script>

<style scoped>
.riot-connector {
  max-width: 600px;
}

.riot-connector ul {
  padding-left: 1rem;
}

.riot-connector ul li {
  margin-bottom: 0.25rem;
}
</style>