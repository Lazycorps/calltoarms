import { ref, computed } from "vue";
import type { GamingPlatform } from "@prisma/client";
import type { PlatformGameWithAccount } from "~~/shared/types/gamingPlatform";

export interface LibraryFilters {
  platform?: GamingPlatform;
  search?: string;
  sortBy?: "name" | "playtime" | "lastPlayed";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export interface LibraryResponse {
  success: boolean;
  data: PlatformGameWithAccount[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface UseLibraryOptions {
  userId?: string;
  friendId?: string;
  accountId?: number;
  autoLoad?: boolean;
}

export function useLibrary(options: UseLibraryOptions = {}) {
  const { friendId, autoLoad = true } = options;

  const games = ref<PlatformGameWithAccount[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const pagination = ref({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  });

  const filters = ref<LibraryFilters>({
    limit: 20,
    offset: 0,
    sortBy: "name",
    sortOrder: "asc",
  });

  const isEmpty = computed(() => games.value.length === 0 && !loading.value);
  const canLoadMore = computed(
    () => pagination.value.hasMore && !loading.value
  );

  function buildApiUrl(): string {
    if (friendId) {
      return `/api/library/friend/${friendId}/searchGames`;
    } else {
      return "/api/library/searchGames";
    }
  }

  function buildQueryParams(currentFilters: LibraryFilters): URLSearchParams {
    const params = new URLSearchParams();

    if (currentFilters.platform)
      params.append("platform", currentFilters.platform);
    if (currentFilters.search) params.append("search", currentFilters.search);
    if (currentFilters.sortBy) params.append("sortBy", currentFilters.sortBy);
    if (currentFilters.sortOrder)
      params.append("sortOrder", currentFilters.sortOrder);
    if (currentFilters.limit)
      params.append("limit", currentFilters.limit.toString());
    if (currentFilters.offset)
      params.append("offset", currentFilters.offset.toString());

    return params;
  }

  async function loadGames(
    newFilters?: Partial<LibraryFilters>,
    append = false
  ): Promise<LibraryResponse | undefined> {
    try {
      loading.value = true;
      error.value = null;

      const currentFilters = { ...filters.value, ...newFilters };

      if (!append) {
        currentFilters.offset = 0;
        pagination.value.offset = 0;
      }

      filters.value = currentFilters;

      const baseUrl = buildApiUrl();
      const params = buildQueryParams(currentFilters);
      const url = params.toString()
        ? `${baseUrl}?${params.toString()}`
        : baseUrl;

      const response = await $fetch<LibraryResponse>(url);

      if (response.success) {
        const transformedGames = response.data.map((game) => ({
          ...game,
          _count: game._count || { achievements: 0 },
        }));

        if (append && currentFilters.offset && currentFilters.offset > 0) {
          games.value.push(...transformedGames);
        } else {
          games.value = transformedGames;
        }

        pagination.value = response.pagination;

        return {
          ...response,
          data: transformedGames,
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

  async function loadMore(): Promise<void> {
    if (!canLoadMore.value) return;

    const newOffset = pagination.value.offset + pagination.value.limit;
    await loadGames({ offset: newOffset }, true);
  }

  async function search(searchTerm: string): Promise<void> {
    await loadGames({ search: searchTerm, offset: 0 });
  }

  async function filterByPlatform(platform?: GamingPlatform): Promise<void> {
    await loadGames({ platform, offset: 0 });
  }

  async function sortGames(
    sortBy: "name" | "playtime" | "lastPlayed",
    sortOrder: "asc" | "desc" = "asc"
  ): Promise<void> {
    await loadGames({ sortBy, sortOrder, offset: 0 });
  }

  async function refresh(): Promise<void> {
    await loadGames({}, false);
  }

  function reset(): void {
    games.value = [];
    error.value = null;
    pagination.value = {
      total: 0,
      limit: 20,
      offset: 0,
      hasMore: false,
    };
    filters.value = {
      limit: 20,
      offset: 0,
      sortBy: "name",
      sortOrder: "asc",
    };
  }

  if (autoLoad) {
    loadGames();
  }

  return {
    games,
    loading,
    error,
    pagination,
    filters,
    isEmpty,
    canLoadMore,
    loadGames,
    loadMore,
    search,
    filterByPlatform,
    sortGames,
    refresh,
    reset,
  };
}
