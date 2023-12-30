import { GameDTO } from "@/models/GameDTO";
import { api } from "./Axios";

export abstract class GamesApi {
  static async getGames(name: string): Promise<any> {
    const response = await api.get<GameDTO[]>("games/search", {
      params: { name },
    });
    return response.data;
  }
}
