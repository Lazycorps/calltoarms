import Axios, { AxiosAdapter, AxiosResponse } from "axios";
import { UserModule } from "@/store/modules/user";
import { UserRegister } from '@/models/User/UserRegister';
import { Notification } from "@/models/Notification/notification";

export abstract class NotificationApi {
  private static axios = Axios.create();

  static async sendNotification(notification: Notification, users?: string[]): Promise<string>{
    let response = await this.axios.post(`${process.env.VUE_APP_ApiUrl}/api/v1/user/notifications`, notification, {headers: { Authorization: `Bearer ${UserModule.token}` }});
    return response.headers['access-token'];
  }
}