import Axios, { AxiosAdapter, AxiosResponse } from "axios";
import { UserModule } from "@/store/modules/user";
import { UserRegister } from '@/models/User/UserRegister';

export abstract class UserApi {
  private static axios = Axios.create();

  static async login(userInfo: { login: string, password: string }): Promise<string>{
    let response = await this.axios.post(`${process.env.VUE_APP_ApiUrl}/api/v1/users/sign_in`, userInfo);
    return response.headers['access-token'];;
  }

  static async register(userInfo: UserRegister): Promise<any>{
    await this.axios.post(`${process.env.VUE_APP_ApiUrl}/api/v1/users/sign_up`, userInfo);
  }

  static async getConnected(): Promise<any>{
    let response = await this.axios.get(`${process.env.VUE_APP_ApiUrl}/api/v1/user`, {headers: { Authorization: `Bearer ${UserModule.token}` }});
    return response.data;
  }
}