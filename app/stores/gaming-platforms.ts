/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type {
  GamingPlatform,
  PlatformAccount,
  PlatformGame,
} from "@prisma/client";
import type {
  PlatformGameWithAccount,
  PlatformStats,
} from "~~/shared/types/gamingPlatform";
import type { PlatformAccountDTO } from "~~/shared/types/library";

export const useGamingPlatformsStore = defineStore("gaming-platforms", () => {
  // État
  const connectedPlatforms = ref<PlatformAccountDTO[]>([]);
  const supportedPlatforms = ref<GamingPlatform[]>([]);
  const allGames = ref<PlatformGameWithAccount[]>([]);
  const stats = ref<PlatformStats>({
    totalConnectedPlatforms: 0,
    totalGames: 0,
    totalPlaytime: 0,
    totalAchievements: 0,
    totalFinishedGames: 0,
  });
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Helper pour mapper les noms de plateformes aux URLs d'API
  function getPlatformUrlSegment(platform: GamingPlatform): string {
    const mapping: Record<GamingPlatform, string> = {
      STEAM: "steam",
      PLAYSTATION: "playstation",
      XBOX: "xbox",
      NINTENDO: "nintendo",
      GOG: "gog",
      RIOT: "riot",
    };
    return mapping[platform] || platform.toLowerCase();
  }

  // Computed
  const gamesByPlatform = computed(() => {
    const grouped: Record<GamingPlatform, PlatformGameWithAccount[]> =
      {} as Record<GamingPlatform, PlatformGameWithAccount[]>;

    allGames.value.forEach((game) => {
      const platform = game.platformAccount.platform;
      if (!grouped[platform]) {
        grouped[platform] = [];
      }
      grouped[platform].push(game);
    });

    return grouped;
  });

  // Computed pour le temps total (utilise maintenant les stats du backend)
  const totalPlaytime = computed(() => {
    return stats.value.totalPlaytime;
  });

  // Actions
  async function loadPlatforms() {
    try {
      loading.value = true;
      error.value = null;

      const response = await $fetch<{
        connectedPlatforms: PlatformAccountDTO[];
        supportedPlatforms: GamingPlatform[];
        stats: PlatformStats;
      }>("/api/library/platforms");

      connectedPlatforms.value = response.connectedPlatforms;
      supportedPlatforms.value = response.supportedPlatforms;
      stats.value = response.stats;
    } catch (err) {
      console.error("Erreur lors du chargement des plateformes:", err);
      error.value = "Impossible de charger les plateformes";
    } finally {
      loading.value = false;
    }
  }

  async function connectPlatform(
    platform: GamingPlatform,
    credentials: Record<string, string | number | boolean>
  ) {
    try {
      loading.value = true;
      error.value = null;

      const response = await $fetch<{
        success: boolean;
        account: PlatformAccount;
      }>(`/api/library/platforms/${getPlatformUrlSegment(platform)}/auth`, {
        method: "POST",
        body: credentials,
      });

      if (response.success) {
        // Recharger les plateformes pour mettre à jour la liste
        await loadPlatforms();
        return response.account;
      }
    } catch (err) {
      console.error("Erreur lors de la connexion à la plateforme:", err);
      error.value = "Impossible de se connecter à la plateforme";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function syncPlatform(accountId: number, platform: GamingPlatform) {
    try {
      loading.value = true;
      error.value = null;

      const response = await $fetch<{
        success: boolean;
        gamesCount: number;
        games: PlatformGame[];
      }>(`/api/library/platforms/${getPlatformUrlSegment(platform)}/sync`, {
        method: "POST",
        body: { accountId },
      });

      if (response.success) {
        // Recharger les plateformes pour mettre à jour les statistiques
        await loadPlatforms();
        return { success: true, data: response.games };
      }
    } catch (err) {
      console.error("Erreur lors de la synchronisation:", err);

      // Extraire les détails de l'erreur pour les retourner au composant
      let errorMessage = `Erreur lors de la synchronisation ${platform}`;
      let canRetry = true;

      const error = err as any;
      if (error?.data?.statusMessage) {
        errorMessage = error.data.statusMessage;
      } else if (error?.statusMessage) {
        errorMessage = error.statusMessage;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      // Si l'erreur est liée à l'authentification PlayStation, nettoyer les credentials
      if (
        platform === "PLAYSTATION" &&
        error &&
        typeof error === "object" &&
        "status" in error &&
        error.status === 401
      ) {
        clearPlatformCredentials(platform);
        errorMessage =
          "Session PlayStation expirée. Veuillez vous reconnecter.";
        canRetry = false;
      }

      // Retourner les détails de l'erreur au lieu de stocker dans le store
      return {
        success: false,
        error: errorMessage,
        platform,
        canRetry,
        statusCode: error?.status || error?.statusCode || 500,
      };
    } finally {
      loading.value = false;
    }
  }

  const libraryComposable = useLibrary({ autoLoad: false });

  async function loadAllGames(options?: {
    platform?: GamingPlatform;
    search?: string;
    sortBy?: "name" | "playtime" | "lastPlayed";
    sortOrder?: "asc" | "desc";
    limit?: number;
    offset?: number;
  }) {
    const response = await libraryComposable.loadGames(options, options?.offset ? options.offset > 0 : false);
    
    if (response?.success) {
      allGames.value = libraryComposable.games;
      return {
        ...response,
        games: response.data,
      };
    }
    
    return response;
  }

  // Garder l'ancienne méthode pour la compatibilité
  async function loadGames(options?: {
    platform?: GamingPlatform;
    accountId?: number;
    search?: string;
    sortBy?: "name" | "playtime" | "lastPlayed";
    sortOrder?: "asc" | "desc";
    limit?: number;
    offset?: number;
  }) {
    return loadAllGames(options);
  }

  function getGamesByPlatform(platform: GamingPlatform) {
    return gamesByPlatform.value[platform] || [];
  }

  function isPlatformConnected(platform: GamingPlatform) {
    return connectedPlatforms.value.some(
      (account) => account.platform === platform
    );
  }

  function clearPlatformCredentials(platform: GamingPlatform) {
    // Nettoyer les credentials stockés dans le localStorage
    if (platform === "PLAYSTATION") {
      localStorage.removeItem("playstation-credentials");
    }
  }

  function getPlatformAccount(platform: GamingPlatform) {
    return connectedPlatforms.value.find(
      (account) => account.platform === platform
    );
  }

  // Synchroniser toutes les plateformes connectées
  async function syncAllPlatforms() {
    if (connectedPlatforms.value.length === 0) {
      return { success: true, results: [] };
    }

    const syncResults = await Promise.allSettled(
      connectedPlatforms.value.map(async (account) => {
        try {
          const result = await syncPlatform(account.id, account.platform);
          return {
            platform: account.platform,
            accountId: account.id,
            ...result,
          };
        } catch (error) {
          return {
            platform: account.platform,
            accountId: account.id,
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue",
          };
        }
      })
    );

    const results = syncResults.map((result, index) => {
      const platform = connectedPlatforms.value[index];
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        return {
          platform: platform?.platform || ("UNKNOWN" as GamingPlatform),
          accountId: platform?.id || 0,
          success: false,
          error: result.reason?.message || "Erreur de synchronisation",
        };
      }
    });

    const successCount = results.filter((r) => r.success).length;
    const errorCount = results.filter((r) => !r.success).length;

    return {
      success: successCount > 0,
      results,
      summary: {
        total: results.length,
        success: successCount,
        errors: errorCount,
      },
    };
  }

  // Initialisation
  async function init() {
    await loadPlatforms();
    if (connectedPlatforms.value.length > 0) {
      await loadGames();
    }
  }

  // Initialisation avec synchronisation automatique
  async function initWithAutoSync() {
    await loadPlatforms();
    if (connectedPlatforms.value.length > 0) {
      // Lancer la synchronisation de toutes les plateformes en arrière-plan
      syncAllPlatforms().catch(console.error);
      await loadGames();
    }
  }

  return {
    // État
    connectedPlatforms,
    supportedPlatforms,
    allGames,
    stats,
    loading,
    error,

    // Computed
    gamesByPlatform,
    totalPlaytime,

    // Actions
    loadPlatforms,
    connectPlatform,
    syncPlatform,
    syncAllPlatforms,
    loadGames,
    loadAllGames,
    getGamesByPlatform,
    isPlatformConnected,
    getPlatformAccount,
    clearPlatformCredentials,
    init,
    initWithAutoSync,
  };
});
