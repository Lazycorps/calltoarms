import { Friend } from '../Friend/friend';
import { Game } from '../Game/game';
import { NotificationReceived } from '../Notification/notificationReceived';

export class UtilisateurDTO {
  public id: number = 0;
  public email: string = '';
  public username: string = '';
  public friends: Friend[]= [];
  public followers: Friend[]= [];
  public games: Game[]= [];
  public notifications_received: NotificationReceived[]= [];
}

export class Utilisateur extends UtilisateurDTO {
  constructor(data?: UtilisateurDTO) {
    super();
    Object.assign(this, data || new UtilisateurDTO());
  }
}