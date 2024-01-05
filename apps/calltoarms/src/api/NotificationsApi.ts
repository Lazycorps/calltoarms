import { MessageDTO } from "@/models/dto/MessageDTO";
import { useApi } from "./Axios";

export function useNotificationsApi() {
  const { api } = useApi();

  async function sendNotification(message: MessageDTO): Promise<any> {
    const response = await api.post("messaging/send", message);
    return response.data;
  }

  return { sendNotification };
}
