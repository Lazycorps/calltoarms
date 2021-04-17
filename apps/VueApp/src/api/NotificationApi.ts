import Axios from 'axios';
import { UserModule } from '@/store/modules/user';
import { Notification } from '@/models/Notification/notification';

export abstract class NotificationApi {
  private static axios = Axios.create();

  static async sendNotification(notification: Notification): Promise<string> {
    const response = await this.axios.post(`${process.env.VUE_APP_ApiUrl}/api/v1/user/notifications`, notification, {
      headers: { Authorization: `Bearer ${UserModule.token}` }
    });
    return response.headers['access-token'];
  }

  static async deleteNotification(id: number): Promise<void> {
    await this.axios.delete(`${process.env.VUE_APP_ApiUrl}/api/v1/user/notifications/${id}`, {
      headers: { Authorization: `Bearer ${UserModule.token}` }
    });
  }
}
