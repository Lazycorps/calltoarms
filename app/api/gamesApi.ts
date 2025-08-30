import type { GameDTO } from "~~/shared/types/game";

export function useGamesApi() {
  async function getGames(name: string): Promise<GameDTO[]> {
    const response = await $fetch<GameDTO[]>("/api/games/search", {
      method: "get",
      params: { name },
    });

    return response;
  }

  return { getGames };
}
