import { GameDTO } from "@/models/dto/GameDTO";
import { useApi } from "./AxiosApi";

export function useGamesApi() {
  const { api } = useApi();

  async function getGames(name: string): Promise<any> {
    const response = await api.get<GameDTO[]>("games/search", {
      params: { name },
    });
    return response.data;
  }

  return { getGames };
}
