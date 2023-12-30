import { MessageDTO } from "@/models/MessageDTO";
import { api } from "./Axios";

export abstract class MessageApi {
  static async sendNotification(message: MessageDTO): Promise<any> {
    const response = await api.post("messaging/send", message);
    return response.data;
  }
}
