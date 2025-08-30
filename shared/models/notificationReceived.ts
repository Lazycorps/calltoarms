import type { NotificationDTO } from "./notification";

export type NotificationReceivedDTO = {
  notificationId: number;
  id: number;
  createdAt: Date;
  receiverId: string;
  read: boolean;
  notification: NotificationDTO;
};
