<template>
  <VCard class="platform-connector">
    <VCardTitle class="d-flex align-center">
      <VIcon icon="mdi-microsoft-xbox" color="success" class="me-2" />
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
          <strong>Connexion sécurisée avec Microsoft :</strong>
          <ul class="mt-2">
            <li>Vous serez redirigé vers Microsoft pour vous connecter</li>
            <li>Aucun mot de passe n'est stocké sur notre serveur</li>
            <li>Authentification à deux facteurs supportée</li>
          </ul>
        </div>
      </VAlert>

      <VBtn
        color="success"
        size="large"
        block
        :loading="connecting"
        @click="handleConnect"
      >
        <VIcon icon="mdi-microsoft" class="me-2" />
        Se connecter avec Microsoft
      </VBtn>
    </VCardText>
  </VCard>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { GamingPlatform } from "@prisma/client";

const emit = defineEmits<{
  connected: [platform: GamingPlatform];
  error: [message: string];
}>();

const connecting = ref(false);
const error = ref<string | null>(null);

// Connecter le compte Xbox
function handleConnect() {
  connecting.value = true;
  error.value = null;

  // Rediriger vers l'endpoint d'authentification
  window.location.href = "/api/library/platforms/xbox/init";
}

// Vérifier si on revient de l'authentification
onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const xboxLinked = urlParams.get("xbox_linked");
  const status = urlParams.get("status");
  const errorParam = urlParams.get("error");

  if (xboxLinked === "true" && status === "success") {
    emit("connected", "XBOX");

    // Nettoyer l'URL
    window.history.replaceState({}, document.title, window.location.pathname);
  } else if (xboxLinked === "false" && errorParam) {
    error.value = decodeURIComponent(errorParam);
    emit("error", error.value);

    // Nettoyer l'URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  connecting.value = false;
});
</script>

<style scoped>
.platform-connector {
  max-width: 500px;
}

.platform-connector ul {
  padding-left: 1.2rem;
  margin-bottom: 0;
}

.platform-connector ul li {
  margin-bottom: 0.5rem;
}
</style>
