import Axios, { AxiosAdapter, AxiosResponse } from "axios";
import { Game } from "@/models/Game/game";
import { UserModule } from "@/store/modules/user";


export abstract class GamesLibraryApi {
  private static axios = Axios.create();

  static async addGame(gamesId: number, userTag: string): Promise<void>{
    await this.axios.post(`${process.env.VUE_APP_ApiUrl}/api/v1/user/user_games`, {game_id: gamesId, user_tag: userTag}, {headers: { Authorization: `Bearer ${UserModule.token}` }});
  }
  
  static async updateGame(gamesId: number, userTag: string): Promise<void>{
    await this.axios.put(`${process.env.VUE_APP_ApiUrl}/api/v1/user/user_games/${gamesId}`, { user_tag: userTag }, {headers: { Authorization: `Bearer ${UserModule.token}` }});
  }

  static async deleteGame(gamesId: number): Promise<void>{
    await this.axios.delete(`${process.env.VUE_APP_ApiUrl}/api/v1/user/user_games/${gamesId}`, {headers: { Authorization: `Bearer ${UserModule.token}` }});
  }
}