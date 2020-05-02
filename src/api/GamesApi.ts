import Axios, { AxiosAdapter, AxiosResponse } from "axios";
import { UserModule } from "@/store/modules/user";
import { UserRegister } from '@/models/User/UserRegister';
import { GameCrud } from "@/models/Game/gameCrud";
import { Game } from "@/models/Game/game";


export abstract class GamesApi {
  private static axios = Axios.create();

  static async fetchGames(): Promise<Game[]>{
    let response = await this.axios.get<Game[]>(`${process.env.VUE_APP_ApiUrl}/api/v1/games`);
    return response.data.map(d => new Game(d));
  }

  static async fetchGamesCrud(): Promise<GameCrud[]>{
    let response = await this.axios.get<GameCrud[]>(`${process.env.VUE_APP_ApiUrl}/api/v1/games`);
    return response.data.map(d => new GameCrud(d));
  }

  static async getGame(id: string): Promise<GameCrud>{
    let response = await this.axios.get<GameCrud>(`${process.env.VUE_APP_ApiUrl}/api/v1/games/${id}`);
    return new GameCrud(response.data);
  }

  static async addGame(game: GameCrud): Promise<GameCrud>{
    let response = await this.axios.post<GameCrud>(`${process.env.VUE_APP_ApiUrl}/api/v1/games`, game, {headers: { Authorization: `Bearer ${UserModule.token}` }});
    return response.data;
  }

  static async updateGame(game: GameCrud, id: number): Promise<GameCrud>{
    let response = await this.axios.put(`${process.env.VUE_APP_ApiUrl}/api/v1/games/${id}`, game, {headers: { Authorization: `Bearer ${UserModule.token}` }});
    return new GameCrud(response.data);
  }

  static async deleteGame(id: number): Promise<GameCrud>{
    let response = await this.axios.delete(`${process.env.VUE_APP_ApiUrl}/api/v1/games/${id}`, {headers: { Authorization: `Bearer ${UserModule.token}` }});
    return new GameCrud(response.data);
  }
}