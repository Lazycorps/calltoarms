import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type {
  GamingPlatform,
  PlatformAccount,
  PlatformGame,
} from "@prisma/client";

interface PlatformAccountWithStats extends PlatformAccount {
  _count: {
    games: number;
  };
}

interface PlatformGameWithAccount extends PlatformGame {
  platformAccount: {
    id: number;
    platform: GamingPlatform;
    username: string | null;
    displayName: string | null;
  };
  _count: {
    achievements: number;
  };
}

interface PlatformStats {
  totalConnectedPlatforms: number;
  totalGames: number;
  totalPlaytime: number;
  totalAchievements: number;
}

interface RecentGame {
  id: number;
  name: string;
  iconUrl: string | null;
  coverUrl: string | null;
  lastPlayed: Date | null;
  playtimeTotal: number;
  platformGameId: number;
  platform: GamingPlatform;
}

interface MostPlayedGame {
  id: number;
  name: string;
  iconUrl: string | null;
  coverUrl: string | null;
  playtimeTotal: number;
  achievementsCount: number;
  platformGameId: number;
  platform: GamingPlatform;
}

export const useGamingPlatformsStore = defineStore("gaming-platforms", () => {
  // État
  const connectedPlatforms = ref<PlatformAccountWithStats[]>([]);
  const supportedPlatforms = ref<GamingPlatform[]>([]);
  const allGames = ref<PlatformGameWithAccount[]>([]);
  const stats = ref<PlatformStats>({
    totalConnectedPlatforms: 0,
    totalGames: 0,
    totalPlaytime: 0,
    totalAchievements: 0,
  });
  const recentlyPlayedGames = ref<RecentGame[]>([]);
  const mostPlayedGames = ref<MostPlayedGame[]>([]);
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
        success: boolean;
        connectedPlatforms: PlatformAccountWithStats[];
        supportedPlatforms: GamingPlatform[];
        stats: PlatformStats;
        recentlyPlayedGames: RecentGame[];
        mostPlayedGames: MostPlayedGame[];
      }>("/api/platforms");

      if (response.success) {
        connectedPlatforms.value = response.connectedPlatforms;
        supportedPlatforms.value = response.supportedPlatforms;
        stats.value = response.stats;
        recentlyPlayedGames.value = response.recentlyPlayedGames;
        mostPlayedGames.value = response.mostPlayedGames;
      }
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
      }>(`/api/platforms/${platform.toLowerCase()}/auth`, {
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
      }>(`/api/platforms/${platform.toLowerCase()}/sync`, {
        method: "POST",
        body: { accountId },
      });

      if (response.success) {
        // Recharger les plateformes pour mettre à jour les statistiques
        await loadPlatforms();
        return response.games;
      }
    } catch (err: any) {
      console.error("Erreur lors de la synchronisation:", err);

      // Si l'erreur est liée à l'authentification PlayStation, nettoyer les credentials
      if (platform === "PLAYSTATION" && err?.status === 401) {
        clearPlatformCredentials(platform);
        error.value = "Session PlayStation expirée. Veuillez vous reconnecter.";
      } else {
        error.value = "Impossible de synchroniser la plateforme";
      }
      throw err;
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

      const url = `/api/platforms-games${
        params.toString() ? `?${params.toString()}` : ""
      }`;

      const response = await $fetch<{
        success: boolean;
        games: PlatformGameWithAccount[];
        pagination: {
          total: number;
          limit: number;
          offset: number;
          hasMore: boolean;
        };
        stats: {
          totalGames: number;
          totalPlaytime: number;
          recentlyPlayed: number;
          byPlatform: Record<
            GamingPlatform,
            { totalGames: number; totalPlaytime: number }
          >;
        };
      }>(url);

      if (response.success) {
        // Transformer les jeux pour s'assurer que _count existe
        const transformedGames = response.games.map((game) => ({
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

  // Initialisation
  async function init() {
    await loadPlatforms();
    if (connectedPlatforms.value.length > 0) {
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
    recentlyPlayedGames,
    mostPlayedGames,

    // Actions
    loadPlatforms,
    connectPlatform,
    syncPlatform,
    loadGames,
    loadAllGames,
    getGamesByPlatform,
    isPlatformConnected,
    getPlatformAccount,
    clearPlatformCredentials,
    init,
  };
});
