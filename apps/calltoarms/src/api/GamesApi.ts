import { GameDTO } from "@/models/GameDTO";
import axios from "axios";

export abstract class GamesApi {
  static async getGames(name: string): Promise<any> {
    const api = axios.create({
      baseURL: import.meta.env.VITE_CallToArmsApi,
    });
    const response = await api.get<GameDTO[]>("games/search", {
      params: { name },
    });
    return response.data;
  }
}
