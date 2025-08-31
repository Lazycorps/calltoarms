<template>
  <v-container fluid class="pa-6">
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <!-- En-tête du profil -->
        <v-card class="mb-6" elevation="2">
          <v-card-text class="text-center pa-8">
            <v-avatar size="120" class="mb-4">
              <v-img :src="avatar || '/avatar_placeholder.png'" :alt="user?.name" />
            </v-avatar>
            <div class="d-flex align-center justify-center mb-2">
              <h1 class="text-h4 font-weight-bold mr-3">
                {{ user?.name || 'Profil utilisateur' }}
              </h1>
              <v-btn v-if="isFormReadonly" icon color="primary" variant="outlined" @click="toggleEdition">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
            </div>
            <p class="text-subtitle-1 text-medium-emphasis">
              Gérez vos informations de profil
            </p>
          </v-card-text>
        </v-card>

        <!-- Formulaire principal -->
        <v-card elevation="2">
          <v-card-title class="d-flex align-center pa-6">
            <v-icon class="mr-3" color="primary">mdi-account-circle</v-icon>
            <span class="text-h5">Informations personnelles</span>
            <v-spacer />
            <v-btn v-if="!isFormReadonly" color="success" variant="elevated" @click="saveProfile" class="ml-2">
              <v-icon left>mdi-content-save</v-icon>
              Sauvegarder
            </v-btn>
          </v-card-title>

          <v-divider />

          <v-card-text class="pa-6">
            <v-row>
              <v-col cols="12" md="3">                
                <v-text-field label="Pseudo" v-model="username" :disabled="isFormReadonly" :readonly="isFormReadonly"
                  :rules="[rules.required, rules.min, rules.max]" variant="outlined" prepend-inner-icon="mdi-account"
                  class="mb-4" color="primary" />
              </v-col>
            </v-row>

          </v-card-text>
        </v-card>

        <!-- Identifiants des plateformes -->
        <v-card class="mt-6" elevation="2">
          <v-card-title class="d-flex align-center pa-6">
            <v-icon class="mr-3" color="primary">mdi-gamepad-variant</v-icon>
            <span class="text-h5">Identifiants de plateformes gaming</span>
          </v-card-title>

          <v-divider />

          <v-card-text class="pa-6">
            <v-row>
              <v-col cols="12" md="3">
                <v-text-field label="Steam ID" variant="outlined" :disabled="isFormReadonly" :readonly="isFormReadonly"
                  v-model="steamID" prepend-inner-icon="mdi-steam" color="primary" hint="Votre identifiant Steam" persistent-hint />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field label="Riot ID" variant="outlined" :disabled="isFormReadonly" :readonly="isFormReadonly"
                  v-model="riotID" prepend-inner-icon="mdi-sword-cross" color="primary" hint="Format: Pseudo#TAG" persistent-hint />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field label="Epic Games" variant="outlined" :disabled="isFormReadonly" :readonly="isFormReadonly"
                  v-model="epicID" prepend-inner-icon="mdi-rocket-launch" color="primary" hint="Votre pseudo Epic Games"
                  persistent-hint />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field label="Battle.net" variant="outlined" :disabled="isFormReadonly" :readonly="isFormReadonly"
                  v-model="bnetID" prepend-inner-icon="mdi-alpha-b-circle-outline" color="primary" hint="Format: Pseudo#1234"
                  persistent-hint />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Actions supplémentaires -->
        <v-card v-if="!isFormReadonly" class="mt-6" elevation="2">
          <v-card-text class="pa-6">
            <div class="d-flex gap-4 flex-wrap">
              <v-btn color="error" class="mr-4" variant="outlined" @click="cancelEdition">
                <v-icon left>mdi-cancel</v-icon>
                Annuler
              </v-btn>
              <v-btn color="warning" variant="outlined" @click="resetForm">
                <v-icon left>mdi-refresh</v-icon>
                Réinitialiser
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useUserStore } from '~/stores/user';

const supabase = useSupabaseClient();
const router = useRouter();

const avatar = ref('');

const loading = ref(true);
const isFormReadonly = ref(true);
const username = ref("");
const email = ref("");
const userNameChanged = ref(false);

// Platform IDs
const steamID = ref("");
const riotID = ref("");
const epicID = ref("");
const bnetID = ref("");
const rules = {
  required: (v: string) => !!v || "Required.",
  min: (v: string) => v.length >= 4 || "Min 4 characters",
  max: (v: string) => v.length <= 16 || "Max 16 characters",
  email: (v: string) => /.+@.+\..+/.test(v) || "Must be a valid email",
  passwordComplexity: (v: string) =>
    /^(?=.*[A-ZÀ-ÖØ-Þ])(?=.*\d)[A-Za-zÀ-öø-ÿ\d~`!@#$%^&*()-_+={}|;:'",.<>?\\]{8,}$/.test(
      v
    ) || "Minimum eight characters, at least uppercase letter and one number:",
};
const loadingUpdateUser = ref(false);
onMounted(async () => {
  await fetchProfile();
});

const { user } = useUserStore();

function toggleEdition() {
  isFormReadonly.value = false;
}

function cancelEdition() {
  isFormReadonly.value = true;
}

function resetForm() {
  console.log('reset');
}

async function saveProfile() {
  try {
    loadingUpdateUser.value = true;
    
    const profileData = {
      username: username.value,
      steamID: steamID.value,
      riotID: riotID.value,
      epicID: epicID.value,
      bnetID: bnetID.value
    };

    await $fetch("/api/user/profile", {
      method: "POST",
      body: profileData
    });

    isFormReadonly.value = true;
  } catch (error) {
    console.error('Error saving profile:', error);
  } finally {
    loadingUpdateUser.value = false;
  }
}

async function fetchProfile() {
  try {
    loading.value = true;
    const userProfile = await $fetch("/api/user/profile");
    username.value = userProfile?.username ?? "";
    steamID.value = userProfile?.steamID ?? "";
    riotID.value = userProfile?.riotID ?? "";
    epicID.value = userProfile?.epicID ?? "";
    bnetID.value = userProfile?.bnetID ?? "";
  } finally {
    loading.value = false;
  }
}

async function updateUsername() {
  try {
    loadingUpdateUser.value = true;
    const userUpdated = await $fetch("/api/user/username", {
      method: "POST",
      body: {
        username: username.value,
      },
    });
    username.value = userUpdated?.name ?? "";
  } finally {
    loadingUpdateUser.value = false;
  }
}

async function signOut() {
  try {
    loading.value = true;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    router.push("/login");
  } finally {
    loading.value = false;
  }
}
</script>
