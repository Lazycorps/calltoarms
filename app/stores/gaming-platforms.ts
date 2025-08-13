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
} from "~~/shared/models/gamingPlatform";
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
      }>("/api/user/library/platforms");

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
      }>(`/api/user/library/platforms/${platform.toLowerCase()}/auth`, {
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
      }>(`/api/user/library/platforms/${platform.toLowerCase()}/sync`, {
        method: "POST",
        body: { accountId },
      });

      if (response.success) {
        // Recharger les plateformes pour mettre à jour les statistiques
        await loadPlatforms();
        return { success: true, data: response.games };
      }
    } catch (err: any) {
      console.error("Erreur lors de la synchronisation:", err);

      // Extraire les détails de l'erreur pour les retourner au composant
      let errorMessage = `Erreur lors de la synchronisation ${platform}`;
      let canRetry = true;

      if (err?.data?.statusMessage) {
        errorMessage = err.data.statusMessage;
      } else if (err?.statusMessage) {
        errorMessage = err.statusMessage;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      // Si l'erreur est liée à l'authentification PlayStation, nettoyer les credentials
      if (
        platform === "PLAYSTATION" &&
        err &&
        typeof err === "object" &&
        "status" in err &&
        err.status === 401
      ) {
        clearPlatformCredentials(platform);
        errorMessage = "Session PlayStation expirée. Veuillez vous reconnecter.";
        canRetry = false;
      }

      // Retourner les détails de l'erreur au lieu de stocker dans le store
      return { 
        success: false, 
        error: errorMessage, 
        platform,
        canRetry,
        statusCode: err?.status || err?.statusCode || 500
      };
    } finally {
      loading.value = false;
    }
  }

  async function loadAllGames(options?: {
    platform?: GamingPlatform;
    search?: string;
    sortBy?: "name" | "playtime" | "lastPlayed";
    sortOrder?: "asc" | "desc";
    limit?: number;
    offset?: number;
  }) {
    try {
      loading.value = true;
      error.value = null;

      const params = new URLSearchParams();
      if (options?.platform) params.append("platform", options.platform);
      if (options?.search) params.append("search", options.search);
      if (options?.sortBy) params.append("sortBy", options.sortBy);
      if (options?.sortOrder) params.append("sortOrder", options.sortOrder);
      if (options?.limit) params.append("limit", options.limit.toString());
      if (options?.offset) params.append("offset", options.offset.toString());

      const response = await $fetch<{
        success: boolean;
        data: PlatformGameWithAccount[];
        pagination: {
          total: number;
          limit: number;
          offset: number;
          hasMore: boolean;
        };
      }>(
        `/api/user/library${params.toString() ? `?${params.toString()}` : ""}`
      );

      if (response.success) {
        // Transformer les jeux pour s'assurer que _count existe
        const transformedGames = response.data.map((game) => ({
          ...game,
          _count: game._count || { achievements: 0 },
        }));

        if (options?.offset && options.offset > 0) {
          // Ajouter à la liste existante (pagination)
          allGames.value.push(...transformedGames);
        } else {
          // Remplacer la liste
          allGames.value = transformedGames;
        }
        return {
          ...response,
          games: transformedGames,
        };
      }
    } catch (err) {
      console.error("Erreur lors du chargement des jeux:", err);
      error.value = "Impossible de charger les jeux";
      throw err;
    } finally {
      loading.value = false;
    }
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
            ...result
          };
        } catch (error) {
          return {
            platform: account.platform,
            accountId: account.id,
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue"
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
          platform: platform.platform,
          accountId: platform.id,
          success: false,
          error: result.reason?.message || "Erreur de synchronisation"
        };
      }
    });

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    return {
      success: successCount > 0,
      results,
      summary: {
        total: results.length,
        success: successCount,
        errors: errorCount
      }
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
