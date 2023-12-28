import { GameDTO } from "@/models/GameDTO";
import axios from "axios";

export abstract class GamesApi {
  static async getGames(search: string): Promise<any> {
    const api = axios.create({
      baseURL: import.meta.env.VITE_CallToArmsApi,
    });
    const response = await api.get<GameDTO[]>("", { params: { search } });
    return response.data;
  }
}
