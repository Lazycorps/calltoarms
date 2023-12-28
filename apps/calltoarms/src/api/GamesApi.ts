import { GameDTO } from "@/models/GameDTO";
import axios from "axios";
import { getAuth } from "firebase/auth";

export abstract class GamesApi {
  static async getGames(): Promise<any> {
    const auth = getAuth();
    const idToken = await auth.currentUser?.getIdToken();
    const api = axios.create({
      baseURL: import.meta.env.VITE_CallToArmsApi,
    });
    const response = await api.get<GameDTO[]>("");
    return response.data;
  }
}
