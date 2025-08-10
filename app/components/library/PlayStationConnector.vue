<template>
  <VCard class="platform-connector">
    <VCardTitle class="d-flex align-center">
      <VIcon icon="mdi-sony-playstation" color="primary" class="me-2" />
      Connecter PlayStation Network
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
          <strong>Instructions pour obtenir votre token NPSSO :</strong>
          <ol class="mt-2">
            <li>
              Connectez-vous sur
              <a
                href="https://www.playstation.com/"
                target="_blank"
                rel="noopener"
                >playstation.com</a
              >
            </li>
            <li>
              Une fois connecté, visitez
              <a
                href="https://ca.account.sony.com/api/v1/ssocookie"
                target="_blank"
                rel="noopener"
                >cette page</a
              >
            </li>
            <li>Copiez la valeur du token NPSSO (64 caractères)</li>
            <li>Collez-le dans le champ ci-dessous</li>
          </ol>
        </div>
      </VAlert>

      <VForm ref="form" @submit.prevent="handleConnect">
        <VTextField
          v-model="credentials.username"
          label="Nom d'utilisateur PlayStation"
          placeholder="VotreNomUtilisateur"
          :rules="[rules.required]"
          :disabled="loading"
          class="mb-3"
        />

        <VTextField
          v-model="credentials.npsso"
          label="Token NPSSO"
          placeholder="Votre token NPSSO de 64 caractères"
          :rules="[rules.required, rules.npssoLength]"
          :disabled="loading"
          type="password"
          class="mb-4"
        />

        <VBtn
          type="submit"
          color="primary"
          :loading="loading"
          :disabled="!isFormValid"
          block
        >
          <VIcon icon="mdi-link" class="me-2" />
          Connecter PlayStation
        </VBtn>
      </VForm>
    </VCardText>
  </VCard>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { GamingPlatform } from "@prisma/client";
import { useLocalStorage } from "@vueuse/core";
import { useGamingPlatformsStore } from "~/stores/gaming-platforms";

interface PlayStationCredentials {
  username: string;
  npsso: string;
}

const emit = defineEmits<{
  connected: [platform: GamingPlatform];
  error: [message: string];
}>();

// Store
const gamingPlatformsStore = useGamingPlatformsStore();

const form = ref();
const loading = ref(false);
const error = ref<string | null>(null);

// Utilisation de useStorage pour sauvegarder les credentials dans le localStorage
const credentials = useLocalStorage<PlayStationCredentials>(
  "playstation-credentials",
  {
    username: "",
    npsso: "",
  }
);

const rules = {
  required: (value: string) => !!value || "Ce champ est requis",
  npssoLength: (value: string) =>
    value.length === 64 || "Le token NPSSO doit faire 64 caractères",
};

const isFormValid = computed(() => {
  return (
    credentials.value.username.length > 0 &&
    credentials.value.npsso.length === 64
  );
});

async function handleConnect() {
  if (!form.value) return;

  const { valid } = await form.value.validate();
  if (!valid) return;

  loading.value = true;
  error.value = null;

  try {
    await gamingPlatformsStore.connectPlatform("PLAYSTATION", {
      username: credentials.value.username,
      npsso: credentials.value.npsso,
    });

    emit("connected", "PLAYSTATION");
    // Ne pas réinitialiser les credentials pour permettre la réutilisation
    // Les credentials restent dans le localStorage pour la synchronisation
  } catch (err) {
    console.error("Erreur lors de la connexion PlayStation:", err);
    error.value = "Impossible de se connecter à PlayStation Network";
    emit("error", error.value);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.platform-connector {
  max-width: 500px;
}

.platform-connector ol {
  padding-left: 1.2rem;
}

.platform-connector ol li {
  margin-bottom: 0.5rem;
}
</style>
