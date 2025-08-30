export interface FriendGameNotificationDTO {
  // Informations du jeu
  id: number;
  name: string;
  iconUrl?: string;
  coverUrl?: string;
  
  // Informations de l'ami
  senderName: string;
  friendName?: string;
  friendSlug?: string;
  
  // Informations de la notification
  notificationId: number;
  notificationTitle: string;
  notificationBody: string;
  sentAt: Date;
}