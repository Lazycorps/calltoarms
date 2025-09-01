import type { NotificationReceivedDTO } from "./notificationReceived";

export type NotificationDTO = {
  id: number;
  createdAt: Date;
  title: string;
  body: string;
  senderId: string;
  gameId: number | null;
  gameCover: string | null;
  receiver: NotificationReceivedDTO;
};
