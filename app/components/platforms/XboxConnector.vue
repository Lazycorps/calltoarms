<template>
  <VCard class="platform-connector">
    <VCardTitle class="d-flex align-center">
      <VIcon icon="mdi-microsoft-xbox" color="primary" class="me-2" />
      Connecter Xbox Live
    </VCardTitle>

    <VCardText>
      <VAlert
        v-if="error"
        type="error"
        class="mb-4"
        closable
        @click:close="error = null"
      >
        {{ error }}
      </VAlert>

      <VAlert type="info" class="mb-4">
        <div class="text-body-2">
          <strong>Connexion Xbox Live :</strong>
          <ul class="mt-2">
            <li>Utilisez votre email et mot de passe Microsoft/Xbox Live</li>
            <li>
              <strong>Important, </strong> L'authentification à deux facteurs
              doit être désactivée temporairement.
            </li>
          </ul>
        </div>
      </VAlert>

      <VForm ref="form" @submit.prevent="handleConnect">
        <VTextField
          v-model="credentials.email"
          label="Email Microsoft/Xbox"
          placeholder="votre-email@example.com"
          :rules="[rules.required, rules.email]"
          :disabled="loading"
          type="email"
          class="mb-3"
        />

        <VTextField
          v-model="credentials.password"
          label="Mot de passe"
          placeholder="Votre mot de passe Xbox Live"
          :rules="[rules.required]"
          :disabled="loading"
          type="password"
          class="mb-4"
        />

        <div class="d-flex gap-2">
          <VBtn
            type="submit"
            color="primary"
            :loading="loading"
            :disabled="!isFormValid"
            class="flex-grow-1"
          >
            <VIcon icon="mdi-link" class="me-2" />
            Connecter Xbox
          </VBtn>

          <VTooltip
            v-if="storedCredentials.email"
            text="Effacer les identifiants sauvegardés"
          >
            <template #activator="{ props }">
              <VBtn
                v-bind="props"
                color="error"
                variant="outlined"
                :disabled="loading"
                @click="clearStoredCredentials"
              >
                <VIcon icon="mdi-delete" />
              </VBtn>
            </template>
          </VTooltip>
        </div>
      </VForm>
    </VCardText>
  </VCard>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useStorage } from "@vueuse/core";
import type { GamingPlatform } from "@prisma/client";

interface XboxCredentials {
  email: string;
  password: string;
}

const emit = defineEmits<{
  connected: [platform: GamingPlatform];
  error: [message: string];
}>();

const form = ref();
const loading = ref(false);
const error = ref<string | null>(null);

// Utiliser useStorage pour persister les identifiants Xbox
const storedCredentials = useStorage("xbox_credentials", {
  email: "",
});

const credentials = ref<XboxCredentials>({
  email: storedCredentials.value.email,
  password: "",
});

// Synchroniser les changements avec le localStorage
watch(
  () => credentials.value,
  (newCredentials) => {
    if (newCredentials.email && newCredentials.password) {
      storedCredentials.value = {
        email: newCredentials.email,
      };
    }
  },
  { deep: true }
);

const rules = {
  required: (value: string) => !!value || "Ce champ est requis",
  email: (value: string) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(value) || "Email invalide";
  },
};

const isFormValid = computed(() => {
  return (
    credentials.value.email.length > 0 &&
    credentials.value.password.length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.value.email)
  );
});

async function handleConnect() {
  if (!form.value) return;

  const { valid } = await form.value.validate();
  if (!valid) return;

  loading.value = true;
  error.value = null;

  try {
    const response = await $fetch<{
      success: boolean;
      account?: object;
      error?: string;
    }>("/api/platforms/xbox/auth", {
      method: "POST",
      body: {
        credentials: credentials.value,
      },
    });

    if (response.success) {
      // Sauvegarder les identifiants dans le localStorage lors d'une connexion réussie
      storedCredentials.value = {
        email: credentials.value.email,
      };
      emit("connected", "XBOX");
      // Ne pas réinitialiser le formulaire pour conserver les identifiants
    } else {
      error.value = response.error || "Erreur de connexion Xbox";
      emit("error", error.value);
    }
  } catch (err) {
    console.error("Erreur lors de la connexion Xbox:", err);
    error.value =
      "Impossible de se connecter à Xbox Live. Vérifiez vos identifiants.";
    emit("error", error.value);
  } finally {
    loading.value = false;
  }
}

function clearStoredCredentials() {
  storedCredentials.value = {
    email: "",
  };
  credentials.value = {
    email: "",
    password: "",
  };
  error.value = null;
}
</script>

<style scoped>
.platform-connector {
  max-width: 500px;
}

.platform-connector ul {
  padding-left: 1.2rem;
}

.platform-connector ul li {
  margin-bottom: 0.5rem;
}
</style>
