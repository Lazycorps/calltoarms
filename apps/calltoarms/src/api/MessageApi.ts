import { MessageDTO } from "@/models/MessageDTO";
import axios from "axios";

export abstract class MessageApi {
  static async sendNotification(message: MessageDTO): Promise<any> {
    const api = axios.create({
      baseURL: import.meta.env.VITE_CallToArmsApi,
    });
    const response = await api.post("messaging/send", message);
    return response.data;
  }
}
